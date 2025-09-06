interface CacheItem<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface CacheDurations {
  pubmed: number
  fda: number
  clinicalTrials: number
  calculations: number
  protocols: number
}

export const CACHE_DURATIONS: CacheDurations = {
  pubmed: 6 * 60 * 60 * 1000,      // 6 hours
  fda: 24 * 60 * 60 * 1000,        // 24 hours
  clinicalTrials: 12 * 60 * 60 * 1000, // 12 hours
  calculations: Infinity,           // Never expire
  protocols: Infinity               // Never expire
}

class CacheManager {
  private prefix = 'anesthesia_app_cache_'

  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  set<T>(key: string, data: T, duration: number): void {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration
    }
    
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(cacheItem))
    } catch (error) {
      console.error('Failed to cache data:', error)
      // If localStorage is full, try to clear old cache
      this.clearExpired()
      try {
        localStorage.setItem(this.getKey(key), JSON.stringify(cacheItem))
      } catch (retryError) {
        console.error('Failed to cache data after clearing:', retryError)
      }
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.getKey(key))
      if (!item) return null

      const cacheItem: CacheItem<T> = JSON.parse(item)
      
      // Check if expired
      if (cacheItem.expiresAt !== Infinity && Date.now() > cacheItem.expiresAt) {
        this.remove(key)
        return null
      }

      return cacheItem.data
    } catch (error) {
      console.error('Failed to get cached data:', error)
      return null
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.getKey(key))
  }

  clearAll(): void {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key)
      }
    })
  }

  clearExpired(): void {
    const keys = Object.keys(localStorage)
    const now = Date.now()
    
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        try {
          const item = localStorage.getItem(key)
          if (item) {
            const cacheItem: CacheItem<any> = JSON.parse(item)
            if (cacheItem.expiresAt !== Infinity && now > cacheItem.expiresAt) {
              localStorage.removeItem(key)
            }
          }
        } catch (error) {
          // Remove corrupted cache items
          localStorage.removeItem(key)
        }
      }
    })
  }

  getCacheSize(): { count: number; sizeKB: number } {
    let count = 0
    let totalSize = 0
    
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        count++
        const item = localStorage.getItem(key)
        if (item) {
          totalSize += item.length * 2 // Approximate size in bytes (UTF-16)
        }
      }
    })
    
    return {
      count,
      sizeKB: Math.round(totalSize / 1024)
    }
  }
}

export default new CacheManager()