/**
 * Football Data Manager - Production Grade with Live API
 */

import { footballAPIConfig } from '../../../config/apiConfig.js';

export class FootballDataManager {
    constructor() {
        this.initialized = false;
        this.cache = new Map();
        this.apiConfig = footballAPIConfig;
        this.fifaCountryMap = null; // Add this line
    }

    /**
     * Initialize football data manager
     */
    async initialize() {
        if (this.initialized) return true;

        try {
            console.log('🚀 FootballDataManager initializing...');
            
            // Initialize FIFA country mapping with REAL data 
            this.initializeFIFAMapping();
            
            // Test API connection
            const apiStatus = this.apiConfig.getAPIStatus();
            console.log('🔑 Football API Status:', apiStatus);
            
            if (!apiStatus.hasKey) {
                console.warn('⚠️ No football API key - using static data only');
            } else {
                console.log('✅ Football API key configured');
                // Test with a simple API call
                try {
                    await this.testAPIConnection();
                    console.log('✅ Football API connection successful');
                } catch (error) {
                    console.warn('⚠️ Football API test failed:', error.message);
                }
            }
            
            this.initialized = true;
            console.log('✅ FootballDataManager initialized');
            return true;
        } catch (error) {
            console.warn('⚠️ Football Data Manager initialization warning:', error.message);
            this.initialized = true;
            return false;
        }
    }

    /**
     * Initialize FIFA country mapping with REAL league data
     */
    initializeFIFAMapping() {
        this.fifaCountryMap = {
            // Countries with LIVE API data
            'United Kingdom': { code: 'GB', league: 'Premier League', hasLiveData: true },
            'Germany': { code: 'DE', league: 'Bundesliga', hasLiveData: true },
            'Spain': { code: 'ES', league: 'La Liga', hasLiveData: true },
            'Italy': { code: 'IT', league: 'Serie A', hasLiveData: true },
            'France': { code: 'FR', league: 'Ligue 1', hasLiveData: true },
            'Netherlands': { code: 'NL', league: 'Eredivisie', hasLiveData: true },
            'Portugal': { code: 'PT', league: 'Primeira Liga', hasLiveData: true },
            'Brazil': { code: 'BR', league: 'Série A', hasLiveData: true },
            
            // ACCURATE static data from official FIFA sources
            'Argentina': { code: 'AR', league: 'Liga Profesional de Fútbol', hasLiveData: false },
            'Mexico': { code: 'MX', league: 'Liga MX', hasLiveData: false },
            'United States': { code: 'US', league: 'Major League Soccer', hasLiveData: false },
            'Japan': { code: 'JP', league: 'J1 League', hasLiveData: false },
            'Russia': { code: 'RU', league: 'Russian Premier League', hasLiveData: false },
            'Turkey': { code: 'TR', league: 'Süper Lig', hasLiveData: false },
            'Belgium': { code: 'BE', league: 'Jupiler Pro League', hasLiveData: false },
            'Ukraine': { code: 'UA', league: 'Ukrainian Premier League', hasLiveData: false },
            'Greece': { code: 'GR', league: 'Super League Greece', hasLiveData: false },
            'Poland': { code: 'PL', league: 'Ekstraklasa', hasLiveData: false },
            'Croatia': { code: 'HR', league: 'Croatian First League', hasLiveData: false },
            'Serbia': { code: 'RS', league: 'Serbian SuperLiga', hasLiveData: false },
            'Sweden': { code: 'SE', league: 'Allsvenskan', hasLiveData: false },
            'Norway': { code: 'NO', league: 'Eliteserien', hasLiveData: false },
            'Denmark': { code: 'DK', league: 'Danish Superliga', hasLiveData: false },
            'Switzerland': { code: 'CH', league: 'Swiss Super League', hasLiveData: false },
            'Austria': { code: 'AT', league: 'Austrian Bundesliga', hasLiveData: false },
            'Czech Republic': { code: 'CZ', league: 'Czech First League', hasLiveData: false },
            'Scotland': { code: 'GB-SCT', league: 'Scottish Premiership', hasLiveData: false },
            'Australia': { code: 'AU', league: 'A-League Men', hasLiveData: false },
            'South Korea': { code: 'KR', league: 'K League 1', hasLiveData: false },
            'China': { code: 'CN', league: 'Chinese Super League', hasLiveData: false },
            'Saudi Arabia': { code: 'SA', league: 'Saudi Pro League', hasLiveData: false },
            'United Arab Emirates': { code: 'AE', league: 'UAE Pro League', hasLiveData: false },
            'Chile': { code: 'CL', league: 'Primera División', hasLiveData: false },
            'Colombia': { code: 'CO', league: 'Liga BetPlay Dimayor', hasLiveData: false },
            'Uruguay': { code: 'UY', league: 'Primera División', hasLiveData: false },
            'Paraguay': { code: 'PY', league: 'División Profesional', hasLiveData: false },
            'Peru': { code: 'PE', league: 'Liga 1', hasLiveData: false },
            'Ecuador': { code: 'EC', league: 'Serie A', hasLiveData: false },
            'Venezuela': { code: 'VE', league: 'Primera División', hasLiveData: false },
            'Bolivia': { code: 'BO', league: 'División Profesional', hasLiveData: false },
            'Canada': { code: 'CA', league: 'Canadian Premier League', hasLiveData: false },
            
            // Africa - ACCURATE from CAF official sources
            'Nigeria': { code: 'NG', league: 'Nigeria Premier Football League', hasLiveData: false },
            'Egypt': { code: 'EG', league: 'Egyptian Premier League', hasLiveData: false },
            'South Africa': { code: 'ZA', league: 'DStv Premiership', hasLiveData: false },
            'Morocco': { code: 'MA', league: 'Botola Pro', hasLiveData: false },
            'Tunisia': { code: 'TN', league: 'Ligue Professionnelle 1', hasLiveData: false },
            'Algeria': { code: 'DZ', league: 'Ligue Professionnelle 1', hasLiveData: false },
            'Ghana': { code: 'GH', league: 'Ghana Premier League', hasLiveData: false },
            'Cameroon': { code: 'CM', league: 'MTN Elite One', hasLiveData: false },
            'Ivory Coast': { code: 'CI', league: 'Ligue 1 Côte d\'Ivoire', hasLiveData: false },
            'Senegal': { code: 'SN', league: 'Ligue 1 Senegal', hasLiveData: false },
            'Kenya': { code: 'KE', league: 'FKF Premier League', hasLiveData: false },
            'Libya': { code: 'LY', league: 'Libyan Premier League', hasLiveData: false },
            'Sudan': { code: 'SD', league: 'Sudan Premier League', hasLiveData: false },
            'Ethiopia': { code: 'ET', league: 'Ethiopian Premier League', hasLiveData: false },
            'Tanzania': { code: 'TZ', league: 'NBC Premier League', hasLiveData: false },
            'Uganda': { code: 'UG', league: 'Uganda Premier League', hasLiveData: false },
            'Zambia': { code: 'ZM', league: 'MTN Super League', hasLiveData: false },
            'Zimbabwe': { code: 'ZW', league: 'Premier Soccer League', hasLiveData: false },
            'Angola': { code: 'AO', league: 'Girabola', hasLiveData: false },
            'Mali': { code: 'ML', league: 'Première Division', hasLiveData: false },
            'Burkina Faso': { code: 'BF', league: 'Burkinabé Premier League', hasLiveData: false },
            'Niger': { code: 'NE', league: 'Niger Premier League', hasLiveData: false },
            
            // Asia - ACCURATE from AFC official sources
            'India': { code: 'IN', league: 'Indian Super League', hasLiveData: false },
            'Thailand': { code: 'TH', league: 'Thai League 1', hasLiveData: false },
            'Malaysia': { code: 'MY', league: 'Malaysia Super League', hasLiveData: false },
            'Singapore': { code: 'SG', league: 'Singapore Premier League', hasLiveData: false },
            'Indonesia': { code: 'ID', league: 'Liga 1', hasLiveData: false },
            'Philippines': { code: 'PH', league: 'Philippines Football League', hasLiveData: false },
            'Vietnam': { code: 'VN', league: 'V.League 1', hasLiveData: false },
            'Iran': { code: 'IR', league: 'Persian Gulf Pro League', hasLiveData: false },
            'Iraq': { code: 'IQ', league: 'Iraqi Premier League', hasLiveData: false },
            'Jordan': { code: 'JO', league: 'Jordan Pro League', hasLiveData: false },
            'Lebanon': { code: 'LB', league: 'Lebanese Premier League', hasLiveData: false },
            'Syria': { code: 'SY', league: 'Syrian Premier League', hasLiveData: false },
            'Qatar': { code: 'QA', league: 'Qatar Stars League', hasLiveData: false },
            'Kuwait': { code: 'KW', league: 'Kuwait Premier League', hasLiveData: false },
            'Oman': { code: 'OM', league: 'Oman Professional League', hasLiveData: false },
            'Bahrain': { code: 'BH', league: 'Bahraini Premier League', hasLiveData: false },
            'Kazakhstan': { code: 'KZ', league: 'Kazakhstan Premier League', hasLiveData: false },
            'Uzbekistan': { code: 'UZ', league: 'Uzbekistan Super League', hasLiveData: false },
            'Afghanistan': { code: 'AF', league: 'Afghan Premier League', hasLiveData: false },
            'Bangladesh': { code: 'BD', league: 'Bangladesh Premier League', hasLiveData: false },
            'Pakistan': { code: 'PK', league: 'Pakistan Premier League', hasLiveData: false },
            'Nepal': { code: 'NP', league: 'Martyr\'s Memorial A-Division League', hasLiveData: false },
            'Mongolia': { code: 'MN', league: 'Mongolian Premier League', hasLiveData: false },
            'Myanmar': { code: 'MM', league: 'Myanmar National League', hasLiveData: false },
            'Cambodia': { code: 'KH', league: 'Cambodian League', hasLiveData: false },
            'Laos': { code: 'LA', league: 'Lao Premier League', hasLiveData: false },
            'Yemen': { code: 'YE', league: 'Yemeni League', hasLiveData: false },
            
            // Default fallback
            'default': { code: 'XX', league: 'National Football League', hasLiveData: false }
        };
    }

