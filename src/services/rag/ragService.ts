// Main RAG Service - Works with ANY vector store implementation
import { VectorStore, EmbeddingService } from './vectorStore.interface';
import { ChromaVectorStore } from './implementations/chromaAdapter';
import { PineconeVectorStore } from './implementations/pineconeAdapter';
import OpenAI from 'openai';

export class MedicalRAGService {
  private vectorStore: VectorStore;
  private embedder: EmbeddingService;
  
  constructor() {
    // Start with local ChromaDB
    this.vectorStore = this.initializeVectorStore();
    this.embedder = this.initializeEmbedder();
  }

  private initializeVectorStore(): VectorStore {
    const environment = process.env.VITE_ENVIRONMENT || 'local';
    
    // 🔄 EASY MIGRATION: Just change this condition!
    switch(environment) {
      case 'production':
        // When ready for cloud, just add API keys
        return new PineconeVectorStore(
          process.env.VITE_PINECONE_API_KEY!,
          process.env.VITE_PINECONE_ENVIRONMENT!
        );
      
      case 'staging':
        // Could use a different cloud provider for staging
        // return new WeaviateVectorStore(...);
        
      default:
        // Local development - no API keys needed!
        return new ChromaVectorStore();
    }
  }

  private initializeEmbedder(): EmbeddingService {
    // You can also swap embedding providers easily
    const openai = new OpenAI({
      apiKey: process.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: false // Use backend proxy in production
    });

    return {
      async embed(text: string): Promise<number[]> {
        const response = await openai.embeddings.create({
          model: "text-embedding-3-small", // Cheaper than ada-002, same quality
          input: text
        });
        return response.data[0].embedding;
      },

      async embedBatch(texts: string[]): Promise<number[][]> {
        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: texts
        });
        return response.data.map(d => d.embedding);
      }
    };
  }

  // 🎯 Your app code doesn't change when you migrate!
  async indexClinicalCase(caseData: any) {
    // Create searchable text from case
    const searchableText = `
      Patient: ${caseData.patient.age}yo ${caseData.patient.sex}
      Procedure: ${caseData.procedure.name}
      ASA: ${caseData.patient.asaClass}
      Complications: ${caseData.complications?.map((c: any) => c.event).join(', ') || 'none'}
      Management: ${caseData.complications?.[0]?.management || ''}
      Key Takeaways: ${caseData.keyTakeaways?.join('. ')}
      Clinical Pearls: ${caseData.clinicalPearls?.join('. ')}
    `;

    // Generate embedding
    const embedding = await this.embedder.embed(searchableText);

    // Store in vector DB (works with ANY implementation!)
    await this.vectorStore.upsert([{
      id: caseData.id,
      embedding,
      metadata: {
        type: 'case',
        content: searchableText,
        title: `${caseData.procedure.name} - ${caseData.patient.age}yo`,
        date: caseData.date,
        complications: caseData.complications?.map((c: any) => c.event),
        procedures: [caseData.procedure.name],
        medications: this.extractMedications(caseData)
      }
    }]);
  }

  async retrieveRelevantContext(query: string, topK: number = 5) {
    // Embed the query
    const queryEmbedding = await this.embedder.embed(query);
    
    // Search (works with ANY vector store!)
    const results = await this.vectorStore.query(queryEmbedding, topK);
    
    // Format for Claude
    return results.map(r => ({
      relevance: r.score,
      content: r.metadata.content,
      type: r.metadata.type,
      title: r.metadata.title
    }));
  }

  private extractMedications(caseData: any): string[] {
    // Extract medication names from case
    const meds: string[] = [];
    
    if (caseData.anesthesia?.induction) {
      Object.keys(caseData.anesthesia.induction).forEach(med => {
        if (caseData.anesthesia.induction[med]) meds.push(med);
      });
    }
    
    if (caseData.anesthesia?.maintenance) {
      Object.keys(caseData.anesthesia.maintenance).forEach(med => {
        if (caseData.anesthesia.maintenance[med]) meds.push(med);
      });
    }
    
    return meds;
  }
}

// Usage example:
/*
const ragService = new MedicalRAGService();

// Index your cases (same code for local or cloud!)
await ragService.indexClinicalCase(case1);

// Retrieve relevant context (same code for local or cloud!)
const context = await ragService.retrieveRelevantContext(
  "How to manage bronchospasm in asthmatic patient?"
);
*/