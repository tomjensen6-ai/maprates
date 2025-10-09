/**
 * TheSportsDB Service - FREE API for global football data
 * Rate limit: ~30 requests/minute with public key
 */

export class TheSportsDBService {
    constructor() {
        this.baseUrl = 'https://www.thesportsdb.com/api/v1/json/3';
        this.publicKey = '3'; // Public test key
        this.rateLimiter = {
            lastRequest: 0,
            minInterval: 2000 // 2 seconds between requests
        };
        
        // Country name mappings for TheSportsDB
        this.countryMappings = {
            'US': 'United States',
            'GB': 'England', 
            'DE': 'Germany',
            'ES': 'Spain',
            'IT': 'Italy',
            'FR': 'France',
            'BR': 'Brazil',
            'AR': 'Argentina',
            'NL': 'Netherlands',
            'PT': 'Portugal',
            'NO': 'Norway',
            'SE': 'Sweden',
            'DK': 'Denmark',
            'AU': 'Australia',
            'MX': 'Mexico',
            'CA': 'Canada',
            'JP': 'Japan',
            'KR': 'South Korea',
            'CN': 'China',
            'IN': 'India',
            'RU': 'Russia',
            'TR': 'Turkey',
            'PL': 'Poland',
            'BE': 'Belgium',
            'CH': 'Switzerland',
            'AT': 'Austria',
            'GR': 'Greece',
            'HR': 'Croatia',
            'RS': 'Serbia',
            'CZ': 'Czech Republic',
            'UA': 'Ukraine',
            'NG': 'Nigeria',
            'GH': 'Ghana',
            'EG': 'Egypt',
            'ZA': 'South Africa',
            'MA': 'Morocco',
            'SA': 'Saudi Arabia',
            'AE': 'United Arab Emirates',
            'QA': 'Qatar',
            'IR': 'Iran',
            'IQ': 'Iraq',
            'TH': 'Thailand',
            'MY': 'Malaysia',
            'SG': 'Singapore',
            'ID': 'Indonesia',
            'PH': 'Philippines',
            'VN': 'Vietnam'
        };
    }

    /**
     * Get all football teams for a country
     */
    async getCountryTeams(countryCode) {
        await this.respectRateLimit();
        
        const countryName = this.countryMappings[countryCode] || countryCode;
        console.log(`🏆 TheSportsDB: Fetching teams for ${countryName} (${countryCode})`);
        
        try {
            // Step 1: Get leagues in the country
            const leagues = await this.getCountryLeagues(countryName);
            if (!leagues || leagues.length === 0) {
                console.log(`⚠️ No leagues found for ${countryName}`);
                return [];
            }

            // Step 2: Get teams from the primary league (usually first one)
            const primaryLeague = leagues[0];
            console.log(`🎯 Using primary league: ${primaryLeague.strLeague}`);
            
            const teams = await this.getLeagueTeams(primaryLeague.strLeague);
            
            // Step 3: Enhance with detailed team data
            const enhancedTeams = await this.enhanceTeamsWithDetails(teams, countryCode);
            
            console.log(`✅ TheSportsDB: ${enhancedTeams.length} teams retrieved for ${countryName}`);
            return enhancedTeams;

        } catch (error) {
            console.error(`❌ TheSportsDB error for ${countryCode}:`, error);
            return [];
        }
    }

