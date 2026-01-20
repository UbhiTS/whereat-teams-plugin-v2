import { CosmosClient, Container, Database } from '@azure/cosmos';
import dotenv from 'dotenv';

dotenv.config();

const endpoint = process.env.COSMOS_ENDPOINT || '';
const key = process.env.COSMOS_KEY || '';
const databaseId = process.env.COSMOS_DATABASE_ID || '';
const containerId = process.env.COSMOS_CONTAINER_ID || '';
const photosContainerId = process.env.COSMOS_PHOTOS_CONTAINER_ID || '';
const directReportsContainerId = process.env.COSMOS_DIRECT_REPORTS_CONTAINER_ID || '';
const managersContainerId = process.env.COSMOS_MANAGERS_CONTAINER_ID || '';

class CosmosService {
  private client: CosmosClient;
  private database: Database | null = null;
  private container: Container | null = null;
  private photosContainer: Container | null = null;
  private directReportsContainer: Container | null = null;
  private managersContainer: Container | null = null;

  constructor() {
    this.client = new CosmosClient({ endpoint, key });
  }

  async initialize(): Promise<void> {
    try {
      this.database = this.client.database(databaseId);
      this.container = this.database.container(containerId);
      this.photosContainer = this.database.container(photosContainerId);
      this.directReportsContainer = this.database.container(directReportsContainerId);
      this.managersContainer = this.database.container(managersContainerId);
      console.log('✅ CosmosDB connection initialized');
    } catch (error) {
      console.error('❌ Failed to initialize CosmosDB:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<any[]> {
    if (!this.container) await this.initialize();
    
    const querySpec = {
      query: 'SELECT * FROM c'
    };
    
    const { resources } = await this.container!.items.query(querySpec).fetchAll();
    return this.enrichUsersWithPhotos(resources);
  }

  async getUserByPrincipalName(userPrincipalName: string): Promise<any | null> {
    if (!this.container) await this.initialize();
    
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.userPrincipalName = @upn',
      parameters: [{ name: '@upn', value: userPrincipalName }]
    };
    
    const { resources } = await this.container!.items.query(querySpec).fetchAll();
    const user = resources[0] || null;
    return user ? this.enrichUserWithPhoto(user) : null;
  }

  async getUserById(id: string): Promise<any | null> {
    if (!this.container) await this.initialize();
    
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: id }]
    };
    
    const { resources } = await this.container!.items.query(querySpec).fetchAll();
    const user = resources[0] || null;
    return user ? this.enrichUserWithPhoto(user) : null;
  }

  async getUserPhoto(userPrincipalName: string): Promise<string | null> {
    if (!this.photosContainer) await this.initialize();
    
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.userPrincipalName = @upn',
      parameters: [{ name: '@upn', value: userPrincipalName }]
    };
    
    const { resources } = await this.photosContainer!.items.query(querySpec).fetchAll();
    const record = resources[0];
    
    return record?.photo || null;
  }

  async getUserPhotos(userPrincipalNames: string[]): Promise<Record<string, string>> {
    if (!this.photosContainer) await this.initialize();
    
    if (userPrincipalNames.length === 0) return {};
    
    // Build IN clause for batch query
    const paramNames = userPrincipalNames.map((_, i) => `@upn${i}`);
    const querySpec = {
      query: `SELECT c.userPrincipalName, c.photo FROM c WHERE c.userPrincipalName IN (${paramNames.join(', ')})`,
      parameters: userPrincipalNames.map((upn, i) => ({ name: `@upn${i}`, value: upn }))
    };
    
    const { resources } = await this.photosContainer!.items.query(querySpec).fetchAll();
    
    const photoMap: Record<string, string> = {};
    for (const record of resources) {
      if (record.photo) {
        photoMap[record.userPrincipalName] = record.photo;
      }
    }
    return photoMap;
  }

  // Helper method to enrich a single user with their photo
  async enrichUserWithPhoto(user: any): Promise<any> {
    if (!user) return user;
    const photo = await this.getUserPhoto(user.userPrincipalName);
    return { ...user, photo: photo || '' };
  }

  // Helper method to enrich multiple users with their photos
  async enrichUsersWithPhotos(users: any[]): Promise<any[]> {
    if (users.length === 0) return users;
    
    const upns = users.map(u => u.userPrincipalName).filter(Boolean);
    const photoMap = await this.getUserPhotos(upns);
    
    return users.map(user => ({
      ...user,
      photo: photoMap[user.userPrincipalName] || ''
    }));
  }

  async getDirectReports(userId: string): Promise<any[]> {
    if (!this.directReportsContainer) await this.initialize();
    
    // First get the user to find their userPrincipalName
    const user = await this.getUserById(userId);
    if (!user) return [];
    
    return this.getDirectReportsByPrincipalName(user.userPrincipalName);
  }

  // Get direct reports with full user data and hasDirectReports flag (non-recursive)
  async getDirectReportsWithDetails(userId: string): Promise<any[]> {
    if (!this.directReportsContainer) await this.initialize();
    
    // First get the user to find their userPrincipalName
    const user = await this.getUserById(userId);
    if (!user) return [];
    
    // Get the basic direct reports info
    const directReportsBasic = await this.getDirectReportsByPrincipalName(user.userPrincipalName);
    if (directReportsBasic.length === 0) return [];
    
    // Enrich each with full user data and check if they have their own direct reports
    const enrichedReports: any[] = [];
    for (const report of directReportsBasic) {
      const fullReport = await this.getUserByPrincipalName(report.userPrincipalName);
      if (fullReport) {
        // Check if this report has their own direct reports
        const reportsOwnReports = await this.getDirectReportsByPrincipalName(report.userPrincipalName);
        enrichedReports.push({
          ...fullReport,
          hasDirectReports: reportsOwnReports.length > 0,
          directReportCount: reportsOwnReports.length
        });
      }
    }
    
    // Sort alphabetically by displayName
    enrichedReports.sort((a, b) => 
      (a.displayName || '').localeCompare(b.displayName || '')
    );
    
    return enrichedReports;
  }

  async getDirectReportsByPrincipalName(userPrincipalName: string): Promise<any[]> {
    if (!this.directReportsContainer) await this.initialize();
    
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.userPrincipalName = @upn',
      parameters: [{ name: '@upn', value: userPrincipalName }]
    };
    
    const { resources } = await this.directReportsContainer!.items.query(querySpec).fetchAll();
    const record = resources[0];
    
    if (!record || !record.directReports || record.directReports.length === 0) {
      return [];
    }
    
    return record.directReports;
  }

  async getManagementChain(userPrincipalName: string): Promise<any[]> {
    if (!this.managersContainer) await this.initialize();
    
    // Get manager from user-managers container by userPrincipalName
    const getManagerRecord = async (upn: string): Promise<any | null> => {
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.userPrincipalName = @upn',
        parameters: [{ name: '@upn', value: upn }]
      };
      
      const { resources } = await this.managersContainer!.items.query(querySpec).fetchAll();
      return resources[0] || null;
    };

    const chain: any[] = [];
    let currentUpn = userPrincipalName;
    let iterations = 0;
    const maxIterations = 10; // Prevent infinite loops

    while (iterations < maxIterations) {
      const managerRecord = await getManagerRecord(currentUpn);
      if (!managerRecord || !managerRecord.manager) break;
      
      // Try to get full user data from users container
      const fullManager = await this.getUserByPrincipalName(managerRecord.manager.userPrincipalName);
      
      // If manager doesn't exist in users container, stop building the chain
      if (!fullManager) break;
      
      chain.push(fullManager);
      currentUpn = managerRecord.manager.userPrincipalName;
      iterations++;
    }

    return chain;
  }

  async getOrgTree(userPrincipalName: string): Promise<any> {
    if (!this.container) await this.initialize();
    
    // Get the current user
    const currentUser = await this.getUserByPrincipalName(userPrincipalName);
    if (!currentUser) return null;

    // Step 1: Get management chain using user-managers container (just managers, no direct reports)
    const managementChain = await this.getManagementChain(userPrincipalName);
    
    // Step 2: Get current user's direct reports count/flag
    const currentUserDirectReports = await this.getDirectReportsByPrincipalName(userPrincipalName);
    const currentUserWithReports = {
      ...currentUser,
      hasDirectReports: currentUserDirectReports.length > 0,
      directReportCount: currentUserDirectReports.length
    };

    // Step 3: Get peers (direct reports of the current user's direct manager)
    let peers: any[] = [];
    if (managementChain.length > 0) {
      const directManager = managementChain[0]; // First in chain is direct manager
      const managerDirectReports = await this.getDirectReportsByPrincipalName(directManager.userPrincipalName);
      
      // Get full user data for each peer and check if they have direct reports
      for (const report of managerDirectReports) {
        const fullPeer = await this.getUserByPrincipalName(report.userPrincipalName);
        if (fullPeer) {
          const peerDirectReports = await this.getDirectReportsByPrincipalName(report.userPrincipalName);
          peers.push({
            ...fullPeer,
            hasDirectReports: peerDirectReports.length > 0,
            directReportCount: peerDirectReports.length,
            isCurrentUser: fullPeer.id === currentUser.id
          });
        }
      }
      
      // Sort peers alphabetically
      peers.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
    }

    // Step 4: Build collapsed management chain (managers with hasDirectReports flag, but no actual reports loaded)
    const chainWithReportsFlag: any[] = [];
    for (const manager of managementChain) {
      const managerDirectReports = await this.getDirectReportsByPrincipalName(manager.userPrincipalName);
      chainWithReportsFlag.push({
        ...manager,
        hasDirectReports: managerDirectReports.length > 0,
        directReportCount: managerDirectReports.length
        // Note: directReportsData is NOT loaded here - it will be loaded on-demand when expanded
      });
    }

    return {
      managementChain: chainWithReportsFlag,
      currentUser: currentUserWithReports,
      peers: peers
    };
  }

  async getDirectReportsRecursive(userId: string, depth: number = 0): Promise<any[]> {
    if (!this.directReportsContainer) await this.initialize();
    if (depth > 3) return []; // Limit recursion
    
    const user = await this.getUserById(userId);
    if (!user) return [];

    // Get direct reports from the user-direct-reports container
    const directReportsRecord = await this.getDirectReportsByPrincipalName(user.userPrincipalName);
    if (directReportsRecord.length === 0) return [];

    const directReports: any[] = [];
    for (const report of directReportsRecord) {
      const fullReport = await this.getUserByPrincipalName(report.userPrincipalName);
      if (fullReport) {
        const nestedReports = await this.getDirectReportsRecursiveByPrincipalName(report.userPrincipalName, depth + 1);
        const reportsOwnReports = await this.getDirectReportsByPrincipalName(report.userPrincipalName);
        directReports.push({
          ...fullReport,
          directReportsData: nestedReports,
          hasDirectReports: nestedReports.length > 0 || reportsOwnReports.length > 0
        });
      }
    }
    return directReports;
  }

  async getDirectReportsRecursiveByPrincipalName(userPrincipalName: string, depth: number = 0): Promise<any[]> {
    if (!this.directReportsContainer) await this.initialize();
    if (depth > 3) return []; // Limit recursion
    
    // Get direct reports from the user-direct-reports container
    const directReportsRecord = await this.getDirectReportsByPrincipalName(userPrincipalName);
    if (directReportsRecord.length === 0) return [];

    const directReports: any[] = [];
    for (const report of directReportsRecord) {
      const fullReport = await this.getUserByPrincipalName(report.userPrincipalName);
      if (fullReport) {
        const nestedReports = await this.getDirectReportsRecursiveByPrincipalName(report.userPrincipalName, depth + 1);
        const reportsOwnReports = await this.getDirectReportsByPrincipalName(report.userPrincipalName);
        directReports.push({
          ...fullReport,
          directReportsData: nestedReports,
          hasDirectReports: nestedReports.length > 0 || reportsOwnReports.length > 0
        });
      }
    }
    return directReports;
  }

  async getUsersWithLocation(): Promise<any[]> {
    if (!this.container) await this.initialize();
    
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.location != null'
    };
    
    const { resources } = await this.container!.items.query(querySpec).fetchAll();
    return this.enrichUsersWithPhotos(resources);
  }

  async searchUsers(searchTerm: string): Promise<any[]> {
    if (!this.container) await this.initialize();
    
    const querySpec = {
      query: `
        SELECT * FROM c 
        WHERE CONTAINS(LOWER(c.displayName), LOWER(@term))
           OR CONTAINS(LOWER(c.userPrincipalName), LOWER(@term))
           OR CONTAINS(LOWER(c.jobTitle), LOWER(@term))
           OR CONTAINS(LOWER(c.location.city), LOWER(@term))
           OR CONTAINS(LOWER(c.location.countryOrRegion), LOWER(@term))
      `,
      parameters: [{ name: '@term', value: searchTerm }]
    };
    
    const { resources } = await this.container!.items.query(querySpec).fetchAll();
    return this.enrichUsersWithPhotos(resources);
  }

  async getUsersByLocation(city?: string, country?: string): Promise<any[]> {
    if (!this.container) await this.initialize();
    
    let query = 'SELECT * FROM c WHERE c.location != null';
    const parameters: any[] = [];
    
    if (city) {
      query += ' AND CONTAINS(LOWER(c.location.city), LOWER(@city))';
      parameters.push({ name: '@city', value: city });
    }
    
    if (country) {
      query += ' AND CONTAINS(LOWER(c.location.countryOrRegion), LOWER(@country))';
      parameters.push({ name: '@country', value: country });
    }
    
    const querySpec = { query, parameters };
    const { resources } = await this.container!.items.query(querySpec).fetchAll();
    return this.enrichUsersWithPhotos(resources);
  }

  async getLocationStats(): Promise<any> {
    if (!this.container) await this.initialize();
    
    const users = await this.getUsersWithLocation();
    
    const stats = {
      totalUsers: users.length,
      byCity: {} as Record<string, number>,
      byCountry: {} as Record<string, number>,
      byOffice: {} as Record<string, number>
    };
    
    for (const user of users) {
      if (user.location?.city) {
        stats.byCity[user.location.city] = (stats.byCity[user.location.city] || 0) + 1;
      }
      if (user.location?.countryOrRegion) {
        stats.byCountry[user.location.countryOrRegion] = (stats.byCountry[user.location.countryOrRegion] || 0) + 1;
      }
      if (user.officeLocation) {
        stats.byOffice[user.officeLocation] = (stats.byOffice[user.officeLocation] || 0) + 1;
      }
    }
    
    return stats;
  }
}

export const cosmosService = new CosmosService();
