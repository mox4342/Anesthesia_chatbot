import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import MedicalRAGService from './src/services/rag/ragService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize RAG service
const ragService = new MedicalRAGService(process.env.VITE_CLAUDE_API_KEY);
let ragInitialized = false;

// Load vector store on startup
ragService.loadVectorStore().then(loaded => {
  if (loaded) {
    ragInitialized = true;
    console.log('✅ RAG system loaded successfully');
  } else {
    console.log('⚠️  No vector store found. Run "node initializeRAG.js" to index cases.');
  }
});

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting - simple in-memory implementation
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 20; // 20 requests per minute

function checkRateLimit(ip) {
  const now = Date.now();
  const userRequests = requestCounts.get(ip) || [];
  
  // Filter out old requests
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS) {
    return false;
  }
  
  recentRequests.push(now);
  requestCounts.set(ip, recentRequests);
  return true;
}

// Claude API configuration
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_KEY = process.env.VITE_CLAUDE_API_KEY;

if (!CLAUDE_API_KEY || CLAUDE_API_KEY === 'your_claude_api_key_here') {
  console.warn('⚠️  Claude API key not configured. Chat functionality will be limited.');
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    apiConfigured: !!(CLAUDE_API_KEY && CLAUDE_API_KEY !== 'your_claude_api_key_here')
  });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  // Check rate limit
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded. Please wait a moment before sending another message.' 
    });
  }

  const { message, context, conversationHistory } = req.body;

  // Validate input
  if (!message || typeof message !== 'string' || message.length > 2000) {
    return res.status(400).json({ 
      error: 'Invalid message. Please provide a message under 2000 characters.' 
    });
  }

  // Check if API key is configured
  if (!CLAUDE_API_KEY || CLAUDE_API_KEY === 'your_claude_api_key_here') {
    return res.json({
      response: 'Claude API key not configured. Please add your API key to the .env.local file to enable AI chat functionality. For now, you can use the drug calculators, browse protocols, and search PubMed articles.',
      citations: []
    });
  }

  try {
    // Use RAG to find relevant cases if initialized
    let relevantCases = [];
    let ragCases = [];
    
    if (ragInitialized) {
      console.log('🔍 Using RAG to find relevant cases...');
      ragCases = await ragService.retrieveRelevantCases(message, 5);
      console.log(`📋 Found ${ragCases.length} relevant cases via RAG`);
    } else {
      // Fallback to old keyword-based search
      console.log('⚠️  RAG not initialized, using keyword search');
      let sampleCases = [];
      try {
        const casesPath = join(__dirname, 'sample_cases.json');
        const casesData = fs.readFileSync(casesPath, 'utf-8');
        sampleCases = JSON.parse(casesData);
      } catch (loadError) {
        console.error('Failed to load sample cases:', loadError.message);
      }
      relevantCases = findRelevantCases(message, sampleCases);
    }
    
    // Build system prompt with case-based knowledge
    let systemPrompt = `You are an AI Anesthesia Assistant with access to a database of real clinical cases, providing evidence-based information to healthcare professionals about anesthesia, perioperative medicine, and related clinical topics.

IMPORTANT GUIDELINES:
1. Always emphasize that your responses are for educational purposes only
2. Recommend consulting institutional protocols and primary literature
3. Cite relevant medical literature when possible
4. Be concise but thorough
5. Focus on current best practices and guidelines
6. Include drug dosing information when relevant, but always mention to verify with institutional formulary
7. For emergency situations, provide step-by-step protocols
8. Acknowledge uncertainty when appropriate

Remember: You are assisting trained medical professionals, not providing patient-specific medical advice.`;

    // Add relevant cases to system prompt (handle both RAG and fallback formats)
    if (ragCases.length > 0) {
      // Use RAG-formatted cases
      systemPrompt += ragService.formatCasesForPrompt(ragCases);
    } else if (relevantCases.length > 0) {
      // Use old format for fallback cases
      systemPrompt += `\n\n🚨 CRITICAL: YOU MUST REFERENCE THESE RELEVANT CLINICAL CASES IN YOUR RESPONSE:\n`;
      relevantCases.forEach((caseData, index) => {
        systemPrompt += `\n📋 Case ${index + 1}: ${caseData.procedure.name} - ${caseData.patient.age}yo ${caseData.patient.sex}\n`;
        if (caseData.complications?.length > 0) {
          systemPrompt += `⚠️ COMPLICATIONS: ${caseData.complications.map(c => c.event).join(', ')}\n`;
          systemPrompt += `MANAGEMENT: ${caseData.complications[0].management}\n`;
          systemPrompt += `OUTCOME: ${caseData.complications[0].outcome}\n`;
        }
        if (caseData.keyTakeaways) {
          systemPrompt += `🔑 KEY LESSONS: ${caseData.keyTakeaways.join('; ')}\n`;
        }
        if (caseData.clinicalPearls && caseData.clinicalPearls.length > 0) {
          systemPrompt += `💡 CLINICAL PEARLS: ${caseData.clinicalPearls.slice(0, 3).join('; ')}\n`;
        }
      });
      systemPrompt += `\n⚠️ IMPORTANT: You MUST mention these cases in your response and apply their lessons to the current query.\n`;
    }

    // Build enhanced message with context
    let enhancedMessage = message;
    if (context) {
      enhancedMessage = `Query: ${message}\n\nClinical Context:\n`;
      if (context.patientAge) enhancedMessage += `- Patient Age: ${context.patientAge}\n`;
      if (context.procedure) enhancedMessage += `- Procedure: ${context.procedure}\n`;
      if (context.comorbidities?.length) {
        enhancedMessage += `- Comorbidities: ${context.comorbidities.join(', ')}\n`;
      }
    }

    // Prepare messages for Claude
    const messages = [
      ...(conversationHistory || []),
      { role: 'user', content: enhancedMessage }
    ];

    // Make API call to Claude
    const response = await axios.post(
      CLAUDE_API_URL,
      {
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        temperature: 0.3,
        system: systemPrompt,
        messages: messages
      },
      {
        headers: {
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );

    const responseText = response.data.content[0]?.text || 'No response generated.';

    // For now, return empty citations - you can integrate PubMed search here later
    res.json({
      response: responseText,
      citations: []
    });

  } catch (error) {
    console.error('Claude API error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      res.status(401).json({ 
        error: 'Invalid API key. Please check your Claude API key in the .env.local file.' 
      });
    } else if (error.response?.status === 429) {
      res.status(429).json({ 
        error: 'Claude API rate limit exceeded. Please wait a moment before sending another message.' 
      });
    } else if (error.response?.status === 400) {
      res.status(400).json({ 
        error: 'Invalid request. Please try rephrasing your question.' 
      });
    } else {
      res.status(500).json({ 
        error: 'An error occurred while processing your request. Please try again later.' 
      });
    }
  }
});