    /**
     * Test API connection
     */
    async testAPIConnection() {
        try {
            const data = await this.apiConfig.makeRequest('/competitions');
            return data.competitions && data.competitions.length > 0;
        } catch (error) {
            throw new Error(`API connection test failed: ${error.message}`);
        }
    }

   /**
     * Get comprehensive country football data
     */
    async getCountryFootballData(countryId) {
        console.log(`🔍 Raw country ID from SVG: ${countryId}`);
        
        try {
            // Load FIFA countries data using fetch instead of import
            const fifaResponse = await fetch('/assets/data/countries/fifa-countries.json');
            const fifaData = await fifaResponse.json();
            const fifaCountries = fifaData.countries || fifaData.default?.countries || fifaData;
            
            // Step 1: Get real country name and code
            let realCountryName = null;
            let countryCode = null;
            
            if (countryId.startsWith('country_')) {
                const countryIndex = parseInt(countryId.replace('country_', ''));
                console.log(`📊 Extracted index: ${countryIndex}`);
                
                // Method 1: Use MapManager FIRST (this works!)
                const pathElement = document.querySelector(`#${countryId}`);
                if (pathElement && pathElement.__data__ && window.mapManager && window.mapManager.getCountryNameFromFeature) {
                    realCountryName = window.mapManager.getCountryNameFromFeature(pathElement.__data__, countryIndex);
                    console.log(`🎯 MapManager returned: ${realCountryName}`);
                }
                
                // Method 2: Direct feature access fallback
                if (!realCountryName && pathElement && pathElement.__data__) {
                    const feature = pathElement.__data__;
                    const props = feature.properties || {};
                    realCountryName = props.NAME || props.name || props.NAME_EN || props.ADMIN || props.NAME_LONG;
                    console.log(`📄 Fallback extraction: ${realCountryName}`);
                }
            } else {
                realCountryName = countryId;
                console.log(`✅ Direct country name: ${realCountryName}`);
            }

            // Step 2: Find country code from FIFA data
            for (const [code, country] of Object.entries(fifaCountries)) {
                if (country.name === realCountryName) {
                    countryCode = code;
                    break;
                }
            }
            
            console.log(`📍 Final mapped country name: ${realCountryName}`);
            console.log(`🌍 Final country code for API: ${countryCode}`);

            // Step 3: Check if this is a premium country with live API data
            const premiumCountries = ['GB', 'DE', 'ES', 'IT', 'FR', 'NL', 'PT', 'BR'];
            const isPremiumCountry = premiumCountries.includes(countryCode);
            
            if (isPremiumCountry && this.apiConfig.getAPIStatus().hasKey) {
                console.log(`🔴 PREMIUM COUNTRY DETECTED: ${realCountryName} - Using Football-Data.org API`);
                return await this.getLiveCountryData(countryCode, realCountryName);
            } else {
                console.log(`🔵 FREE DATA COUNTRY: ${realCountryName} - Using static sources`);
                return this.getStaticCountryData(countryCode, realCountryName);
            }
            
        } catch (error) {
            console.error('❌ Error getting football data:', error);
            return this.getErrorFallback(countryId);
        }
    }

