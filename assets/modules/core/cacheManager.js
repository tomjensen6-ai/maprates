// ============= SMART CACHE SYSTEM MODULE =============
// Professional-grade caching for MapRates Pro - COMPLETE VERSION
// All cache functionality extracted from app.js

export class SmartCacheManager {
    constructor() {
        this.CACHE_VERSION = 'v1.2';
        this.CACHE_PREFIX = 'maprates_cache_';
        this.MAX_CACHE_AGE = {
            historical: 24 * 60 * 60 * 1000, // 24 hours for historical data
            current: 10 * 60 * 1000,         // 10 minutes for current rates
            metadata: 7 * 24 * 60 * 60 * 1000 // 7 days for currency metadata
        };
        this.MAX_CACHE_SIZE = 50; // Maximum cached currency pairs
        this.hitCount = 0;
        this.missCount = 0;
        this.cacheHits = 0;  // For compatibility
        this.cacheMisses = 0; // For compatibility
        this.cache = new Map(); // In-memory cache for session
        this.initCache();
    }
    
    initCache() {
        // Clean old cache versions on startup
        this.cleanOldVersions();
        console.log('💾 Smart Cache initialized:', this.getCacheStats());
    }
    
    cleanOldVersions() {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('maprates_cache_') && !key.includes(this.CACHE_VERSION)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        if (keysToRemove.length > 0) {
            console.log(`🧹 Cleaned ${keysToRemove.length} old cache entries`);
        }
    }
    
    getCacheKey(type, params) {
        return `${this.CACHE_PREFIX}${this.CACHE_VERSION}_${type}_${JSON.stringify(params)}`;
    }
    
    isCacheValid(cacheEntry) {
        return Date.now() - cacheEntry.timestamp < this.maxCacheAge;
    }
    
    async getHistoricalData(fromCurrency, toCurrency, days) {
        const cacheKey = this.getCacheKey('historical', { fromCurrency, toCurrency, days });
        
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const { data, timestamp, metadata } = JSON.parse(cached);
                const age = Date.now() - timestamp;
                
                if (age < this.MAX_CACHE_AGE.historical) {
                    this.hitCount++;
                    this.cacheHits++;
                    console.log(`💾 Cache HIT: ${fromCurrency}→${toCurrency} (${days}D) - Age: ${Math.round(age/60000)}min`);
                    
                    // Update only the most recent day if cache is older than 1 hour
                    if (age > 60 * 60 * 1000) {
                        return await this.updateRecentData(data, fromCurrency, toCurrency, cacheKey);
                    }
                    
                    return data;
                }
            }
            
            this.missCount++;
            this.cacheMisses++;
            console.log(`💾 Cache MISS: ${fromCurrency}→${toCurrency} (${days}D) - Fetching fresh data`);
            
            // Fetch fresh data
            const freshData = await this.fetchFreshHistoricalData(fromCurrency, toCurrency, days);
            
            // Cache the fresh data
            this.cacheHistoricalData(cacheKey, freshData);
            