// PubMed search endpoint (for citations)
app.post('/api/pubmed/search', async (req, res) => {
  const { query, retmax = 5 } = req.body;

  try {
    // Search PubMed
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${retmax}&retmode=json&sort=relevance`;
    const searchResponse = await axios.get(searchUrl);
    const pmids = searchResponse.data.esearchresult?.idlist || [];

    if (pmids.length === 0) {
      return res.json({ articles: [] });
    }

    // Fetch article summaries
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;
    const summaryResponse = await axios.get(summaryUrl);
    const articles = [];

    if (summaryResponse.data.result) {
      for (const pmid of pmids) {
        const article = summaryResponse.data.result[pmid];
        if (article) {
          articles.push({
            pmid,
            title: article.title || '',
            authors: article.authors?.map(a => a.name).slice(0, 3) || [],
            journal: article.source || '',
            pubDate: article.pubdate || '',
            url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
          });
        }
      }
    }

    res.json({ articles });
  } catch (error) {
    console.error('PubMed search error:', error);
    res.status(500).json({ error: 'Failed to search PubMed' });
  }
});

// Helper function to find relevant cases based on query
function findRelevantCases(query, cases) {
  if (!cases || cases.length === 0) return [];
  
  const queryLower = query.toLowerCase();
  
  // Score each case for relevance
  const scoredCases = cases.map(caseData => {
    let score = 0;
    
    // Critical incident boost (highest priority)
    if (caseData.outcome?.criticalIncident) score += 10;
    
    // Check for OSA-related queries - HIGHEST PRIORITY for safety
    if (queryLower.includes('osa') || queryLower.includes('sleep apnea') || queryLower.includes('obstructive sleep')) {
      if (JSON.stringify(caseData).toLowerCase().includes('osa')) {
        score += 15; // Increased priority
        // Extra points if also mentions spinal
        if (queryLower.includes('spinal') && caseData.anesthetic?.technique?.includes('regional')) {
          score += 20; // Critical match
        }
      }
    }
    
    // Check for cardiac arrest queries
    if (queryLower.includes('arrest') || queryLower.includes('code')) {
      if (caseData.complications?.some(c => c.event.toLowerCase().includes('arrest'))) score += 15;
    }
    
    // Check for spinal/epidural queries
    if (queryLower.includes('spinal') || queryLower.includes('epidural')) {
      if (caseData.anesthetic?.regionalDetails?.blockType?.toLowerCase().includes('spinal')) score += 5;
    }
    
    // Check for drug mentions
    const drugs = ['propofol', 'midazolam', 'fentanyl', 'rocuronium', 'sevoflurane'];
    drugs.forEach(drug => {
      if (queryLower.includes(drug) && JSON.stringify(caseData).toLowerCase().includes(drug)) {
        score += 3;
      }
    });
    
    // Check for procedure matches
    if (caseData.procedure?.name && queryLower.includes(caseData.procedure.name.toLowerCase())) {
      score += 4;
    }
    
    // Check for age-based queries
    if (queryLower.includes('pediatric') && caseData.patient?.age < 18) score += 3;
    if (queryLower.includes('elderly') && caseData.patient?.age > 65) score += 3;
    
    return { ...caseData, relevanceScore: score };
  });
  
  // Return top 3 most relevant cases
  return scoredCases
    .filter(c => c.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 3);
}

// Case-specific endpoints
app.get('/api/cases/all', (req, res) => {
  try {
    const casesPath = join(__dirname, 'sample_cases.json');
    const casesData = fs.readFileSync(casesPath, 'utf-8');
    const cases = JSON.parse(casesData);
    res.json({ cases, count: cases.length });
  } catch (error) {
    console.error('Error loading cases:', error);
    res.status(500).json({ error: 'Failed to load cases' });
  }
});

app.post('/api/cases/search', async (req, res) => {
  const { query, includeDetails } = req.body;
  
  try {
    // Load cases
    const casesPath = join(__dirname, 'sample_cases.json');
    const casesData = fs.readFileSync(casesPath, 'utf-8');
    const allCases = JSON.parse(casesData);
    
    // Find relevant cases
    const relevantCases = findRelevantCases(query, allCases);
    
    // Build focused response about cases
    let response = '';
    
    if (relevantCases.length === 0) {
      response = `I couldn't find specific cases matching "${query}" in our database. However, I can provide general guidance. Our case library includes:\n\n`;
      
      // List available case types
      const caseTypes = [...new Set(allCases.map(c => c.procedure.specialty))];
      response += `Specialties covered: ${caseTypes.join(', ')}\n\n`;
      
      const complications = allCases.filter(c => c.complications && c.complications.length > 0);
      response += `Cases with complications: ${complications.length}\n`;
      response += `Critical incidents: ${allCases.filter(c => c.outcome?.criticalIncident).length}\n\n`;
      response += 'Try asking about specific complications, procedures, or patient populations.';
    } else {
      response = `I found ${relevantCases.length} relevant case(s) for "${query}":\n\n`;
      
      relevantCases.forEach((caseData, index) => {
        const age = `${caseData.patient.age}${caseData.patient.ageUnit?.[0] || 'y'}`;
        response += `📋 **Case ${index + 1}**: ${age} ${caseData.patient.sex} - ${caseData.procedure.name}\n`;
        response += `ASA ${caseData.patient.asa} | ${caseData.procedure.specialty} | Blood loss: ${caseData.procedure.bloodLoss}mL\n\n`;
        
        // Add complications if present
        if (caseData.complications && caseData.complications.length > 0) {
          response += `⚠️ **Complications**:\n`;
          caseData.complications.forEach(comp => {
            response += `• ${comp.event}\n`;
            response += `  → Management: ${comp.management}\n`;
            response += `  → Outcome: ${comp.outcome}\n\n`;
          });
        }
        
        // Add key takeaways
        if (caseData.keyTakeaways && caseData.keyTakeaways.length > 0) {
          response += `🔑 **Key Lessons**:\n`;
          caseData.keyTakeaways.forEach(takeaway => {
            response += `• ${takeaway}\n`;
          });
          response += '\n';
        }
        
        // Add clinical pearls
        if (caseData.clinicalPearls && caseData.clinicalPearls.length > 0) {
          response += `💡 **Clinical Pearls**:\n`;
          caseData.clinicalPearls.slice(0, 3).forEach(pearl => {
            response += `• ${pearl}\n`;
          });
          response += '\n';
        }
        
        // Add specific details for critical cases
        if (caseData.outcome?.criticalIncident) {
          response += `🚨 **Critical Incident Details**:\n`;
          if (caseData.outcome.icuDays) {
            response += `• ICU stay: ${caseData.outcome.icuDays} days\n`;
          }
          if (caseData.outcome.hospitalDays) {
            response += `• Total hospital stay: ${caseData.outcome.hospitalDays} days\n`;
          }
          response += `• Quality score: ${caseData.outcome.qualityScore}/10\n\n`;
        }
        
        response += '---\n\n';
      });
      
      // Add summary recommendations
      response += `**Summary Recommendations Based on These Cases**:\n`;
      
      // Extract common themes
      const allPearls = relevantCases.flatMap(c => c.clinicalPearls || []);
      const allTakeaways = relevantCases.flatMap(c => c.keyTakeaways || []);
      
      // Get top 3 most important points
      const importantPoints = [...new Set([...allPearls, ...allTakeaways])].slice(0, 5);
      importantPoints.forEach(point => {
        response += `• ${point}\n`;
      });
    }
    
    res.json({ 
      response,
      relevantCases: includeDetails ? relevantCases : relevantCases.map(c => ({
        procedure: c.procedure.name,
        patient: `${c.patient.age}${c.patient.ageUnit?.[0]} ${c.patient.sex}`,
        complications: c.complications?.length || 0
      })),
      totalCases: allCases.length
    });
    
  } catch (error) {
    console.error('Case search error:', error);
    res.status(500).json({ error: 'Failed to search cases' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`📝 API Key configured: ${!!(CLAUDE_API_KEY && CLAUDE_API_KEY !== 'your_claude_api_key_here')}`);
});