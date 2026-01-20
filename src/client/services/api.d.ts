import { User } from '../types';
declare class ApiService {
    getUsersWithLocation(): Promise<User[]>;
    getAllUsers(): Promise<User[]>;
    getUserByPrincipalName(principalName: string): Promise<User | null>;
    getUserById(id: string): Promise<User | null>;
    getDirectReports(userId: string): Promise<User[]>;
    getDirectReportsDetails(userId: string): Promise<any[]>;
    getManagementChain(principalName: string): Promise<User[]>;
    getOrgTree(principalName: string): Promise<any>;
    getDirectReportsTree(userId: string): Promise<any[]>;
    searchUsers(term: string): Promise<User[]>;
    getLocationStats(): Promise<any>;
    sendChatMessage(message: string, userPrincipalName?: string): Promise<string>;
}
export declare const apiService: ApiService;
export {};
//# sourceMappingURL=api.d.ts.map