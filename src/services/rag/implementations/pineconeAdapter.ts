// Cloud Pinecone Implementation - Same interface!
import { Pinecone } from '@pinecone-database/pinecone';
import { VectorStore, VectorData, SearchResult } from '../vectorStore.interface';

export class PineconeVectorStore implements VectorStore {
  private client: Pinecone;
  private index: any;

  constructor(apiKey: string, environment: string) {
    this.client = new Pinecone({
      apiKey,
      environment
    });
  }

  async initialize(indexName: string) {
    // Check if index exists, create if not
    const indexes = await this.client.listIndexes();
    if (!indexes.includes(indexName)) {
      await this.client.createIndex({
        name: indexName,
        dimension: 1536, // OpenAI embedding dimension
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-west-2'
          }
        }
      });
    }
    this.index = this.client.index(indexName);
  }

  async upsert(vectors: VectorData[]): Promise<void> {
    const records = vectors.map(v => ({
      id: v.id,
      values: v.embedding,
      metadata: v.metadata
    }));

    // Pinecone accepts batches of 100
    for (let i = 0; i < records.length; i += 100) {
      const batch = records.slice(i, i + 100);
      await this.index.upsert(batch);
    }
  }

  async query(embedding: number[], topK: number): Promise<SearchResult[]> {
    const results = await this.index.query({
      vector: embedding,
      topK,
      includeMetadata: true
    });

    return results.matches.map((match: any) => ({
      id: match.id,
      score: match.score,
      metadata: match.metadata
    }));
  }

  async delete(ids: string[]): Promise<void> {
    await this.index.deleteMany(ids);
  }

  async clear(): Promise<void> {
    await this.index.deleteAll();
  }
}