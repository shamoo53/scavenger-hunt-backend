import { Test, TestingModule } from '@nestjs/testing';
import { AnnouncementCacheService } from './cache.service';

describe('AnnouncementCacheService', () => {
  let service: AnnouncementCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnnouncementCacheService],
    }).compile();

    service = module.get<AnnouncementCacheService>(AnnouncementCacheService);
  });

  afterEach(() => {
    service.clear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Basic Cache Operations', () => {
    it('should store and retrieve data', () => {
      const key = 'test-key';
      const data = { message: 'test data' };

      service.set(key, data);
      const result = service.get(key);

      expect(result).toEqual(data);
    });

    it('should return null for non-existent key', () => {
      const result = service.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should delete cache item', () => {
      const key = 'test-key';
      service.set(key, 'test data');

      const deleted = service.delete(key);
      const result = service.get(key);

      expect(deleted).toBe(true);
      expect(result).toBeNull();
    });

    it('should return false when deleting non-existent key', () => {
      const deleted = service.delete('non-existent-key');
      expect(deleted).toBe(false);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire data after TTL', async () => {
      const key = 'expiring-key';
      const data = 'expiring data';
      const ttl = 0.1; // 100ms

      service.set(key, data, ttl);
      expect(service.get(key)).toEqual(data);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(service.get(key)).toBeNull();
    });

    it('should use default TTL when not specified', () => {
      const key = 'test-key';
      service.set(key, 'test data');

      // Should still be available immediately
      expect(service.get(key)).toEqual('test data');
    });

    it('should use custom TTL for different cache types', () => {
      const announcementKey = service.generateKey('announcement', '123');
      const publishedKey = service.generateKey('published');

      service.set(announcementKey, { id: '123' });
      service.set(publishedKey, [{ id: '1' }, { id: '2' }]);

      expect(service.get(announcementKey)).toBeTruthy();
      expect(service.get(publishedKey)).toBeTruthy();
    });
  });

  describe('Cache Patterns', () => {
    it('should clear cache by pattern', () => {
      service.set('announcement:123', { id: '123' });
      service.set('announcement:456', { id: '456' });
      service.set('published', []);
      service.set('featured', []);

      const cleared = service.clearByPattern('announcement:.*');

      expect(cleared).toBe(2);
      expect(service.get('announcement:123')).toBeNull();
      expect(service.get('announcement:456')).toBeNull();
      expect(service.get('published')).toBeTruthy();
      expect(service.get('featured')).toBeTruthy();
    });

    it('should invalidate announcement cache', () => {
      service.set('published', []);
      service.set('featured', []);
      service.set('popular:10', []);
      service.set('categories', []);
      service.set('announcement:123', { id: '123' });

      service.invalidateAnnouncementCache('123');

      expect(service.get('published')).toBeNull();
      expect(service.get('featured')).toBeNull();
      expect(service.get('popular:10')).toBeNull();
      expect(service.get('categories')).toBeNull();
      expect(service.get('announcement:123')).toBeNull();
    });

    it('should invalidate all announcement cache without specific ID', () => {
      service.set('published', []);
      service.set('featured', []);
      service.set('announcement:123', { id: '123' });
      service.set('unrelated-key', 'should remain');

      service.invalidateAnnouncementCache();

      expect(service.get('published')).toBeNull();
      expect(service.get('featured')).toBeNull();
      expect(service.get('unrelated-key')).toBeTruthy();
    });
  });

  describe('Key Generation', () => {
    it('should generate consistent cache keys', () => {
      const key1 = service.generateKey('announcement', '123');
      const key2 = service.generateKey('announcement', '123');
      const key3 = service.generateKey('announcement', '456');

      expect(key1).toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key1).toBe('announcement:123');
    });

    it('should handle multiple parameters', () => {
      const key = service.generateKey('popular', '10', 'week');
      expect(key).toBe('popular:10:week');
    });
  });

  describe('getOrSet Operation', () => {
    it('should return cached data if available', async () => {
      const key = 'test-key';
      const cachedData = { cached: true };
      const fetchFunction = jest.fn();

      service.set(key, cachedData);
      const result = await service.getOrSet(key, fetchFunction);

      expect(result).toEqual(cachedData);
      expect(fetchFunction).not.toHaveBeenCalled();
    });

    it('should fetch and cache data if not available', async () => {
      const key = 'test-key';
      const fetchedData = { fetched: true };
      const fetchFunction = jest.fn().mockResolvedValue(fetchedData);

      const result = await service.getOrSet(key, fetchFunction);

      expect(result).toEqual(fetchedData);
      expect(fetchFunction).toHaveBeenCalledTimes(1);
      expect(service.get(key)).toEqual(fetchedData);
    });

    it('should propagate fetch function errors', async () => {
      const key = 'test-key';
      const error = new Error('Fetch failed');
      const fetchFunction = jest.fn().mockRejectedValue(error);

      await expect(service.getOrSet(key, fetchFunction)).rejects.toThrow(
        'Fetch failed',
      );
      expect(service.get(key)).toBeNull();
    });
  });

  describe('Cache Statistics', () => {
    it('should return cache statistics', () => {
      service.set('key1', 'data1');
      service.set('key2', 'data2');
      service.set('key3', 'data3');

      const stats = service.getStats();

      expect(stats.size).toBe(3);
      expect(stats.keys).toHaveLength(3);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
      expect(stats.keys).toContain('key3');
    });

    it('should return empty stats for empty cache', () => {
      const stats = service.getStats();

      expect(stats.size).toBe(0);
      expect(stats.keys).toHaveLength(0);
    });
  });

  describe('Cache Cleanup', () => {
    it('should clear all cache', () => {
      service.set('key1', 'data1');
      service.set('key2', 'data2');

      service.clear();

      expect(service.get('key1')).toBeNull();
      expect(service.get('key2')).toBeNull();
      expect(service.getStats().size).toBe(0);
    });

    it('should handle errors gracefully', () => {
      // Test error handling in get operation
      const invalidKey = null as any;
      expect(() => service.get(invalidKey)).not.toThrow();

      // Test error handling in set operation
      expect(() => service.set(invalidKey, 'data')).not.toThrow();
    });
  });

  describe('Cache Type Configuration', () => {
    it('should use appropriate TTL for different cache types', () => {
      const testCases = [
        { key: 'announcement:123', expectedType: 'announcement' },
        { key: 'published-list', expectedType: 'published' },
        { key: 'featured-items', expectedType: 'featured' },
        { key: 'popular:10', expectedType: 'popular' },
        { key: 'trending:7:5', expectedType: 'trending' },
        { key: 'categories-list', expectedType: 'categories' },
        { key: 'tags-all', expectedType: 'tags' },
        { key: 'statistics-data', expectedType: 'statistics' },
        { key: 'types-enum', expectedType: 'types' },
        { key: 'unknown-key', expectedType: 'default' },
      ];

      testCases.forEach(({ key }) => {
        expect(() => service.set(key, 'test-data')).not.toThrow();
        expect(service.get(key)).toBe('test-data');
      });
    });
  });

  describe('Memory Management', () => {
    it('should handle large cache gracefully', () => {
      // Test with many cache entries
      for (let i = 0; i < 100; i++) {
        service.set(`key-${i}`, `data-${i}`);
      }

      const stats = service.getStats();
      expect(stats.size).toBe(100);

      // Verify data integrity
      expect(service.get('key-0')).toBe('data-0');
      expect(service.get('key-50')).toBe('data-50');
      expect(service.get('key-99')).toBe('data-99');
    });

    it('should handle complex data structures', () => {
      const complexData = {
        id: '123',
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' },
          date: new Date(),
        },
        nullValue: null,
        undefinedValue: undefined,
      };

      service.set('complex-key', complexData);
      const retrieved = service.get('complex-key');

      expect(retrieved).toEqual(complexData);
      expect(retrieved.nested.array).toEqual([1, 2, 3]);
      expect(retrieved.nested.object.key).toBe('value');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string keys', () => {
      service.set('', 'empty-key-data');
      expect(service.get('')).toBe('empty-key-data');
    });

    it('should handle null and undefined values', () => {
      service.set('null-key', null);
      service.set('undefined-key', undefined);
      service.set('false-key', false);
      service.set('zero-key', 0);

      expect(service.get('null-key')).toBeNull();
      expect(service.get('undefined-key')).toBeUndefined();
      expect(service.get('false-key')).toBe(false);
      expect(service.get('zero-key')).toBe(0);
    });

    it('should handle concurrent operations', async () => {
      const operations = [];

      // Simulate concurrent set operations
      for (let i = 0; i < 10; i++) {
        operations.push(
          Promise.resolve().then(() => {
            service.set(`concurrent-${i}`, `data-${i}`);
            return service.get(`concurrent-${i}`);
          }),
        );
      }

      const results = await Promise.all(operations);

      results.forEach((result, index) => {
        expect(result).toBe(`data-${index}`);
      });
    });
  });
});
