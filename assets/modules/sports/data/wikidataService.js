/**
 * Wikidata SPARQL Service - FREE Global Football Data
 */

export class WikidataService {
    constructor() {
        this.endpoint = 'https://query.wikidata.org/sparql';
        this.userAgent = 'MapRates-Sports/1.0 (https://maprates.com)';
        this.rateLimiter = {
            lastRequest: 0,
            minInterval: 1000  // 1 second between requests
        };
    }

    /**
     * Get all football teams for a country
     */
    async getCountryTeams(countryCode, wikidataId) {
        await this.respectRateLimit();

        const query = this.buildTeamsQuery(wikidataId);
        
        try {
            console.log(`🔄 Fetching Wikidata teams for ${countryCode}...`);
            
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/sparql-query',
                    'Accept': 'application/sparql-results+json',
                    'User-Agent': this.userAgent
                },
                body: query
            });

            if (!response.ok) {
                throw new Error(`Wikidata API error: ${response.status}`);
            }

            const data = await response.json();
            const teams = this.transformWikidataResults(data.results.bindings, countryCode);
            
            console.log(`✅ Wikidata: ${teams.length} teams found for ${countryCode}`);
            return teams;

        } catch (error) {
            console.error(`❌ Wikidata error for ${countryCode}:`, error);
            return [];
        }
    }

    /**
     * Build SPARQL query for football teams
     */
    buildTeamsQuery(wikidataId) {
        return `
            SELECT DISTINCT ?team ?teamLabel ?shortName ?founded ?website ?stadium ?stadiumLabel 
                   ?capacity ?coordinate ?league ?leagueLabel ?city ?cityLabel WHERE {
                
                # Football clubs in the country
                ?team wdt:P31/wdt:P279* wd:Q476028 .  # Instance of football club
                ?team wdt:P17 wd:${wikidataId} .      # Country
                
                # Optional: Short name / nickname
                OPTIONAL { ?team wdt:P1813 ?shortName . }
                
                # Optional: Founded date
                OPTIONAL { ?team wdt:P571 ?founded . }
                
                # Optional: Official website
                OPTIONAL { ?team wdt:P856 ?website . }
                
                # Optional: Stadium information
                OPTIONAL { 
                    ?team wdt:P115 ?stadium .          # Stadium
                    ?stadium wdt:P1083 ?capacity .     # Stadium capacity
                    ?stadium wdt:P625 ?coordinate .    # Coordinates
                }
                
                # Optional: League
                OPTIONAL { ?team wdt:P118 ?league . } # Sport / League
                
                # Optional: City/Location
                OPTIONAL { ?team wdt:P131 ?city . }   # Located in administrative territory
                
                # Service for labels
                SERVICE wikibase:label { 
                    bd:serviceParam wikibase:language "en,es,fr,de,pt,it,nl" . 
                }
            }
            ORDER BY ?teamLabel
            LIMIT 100
        `;
    }

    /**
     * Get country metadata from Wikidata
     */
    async getCountryMetadata(wikidataId) {
        await this.respectRateLimit();

        const query = `
            SELECT ?country ?countryLabel ?flag ?population ?capital ?capitalLabel ?coordinate WHERE {
                BIND(wd:${wikidataId} as ?country)
                
                OPTIONAL { ?country wdt:P163 ?flag . }        # Flag image
                OPTIONAL { ?country wdt:P1082 ?population . } # Population
                OPTIONAL { ?country wdt:P36 ?capital . }      # Capital
                OPTIONAL { ?country wdt:P625 ?coordinate . }  # Coordinates
                
                SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
            }
        `;

        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/sparql-query',
                    'Accept': 'application/sparql-results+json'
                },
                body: query
            });

            const data = await response.json();
            return this.transformCountryMetadata(data.results.bindings[0]);
        } catch (error) {
            console.error('Error fetching country metadata:', error);
            return null;
        }
    }

    /**
     * Transform Wikidata results to standard format
     */
    transformWikidataResults(bindings, countryCode) {
        return bindings.map((binding, index) => {
            const team = {
                id: this.generateTeamId(binding, countryCode, index),
                name: binding.teamLabel?.value || 'Unknown Team',
                shortName: binding.shortName?.value || null,
                city: binding.cityLabel?.value || 'Unknown City',
                country: countryCode,
                founded: this.extractYear(binding.founded?.value),
                stadium: {
                    name: binding.stadiumLabel?.value || 'Unknown Stadium',
                    capacity: parseInt(binding.capacity?.value) || 0,
                    coordinates: this.parseWikidataCoordinates(binding.coordinate?.value)
                },
                league: binding.leagueLabel?.value || 'National League',
                website: binding.website?.value || null,
                colors: this.generateTeamColors(binding.teamLabel?.value),
                achievements: [],
                source: 'wikidata',
                confidence: this.calculateConfidence(binding),
                lastUpdated: new Date().toISOString()
            };

            return team;
        });
    }

    /**
     * Transform country metadata
     */
    transformCountryMetadata(binding) {
        if (!binding) return null;

        return {
            name: binding.countryLabel?.value,
            population: this.formatPopulation(binding.population?.value),
            capital: binding.capitalLabel?.value,
            coordinates: this.parseWikidataCoordinates(binding.coordinate?.value),
            flag: binding.flag?.value
        };
    }

    /**
     * Generate unique team ID
     */
    generateTeamId(binding, countryCode, index) {
        const teamName = binding.teamLabel?.value || 'unknown';
        const cleanName = teamName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        return `${countryCode.toLowerCase()}-${cleanName}-${index}`;
    }

    /**
     * Extract year from Wikidata date
     */
    extractYear(dateString) {
        if (!dateString) return null;
        const match = dateString.match(/(\d{4})/);
        return match ? parseInt(match[1]) : null;
    }

    /**
     * Parse Wikidata coordinates
     */
    parseWikidataCoordinates(coordinateString) {
        if (!coordinateString) return null;

        try {
            // Wikidata coordinates are in format "Point(longitude latitude)"
            const match = coordinateString.match(/Point\(([^ ]+) ([^ ]+)\)/);
            if (match) {
                return {
                    longitude: parseFloat(match[1]),
                    latitude: parseFloat(match[2]),
                    x: this.convertToMapX(parseFloat(match[1])),
                    y: this.convertToMapY(parseFloat(match[2]))
                };
            }
        } catch (error) {
            console.warn('Error parsing coordinates:', coordinateString);
        }

        return null;
    }

    /**
     * Convert longitude to map X coordinate (0-100%)
     */
    convertToMapX(longitude) {
        return Math.max(0, Math.min(100, ((longitude + 180) / 360) * 100));
    }

    /**
     * Convert latitude to map Y coordinate (0-100%)
     */
    convertToMapY(latitude) {
        return Math.max(0, Math.min(100, ((90 - latitude) / 180) * 100));
    }

    /**
     * Generate team colors based on name
     */
    generateTeamColors(teamName) {
        if (!teamName) return ['#4CAF50', '#FFFFFF'];

        const colorMap = {
            'real': ['#FFFFFF', '#FFD700'],
            'barcelona': ['#004D98', '#FCBF49'],
            'atletico': ['#CE2029', '#FFFFFF'],
            'manchester': ['#DA020E', '#FBE122'],
            'liverpool': ['#C8102E', '#F6EB61'],
            'arsenal': ['#EF0107', '#9C824A'],
            'chelsea': ['#034694', '#6A7FDB'],
            'bayern': ['#DC052D', '#0066B2'],
            'juventus': ['#000000', '#FFFFFF'],
            'milan': ['#AC8B00', '#000000'],
            'inter': ['#0F4C96', '#000000']
        };

        const lowerName = teamName.toLowerCase();
        for (const [key, colors] of Object.entries(colorMap)) {
            if (lowerName.includes(key)) {
                return colors;
            }
        }

        // Default colors based on hash
        const hash = this.simpleHash(teamName);
        const hue = hash % 360;
        return [`hsl(${hue}, 70%, 50%)`, '#FFFFFF'];
    }

    /**
     * Calculate confidence score for team data
     */
    calculateConfidence(binding) {
        let score = 0.5; // Base score

        if (binding.teamLabel?.value) score += 0.1;
        if (binding.founded?.value) score += 0.1;
        if (binding.stadiumLabel?.value) score += 0.1;
        if (binding.capacity?.value) score += 0.1;
        if (binding.coordinate?.value) score += 0.1;
        if (binding.leagueLabel?.value) score += 0.1;

        return Math.min(1.0, score);
    }

    /**
     * Format population number
     */
    formatPopulation(popString) {
        if (!popString) return null;
        
        const num = parseInt(popString);
        if (num > 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        } else if (num > 1000) {
            return `${(num / 1000).toFixed(0)}K`;
        }
        return num.toString();
    }

    /**
     * Simple hash function for generating colors
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Rate limiting to respect Wikidata's terms
     */
    async respectRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.rateLimiter.lastRequest;
        
        if (timeSinceLastRequest < this.rateLimiter.minInterval) {
            const delay = this.rateLimiter.minInterval - timeSinceLastRequest;
            console.log(`⏳ Rate limiting: waiting ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.rateLimiter.lastRequest = Date.now();
    }
}