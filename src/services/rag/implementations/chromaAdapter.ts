// Local ChromaDB Implementation
import { ChromaClient } from 'chromadb';
import { VectorStore, VectorData, SearchResult } from '../vectorStore.interface';

export class ChromaVectorStore implements VectorStore {
  private client: ChromaClient;
  private collection: any;

  constructor() {
    // Runs completely locally - no API keys needed
    this.client = new ChromaClient({
      path: "./chroma_db" // Local folder for storage
    });
  }

  async initialize() {
    // Create or get collection
    this.collection = await this.client.getOrCreateCollection({
      name: "medical_cases",
      metadata: { "hnsw:space": "cosine" }
    });
  }

  async upsert(vectors: VectorData[]): Promise<void> {
    await this.collection.upsert({
      ids: vectors.map(v => v.id),
      embeddings: vectors.map(v => v.embedding),
      metadatas: vectors.map(v => v.metadata),
      documents: vectors.map(v => v.metadata.content)
    });
  }

  async query(embedding: number[], topK: number): Promise<SearchResult[]> {
    const results = await this.collection.query({
      queryEmbeddings: [embedding],
      nResults: topK,
      include: ['metadatas', 'distances']
    });

    return results.ids[0].map((id: string, idx: number) => ({
      id,
      score: 1 - results.distances[0][idx], // Convert distance to similarity
      metadata: results.metadatas[0][idx]
    }));
  }

  async delete(ids: string[]): Promise<void> {
    await this.collection.delete({ ids });
  }

  async clear(): Promise<void> {
    await this.client.deleteCollection({ name: "medical_cases" });
    await this.initialize();
  }
}