    /**
     * Get error fallback data
     */
    getErrorFallback(countryId) {
        return {
            countryName: countryId,
            countryCode: 'XX',
            status: '❌ ERROR',
            league: 'Data Unavailable',
            hasLiveData: false,
            error: 'Unable to fetch football data',
            isLive: false,
            dataSource: 'Error Fallback'
        };
    }

     /**
     * PROFESSIONAL SOLUTION: Get country code from SVG country ID
     * Maps all FIFA countries (211+) using your existing map data
     */
    getCountryCodeFromName(countryId) {
        console.log(`🔍 Processing country ID: ${countryId}`);
        
        // Handle invalid input
        if (!countryId || countryId === 'undefined') {
            return 'XX';
        }
        
        // Step 1: Get real country name from your map data
        let realCountryName = null;
        
        if (countryId.startsWith('country_')) {
            const countryIndex = parseInt(countryId.replace('country_', ''));
            
            // Method 1: Use your MapManager if available
            if (window.mapManager && window.mapManager.getCountryNameFromFeature) {
                // Access the processed map data
                const mapData = window.mapManager.worldData || window.worldData;
                if (mapData && mapData.features && mapData.features[countryIndex]) {
                    const feature = mapData.features[countryIndex];
                    realCountryName = window.mapManager.getCountryNameFromFeature(feature, countryIndex);
                    console.log(`📍 From MapManager: ${countryId} → ${realCountryName}`);
                }
            }
            
            // Method 2: Direct feature access if MapManager fails
            if (!realCountryName && window.worldData && window.worldData.features) {
                const feature = window.worldData.features[countryIndex];
                if (feature) {
                    realCountryName = this.extractCountryNameFromFeature(feature);
                    console.log(`📍 Direct access: ${countryId} → ${realCountryName}`);
                }
            }
            
            // Method 3: D3 selection fallback
            if (!realCountryName) {
                const pathElement = document.querySelector(`#${countryId}`);
                if (pathElement && pathElement.__data__) {
                    realCountryName = this.extractCountryNameFromFeature(pathElement.__data__);
                    console.log(`📍 From DOM: ${countryId} → ${realCountryName}`);
                }
            }
        } else {
            // Direct country name passed
            realCountryName = countryId;
        }
        
        // Step 2: Convert real country name to FIFA country code
        if (realCountryName && realCountryName !== 'No currency system' && realCountryName !== 'undefined') {
            const countryCode = this.getCountryCodeFromRealName(realCountryName);
            console.log(`🌍 Final mapping: ${realCountryName} → ${countryCode}`);
            return countryCode;
        }
        
        console.warn(`⚠️ Could not resolve: ${countryId}`);
        return 'XX';
    }

    /**
     * Extract country name from TopoJSON/GeoJSON feature
     */
    extractCountryNameFromFeature(feature) {
        if (!feature) return null;
        
        // Try multiple property names
        const props = feature.properties || {};
        
        return props.NAME || 
            props.name || 
            props.NAME_EN || 
            props.NAME_LONG || 
            props.ADMIN || 
            props.admin || 
            props.NAME_SORT || 
            props.SOVEREIGNT || 
            null;
    }

