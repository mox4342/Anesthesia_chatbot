// Simple in-memory vector store for RAG implementation
// This uses cosine similarity for semantic search without external dependencies

export class SimpleVectorStore {
  constructor() {
    this.vectors = [];
    this.metadata = [];
  }

  // Calculate cosine similarity between two vectors
  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Add vectors with metadata
  async addVectors(embeddings, metadataList) {
    embeddings.forEach((embedding, index) => {
      this.vectors.push(embedding);
      this.metadata.push(metadataList[index]);
    });
  }

  // Search for similar vectors
  async search(queryEmbedding, topK = 5) {
    const similarities = this.vectors.map((vector, index) => ({
      score: this.cosineSimilarity(queryEmbedding, vector),
      metadata: this.metadata[index],
      index
    }));

    // Sort by similarity score (highest first)
    similarities.sort((a, b) => b.score - a.score);

    return similarities.slice(0, topK);
  }

  // Save to file for persistence
  async save(filename) {
    const fs = await import('fs').then(m => m.promises);
    await fs.writeFile(
      filename,
      JSON.stringify({
        vectors: this.vectors,
        metadata: this.metadata
      })
    );
  }

  // Load from file
  async load(filename) {
    const fs = await import('fs').then(m => m.promises);
    try {
      const data = await fs.readFile(filename, 'utf-8');
      const parsed = JSON.parse(data);
      this.vectors = parsed.vectors || [];
      this.metadata = parsed.metadata || [];
      return true;
    } catch (error) {
      console.log('No existing vector store found, starting fresh');
      return false;
    }
  }

  // Clear all vectors
  clear() {
    this.vectors = [];
    this.metadata = [];
  }

  // Get statistics
  getStats() {
    return {
      totalVectors: this.vectors.length,
      dimensions: this.vectors[0]?.length || 0,
      memoryUsage: JSON.stringify(this.vectors).length + JSON.stringify(this.metadata).length
    };
  }
}

export default SimpleVectorStore;