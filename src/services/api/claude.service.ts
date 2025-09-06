import axios, { AxiosError } from 'axios'

interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AnesthesiaContext {
  query: string
  context?: {
    patientAge?: string
    procedure?: string
    comorbidities?: string[]
  }
}

class ClaudeService {
  private apiConfigured: boolean = false

  constructor() {
    this.checkAPIConfiguration()
  }

  private async checkAPIConfiguration() {
    try {
      const response = await axios.get('/api/health')
      this.apiConfigured = response.data.apiConfigured
    } catch (error) {
      console.error('Failed to check API configuration:', error)
      this.apiConfigured = false
    }
  }

  async sendMessage(
    message: string,
    context?: AnesthesiaContext['context'],
    conversationHistory: ClaudeMessage[] = []
  ): Promise<{ response: string; citations: Array<{ title: string; url: string }> }> {
    try {
      // Call our backend API instead of Anthropic directly
      const response = await axios.post('/api/chat', {
        message,
        context,
        conversationHistory
      })

      // Try to get PubMed citations based on the query
      let citations: Array<{ title: string; url: string }> = []
      try {
        const searchTerms = this.extractMedicalTerms(message)
        if (searchTerms) {
          const pubmedResponse = await axios.post('/api/pubmed/search', {
            query: searchTerms,
            retmax: 3
          })
          
          if (pubmedResponse.data.articles) {
            citations = pubmedResponse.data.articles.map((article: any) => ({
              title: `${article.title} (${article.journal}, ${article.pubDate})`,
              url: article.url
            }))
          }
        }
      } catch (error) {
        console.error('Failed to fetch PubMed citations:', error)
      }

      return {
        response: response.data.response || 'No response generated.',
        citations
      }
    } catch (error) {
      console.error('Chat API error:', error)
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error: string }>
        
        // Return the error message from our backend
        if (axiosError.response?.data?.error) {
          return {
            response: axiosError.response.data.error,
            citations: []
          }
        }
        
        // Handle network errors
        if (axiosError.code === 'ECONNREFUSED') {
          return {
            response: 'Unable to connect to the server. Please make sure the backend server is running.',
            citations: []
          }
        }
      }

      return {
        response: 'An error occurred while processing your request. Please try again later.',
        citations: []
      }
    }
  }

  private extractMedicalTerms(query: string): string {
    // Simple extraction of medical terms for PubMed search
    const anesthesiaKeywords = [
      'propofol', 'sevoflurane', 'rocuronium', 'sugammadex', 'fentanyl',
      'intubation', 'extubation', 'regional', 'spinal', 'epidural',
      'MAC', 'TIVA', 'malignant hyperthermia', 'laryngoscopy',
      'anesthesia', 'anesthetic', 'perioperative', 'postoperative',
      'desflurane', 'isoflurane', 'remifentanil', 'dexmedetomidine',
      'succinylcholine', 'neostigmine', 'midazolam', 'ketamine'
    ]

    const foundKeywords = anesthesiaKeywords.filter(keyword => 
      query.toLowerCase().includes(keyword.toLowerCase())
    )

    if (foundKeywords.length > 0) {
      return foundKeywords.join(' OR ')
    }

    // If no specific keywords found, use a general anesthesia search with key terms from query
    const words = query.split(' ').filter(word => word.length > 3)
    if (words.length > 0) {
      return `anesthesia AND (${words.slice(0, 3).join(' OR ')})`
    }

    return 'anesthesia perioperative'
  }

  isConfigured(): boolean {
    return this.apiConfigured
  }
}

export const claudeService = new ClaudeService()
export default claudeService