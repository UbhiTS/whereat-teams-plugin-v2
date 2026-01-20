declare class CosmosService {
    private client;
    private database;
    private container;
    private photosContainer;
    private directReportsContainer;
    private managersContainer;
    constructor();
    initialize(): Promise<void>;
    getAllUsers(): Promise<any[]>;
    getUserByPrincipalName(userPrincipalName: string): Promise<any | null>;
    getUserById(id: string): Promise<any | null>;
    getUserPhoto(userPrincipalName: string): Promise<string | null>;
    getUserPhotos(userPrincipalNames: string[]): Promise<Record<string, string>>;
    enrichUserWithPhoto(user: any): Promise<any>;
    enrichUsersWithPhotos(users: any[]): Promise<any[]>;
    getDirectReports(userId: string): Promise<any[]>;
    getDirectReportsWithDetails(userId: string): Promise<any[]>;
    getDirectReportsByPrincipalName(userPrincipalName: string): Promise<any[]>;
    getManagementChain(userPrincipalName: string): Promise<any[]>;
    getOrgTree(userPrincipalName: string): Promise<any>;
    getDirectReportsRecursive(userId: string, depth?: number): Promise<any[]>;
    getDirectReportsRecursiveByPrincipalName(userPrincipalName: string, depth?: number): Promise<any[]>;
    getUsersWithLocation(): Promise<any[]>;
    searchUsers(searchTerm: string): Promise<any[]>;
    getUsersByLocation(city?: string, country?: string): Promise<any[]>;
    getLocationStats(): Promise<any>;
}
export declare const cosmosService: CosmosService;
export {};
//# sourceMappingURL=cosmosService.d.ts.map