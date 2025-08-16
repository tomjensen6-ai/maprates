// MapRates Pro - API Configuration Management
import { API_PROVIDERS } from './constants.js';

export class APIConfig {
    constructor() {
        this.providers = { ...API_PROVIDERS };
        this.usage = {
            exchangerate: { used: 0, limit: 1500, resetDate: null },
            exchangeratehost: { used: 0, limit: 10000, resetDate: null }
        };
        this.activeProvider = 'exchangeratehost';
        
        // Load API configuration based on environment
        this.isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';
        
        this.apiKeys = this.loadAPIKeys();
    }
    
    loadAPIKeys() {
        if (this.isDevelopment) {
            // Development - API key for direct access
            return {
                exchangeratehost: '2104f185d521db5452124c1e9dc4da4d'
            };
        } else {
            // Production - no API key needed (proxy handles it)
            return {
                exchangeratehost: null // Proxy handles the key
            };
        }
    }
    
    // Main method to fetch exchange rates
    async fetchRates(base = 'USD', symbols = null) {
        let url;
        
        if (this.isDevelopment) {
            // Development - use direct API with key
            const apiKey = this.apiKeys.exchangeratehost;
            url = `https://api.exchangerate.host/live?access_key=${apiKey}&source=${base}`;
            if (symbols) {
                url += `&currencies=${symbols}`;
            }
        } else {
            // Production - use Vercel proxy
            url = `https://maprates-proxy.vercel.app/api/rates?base=${base}`;
            if (symbols) {
                url += `&symbols=${symbols}`;
            }
        }
        
        console.log(`Fetching rates from: ${url.replace(/access_key=[^&]+/, 'access_key=HIDDEN')}`);
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Track usage
            this.usage.exchangeratehost.used++;
            
            // Handle different response formats
            if (this.isDevelopment && data.quotes) {
                // Direct API returns quotes format
                return this.convertQuotesToRates(data);
            } else if (data.rates) {
                // Proxy returns rates format
                return data;
            } else {
                throw new Error('Invalid response format');
            }
            
        } catch (error) {
            console.error('Error fetching rates:', error);
            throw error;
        }
    }
    
    // Convert exchangerate.host quotes format to standard rates format
    convertQuotesToRates(data) {
        const rates = {};
        const source = data.source || 'USD';
        
        if (data.quotes) {
            Object.keys(data.quotes).forEach(key => {
                // Remove source currency from key (e.g., "USDEUR" -> "EUR")
                const currency = key.replace(source, '');
                rates[currency] = data.quotes[key];
            });
        }
        
        return {
            success: data.success,
            base: source,
            date: data.date || new Date().toISOString().split('T')[0],
            rates: rates,
            timestamp: data.timestamp || Date.now()
        };
    }
    
    // Get a single rate
    async getRate(from, to) {
        const data = await this.fetchRates(from, to);
        return data.rates[to] || null;
    }
    
    // Get multiple rates
    async getRates(from, currencies = []) {
        const symbols = currencies.join(',');
        return await this.fetchRates(from, symbols);
    }
    
    // Check if we should use proxy or direct API
    isUsingProxy() {
        return !this.isDevelopment;
    }
    
    // Get current API status
    getAPIStatus() {
        return {
            provider: this.activeProvider,
            mode: this.isUsingProxy() ? 'Proxy (Secure)' : 'Direct (Development)',
            usage: this.usage.exchangeratehost.used,
            limit: this.usage.exchangeratehost.limit,
            remaining: this.usage.exchangeratehost.limit - this.usage.exchangeratehost.used
        };
    }
}

// Global instance
export const apiConfig = new APIConfig();

// Make available globally for other modules
window.apiConfig = apiConfig;