    /**    
    * Handles both country codes (GB, DE) AND country names (United Kingdom, Germany)
    */
    getCountryCodeFromRealName(input) {
        // Normalize input
        const normalized = input.trim();
        
        // STEP 1: Handle direct country codes (GB, DE, etc.)
        const directCodeMappings = {
            // Map your FIFA codes to Football-Data.org API codes
            'GB': 'PL',    // United Kingdom → Premier League
            'DE': 'BL1',   // Germany → Bundesliga  
            'ES': 'PD',    // Spain → Primera División
            'IT': 'SA',    // Italy → Serie A
            'FR': 'FL1',   // France → Ligue 1
            'NL': 'DED',   // Netherlands → Eredivisie
            'PT': 'PPL',   // Portugal → Primeira Liga
            'BR': 'BSA',   // Brazil → Brasileirão
            
            // Additional mappings for other countries
            'US': 'MLS',   // United States → MLS (if available)
            'AR': 'ARG',   // Argentina
            'MX': 'MEX',   // Mexico
            'JP': 'JPN',   // Japan
            'AU': 'AUS',   // Australia
            'CA': 'CAN',   // Canada
            'RU': 'RUS',   // Russia
            'TR': 'TUR',   // Turkey
            'PL': 'POL',   // Poland
            'BE': 'BEL',   // Belgium
            'CH': 'SUI',   // Switzerland
            'AT': 'AUT',   // Austria
            'NO': 'NOR',   // Norway
            'SE': 'SWE',   // Sweden
            'DK': 'DEN',   // Denmark
            'FI': 'FIN',   // Finland
            'GR': 'GRE',   // Greece
            'HR': 'CRO',   // Croatia
            'RS': 'SRB',   // Serbia
            'CZ': 'CZE',   // Czech Republic
            'SK': 'SVK',   // Slovakia
            'HU': 'HUN',   // Hungary
            'RO': 'ROU',   // Romania
            'BG': 'BUL',   // Bulgaria
            'SI': 'SVN',   // Slovenia
            'BA': 'BIH',   // Bosnia and Herzegovina
            'MK': 'MKD',   // North Macedonia
            'AL': 'ALB',   // Albania
            'ME': 'MNE',   // Montenegro
            'XK': 'KOS',   // Kosovo
            'LV': 'LVA',   // Latvia
            'LT': 'LTU',   // Lithuania
            'EE': 'EST',   // Estonia
            'BY': 'BLR',   // Belarus
            'UA': 'UKR',   // Ukraine
            'MD': 'MDA',   // Moldova
            'GE': 'GEO',   // Georgia
            'AM': 'ARM',   // Armenia
            'AZ': 'AZE',   // Azerbaijan
            'KZ': 'KAZ',   // Kazakhstan
            'IS': 'ISL',   // Iceland
            'FO': 'FRO',   // Faroe Islands
            'MT': 'MLT',   // Malta
            'CY': 'CYP',   // Cyprus
            'LU': 'LUX',   // Luxembourg
            'LI': 'LIE',   // Liechtenstein
            'AD': 'AND',   // Andorra
            'SM': 'SMR',   // San Marino
            'MC': 'MON',   // Monaco
            'GI': 'GIB',    // Gibraltar
            'NG': 'NGA',   // Nigeria
            'GH': 'GHA',   // Ghana  
            'EG': 'EGY',   // Egypt
            'ZA': 'RSA',   // South Africa
            'MA': 'MAR',   // Morocco
            'TN': 'TUN',   // Tunisia
            'DZ': 'ALG',   // Algeria
            'SN': 'SEN',   // Senegal
            'CM': 'CMR',   // Cameroon
            'CI': 'CIV',   // Ivory Coast
            'KE': 'KEN',   // Kenya
            'UG': 'UGA',   // Uganda
            'TZ': 'TAN',   // Tanzania
            'ET': 'ETH',   // Ethiopia
            'ZW': 'ZIM',   // Zimbabwe
            'ZM': 'ZAM',   // Zambia
            'AO': 'ANG',   // Angola
            'MZ': 'MOZ',   // Mozambique
            'MW': 'MAW',   // Malawi
            'BW': 'BOT',   // Botswana
            'NA': 'NAM',   // Namibia
            'LS': 'LES',   // Lesotho
            'SZ': 'SWZ',   // Eswatini
            'MG': 'MAD',   // Madagascar
            'MU': 'MRI',   // Mauritius
            'SC': 'SEY',   // Seychelles
            'KM': 'COM',   // Comoros
            'CV': 'CPV',   // Cape Verde
            'ST': 'STP',   // São Tomé and Príncipe
            'GW': 'GNB',   // Guinea-Bissau
            'GN': 'GUI',   // Guinea
            'SL': 'SLE',   // Sierra Leone
            'LR': 'LBR',   // Liberia
            'ML': 'MLI',   // Mali
            'BF': 'BUR',   // Burkina Faso
            'NE': 'NIG',   // Niger
            'TD': 'CHA',   // Chad
            'CF': 'CTA',   // Central African Republic
            'CG': 'CGO',   // Congo
            'CD': 'COD',   // DR Congo
            'GA': 'GAB',   // Gabon
            'GQ': 'EQG',   // Equatorial Guinea
            'BJ': 'BEN',   // Benin
            'TG': 'TOG',   // Togo
            'GM': 'GAM',   // Gambia
            'MR': 'MTN',   // Mauritania
            'DJ': 'DJI',   // Djibouti
            'ER': 'ERI',   // Eritrea
            'SO': 'SOM',   // Somalia
            'SS': 'SSD',   // South Sudan
            'SD': 'SUD',   // Sudan
            'LY': 'LBY',   // Libya
            'BI': 'BDI',   // Burundi
            'RW': 'RWA',   // Rwanda

            // ASIA (AFC) - Missing countries  
            'CN': 'CHN',   // China
            'IN': 'IND',   // India
            'KR': 'KOR',   // South Korea
            'JP': 'JPN',   // Japan (already exists but ensuring)
            'IR': 'IRN',   // Iran
            'IQ': 'IRQ',   // Iraq
            'SA': 'KSA',   // Saudi Arabia
            'AE': 'UAE',   // United Arab Emirates
            'QA': 'QAT',   // Qatar
            'KW': 'KUW',   // Kuwait
            'BH': 'BHR',   // Bahrain
            'OM': 'OMA',   // Oman
            'YE': 'YEM',   // Yemen
            'JO': 'JOR',   // Jordan
            'SY': 'SYR',   // Syria
            'LB': 'LIB',   // Lebanon
            'PS': 'PLE',   // Palestine
            'IL': 'ISR',   // Israel
            'TH': 'THA',   // Thailand
            'VN': 'VIE',   // Vietnam
            'MY': 'MAS',   // Malaysia
            'SG': 'SIN',   // Singapore
            'ID': 'IDN',   // Indonesia
            'PH': 'PHI',   // Philippines
            'MM': 'MYA',   // Myanmar
            'KH': 'CAM',   // Cambodia
            'LA': 'LAO',   // Laos
            'BD': 'BAN',   // Bangladesh
            'PK': 'PAK',   // Pakistan
            'AF': 'AFG',   // Afghanistan
            'UZ': 'UZB',   // Uzbekistan
            'KZ': 'KAZ',   // Kazakhstan (already in UEFA section)
            'KG': 'KGZ',   // Kyrgyzstan
            'TJ': 'TJK',   // Tajikistan
            'TM': 'TKM',   // Turkmenistan
            'MN': 'MNG',   // Mongolia
            'KP': 'PRK',   // North Korea
            'HK': 'HKG',   // Hong Kong
            'MO': 'MAC',   // Macao
            'TW': 'TPE',   // Taiwan (Chinese Taipei)
            'GU': 'GUM',   // Guam
            'MP': 'NMI',   // Northern Mariana Islands
            'LK': 'SRI',   // Sri Lanka
            'NP': 'NEP',   // Nepal
            'BT': 'BHU',   // Bhutan
            'MV': 'MDV',   // Maldives
            'BN': 'BRU',   // Brunei

            // OCEANIA (OFC) - Missing countries
            'AU': 'AUS',   // Australia (already exists but ensuring)
            'NZ': 'NZL',   // New Zealand
            'FJ': 'FIJ',   // Fiji
            'PG': 'PNG',   // Papua New Guinea
            'SB': 'SOL',   // Solomon Islands
            'VU': 'VAN',   // Vanuatu
            'NC': 'NCL',   // New Caledonia
            'WS': 'SAM',   // Samoa
            'TO': 'TGA',   // Tonga
            'CK': 'COK',   // Cook Islands
            'PF': 'TAH',   // Tahiti/French Polynesia
            'AS': 'ASA',   // American Samoa
            'GU': 'GUM',   // Guam (already in AFC)
            'KI': 'KIR',   // Kiribati
            'MH': 'MHL',   // Marshall Islands
            'FM': 'FSM',   // Micronesia
            'NR': 'NRU',   // Nauru
            'NU': 'NIU',   // Niue
            'NF': 'NFK',   // Norfolk Island
            'PW': 'PLW',   // Palau
            'PN': 'PCN',   // Pitcairn
            'TK': 'TKL',   // Tokelau
            'TV': 'TUV',   // Tuvalu
            'WF': 'WLF',   // Wallis and Futuna

            // CONCACAF - Missing smaller nations
            'AI': 'AIA',   // Anguilla
            'AG': 'ATG',   // Antigua and Barbuda
            'AW': 'ARU',   // Aruba
            'BS': 'BAH',   // Bahamas
            'BB': 'BAR',   // Barbados
            'BZ': 'BLZ',   // Belize
            'BM': 'BER',   // Bermuda
            'VG': 'VGB',   // British Virgin Islands
            'KY': 'CAY',   // Cayman Islands
            'CR': 'CRC',   // Costa Rica
            'CU': 'CUB',   // Cuba
            'CW': 'CUW',   // Curaçao
            'DM': 'DMA',   // Dominica
            'DO': 'DOM',   // Dominican Republic
            'SV': 'ESA',   // El Salvador
            'GD': 'GRN',   // Grenada
            'GP': 'GPE',   // Guadeloupe
            'GT': 'GUA',   // Guatemala
            'GY': 'GUY',   // Guyana
            'HT': 'HAI',   // Haiti
            'HN': 'HON',   // Honduras
            'JM': 'JAM',   // Jamaica
            'MQ': 'MTQ',   // Martinique
            'MX': 'MEX',   // Mexico (already exists)
            'MS': 'MSR',   // Montserrat
            'NI': 'NCA',   // Nicaragua
            'PA': 'PAN',   // Panama
            'PR': 'PUR',   // Puerto Rico
            'KN': 'SKN',   // Saint Kitts and Nevis
            'LC': 'LCA',   // Saint Lucia
            'MF': 'SMF',   // Saint Martin
            'VC': 'VIN',   // Saint Vincent and the Grenadines
            'SX': 'SXM',   // Sint Maarten
            'SR': 'SUR',   // Suriname
            'TT': 'TRI',   // Trinidad and Tobago
            'TC': 'TCA',   // Turks and Caicos Islands
            'VI': 'VIR',   // U.S. Virgin Islands

            // UEFA - Missing smaller nations
            'AD': 'AND',   // Andorra (already exists)
            'AM': 'ARM',   // Armenia (already exists)
            'AZ': 'AZE',   // Azerbaijan (already exists)
            'BY': 'BLR',   // Belarus (already exists)
            'BA': 'BIH',   // Bosnia and Herzegovina (already exists)
            'CY': 'CYP',   // Cyprus (already exists)
            'EE': 'EST',   // Estonia (already exists)
            'FO': 'FRO',   // Faroe Islands (already exists)
            'GE': 'GEO',   // Georgia (already exists)
            'GI': 'GIB',   // Gibraltar (already exists)
            'GG': 'GGY',   // Guernsey
            'IS': 'ISL',   // Iceland (already exists)
            'IE': 'IRL',   // Ireland
            'IM': 'IMN',   // Isle of Man
            'JE': 'JEY',   // Jersey
            'XK': 'KOS',   // Kosovo (already exists)
            'LV': 'LVA',   // Latvia (already exists)
            'LI': 'LIE',   // Liechtenstein (already exists)
            'LT': 'LTU',   // Lithuania (already exists)
            'LU': 'LUX',   // Luxembourg (already exists)
            'MT': 'MLT',   // Malta (already exists)
            'MD': 'MDA',   // Moldova (already exists)
            'MC': 'MON',   // Monaco (already exists)
            'ME': 'MNE',   // Montenegro (already exists)
            'MK': 'MKD',   // North Macedonia (already exists)
            'SM': 'SMR'    // San Marino (already exists)
        };
        
        // Check if input is a direct country code
        if (directCodeMappings[normalized]) {
            const result = directCodeMappings[normalized];
            console.log(`✅ Mapped country code ${normalized} → ${result}`);
            return result;
        }
        
        // STEP 2: Handle country names (existing logic)
        const fifaCountryMap = {
            // UEFA (55 members)
            'Albania': 'ALB', 'Andorra': 'AND', 'Armenia': 'ARM', 'Austria': 'AUT',
            'Azerbaijan': 'AZE', 'Belarus': 'BLR', 'Belgium': 'BEL', 'Bosnia and Herzegovina': 'BIH',
            'Bulgaria': 'BUL', 'Croatia': 'CRO', 'Cyprus': 'CYP', 'Czech Republic': 'CZE',
            'Czechia': 'CZE', 'Denmark': 'DEN', 'England': 'PL', 'Estonia': 'EST',
            'Faroe Islands': 'FRO', 'Finland': 'FIN', 'France': 'FL1', 'Georgia': 'GEO',
            'Germany': 'BL1', 'Gibraltar': 'GIB', 'Greece': 'GRE', 'Hungary': 'HUN',
            'Iceland': 'ISL', 'Ireland': 'IRE', 'Israel': 'ISR', 'Italy': 'SA',
            'Kazakhstan': 'KAZ', 'Kosovo': 'KOS', 'Latvia': 'LVA', 'Liechtenstein': 'LIE',
            'Lithuania': 'LTU', 'Luxembourg': 'LUX', 'Malta': 'MLT', 'Moldova': 'MDA',
            'Monaco': 'MON', 'Montenegro': 'MNE', 'Netherlands': 'DED', 'North Macedonia': 'MKD',
            'Macedonia': 'MKD', 'Norway': 'NOR', 'Poland': 'POL', 'Portugal': 'PPL',
            'Romania': 'ROU', 'Russia': 'RUS', 'San Marino': 'SMR', 'Scotland': 'PL',
            'Serbia': 'SRB', 'Slovakia': 'SVK', 'Slovenia': 'SVN', 'Spain': 'PD',
            'Sweden': 'SWE', 'Switzerland': 'SUI', 'Turkey': 'TUR', 'Ukraine': 'UKR',
            'United Kingdom': 'PL', 'Wales': 'PL',
            
            // CONMEBOL (10 members)
            'Argentina': 'ARG', 'Bolivia': 'BOL', 'Brazil': 'BSA', 'Chile': 'CHI',
            'Colombia': 'COL', 'Ecuador': 'ECU', 'Paraguay': 'PAR', 'Peru': 'PER',
            'Uruguay': 'URU', 'Venezuela': 'VEN',
            
            // CONCACAF (41 members)  
            'Canada': 'CAN', 'Costa Rica': 'CRC', 'El Salvador': 'SLV',
            'Guatemala': 'GUA', 'Honduras': 'HON', 'Jamaica': 'JAM',
            'Mexico': 'MEX', 'Nicaragua': 'NIC', 'Panama': 'PAN',
            'United States': 'MLS', 'United States of America': 'MLS',
            
            // CAF (54 members)
            'Algeria': 'ALG', 'Angola': 'ANG', 'Cameroon': 'CMR', 'Egypt': 'EGY',
            'Ghana': 'GHA', 'Ivory Coast': 'CIV', 'Kenya': 'KEN', 'Morocco': 'MAR',
            'Nigeria': 'NG', 'Senegal': 'SEN', 'South Africa': 'RSA', 'Tunisia': 'TUN',
            
            // AFC (47 members)
            'Australia': 'AUS', 'China': 'CHN', 'India': 'IND', 'Indonesia': 'IDN',
            'Iran': 'IRN', 'Iraq': 'IRQ', 'Japan': 'JPN', 'Jordan': 'JOR',
            'Qatar': 'QAT', 'Saudi Arabia': 'KSA', 'South Korea': 'KOR',
            'Thailand': 'THA', 'United Arab Emirates': 'UAE', 'Vietnam': 'VIE'
        };
        
        // Direct lookup by country name
        const code = fifaCountryMap[normalized];
        if (code) {
            console.log(`✅ Mapped country name ${normalized} → ${code}`);
            return code;
        }
        
        // Fuzzy matching for slight variations
        for (const [country, countryCode] of Object.entries(fifaCountryMap)) {
            if (country.toLowerCase() === normalized.toLowerCase()) {
                console.log(`✅ Fuzzy matched ${normalized} → ${countryCode}`);
                return countryCode;
            }
        }
        
        console.warn(`⚠️ No FIFA mapping found for: "${normalized}"`);
        return 'XX';
    }

