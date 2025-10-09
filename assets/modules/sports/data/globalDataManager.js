/**
 * Global Data Manager - Main controller for worldwide football data
 */

import { TeamDataCache } from './cacheManager.js';
import { WikidataService } from './wikidataService.js';
import { OpenFootballService } from './openFootballService.js';
import { TheSportsDBService } from './theSportsDBService.js';
import { DataTransformer } from './dataTransformer.js';
import { GlobalDataUpdateScheduler } from './updateScheduler.js';

export class GlobalDataManager {
    constructor() {
        this.cache = new TeamDataCache();
        this.wikidataService = new WikidataService();
        this.openFootballService = new OpenFootballService();
        this.theSportsDBService = new TheSportsDBService();
        this.dataTransformer = new DataTransformer();
        this.updateScheduler = null;
        
        this.initialized = false;
        this.fifaCountries = null;
        this.footballDataCountries = [
            'GB', 'DE', 'NL', 'BR', 'ES', 'FR', 'IT', 'PT'
        ];
        
        this.requestCounts = {
            wikidata: 0,
            openfootball: 0,
            cache: 0
        };
    }

    /**
     * Initialize the global data manager
     */
    async initialize() {
        if (this.initialized) return;

        try {
            console.log('🌍 Initializing Global Football Data Manager...');

            // Load FIFA countries database
            await this.loadFIFACountries();

            // Initialize update scheduler
            this.updateScheduler = new GlobalDataUpdateScheduler(this);

            this.initialized = true;
            console.log('✅ Global Data Manager initialized successfully');
            console.log(`📊 Supporting ${Object.keys(this.fifaCountries.countries).length} FIFA countries`);

        } catch (error) {
            console.error('❌ Failed to initialize Global Data Manager:', error);
            throw error;
        }
    }

