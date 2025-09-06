#!/usr/bin/env node

// Script to initialize RAG vector store with all clinical cases
import MedicalRAGService from './src/services/rag/ragService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function initializeRAG() {
  console.log('🚀 Initializing Medical RAG System...\n');
  
  // Create RAG service instance
  const ragService = new MedicalRAGService(process.env.VITE_CLAUDE_API_KEY);
  
  // Try to load existing vector store
  const existingStore = await ragService.loadVectorStore();
  
  if (existingStore) {
    console.log('📊 Existing vector store found!');
    const stats = ragService.vectorStore.getStats();
    
    if (stats.totalVectors === 45) {
      console.log('✅ Vector store already contains all 45 cases');
      console.log('\nTo re-index, delete vector_store.json and run this script again.');
      return;
    }
  }
  
  // Index all cases
  console.log('📚 Starting case indexing process...\n');
  const success = await ragService.indexAllCases();
  
  if (success) {
    console.log('\n✨ RAG system initialized successfully!');
    console.log('📝 Vector store saved to: vector_store.json');
    console.log('\nYou can now use semantic search in your chat interface.');
    
    // Test with a sample query
    console.log('\n🧪 Testing with sample query...');
    const testQuery = 'difficult airway management in obstetric patient';
    const results = await ragService.retrieveRelevantCases(testQuery, 3);
    
    if (results.length > 0) {
      console.log(`\nTop relevant cases for "${testQuery}":`);
      results.forEach((result, i) => {
        console.log(`${i + 1}. ${result.procedure} - ${result.patientAge} (Score: ${(result.relevanceScore * 100).toFixed(1)}%)`);
      });
    }
  } else {
    console.error('\n❌ Failed to initialize RAG system');
    process.exit(1);
  }
}

// Run initialization
initializeRAG().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});