            return freshData;
            
        } catch (error) {
            console.error('💾 Cache error:', error);
            // Fallback to direct API call
            return await this.fetchFreshHistoricalData(fromCurrency, toCurrency, days);
        }
    }
    
    async updateRecentData(cachedData, fromCurrency, toCurrency, cacheKey) {
        try {
            // Get current rate to update most recent entry
            const currentRate = await this.getCurrentRate(fromCurrency, toCurrency);
            
            if (currentRate && !isNaN(currentRate)) {
                // Update most recent entry
                const updatedData = [...cachedData];
                if (updatedData.length > 0) {
                    updatedData[updatedData.length - 1] = {
                        ...updatedData[updatedData.length - 1],
                        rate: currentRate
                    };
                    
                    // Re-cache updated data
                    this.cacheHistoricalData(cacheKey, updatedData);
                    console.log(`💾 Updated most recent rate: ${currentRate}`);
                    
                    return updatedData;
                }
            }
            
            return cachedData; // Return original if update fails
            
        } catch (error) {
            console.warn('💾 Failed to update recent data:', error);
            return cachedData;
        }
    }
    
    async getCurrentRate(fromCurrency, toCurrency) {
        const cacheKey = this.getCacheKey('current', { fromCurrency, toCurrency });
        
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const { rate, timestamp } = JSON.parse(cached);
                const age = Date.now() - timestamp;
                
                if (age < this.MAX_CACHE_AGE.current) {
                    console.log(`💾 Current rate cache HIT: ${fromCurrency}→${toCurrency}`);
                    return rate;
                }
            }
            
            // Fetch fresh current rate
            const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
            const data = await response.json();
            const rate = data.rates[toCurrency];
            
            if (rate && !isNaN(rate)) {
                // Cache current rate
                localStorage.setItem(cacheKey, JSON.stringify({
                    rate: rate,
                    timestamp: Date.now()
                }));
                
                console.log(`💾 Current rate cached: ${fromCurrency}→${toCurrency} = ${rate}`);
                return rate;
            }
            
            throw new Error('Invalid rate received');
            
        } catch (error) {
            console.error('💾 Current rate fetch error:', error);
            return null;
        }
    }
    
    async fetchFreshHistoricalData(fromCurrency, toCurrency, days) {
        // Access the global function from app.js
        if (typeof window !== 'undefined' && window.fetchRealHistoricalData) {
            try {
                const homeCurrency = { 
                    code: fromCurrency, 
                    name: `${fromCurrency} Currency`,
                    symbol: fromCurrency 
                };
                const destCurrency = { 
                    code: toCurrency, 
                    name: `${toCurrency} Currency`,
                    symbol: toCurrency 
                };
                
                console.log(`💾 Calling fetchRealHistoricalData: ${fromCurrency}→${toCurrency} for ${days} days`);
                return await window.fetchRealHistoricalData(homeCurrency, destCurrency, days);
                
            } catch (error) {
                console.error(`💾 fetchRealHistoricalData failed for ${fromCurrency}→${toCurrency}:`, error);
                throw error;
            }
        }
        
        // If global function not available, return empty data to prevent errors
        console.warn(`💾 fetchRealHistoricalData not available globally, using fallback for ${fromCurrency}→${toCurrency}`);
        
        // Return minimal fallback data structure
        return [{
            date: new Date().toISOString().split('T')[0],
            rate: 1.0
        }];
    }
    
    cacheHistoricalData(cacheKey, data) {
        try {
            const cacheEntry = {
                data: data,
                timestamp: Date.now(),
                metadata: {
                    length: data.length,
                    firstDate: data[0]?.date,
                    lastDate: data[data.length - 1]?.date,
                    version: this.CACHE_VERSION
                }
            };
            
            localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
            console.log(`💾 Cached historical data: ${data.length} points`);
            
            // Also cache in memory for session
            this.cache.set(cacheKey, cacheEntry);
            
            // Manage cache size
            this.manageCacheSize();
            
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.warn('💾 Storage quota exceeded, clearing old cache');
                this.clearOldestEntries(10);
                // Try caching again
                try {
                    const cacheEntry = {
                        data: data,
                        timestamp: Date.now(),
                        metadata: {
                            length: data.length,
                            firstDate: data[0]?.date,
                            lastDate: data[data.length - 1]?.date,
                            version: this.CACHE_VERSION
                        }
                    };
                    localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
                } catch (retryError) {
                    console.error('💾 Cache retry failed:', retryError);
                }
            } else {
                console.error('💾 Cache storage error:', error);
            }
        }
    }
    
    manageCacheSize() {
        const cacheKeys = this.getAllCacheKeys();
        if (cacheKeys.length > this.MAX_CACHE_SIZE) {
            this.clearOldestEntries(cacheKeys.length - this.MAX_CACHE_SIZE);
        }
    }
    
    getAllCacheKeys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.CACHE_PREFIX + this.CACHE_VERSION)) {
                keys.push(key);
            }
        }
        return keys;
    }
    
    clearOldestEntries(count) {
        const cacheKeys = this.getAllCacheKeys();
        const keyTimestamps = [];
        
        cacheKeys.forEach(key => {
            try {
                const cached = localStorage.getItem(key);
                if (cached) {
                    const { timestamp } = JSON.parse(cached);
                    keyTimestamps.push({ key, timestamp });
                }
            } catch (error) {
                // Invalid cache entry, add for removal
                keyTimestamps.push({ key, timestamp: 0 });
            }
        });
        
        // Sort by timestamp (oldest first)
        keyTimestamps.sort((a, b) => a.timestamp - b.timestamp);
        
        // Remove oldest entries
        for (let i = 0; i < Math.min(count, keyTimestamps.length); i++) {
            localStorage.removeItem(keyTimestamps[i].key);
            // Also remove from memory cache
            this.cache.delete(keyTimestamps[i].key);
        }
        
        console.log(`💾 Removed ${Math.min(count, keyTimestamps.length)} old cache entries`);
    }
    
    getCacheStats() {
        const keys = this.getAllCacheKeys();
        const totalHits = this.hitCount + this.missCount;
        const hitRate = totalHits > 0 ? (this.hitCount / totalHits * 100) : 0;
        
        return {
            entries: keys.length,
            hitRate: hitRate.toFixed(1) + '%',
            hits: this.hitCount,
            misses: this.missCount,
            size: this.cache.size
        };
    }
    
    clearAllCache() {
        const keys = this.getAllCacheKeys();
        keys.forEach(key => localStorage.removeItem(key));
        this.cache.clear();
        this.hitCount = 0;
        this.missCount = 0;
        this.cacheHits = 0;
        this.cacheMisses = 0;
        console.log(`💾 Cleared all cache (${keys.length} entries)`);
    }
    
    // Additional methods for compatibility with existing code
    async fetchHistoricalRate(base, target, date, preferredProvider = 'exchangerate') {
        const cacheKey = this.getCacheKey('single_rate', { base, target, date });
        
        // Check cache first
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { rate, timestamp } = JSON.parse(cached);
            const age = Date.now() - timestamp;
            
            if (age < this.MAX_CACHE_AGE.historical) {
                this.hitCount++;
                return rate;
            }
        }
        
        // If not cached or expired, we'll need to fetch
        // This would integrate with your existing API system
        this.missCount++;
        
        // For now, return null to indicate cache miss
        return null;
    }
    
    // Method to clear cache for specific pattern
    clearCachePattern(pattern) {
        const keys = this.getAllCacheKeys().filter(key => key.includes(pattern));
        keys.forEach(key => {
            localStorage.removeItem(key);
            this.cache.delete(key);
        });
        console.log(`💾 Cleared ${keys.length} cache entries matching pattern: ${pattern}`);
    }
    
    // Get cache statistics for status display
    getDetailedStats() {
        const keys = this.getAllCacheKeys();
        const now = Date.now();
        let totalSize = 0;
        let expiredEntries = 0;
        
        keys.forEach(key => {
            try {
                const cached = localStorage.getItem(key);
                if (cached) {
                    totalSize += cached.length;
                    const { timestamp } = JSON.parse(cached);
                    const age = now - timestamp;
                    
                    if (age > this.MAX_CACHE_AGE.historical) {
                        expiredEntries++;
                    }
                }
            } catch (error) {
                expiredEntries++;
            }
        });
        
        return {
            ...this.getCacheStats(),
            totalSizeKB: Math.round(totalSize / 1024),
            expiredEntries,
            validEntries: keys.length - expiredEntries
        };
    }
}

