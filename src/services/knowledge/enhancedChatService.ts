// Enhanced Chat Service with Knowledge Base Integration
import { CaseService } from './caseDatabase';
import { claudeService } from '../api/claude.service';

export interface EnhancedChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];
  casesUsed?: number;
}

export class EnhancedChatService {
  // Process chat with knowledge base context
  static async processWithKnowledge(
    userMessage: string,
    conversationHistory: EnhancedChatMessage[] = []
  ): Promise<EnhancedChatMessage> {
    try {
      // 1. Search for relevant cases in the knowledge base
      const relevantContext = await CaseService.getCasesForContext(userMessage, 3);
      const hasRelevantCases = relevantContext.length > 0;
      
      // 2. Count how many cases were found
      const casesFound = relevantContext ? (relevantContext.match(/Case #/g) || []).length : 0;
      
      // 3. Build enhanced prompt with case context
      const enhancedPrompt = this.buildEnhancedPrompt(userMessage, relevantContext, conversationHistory);
      
      // 4. Get response from Claude
      const response = await claudeService.sendMessage(enhancedPrompt, []);
      
      // 5. Format response with citations
      const formattedResponse = this.formatResponseWithCitations(response, hasRelevantCases, casesFound);
      
      return {
        role: 'assistant',
        content: formattedResponse,
        casesUsed: casesFound,
        citations: hasRelevantCases ? [`${casesFound} cases from your knowledge base`] : undefined
      };
    } catch (error) {
      console.error('Error in enhanced chat:', error);
      // Fallback to regular chat if knowledge base fails
      const response = await claudeService.sendMessage(userMessage, conversationHistory);
      return {
        role: 'assistant',
        content: response
      };
    }
  }
  
  // Build prompt with case context
  private static buildEnhancedPrompt(
    userMessage: string,
    caseContext: string,
    history: EnhancedChatMessage[]
  ): string {
    let prompt = '';
    
    // Add system context if cases are available
    if (caseContext && caseContext.length > 0) {
      prompt = `You are an AI anesthesia assistant with access to a curated database of real anesthesia cases. 
Use the following relevant cases from the knowledge base to inform your response. These cases represent actual clinical experiences and should guide your recommendations.

RELEVANT CASES FROM KNOWLEDGE BASE:
${caseContext}

When providing your response:
1. Reference specific cases when applicable (e.g., "Based on Case #1...")
2. Highlight clinical pearls and key takeaways from the cases
3. Note any patterns or trends across multiple cases
4. Mention if your recommendation differs from the cases and why
5. Always maintain patient safety as the primary concern

Remember: These cases supplement but don't replace current clinical guidelines and your medical judgment.

`;
    }
    
    // Add conversation history
    if (history.length > 0) {
      prompt += 'Previous conversation:\n';
      history.slice(-4).forEach(msg => {
        prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
      prompt += '\n';
    }
    
    // Add current user message
    prompt += `Current question: ${userMessage}`;
    
    return prompt;
  }
  
  // Format response with citation indicators
  private static formatResponseWithCitations(
    response: string,
    hasCitations: boolean,
    caseCount: number
  ): string {
    if (!hasCitations) {
      return response;
    }
    
    // Add citation footer
    const citationNote = `\n\n---\n📚 *This response was enhanced using ${caseCount} relevant case${caseCount > 1 ? 's' : ''} from your knowledge base.*`;
    
    return response + citationNote;
  }
  
  // Search knowledge base directly
  static async searchKnowledgeBase(query: string) {
    return await CaseService.searchCases({ text: query });
  }
  
  // Get similar cases
  static async getSimilarCases(patientProfile: {
    age: number;
    ageUnit: 'days' | 'months' | 'years';
    weight: number;
    asa: number;
    procedure: string;
  }) {
    return await CaseService.findSimilarCases({
      patient: {
        age: patientProfile.age,
        ageUnit: patientProfile.ageUnit,
        weight: patientProfile.weight,
        asa: patientProfile.asa as 1 | 2 | 3 | 4 | 5 | 6,
        sex: 'M',
        comorbidities: [],
        allergies: [],
        medications: [],
        height: undefined
      },
      procedure: {
        name: patientProfile.procedure,
        specialty: '',
        urgency: 'elective',
        duration: 0,
        position: '',
        bloodLoss: 0,
        fluidsGiven: {
          crystalloid: 0,
          colloid: 0,
          bloodProducts: []
        }
      }
    }, 5);
  }
  
  // Analyze patterns in the knowledge base
  static async analyzePatterns(topic: string) {
    const cases = await CaseService.searchCases({ text: topic });
    
    if (cases.length === 0) {
      return 'No relevant cases found in the knowledge base.';
    }
    
    // Analyze common patterns
    const patterns = {
      techniques: {} as Record<string, number>,
      complications: [] as string[],
      inductionDrugs: {} as Record<string, number>,
      clinicalPearls: [] as string[],
      averageDuration: 0,
      asaDistribution: {} as Record<number, number>
    };
    
    cases.forEach(c => {
      // Technique frequency
      patterns.techniques[c.anesthetic.technique] = (patterns.techniques[c.anesthetic.technique] || 0) + 1;
      
      // Complications
      c.complications.forEach(comp => {
        patterns.complications.push(comp.event);
      });
      
      // Induction drugs
      c.anesthetic.induction.forEach(drug => {
        patterns.inductionDrugs[drug.drug] = (patterns.inductionDrugs[drug.drug] || 0) + 1;
      });
      
      // Clinical pearls
      patterns.clinicalPearls.push(...c.clinicalPearls);
      
      // ASA distribution
      patterns.asaDistribution[c.patient.asa] = (patterns.asaDistribution[c.patient.asa] || 0) + 1;
      
      // Duration
      patterns.averageDuration += c.procedure.duration;
    });
    
    patterns.averageDuration = patterns.averageDuration / cases.length;
    
    // Format analysis
    let analysis = `Pattern Analysis for "${topic}" (${cases.length} cases):\n\n`;
    
    analysis += `**Anesthetic Techniques:**\n`;
    Object.entries(patterns.techniques)
      .sort((a, b) => b[1] - a[1])
      .forEach(([tech, count]) => {
        analysis += `- ${tech}: ${count} cases (${((count/cases.length)*100).toFixed(1)}%)\n`;
      });
    
    analysis += `\n**Common Induction Drugs:**\n`;
    Object.entries(patterns.inductionDrugs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([drug, count]) => {
        analysis += `- ${drug}: ${count} cases\n`;
      });
    
    if (patterns.complications.length > 0) {
      analysis += `\n**Complications Encountered:**\n`;
      const uniqueComplications = [...new Set(patterns.complications)];
      uniqueComplications.slice(0, 5).forEach(comp => {
        analysis += `- ${comp}\n`;
      });
    }
    
    analysis += `\n**Average Procedure Duration:** ${patterns.averageDuration.toFixed(0)} minutes\n`;
    
    if (patterns.clinicalPearls.length > 0) {
      analysis += `\n**Key Clinical Pearls:**\n`;
      const uniquePearls = [...new Set(patterns.clinicalPearls)];
      uniquePearls.slice(0, 5).forEach(pearl => {
        analysis += `- ${pearl}\n`;
      });
    }
    
    return analysis;
  }
}