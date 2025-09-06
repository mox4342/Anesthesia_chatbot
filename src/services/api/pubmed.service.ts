import axios from 'axios'

const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
const DEFAULT_RETMAX = 20

export interface PubMedArticle {
  pmid: string
  title: string
  authors: string[]
  abstract: string
  journal: string
  pubDate: string
  doi?: string
}

export interface SearchResult {
  count: number
  articles: PubMedArticle[]
  searchQuery: string
}

class PubMedService {
  private parseXML(xmlString: string): Document {
    const parser = new DOMParser()
    return parser.parseFromString(xmlString, 'text/xml')
  }

  async search(query: string, retmax: number = DEFAULT_RETMAX): Promise<SearchResult> {
    try {
      // Step 1: Search for PMIDs
      const searchResponse = await axios.get(`${PUBMED_BASE}/esearch.fcgi`, {
        params: {
          db: 'pubmed',
          term: query,
          retmax: retmax,
          retmode: 'json',
          sort: 'relevance'
        }
      })

      const searchResult = searchResponse.data.esearchresult
      const pmids = searchResult.idlist || []
      const count = parseInt(searchResult.count) || 0

      if (pmids.length === 0) {
        return {
          count: 0,
          articles: [],
          searchQuery: query
        }
      }

      // Step 2: Fetch article details
      const articles = await this.fetchArticleDetails(pmids)

      return {
        count,
        articles,
        searchQuery: query
      }
    } catch (error) {
      console.error('PubMed search error:', error)
      throw new Error('Failed to search PubMed')
    }
  }

  async fetchArticleDetails(pmids: string[]): Promise<PubMedArticle[]> {
    try {
      const response = await axios.get(`${PUBMED_BASE}/efetch.fcgi`, {
        params: {
          db: 'pubmed',
          id: pmids.join(','),
          retmode: 'xml'
        }
      })

      const xmlDoc = this.parseXML(response.data)
      const articles: PubMedArticle[] = []

      const pubmedArticles = xmlDoc.getElementsByTagName('PubmedArticle')
      
      for (let i = 0; i < pubmedArticles.length; i++) {
        const article = pubmedArticles[i]
        
        // Extract PMID
        const pmidElement = article.querySelector('PMID')
        const pmid = pmidElement?.textContent || ''

        // Extract title
        const titleElement = article.querySelector('ArticleTitle')
        const title = titleElement?.textContent || ''

        // Extract authors
        const authorElements = article.querySelectorAll('Author')
        const authors: string[] = []
        authorElements.forEach(author => {
          const lastName = author.querySelector('LastName')?.textContent || ''
          const foreName = author.querySelector('ForeName')?.textContent || ''
          if (lastName) {
            authors.push(`${lastName}${foreName ? ' ' + foreName : ''}`)
          }
        })

        // Extract abstract
        const abstractElement = article.querySelector('AbstractText')
        const abstract = abstractElement?.textContent || 'No abstract available'

        // Extract journal
        const journalElement = article.querySelector('Journal Title')
        const journal = journalElement?.textContent || article.querySelector('MedlineTA')?.textContent || ''

        // Extract publication date
        const yearElement = article.querySelector('PubDate Year')
        const monthElement = article.querySelector('PubDate Month')
        const year = yearElement?.textContent || article.querySelector('Year')?.textContent || ''
        const month = monthElement?.textContent || article.querySelector('Month')?.textContent || ''
        const pubDate = `${year}${month ? ' ' + month : ''}`

        // Extract DOI if available
        const doiElement = article.querySelector('ArticleId[IdType="doi"]')
        const doi = doiElement?.textContent || undefined

        articles.push({
          pmid,
          title,
          authors: authors.slice(0, 3), // Limit to first 3 authors
          abstract,
          journal,
          pubDate,
          doi
        })
      }

      return articles
    } catch (error) {
      console.error('Error fetching article details:', error)
      throw new Error('Failed to fetch article details')
    }
  }

  async getRecentAnesthesiaArticles(): Promise<SearchResult> {
    const queries = [
      'anesthesiology[journal] AND ("last 7 days"[PDAT])',
      'regional anesthesia AND ("last 7 days"[PDAT])',
      'perioperative complications AND ("last 7 days"[PDAT])'
    ]
    
    const allResults: PubMedArticle[] = []
    let totalCount = 0

    for (const query of queries) {
      try {
        const result = await this.search(query, 5)
        allResults.push(...result.articles)
        totalCount += result.count
      } catch (error) {
        console.error(`Failed to search for: ${query}`, error)
      }
    }

    return {
      count: totalCount,
      articles: allResults,
      searchQuery: 'Recent anesthesia articles'
    }
  }

  buildPubMedUrl(pmid: string): string {
    return `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
  }
}

export default new PubMedService()