    /**
     * Get leagues for a country
     */
    async getCountryLeagues(countryName) {
        const url = `${this.baseUrl}/search_all_leagues.php?c=${encodeURIComponent(countryName)}&s=Soccer`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const leagues = data.countries || [];
            
            // Filter for active leagues and sort by priority
            return leagues
                .filter(league => league.strSport === 'Soccer')
                .sort((a, b) => {
                    // Prioritize leagues with "Premier", "Primera", "Bundesliga", etc.
                    const priority = (name) => {
                        if (name.includes('Premier') || name.includes('Primera') || name.includes('Bundesliga')) return 1;
                        if (name.includes('Division') || name.includes('League')) return 2;
                        return 3;
                    };
                    return priority(a.strLeague) - priority(b.strLeague);
                });

        } catch (error) {
            console.error(`Error fetching leagues for ${countryName}:`, error);
            return [];
        }
    }

    /**
     * Get teams in a specific league
     */
    async getLeagueTeams(leagueName) {
        await this.respectRateLimit();
        
        const url = `${this.baseUrl}/search_all_teams.php?l=${encodeURIComponent(leagueName)}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return data.teams || [];

        } catch (error) {
            console.error(`Error fetching teams for league ${leagueName}:`, error);
            return [];
        }
    }

    /**
     * Enhance teams with detailed information
     */
    async enhanceTeamsWithDetails(teams, countryCode) {
        const enhancedTeams = [];
        
        // Process teams in batches to respect rate limits
        const batchSize = 3;
        for (let i = 0; i < Math.min(teams.length, 20); i += batchSize) { // Limit to 20 teams max
            const batch = teams.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (team) => {
                try {
                    const details = await this.getTeamDetails(team.idTeam);
                    return this.transformTeam(team, details, countryCode);
                } catch (error) {
                    console.warn(`Could not enhance team ${team.strTeam}:`, error);
                    return this.transformTeam(team, null, countryCode);
                }
            });

            const batchResults = await Promise.all(batchPromises);
            enhancedTeams.push(...batchResults.filter(team => team !== null));
            
            // Rate limiting between batches
            if (i + batchSize < teams.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        return enhancedTeams;
    }

    /**
     * Get detailed team information
     */
    async getTeamDetails(teamId) {
        await this.respectRateLimit();
        
        const url = `${this.baseUrl}/lookupteam.php?id=${teamId}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return data.teams?.[0] || null;

        } catch (error) {
            console.error(`Error fetching team details for ${teamId}:`, error);
            return null;
        }
    }

    /**
     * Get league standings (if available)
     */
    async getLeagueStandings(leagueName, season = '2024-2025') {
        await this.respectRateLimit();
        
        // TheSportsDB uses league IDs for standings, try to get ID first
        const leagues = await this.searchLeagues(leagueName);
        if (!leagues || leagues.length === 0) return [];

        const leagueId = leagues[0].idLeague;
        const url = `${this.baseUrl}/lookuptable.php?l=${leagueId}&s=${season}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) return [];

            const data = await response.json();
            return data.table || [];

        } catch (error) {
            console.warn(`No standings available for ${leagueName}`);
            return [];
        }
    }

    /**
     * Search for leagues
     */
    async searchLeagues(leagueName) {
        const url = `${this.baseUrl}/search_all_leagues.php?s=Soccer`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            return (data.countries || []).filter(league => 
                league.strLeague.toLowerCase().includes(leagueName.toLowerCase())
            );
        } catch (error) {
            return [];
        }
    }

    /**
     * Transform TheSportsDB team data to standard format
     */
    transformTeam(basicTeam, detailedTeam, countryCode) {
        // Use detailed data if available, fall back to basic data
        const team = detailedTeam || basicTeam;
        
        // Filter out teams without real stadium names
        const stadiumName = team.strStadium || team.strDescriptionEN || 'Stadium';
        if (stadiumName.includes('Unknown') || stadiumName === 'Stadium') {
            // Only use teams with real stadium information
            return null;
        }

        // Extract city from stadium location or description
        const city = this.extractCity(team.strStadiumLocation, team.strStadiumDescription, team.strTeam);
        
        return {
            id: `thesportsdb-${team.idTeam}`,
            name: team.strTeam || team.strAlternate || 'Unknown Team',
            shortName: team.strTeamShort || this.generateShortName(team.strTeam),
            city: city,
            country: countryCode,
            founded: this.extractYear(team.intFormedYear),
            stadium: {
                name: stadiumName,
                capacity: parseInt(team.intStadiumCapacity) || 0,
                coordinates: null // TheSportsDB doesn't provide coordinates
            },
            league: team.strLeague || 'National League',
            website: team.strWebsite || null,
            colors: this.extractColors(team.strColour1, team.strColour2, team.strColour3),
            achievements: this.extractAchievements(team.strDescriptionEN),
            source: 'thesportsdb',
            confidence: this.calculateConfidence(team),
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Extract city from various location fields
     */
    extractCity(location, description, teamName) {
        // Try location field first
        if (location && location !== 'null' && location.length > 0) {
            return location.split(',')[0].trim();
        }
        
        // Extract from team name if it contains city
        if (teamName) {
            const words = teamName.split(' ');
            if (words.length > 1) {
                return words[0]; // Often the city is the first word
            }
        }
        
        return 'Unknown City';
    }

    /**
     * Extract year from formed year
     */
    extractYear(yearString) {
        if (!yearString || yearString === 'null') return null;
        const year = parseInt(yearString);
        return (year > 1800 && year <= new Date().getFullYear()) ? year : null;
    }

    /**
     * Extract team colors
     */
    extractColors(color1, color2, color3) {
        const colors = [color1, color2, color3]
            .filter(color => color && color !== 'null' && color.length > 0)
            .map(color => color.startsWith('#') ? color : `#${color}`)
            .filter(color => /^#[0-9A-F]{6}$/i.test(color));
        
        if (colors.length === 0) return ['#4CAF50', '#FFFFFF'];
        if (colors.length === 1) colors.push('#FFFFFF');
        
        return colors.slice(0, 2);
    }

    /**
     * Extract achievements from description
     */
    extractAchievements(description) {
        if (!description || description === 'null') return [];
        
        const achievements = [];
        
        // Look for common achievement keywords
        if (description.includes('champion')) achievements.push('League Champions');
        if (description.includes('cup')) achievements.push('Cup Winners');
        if (description.includes('founded')) achievements.push('Professional Club');
        
        return achievements;
    }

    /**
     * Generate short name from full name
     */
    generateShortName(fullName) {
        if (!fullName) return 'UNK';
        
        return fullName
            .replace(/\b(FC|CF|Club|Football|United|City|Athletic|Sports)\b/gi, '')
            .trim()
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 3);
    }

    /**
     * Calculate confidence based on data completeness
     */
    calculateConfidence(team) {
        let confidence = 0.6; // Base confidence for TheSportsDB
        
        if (team.strTeam && team.strTeam !== 'null') confidence += 0.1;
        if (team.strStadium && team.strStadium !== 'null') confidence += 0.1;
        if (team.intStadiumCapacity && team.intStadiumCapacity > 0) confidence += 0.1;
        if (team.intFormedYear && team.intFormedYear !== 'null') confidence += 0.05;
        if (team.strWebsite && team.strWebsite !== 'null') confidence += 0.05;
        
        return Math.min(1.0, confidence);
    }

    /**
     * Rate limiting to respect TheSportsDB terms
     */
    async respectRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.rateLimiter.lastRequest;
        
        if (timeSinceLastRequest < this.rateLimiter.minInterval) {
            const delay = this.rateLimiter.minInterval - timeSinceLastRequest;
            console.log(`⏳ TheSportsDB rate limiting: waiting ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.rateLimiter.lastRequest = Date.now();
    }

    /**
     * Test service connectivity
     */
    async testConnection() {
        try {
            const url = `${this.baseUrl}/search_all_leagues.php?c=Spain&s=Soccer`;
            const response = await fetch(url);
            
            return {
                status: response.ok ? 'healthy' : 'error',
                statusCode: response.status,
                available: response.ok
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message
            };
        }
    }
}