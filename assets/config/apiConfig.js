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
// Football Data API Configuration
export class FootballAPIConfig {
    constructor() {
        this.baseURL = 'https://api.football-data.org/v4';
        this.rateLimitPerMinute = 10;
        this.cacheDuration = 3600000; // 1 hour
        this.requestCount = 0;
        this.lastReset = Date.now();
        
        // Your actual API key here
        this.apiKey = '7ad8acb4552142488be897e56d4aa652';
        this.usage = { used: 0, limit: 10, resetTime: 60000 }; // 10 per minute
    }

    async makeRequest(endpoint) {
        // Rate limiting check
        if (this.requestCount >= this.rateLimitPerMinute) {
            const timeSinceReset = Date.now() - this.lastReset;
            if (timeSinceReset < 60000) {
                throw new Error('Rate limit exceeded - please wait');
            } else {
                this.requestCount = 0;
                this.lastReset = Date.now();
            }
        }

        if (!this.apiKey || this.apiKey.length !== 32) {
    throw new Error('Football API key not configured');
}

        this.requestCount++;
        const url = `${this.baseURL}${endpoint}`;
        
        console.log(`🚀 Football API request: ${endpoint}`);
        
        const response = await fetch(url, {
            headers: {
                'X-Auth-Token': this.apiKey,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Football API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`✅ Football API success: ${endpoint}`);
        return data;
    }

    getAPIStatus() {
        return {
            provider: 'football-data.org',
            hasKey: this.apiKey && this.apiKey.length === 32,
            requestCount: this.requestCount,
            limit: this.rateLimitPerMinute,
            remaining: this.rateLimitPerMinute - this.requestCount
        };
    }
}



// API-Football Configuration (RapidAPI)
export class APIFootballConfig {
    constructor() {
        this.baseURL = 'https://v3.football.api-sports.io';
        this.rateLimitPerMinute = 100; // Free plan daily limit
        this.cacheDuration = 3600000; // 1 hour
        this.requestCount = 0;
        this.dailyUsage = 0;
        this.lastReset = Date.now();
        
        // Your API-Football API key (get from dashboard)
        this.apiKey = '750e6665fbee3c22baa5d2807172294e'; // Replace with your actual key
        this.usage = { used: 0, limit: 100, resetTime: 86400000 }; // 100 per day
        
        // Country to league mapping for testing
        this.knownLeagues = {
            'Norway': 103,      // Eliteserien 
            'Sweden': 113,      // Allsvenskan
            'Denmark': 119,     // Superligaen
            'Australia': 188,   // A-League
            'Nigeria': 387,     // NPFL
            'Finland': 244,     // Veikkausliiga
            'Poland': 106,      // Ekstraklasa
            'Belgium': 144,     // Pro League
            'Switzerland': 207, // Super League
            'Austria': 218      // Bundesliga
        };
    }

    async makeRequest(endpoint) {
        // Daily limit check
        if (this.dailyUsage >= 100) {
            throw new Error('Daily API limit reached (100/day on free plan)');
        }

        // Rate limiting check (prevent too many rapid requests)
        if (this.requestCount >= 10) {
            const timeSinceReset = Date.now() - this.lastReset;
            if (timeSinceReset < 60000) { // 1 minute cooldown
                throw new Error('Rate limit exceeded - wait 1 minute');
            } else {
                this.requestCount = 0;
                this.lastReset = Date.now();
            }
        }

        if (!this.apiKey || this.apiKey === 'YOUR_API_FOOTBALL_KEY_HERE') {
            throw new Error('API-Football key not configured');
        }

        this.requestCount++;
        this.dailyUsage++;
        const url = `${this.baseURL}${endpoint}`;
        
        console.log(`🏈 API-Football request: ${endpoint} (${this.dailyUsage}/100 daily)`);
        
        const response = await fetch(url, {
            headers: {
                'X-RapidAPI-Key': this.apiKey,
                'X-RapidAPI-Host': 'v3.football.api-sports.io'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API-Football error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`✅ API-Football success: ${endpoint}`);
        return data;
    }

    async getCountries() {
        return await this.makeRequest('/countries');
    }

    async getLeagues(countryName) {
        return await this.makeRequest(`/leagues?country=${encodeURIComponent(countryName)}`);
    }

    async getTeams(leagueId, season = '2024') {
        return await this.makeRequest(`/teams?league=${leagueId}&season=${season}`);
    }

    async getStandings(leagueId, season = '2024') {
        return await this.makeRequest(`/standings?league=${leagueId}&season=${season}`);
    }

    getAPIStatus() {
        return {
            provider: 'api-football.com',
            hasKey: this.apiKey && this.apiKey !== 'YOUR_API_FOOTBALL_KEY_HERE',
            dailyUsage: this.dailyUsage,
            dailyLimit: 100,
            remaining: 100 - this.dailyUsage,
            requestCount: this.requestCount
        };
    }

    // Test method for data quality assessment
    async testCountryData(countryName) {
        try {
            console.log(`🧪 Testing API-Football data for ${countryName}`);
            
            // Step 1: Get leagues for country
            const leaguesData = await this.getLeagues(countryName);
            const leagues = leaguesData.response || [];
            
            if (leagues.length === 0) {
                return {
                    country: countryName,
                    status: 'no_data',
                    leagues: 0,
                    teams: 0,
                    dataQuality: 'none'
                };
            }

            // Step 2: Find top division (prioritize by type and level)
            const topLeague = leagues.find(league => 
                league.league.type === 'League' && 
                (!league.league.name.toLowerCase().includes('women') && 
                 !league.league.name.toLowerCase().includes('cup'))
            ) || leagues[0];

            console.log(`🎯 Selected league for ${countryName}: ${topLeague.league.name}`);

            // Step 3: Get teams in top league
            const teamsData = await this.getTeams(topLeague.league.id);
            const teams = teamsData.response || [];

            // Step 4: Analyze data quality
            const teamsWithVenues = teams.filter(t => t.venue && t.venue.name);
            const teamsWithAddresses = teams.filter(t => t.venue && t.venue.address);
            
            return {
                country: countryName,
                status: 'success',
                leagues: leagues.length,
                selectedLeague: topLeague.league.name,
                teams: teams.length,
                teamsWithVenues: teamsWithVenues.length,
                teamsWithAddresses: teamsWithAddresses.length,
                dataQuality: this.assessDataQuality(teams),
                sampleTeams: teams.slice(0, 3).map(t => ({
                    name: t.team.name,
                    venue: t.venue?.name || 'No venue',
                    address: t.venue?.address || 'No address',
                    city: t.venue?.city || 'No city'
                }))
            };

        } catch (error) {
            return {
                country: countryName,
                status: 'error',
                error: error.message,
                dataQuality: 'error'
            };
        }
    }

    assessDataQuality(teams) {
        if (teams.length === 0) return 'none';
        
        const venueScore = teams.filter(t => t.venue?.name).length / teams.length;
        const addressScore = teams.filter(t => t.venue?.address).length / teams.length;
        
        if (venueScore > 0.8 && addressScore > 0.5) return 'excellent';
        if (venueScore > 0.6 && addressScore > 0.3) return 'good';
        if (venueScore > 0.3) return 'fair';
        return 'poor';
    }
}

// Global football API instance
export const footballAPIConfig = new FootballAPIConfig();

// Global instance
export const apiConfig = new APIConfig();

// Make available globally for other modules
window.apiConfig = apiConfig;

// Global API-Football instance
export const apiFootballConfig = new APIFootballConfig();