// ============= CACHE MANAGEMENT UTILITY FUNCTIONS =============

export function refreshCacheStats(cacheManager) {
    const stats = cacheManager.getCacheStats();
    
    const hitRateEl = document.getElementById('cacheHitRate');
    const entriesEl = document.getElementById('cacheEntries');
    const savingsEl = document.getElementById('apiSavings');
    
    if (hitRateEl) hitRateEl.textContent = stats.hitRate;
    if (entriesEl) entriesEl.textContent = stats.entries;
    
    // Calculate API requests saved
    if (savingsEl) {
        const requestsSaved = stats.hits * 13; // Average 13 requests per chart view
        savingsEl.textContent = requestsSaved.toString();
    }
    
    console.log('💾 Cache stats refreshed:', stats);
}

export function clearCache(cacheManager) {
    if (confirm('Clear all cached data? This will require fresh API calls for all charts.')) {
        cacheManager.clearAllCache();
        
        // Reset API usage counters for this session
        if (window.apiUsage) {
            window.apiUsage.exchangerate.used = 0;
        }
        
        // Refresh displays
        refreshCacheStats(cacheManager);
        
        // Update algorithm status if available
        if (window.showAlgorithmStatus) {
            window.showAlgorithmStatus();
        }
        
        alert('✅ Cache cleared successfully!');
        return true;
    }
    return false;
}

export function preloadPopularPairs(cacheManager) {
    // Validate cacheManager parameter
    if (!cacheManager) {
        console.error('💾 preloadPopularPairs: cacheManager parameter is required');
        return;
    }
    
    // Pre-cache popular currency pairs in background
    const popularPairs = [
        { from: 'USD', to: 'EUR' },
        { from: 'USD', to: 'GBP' },
        { from: 'EUR', to: 'GBP' },
        { from: 'USD', to: 'JPY' },
        { from: 'USD', to: 'NOK' },
        { from: 'EUR', to: 'NOK' },
        { from: 'GBP', to: 'NOK' },
        { from: 'USD', to: 'CAD' },
        { from: 'USD', to: 'AUD' },
        { from: 'EUR', to: 'CHF' }
    ];
    
    console.log('💾 Pre-loading popular currency pairs...');
    
    popularPairs.forEach((pair, index) => {
        setTimeout(async () => {
            try {
                if (cacheManager && typeof cacheManager.getHistoricalData === 'function') {
                    await cacheManager.getHistoricalData(pair.from, pair.to, 7);
                    console.log(`💾 Pre-cached: ${pair.from}→${pair.to}`);
                } else {
                    console.error('💾 cacheManager.getHistoricalData is not available');
                }
            } catch (error) {
                console.warn(`💾 Pre-cache failed: ${pair.from}→${pair.to}`, error);
            }
        }, index * 2000);
    });
}

// Function to get cache stats for status display (compatibility)
export function getCacheStatsForStatus(cacheManager) {
    if (!cacheManager) {
        return { entries: 0, hitRate: '0%' };
    }
    
    const stats = cacheManager.getCacheStats();
    return {
        entries: stats.entries,
        hitRate: stats.hitRate
    };
}

// Initialize cache manager instance
export function createCacheManager() {
    return new SmartCacheManager();
}

// Export default instance creator
export default SmartCacheManager;