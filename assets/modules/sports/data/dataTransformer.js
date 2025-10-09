/**
 * Data Transformer - Standardizes and merges data from multiple sources
 */

export class DataTransformer {
    constructor() {
        this.standardSchema = this.defineStandardSchema();
    }

    /**
     * Define the standard team data schema
     */
    defineStandardSchema() {
        return {
            id: { type: 'string', required: true },
            name: { type: 'string', required: true },
            shortName: { type: 'string', required: false },
            city: { type: 'string', required: true },
            country: { type: 'string', required: true },
            founded: { type: 'number', required: false },
            stadium: {
                name: { type: 'string', required: true },
                capacity: { type: 'number', required: false },
                coordinates: { type: 'object', required: false }
            },
            league: { type: 'string', required: true },
            website: { type: 'string', required: false },
            colors: { type: 'array', required: true },
            achievements: { type: 'array', required: false },
            source: { type: 'string', required: true },
            confidence: { type: 'number', required: true },
            lastUpdated: { type: 'string', required: true }
        };
    }

    /**
     * Merge teams from multiple sources with confidence-based priority
     */
    mergeTeamSources(wikidataTeams, openFootballTeams, countryCode) {
        console.log(`🔄 Merging teams for ${countryCode}: Wikidata(${wikidataTeams.length}) + OpenFootball(${openFootballTeams.length})`);

        const mergedTeams = new Map();
        const allTeams = [...wikidataTeams, ...openFootballTeams];

        // Filter out any teams without real data
        const realTeams = allTeams.filter(team => {
            // Only accept teams with real names and cities
            if (!team.name || !team.city) return false;
            if (team.name.includes('Unknown') || team.city.includes('Unknown')) return false;
            if (team.name.includes('National FC') || team.city === 'Capital City') return false;
            return true;
        });

        console.log(`🔍 Filtered to ${realTeams.length} teams with real data for ${countryCode}`);

        // Group teams by similarity
        realTeams.forEach(team => {
            const key = this.generateMergeKey(team);
            
            if (!mergedTeams.has(key)) {
                mergedTeams.set(key, []);
            }
            
            mergedTeams.get(key).push(team);
        });

        // Merge similar teams
        const finalTeams = [];
        mergedTeams.forEach((similarTeams, key) => {
            if (similarTeams.length === 1) {
                const standardized = this.standardizeTeam(similarTeams[0]);
                if (standardized) finalTeams.push(standardized);
            } else {
                const mergedTeam = this.mergeTeamData(similarTeams);
                const standardized = this.standardizeTeam(mergedTeam);
                if (standardized) finalTeams.push(standardized);
            }
        });

        // Sort by confidence and limit results
        const sortedTeams = finalTeams
            .filter(team => team !== null) // Remove rejected teams
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 30); // Limit to top 30 teams per country

