/**
 * APIConfigManager - Centralized API configuration and management
 * Handles API keys, providers, usage tracking, and rate limiting
 * NOW WITH VERCEL PROXY SUPPORT FOR PRODUCTION
 */
class APIConfigManager {
    constructor() {
        this.isInitialized = false;
        
        // Detect environment
        this.isDevelopment = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1';
        this.isProduction = !this.isDevelopment;
        
        // API provider configurations
        this.providers = {
            exchangeratehost: {
                name: 'ExchangeRate.host',
                baseUrl: this.isDevelopment 
                    ? 'https://api.exchangerate.host'
                    : 'https://maprates-proxy.vercel.app/api/rates', // Use proxy in production
                apiKey: this.isDevelopment 
                    ? '2104f185d521db5452124c1e9dc4da4d'  // Only use key in development
                    : null,  // No key needed in production (proxy handles it)
                rateLimit: 10000,
                available: true,
                corsEnabled: true,
                useProxy: !this.isDevelopment  // Flag to indicate proxy usage
            },
            exchangerate: {
                name: 'ExchangeRate-API',
                baseUrl: 'https://api.exchangerate-api.com/v4',
                rateLimit: 1500,
                available: true,
                corsEnabled: true
            },
            fixer: {
                name: 'Fixer.io',
                baseUrl: 'https://api.fixer.io/v1',
                apiKey: null,
                rateLimit: 100,
                available: false
            },
            currencyapi: {
                name: 'CurrencyAPI',
                baseUrl: 'https://api.currencyapi.com/v3',
                apiKey: null,
                rateLimit: 300,
                available: false
            }
        };
        
        // API usage tracking
        this.usage = {
            exchangerate: { used: 0, limit: 1500, resetDate: null },
            exchangeratehost: { used: 0, limit: 10000, resetDate: null },
            fixer: { used: 0, limit: 100, resetDate: null },
            currencyapi: { used: 0, limit: 300, resetDate: null }
        };
        
        // Active provider
        this.activeProvider = 'exchangeratehost';
        
        // Load saved configuration
        this.loadConfiguration();
    }

