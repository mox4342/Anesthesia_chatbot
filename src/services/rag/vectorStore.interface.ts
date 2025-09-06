// Vector Store Interface - Abstraction layer for easy migration
export interface VectorStore {
  // Core operations that work across all vector databases
  upsert(vectors: VectorData[]): Promise<void>;
  query(embedding: number[], topK: number): Promise<SearchResult[]>;
  delete(ids: string[]): Promise<void>;
  clear(): Promise<void>;
}

export interface VectorData {
  id: string;
  embedding: number[];
  metadata: {
    type: 'case' | 'protocol' | 'guideline' | 'article';
    content: string;
    title?: string;
    date?: string;
    complications?: string[];
    procedures?: string[];
    medications?: string[];
    [key: string]: any;
  };
}

export interface SearchResult {
  id: string;
  score: number;
  metadata: VectorData['metadata'];
}

// Embedding Service Interface
export interface EmbeddingService {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}