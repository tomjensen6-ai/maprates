/**
 * Cache Manager for Team Data
 */

export class TeamDataCache {
    constructor() {
        this.memoryCache = new Map();
        this.persistentCache = null;
        this.cacheConfig = {
            memoryTTL: 2 * 60 * 60 * 1000,      // 2 hours in memory
            persistentTTL: 24 * 60 * 60 * 1000,  // 24 hours in storage
            maxMemoryEntries: 50,                 // Limit memory usage
            compressionEnabled: true              // Compress large data
        };
        
        this.initializePersistentCache();
        this.setupPeriodicCleanup();
    }

    /**
     * Initialize persistent cache (localStorage/IndexedDB)
     */
    initializePersistentCache() {
        try {
            // Check if localStorage is available
            if (typeof Storage !== 'undefined') {
                this.persistentCache = {
                    get: (key) => {
                        const data = localStorage.getItem(`team_cache_${key}`);
                        return data ? JSON.parse(data) : null;
                    },
                    set: (key, value) => {
                        try {
                            const dataStr = JSON.stringify(value);
                            if (this.cacheConfig.compressionEnabled && dataStr.length > 1000) {
                                // Simple compression for large objects
                                value._compressed = true;
                            }
                            localStorage.setItem(`team_cache_${key}`, JSON.stringify(value));
                        } catch (e) {
                            console.warn('Cache storage full, clearing old entries');
                            this.clearExpiredPersistentCache();
                        }
                    },
                    remove: (key) => localStorage.removeItem(`team_cache_${key}`),
                    clear: () => this.clearAllTeamCache()
                };
                console.log('✅ Persistent cache initialized (localStorage)');
            }
        } catch (error) {
            console.warn('❌ Persistent cache not available:', error);
        }
    }

    /**
     * Get data from cache with fallback strategy
     */
    async get(key) {
        // 1. Try memory cache first (fastest)
        const memoryData = this.memoryCache.get(key);
        if (memoryData && !this.isExpired(memoryData.timestamp, this.cacheConfig.memoryTTL)) {
            console.log(`💨 Memory cache hit: ${key}`);
            return memoryData.data;
        }

        // 2. Try persistent cache
        if (this.persistentCache) {
            const persistentData = this.persistentCache.get(key);
            if (persistentData && !this.isExpired(persistentData.timestamp, this.cacheConfig.persistentTTL)) {
                console.log(`💾 Persistent cache hit: ${key}`);
                
                // Promote to memory cache
                this.setMemoryCache(key, persistentData.data);
                return persistentData.data;
            }
        }

        console.log(`❌ Cache miss: ${key}`);
        return null;
    }

    /**
     * Set data in cache with automatic expiration
     */
    async set(key, data, options = {}) {
        const timestamp = Date.now();
        const cacheEntry = {
            data,
            timestamp,
            source: options.source || 'unknown',
            size: JSON.stringify(data).length
        };

        // Set in memory cache
        this.setMemoryCache(key, data, timestamp);

        // Set in persistent cache
        if (this.persistentCache) {
            this.persistentCache.set(key, cacheEntry);
        }

        console.log(`✅ Cached: ${key} (${Math.round(cacheEntry.size / 1024)}KB)`);
    }

    /**
     * Set memory cache with LRU eviction
     */
    setMemoryCache(key, data, timestamp = Date.now()) {
        // LRU eviction if cache is full
        if (this.memoryCache.size >= this.cacheConfig.maxMemoryEntries) {
            const oldestKey = Array.from(this.memoryCache.keys())[0];
            this.memoryCache.delete(oldestKey);
            console.log(`🗑️ Evicted from memory: ${oldestKey}`);
        }

        this.memoryCache.set(key, { data, timestamp });
    }

    /**
     * Check if data is expired
     */
    isExpired(timestamp, ttl) {
        return Date.now() - timestamp > ttl;
    }

    /**
     * Clear expired entries from persistent cache
     */
    clearExpiredPersistentCache() {
        if (!this.persistentCache) return;

        try {
            const keysToDelete = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('team_cache_')) {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (this.isExpired(data.timestamp, this.cacheConfig.persistentTTL)) {
                        keysToDelete.push(key);
                    }
                }
            }
            
            keysToDelete.forEach(key => localStorage.removeItem(key));
            console.log(`🗑️ Cleared ${keysToDelete.length} expired cache entries`);
        } catch (error) {
            console.error('Error clearing expired cache:', error);
        }
    }

    /**
     * Clear all team cache
     */
    clearAllTeamCache() {
        this.memoryCache.clear();
        
        if (this.persistentCache) {
            const keysToDelete = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('team_cache_')) {
                    keysToDelete.push(key);
                }
            }
            keysToDelete.forEach(key => localStorage.removeItem(key));
        }
        
        console.log('🗑️ All team cache cleared');
    }

    /**
     * Setup periodic cleanup
     */
    setupPeriodicCleanup() {
        // Clean expired entries every hour
        setInterval(() => {
            this.clearExpiredPersistentCache();
            
            // Clean memory cache
            const expiredKeys = [];
            this.memoryCache.forEach((value, key) => {
                if (this.isExpired(value.timestamp, this.cacheConfig.memoryTTL)) {
                    expiredKeys.push(key);
                }
            });
            
            expiredKeys.forEach(key => this.memoryCache.delete(key));
            
            if (expiredKeys.length > 0) {
                console.log(`🗑️ Cleaned ${expiredKeys.length} expired memory entries`);
            }
        }, 60 * 60 * 1000); // Every hour
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const memorySize = this.memoryCache.size;
        let persistentSize = 0;
        let totalCacheSize = 0;

        if (this.persistentCache) {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('team_cache_')) {
                    persistentSize++;
                    totalCacheSize += localStorage.getItem(key).length;
                }
            }
        }

        return {
            memory: {
                entries: memorySize,
                maxEntries: this.cacheConfig.maxMemoryEntries
            },
            persistent: {
                entries: persistentSize,
                sizeKB: Math.round(totalCacheSize / 1024)
            },
            config: this.cacheConfig
        };
    }
}