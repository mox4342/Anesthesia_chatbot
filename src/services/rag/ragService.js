// RAG Service for Medical Cases
import SimpleVectorStore from './simpleVectorStore.js';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MedicalRAGService {
  constructor(apiKey) {
    this.vectorStore = new SimpleVectorStore();
    this.apiKey = apiKey;
    this.embeddingCache = new Map();
    this.vectorStorePath = path.join(__dirname, '../../../vector_store.json');
  }

  // Generate embeddings using Claude API (we'll use text similarity for now)
  // In production, you'd use OpenAI's embedding API
  async generateEmbedding(text) {
    // Check cache first
    if (this.embeddingCache.has(text)) {
      return this.embeddingCache.get(text);
    }

    try {
      // If we have an OpenAI API key, use it
      if (process.env.VITE_OPENAI_API_KEY) {
        const response = await axios.post(
          'https://api.openai.com/v1/embeddings',
          {
            input: text,
            model: 'text-embedding-3-small'
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        const embedding = response.data.data[0].embedding;
        this.embeddingCache.set(text, embedding);
        return embedding;
      } else {
        // Fallback: Create a simple text-based embedding using TF-IDF style approach
        return this.createSimpleEmbedding(text);
      }
    } catch (error) {
      console.error('Error generating embedding:', error.message);
      // Fallback to simple embedding
      return this.createSimpleEmbedding(text);
    }
  }

  // Simple text-based embedding for fallback (when no OpenAI key)
  createSimpleEmbedding(text) {
    // Medical terms that are important for anesthesia cases
    const medicalTerms = [
      'intubation', 'extubation', 'hypotension', 'hypertension', 'bradycardia', 
      'tachycardia', 'bronchospasm', 'laryngospasm', 'aspiration', 'difficult airway',
      'propofol', 'sevoflurane', 'fentanyl', 'rocuronium', 'sugammadex', 
      'succinylcholine', 'midazolam', 'ketamine', 'dexmedetomidine', 'remifentanil',
      'spinal', 'epidural', 'general', 'regional', 'MAC', 'RSI', 'awake',
      'pediatric', 'obstetric', 'cardiac', 'neurosurgery', 'trauma', 'emergency',
      'complication', 'hemorrhage', 'transfusion', 'anaphylaxis', 'malignant hyperthermia',
      'PONV', 'pain', 'opioid', 'nerve block', 'catheter', 'arterial line', 'central line'
    ];

    // Create a vector based on presence and frequency of medical terms
    const textLower = text.toLowerCase();
    const embedding = medicalTerms.map(term => {
      const regex = new RegExp(term, 'gi');
      const matches = textLower.match(regex);
      return matches ? matches.length * 0.1 : 0;
    });

    // Add some randomness to make vectors more unique
    while (embedding.length < 384) {
      embedding.push(Math.random() * 0.01);
    }

    return embedding;
  }

  // Index a single clinical case
  async indexCase(caseData) {
    // Create searchable text from case
    const searchableText = this.createSearchableText(caseData);
    
    // Generate embedding
    const embedding = await this.generateEmbedding(searchableText);
    
    // Prepare metadata
    const metadata = {
      caseId: caseData.caseDate + '_' + caseData.procedure.name,
      caseDate: caseData.caseDate,
      procedure: caseData.procedure.name,
      specialty: caseData.procedure.specialty,
      patientAge: `${caseData.patient.age} ${caseData.patient.ageUnit}`,
      asa: caseData.patient.asa,
      technique: caseData.anesthetic.technique,
      complications: caseData.complications || [],
      clinicalPearls: caseData.clinicalPearls || [],
      keyTakeaways: caseData.keyTakeaways || [],
      searchableText: searchableText.substring(0, 1000) // Store first 1000 chars for context
    };

    // Add to vector store
    await this.vectorStore.addVectors([embedding], [metadata]);
  }

  // Create searchable text from case data
  createSearchableText(caseData) {
    const parts = [];
    
    // Patient info
    parts.push(`Patient: ${caseData.patient.age} ${caseData.patient.ageUnit} ${caseData.patient.sex}`);
    parts.push(`ASA ${caseData.patient.asa}`);
    
    if (caseData.patient.comorbidities?.length > 0) {
      parts.push(`Comorbidities: ${caseData.patient.comorbidities.join(', ')}`);
    }
    
    // Procedure
    parts.push(`Procedure: ${caseData.procedure.name}`);
    parts.push(`Specialty: ${caseData.procedure.specialty}`);
    parts.push(`Urgency: ${caseData.procedure.urgency}`);
    
    // Anesthetic
    parts.push(`Anesthetic technique: ${caseData.anesthetic.technique}`);
    parts.push(`Airway: ${caseData.anesthetic.airway}`);
    
    // Medications
    if (caseData.medications?.length > 0) {
      const meds = caseData.medications.map(m => `${m.name} ${m.dose}${m.unit}`).join(', ');
      parts.push(`Medications: ${meds}`);
    }
    
    // Complications
    if (caseData.complications?.length > 0) {
      caseData.complications.forEach(comp => {
        parts.push(`Complication: ${comp.event || comp.name || comp}`);
        if (comp.management) parts.push(`Management: ${comp.management}`);
        if (comp.outcome) parts.push(`Outcome: ${comp.outcome}`);
      });
    }
    
    // Clinical pearls and takeaways
    if (caseData.clinicalPearls?.length > 0) {
      parts.push(`Clinical Pearls: ${caseData.clinicalPearls.join('. ')}`);
    }
    
    if (caseData.keyTakeaways?.length > 0) {
      parts.push(`Key Takeaways: ${caseData.keyTakeaways.join('. ')}`);
    }
    
    return parts.join('\n');
  }

  // Index all cases from the JSON file
  async indexAllCases() {
    try {
      // Read the sample cases file
      const casesPath = path.join(__dirname, '../../../sample_cases.json');
      const casesData = await fs.readFile(casesPath, 'utf-8');
      const cases = JSON.parse(casesData);
      
      console.log(`📚 Indexing ${cases.length} clinical cases for RAG...`);
      
      // Index each case
      for (let i = 0; i < cases.length; i++) {
        await this.indexCase(cases[i]);
        if ((i + 1) % 10 === 0) {
          console.log(`  ✓ Indexed ${i + 1}/${cases.length} cases`);
        }
      }
      
      // Save vector store to disk
      await this.vectorStore.save(this.vectorStorePath);
      
      console.log(`✅ Successfully indexed all ${cases.length} cases!`);
      console.log('📊 Vector store stats:', this.vectorStore.getStats());
      
      return true;
    } catch (error) {
      console.error('❌ Error indexing cases:', error);
      return false;
    }
  }

  // Load existing vector store
  async loadVectorStore() {
    const loaded = await this.vectorStore.load(this.vectorStorePath);
    if (loaded) {
      console.log('✅ Loaded existing vector store');
      console.log('📊 Vector store stats:', this.vectorStore.getStats());
    }
    return loaded;
  }

  // Retrieve relevant cases for a query
  async retrieveRelevantCases(query, topK = 5) {
    // Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(query);
    
    // Search vector store
    const results = await this.vectorStore.search(queryEmbedding, topK);
    
    // Filter results with score threshold
    const relevantResults = results.filter(r => r.score > 0.3);
    
    console.log(`🔍 Found ${relevantResults.length} relevant cases for query: "${query}"`);
    
    return relevantResults.map(r => ({
      ...r.metadata,
      relevanceScore: r.score
    }));
  }

  // Format cases for inclusion in Claude prompt
  formatCasesForPrompt(cases) {
    if (!cases || cases.length === 0) return '';
    
    let prompt = '\n\n📋 RELEVANT CLINICAL CASES FROM YOUR DATABASE:\n\n';
    
    cases.forEach((caseData, index) => {
      prompt += `**Case ${index + 1}**: ${caseData.procedure} - ${caseData.patientAge} (ASA ${caseData.asa})\n`;
      prompt += `Technique: ${caseData.technique}\n`;
      
      if (caseData.complications?.length > 0) {
        prompt += `⚠️ Complications: ${JSON.stringify(caseData.complications)}\n`;
      }
      
      if (caseData.clinicalPearls?.length > 0) {
        prompt += `💡 Clinical Pearls: ${caseData.clinicalPearls.join('; ')}\n`;
      }
      
      if (caseData.keyTakeaways?.length > 0) {
        prompt += `🔑 Key Takeaways: ${caseData.keyTakeaways.join('; ')}\n`;
      }
      
      prompt += `Relevance Score: ${(caseData.relevanceScore * 100).toFixed(1)}%\n\n`;
    });
    
    prompt += '⚠️ Please reference these specific cases in your response when relevant.\n';
    
    return prompt;
  }
}

export default MedicalRAGService;