    /**
     * Initialize the API config manager
     */
    init() {
        if (this.isInitialized) return;
        
        // Load any saved API keys from localStorage (for development)
        if (this.isDevelopment) {
            this.loadSavedAPIKeys();
        }
        
        // Reset usage counters if needed
        this.checkUsageReset();
        
        this.isInitialized = true;
        console.log(`✅ APIConfigManager initialized in ${this.isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);
        console.log(`🔐 Using ${this.providers.exchangeratehost.useProxy ? 'PROXY' : 'DIRECT API'} for ExchangeRate.host`);
    }

    /**
     * Build API URL based on environment
     */
    buildAPIUrl(providerName, params = {}) {
        const provider = this.providers[providerName];
        if (!provider) {
            console.error(`Provider ${providerName} not found`);
            return null;
        }
        
        // Special handling for exchangeratehost
        if (providerName === 'exchangeratehost') {
            if (provider.useProxy) {
                // Production - use proxy (simple format)
                let url = `${provider.baseUrl}?base=${params.base || 'USD'}`;
                if (params.symbols) {
                    url += `&symbols=${params.symbols}`;
                }
                return url;
            } else {
                // Development - use direct API with key
                let url = `${provider.baseUrl}/live?access_key=${provider.apiKey}&source=${params.base || 'USD'}`;
                if (params.symbols) {
                    url += `&currencies=${params.symbols}`;
                }
                return url;
            }
        }
        
        // Default URL building for other providers
        return provider.baseUrl;
    }

    /**
     * Fetch exchange rates with automatic proxy/direct detection
     */
    async fetchRates(base = 'USD', symbols = null) {
        const url = this.buildAPIUrl('exchangeratehost', { base, symbols });
        
        console.log(`Fetching from: ${url?.replace(/access_key=[^&]+/, 'access_key=HIDDEN')}`);
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Track usage
            this.trackUsage('exchangeratehost');
            
            // Handle different response formats
            if (!this.providers.exchangeratehost.useProxy && data.quotes) {
                // Direct API returns quotes format - convert it
                return this.convertQuotesToRates(data);
            } else if (data.rates) {
                // Proxy returns standard rates format
                return data;
            } else {
                throw new Error('Invalid response format');
            }
            
        } catch (error) {
            console.error('Error fetching rates:', error);
            throw error;
        }
    }

    /**
     * Convert exchangerate.host quotes format to standard rates format
     */
    convertQuotesToRates(data) {
        const rates = {};
        const source = data.source || 'USD';
        
        if (data.quotes) {
            Object.keys(data.quotes).forEach(key => {
                // Remove source currency from key (e.g., "USDEUR" -> "EUR")
                const currency = key.replace(source, '');
                if (currency) {
                    rates[currency] = data.quotes[key];
                }
            });
        }
        
        return {
            success: data.success || true,
            base: source,
            date: data.date || new Date().toISOString().split('T')[0],
            rates: rates,
            timestamp: data.timestamp || Math.floor(Date.now() / 1000)
        };
    }

    /**
     * Get all providers
     */
    getProviders() {
        return this.providers;
    }

    /**
     * Get a specific provider
     */
    getProvider(name) {
        return this.providers[name];
    }

    /**
     * Get active provider
     */
    getActiveProvider() {
        return this.providers[this.activeProvider];
    }

    /**
     * Get API key for a specific provider
     */
    getAPIKey(providerName) {
        if (this.providers[providerName] && this.providers[providerName].apiKey) {
            return this.providers[providerName].apiKey;
        }
        return null;
    }

    /**
     * Set active provider
     */
    setActiveProvider(providerName) {
        if (this.providers[providerName] && this.providers[providerName].available) {
            this.activeProvider = providerName;
            this.saveConfiguration();
            console.log(`✅ Active API provider set to: ${providerName}`);
            return true;
        }
        console.error(`❌ Provider ${providerName} not available`);
        return false;
    }

    /**
     * Track API usage
     */
    trackUsage(providerName) {
        if (this.usage[providerName]) {
            this.usage[providerName].used++;
            this.saveUsage();
            
            // Check if limit is approaching
            const usage = this.usage[providerName];
            const percentUsed = (usage.used / usage.limit) * 100;
            
            if (percentUsed >= 90) {
                console.warn(`⚠️ API usage warning: ${providerName} at ${percentUsed.toFixed(1)}% of limit`);
            }
            
            return usage.used;
        }
        return 0;
    }

    /**
     * Get usage statistics
     */
    getUsageStats() {
        const stats = {};
        for (const [provider, usage] of Object.entries(this.usage)) {
            stats[provider] = {
                used: usage.used,
                limit: usage.limit,
                percentage: ((usage.used / usage.limit) * 100).toFixed(1),
                remaining: usage.limit - usage.used
            };
        }
        return stats;
    }

    /**
     * Get total API usage across all providers
     */
    getTotalUsage() {
        return Object.values(this.usage).reduce((sum, usage) => sum + usage.used, 0);
    }

    /**
     * Reset usage counters
     */
    resetUsage(providerName = null) {
        if (providerName && this.usage[providerName]) {
            this.usage[providerName].used = 0;
            this.usage[providerName].resetDate = new Date().toISOString();
        } else {
            // Reset all
            for (const provider in this.usage) {
                this.usage[provider].used = 0;
                this.usage[provider].resetDate = new Date().toISOString();
            }
        }
        this.saveUsage();
    }

    /**
     * Check if usage should be reset (monthly)
     */
    checkUsageReset() {
        const now = new Date();
        
        for (const [provider, usage] of Object.entries(this.usage)) {
            if (usage.resetDate) {
                const resetDate = new Date(usage.resetDate);
                const daysSinceReset = (now - resetDate) / (1000 * 60 * 60 * 24);
                
                // Reset monthly (30 days)
                if (daysSinceReset >= 30) {
                    this.resetUsage(provider);
                    console.log(`📊 Monthly usage reset for ${provider}`);
                }
            } else {
                // First time, set reset date
                usage.resetDate = now.toISOString();
            }
        }
    }

    /**
     * Get available providers
     */
    getAvailableProviders() {
        return Object.entries(this.providers)
            .filter(([_, provider]) => provider.available)
            .map(([name, provider]) => ({
                name,
                ...provider
            }));
    }

    /**
     * Save API key to localStorage
     */
    saveAPIKey(providerName, apiKey) {
        const keys = JSON.parse(localStorage.getItem('apiKeys') || '{}');
        keys[providerName] = apiKey;
        localStorage.setItem('apiKeys', JSON.stringify(keys));
    }

    /**
     * Load saved API keys
     */
    loadSavedAPIKeys() {
        const keys = JSON.parse(localStorage.getItem('apiKeys') || '{}');
        
        for (const [provider, apiKey] of Object.entries(keys)) {
            if (this.providers[provider]) {
                this.providers[provider].apiKey = apiKey;
                this.providers[provider].available = true;
            }
        }
    }

    /**
     * Save configuration
     */
    saveConfiguration() {
        const config = {
            activeProvider: this.activeProvider,
            providers: {}
        };
        
        // Save only necessary provider info
        for (const [name, provider] of Object.entries(this.providers)) {
            config.providers[name] = {
                available: provider.available,
                apiKey: this.isDevelopment ? provider.apiKey : null // Only save keys in development
            };
        }
        
        localStorage.setItem('apiConfig', JSON.stringify(config));
    }

    /**
     * Load configuration
     */
    loadConfiguration() {
        const saved = localStorage.getItem('apiConfig');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                
                if (config.activeProvider) {
                    this.activeProvider = config.activeProvider;
                }
                
                if (config.providers && this.isDevelopment) {
                    for (const [name, settings] of Object.entries(config.providers)) {
                        if (this.providers[name]) {
                            if (settings.apiKey) {
                                this.providers[name].apiKey = settings.apiKey;
                            }
                            if (settings.available !== undefined) {
                                this.providers[name].available = settings.available;
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading API configuration:', error);
            }
        }
    }

    /**
     * Save usage data
     */
    saveUsage() {
        localStorage.setItem('apiUsage', JSON.stringify(this.usage));
    }

    /**
     * Load usage data
     */
    loadUsage() {
        const saved = localStorage.getItem('apiUsage');
        if (saved) {
            try {
                const usage = JSON.parse(saved);
                this.usage = { ...this.usage, ...usage };
            } catch (error) {
                console.error('Error loading API usage:', error);
            }
        }
    }

    /**
     * Get API status for display
     */
    getAPIStatus() {
        const totalUsed = this.getTotalUsage();
        const activeProvider = this.getActiveProvider();
        const usage = this.usage[this.activeProvider];
        
        return {
            provider: activeProvider.name,
            mode: this.isDevelopment ? 'Development (Direct API)' : 'Production (Secure Proxy)',
            used: usage ? usage.used : 0,
            limit: usage ? usage.limit : 0,
            totalUsed,
            dataMode: totalUsed > 0 ? 'Live Data' : 'Sample Data'
        };
    }

    /**
     * Check if can make API request
     */
    canMakeRequest(providerName = null) {
        const provider = providerName || this.activeProvider;
        const usage = this.usage[provider];
        
        if (!usage) return true;
        
        return usage.used < usage.limit;
    }
}

// Create and export instance
const apiConfigManager = new APIConfigManager();

// Expose to window for debugging
window.apiConfigManager = apiConfigManager;

export default apiConfigManager;
