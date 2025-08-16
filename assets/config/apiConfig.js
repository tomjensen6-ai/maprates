// MapRates Pro - API Configuration Management
import { API_PROVIDERS } from './constants.js';

export class APIConfig {
    constructor() {
        this.providers = { ...API_PROVIDERS };
        this.usage = {
            exchangerate: { used: 0, limit: 1500, resetDate: null },
            exchangeratehost: { used: 0, limit: 1000, resetDate: null }
        };
        this.activeProvider = 'exchangerate';
        
        // Load API keys based on environment
        this.apiKeys = this.loadAPIKeys();
    }
    
    loadAPIKeys() {
        // Check if we're in development
        const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1';
        
        if (isDevelopment) {
            // Development keys
            return {
                exchangeratehost: '2104f185d521db5452124c1e9dc4da4d'
            };
        } else {
            // Production - load from secure source
            // Option 1: From global config (loaded separately)
            if (window.PRODUCTION_API_KEYS) {
                return window.PRODUCTION_API_KEYS;
            }
            
            // Option 2: From meta tag (set by server)
            const metaKey = document.querySelector('meta[name="api-key-exchangerate"]');
            if (metaKey) {
                return {
                    exchangeratehost: metaKey.content
                };
            }
            
            // Fallback (not recommended for production)
            return {
                exchangeratehost: 'production-key-here'
            };
        }
    }
}

// Global instance
export const apiConfig = new APIConfig();