        console.log(`✅ Merged result: ${sortedTeams.length} teams for ${countryCode}`);
        return sortedTeams;
    }

    /**
     * Generate merge key to identify similar teams
     */
    generateMergeKey(team) {
        const cleanName = team.name
            .toLowerCase()
            .replace(/\b(fc|cf|club|football|futbol|united|city|athletic|sports|sc|ac|real)\b/g, '')
            .replace(/[^a-z0-9]/g, '')
            .trim();

        const cleanCity = team.city
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .trim();

        return `${cleanName}_${cleanCity}`;
    }

    /**
     * Merge data from multiple team entries
     */
    mergeTeamData(teams) {
        // Sort by confidence (highest first)
        const sortedTeams = teams.sort((a, b) => b.confidence - a.confidence);
        const primaryTeam = sortedTeams[0];
        
        const merged = { ...primaryTeam };

        // Merge data from secondary sources
        sortedTeams.slice(1).forEach(team => {
            // Use data from higher confidence sources, but fill gaps
            if (!merged.founded && team.founded) merged.founded = team.founded;
            if (!merged.website && team.website) merged.website = team.website;
            if (!merged.shortName && team.shortName) merged.shortName = team.shortName;
            
            // Merge stadium data
            if (team.stadium) {
                if (!merged.stadium.capacity && team.stadium.capacity) {
                    merged.stadium.capacity = team.stadium.capacity;
                }
                if (!merged.stadium.coordinates && team.stadium.coordinates) {
                    merged.stadium.coordinates = team.stadium.coordinates;
                }
            }

            // Merge achievements
            if (team.achievements && team.achievements.length > 0) {
                merged.achievements = [...new Set([...merged.achievements, ...team.achievements])];
            }

            // Track all sources
            if (!merged.sources) merged.sources = [];
            merged.sources.push(team.source);
        });

        // Update confidence based on merged data
        merged.confidence = this.calculateMergedConfidence(sortedTeams);
        merged.sources = [...new Set(merged.sources || [primaryTeam.source])];

        return merged;
    }

    /**
     * Calculate confidence for merged team data
     */
    calculateMergedConfidence(teams) {
        const baseConfidence = Math.max(...teams.map(t => t.confidence));
        const sourceBonus = teams.length > 1 ? 0.1 : 0; // Bonus for multiple sources
        
        return Math.min(1.0, baseConfidence + sourceBonus);
    }

    /**
     * Standardize team data to schema
     */
    standardizeTeam(team) {
        // ONLY accept teams with real names and cities
        if (!team.name || team.name.includes('Unknown') || team.name.includes('National FC')) {
            return null; // Reject made-up teams
        }
        
        if (!team.city || team.city.includes('Unknown') || team.city === 'Capital City' || team.city === 'Major City') {
            return null; // Reject made-up cities
        }

        return {
            id: team.id || this.generateId(team.name, team.country),
            name: this.standardizeName(team.name),
            shortName: team.shortName || this.generateShortName(team.name),
            city: this.standardizeCity(team.city),
            country: team.country,
            founded: this.standardizeYear(team.founded),
            stadium: team.stadium ? {
                name: team.stadium.name, // ONLY use real stadium names
                capacity: this.standardizeCapacity(team.stadium.capacity),
                coordinates: this.standardizeCoordinates(team.stadium.coordinates)
            } : null, // NO fallback stadium data
            league: team.league || null, // NO fallback league names
            website: this.standardizeUrl(team.website),
            colors: team.colors ? this.standardizeColors(team.colors) : null, // NO default colors
            achievements: team.achievements || [],
            source: team.source,
            sources: team.sources || [team.source],
            confidence: team.confidence || 0.5,
            lastUpdated: team.lastUpdated || new Date().toISOString()
        };
    }

    /**
     * Standardize team name
     */
    standardizeName(name) {
        if (!name) return 'Unknown Team';
        
        return name
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/^(FC|CF)\s+/i, '') // Move prefix to end
            .replace(/\s+(FC|CF)$/i, ' $1')
            .trim();
    }

    /**
     * Generate short name
     */
    generateShortName(fullName) {
        if (!fullName) return 'UNK';

        // Remove common terms
        const words = fullName
            .replace(/\b(FC|CF|Club|Football|Futbol|United|City|Town|Athletic|Sports|SC|AC|Real|de|del|la|los|das)\b/gi, '')
            .trim()
            .split(/\s+/)
            .filter(word => word.length > 1);

        if (words.length === 0) return fullName.substring(0, 3).toUpperCase();
        if (words.length === 1) return words[0].substring(0, 3).toUpperCase();
        if (words.length === 2) return (words[0].charAt(0) + words[1].substring(0, 2)).toUpperCase();
        
        return words.slice(0, 3).map(w => w.charAt(0)).join('').toUpperCase();
    }

    /**
     * Standardize city name
     */
    standardizeCity(city) {
        if (!city) return 'Unknown City';
        
        return city
            .trim()
            .replace(/\s+/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    /**
     * Standardize year
     */
    standardizeYear(year) {
        if (!year) return null;
        
        const numYear = parseInt(year);
        if (numYear < 1800 || numYear > new Date().getFullYear()) {
            return null;
        }
        
        return numYear;
    }

    /**
     * Standardize stadium capacity
     */
    standardizeCapacity(capacity) {
        if (!capacity) return 0;
        
        const numCapacity = parseInt(capacity);
        return numCapacity > 0 && numCapacity < 200000 ? numCapacity : 0;
    }

    /**
     * Standardize coordinates
     */
    standardizeCoordinates(coords) {
        if (!coords) return null;
        
        if (coords.x !== undefined && coords.y !== undefined) {
            // Already in map format
            return {
                x: Math.max(0, Math.min(100, coords.x)),
                y: Math.max(0, Math.min(100, coords.y)),
                longitude: coords.longitude || null,
                latitude: coords.latitude || null
            };
        }
        
        if (coords.longitude !== undefined && coords.latitude !== undefined) {
            // Convert lat/lng to map coordinates
            return {
                x: this.longitudeToX(coords.longitude),
                y: this.latitudeToY(coords.latitude),
                longitude: coords.longitude,
                latitude: coords.latitude
            };
        }
        
        return null;
    }

    /**
     * Convert longitude to map X coordinate
     */
    longitudeToX(longitude) {
        return Math.max(0, Math.min(100, ((longitude + 180) / 360) * 100));
    }

    /**
     * Convert latitude to map Y coordinate
     */
    latitudeToY(latitude) {
        return Math.max(0, Math.min(100, ((90 - latitude) / 180) * 100));
    }

    /**
     * Standardize URL
     */
    standardizeUrl(url) {
        if (!url) return null;
        
        try {
            // Add protocol if missing
            if (!/^https?:\/\//i.test(url)) {
                url = 'https://' + url;
            }
            
            const urlObj = new URL(url);
            return urlObj.href;
        } catch (error) {
            return null;
        }
    }

    /**
     * Standardize colors
     */
    standardizeColors(colors) {
        if (!colors || !Array.isArray(colors)) {
            return ['#4CAF50', '#FFFFFF']; // Default colors
        }
        
        const validColors = colors
            .filter(color => typeof color === 'string' && /^#[0-9A-F]{6}$/i.test(color))
            .slice(0, 2); // Max 2 colors
        
        if (validColors.length === 0) {
            return ['#4CAF50', '#FFFFFF'];
        }
        
        if (validColors.length === 1) {
            validColors.push('#FFFFFF');
        }
        
        return validColors;
    }

    /**
     * Generate ID
     */
    generateId(name, country) {
        const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const timestamp = Date.now().toString(36);
        return `${country.toLowerCase()}-${cleanName}-${timestamp}`;
    }

    /**
     * Validate team data against schema
     */
    validateTeam(team) {
        const errors = [];
        
        this.validateObject(team, this.standardSchema, '', errors);
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Recursive schema validation
     */
    validateObject(obj, schema, path, errors) {
        Object.keys(schema).forEach(key => {
            const field = schema[key];
            const value = obj[key];
            const fieldPath = path ? `${path}.${key}` : key;
            
            if (field.required && (value === undefined || value === null)) {
                errors.push(`Missing required field: ${fieldPath}`);
                return;
            }
            
            if (value !== undefined && value !== null) {
                if (field.type === 'object' && typeof field !== 'object') {
                    this.validateObject(value, field, fieldPath, errors);
                } else if (typeof value !== field.type) {
                    errors.push(`Invalid type for ${fieldPath}: expected ${field.type}, got ${typeof value}`);
                }
            }
        });
    }

    /**
     * Merge teams from multiple sources with enhanced priority handling
     */
    mergeMultipleTeamSources(teamsBySource, countryCode) {
        console.log(`🔧 Merging multiple sources for ${countryCode}:`, 
            Object.keys(teamsBySource).map(source => `${source}(${teamsBySource[source].length})`).join(', '));

        // Flatten all teams with source priority
        const allTeams = [];
        
        // Priority order: TheSportsDB > Wikidata > OpenFootball
        ['thesportsdb', 'wikidata', 'openfootball'].forEach(source => {
            if (teamsBySource[source]) {
                allTeams.push(...teamsBySource[source]);
            }
        });

        // Use existing merge logic but with enhanced filtering
        return this.mergeTeamSources([], allTeams, countryCode);
    }

}