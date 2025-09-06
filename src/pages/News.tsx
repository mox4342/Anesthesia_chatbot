import React, { useState, useEffect } from 'react'
import { Calendar, ExternalLink, RefreshCw, Search } from 'lucide-react'
import MedicalDisclaimer from '../components/common/MedicalDisclaimer'
import pubmedService, { PubMedArticle } from '../services/api/pubmed.service'
import cacheManager, { CACHE_DURATIONS } from '../services/cache/cacheManager'

const News: React.FC = () => {
  const [articles, setArticles] = useState<PubMedArticle[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [lastSearch, setLastSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRecentArticles()
  }, [])

  const loadRecentArticles = async () => {
    setIsLoading(true)
    setError(null)
    
    // Check cache first
    const cacheKey = 'recent_anesthesia_articles'
    const cached = cacheManager.get<PubMedArticle[]>(cacheKey)
    
    if (cached) {
      setArticles(cached)
      setIsLoading(false)
      return
    }

    try {
      const result = await pubmedService.getRecentAnesthesiaArticles()
      setArticles(result.articles)
      cacheManager.set(cacheKey, result.articles, CACHE_DURATIONS.pubmed)
    } catch (err) {
      setError('Failed to load recent articles. Please try again later.')
      console.error('Error loading articles:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim() || isLoading) return

    setIsLoading(true)
    setError(null)
    setLastSearch(searchQuery)

    // Check cache for this specific search
    const cacheKey = `search_${searchQuery}`
    const cached = cacheManager.get<PubMedArticle[]>(cacheKey)
    
    if (cached) {
      setArticles(cached)
      setIsLoading(false)
      return
    }

    try {
      const result = await pubmedService.search(`${searchQuery} AND anesthesia`, 20)
      setArticles(result.articles)
      cacheManager.set(cacheKey, result.articles, CACHE_DURATIONS.pubmed)
    } catch (err) {
      setError('Search failed. Please try again.')
      console.error('Search error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    cacheManager.clearAll()
    if (lastSearch) {
      setSearchQuery(lastSearch)
      handleSearch(new Event('submit') as any)
    } else {
      loadRecentArticles()
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <MedicalDisclaimer prominent={true} dismissible={false} position="top" />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Medical News & Research</h1>
        <p className="text-gray-600">Latest articles from PubMed on anesthesiology</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for anesthesia topics..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="btn-primary"
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="animate-spin text-blue-600" size={32} />
        </div>
      )}

      {/* Articles List */}
      {!isLoading && articles.length > 0 && (
        <div className="space-y-4">
          {articles.map((article) => (
            <div key={article.pmid} className="card hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">
                {article.title}
              </h3>
              
              <div className="text-sm text-gray-600 mb-2">
                {article.authors.join(', ')}
                {article.authors.length > 3 && ' et al.'}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {article.pubDate}
                </span>
                <span className="font-medium">{article.journal}</span>
              </div>
              
              <p className="text-gray-700 mb-4 line-clamp-3">
                {article.abstract}
              </p>
              
              <div className="flex items-center justify-between">
                <a
                  href={pubmedService.buildPubMedUrl(article.pmid)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-500 flex items-center gap-1"
                >
                  View on PubMed
                  <ExternalLink size={14} />
                </a>
                {article.doi && (
                  <span className="text-xs text-gray-500">
                    DOI: {article.doi}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && articles.length === 0 && !error && (
        <div className="text-center py-12 text-gray-500">
          <p>No articles found. Try searching for a different topic.</p>
        </div>
      )}
    </div>
  )
}

export default News