    /**
     * Load FIFA countries database
     */
    async loadFIFACountries() {
        try {
            const response = await fetch('/assets/data/countries/fifa-countries.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.fifaCountries = await response.json();
            console.log(`✅ Loaded ${this.fifaCountries.totalCountries} FIFA countries`);

        } catch (error) {
            console.error('❌ Failed to load FIFA countries:', error);
            // Fallback to basic country list
            this.fifaCountries = this.createBasicCountryList();
        }
    }

    /**
     * Create basic country list as fallback
     */
    createBasicCountryList() {
        const basicCountries = {
            'US': { name: 'United States', continent: 'CONCACAF', priority: 1, flag: '🇺🇸' },
            'MX': { name: 'Mexico', continent: 'CONCACAF', priority: 1, flag: '🇲🇽' },
            'CA': { name: 'Canada', continent: 'CONCACAF', priority: 1, flag: '🇨🇦' },
            'BR': { name: 'Brazil', continent: 'CONMEBOL', priority: 1, flag: '🇧🇷' },
            'AR': { name: 'Argentina', continent: 'CONMEBOL', priority: 1, flag: '🇦🇷' },
            'CO': { name: 'Colombia', continent: 'CONMEBOL', priority: 2, flag: '🇨🇴' },
            'CL': { name: 'Chile', continent: 'CONMEBOL', priority: 2, flag: '🇨🇱' },
            'PE': { name: 'Peru', continent: 'CONMEBOL', priority: 2, flag: '🇵🇪' },
            'UY': { name: 'Uruguay', continent: 'CONMEBOL', priority: 2, flag: '🇺🇾' },
            'EC': { name: 'Ecuador', continent: 'CONMEBOL', priority: 2, flag: '🇪🇨' },
            'NG': { name: 'Nigeria', continent: 'CAF', priority: 1, flag: '🇳🇬' },
            'GH': { name: 'Ghana', continent: 'CAF', priority: 2, flag: '🇬🇭' },
            'EG': { name: 'Egypt', continent: 'CAF', priority: 1, flag: '🇪🇬' },
            'ZA': { name: 'South Africa', continent: 'CAF', priority: 1, flag: '🇿🇦' },
            'MA': { name: 'Morocco', continent: 'CAF', priority: 1, flag: '🇲🇦' },
            'JP': { name: 'Japan', continent: 'AFC', priority: 1, flag: '🇯🇵' },
            'KR': { name: 'South Korea', continent: 'AFC', priority: 1, flag: '🇰🇷' },
            'AU': { name: 'Australia', continent: 'AFC', priority: 1, flag: '🇦🇺' },
            'CN': { name: 'China', continent: 'AFC', priority: 1, flag: '🇨🇳' },
            'IN': { name: 'India', continent: 'AFC', priority: 1, flag: '🇮🇳' }
        };

        return {
            version: 'fallback',
            totalCountries: Object.keys(basicCountries).length,
            countries: basicCountries
        };
    }

    /**
     * Normalize country codes to handle variations (GB/UK/GBR etc.)
     */
    normalizeCountryCode(countryCode) {
    const mappings = {
        // Map variations TO your FIFA database codes
        'GBR': 'GB',     // Great Britain → GB (your FIFA code)
        'UK': 'GB',      // United Kingdom → GB  
        'EN': 'GB',      // England → GB
        'SCO': 'GB',     // Scotland → GB
        'WAL': 'GB',     // Wales → GB
        'NIR': 'GB',     // Northern Ireland → GB
        
        'DEU': 'DE',     // Deutschland → DE (your FIFA code)
        'GER': 'DE',     // Germany → DE
        
        'ESP': 'ES',     // España → ES (your FIFA code)
        'SPA': 'ES',     // Spain → ES
        
        'FRA': 'FR',     // France → FR (your FIFA code)
        'ITA': 'IT',     // Italia → IT (your FIFA code)
        'NLD': 'NL',     // Nederland → NL (your FIFA code)
        'HOL': 'NL',     // Holland → NL
        'PRT': 'PT',     // Portugal → PT (your FIFA code)
        'BRA': 'BR',     // Brasil → BR (your FIFA code)
        'USA': 'US',     // United States → US (your FIFA code)
        'AUS': 'AU',     // Australia → AU (your FIFA code)
        'CAN': 'CA',     // Canada → CA (your FIFA code)
        'MEX': 'MX',     // Mexico → MX (your FIFA code)
        'ARG': 'AR',     // Argentina → AR (your FIFA code)
        'JPN': 'JP',     // Japan → JP (your FIFA code)
        'CHN': 'CN',     // China → CN (your FIFA code)
        'IND': 'IN',     // India → IN (your FIFA code)
        'RUS': 'RU',     // Russia → RU (your FIFA code)
        'RSA': 'ZA',     // South Africa → ZA (your FIFA code)
        
        // Keep all FIFA codes as-is (no change needed)
        'AF': 'AF', 'AL': 'AL', 'DZ': 'DZ', 'AS': 'AS', 'AD': 'AD', 'AO': 'AO',
        'AI': 'AI', 'AG': 'AG', 'AR': 'AR', 'AM': 'AM', 'AW': 'AW', 'AU': 'AU',
        'AT': 'AT', 'AZ': 'AZ', 'BS': 'BS', 'BH': 'BH', 'BD': 'BD', 'BB': 'BB',
        'BY': 'BY', 'BE': 'BE', 'BZ': 'BZ', 'BJ': 'BJ', 'BM': 'BM', 'BT': 'BT',
        'BO': 'BO', 'BQ': 'BQ', 'BA': 'BA', 'BW': 'BW', 'BR': 'BR', 'VG': 'VG',
        'BN': 'BN', 'BG': 'BG', 'BF': 'BF', 'BI': 'BI', 'CV': 'CV', 'KH': 'KH',
        'CM': 'CM', 'CA': 'CA', 'KY': 'KY', 'CF': 'CF', 'TD': 'TD', 'CL': 'CL',
        'CN': 'CN', 'CO': 'CO', 'KM': 'KM', 'CG': 'CG', 'CD': 'CD', 'CK': 'CK',
        'CR': 'CR', 'CI': 'CI', 'HR': 'HR', 'CU': 'CU', 'CW': 'CW', 'CY': 'CY',
        'CZ': 'CZ', 'DK': 'DK', 'DJ': 'DJ', 'DM': 'DM', 'DO': 'DO', 'EC': 'EC',
        'EG': 'EG', 'SV': 'SV', 'GQ': 'GQ', 'ER': 'ER', 'EE': 'EE', 'SZ': 'SZ',
        'ET': 'ET', 'FK': 'FK', 'FO': 'FO', 'FJ': 'FJ', 'FI': 'FI', 'FR': 'FR',
        'GF': 'GF', 'PF': 'PF', 'GA': 'GA', 'GM': 'GM', 'GE': 'GE', 'DE': 'DE',
        'GH': 'GH', 'GI': 'GI', 'GR': 'GR', 'GL': 'GL', 'GD': 'GD', 'GP': 'GP',
        'GU': 'GU', 'GT': 'GT', 'GG': 'GG', 'GN': 'GN', 'GW': 'GW', 'GY': 'GY',
        'HT': 'HT', 'HN': 'HN', 'HK': 'HK', 'HU': 'HU', 'IS': 'IS', 'IN': 'IN',
        'ID': 'ID', 'IR': 'IR', 'IQ': 'IQ', 'IE': 'IE', 'IM': 'IM', 'IL': 'IL',
        'IT': 'IT', 'JM': 'JM', 'JP': 'JP', 'JE': 'JE', 'JO': 'JO', 'KZ': 'KZ',
        'KE': 'KE', 'KI': 'KI', 'KP': 'KP', 'KR': 'KR', 'XK': 'XK', 'KW': 'KW',
        'KG': 'KG', 'LA': 'LA', 'LV': 'LV', 'LB': 'LB', 'LS': 'LS', 'LR': 'LR',
        'LY': 'LY', 'LI': 'LI', 'LT': 'LT', 'LU': 'LU', 'MO': 'MO', 'MK': 'MK',
        'MG': 'MG', 'MW': 'MW', 'MY': 'MY', 'MV': 'MV', 'ML': 'ML', 'MT': 'MT',
        'MH': 'MH', 'MQ': 'MQ', 'MR': 'MR', 'MU': 'MU', 'YT': 'YT', 'MX': 'MX',
        'FM': 'FM', 'MD': 'MD', 'MC': 'MC', 'MN': 'MN', 'ME': 'ME', 'MS': 'MS',
        'MA': 'MA', 'MZ': 'MZ', 'MM': 'MM', 'NA': 'NA', 'NR': 'NR', 'NP': 'NP',
        'NL': 'NL', 'NC': 'NC', 'NZ': 'NZ', 'NI': 'NI', 'NE': 'NE', 'NG': 'NG',
        'NU': 'NU', 'NF': 'NF', 'MP': 'MP', 'NO': 'NO', 'OM': 'OM', 'PK': 'PK',
        'PW': 'PW', 'PS': 'PS', 'PA': 'PA', 'PG': 'PG', 'PY': 'PY', 'PE': 'PE',
        'PH': 'PH', 'PN': 'PN', 'PL': 'PL', 'PT': 'PT', 'PR': 'PR', 'QA': 'QA',
        'RE': 'RE', 'RO': 'RO', 'RU': 'RU', 'RW': 'RW', 'BL': 'BL', 'SH': 'SH',
        'KN': 'KN', 'LC': 'LC', 'MF': 'MF', 'PM': 'PM', 'VC': 'VC', 'WS': 'WS',
        'SM': 'SM', 'ST': 'ST', 'SA': 'SA', 'SN': 'SN', 'RS': 'RS', 'SC': 'SC',
        'SL': 'SL', 'SG': 'SG', 'SX': 'SX', 'SK': 'SK', 'SI': 'SI', 'SB': 'SB',
        'SO': 'SO', 'ZA': 'ZA', 'GS': 'GS', 'SS': 'SS', 'ES': 'ES', 'LK': 'LK',
        'SD': 'SD', 'SR': 'SR', 'SJ': 'SJ', 'SE': 'SE', 'CH': 'CH', 'SY': 'SY',
        'TW': 'TW', 'TJ': 'TJ', 'TZ': 'TZ', 'TH': 'TH', 'TL': 'TL', 'TG': 'TG',
        'TK': 'TK', 'TO': 'TO', 'TT': 'TT', 'TN': 'TN', 'TR': 'TR', 'TM': 'TM',
        'TC': 'TC', 'TV': 'TV', 'UG': 'UG', 'UA': 'UA', 'AE': 'AE', 'GB': 'GB',
        'US': 'US', 'UM': 'UM', 'UY': 'UY', 'UZ': 'UZ', 'VU': 'VU', 'VE': 'VE',
        'VN': 'VN', 'VI': 'VI', 'WF': 'WF', 'EH': 'EH', 'YE': 'YE', 'ZM': 'ZM',
        'ZW': 'ZW'
    };
    
    const result = mappings[countryCode] || countryCode;
    
    if (result !== countryCode) {
        console.log(`🔄 Normalized ${countryCode} → ${result}`);
    }
    
    return result;
}

    /**
     * Main method: Get team data for any country
     */
    async getCountryTeams(countryCode) {
        if (!this.initialized) {
            await this.initialize();
        }

        // Use Football-Data.org for premium countries
        if (this.footballDataCountries.includes(countryCode)) {
            console.log(`🔴 Using Football-Data.org premium for ${countryCode}`);
            return await this.getFootballDataTeams(countryCode);
        }

        // Use free sources for all other countries
        return await this.getFreeSourceTeams(countryCode);
    }

    /**
     * Get teams using ENHANCED multi-source strategy (TheSportsDB + Wikidata + OpenFootball)
     */
    async getFreeSourceTeams(countryCode) {
        // Normalize country code first
        const normalizedCode = this.normalizeCountryCode(countryCode);
        const cacheKey = `free_${normalizedCode}`;
        
        // Try cache first
        const cachedData = await this.cache.get(cacheKey);
        if (cachedData) {
            this.requestCounts.cache++;
            console.log(`💾 Cache hit for ${normalizedCode}`);
            return cachedData;
        }

        console.log(`🔄 Fetching enhanced multi-source data for ${normalizedCode}...`);

        try {
            // Get country info (try both original and normalized codes)
            let countryInfo = this.getCountryInfo(normalizedCode) || this.getCountryInfo(countryCode);
            
            if (!countryInfo) {
                console.log(`⚠️ No country info for ${countryCode}/${normalizedCode}, creating fallback`);
                countryInfo = this.createFallbackCountryInfo(countryCode, normalizedCode);
            }

            // ENHANCED MULTI-SOURCE STRATEGY with intelligent priority
            console.log(`🎯 Starting intelligent data retrieval for ${normalizedCode}...`);
            
            // Classify country by data availability priority
            const countryPriority = this.classifyCountryPriority(normalizedCode, countryInfo);
            console.log(`📊 Country priority classification: ${countryPriority} for ${normalizedCode}`);
            
            let allTeams = [];
            let successfulSources = [];

            if (countryPriority === 'high' || countryPriority === 'medium') {
                // TIER 2 COUNTRIES: Use TheSportsDB as primary source
                console.log(`🏆 Using TheSportsDB as primary for ${normalizedCode}`);
                
                try {
                    const theSportsDBTeams = await this.theSportsDBService.getCountryTeams(normalizedCode);
                    if (theSportsDBTeams.length > 0) {
                        allTeams.push(...theSportsDBTeams);
                        successfulSources.push('thesportsdb');
                        console.log(`✅ TheSportsDB: ${theSportsDBTeams.length} teams for ${normalizedCode}`);
                    } else {
                        console.log(`⚠️ TheSportsDB: No teams found for ${normalizedCode}`);
                    }
                } catch (error) {
                    console.error(`❌ TheSportsDB failed for ${normalizedCode}:`, error);
                }

                // Supplement with Wikidata if TheSportsDB data is insufficient
                if (allTeams.length < 5 && countryInfo.wikidata) {
                    console.log(`📚 Supplementing with Wikidata for ${normalizedCode}`);
                    try {
                        const wikidataTeams = await this.getWikidataTeams(normalizedCode, countryInfo);
                        if (wikidataTeams.length > 0) {
                            allTeams.push(...wikidataTeams);
                            successfulSources.push('wikidata');
                            console.log(`✅ Wikidata supplement: ${wikidataTeams.length} teams for ${normalizedCode}`);
                        }
                    } catch (error) {
                        console.error(`❌ Wikidata supplement failed for ${normalizedCode}:`, error);
                    }
                }
            } else {
                // TIER 3 COUNTRIES: Use Wikidata as primary, OpenFootball as backup
                console.log(`📚 Using Wikidata as primary for ${normalizedCode}`);
                
                // Fetch from multiple sources in parallel for lower-tier countries
                const [wikidataResult, openFootballResult] = await Promise.allSettled([
                    countryInfo.wikidata ? this.getWikidataTeams(normalizedCode, countryInfo) : Promise.resolve([]),
                    this.getOpenFootballTeams(normalizedCode)
                ]);

                // Extract successful results
                const wikidataTeams = wikidataResult.status === 'fulfilled' ? wikidataResult.value : [];
                const openFootballTeams = openFootballResult.status === 'fulfilled' ? openFootballResult.value : [];

                if (wikidataTeams.length > 0) {
                    allTeams.push(...wikidataTeams);
                    successfulSources.push('wikidata');
                }
                if (openFootballTeams.length > 0) {
                    allTeams.push(...openFootballTeams);
                    successfulSources.push('openfootball');
                }

                console.log(`📊 Tier 3 data for ${normalizedCode}: Wikidata(${wikidataTeams.length}) + OpenFootball(${openFootballTeams.length})`);
            }

            // Merge and transform all collected data
            let mergedTeams = [];
            if (allTeams.length > 0) {
                // Group teams by source for better merging
                const teamsBySource = this.groupTeamsBySource(allTeams);
                mergedTeams = this.dataTransformer.mergeMultipleTeamSources(teamsBySource, normalizedCode);
                
                console.log(`🔧 Merged ${allTeams.length} raw teams into ${mergedTeams.length} final teams for ${normalizedCode}`);
            } else {
                console.log(`⚠️ No data from any source for ${normalizedCode}, creating fallback`);
                mergedTeams = this.createFallbackTeams(normalizedCode, countryInfo);
            }

            // Ensure we always return some team data
            if (mergedTeams.length === 0) {
                mergedTeams = this.createFallbackTeams(normalizedCode, countryInfo);
            }

            // Create final country data with enhanced metadata
            const countryData = {
                name: countryInfo.name || normalizedCode,
                flag: countryInfo.flag || '🌍',
                countryCode: normalizedCode,
                originalCode: countryCode,
                continent: countryInfo.continent || 'Unknown',
                priority: countryPriority,
                satelliteImageUrl: this.getSatelliteImage(normalizedCode),
                teams: mergedTeams,
                totalTeams: mergedTeams.length,
                dataSources: successfulSources,
                dataStrategy: this.getDataStrategyInfo(countryPriority, successfulSources),
                lastUpdated: new Date().toISOString(),
                cacheKey: cacheKey
            };

            // Cache the result
            await this.cache.set(cacheKey, countryData);

            console.log(`✅ Enhanced multi-source data compiled for ${normalizedCode}: ${countryData.teams.length} teams from [${successfulSources.join(', ')}]`);
            return countryData;

        } catch (error) {
            console.error(`❌ Error in enhanced data retrieval for ${normalizedCode}:`, error);
            return this.getFallbackData(normalizedCode);
        }
    }

    /**
     * Get teams from Wikidata
     */
    async getWikidataTeams(countryCode, countryInfo) {
        if (!countryInfo.wikidata) {
            console.log(`⚠️ No Wikidata ID for ${countryCode}`);
            return [];
        }

        try {
            this.requestCounts.wikidata++;
            const teams = await this.wikidataService.getCountryTeams(countryCode, countryInfo.wikidata);
            console.log(`✅ Wikidata: ${teams.length} teams for ${countryCode}`);
            return teams;

        } catch (error) {
            console.error(`❌ Wikidata error for ${countryCode}:`, error);
            return [];
        }
    }

    /**
     * Get teams from OpenFootball
     */
    async getOpenFootballTeams(countryCode) {
        try {
            this.requestCounts.openfootball++;
            const teams = await this.openFootballService.getCountryTeams(countryCode);
            console.log(`✅ OpenFootball: ${teams.length} teams for ${countryCode}`);
            return teams;

        } catch (error) {
            console.error(`❌ OpenFootball error for ${countryCode}:`, error);
            return [];
        }
    }

    /**
     * Get country information
     */
    getCountryInfo(countryCode) {
        if (!this.fifaCountries || !this.fifaCountries.countries) {
            return null;
        }

        const country = this.fifaCountries.countries[countryCode];
        return country || null;
    }

    /**
     * Get satellite image URL for country
     */
    getSatelliteImage(countryCode) {
        const satelliteImages = {
            'US': 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1920',
            'CA': 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=1920',
            'MX': 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=1920',
            'BR': 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1920',
            'AR': 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=1920',
            'CO': 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=1920',
            'AU': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920',
            'JP': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920',
            'CN': 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1920',
            'IN': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1920',
            'ZA': 'https://images.unsplash.com/photo-1484318571209-661cf29a69ea?w=1920',
            'NG': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1920',
            'EG': 'https://images.unsplash.com/photo-1539650116574-75c0c6d89380?w=1920',
            'MA': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1920',
            'GH': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920',
            'KE': 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=1920',
            'TZ': 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1920',
            'UG': 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=1920',
            'RW': 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=1920',
            'ET': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920',
            'SA': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920',
            'AE': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920',
            'QA': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1920',
            'IR': 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=1920',
            'IQ': 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=1920',
            'JO': 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=1920',
            'LB': 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=1920',
            'SY': 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=1920',
            'TR': 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=1920',
            'KR': 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=1920',
            'TH': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1920',
            'VN': 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1920',
            'MY': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1920',
            'SG': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920',
            'ID': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1920',
            'PH': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1920',
            'RU': 'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=1920',
            'UA': 'https://images.unsplash.com/photo-1565552645632-d725f8bfc19e?w=1920',
            'PL': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920',
            'CZ': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920',
            'SK': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920',
            'HU': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920',
            'RO': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920',
            'BG': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920',
            'HR': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920',
            'RS': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920',
            'BA': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920',
            'SI': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920',
            'MK': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920',
            'AL': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920',
            'ME': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920',
            'XK': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920',
            'NO': 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920',
            'SE': 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=1920',
            'DK': 'https://images.unsplash.com/photo-1513250034398-b5b1a9ec53c6?w=1920',
            'FI': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920',
            'IS': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920',
            'IE': 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=1920',
            'CH': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920',
            'AT': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920',
            'BE': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920',
            'LU': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920',
            'LI': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920',
            'MC': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920',
            'SM': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920',
            'MT': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920',
            'CY': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920',
            'GR': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920',
            'NZ': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920',
            'FJ': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920'
        };

        return satelliteImages[countryCode] || 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=1920';
    }

    /**
     * Get Football-Data.org teams (for premium countries)
     */
    async getFootballDataTeams(countryCode) {
        // This integrates with your existing footballDataManager
        // Return standardized format
        return {
            name: this.getCountryInfo(countryCode)?.name || 'Unknown Country',
            flag: this.getCountryInfo(countryCode)?.flag || '🌍',
            countryCode: countryCode,
            continent: this.getCountryInfo(countryCode)?.continent || 'World',
            priority: 1,
            satelliteImageUrl: this.getSatelliteImage(countryCode),
            teams: [], // Will be populated by your existing system
            totalTeams: 0,
            dataSources: ['football-data.org'],
            lastUpdated: new Date().toISOString(),
            isPremium: true
        };
    }

    /**
     * Get data sources used
     */
    getUsedSources(wikidataResults, openFootballResults) {
        const sources = [];
        if (wikidataResults.length > 0) sources.push('wikidata');
        if (openFootballResults.length > 0) sources.push('openfootball');
        return sources;
    }

    /**
     * Get fallback data for countries with no available data
     */
    getFallbackData(countryCode) {
        const countryInfo = this.getCountryInfo(countryCode);
        
        return {
            name: countryInfo?.name || 'Unknown Country',
            flag: countryInfo?.flag || '🌍',
            countryCode: countryCode,
            continent: countryInfo?.continent || 'World',
            priority: 3,
            satelliteImageUrl: this.getSatelliteImage(countryCode),
            teams: [
                {
                    id: `${countryCode.toLowerCase()}-national-fc`,
                    name: `${countryInfo?.name || countryCode} National FC`,
                    shortName: countryCode,
                    city: 'Capital City',
                    country: countryCode,
                    founded: 1950,
                    stadium: {
                        name: 'National Stadium',
                        capacity: 30000,
                        coordinates: { x: 50, y: 50 }
                    },
                    league: 'National League',
                    website: null,
                    colors: ['#4CAF50', '#FFFFFF'],
                    achievements: ['National Champions'],
                    source: 'fallback',
                    confidence: 0.3,
                    lastUpdated: new Date().toISOString()
                }
            ],
            totalTeams: 1,
            dataSources: ['fallback'],
            lastUpdated: new Date().toISOString(),
            isFallback: true
        };
    }

    /**
     * Start auto-updates
     */
    startAutoUpdates() {
        if (!this.updateScheduler) {
            console.error('❌ Update scheduler not initialized');
            return;
        }

        this.updateScheduler.start();
        console.log('🚀 Auto-updates started for all 211+ FIFA countries');
    }

    /**
     * Stop auto-updates
     */
    stopAutoUpdates() {
        if (this.updateScheduler) {
            this.updateScheduler.stop();
        }
        console.log('🛑 Auto-updates stopped');
    }

    /**
     * Force update specific countries
     */
    forceUpdate(countryCodes) {
        if (this.updateScheduler) {
            this.updateScheduler.forceUpdate(countryCodes, 'manual_force');
        }
    }

    /**
     * Get system statistics
     */
    getStats() {
        return {
            initialized: this.initialized,
            fifaCountries: this.fifaCountries?.totalCountries || 0,
            cache: this.cache.getStats(),
            requests: this.requestCounts,
            updateScheduler: this.updateScheduler?.getStats() || null,
            coverage: {
                premiumCountries: this.footballDataCountries.length,
                freeCountries: this.fifaCountries ? 
                    this.fifaCountries.totalCountries - this.footballDataCountries.length : 0,
                totalCoverage: this.fifaCountries?.totalCountries || 0
            }
        };
    }

    /**
     * Clear all cached data
     */
    clearAllCache() {
        this.cache.clearAllTeamCache();
        console.log('🗑️ All team cache cleared');
    }

    /**
     * Manual data refresh for specific country
     */
    async refreshCountry(countryCode) {
        console.log(`🔄 Manual refresh for ${countryCode}`);
        
        // Clear cache for this country
        const cacheKey = `free_${countryCode}`;
        this.cache.memoryCache.delete(cacheKey);
        
        // Fetch fresh data
        return await this.getFreeSourceTeams(countryCode);
    }

    /**
     * Bulk refresh for multiple countries
     */
    async bulkRefresh(countryCodes, batchSize = 5) {
        console.log(`🔄 Bulk refresh for ${countryCodes.length} countries`);
        
        const results = [];
        for (let i = 0; i < countryCodes.length; i += batchSize) {
            const batch = countryCodes.slice(i, i + batchSize);
            
            const batchResults = await Promise.allSettled(
                batch.map(code => this.refreshCountry(code))
            );
            
            results.push(...batchResults);
            
            // Delay between batches
            if (i + batchSize < countryCodes.length) {
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
        
        console.log(`✅ Bulk refresh complete: ${results.filter(r => r.status === 'fulfilled').length}/${results.length} successful`);
        return results;
    }

    /**
     * Health check for all data sources
     */
    async healthCheck() {
        console.log('🔍 Running health check on data sources...');
        
        const results = {
            wikidata: await this.testWikidata(),
            openfootball: await this.testOpenFootball(),
            cache: this.cache.getStats(),
            timestamp: new Date().toISOString()
        };

        console.log('📋 Health check results:', results);
        return results;
    }

    /**
     * Test Wikidata connectivity
     */
    async testWikidata() {
        try {
            const testQuery = `
                SELECT (COUNT(*) as ?count) WHERE {
                    ?team wdt:P31/wdt:P279* wd:Q476028 .
                    ?team wdt:P17 wd:Q29 .  # Spain as test
                }
                LIMIT 1
            `;

            const response = await fetch(this.wikidataService.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/sparql-query',
                    'Accept': 'application/sparql-results+json'
                },
                body: testQuery
            });

            return {
                status: response.ok ? 'healthy' : 'error',
                responseTime: response.headers.get('x-response-time') || 'unknown',
                statusCode: response.status
            };

        } catch (error) {
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    /**
     * Test OpenFootball connectivity
     */
    async testOpenFootball() {
        try {
            const testUrl = `${this.openFootballService.baseUrl}spain/2023-24/1-laliga.json`;
            const response = await fetch(testUrl);

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

    /**
     * Get coverage report
     */
    async getCoverageReport() {
        console.log('📊 Generating coverage report...');

        const report = {
            totalFIFACountries: this.fifaCountries?.totalCountries || 0,
            coverage: {
                premium: { countries: this.footballDataCountries, count: this.footballDataCountries.length },
                free: { count: 0, countries: [] },
                missing: { count: 0, countries: [] }
            },
            byContinent: {},
            lastGenerated: new Date().toISOString()
        };

        // Calculate coverage by continent
        if (this.fifaCountries?.countries) {
            const continents = {};
            
            Object.entries(this.fifaCountries.countries).forEach(([code, info]) => {
                const continent = info.continent;
                if (!continents[continent]) {
                    continents[continent] = { total: 0, premium: 0, free: 0 };
                }
                
                continents[continent].total++;
                
                if (this.footballDataCountries.includes(code)) {
                    continents[continent].premium++;
                } else {
                    continents[continent].free++;
                    report.coverage.free.countries.push(code);
                }
            });

            report.coverage.free.count = report.coverage.free.countries.length;
            report.byContinent = continents;
        }

        console.log('📊 Coverage report generated:', report);
        return report;
    }

    /**
     * Export data for analysis
     */
    async exportData(format = 'json') {
        const data = {
            metadata: {
                exportedAt: new Date().toISOString(),
                totalCountries: this.fifaCountries?.totalCountries || 0,
                format: format
            },
            countries: this.fifaCountries?.countries || {},
            stats: this.getStats()
        };

        switch (format) {
            case 'json':
                return JSON.stringify(data, null, 2);
            case 'csv':
                return this.convertToCSV(data);
            default:
                return data;
        }
    }

    /**
     * Convert data to CSV format
     */
    convertToCSV(data) {
        const headers = ['Country Code', 'Country Name', 'Continent', 'Priority', 'Flag', 'Has Premium Data'];
        const rows = [headers.join(',')];

        Object.entries(data.countries).forEach(([code, info]) => {
            const row = [
                code,
                `"${info.name}"`,
                info.continent,
                info.priority,
                info.flag,
                this.footballDataCountries.includes(code) ? 'Yes' : 'No'
            ];
            rows.push(row.join(','));
        });

        return rows.join('\n');
    } // ← This closing brace ends the convertToCSV method

    /**
     * Create fallback country info for unknown countries
     */
    createFallbackCountryInfo(originalCode, normalizedCode) {
        // ... the helper method code goes here
    }

    /**
     * Create realistic fallback teams when no data is available
     */
    createFallbackTeams(countryCode, countryInfo) {
        // ... the helper method code goes here  
    }

    /**
 * Create fallback country info for unknown countries
 */
createFallbackCountryInfo(originalCode, normalizedCode) {
    return {
        name: this.fifaCountries?.countries?.[normalizedCode]?.name || originalCode,
        flag: this.fifaCountries?.countries?.[normalizedCode]?.flag || '🌍',
        continent: 'Unknown',
        priority: 3,
        wikidata: null
    };
}

/**
 * Create realistic fallback teams when no data is available
 */
createFallbackTeams(countryCode, countryInfo) {
    return [
        {
            id: `${countryCode.toLowerCase()}-national-fc`,
            name: `${countryInfo.name} National FC`,
            shortName: countryCode,
            city: 'Capital City',
            country: countryCode,
            founded: 1950,
            stadium: {
                name: 'National Stadium',
                capacity: 30000,
                coordinates: {
                    latitude: 0,
                    longitude: 0,
                    x: 50,
                    y: 50
                }
            },
            league: 'National League',
            website: null,
            colors: ['#4CAF50', '#FFFFFF'],
            achievements: ['National Champions'],
            source: 'fallback',
            confidence: 0.3,
            lastUpdated: new Date().toISOString()
        }
    ];
}

/**
 * Classify country by data availability priority
 */
classifyCountryPriority(countryCode, countryInfo) {
    // High priority: Major footballing nations with good API coverage
    const highPriorityCountries = [
        'US', 'MX', 'CA', 'BR', 'AR', 'CO', 'CL', 'PE', 'UY', 'EC',
        'NG', 'GH', 'EG', 'ZA', 'MA', 'AU', 'JP', 'KR', 'CN', 'IN',
        'RU', 'TR', 'PL', 'BE', 'CH', 'AT', 'GR', 'HR', 'RS', 'CZ', 'UA'
    ];
    
    // Medium priority: Smaller nations with some coverage
    const mediumPriorityCountries = [
        'NO', 'SE', 'DK', 'FI', 'IS', 'IE', 'SK', 'HU', 'RO', 'BG',
        'SI', 'BA', 'MK', 'AL', 'ME', 'XK', 'LV', 'LT', 'EE', 'BY', 'MD'
    ];
    
    if (highPriorityCountries.includes(countryCode)) return 'high';
    if (mediumPriorityCountries.includes(countryCode)) return 'medium';
    return 'low';
}

/**
 * Group teams by their data source
 */
groupTeamsBySource(teams) {
    const grouped = {
        thesportsdb: [],
        wikidata: [],
        openfootball: []
    };
    
    teams.forEach(team => {
        if (team.source && grouped[team.source]) {
            grouped[team.source].push(team);
        }
    });
    
    return grouped;
}

/**
 * Get data strategy information for metadata
 */
getDataStrategyInfo(priority, sources) {
    return {
        priority: priority,
        primarySource: sources[0] || 'fallback',
        sourceCount: sources.length,
        strategy: priority === 'high' ? 'thesportsdb_primary' : 
                 priority === 'medium' ? 'thesportsdb_primary' : 'wikidata_primary'
    };
}

/**
 * Get teams from TheSportsDB with error handling
 */
async getTheSportsDBTeams(countryCode) {
    try {
        this.requestCounts.thesportsdb = (this.requestCounts.thesportsdb || 0) + 1;
        const teams = await this.theSportsDBService.getCountryTeams(countryCode);
        console.log(`✅ TheSportsDB: ${teams.length} teams for ${countryCode}`);
        return teams;
    } catch (error) {
        console.error(`❌ TheSportsDB error for ${countryCode}:`, error);
        return [];
    }
}

/**
 * Test all data sources health
 */
async testAllSources() {
    console.log('🏥 Testing all data source health...');
    
    const results = await Promise.allSettled([
        this.testWikidata(),
        this.testOpenFootball(),
        this.theSportsDBService.testConnection()
    ]);
    
    return {
        wikidata: results[0].status === 'fulfilled' ? results[0].value : { status: 'error', error: results[0].reason },
        openfootball: results[1].status === 'fulfilled' ? results[1].value : { status: 'error', error: results[1].reason },
        thesportsdb: results[2].status === 'fulfilled' ? results[2].value : { status: 'error', error: results[2].reason },
        timestamp: new Date().toISOString()
    };
}

/**
 * Enhanced statistics including all sources
 */
getEnhancedStats() {
    return {
        ...this.getStats(),
        sources: {
            thesportsdb: {
                requests: this.requestCounts.thesportsdb || 0,
                status: 'active'
            },
            wikidata: {
                requests: this.requestCounts.wikidata || 0,
                status: 'active'
            },
            openfootball: {
                requests: this.requestCounts.openfootball || 0,
                status: 'active'
            }
        },
        dataStrategy: {
            tier1Countries: 8, // Premium football-data.org
            tier2Countries: 50, // TheSportsDB primary
            tier3Countries: 153, // Wikidata + OpenFootball
            totalCoverage: 211
        }
    };
}


} // ← This is the final closing brace of the GlobalDataManager class