    /**
     * Get live data for supported countries
     */
    async getLiveCountryData(countryCode, realCountryName) {
        const competition = this.getCompetitionForCountry(countryCode);
        if (!competition) {
            return this.getStaticCountryData(countryCode, realCountryName);
        }
        
        try {
            console.log(`🔴 Fetching LIVE data for ${countryCode} (${realCountryName}) - ${competition.name}`);
            
            // Get current standings
            const standings = await this.getCompetitionStandings(competition.code);
            if (!standings || !standings.standings || !standings.standings[0] || !standings.standings[0].table) {
                throw new Error('Invalid standings data format');
            }
            
            const table = standings.standings[0].table;
            const leader = table[0];
            
            // Get real teams data for this country
            const realTeams = await this.getPremiumTeamsData(countryCode, realCountryName);
            console.log(`📊 Retrieved ${realTeams.length} real teams for ${realCountryName}`);
            
            return {
                countryName: realCountryName,
                countryCode: countryCode,
                status: '🔴 LIVE DATA',
                league: standings.competition.name,
                currentLeader: leader.team.name,
                points: leader.points,
                position: `${leader.position}/${table.length}`,
                played: leader.playedGames,
                won: leader.won,
                draw: leader.draw,
                lost: leader.lost,
                goalDifference: leader.goalDifference > 0 ? `+${leader.goalDifference}` : leader.goalDifference,
                lastUpdated: new Date(standings.lastUpdated).toLocaleString(),
                teams: realTeams,  
                hasLiveData: true,
                isLive: true,
                dataSource: 'football-data.org (Live)'
            };
        } catch (error) {
            console.error(`❌ Live data failed for ${countryCode} (${realCountryName}):`, error.message);
            return this.getStaticCountryData(countryCode, realCountryName, `Live data error: ${error.message}`);
        }
    }

