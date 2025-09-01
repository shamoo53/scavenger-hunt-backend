import { Injectable, Logger } from '@nestjs/common';
import { EventAnnouncement } from '../entities/event-announcement.entity';

interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum number of items in cache
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

@Injectable()
export class AnnouncementCacheService {
  private readonly logger = new Logger(AnnouncementCacheService.name);
  private readonly cache = new Map<string, CacheItem<any>>();
  
  private readonly defaultConfig: CacheConfig = {
    ttl: 300, // 5 minutes
    maxSize: 1000
  };

  private readonly cacheConfigs: Record<string, CacheConfig> = {
    'announcement': { ttl: 300, maxSize: 500 }, // Individual announcements
    'published': { ttl: 180, maxSize: 1 }, // Published announcements list
    'featured': { ttl: 600, maxSize: 1 }, // Featured announcements
    'popular': { ttl: 900, maxSize: 10 }, // Popular announcements with different limits
    'trending': { ttl: 1800, maxSize: 10 }, // Trending announcements
    'categories': { ttl: 3600, maxSize: 1 }, // Categories list
    'tags': { ttl: 3600, maxSize: 1 }, // Tags list
    'statistics': { ttl: 300, maxSize: 1 }, // Statistics
    'types': { ttl: 86400, maxSize: 1 } // Types (rarely change)
  };

  /**
   * Get cached data by key
   */
  get<T>(key: string): T | null {
    try {
      const item = this.cache.get(key);
      
      if (!item) {
        return null;
      }

      // Check if item has expired
      const now = Date.now();
      if (now - item.timestamp > item.ttl * 1000) {
        this.cache.delete(key);
        this.logger.debug(`Cache item expired and removed: ${key}`);
        return null;
      }

      this.logger.debug(`Cache hit: ${key}`);
      return item.data;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}: ${error.message}`);
      return null;
    }
  }

  /**
   * Set cache data with optional TTL
   */
  set<T>(key: string, data: T, customTtl?: number): void {
    try {
      // Clean up expired items before adding new ones
      this.cleanupExpired();

      // Determine cache config
      const cacheType = this.getCacheType(key);
      const config = this.cacheConfigs[cacheType] || this.defaultConfig;
      const ttl = customTtl || config.ttl;

      // Check cache size limit
      if (this.cache.size >= config.maxSize) {
        this.evictLRU();
      }

      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl
      };

      this.cache.set(key, item);
      this.logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}: ${error.message}`);
    }
  }

  /**
   * Remove item from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.debug(`Cache item deleted: ${key}`);
    }
    return deleted;
  }

  /**
   * Clear cache by pattern
   */
  clearByPattern(pattern: string): number {
    let cleared = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        cleared++;
      }
    }

    this.logger.debug(`Cleared ${cleared} cache items matching pattern: ${pattern}`);
    return cleared;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.debug(`Cleared all cache (${size} items)`);
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      maxSize: this.defaultConfig.maxSize,
      hitRate: 0, // Would need to track hits/misses for accurate calculation
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Generate cache key for announcements
   */
  generateKey(prefix: string, ...params: (string | number)[]): string {
    return `${prefix}:${params.join(':')}`;
  }

  /**
   * Cache wrapper for async functions
   */
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    customTtl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    try {
      // Fetch data and cache it
      const data = await fetchFunction();
      this.set(key, data, customTtl);
      return data;
    } catch (error) {
      this.logger.error(`Cache getOrSet error for key ${key}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Invalidate related cache keys when announcement is modified
   */
  invalidateAnnouncementCache(announcementId?: string): void {
    const patterns = [
      'published',
      'featured',
      'popular',
      'trending',
      'categories',
      'tags',
      'statistics',
      'type:.*',
      'category:.*'
    ];

    if (announcementId) {
      patterns.push(`announcement:${announcementId}`);
    }

    patterns.forEach(pattern => this.clearByPattern(pattern));
    this.logger.debug(`Invalidated announcement cache${announcementId ? ` for ID: ${announcementId}` : ''}`);
  }

  private getCacheType(key: string): string {
    if (key.startsWith('announcement:')) return 'announcement';
    if (key.includes('published')) return 'published';
    if (key.includes('featured')) return 'featured';
    if (key.includes('popular')) return 'popular';
    if (key.includes('trending')) return 'trending';
    if (key.includes('categories')) return 'categories';
    if (key.includes('tags')) return 'tags';
    if (key.includes('statistics')) return 'statistics';
    if (key.includes('types')) return 'types';
    
    return 'default';
  }

  private cleanupExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl * 1000) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      this.logger.debug(`Cleaned up ${expiredKeys.length} expired cache items`);
    }
  }

  private evictLRU(): void {
    // Simple LRU: remove the oldest item
    const oldestKey = this.cache.keys().next().value;
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.logger.debug(`Evicted LRU cache item: ${oldestKey}`);
    }
  }
}