import { SearchClient, AzureKeyCredential } from '@azure/search-documents';
import dotenv from 'dotenv';

dotenv.config();

const endpoint = process.env.AZURE_SEARCH_ENDPOINT || '';
const queryKey = process.env.AZURE_SEARCH_QUERY_KEY || '';
const adminKey = process.env.AZURE_SEARCH_ADMIN_KEY || '';

class AzureSearchService {
  private client: SearchClient<any> | null = null;
  private indexName = 'users-index';

  async initialize(): Promise<void> {
    try {
      this.client = new SearchClient(
        endpoint,
        this.indexName,
        new AzureKeyCredential(queryKey)
      );
      console.log('✅ Azure Search connection initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Azure Search:', error);
    }
  }

  async search(query: string, top: number = 10): Promise<any[]> {
    if (!this.client) {
      await this.initialize();
    }

    if (!this.client) {
      console.warn('Azure Search not available, returning empty results');
      return [];
    }

    try {
      const results: any[] = [];
      const searchResults = await this.client.search(query, {
        top,
        includeTotalCount: true
      });
      
      for await (const result of searchResults.results) {
        results.push(result.document);
      }

      return results;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  async semanticSearch(query: string): Promise<any[]> {
    return this.search(query, 10);
  }
}

export const searchService = new AzureSearchService();