    /**
     * Get real teams with stadium data for premium countries
     */
    async getPremiumTeamsData(countryCode, realCountryName) {
        const competitionMapping = {
            'GB': 'PL',   // Premier League
            'DE': 'BL1',  // Bundesliga  
            'ES': 'PD',   // La Liga
            'IT': 'SA',   // Serie A
            'FR': 'FL1',  // Ligue 1
            'NL': 'DED',  // Eredivisie
            'PT': 'PPL',  // Primeira Liga
            'BR': 'BSA'   // Série A
        };
        
        const competitionCode = competitionMapping[countryCode];
        if (!competitionCode) {
            console.warn(`⚠️ No competition mapping for ${countryCode}`);
            return [];
        }
        
        try {
            console.log(`🏆 Fetching real teams for ${competitionCode}...`);
            const teamsResponse = await this.apiConfig.makeRequest(`/competitions/${competitionCode}/teams`);
            
            if (!teamsResponse || !teamsResponse.teams) {
                console.warn('⚠️ No teams data from API');
                return [];
            }

            // Transform API teams to your format
            const teams = teamsResponse.teams.map(team => ({
                name: team.name,
                shortName: team.shortName || team.tla,
                city: team.venue || 'City TBA',
                venue: team.venue || 'Stadium TBA',
                stadium: team.venue || 'Stadium TBA',
                address: team.address || null,  // ← ADD THIS LINE
                founded: team.founded || 'Founded TBA',
                website: team.website,
                crest: team.crest,
                clubColors: team.clubColors,
                isLive: true,
                dataSource: 'premium_api',
                coordinates: null
            }));

            console.log(`✅ Premium API returned ${teams.length} real teams for ${realCountryName}`);
            return teams;

        } catch (error) {
            console.error(`❌ Premium teams API error:`, error);
            return [];
        }
    }

