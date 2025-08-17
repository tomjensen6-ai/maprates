// ============= MAP MANAGEMENT MODULE =============
// All map functionality for MapRates Pro - COMPLETE VERSION
// Import FLAG_MAP and CURRENCY_SYMBOLS from constants
import { FLAG_MAP, CURRENCY_SYMBOLS } from '../../config/constants.js';

// Make FLAG_MAP globally available for other modules
if (!window.FLAG_MAP && FLAG_MAP) {
    window.FLAG_MAP = FLAG_MAP;
}
if (!window.CURRENCY_SYMBOLS && CURRENCY_SYMBOLS) {
    window.CURRENCY_SYMBOLS = CURRENCY_SYMBOLS;
}
export class MapManager {
    constructor() {
        this.worldData = null;
        this.countryFeatureMap = new Map();
        this.mapMode = 'interactive'; // 'interactive', 'adding', 'locked'
        this.pendingDestinationAdd = false;
        this.currentProjection = null;
        this.currentPathGenerator = null;
    }

    // Initialize map data loading
    async loadMapData() {
        try {
            const response = await fetch('./countries-110m.json');
            if (!response.ok) {
                throw new Error(`Failed to load map data: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading map data:', error);
            throw new Error(`Map data loading failed: ${error.message}`);
        }
    }

    // Process and validate map data
    processMapData(worldData) {
        if (!worldData) {
            throw new Error('Map data is null or undefined');
        }
        
        console.log('Map data type:', worldData.type);
        
        // Handle TopoJSON format
        if (worldData.type === 'Topology') {
            if (!worldData.objects || !worldData.objects.countries) {
                throw new Error('TopoJSON missing countries object');
            }
            console.log('Converting TopoJSON to GeoJSON features using topojson.feature...');
            
            // Use topojson.feature to properly convert TopoJSON to GeoJSON
            const geojsonData = topojson.feature(worldData, worldData.objects.countries);
            console.log('Converted TopoJSON to GeoJSON:', geojsonData.type, 'with', geojsonData.features?.length, 'features');
            
            return geojsonData;
        } else if (worldData.type !== 'FeatureCollection' && worldData.type !== 'GeometryCollection') {
            throw new Error(`Unexpected data type: ${worldData.type}`);
        }
        
        return worldData;
    }

    // Draw the interactive map
    drawMap(processedData) {
        // Validate data before drawing
        if (!processedData) {
            console.error('Cannot draw map: worldData is null');
            throw new Error('Map data not loaded');
        }
        
        console.log('Drawing map with data type:', processedData.type);
        
        const svg = d3.select("#worldMap");
        svg.selectAll("*").remove(); // Clear previous content
        
        // Make map responsive and centered
        const container = svg.node().parentElement;
        const containerWidth = container.clientWidth - 48; // Account for padding
        
        // Mobile detection
        const isMobile = window.innerWidth <= 900;
        const isLandscape = window.innerWidth > window.innerHeight;
        
        let mapWidth, mapHeight;
        
        if (isMobile) {
            if (isLandscape) {
                // Landscape mode - use most of viewport
                mapWidth = Math.min(containerWidth, window.innerWidth * 0.9);
                mapHeight = window.innerHeight * 0.7; // 70% of viewport height
            } else {
                // Portrait mode - full width, reasonable height
                mapWidth = containerWidth;
                mapHeight = Math.min(window.innerHeight * 0.5, 400); // 50% of viewport or 400px max
            }
        } else {
            // Desktop - original behavior
            mapWidth = Math.min(containerWidth, 1000);
            mapHeight = mapWidth * 0.6;
        }
        
        svg.attr("width", mapWidth).attr("height", mapHeight);

        const width = +svg.attr("width");
        const height = +svg.attr("height");
        
        // Simple zoom setup
        const g = svg.append("g");
        svg.call(d3.zoom().on("zoom", (event) => g.attr("transform", event.transform)));
        
        let features = [];
        
        // Handle different data structures
        if (processedData.type === 'FeatureCollection' && processedData.features) {
            features = processedData.features;
            console.log('Using FeatureCollection with', features.length, 'features');
        } else if (processedData.type === 'GeometryCollection' && processedData.geometries) {
            // Convert geometries to features
            features = processedData.geometries.map((geometry, index) => ({
                type: 'Feature',
                geometry: geometry,
                properties: geometry.properties || {},
                id: geometry.id || `geo_${index}`
            }));
            console.log('Converted GeometryCollection to', features.length, 'features');
        } else {
            throw new Error(`Unsupported data structure: ${JSON.stringify(Object.keys(processedData))}`);
        }
        
        // Auto-fit projection to the data bounds
        let projection;
        
        // Try different projection methods
        try {
            // Method 1: Try fitSize with FeatureCollection
            projection = d3.geoMercator().fitSize([width, height], {
                type: "FeatureCollection",
                features: features
            });
            console.log('Using fitSize projection');
        } catch (error) {
            console.log('fitSize failed, trying fitExtent:', error);
            // Method 2: Try fitExtent 
            try {
                projection = d3.geoMercator().fitExtent([[0, 0], [width, height]], {
                    type: "FeatureCollection", 
                    features: features
                });
                console.log('Using fitExtent projection');
            } catch (error2) {
                console.log('fitExtent failed, using manual projection:', error2);
                // Method 3: Manual projection as fallback
                projection = d3.geoMercator()
                    .scale(150)
                    .translate([width / 2, height / 2]);
                console.log('Using manual projection');
            }
        }
        
        this.currentProjection = projection;
        this.currentPathGenerator = d3.geoPath().projection(projection);
        
        // Create country paths
        const countries = g.selectAll("path")
            .data(features)
            .enter()
            .append("path")
            .attr("d", this.currentPathGenerator)
            .attr("class", "country")
            .attr("id", (d, i) => `country_${i}`)
            .on("click", (event, d) => {
                const countryName = this.getCountryNameFromFeature(d, features.indexOf(d));
                this.handleCountryClick(countryName, d, event);
            })
            .on("mouseover", (event, d) => {
                const countryName = this.getCountryNameFromFeature(d, features.indexOf(d));
                this.showEnhancedTooltip(event, countryName);
            })
            .on("mouseout", (event, d) => {
                this.hideTooltip();
            });
        
        // Build country-to-feature mapping for highlighting
        features.forEach((feature, index) => {
            const countryName = this.getCountryNameFromFeature(feature, index);
            if (countryName && countryName !== "No currency system") {
                this.countryFeatureMap.set(countryName, feature);
                // Debug log for first few
                if (index < 3) {
                    console.log(`Mapping: "${countryName}" → feature ID ${feature.id}`);
                }
            }
        });
        
        console.log('Map drawing complete. Rendered paths:', countries.size());
        console.log('Countries mapped:', this.countryFeatureMap.size);

        return {
            countryFeatureMap: this.countryFeatureMap
        };
        
        return { svg, features, countries };
    }

    // Get country name from TopoJSON/GeoJSON feature
    getCountryNameFromFeature(feature, index) {
        // Try to get from feature properties first
        if (feature.properties) {
            if (feature.properties.NAME) return feature.properties.NAME;
            if (feature.properties.name) return feature.properties.name;
            if (feature.properties.NAME_EN) return feature.properties.NAME_EN;
            if (feature.properties.NAME_LONG) return feature.properties.NAME_LONG;
            if (feature.properties.ADMIN) return feature.properties.ADMIN;
            if (feature.properties.admin) return feature.properties.admin;
        }
        
        // Try to use feature ID to get name
        if (feature.id) {
            // Common country ID mappings for TopoJSON (comprehensive list)
            const idToName = {
                "004": "Afghanistan", "008": "Albania", "012": "Algeria", "016": "American Samoa",
                "020": "Andorra", "024": "Angola", "028": "Antigua and Barbuda", "031": "Azerbaijan", 
                "032": "Argentina", "036": "Australia", "040": "Austria", "044": "Bahamas", 
                "048": "Bahrain", "050": "Bangladesh", "051": "Armenia", "052": "Barbados", 
                "056": "Belgium", "060": "Bermuda", "064": "Bhutan", "068": "Bolivia", 
                "070": "Bosnia and Herzegovina", "072": "Botswana", "076": "Brazil", "084": "Belize",
                "090": "Solomon Islands", "092": "British Virgin Islands", "096": "Brunei", 
                "100": "Bulgaria", "104": "Myanmar", "108": "Burundi", "112": "Belarus",
                "116": "Cambodia", "120": "Cameroon", "124": "Canada", "132": "Cape Verde", 
                "136": "Cayman Islands", "140": "Central African Republic", "144": "Sri Lanka",
                "146": "Djibouti",
                "148": "Chad", "152": "Chile", "156": "China", "158": "Taiwan", 
                "170": "Colombia", "174": "Comoros", "175": "Mayotte", "178": "Congo", 
                "180": "Congo (Kinshasa)", "184": "Cook Islands", "188": "Costa Rica", 
                "191": "Croatia", "192": "Cuba", "196": "Cyprus", "203": "Czech Republic",
                "208": "Denmark", "212": "Dominica", "214": "Dominican Republic", "218": "Ecuador", 
                "222": "El Salvador", "226": "Equatorial Guinea", "231": "Ethiopia", 
                "232": "Eritrea", "233": "Estonia", "238": "Falkland Islands", "242": "Fiji", 
                "246": "Finland", "250": "France", "254": "French Guiana", "258": "French Polynesia",
                "266": "Gabon", "268": "Georgia", "270": "Gambia", "275": "Palestine", 
                "276": "Germany", "288": "Ghana", "292": "Gibraltar", "300": "Greece", 
                "304": "Greenland", "308": "Grenada", "312": "Guadeloupe", "316": "Guam",
                "320": "Guatemala", "324": "Guinea", "328": "Guyana", "332": "Haiti", 
                "336": "Vatican", "340": "Honduras", "344": "Hong Kong", "348": "Hungary", 
                "352": "Iceland", "356": "India", "360": "Indonesia", "364": "Iran", 
                "368": "Iraq", "372": "Ireland", "376": "Israel", "380": "Italy", 
                "384": "Côte d'Ivoire", "388": "Jamaica", "392": "Japan", "398": "Kazakhstan", 
                "400": "Jordan", "404": "Kenya", "408": "North Korea", "410": "South Korea", 
                "414": "Kuwait", "417": "Kyrgyzstan", "418": "Laos", "422": "Lebanon", 
                "426": "Lesotho", "428": "Latvia", "430": "Liberia", "434": "Libya", 
                "438": "Liechtenstein", "440": "Lithuania", "442": "Luxembourg", "446": "Macao",
                "450": "Madagascar", "454": "Malawi", "458": "Malaysia", "462": "Maldives", 
                "466": "Mali", "470": "Malta", "474": "Martinique", "478": "Mauritania", 
                "480": "Mauritius", "484": "Mexico", "492": "Monaco", "496": "Mongolia", 
                "498": "Moldova", "499": "Montenegro", "504": "Morocco", "508": "Mozambique", 
                "512": "Oman", "516": "Namibia", "520": "Nauru", "524": "Nepal", 
                "528": "Netherlands", "540": "New Caledonia", "548": "Vanuatu", "554": "New Zealand", 
                "558": "Nicaragua", "562": "Niger", "566": "Nigeria", "570": "Niue", 
                "574": "Norfolk Island", "578": "Norway", "580": "Northern Mariana Islands", 
                "581": "United States Minor Outlying Islands", "583": "Micronesia", 
                "584": "Marshall Islands", "585": "Palau", "586": "Pakistan", "591": "Panama", 
                "598": "Papua New Guinea", "600": "Paraguay", "604": "Peru", "608": "Philippines", 
                "612": "Pitcairn", "616": "Poland", "620": "Portugal", "624": "Guinea-Bissau", 
                "626": "Timor-Leste", "630": "Puerto Rico", "634": "Qatar", "638": "Réunion", 
                "642": "Romania", "643": "Russia", "646": "Rwanda", "652": "Saint Barthélemy", 
                "654": "Saint Helena", "659": "Saint Kitts and Nevis", "660": "Anguilla", 
                "662": "Saint Lucia", "663": "Saint Martin", "666": "Saint Pierre and Miquelon", 
                "670": "Saint Vincent and the Grenadines", "674": "San Marino", "678": "São Tomé and Príncipe", 
                "682": "Saudi Arabia", "686": "Senegal", "688": "Serbia", "690": "Seychelles", 
                "694": "Sierra Leone", "702": "Singapore", "703": "Slovakia", "704": "Vietnam", 
                "705": "Slovenia", "706": "Somalia", "710": "South Africa", "716": "Zimbabwe", 
                "724": "Spain", "728": "South Sudan", "729": "Sudan", "732": "Western Sahara", 
                "740": "Suriname", "744": "Svalbard and Jan Mayen", "748": "Swaziland", 
                "752": "Sweden", "756": "Switzerland", "760": "Syria", "762": "Tajikistan", 
                "764": "Thailand", "768": "Togo", "772": "Tokelau", "776": "Tonga", 
                "780": "Trinidad and Tobago", "784": "United Arab Emirates", "788": "Tunisia", 
                "792": "Turkey", "795": "Turkmenistan", "796": "Turks and Caicos Islands", 
                "798": "Tuvalu", "800": "Uganda", "804": "Ukraine", "807": "North Macedonia", 
                "818": "Egypt", "826": "United Kingdom", "834": "Tanzania", "840": "United States", 
                "850": "United States Virgin Islands", "854": "Burkina Faso", "858": "Uruguay", 
                "860": "Uzbekistan", "862": "Venezuela", "876": "Wallis and Futuna", 
                "882": "Samoa", "887": "Yemen", "894": "Zambia",
                // Special case for Antarctica
                "010": null  // Don't show name for Antarctica
            };
            
            // Check both string and number versions of the ID
            const featureId = String(feature.id);
            if (idToName[featureId]) {
                return idToName[featureId];
            } else if (idToName[feature.id]) {
                return idToName[feature.id];
            } else if (idToName[featureId] === null || idToName[feature.id] === null) {
                // Special case like Antarctica - show info text
                return "No currency system";
            }
        }
        
        // If numbered country, try to fix common ones
        const countryFixes = {
            "Country 1": "Greenland",
            "Country 2": "Antarctica", 
            "Country 3": "Western Sahara",
            "Country 4": "French Southern Territories",
            "Country 5": "North Cyprus",
            "Country 6": "Kosovo",
            "Country 7": "Somaliland",
            "Country 8": "South Ossetia",
            "Country 9": "Abkhazia",
            "Country 10": "Northern Cyprus",
            "Country 11": "Transnistria",
            "Country 12": "Nagorno-Karabakh",
            "Country 13": "South Sudan",
            "Country 14": "Somaliland",
            "Country 15": "Western Sahara",
            "Country 16": "Falkland Islands",
            "Country 17": "Gibraltar",
            "Country 18": "Faroe Islands",
            "Country 19": "Åland Islands",
            "Country 20": "Jan Mayen",
            "Country 146": "Djibouti"
        };
        
        return countryFixes[`Country ${index + 1}`] || `Country ${index + 1}`;
    }

    // Country name normalization for better matching
    normalizeCountryName(mapCountryName) {
        // Handle empty or invalid names first
        if (!mapCountryName || mapCountryName.trim() === '') {
            return null;
        }
        
        const countryMappings = {
            // These territories exist but use other currencies - DON'T set to null
            // We'll handle them specially in the tooltip
            
            // Fix case mismatches
            "Bosnia and Herzegovina": "Bosnia And Herzegovina",
            
            // Map different names to database names
            "Côte d'Ivoire": "Côte d'Ivoire",
            "Ivory Coast": "Côte d'Ivoire",
            "Congo": "Congo (Brazzaville)",
            "Democratic Republic of the Congo": "Congo (Kinshasa)",
            "Swaziland": "Eswatini",
            
            // Standard mappings
            "USA": "United States",
            "United States of America": "United States",
            "US": "United States",
            "Britain": "United Kingdom",
            "Great Britain": "United Kingdom",
            "UK": "United Kingdom",
            "Russia": "Russia",
            "Russian Federation": "Russia",
            "China": "China",
            "People's Republic of China": "China",
            "Iran": "Iran",
            "Islamic Republic of Iran": "Iran",
            "Vietnam": "Vietnam",
            "Viet Nam": "Vietnam",
            "South Korea": "South Korea",
            "Republic of Korea": "South Korea",
            "North Korea": "North Korea",
            "Democratic People's Republic of Korea": "North Korea",
            "Tanzania": "Tanzania",
            "United Republic of Tanzania": "Tanzania",
            "North Macedonia": "North Macedonia",
            "Republic of North Macedonia": "North Macedonia",
            "Czechia": "Czech Republic",
            "Czech Republic": "Czech Republic",
            "Slovakia": "Slovakia",
            "Slovak Republic": "Slovakia"
        };
        
        // Don't set numbered countries to null - let them through
        // We'll handle them in the tooltip
        
        return countryMappings[mapCountryName] !== undefined 
            ? countryMappings[mapCountryName] 
            : mapCountryName;
    }

    getCurrencyForCountry(countryName) {
        // Handle empty or null names
        if (!countryName || countryName.trim() === '') {
            return null;
        }  
        
        // DIRECT lookup in countryToCurrency first - most reliable
        if (window.countryToCurrency) {
            // Try exact match
            let currencyCode = window.countryToCurrency[countryName];
            
            // Try case variations for problematic countries
            if (!currencyCode) {
                // Check all keys for case-insensitive match
                for (const [country, code] of Object.entries(window.countryToCurrency)) {
                    if (country.toLowerCase() === countryName.toLowerCase()) {
                        currencyCode = code;
                        break;
                    }
                }
            }
            
            // Try "And" vs "and" variations
            if (!currencyCode && countryName.includes(' and ')) {
                const withCapitalAnd = countryName.replace(' and ', ' And ');
                currencyCode = window.countryToCurrency[withCapitalAnd];
            } else if (!currencyCode && countryName.includes(' And ')) {
                const withLowerAnd = countryName.replace(' And ', ' and ');
                currencyCode = window.countryToCurrency[withLowerAnd];
            }
            
            // Handle special cases not in database
            // Handle special cases not in database
            if (!currencyCode) {
                const specialCases = {
                    "Côte d'Ivoire": "XOF",
                    "Cote d'Ivoire": "XOF",
                    "Ivory Coast": "XOF",
                    "Kosovo": "EUR",
                    "Vatican": "EUR",
                    "Greenland": "DKK",
                    "Falkland Islands": "FKP",
                    "Falkland Islands (Malvinas)": "FKP"
                };
                currencyCode = specialCases[countryName];
            }

            // If we have a currency code but no symbol, provide a fallback
            if (currencyCode && !window.CURRENCY_SYMBOLS?.[currencyCode]) {
                // Create a basic currency object for currencies missing from CURRENCY_SYMBOLS
                const fallbackSymbols = {
                    "RSD": { symbol: "дин.", name: "Serbian Dinar", decimals: 2 },
                    "DJF": { symbol: "Fdj", name: "Djiboutian Franc", decimals: 0 }
                };
                
                if (fallbackSymbols[currencyCode]) {
                    return {
                        code: currencyCode,
                        ...fallbackSymbols[currencyCode]
                    };
                }
            }
            
            // If we found a currency code, return the full currency object
            if (currencyCode && window.CURRENCY_SYMBOLS?.[currencyCode]) {
                return {
                    code: currencyCode,
                    ...window.CURRENCY_SYMBOLS[currencyCode]
                };
            }
        }
        
        // DON'T use window.getCurrencyForCountry - it seems broken
        // Just return null if not found
        
        // Only warn for real countries
        if (!countryName.startsWith("Country ") &&
            !["Western Sahara", "Somaliland", "South Ossetia", "No currency system", "Antarctica", "New Caledonia", "French Southern Territories"].includes(countryName) &&
            countryName.trim() !== '') {
            console.warn(`No currency found for: ${countryName}`);
        }
        
        return null;
    }

    // Handle country click events
    handleCountryClick(countryName, feature, event) {
        // Check if we're in a non-financial layer
        if (window.intelligenceLayerManager) {
            const currentLayer = window.intelligenceLayerManager.getCurrentLayer();
            
            if (currentLayer !== 'financial') {
                // Handle non-financial layer clicks
                const normalizedName = this.normalizeCountryName(countryName);
                
                if (currentLayer === 'affiliate' && window.affiliateDataManager) {
                    window.affiliateDataManager.getAffiliateData(normalizedName).then(data => {
                        if (data) {
                            console.log(`Affiliate data for ${countryName}:`, data);
                            // You can dispatch a custom event or call a method to show details
                            window.dispatchEvent(new CustomEvent('showLayerDetails', {
                                detail: { layer: 'affiliate', country: countryName, data: data }
                            }));
                        }
                    });
                    return;
                } else if (currentLayer === 'publishing' && window.publishingDataManager) {
                    window.publishingDataManager.getPublishingData(normalizedName).then(data => {
                        if (data) {
                            console.log(`Publishing data for ${countryName}:`, data);
                            window.dispatchEvent(new CustomEvent('showLayerDetails', {
                                detail: { layer: 'publishing', country: countryName, data: data }
                            }));
                        }
                    });
                    return;
                }
            }
        }
        
        // Original financial layer logic continues here
        const normalizedName = this.normalizeCountryName(countryName);
        if (normalizedName === null) {
            this.showTooltip(event, `${countryName} ⚠️ No currency data available`);
            setTimeout(() => this.hideTooltip(), 2000);
            return;
        }

        if (this.mapMode === 'locked') {
            this.showTooltip(event, '🔒 Map locked. Click "Clear All" to unlock.');
            setTimeout(() => this.hideTooltip(), 2000);
            return;
        }

        if (countryName === "No currency system" || countryName === "Antarctica") {
            this.showTooltip(event, `${countryName} has no currency system`);
            setTimeout(() => this.hideTooltip(), 2000);
            return;
        }
    
        // Check if country exists in currency data
        const homeSelect = document.getElementById('homeCountry');
        let countryExists = false;
        let exactOptionValue = null;
    
        for (let option of homeSelect.options) {
            if (option.value === countryName) {
                countryExists = true;
                exactOptionValue = option.value;
                break;
            }
        }
    
        if (!countryExists) {
            const normalizedName = this.normalizeCountryName(countryName);
            if (normalizedName && normalizedName.trim() !== '') {
                for (let option of homeSelect.options) {
                    if (option.value && option.value.trim() !== '' && 
                        (option.value === normalizedName ||
                        option.value.toLowerCase().includes(normalizedName.toLowerCase()) ||
                        normalizedName.toLowerCase().includes(option.value.toLowerCase()))) {
                        countryExists = true;
                        exactOptionValue = option.value;
                        console.log('Found fuzzy match:', countryName, '->', exactOptionValue);
                        break;
                    }
                }
            }
        }
    
        if (!countryExists) {
            this.showTooltip(event, `${countryName} - Currency data not available in our database`);
            setTimeout(() => this.hideTooltip(), 3000);
            return;
        }
    
        // Trigger country selection - pass the exact option value and the feature
        if (window.selectCountryByClick) {
            // Pass feature as second parameter
            window.selectCountryByClick(exactOptionValue, feature);
        } else {
            console.error('selectCountryByClick function not available');
        }
    }

    // check which layer is active
    updateMapColors() {
    const layerManager = window.intelligenceLayerManager;
    const dataManager = layerManager.getCurrentDataManager();
    
    // Use the current layer's data manager
    countries.forEach(country => {
        const value = dataManager.getRateForCountry(country.id);
        // Rest of your existing color logic works!
    });
    }

    // Update country visual selection
    updateCountrySelection(homeCountry, destinationCountries) {
        console.log('Updating country selection:', homeCountry, 'destinations:', destinationCountries);
        
        // Reset all country styles to default
        d3.selectAll('.country')
            .classed('selected-home', false)
            .classed('selected-destination', false);
        
        let homeFound = false;
        
        // Highlight home country
        if (homeCountry && homeCountry.name) {
            const self = this; // Save reference to MapManager
            d3.selectAll('.country').each(function(d, i) { // Use regular function, not arrow
                const mapCountryName = self.getCountryNameFromFeature(d, i);
                const normalizedMapName = self.normalizeCountryName(mapCountryName);
                
                if (normalizedMapName === homeCountry.name || mapCountryName === homeCountry.name) {
                    console.log('Found home country:', mapCountryName, '->', homeCountry.name);
                    d3.select(this).classed('selected-home', true);
                    homeFound = true;
                }
            });
            
            if (!homeFound) {
                console.log('Home country not found on map:', homeCountry.name);
            }
        }
        
        // Highlight multiple destination countries
        if (destinationCountries && Array.isArray(destinationCountries)) {
            const self = this;
            destinationCountries.forEach((dest, index) => {
                let destFound = false;
                
                if (dest && dest.name) {
                    d3.selectAll('.country').each(function(d, i) { // Use regular function
                        const mapCountryName = self.getCountryNameFromFeature(d, i);
                        const normalizedMapName = self.normalizeCountryName(mapCountryName);
                        
                        if (normalizedMapName === dest.name || mapCountryName === dest.name) {
                            console.log('Found destination country:', mapCountryName, '->', dest.name);
                            d3.select(this).classed('selected-destination', true);
                            destFound = true;
                        }
                    });
                    
                    if (!destFound) {
                        console.log('Destination country not found on map:', dest.name);
                    }
                }
            });
        }
    }

    // Update map colors based on current intelligence layer
    async updateMapColorsForLayer() {
        const layerManager = window.intelligenceLayerManager;
        if (!layerManager) return;
        
        const currentLayer = layerManager.getCurrentLayer();
        const dataManager = layerManager.getCurrentDataManager();
        const colorScale = layerManager.getColorScaleForCurrentLayer();
        
        if (!dataManager) {
            console.warn('No data manager for current layer');
            return;
        }
        
        console.log(`Updating map colors for ${currentLayer} layer`);
        
        // Process all countries
        const self = this;
        const updatePromises = [];
        
        d3.selectAll('.country').each(function(d, i) {
            const element = this;
            const countryName = self.getCountryNameFromFeature(d, i);
            const normalizedName = self.normalizeCountryName(countryName);
            
            if (normalizedName && normalizedName !== "No currency system") {
                // Get data for this country
                const promise = dataManager.getExchangeRate(normalizedName).then(data => {
                    if (data) {
                        const value = layerManager.getColorValue(data);
                        const color = self.calculateLayerColor(value, colorScale, currentLayer);
                        
                        d3.select(element)
                            .transition()
                            .duration(300)
                            .style('fill', color)
                            .attr('data-value', value)
                            .attr('data-layer', currentLayer);
                    }
                });
                
                updatePromises.push(promise);
            }
        });
        
        await Promise.all(updatePromises);
        console.log('Map colors updated for layer:', currentLayer);
    }

    // Calculate color based on layer type and value
    calculateLayerColor(value, scale, layerType) {
        if (!value) return '#e0e0e0';
        
        // Normalize value to 0-1 range
        const normalized = (value - scale.min) / (scale.max - scale.min);
        const clamped = Math.max(0, Math.min(1, normalized));
        
        // Different color schemes for different layers
        switch(layerType) {
            case 'financial':
                // Green (good) to Red (bad) for exchange rates
                if (clamped < 0.5) {
                    return `rgb(${Math.floor(255 * (1 - clamped * 2))}, 255, 0)`;
                } else {
                    return `rgb(255, ${Math.floor(255 * (2 - clamped * 2))}, 0)`;
                }
                
            case 'affiliate':
                // Purple (low) to Green (high) for conversion rates
                if (clamped < 0.5) {
                    const intensity = clamped * 2;
                    return `rgb(${Math.floor(128 + 127 * intensity)}, ${Math.floor(128 * intensity)}, 255)`;
                } else {
                    const intensity = (clamped - 0.5) * 2;
                    return `rgb(${Math.floor(255 - 127 * intensity)}, ${Math.floor(128 + 127 * intensity)}, 0)`;
                }
                
            case 'publishing':
                // Blue (low) to Gold (high) for market scores
                if (clamped < 0.5) {
                    const intensity = clamped * 2;
                    return `rgb(${Math.floor(64 + 191 * intensity)}, ${Math.floor(64 + 151 * intensity)}, ${Math.floor(255 - 155 * intensity)})`;
                } else {
                    const intensity = (clamped - 0.5) * 2;
                    return `rgb(255, ${Math.floor(215 - 35 * intensity)}, ${Math.floor(100 - 100 * intensity)})`;
                }
                
            default:
                return '#808080';
        }
    }

    

    // Helper to get country code from name
    getCountryCode(countryName) {
        // Simple mapping - expand as needed
        const countryToCode = {
            'United States': 'US',
            'United Kingdom': 'GB',
            'Germany': 'DE',
            'France': 'FR',
            'Canada': 'CA',
            'Australia': 'AU',
            'Japan': 'JP',
            'Italy': 'IT',
            'Spain': 'ES',
            'Netherlands': 'NL',
            'Sweden': 'SE',
            'Switzerland': 'CH',
            'Brazil': 'BR',
            'Mexico': 'MX',
            'India': 'IN',
            'China': 'CN',
            'South Korea': 'KR',
            'Singapore': 'SG',
            'New Zealand': 'NZ',
            'Norway': 'NO'
        };
        
        return countryToCode[countryName] || countryName.substring(0, 2).toUpperCase();
    }

    // Calculate color based on value and scale
    calculateColor(value, scale) {
        if (!value) return '#e0e0e0'; // No data color
        
        // Normalize value to 0-1 range
        const normalized = (value - scale.min) / (scale.max - scale.min);
        const clamped = Math.max(0, Math.min(1, normalized));
        
        // Color gradient from red (low) to green (high)
        if (clamped < 0.5) {
            // Red to yellow
            const intensity = clamped * 2;
            return `rgb(255, ${Math.floor(intensity * 255)}, 0)`;
        } else {
            // Yellow to green
            const intensity = (clamped - 0.5) * 2;
            return `rgb(${Math.floor(255 - intensity * 255)}, 255, 0)`;
        }
    }

    // Enhanced tooltip functionality
    showEnhancedTooltip(event, countryName) {
        this.hideTooltip();
        // Check which layer is active and show appropriate data
        if (window.intelligenceLayerManager) {
            const currentLayer = window.intelligenceLayerManager.getCurrentLayer();
            
            if (currentLayer === 'affiliate') {
                this.showAffiliateTooltip(event, countryName);
                return;
            } else if (currentLayer === 'publishing') {
                this.showPublishingTooltip(event, countryName);
                return;
            }
        }
        
        // Handle empty country names
        if (!countryName || countryName.trim() === '') {
            return;
        }
        
        // Special handling for territories and regions FIRST
        const territoryInfo = this.getTerritoryInfo(countryName);
        if (territoryInfo) {
            this.showTerritoryTooltip(event, countryName, territoryInfo);
            return;
        }
        
        const normalizedName = this.normalizeCountryName(countryName);
        if (normalizedName === null) {
            // Show basic tooltip for unmapped regions
            this.showTerritoryTooltip(event, countryName, {
                flag: "🌍",
                status: "Region",
                currency: "Various",
                fact: "Currency information not available"
            });
            return;
        }
        
        // Get currency using the fixed method
        const countryCurrency = this.getCurrencyForCountry(normalizedName) || this.getCurrencyForCountry(countryName);
        const homeCurrency = window.homeCountry ? this.getCurrencyForCountry(window.homeCountry.name) : null;
        
        // Get flag with smart fallbacks
        let flag = FLAG_MAP?.[normalizedName] || 
                FLAG_MAP?.[countryName] || 
                window.FLAG_MAP?.[normalizedName] || 
                window.FLAG_MAP?.[countryName] ||
                '🏳️';
        
        // Build MINIMAL tooltip
        let htmlContent = `
            <div style="
                width: 140px;
                font-family: -apple-system, system-ui, sans-serif;
                font-size: 10px;
                background: #2d3748;
                color: #f7fafc;
                border-radius: 4px;
                overflow: hidden;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            ">
                <!-- Header: Flag + Name -->
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 8px;
                    background: #1a202c;
                    border-bottom: 1px solid #4a5568;
                ">
                    <span style="font-size: 16px; line-height: 1; display: block;">${flag}</span>
                    <div style="flex: 1; min-width: 0; overflow: hidden;">
                        <div style="
                            font-weight: 600; 
                            font-size: 11px; 
                            color: #fff;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        ">
                            ${countryName}
                        </div>
                        ${countryCurrency ? `
                            <div style="color: #a0aec0; font-size: 9px;">
                                ${countryCurrency.code}
                            </div>
                        ` : ''}
                    </div>
                </div>`;

        // Exchange Rate Section
        if (homeCurrency && countryCurrency && window.homeCountry.name !== countryName && window.currentExchangeRates) {
            const rate = window.currentExchangeRates[countryCurrency.code];
            
            if (rate) {
                const amount = parseFloat(document.getElementById('compactAmount')?.value) || 1;
                const converted = (amount * rate).toFixed(2);
                const trendData = window.getCurrencyTrend ? window.getCurrencyTrend(countryCurrency.code) : null;
                
                htmlContent += `
                    <!-- Rate Info -->
                    <div style="
                        padding: 6px 8px;
                        background: #2d3748;
                        font-size: 11px;
                        line-height: 1.4;
                    ">
                        <div style="font-weight: 600; color: #fff; margin-bottom: 3px;">
                            ${homeCurrency.symbol}${amount} = ${countryCurrency.symbol}${converted}
                        </div>
                        <div style="font-size: 9px; color: #a0aec0;">
                            Rate: ${rate.toFixed(4)}
                        </div>
                        ${trendData ? `
                            <div style="font-size: 9px; color: ${trendData.direction === 'up' ? '#68d391' : '#fc8181'};">
                                ${trendData.direction === 'up' ? '↑' : '↓'} ${trendData.percentage}% from yesterday
                            </div>
                        ` : ''}
                        ${this.getSmartExchangeAdvice(rate, trendData, countryCurrency.code)}
                    </div>`;
            } else {
                htmlContent += `
                    <div style="padding: 6px 8px; font-size: 9px; color: #fbd38d; text-align: center;">
                        Loading rates...
                    </div>`;
            }
        } else if (!countryCurrency) {
            // No currency data available
            htmlContent += `
                <div style="padding: 6px 8px; font-size: 9px; color: #a0aec0; text-align: center;">
                    Currency data not available
                </div>`;
        } else if (!window.homeCountry) {
            htmlContent += `
                <div style="padding: 6px 8px; font-size: 9px; color: #90cdf4; text-align: center;">
                    Click to select
                </div>`;
        } else if (window.homeCountry && window.homeCountry.name === countryName) {
            htmlContent += `
                <div style="padding: 6px 8px; font-size: 9px; color: #68d391; text-align: center;">
                    Home Country
                </div>`;
        }

        htmlContent += '</div>';
        
        // Create and show tooltip
        const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('left', (event.pageX + 12) + 'px')
            .style('top', (event.pageY - 8) + 'px')
            .style('padding', '0')
            .style('border-radius', '4px')
            .style('box-shadow', '0 2px 6px rgba(0,0,0,0.3)')
            .style('pointer-events', 'none')
            .style('z-index', '10000')
            .style('opacity', '0')
            .html(htmlContent);
        
        // Quick fade in
        tooltip.transition()
            .duration(100)
            .style('opacity', '0.95');
    }

    // ADD THIS RIGHT AFTER showEnhancedTooltip method ends
    
    showAffiliateTooltip(event, countryName) {
        const normalizedName = this.normalizeCountryName(countryName);
        if (!normalizedName || !window.affiliateDataManager) return;
        
        window.affiliateDataManager.getAffiliateData(normalizedName).then(data => {
            if (!data) return;
            
            const htmlContent = `
                <div style="
                    width: 180px;
                    font-family: -apple-system, system-ui, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 8px;
                    padding: 12px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                ">
                    <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">
                        🎯 ${countryName}
                    </div>
                    <div style="font-size: 12px; line-height: 1.5;">
                        <div>📊 Conversion Rate: <strong>${data.conversion?.toFixed(1) || 0}%</strong></div>
                        <div>💰 Avg Commission: <strong>${data.commission?.toFixed(1) || 0}%</strong></div>
                        <div>🏆 Top Niche: <strong>${data.topNiche || 'General'}</strong></div>
                    </div>
                </div>`;
            
            const tooltip = d3.select('body')
                .append('div')
                .attr('class', 'tooltip')
                .style('position', 'absolute')
                .style('left', (event.pageX + 12) + 'px')
                .style('top', (event.pageY - 8) + 'px')
                .style('pointer-events', 'none')
                .style('z-index', '10000')
                .style('opacity', '0')
                .html(htmlContent);
            
            tooltip.transition()
                .duration(100)
                .style('opacity', '1');
        });
    }

    showPublishingTooltip(event, countryName) {
        const normalizedName = this.normalizeCountryName(countryName);
        if (!normalizedName || !window.publishingDataManager) return;
        
        window.publishingDataManager.getPublishingData(normalizedName).then(data => {
            if (!data) return;
            
            const htmlContent = `
                <div style="
                    width: 180px;
                    font-family: -apple-system, system-ui, sans-serif;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                    border-radius: 8px;
                    padding: 12px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                ">
                    <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">
                        📚 ${countryName}
                    </div>
                    <div style="font-size: 12px; line-height: 1.5;">
                        <div>📈 Market Score: <strong>${data.score?.toFixed(0) || 0}/100</strong></div>
                        <div>📖 Top Genre: <strong>${data.topGenre || 'Fiction'}</strong></div>
                        <div>🏪 Platform: <strong>${data.dominantPlatform || 'Amazon'}</strong></div>
                        <div>💵 Avg Price: <strong>$${data.avgBookPrice?.toFixed(2) || 0}</strong></div>
                    </div>
                </div>`;
            
            const tooltip = d3.select('body')
                .append('div')
                .attr('class', 'tooltip')
                .style('position', 'absolute')
                .style('left', (event.pageX + 12) + 'px')
                .style('top', (event.pageY - 8) + 'px')
                .style('pointer-events', 'none')
                .style('z-index', '10000')
                .style('opacity', '0')
                .html(htmlContent);
            
            tooltip.transition()
                .duration(100)
                .style('opacity', '1');
        });
    }

    getTerritoryInfo(name) {
        // Respectful, factual information about territories
        const territories = {
            "Western Sahara": {
                flag: "🇪🇭", // If this doesn't work, we'll use fallback
                status: "Disputed territory",
                currency: "MAD/DZD",
                fact: "Uses Moroccan Dirham & Algerian Dinar"
            },
            "Greenland": {
                flag: "🇬🇱",
                status: "Danish territory",
                currency: "DKK",
                fact: "Uses Danish Krone"
            },
            "Somaliland": {
                flag: "🇸🇴", // Use Somalia flag as fallback
                status: "Autonomous region",
                currency: "SLS",
                fact: "Uses Somaliland Shilling"
            },
            "Kosovo": {
                flag: "🇽🇰",
                status: "Partially recognized",
                currency: "EUR",
                fact: "Uses Euro"
            },
            "South Ossetia": {
                flag: "🇬🇪", // Use Georgia flag as context
                status: "Disputed territory",
                currency: "RUB",
                fact: "Uses Russian Ruble"
            },
            "New Caledonia": {
                flag: "🇳🇨",
                status: "French territory",
                currency: "XPF",
                fact: "Uses CFP Franc"
            },
            "French Southern Territories": {
                flag: "🇹🇫",
                status: "French territory",
                currency: "EUR",
                fact: "No permanent population"
            },
            "Antarctica": {
                flag: "🇦🇶",
                status: "International territory",
                currency: "None",
                fact: "Research stations only"
            },
            "Falkland Islands": {
                flag: "🇫🇰",
                status: "British territory",
                currency: "FKP",
                fact: "Uses Falkland Pound"
            },
            "Gibraltar": {
                flag: "🇬🇮",
                status: "British territory",
                currency: "GIP",
                fact: "Uses Gibraltar Pound"
            },
            "Palestine": {
                flag: "🇵🇸",
                status: "Partially recognized",
                currency: "ILS/JOD",
                fact: "Uses Israeli Shekel & Jordanian Dinar"
            },
            
        };
        
        // Check if it's an unknown numbered country
        if (name && name.startsWith("Country ")) {
            return {
                flag: "🌍", // Use globe as fallback
                status: "Unidentified region",
                currency: "Unknown",
                fact: "Data not available"
            };
        }
        
        return territories[name] || null;
    }

    showTerritoryTooltip(event, territoryName, info) {
        // Ensure flag displays properly
        const flagDisplay = info.flag || "🌍";
        
        // Create respectful tooltip for territories
        const htmlContent = `
            <div style="
                width: 160px;
                font-family: -apple-system, system-ui, sans-serif;
                font-size: 10px;
                background: #2d3748;
                color: #f7fafc;
                border-radius: 4px;
                overflow: hidden;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            ">
                <!-- Header -->
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 8px;
                    background: #1a202c;
                    border-bottom: 1px solid #4a5568;
                ">
                    <span style="font-size: 16px; line-height: 1; display: block;">${flagDisplay}</span>
                    <div style="flex: 1; min-width: 0; overflow: hidden;">
                        <div style="
                            font-weight: 600; 
                            font-size: 11px; 
                            color: #fff;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        ">
                            ${territoryName}
                        </div>
                        <div style="color: #a0aec0; font-size: 9px; margin-top: 1px;">
                            ${info.status}
                        </div>
                    </div>
                </div>
                
                <!-- Info -->
                <div style="
                    padding: 6px 8px;
                    background: #2d3748;
                    font-size: 9px;
                    line-height: 1.4;
                    color: #cbd5e0;
                ">
                    <div style="margin-bottom: 2px;">
                        <span style="color: #a0aec0;">Currency:</span> ${info.currency}
                    </div>
                    <div style="color: #90cdf4;">
                        ${info.fact}
                    </div>
                </div>
            </div>`;
        
        // Create and show tooltip
        const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('left', (event.pageX + 12) + 'px')
            .style('top', (event.pageY - 8) + 'px')
            .style('padding', '0')
            .style('border-radius', '4px')
            .style('box-shadow', '0 2px 6px rgba(0,0,0,0.3)')
            .style('pointer-events', 'none')
            .style('z-index', '10000')
            .style('opacity', '0')
            .html(htmlContent);
        
        // Quick fade in
        tooltip.transition()
            .duration(100)
            .style('opacity', '0.95');
    }

    // Helper methods to add to the class:

    calculateStrength(rate, trend) {
        // Educational strength indicator (not financial advice)
        if (!trend) return null;
        
        const trendValue = parseFloat(trend.percentage);
        
        if (trendValue > 1.5) {
            return {
                label: 'Strengthening',
                description: 'Getting stronger vs your currency',
                color: '#ea4335'
            };
        } else if (trendValue < -1.5) {
            return {
                label: 'Weakening', 
                description: 'Your money goes further here',
                color: '#34a853'
            };
        } else {
            return {
                label: 'Stable',
                description: 'Relatively stable exchange',
                color: '#4285f4'
            };
        }
    }
    
    getCurrencyInfo(code) {
        if (!code) return '';
        
        let info = [];
        
        // Check decimals
        const noDecimals = ['JPY', 'KRW', 'VND', 'IDR', 'CLP', 'ISK', 'TWD', 'UGX', 'VUV', 'XAF', 'XOF', 'XPF'];
        const threeDecimals = ['BHD', 'JOD', 'KWD', 'OMR', 'TND'];
        
        if (noDecimals.includes(code)) {
            info.push(`
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="opacity: 0.7;">🪙</span>
                    <span>No decimals</span>
                </div>
            `);
        } else if (threeDecimals.includes(code)) {
            info.push(`
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="opacity: 0.7;">🪙</span>
                    <span>3 decimal places</span>
                </div>
            `);
        }
        
        // Check if shared currency
        if (window.countryToCurrency) {
            const sharedCount = Object.values(window.countryToCurrency).filter(c => c === code).length;
            if (sharedCount > 1) {
                info.push(`
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="opacity: 0.7;">🌍</span>
                        <span>${sharedCount} countries</span>
                    </div>
                `);
            }
        }
        
        return info.join('');
    }
    getSmartExchangeAdvice(rate, trend, currencyCode) {
    if (!rate) return '';
    
    // Provide smart, actionable advice based on rate and trend
    let advice = '';
    
    // Check if it's a good exchange rate historically
    const isVolatile = ['TRY', 'ARS', 'ZAR', 'BRL', 'RUB', 'MXN', 'INR'].includes(currencyCode);
    const isStable = ['CHF', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 'JPY'].includes(currencyCode);
    
    if (trend && trend.direction === 'down' && Math.abs(trend.percentage) > 0.5) {
        // Currency is weakening = good for exchange
        advice = `<div style="
            font-size: 9px; 
            color: #68d391; 
            background: rgba(104, 211, 145, 0.1); 
            padding: 2px 4px; 
            border-radius: 2px;
            margin-top: 3px;
        ">
            💡 Good time to exchange
        </div>`;
    } else if (trend && trend.direction === 'up' && Math.abs(trend.percentage) > 1) {
        // Currency strengthening = wait if possible
        advice = `<div style="
            font-size: 9px; 
            color: #fbd38d; 
            background: rgba(251, 211, 141, 0.1); 
            padding: 2px 4px; 
            border-radius: 2px;
            margin-top: 3px;
        ">
            ⏰ Consider waiting
        </div>`;
    } else if (isVolatile) {
        advice = `<div style="
            font-size: 9px; 
            color: #fc8181; 
            background: rgba(252, 129, 129, 0.1); 
            padding: 2px 4px; 
            border-radius: 2px;
            margin-top: 3px;
        ">
            ⚠️ Volatile currency
        </div>`;
    } else if (isStable) {
        advice = `<div style="
            font-size: 9px; 
            color: #90cdf4; 
            background: rgba(144, 205, 244, 0.1); 
            padding: 2px 4px; 
            border-radius: 2px;
            margin-top: 3px;
        ">
            ✓ Stable currency
        </div>`;
    }
    
    return advice;
}

    getInterestingFacts(countryName, currency, distance) {
        const facts = [];
        
        // How many countries share this currency
        if (currency && window.countryToCurrency) {
            const sharedCount = Object.values(window.countryToCurrency).filter(c => c === currency.code).length;
            if (sharedCount > 1) {
                facts.push(`💰 Currency shared by ${sharedCount} countries`);
            }
        }
        
        // Distance from home (if calculated)
        if (distance) {
            facts.push(`✈️ ${distance} from home`);
        }
        
        // Currency decimals (interesting for some)
        if (currency) {
            const decimals = this.getCurrencyDecimals(currency.code);
            if (decimals === 0) {
                facts.push(`🪙 No decimal coins used here!`);
            } else if (decimals === 3) {
                facts.push(`🪙 Uses 3 decimal places (rare!)`);
            }
        }
        
        // Market status (if applicable)
        const marketStatus = this.getMarketStatus(countryName);
        if (marketStatus) {
            facts.push(marketStatus);
        }
        
        return facts;
    }

    getCurrencyDecimals(code) {
        const noDecimals = ['JPY', 'KRW', 'VND', 'IDR', 'CLP', 'ISK', 'TWD', 'UGX', 'VUV', 'XAF', 'XOF', 'XPF'];
        const threeDecimals = ['BHD', 'JOD', 'KWD', 'OMR', 'TND'];
        
        if (noDecimals.includes(code)) return 0;
        if (threeDecimals.includes(code)) return 3;
        return 2;
    }

    getMarketStatus(countryName) {
        // Simple market hours check
        const now = new Date();
        const hour = now.getUTCHours();
        
        const markets = {
            'United States': { open: 14, close: 21, name: 'NYSE' },
            'United Kingdom': { open: 8, close: 16, name: 'LSE' },
            'Japan': { open: 0, close: 6, name: 'TSE' },
            'China': { open: 1, close: 7, name: 'SSE' },
            'Germany': { open: 8, close: 16, name: 'FSE' },
            'Hong Kong': { open: 1, close: 8, name: 'HKEX' }
        };
        
        const market = markets[countryName];
        if (market) {
            const isOpen = hour >= market.open && hour < market.close;
            return isOpen ? `📈 ${market.name} open` : `📉 ${market.name} closed`;
        }
        
        return null;
    }

    estimateDistance(from, to) {
        // Simplified distance categories
        // In production, use real coordinates
        const regions = {
            'North America': ['United States', 'Canada', 'Mexico'],
            'Europe': ['United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Norway', 'Sweden'],
            'Asia': ['China', 'Japan', 'India', 'South Korea', 'Singapore'],
            'Oceania': ['Australia', 'New Zealand'],
            'South America': ['Brazil', 'Argentina', 'Chile'],
            'Africa': ['South Africa', 'Egypt', 'Nigeria', 'Kenya']
        };
        
        let fromRegion = null, toRegion = null;
        
        for (const [region, countries] of Object.entries(regions)) {
            if (countries.includes(from)) fromRegion = region;
            if (countries.includes(to)) toRegion = region;
        }
        
        if (fromRegion === toRegion) return 'Nearby';
        if ((fromRegion === 'North America' && toRegion === 'Europe') || 
            (fromRegion === 'Europe' && toRegion === 'North America')) return '~6 hours flight';
        if ((fromRegion === 'Europe' && toRegion === 'Asia') || 
            (fromRegion === 'Asia' && toRegion === 'Europe')) return '~10 hours flight';
        
        return 'Far away';
    }

    getCapital(countryName) {
        // Top 50+ capitals (expand as needed)
        const capitals = {
            'United States': 'Washington D.C.',
            'United Kingdom': 'London',
            'France': 'Paris',
            'Germany': 'Berlin',
            'Italy': 'Rome',
            'Spain': 'Madrid',
            'Portugal': 'Lisbon',
            'Netherlands': 'Amsterdam',
            'Belgium': 'Brussels',
            'Switzerland': 'Bern',
            'Austria': 'Vienna',
            'Norway': 'Oslo',
            'Sweden': 'Stockholm',
            'Denmark': 'Copenhagen',
            'Finland': 'Helsinki',
            'Poland': 'Warsaw',
            'Russia': 'Moscow',
            'Ukraine': 'Kyiv',
            'Greece': 'Athens',
            'Turkey': 'Ankara',
            'Japan': 'Tokyo',
            'China': 'Beijing',
            'South Korea': 'Seoul',
            'India': 'New Delhi',
            'Singapore': 'Singapore',
            'Thailand': 'Bangkok',
            'Vietnam': 'Hanoi',
            'Indonesia': 'Jakarta',
            'Philippines': 'Manila',
            'Malaysia': 'Kuala Lumpur',
            'Australia': 'Canberra',
            'New Zealand': 'Wellington',
            'Canada': 'Ottawa',
            'Mexico': 'Mexico City',
            'Brazil': 'Brasília',
            'Argentina': 'Buenos Aires',
            'Chile': 'Santiago',
            'Colombia': 'Bogotá',
            'Peru': 'Lima',
            'South Africa': 'Pretoria',
            'Egypt': 'Cairo',
            'Kenya': 'Nairobi',
            'Nigeria': 'Abuja',
            'Israel': 'Jerusalem',
            'Saudi Arabia': 'Riyadh',
            'UAE': 'Abu Dhabi',
            'Iran': 'Tehran',
            'Pakistan': 'Islamabad',
            'Bangladesh': 'Dhaka',
            'Ireland': 'Dublin'
        };
        
        return capitals[countryName] || null;
    }

    getSimpleLocalTime(countryName) {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        
        // Major country UTC offsets
        const offsets = {
            'United States': -5, 'United Kingdom': 0, 'France': 1, 'Germany': 1,
            'Norway': 1, 'Sweden': 1, 'Japan': 9, 'China': 8, 'India': 5.5,
            'Australia': 10, 'Brazil': -3, 'Canada': -5
        };
        
        const offset = offsets[countryName];
        if (offset !== undefined) {
            const localTime = new Date(utc + (3600000 * offset));
            return `Local time: ${localTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            })}`;
        }
        return null;
    }

    getPracticalInfo(countryName, currency) {
        // Practical info that EVERY country has (using data you already have)
        const info = [];
        
        // Currency decimals (important for travelers)
        if (currency) {
            const decimals = this.getCurrencyDecimals(currency.code);
            info.push(`<div>💰 <strong>Smallest unit:</strong> ${decimals === 0 ? 'No decimals' : `${decimals} decimal places`}</div>`);
            
            // Currency usage
            const sharedBy = this.getCountriesUsingCurrency(currency.code);
            if (sharedBy.length > 1) {
                info.push(`<div>🌍 <strong>Shared by:</strong> ${sharedBy.length} countries</div>`);
            }
        }
        
        // Payment culture (general patterns)
        const paymentInfo = this.getPaymentCulture(countryName);
        if (paymentInfo) {
            info.push(`<div>💳 <strong>Payment:</strong> ${paymentInfo}</div>`);
        }
        
        // Tipping culture (useful for travelers)
        const tippingInfo = this.getTippingCulture(countryName);
        if (tippingInfo) {
            info.push(`<div>💵 <strong>Tipping:</strong> ${tippingInfo}</div>`);
        }
        
        return info.join('');
    }

    getCurrencyDecimals(currencyCode) {
        // Currencies with no decimal places
        const noDecimals = ['JPY', 'KRW', 'VND', 'IDR', 'CLP', 'ISK', 'TWD', 'UGX', 'VUV', 'XAF', 'XOF', 'XPF'];
        // Currencies with 3 decimal places
        const threeDecimals = ['BHD', 'JOD', 'KWD', 'OMR', 'TND'];
        
        if (noDecimals.includes(currencyCode)) return 0;
        if (threeDecimals.includes(currencyCode)) return 3;
        return 2; // Default for most currencies
    }

    getCountriesUsingCurrency(currencyCode) {
        const countries = [];
        for (const [country, code] of Object.entries(window.countryToCurrency)) {
            if (code === currencyCode) {
                countries.push(country);
            }
        }
        return countries;
    }

    getPaymentCulture(countryName) {
        // General patterns based on regions/development
        const cashPreferred = ['Myanmar', 'Cambodia', 'Laos', 'Madagascar', 'Ethiopia', 'Bolivia', 'Nepal'];
        const cardWidespread = ['Norway', 'Sweden', 'Denmark', 'Finland', 'Iceland', 'Netherlands', 'United Kingdom', 
                                'Canada', 'Australia', 'New Zealand', 'Singapore', 'South Korea'];
        const mobilePayment = ['China', 'India', 'Kenya', 'Tanzania', 'Uganda', 'Philippines', 'Indonesia'];
        
        if (cashPreferred.includes(countryName)) return 'Cash preferred';
        if (cardWidespread.includes(countryName)) return 'Cards widely accepted';
        if (mobilePayment.includes(countryName)) return 'Mobile payments popular';
        
        // For Euro countries
        if (window.countryToCurrency[countryName] === 'EUR') return 'Cards widely accepted';
        
        return 'Cash & cards accepted';
    }

    getTippingCulture(countryName) {
        // Simplified tipping guide
        const noTipping = ['Japan', 'China', 'South Korea', 'Singapore', 'Malaysia', 'Australia', 'New Zealand', 
                        'Denmark', 'Finland', 'Belgium'];
        const roundUp = ['Germany', 'Netherlands', 'Sweden', 'Norway', 'Switzerland', 'Austria', 'Czech Republic'];
        const standard10 = ['United Kingdom', 'France', 'Italy', 'Spain', 'Portugal', 'Greece', 'Russia', 'Poland'];
        const standard15_20 = ['United States', 'Canada'];
        
        if (noTipping.includes(countryName)) return 'Not customary';
        if (roundUp.includes(countryName)) return 'Round up bill';
        if (standard10.includes(countryName)) return '5-10% if satisfied';
        if (standard15_20.includes(countryName)) return '15-20% expected';
        
        return '5-10% appreciated';
    }

    getCurrencyFacts(currencyCode) {
        // Educational facts about currencies
        const facts = {
            'USD': 'The US Dollar is the world\'s primary reserve currency, used in ~60% of global reserves',
            'EUR': 'The Euro is used by 20 EU countries and over 340 million people daily',
            'GBP': 'The British Pound is the world\'s oldest currency still in use (1200+ years)',
            'JPY': 'Japanese Yen uses no decimal places - ¥100 is the smallest common note',
            'CHF': 'Swiss Franc is considered one of the world\'s safest currencies',
            'CNY': 'Chinese Yuan/Renminbi literally means "people\'s currency"',
            'INR': 'The Indian Rupee symbol ₹ was designed in 2010 through a public competition',
            'AUD': 'Australian Dollar notes are made of polymer plastic, not paper',
            'CAD': 'Canadian Dollar coins are called "Loonies" (C$1) and "Toonies" (C$2)',
            'NOK': 'Norwegian Krone is one of the most traded currencies despite Norway\'s small population',
            'SEK': 'Sweden is moving toward becoming the world\'s first cashless society',
            'DKK': 'Danish Krone is pegged to the Euro at a fixed rate',
            'ISK': 'Icelandic Króna was heavily revalued after the 2008 financial crisis',
            'NZD': 'New Zealand Dollar was the first to use polymer notes with transparent windows',
            'SGD': 'Singapore Dollar is one of the most stable currencies in Asia',
            'HKD': 'Hong Kong Dollar has been pegged to the US Dollar since 1983',
            'KRW': 'South Korean Won\'s largest note (₩50,000) is worth only about $38 USD',
            'MXN': 'Mexican Peso is the most traded currency in Latin America',
            'BRL': 'Brazilian Real replaced 7 previous currencies due to hyperinflation',
            'ZAR': 'South African Rand is legal tender in several neighboring countries',
            'THB': 'Thai Baht was originally a weight measurement for silver',
            'IDR': 'Indonesian Rupiah has one of the smallest unit values globally',
            'TRY': 'Turkish Lira has been redenominated - 1 new Lira = 1,000,000 old Lira (2005)',
            'RUB': 'Russian Ruble is one of the world\'s oldest national currencies (700+ years)',
            'PLN': 'Polish Złoty literally means "golden" in Polish',
            'VND': 'Vietnamese Dong has the lowest value per unit of major world currencies'
        };
        
        return facts[currencyCode] || null;
    }

    getLocalTime(countryName) {
        // Simple timezone approximation based on country
        // In production, you'd use a proper timezone library
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        
        // Approximate UTC offsets for major countries
        const timezones = {
            'United States': -5, // EST as approximation
            'United Kingdom': 0,
            'France': 1, 'Germany': 1, 'Italy': 1, 'Spain': 1, 'Netherlands': 1,
            'Norway': 1, 'Sweden': 1, 'Denmark': 1, 'Finland': 2,
            'Russia': 3, // Moscow time
            'India': 5.5,
            'China': 8, 'Hong Kong': 8, 'Singapore': 8,
            'Japan': 9, 'South Korea': 9,
            'Australia': 10, // Sydney time
            'New Zealand': 12,
            'Brazil': -3,
            'Argentina': -3,
            'Mexico': -6,
            'Canada': -5, // Toronto time
            'South Africa': 2,
            'Egypt': 2,
            'Saudi Arabia': 3,
            'UAE': 4,
            'Thailand': 7,
            'Indonesia': 7,
            'Philippines': 8
        };
        
        const offset = timezones[countryName];
        if (offset !== undefined) {
            const localTime = new Date(utc + (3600000 * offset));
            return localTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
        }
        
        return null;
    }

    showTooltip(event, message) {
        this.hideTooltip();
        d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('left', (event.pageX) + 'px')
            .style('top', (event.pageY - 10) + 'px')
            .text(message);
    }

    hideTooltip() {
        d3.selectAll('.tooltip').remove();
    }

    // Map mode management
    setMapMode(mode) {
        this.mapMode = mode;
        this.updateMapStatus();
    }

    enterAddingMode() {
        this.mapMode = 'adding';
        this.pendingDestinationAdd = true;
        
        document.getElementById('worldMap').style.cursor = 'crosshair';
        console.log('Entered adding mode - click map to add destination');
        this.updateMapStatus();
    }

    exitAddingMode() {
        this.pendingDestinationAdd = false;
        document.getElementById('worldMap').style.cursor = 'default';
        console.log('Exited adding mode');
    }

    lockMap() {
        this.mapMode = 'locked';
        console.log('🔒 Map locked');
        this.updateMapStatus();
    }

    unlockMap() {
        this.mapMode = 'interactive';
        console.log('🔓 Map unlocked');
        this.updateMapStatus();
    }

    updateMapStatus() {
        const statusDiv = document.getElementById('mapStatus');
        if (!statusDiv) return;
        
        if (this.mapMode === 'interactive') {
            statusDiv.className = 'map-status';
            statusDiv.innerHTML = '🌍 Interactive Map • Click countries for instant analysis';
            statusDiv.style.display = 'block';
        } else if (this.mapMode === 'adding') {
            statusDiv.className = 'map-status';
            statusDiv.innerHTML = '🎯 Click a country on the map to add as destination...';
            statusDiv.style.display = 'block';
        } else if (this.mapMode === 'locked') {
            statusDiv.className = 'map-status locked';
            statusDiv.innerHTML = '🔒 Map is locked - use "Clear All" button to unlock and start over';
            statusDiv.style.display = 'block';
        }
        
        const mapContainer = document.getElementById('worldMap')?.parentElement;
        if (mapContainer) {
            mapContainer.className = this.mapMode === 'locked' ? 'map-container-primary map-locked' : 'map-container-primary';
        }
    }

    // Get country feature map for external access
    getCountryFeatureMap() {
        return this.countryFeatureMap;
    }
    
    // Reset map state
    reset() {
        this.mapMode = 'interactive';
        this.pendingDestinationAdd = false;
        this.updateMapStatus();
        
        // Reset visual selection
        d3.selectAll('.country')
            .classed('selected-home', false)
            .classed('selected-destination', false);
    }
}

// Safari Zoom Issues
if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    // Disable double-tap zoom on iOS
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Add pinch-to-zoom support for the map
    const mapElement = document.getElementById('worldMap');
    if (mapElement) {
        mapElement.style.touchAction = 'pan-x pan-y pinch-zoom';
    }
}

// Export utility functions
export async function initializeMap() {
    const mapManager = new MapManager();
    
    try {
        console.log('Loading map data...');
        const worldData = await mapManager.loadMapData();
        console.log('Map data loaded:', worldData?.type, 'with', worldData?.features?.length || worldData?.geometries?.length, 'features');
        
        const processedData = mapManager.processMapData(worldData);
        
        console.log('Drawing map...');
        const mapResult = mapManager.drawMap(processedData);
        
        console.log('Map initialization complete');
        return { mapManager, ...mapResult };
        
    } catch (error) {
        console.error('Error initializing map:', error);
        throw error;
    }
}

export default MapManager;
