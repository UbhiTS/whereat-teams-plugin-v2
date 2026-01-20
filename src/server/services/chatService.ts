import { cosmosService } from './cosmosService';
import { searchService } from './searchService';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatContext {
  currentUser?: any;
  recentSearchResults?: any[];
}

class ChatService {
  private context: ChatContext = {};

  async processMessage(message: string, userPrincipalName?: string): Promise<string> {
    const lowerMessage = message.toLowerCase();
    
    // Set current user context
    if (userPrincipalName && !this.context.currentUser) {
      this.context.currentUser = await cosmosService.getUserByPrincipalName(userPrincipalName);
    }

    // Handle different types of questions
    if (this.isLocationQuestion(lowerMessage)) {
      return await this.handleLocationQuestion(message);
    }

    if (this.isTeamQuestion(lowerMessage)) {
      return await this.handleTeamQuestion(message);
    }

    if (this.isDirectReportsQuestion(lowerMessage)) {
      return await this.handleDirectReportsQuestion(message);
    }

    if (this.isManagerQuestion(lowerMessage)) {
      return await this.handleManagerQuestion(message);
    }

    if (this.isCountQuestion(lowerMessage)) {
      return await this.handleCountQuestion(message);
    }

    if (this.isTimeZoneQuestion(lowerMessage)) {
      return await this.handleTimeZoneQuestion(message);
    }

    // Default: try semantic search
    return await this.handleGeneralQuestion(message);
  }

  private isLocationQuestion(message: string): boolean {
    const keywords = ['where', 'location', 'located', 'city', 'country', 'office', 'based'];
    return keywords.some(keyword => message.includes(keyword));
  }

  private isTeamQuestion(message: string): boolean {
    const keywords = ['team', 'members', 'colleagues', 'coworkers'];
    return keywords.some(keyword => message.includes(keyword));
  }

  private isDirectReportsQuestion(message: string): boolean {
    const keywords = ['direct reports', 'reports to', 'reportees', 'subordinates', 'manages'];
    return keywords.some(keyword => message.includes(keyword));
  }

  private isManagerQuestion(message: string): boolean {
    const keywords = ['manager', 'management chain', 'supervisor', 'boss', 'reports to'];
    return keywords.some(keyword => message.includes(keyword));
  }

  private isCountQuestion(message: string): boolean {
    const keywords = ['how many', 'count', 'number of', 'total'];
    return keywords.some(keyword => message.includes(keyword));
  }

  private isTimeZoneQuestion(message: string): boolean {
    const keywords = ['time zone', 'timezone', 'overlap', 'working hours'];
    return keywords.some(keyword => message.includes(keyword));
  }

  private async handleLocationQuestion(message: string): Promise<string> {
    const lowerMessage = message.toLowerCase();
    
    // Extract location from message
    const cities = await this.extractCitiesFromMessage(lowerMessage);
    
    if (cities.length > 0) {
      const results: string[] = [];
      for (const city of cities) {
        const users = await cosmosService.getUsersByLocation(city);
        if (users.length > 0) {
          const names = users.map(u => u.displayName).join(', ');
          results.push(`**${city}**: ${users.length} team member(s) - ${names}`);
        }
      }
      if (results.length > 0) {
        return `Based on current data, here are the team members by location:\n\n${results.join('\n')}`;
      }
    }

    // General location stats
    const stats = await cosmosService.getLocationStats();
    const topCities = Object.entries(stats.byCity)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([city, count]) => `• ${city}: ${count} member(s)`)
      .join('\n');