    /**
     * Get competition standings
     */
    async getCompetitionStandings(competitionCode) {
        const cacheKey = `standings_${competitionCode}`;
        
        // Check cache first
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.apiConfig.cacheDuration) {
            console.log(`💾 Cache hit: ${competitionCode}`);
            return cached.data;
        }

        try {
            const data = await this.apiConfig.makeRequest(`/competitions/${competitionCode}/standings`);
            
            // Cache the result
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
            
        } catch (error) {
            console.error(`❌ Failed to fetch standings for ${competitionCode}:`, error);
            throw error;
        }
    }

    /**
     * Get competition code for country
     */
    getCompetitionForCountry(countryCode) {
        const mapping = {
            'GB': { code: 'PL', name: 'Premier League' },
            'DE': { code: 'BL1', name: 'Bundesliga' },
            'IT': { code: 'SA', name: 'Serie A' },
            'ES': { code: 'PD', name: 'La Liga' },
            'FR': { code: 'FL1', name: 'Ligue 1' },
            'NL': { code: 'DED', name: 'Eredivisie' },
            'PT': { code: 'PPL', name: 'Primeira Liga' },
            'BR': { code: 'BSA', name: 'Série A' }
        };
        
        return mapping[countryCode] || null;
    }

    /**
     * Get static data for countries (no fake data) - SHOW REAL COUNTRY NAME
     */
    getStaticCountryData(countryCode, realCountryName, errorMessage = null) {
        const footballInfo = this.fifaCountryMap[realCountryName] || this.fifaCountryMap['default'];
        
        return {
            countryName: realCountryName,  // ← Make sure this is here
            countryCode: countryCode,      // ← And this
            status: '📊 STATIC INFO',
            league: footballInfo.league,
            hasLiveData: false,
            info: errorMessage || `${footballInfo.league} - Educational data only`,
            lastUpdated: new Date().toISOString(),
            isLive: false,
            dataSource: 'Static Information'
        };
    }

    /**
     * Get current league names (factual, non-changing data)
     */
    getCurrentLeagueName(countryCode) {
        const leagueNames = {
            'GB': 'Premier League',
            'DE': 'Bundesliga', 
            'ES': 'La Liga',
            'IT': 'Serie A',
            'FR': 'Ligue 1',
            'NL': 'Eredivisie',
            'PT': 'Primeira Liga',
            'BR': 'Série A',
            'NO': 'Eliteserien',
            'SE': 'Allsvenskan', 
            'DK': 'Superligaen',
            'US': 'Major League Soccer'
        };
        
        return leagueNames[countryCode] || 'National League';
    }

    /**
     * Get manager status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            cacheSize: this.cache.size,
            apiStatus: this.apiConfig.getAPIStatus(),
            mode: this.apiConfig.getAPIStatus().hasKey ? 'live_data_enabled' : 'static_data_only'
        };
    }

    async inspectAPIData() {
        console.log('🔍 INSPECTING FOOTBALL API DATA...');
        
        try {
            // 1. Get all available competitions
            console.log('\n=== 1. AVAILABLE COMPETITIONS ===');
            const competitions = await this.apiConfig.makeRequest('/competitions');
            console.log('📊 Total competitions:', competitions.competitions?.length || 0);
            
            competitions.competitions?.slice(0, 5).forEach((comp, index) => {
                console.log(`${index + 1}. ${comp.name} (${comp.code})`);
                console.log(`   - Country: ${comp.area?.name || 'N/A'}`);
                console.log(`   - Type: ${comp.type || 'N/A'}`);
                console.log(`   - Season: ${comp.currentSeason?.startDate || 'N/A'} to ${comp.currentSeason?.endDate || 'N/A'}`);
                console.log(`   - Data available: ${Object.keys(comp).join(', ')}`);
            });

            // 2. Inspect Premier League data structure
            console.log('\n=== 2. PREMIER LEAGUE DETAILED INSPECTION ===');
            const plStandings = await this.apiConfig.makeRequest('/competitions/PL/standings');
            console.log('📊 Premier League structure:');
            console.log('- Available keys:', Object.keys(plStandings));
            
            if (plStandings.standings?.[0]?.table) {
                const firstTeam = plStandings.standings[0].table[0];
                console.log('📊 Team data structure:', Object.keys(firstTeam));
                console.log('📊 Sample team:', {
                    name: firstTeam.team?.name,
                    shortName: firstTeam.team?.shortName,
                    tla: firstTeam.team?.tla,
                    crest: firstTeam.team?.crest,
                    venue: firstTeam.team?.venue,
                    website: firstTeam.team?.website,
                    founded: firstTeam.team?.founded,
                    clubColors: firstTeam.team?.clubColors
                });
            }

            // 3. Get team details for a specific team
            console.log('\n=== 3. INDIVIDUAL TEAM INSPECTION ===');
            if (plStandings.standings?.[0]?.table?.[0]?.team?.id) {
                const teamId = plStandings.standings[0].table[0].team.id;
                const teamDetails = await this.apiConfig.makeRequest(`/teams/${teamId}`);
                console.log('📊 Detailed team data:', Object.keys(teamDetails));
                console.log('📊 Team details available:', {
                    name: teamDetails.name,
                    shortName: teamDetails.shortName,
                    venue: teamDetails.venue,
                    website: teamDetails.website,
                    founded: teamDetails.founded,
                    clubColors: teamDetails.clubColors,
                    squad: teamDetails.squad?.length || 0,
                    coach: teamDetails.coach?.name || 'N/A',
                    marketValue: teamDetails.marketValue || 'N/A'
                });
                
                if (teamDetails.squad?.[0]) {
                    console.log('📊 Player data structure:', Object.keys(teamDetails.squad[0]));
                }
            }

            // 4. Check what competitions have teams data
            console.log('\n=== 4. TEAMS DATA AVAILABILITY ===');
            const competitionsWithTeams = ['PL', 'BL1', 'SA', 'PD', 'FL1'];
            for (const compCode of competitionsWithTeams) {
                try {
                    const teams = await this.apiConfig.makeRequest(`/competitions/${compCode}/teams`);
                    console.log(`📊 ${compCode}: ${teams.teams?.length || 0} teams available`);
                    if (teams.teams?.[0]) {
                        console.log(`   - Sample team data: ${Object.keys(teams.teams[0]).join(', ')}`);
                    }
                } catch (error) {
                    console.log(`❌ ${compCode}: No team data available`);
                }
            }

            // 5. Check matches data
            console.log('\n=== 5. MATCHES DATA INSPECTION ===');
            try {
                const matches = await this.apiConfig.makeRequest('/competitions/PL/matches?status=SCHEDULED');
                console.log('📊 Matches data available:', !!matches.matches);
                if (matches.matches?.[0]) {
                    console.log('📊 Match data structure:', Object.keys(matches.matches[0]));
                    console.log('📊 Sample match:', {
                        homeTeam: matches.matches[0].homeTeam?.name,
                        awayTeam: matches.matches[0].awayTeam?.name,
                        competition: matches.matches[0].competition?.name,
                        season: matches.matches[0].season?.startDate,
                        status: matches.matches[0].status,
                        venue: matches.matches[0].venue || 'N/A'
                    });
                }
            } catch (error) {
                console.log('❌ Matches data not available');
            }

            // 6. Summary of available endpoints
            console.log('\n=== 6. API ENDPOINTS SUMMARY ===');
            console.log('✅ Available endpoints:');
            console.log('   /competitions - List all competitions');
            console.log('   /competitions/{id} - Competition details');
            console.log('   /competitions/{id}/standings - League standings');
            console.log('   /competitions/{id}/teams - Teams in competition');
            console.log('   /competitions/{id}/matches - Competition matches');
            console.log('   /teams/{id} - Individual team details');
            console.log('   /matches/{id} - Individual match details');

        } catch (error) {
            console.error('❌ API inspection failed:', error);
        }
    }

    // Add this method to get comprehensive team data for a competition
    async getCompetitionTeamsDetailed(competitionCode) {
        console.log(`🔍 Getting detailed teams for ${competitionCode}...`);
        
        try {
            // Get teams list
            const teamsData = await this.apiConfig.makeRequest(`/competitions/${competitionCode}/teams`);
            const teams = teamsData.teams || [];
            
            console.log(`📊 Found ${teams.length} teams in ${competitionCode}`);
            
            // Get detailed info for each team (with rate limiting)
            const detailedTeams = [];
            for (let i = 0; i < Math.min(teams.length, 3); i++) { // Limit to 3 for inspection
                const team = teams[i];
                try {
                    const teamDetails = await this.apiConfig.makeRequest(`/teams/${team.id}`);
                    detailedTeams.push({
                        basic: team,
                        detailed: teamDetails
                    });
                    console.log(`📊 ${team.name}:`, {
                        venue: teamDetails.venue || 'N/A',
                        website: teamDetails.website || 'N/A',
                        founded: teamDetails.founded || 'N/A',
                        squad: teamDetails.squad?.length || 0,
                        coach: teamDetails.coach?.name || 'N/A'
                    });
                } catch (error) {
                    console.log(`❌ Could not get details for ${team.name}`);
                }
                
                // Rate limiting - wait 100ms between requests
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            return detailedTeams;
            
        } catch (error) {
            console.error(`❌ Failed to get teams for ${competitionCode}:`, error);
            return [];
        }
    }

    /**
     * Get real teams with stadium data for premium countries
     */
    async getPremiumTeamsData(countryCode, realCountryName) {
        const competitionMapping = {
            'GB': 'PL',   // Premier League
            'DE': 'BL1',  // Bundesliga  
            'ES': 'PD',   // La Liga
            'IT': 'SA',   // Serie A
            'FR': 'FL1',  // Ligue 1
            'NL': 'DED',  // Eredivisie
            'PT': 'PPL',  // Primeira Liga
            'BR': 'BSA'   // Série A
        };
        
        const competitionCode = competitionMapping[countryCode];
        if (!competitionCode) {
            console.warn(`⚠️ No competition mapping for ${countryCode}`);
            return [];
        }
        
        try {
            console.log(`🏆 Fetching real teams for ${competitionCode} (${realCountryName})...`);
            const teamsResponse = await this.apiConfig.makeRequest(`/competitions/${competitionCode}/teams`);
            
            if (!teamsResponse || !teamsResponse.teams) {
                console.warn('⚠️ No teams data from API');
                return [];
            }

            // Transform API teams to your format
            const teams = teamsResponse.teams.map(team => ({
                name: team.name,
                shortName: team.shortName || team.tla,
                city: team.venue || 'City TBA',
                venue: team.venue || 'Stadium TBA',
                stadium: team.venue || 'Stadium TBA',
                address: team.address || null,
                founded: team.founded || 'Founded TBA',
                website: team.website,
                crest: team.crest,
                clubColors: team.clubColors,
                isLive: true,
                dataSource: 'premium_api',
                // Add coordinates (will be looked up by coordinate service)
                coordinates: null

                
            }));
            // DEBUG: Check if addresses are being included  ← ADD THIS DEBUG BLOCK
            console.log('🔍 DEBUG: First team with address check:', {
                name: teams[0]?.name,
                address: teams[0]?.address,
                venue: teams[0]?.venue
            });

            console.log(`✅ Premium API returned ${teams.length} real teams for ${realCountryName}`);
            return teams;

        } catch (error) {
            console.error(`❌ Premium teams API error:`, error);
            return [];
        }
    }
    
}