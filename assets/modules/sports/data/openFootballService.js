/**
 * OpenFootball Service - FREE GitHub-based Football Data
 */

export class OpenFootballService {
    constructor() {
        this.baseUrl = 'https://raw.githubusercontent.com/openfootball/football.json/master/';
        this.githubApi = 'https://api.github.com/repos/openfootball/football.json/contents/';
        this.rateLimiter = {
            lastRequest: 0,
            minInterval: 500  // 500ms between requests
        };
        this.countryMappings = this.initializeCountryMappings();
    }

    /**
     * Get teams from OpenFootball database
     */
    async getCountryTeams(countryCode) {
        await this.respectRateLimit();

        const countryConfig = this.countryMappings[countryCode];
        if (!countryConfig) {
            console.log(`📊 No OpenFootball config for ${countryCode}`);
            return [];
        }

        try {
            console.log(`🔄 Fetching OpenFootball teams for ${countryCode}...`);
            
            const teams = [];
            for (const leagueFile of countryConfig.leagues) {
                const leagueTeams = await this.fetchLeagueTeams(leagueFile, countryCode);
                teams.push(...leagueTeams);
            }

            console.log(`✅ OpenFootball: ${teams.length} teams found for ${countryCode}`);
            return teams;

        } catch (error) {
            console.error(`❌ OpenFootball error for ${countryCode}:`, error);
            return [];
        }
    }

