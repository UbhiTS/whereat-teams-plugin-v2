declare class ChatService {
    private context;
    processMessage(message: string, userPrincipalName?: string): Promise<string>;
    private isLocationQuestion;
    private isTeamQuestion;
    private isDirectReportsQuestion;
    private isManagerQuestion;
    private isCountQuestion;
    private isTimeZoneQuestion;
    private handleLocationQuestion;
    private extractCitiesFromMessage;
    private handleTeamQuestion;
    private handleDirectReportsQuestion;
    private handleManagerQuestion;
    private handleCountQuestion;
    private handleTimeZoneQuestion;
    private handleGeneralQuestion;
    setCurrentUser(user: any): void;
}
export declare const chatService: ChatService;
export {};
//# sourceMappingURL=chatService.d.ts.map