    return `Here's an overview of team locations:\n\n**Total team members with location data**: ${stats.totalUsers}\n\n**Top locations**:\n${topCities}`;
  }

  private async extractCitiesFromMessage(message: string): Promise<string[]> {
    // Common cities to look for
    const knownCities = [
      'london', 'seattle', 'new york', 'san francisco', 'mountain view',
      'redmond', 'tokyo', 'singapore', 'sydney', 'berlin', 'paris',
      'mumbai', 'bangalore', 'dublin', 'vancouver', 'toronto'
    ];
    
    return knownCities.filter(city => message.includes(city));
  }

  private async handleTeamQuestion(message: string): Promise<string> {
    const users = await cosmosService.getUsersWithLocation();
    const byDepartment: Record<string, number> = {};
    
    for (const user of users) {
      const dept = user.jobTitle?.split(' ').pop() || 'Unknown';
      byDepartment[dept] = (byDepartment[dept] || 0) + 1;
    }

    const deptList = Object.entries(byDepartment)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([dept, count]) => `• ${dept}: ${count}`)
      .join('\n');

    return `Your organization has **${users.length}** team members.\n\n**By role**:\n${deptList}`;
  }

  private async handleDirectReportsQuestion(message: string): Promise<string> {
    if (!this.context.currentUser) {
      return "I couldn't identify the current user. Please make sure you're logged in.";
    }

    const directReports = await cosmosService.getDirectReports(this.context.currentUser.id);
    
    if (directReports.length === 0) {
      return `${this.context.currentUser.displayName} has no direct reports.`;
    }

    const reportsList = directReports
      .map(r => `• **${r.displayName}** - ${r.jobTitle} (${r.location?.city || 'Unknown location'})`)
      .join('\n');

    return `**${this.context.currentUser.displayName}** has **${directReports.length}** direct report(s):\n\n${reportsList}`;
  }

  private async handleManagerQuestion(message: string): Promise<string> {
    if (!this.context.currentUser) {
      return "I couldn't identify the current user. Please make sure you're logged in.";
    }

    const chain = await cosmosService.getManagementChain(this.context.currentUser.userPrincipalName);
    
    if (chain.length === 0) {
      return `No management chain found for ${this.context.currentUser.displayName}.`;
    }

    const chainList = chain
      .map((m, i) => `${i + 1}. **${m.displayName}** - ${m.jobTitle}`)
      .join('\n');

    return `**Management chain for ${this.context.currentUser.displayName}**:\n\n${chainList}`;
  }

  private async handleCountQuestion(message: string): Promise<string> {
    const lowerMessage = message.toLowerCase();
    
    // Check for specific location counts
    const cities = await this.extractCitiesFromMessage(lowerMessage);
    
    if (cities.length > 0) {
      const results: string[] = [];
      for (const city of cities) {
        const users = await cosmosService.getUsersByLocation(city);
        results.push(`There are **${users.length}** team member(s) in ${city.charAt(0).toUpperCase() + city.slice(1)}.`);
      }
      return results.join('\n');
    }

    // Check for engineer/role counts
    if (lowerMessage.includes('engineer')) {
      const users = await cosmosService.searchUsers('engineer');
      return `Based on current data, there are **${users.length}** engineer(s) in the organization.`;
    }

    // General count
    const stats = await cosmosService.getLocationStats();
    return `The organization has **${stats.totalUsers}** team members with location data across **${Object.keys(stats.byCountry).length}** countries.`;
  }

  private async handleTimeZoneQuestion(message: string): Promise<string> {
    // Simplified timezone overlap calculation
    const stats = await cosmosService.getLocationStats();
    
    const timezoneInfo = `
**Time Zone Overlap Analysis**

Based on team distribution:
${Object.entries(stats.byCountry).map(([country, count]) => `• ${country}: ${count} member(s)`).join('\n')}

For optimal meeting times, consider the overlap between major regions where your team is located.
    `.trim();

    return timezoneInfo;
  }

  private async handleGeneralQuestion(message: string): Promise<string> {
    // Try to search for relevant users
    const searchResults = await cosmosService.searchUsers(message);
    
    if (searchResults.length > 0) {
      const resultsList = searchResults
        .slice(0, 5)
        .map(u => `• **${u.displayName}** - ${u.jobTitle} (${u.location?.city || 'Unknown'})`)
        .join('\n');

      return `I found the following related team members:\n\n${resultsList}`;
    }

    return "I'm not sure how to answer that question. Try asking about:\n• Team locations (e.g., 'How many engineers are in London?')\n• Direct reports (e.g., 'Show me my direct reports')\n• Management chain (e.g., 'Who is my manager?')\n• Time zone overlap";
  }

  setCurrentUser(user: any): void {
    this.context.currentUser = user;
  }
}

export const chatService = new ChatService();
