declare class AzureSearchService {
    private client;
    private indexName;
    initialize(): Promise<void>;
    search(query: string, top?: number): Promise<any[]>;
    semanticSearch(query: string): Promise<any[]>;
}
export declare const searchService: AzureSearchService;
export {};
//# sourceMappingURL=searchService.d.ts.map