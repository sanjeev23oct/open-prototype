interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  size: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size in bytes
  maxItems?: number; // Maximum number of items
}

export class CacheService {
  private static instance: CacheService;
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 30 * 60 * 1000; // 30 minutes
  private maxSize = 50 * 1024 * 1024; // 50MB
  private maxItems = 1000;
  private currentSize = 0;

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  constructor() {
    // Clean up expired items periodically
    setInterval(() => this.cleanup(), 5 * 60 * 1000); // Every 5 minutes
  }

  // Set item in cache
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.defaultTTL;
    const size = this.calculateSize(data);
    
    // Check if adding this item would exceed limits
    if (size > this.maxSize) {
      console.warn('Cache item too large, not caching');
      return;
    }

    // Remove existing item if it exists
    if (this.cache.has(key)) {
      this.currentSize -= this.cache.get(key)!.size;
    }

    // Make room if necessary
    while (
      (this.currentSize + size > this.maxSize) ||
      (this.cache.size >= this.maxItems)
    ) {
      this.evictLRU();
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      size
    };

    this.cache.set(key, item);
    this.currentSize += size;
  }

  // Get item from cache
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key);
      return null;
    }

    // Update timestamp for LRU
    item.timestamp = Date.now();
    return item.data as T;
  }

  // Check if key exists and is not expired
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  // Delete item from cache
  delete(key: string): boolean {
    const item = this.cache.get(key);
    if (item) {
      this.currentSize -= item.size;
      return this.cache.delete(key);
    }
    return false;
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      currentSize: this.currentSize,
      maxSize: this.maxSize,
      maxItems: this.maxItems,
      hitRate: this.calculateHitRate()
    };
  }

  // Memoization wrapper
  memoize<T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string,
    options?: CacheOptions
  ): T {
    const generateKey = keyGenerator || ((...args) => JSON.stringify(args));
    
    return ((...args: Parameters<T>) => {
      const key = `memoized:${fn.name}:${generateKey(...args)}`;
      
      // Try to get from cache first
      const cached = this.get(key);
      if (cached !== null) {
        return cached;
      }

      // Execute function and cache result
      const result = fn(...args);
      this.set(key, result, options);
      
      return result;
    }) as T;
  }

  // Cache with expiration
  setWithExpiration<T>(key: string, data: T, expirationMs: number): void {
    this.set(key, data, { ttl: expirationMs });
  }

  // Batch operations
  setMany<T>(items: Array<{ key: string; data: T; options?: CacheOptions }>): void {
    items.forEach(({ key, data, options }) => {
      this.set(key, data, options);
    });
  }

  getMany<T>(keys: string[]): Array<{ key: string; data: T | null }> {
    return keys.map(key => ({
      key,
      data: this.get<T>(key)
    }));
  }

  // Cache for API responses
  cacheApiResponse<T>(
    url: string,
    params: Record<string, any>,
    response: T,
    ttl?: number
  ): void {
    const key = this.generateApiKey(url, params);
    this.set(key, response, { ttl });
  }

  getCachedApiResponse<T>(url: string, params: Record<string, any>): T | null {
    const key = this.generateApiKey(url, params);
    return this.get<T>(key);
  }

  // Cache for generated plans
  cachePlan(prompt: string, preferences: any, plan: any): void {
    const key = `plan:${this.hashString(prompt + JSON.stringify(preferences))}`;
    this.set(key, plan, { ttl: 60 * 60 * 1000 }); // 1 hour
  }

  getCachedPlan(prompt: string, preferences: any): any | null {
    const key = `plan:${this.hashString(prompt + JSON.stringify(preferences))}`;
    return this.get(key);
  }

  // Cache for code sections
  cacheCodeSection(sectionId: string, code: string): void {
    const key = `code:${sectionId}`;
    this.set(key, code, { ttl: 2 * 60 * 60 * 1000 }); // 2 hours
  }

  getCachedCodeSection(sectionId: string): string | null {
    const key = `code:${sectionId}`;
    return this.get(key);
  }

  // Cache for documentation
  cacheDocumentation(componentName: string, code: string, docs: string): void {
    const key = `docs:${this.hashString(componentName + code)}`;
    this.set(key, docs, { ttl: 24 * 60 * 60 * 1000 }); // 24 hours
  }

  getCachedDocumentation(componentName: string, code: string): string | null {
    const key = `docs:${this.hashString(componentName + code)}`;
    return this.get(key);
  }

  // Private helper methods
  private calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      // Fallback for rough estimation
      return JSON.stringify(data).length * 2;
    }
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));
  }

  private calculateHitRate(): number {
    // This would need to be tracked separately in a real implementation
    return 0.85; // Placeholder
  }

  private generateApiKey(url: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, any>);
    
    return `api:${url}:${this.hashString(JSON.stringify(sortedParams))}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  // Persistence to localStorage
  persist(): void {
    try {
      const serializable = Array.from(this.cache.entries()).map(([key, item]) => [
        key,
        {
          ...item,
          // Only persist non-expired items
          ...(Date.now() - item.timestamp < item.ttl ? {} : { expired: true })
        }
      ]);
      
      localStorage.setItem('cache-service', JSON.stringify(serializable));
    } catch (error) {
      console.warn('Failed to persist cache:', error);
    }
  }

  // Restore from localStorage
  restore(): void {
    try {
      const stored = localStorage.getItem('cache-service');
      if (stored) {
        const data = JSON.parse(stored);
        const now = Date.now();
        
        for (const [key, item] of data) {
          // Skip expired items
          if (item.expired || (now - item.timestamp > item.ttl)) {
            continue;
          }
          
          this.cache.set(key, item);
          this.currentSize += item.size;
        }
      }
    } catch (error) {
      console.warn('Failed to restore cache:', error);
    }
  }
}

// React hook for using cache
export const useCache = () => {
  const cache = CacheService.getInstance();
  
  return {
    get: cache.get.bind(cache),
    set: cache.set.bind(cache),
    has: cache.has.bind(cache),
    delete: cache.delete.bind(cache),
    memoize: cache.memoize.bind(cache),
    stats: cache.getStats()
  };
};