    /**
     * Fetch teams from a specific league file
     */
    async fetchLeagueTeams(leagueFile, countryCode) {
        const url = `${this.baseUrl}${leagueFile}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return this.transformOpenFootballData(data, countryCode, leagueFile);

        } catch (error) {
            console.warn(`❌ Failed to fetch ${leagueFile}:`, error);
            return [];
        }
    }

    /**
     * Transform OpenFootball data to standard format
     */
    transformOpenFootballData(data, countryCode, leagueFile) {
        const teams = [];
        
        if (data.clubs) {
            // Handle club format
            data.clubs.forEach((club, index) => {
                teams.push(this.transformClub(club, countryCode, leagueFile, index));
            });
        } else if (data.teams) {
            // Handle team format
            data.teams.forEach((team, index) => {
                teams.push(this.transformTeam(team, countryCode, leagueFile, index));
            });
        } else if (data.rounds) {
            // Handle tournament format with rounds
            data.rounds.forEach(round => {
                if (round.matches) {
                    round.matches.forEach(match => {
                        if (match.team1 && !teams.find(t => t.name === match.team1)) {
                            teams.push(this.transformTeamName(match.team1, countryCode, teams.length));
                        }
                        if (match.team2 && !teams.find(t => t.name === match.team2)) {
                            teams.push(this.transformTeamName(match.team2, countryCode, teams.length));
                        }
                    });
                }
            });
        }

        return teams;
    }

    /**
     * Transform club object
     */
    transformClub(club, countryCode, leagueFile, index) {
        return {
            id: this.generateTeamId(club.name || club.key, countryCode, index),
            name: club.name || club.key,
            shortName: club.code || club.key,
            city: club.city || this.extractCityFromName(club.name),
            country: countryCode,
            founded: club.founded ? parseInt(club.founded) : null,
            stadium: {
                name: club.ground || `${club.name} Stadium`,
                capacity: club.capacity || 0,
                coordinates: club.coordinates || this.generateCoordinates(countryCode)
            },
            league: this.extractLeagueName(leagueFile),
            website: club.www || null,
            colors: this.generateTeamColors(club.name || club.key),
            achievements: [],
            source: 'openfootball',
            confidence: 0.7,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Transform team object
     */
    transformTeam(team, countryCode, leagueFile, index) {
        return {
            id: this.generateTeamId(team.name || team.title, countryCode, index),
            name: team.name || team.title,
            shortName: team.code || this.generateShortName(team.name || team.title),
            city: team.city || this.extractCityFromName(team.name || team.title),
            country: countryCode,
            founded: null,
            stadium: {
                name: `${team.name || team.title} Stadium`,
                capacity: 0,
                coordinates: this.generateCoordinates(countryCode)
            },
            league: this.extractLeagueName(leagueFile),
            website: null,
            colors: this.generateTeamColors(team.name || team.title),
            achievements: [],
            source: 'openfootball',
            confidence: 0.6,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Transform team name only
     */
    transformTeamName(teamName, countryCode, index) {
        return {
            id: this.generateTeamId(teamName, countryCode, index),
            name: teamName,
            shortName: this.generateShortName(teamName),
            city: this.extractCityFromName(teamName),
            country: countryCode,
            founded: null,
            stadium: {
                name: `${teamName} Stadium`,
                capacity: 0,
                coordinates: this.generateCoordinates(countryCode)
            },
            league: 'National League',
            website: null,
            colors: this.generateTeamColors(teamName),
            achievements: [],
            source: 'openfootball',
            confidence: 0.5,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Initialize country mappings for OpenFootball
     */
    initializeCountryMappings() {
        return {
            // Major European Countries
            'GB': {
                leagues: ['england/2023-24/1-premierleague.json', 'england/2023-24/2-championship.json']
            },
            'ES': {
                leagues: ['spain/2023-24/1-laliga.json', 'spain/2023-24/2-laliga2.json']
            },
            'DE': {
                leagues: ['germany/2023-24/1-bundesliga.json', 'germany/2023-24/2-bundesliga2.json']
            },
            'IT': {
                leagues: ['italy/2023-24/1-seriea.json', 'italy/2023-24/2-serieb.json']
            },
            'FR': {
                leagues: ['france/2023-24/1-ligue1.json', 'france/2023-24/2-ligue2.json']
            },
            'NL': {
                leagues: ['netherlands/2023-24/1-eredivisie.json']
            },
            'PT': {
                leagues: ['portugal/2023-24/1-primeiraliga.json']
            },
            'BE': {
                leagues: ['belgium/2023-24/1-proleague.json']
            },
            'CH': {
                leagues: ['switzerland/2023-24/1-superleague.json']
            },
            'AT': {
                leagues: ['austria/2023-24/1-bundesliga.json']
            },
            
            // South American Countries
            'BR': {
                leagues: ['brazil/2024/1-seriea.json']
            },
            'AR': {
                leagues: ['argentina/2024/1-primeradivision.json']
            },
            'CO': {
                leagues: ['colombia/2024/1-primeradivision.json']
            },
            'CL': {
                leagues: ['chile/2024/1-primeradivision.json']
            },
            'UY': {
                leagues: ['uruguay/2024/1-primeradivision.json']
            },
            'PE': {
                leagues: ['peru/2024/1-primeradivision.json']
            },
            'EC': {
                leagues: ['ecuador/2024/1-primeradivision.json']
            },
            'BO': {
                leagues: ['bolivia/2024/1-primeradivision.json']
            },
            'PY': {
                leagues: ['paraguay/2024/1-primeradivision.json']
            },
            'VE': {
                leagues: ['venezuela/2024/1-primeradivision.json']
            },

            // North/Central American Countries
            'US': {
                leagues: ['usa/2024/1-mls.json']
            },
            'MX': {
                leagues: ['mexico/2023-24/1-ligamx.json']
            },
            'CA': {
                leagues: ['canada/2024/1-cpl.json']
            },
            'CR': {
                leagues: ['costarica/2024/1-primeradivision.json']
            },
            'GT': {
                leagues: ['guatemala/2024/1-ligamx.json']
            },
            'HN': {
                leagues: ['honduras/2024/1-ligamx.json']
            },
            'SV': {
                leagues: ['elsalvador/2024/1-primeradivision.json']
            },
            'PA': {
                leagues: ['panama/2024/1-ligamx.json']
            },
            'NI': {
                leagues: ['nicaragua/2024/1-primeradivision.json']
            },
            'JM': {
                leagues: ['jamaica/2024/1-primeradivision.json']
            },

            // African Countries
            'NG': {
                leagues: ['nigeria/2024/1-proleague.json']
            },
            'GH': {
                leagues: ['ghana/2024/1-proleague.json']
            },
            'ZA': {
                leagues: ['southafrica/2024/1-proleague.json']
            },
            'EG': {
                leagues: ['egypt/2024/1-proleague.json']
            },
            'MA': {
                leagues: ['morocco/2024/1-proleague.json']
            },
            'TN': {
                leagues: ['tunisia/2024/1-proleague.json']
            },
            'DZ': {
                leagues: ['algeria/2024/1-proleague.json']
            },
            'CM': {
                leagues: ['cameroon/2024/1-elite.json']
            },
            'CI': {
                leagues: ['ivorycoast/2024/1-ligue1.json']
            },
            'SN': {
                leagues: ['senegal/2024/1-ligue1.json']
            },

            // Asian Countries
            'JP': {
                leagues: ['japan/2024/1-jleague.json']
            },
            'KR': {
                leagues: ['southkorea/2024/1-kleague.json']
            },
            'CN': {
                leagues: ['china/2024/1-superleague.json']
            },
            'AU': {
                leagues: ['australia/2023-24/1-aleague.json']
            },
            'IN': {
                leagues: ['india/2023-24/1-isl.json']
            },
            'TH': {
                leagues: ['thailand/2024/1-t1league.json']
            },
            'MY': {
                leagues: ['malaysia/2024/1-superleague.json']
            },
            'ID': {
                leagues: ['indonesia/2024/1-liga1.json']
            },
            'VN': {
                leagues: ['vietnam/2024/1-vleague.json']
            },
            'PH': {
                leagues: ['philippines/2024/1-pfl.json']
            },
            'SA': {
                leagues: ['saudiarabia/2023-24/1-proleague.json']
            },
            'AE': {
                leagues: ['uae/2023-24/1-uaeleague.json']
            },
            'QA': {
                leagues: ['qatar/2023-24/1-starsleague.json']
            },
            'IR': {
                leagues: ['iran/2023-24/1-proleague.json']
            },
            'IQ': {
                leagues: ['iraq/2023-24/1-proleague.json']
            }
        };
    }

    /**
     * Generate team ID
     */
    generateTeamId(teamName, countryCode, index) {
        const cleanName = teamName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        return `${countryCode.toLowerCase()}-${cleanName}-${index}`;
    }

    /**
     * Generate short name from full name
     */
    generateShortName(fullName) {
        if (!fullName) return '';
        
        // Remove common words and take initials
        const words = fullName
            .replace(/\b(FC|CF|Club|Football|Futbol|United|City|Town|Athletic|Sports|SC|AC|Real|Club)\b/gi, '')
            .trim()
            .split(/\s+/)
            .filter(word => word.length > 0);

        if (words.length <= 2) {
            return words.join('').substring(0, 3).toUpperCase();
        }

        return words.map(word => word.charAt(0)).join('').substring(0, 3).toUpperCase();
    }

    /**
     * Extract city from team name
     */
    extractCityFromName(teamName) {
        if (!teamName) return 'Unknown City';

        // Remove common football terms
        const cleanName = teamName
            .replace(/\b(FC|CF|Club|Football|Futbol|United|City|Town|Athletic|Sports|SC|AC|Real|Club)\b/gi, '')
            .trim();

        // Take first word as likely city name
        const words = cleanName.split(/\s+/);
        return words[0] || 'Unknown City';
    }

    /**
     * Extract league name from file path
     */
    extractLeagueName(filePath) {
        const fileName = filePath.split('/').pop();
        const leaguePart = fileName.replace(/\.json$/, '').replace(/^\d+-/, '');
        
        const leagueNames = {
            'premierleague': 'Premier League',
            'championship': 'Championship',
            'laliga': 'La Liga',
            'laliga2': 'La Liga 2',
            'bundesliga': 'Bundesliga',
            'bundesliga2': '2. Bundesliga',
            'seriea': 'Serie A',
            'serieb': 'Serie B',
            'ligue1': 'Ligue 1',
            'ligue2': 'Ligue 2',
            'eredivisie': 'Eredivisie',
            'primeiraliga': 'Primeira Liga',
            'proleague': 'Pro League',
            'superleague': 'Super League',
            'mls': 'Major League Soccer',
            'ligamx': 'Liga MX',
            'cpl': 'Canadian Premier League',
            'jleague': 'J-League',
            'kleague': 'K League',
            'aleague': 'A-League',
            'isl': 'Indian Super League'
        };

        return leagueNames[leaguePart] || 'National League';
    }

    /**
     * Generate coordinates for country center
     */
    generateCoordinates(countryCode) {
        const countryCoordinates = {
            'GB': { x: 51, y: 42 },
            'ES': { x: 49, y: 62 },
            'DE': { x: 52, y: 48 },
            'IT': { x: 54, y: 58 },
            'FR': { x: 48, y: 52 },
            'NL': { x: 51, y: 45 },
            'PT': { x: 41, y: 62 },
            'BR': { x: 75, y: 70 },
            'AR': { x: 70, y: 85 },
            'US': { x: 25, y: 52 },
            'MX': { x: 20, y: 60 },
            'CA': { x: 25, y: 35 },
            'AU': { x: 85, y: 75 },
            'JP': { x: 92, y: 47 },
            'CN': { x: 80, y: 47 },
            'IN': { x: 74, y: 60 },
            'NG': { x: 52, y: 72 },
            'ZA': { x: 55, y: 88 },
            'EG': { x: 57, y: 60 }
        };

        const coords = countryCoordinates[countryCode] || { x: 50, y: 50 };
        
        // Add slight randomization for multiple teams
        return {
            x: coords.x + (Math.random() - 0.5) * 10,
            y: coords.y + (Math.random() - 0.5) * 10
        };
    }

    /**
     * Generate team colors
     */
    generateTeamColors(teamName) {
        if (!teamName) return ['#4CAF50', '#FFFFFF'];

        // Team-specific colors
        const colorMap = {
            'real madrid': ['#FFFFFF', '#FFD700'],
            'barcelona': ['#004D98', '#FCBF49'],
            'atletico': ['#CE2029', '#FFFFFF'],
            'manchester united': ['#DA020E', '#FBE122'],
            'liverpool': ['#C8102E', '#F6EB61'],
            'arsenal': ['#EF0107', '#9C824A'],
            'chelsea': ['#034694', '#6A7FDB'],
            'bayern': ['#DC052D', '#0066B2'],
            'juventus': ['#000000', '#FFFFFF'],
            'milan': ['#AC8B00', '#000000'],
            'inter': ['#0F4C96', '#000000'],
            'psg': ['#004170', '#ED1C24'],
            'flamengo': ['#E31837', '#000000'],
            'boca': ['#003F7F', '#FFD700'],
            'river': ['#FFFFFF', '#FF0000']
        };

        const lowerName = teamName.toLowerCase();
        for (const [key, colors] of Object.entries(colorMap)) {
            if (lowerName.includes(key.split(' ')[0])) {
                return colors;
            }
        }

        // Generate colors based on hash
        const hash = this.simpleHash(teamName);
        const hue = hash % 360;
        return [`hsl(${hue}, 65%, 45%)`, '#FFFFFF'];
    }

    /**
     * Simple hash function
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    /**
     * Rate limiting
     */
    async respectRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.rateLimiter.lastRequest;
        
        if (timeSinceLastRequest < this.rateLimiter.minInterval) {
            const delay = this.rateLimiter.minInterval - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.rateLimiter.lastRequest = Date.now();
    }
}