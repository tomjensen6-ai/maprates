/**
 * MapRates Pro - Professional Currency Exchange Platform
 * Version: 2.0.0
 * Author: [Your Name/Company]
 * License: [Your License]
 * 
 * Core application module handling currency exchange rates,
 * interactive maps, charts, and data analysis.
 */

//Add security PASSWD for testing - until it go Live. 
(function() {
    // Simple password protection
    const VALID_PASSWORDS = [
        'maptest2025!.',     // Your password
        'beta258!.',         // For tester 1
        'preview476!.'       // For tester 2
    ];
    
    // Check if user already authenticated
    const isAuthenticated = sessionStorage.getItem('maprates_auth');
    
    if (!isAuthenticated) {
        const password = prompt('Enter access code for MapRates Beta:');
        
        if (!password || !VALID_PASSWORDS.includes(password)) {
            document.body.innerHTML = `
                <div style="
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    font-family: Arial, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                ">
                    <div style="text-align: center;">
                        <h1>Access Denied</h1>
                        <p>Invalid access code. Please contact the administrator.</p>
                        <button onclick="location.reload()" style="
                            margin-top: 20px;
                            padding: 10px 20px;
                            background: white;
                            color: #667eea;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                        ">Try Again</button>
                    </div>
                </div>
            `;
            throw new Error('Unauthorized');
        }
        
        // Store authentication for this session
        sessionStorage.setItem('maprates_auth', 'true');
    }
})();


// ============================================================================
// MODULE IMPORTS
// ============================================================================

        import { CURRENCY_SYMBOLS, overlayColors, FLAG_MAP, requestThrottle } from '../config/constants.js';
        import { SmartCacheManager, refreshCacheStats, clearCache, preloadPopularPairs, getCacheStatsForStatus } from '../modules/core/cacheManager.js';
        import { MapManager, initializeMap } from '../modules/visualization/mapManager.js';
        import { chartManager } from '../modules/visualization/chartManager.js';
        import { technicalIndicators } from '../modules/analysis/technicalIndicators.js';
        import { historicalDataManager } from '../modules/data/historicalDataManager.js';
        import { aiPredictions } from '../modules/analysis/aiPredictions.js';
        import { stateManager } from '../modules/core/stateManager.js';
        import { overlayManager } from '../modules/visualization/overlayManager.js';
        import { exchangeRateManager } from '../modules/core/exchangeRateManager.js';
        import { countrySelectionManager } from '../modules/data/countrySelectionManager.js';
        import { progressManager } from '../modules/ui/progressManager.js';
        import { uiManager } from '../modules/ui/uiManager.js';
        import mapInteractionManager from '../modules/ui/mapInteractionManager.js';
        import apiConfigManager from '../modules/core/apiConfigManager.js';
        import premiumFeaturesManager from '../modules/core/premiumFeaturesManager.js';
        import chartUIManager from '../modules/ui/chartUIManager.js';
        import notificationManager from '../modules/ui/notificationManager.js';
        import modalManager from '../modules/ui/modalManager.js';
        import dataExportManager from '../modules/ui/dataExportManager.js';

        // Debug configuration object
        const DEBUG = {
            enabled: true, // Set to false for production
            log: function(...args) {
                if (this.enabled) {
                    console.log(...args);
                }
            },
            error: function(...args) {
                if (this.enabled) {
                    console.error(...args);
                }
            },
            warn: function(...args) {
                if (this.enabled) {
                    console.warn(...args);
                }
            }
        };
        
        // Production flag
        const isProduction = false; // Set to true when deploying
        
        console.log(`🚀 App starting in ${DEBUG ? 'DEBUG' : 'PRODUCTION'} mode`);

        // Professional Device Detection System
        const DeviceManager = {
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            isIPhone: /iPhone|iPod/i.test(navigator.userAgent),
            isIPad: /iPad/i.test(navigator.userAgent),
            isTablet: /iPad|Android(?!.*Mobile)|Tablet/i.test(navigator.userAgent),
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            pixelRatio: window.devicePixelRatio || 1,
            isSmallScreen: window.innerWidth < 768,
            isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            
            // Professional viewport detection
            getViewportSize() {
                return {
                    width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
                    height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
                };
            }
        };
        
        // Store globally for other modules
        window.DeviceManager = DeviceManager;
        console.log('📱 Device Detection:', DeviceManager);
               
        /**
         * Application Configuration
         */
        const APP_CONFIG = {
            version: '2.0.0',
            environment: 'development', // 'development' | 'staging' | 'production'
            debug: false,
            api: {
                timeout: 10000,
                retries: 3,
                cacheTime: 300000 // 5 minutes
            },
            features: {
                enableAnalytics: true,
                enableErrorTracking: true,
                enablePerformanceMonitoring: true
            }
        };

        
        // ============================================================================
        // GLOBAL MANAGERS
        // ============================================================================

        // Make managers globally accessible for debugging
        window.chartManager = chartManager;
        
        
        /**
         * Global manager references
         * @private
         */
        Object.assign(window, {
            chartManager,
            historicalDataManager,
            technicalIndicators,
            aiPredictions,
            overlayManager,
            stateManager,
            CURRENCY_SYMBOLS,
            currencySymbols: CURRENCY_SYMBOLS // Backward compatibility
        });
        // Make CURRENCY_SYMBOLS globally available for getCurrencyForCountry
        window.CURRENCY_SYMBOLS = CURRENCY_SYMBOLS;
        window.currencySymbols = CURRENCY_SYMBOLS; // Also set this for backward compatibility

        const script1 = document.createElement('script');
        script1.src = './countryToCurrency.js';
        document.head.appendChild(script1);
        
        const script2 = document.createElement('script');
        script2.src = './idNormalizationMap.js';
        document.head.appendChild(script2);

        // Use imported currency symbols
        const currencySymbols = CURRENCY_SYMBOLS;
        
        // ============================================================================
        // GLOBAL STATE MANAGEMENT
        // ============================================================================

        /**
         * Application state variables
         * @private
         */

        let worldData = null;
        let homeCountry = null;
        let destinationCountry = null;
        let destinationCountries = []; // Array for multiple destinations
        let countryFeatureMap = new Map(); // Map country names to their features
        
        // Chart references maintained for compatibility
        let currentChart = null;
        let currentHistoricalData = null;
        
        window.destinationCountries = destinationCountries;

        // Smart Chart Cache System for Instant Loading
        class SmartChartCache {
            constructor() {
                this.cache = new Map();
                this.maxSize = 50;
                this.maxAge = 5 * 60 * 1000; // 5 minutes
            }
            
            getCacheKey(from, to, days) {
                return `${from}_${to}_${days}`;
            }
            
            get(from, to, days) {
                const key = this.getCacheKey(from, to, days);
                const cached = this.cache.get(key);
                
                if (!cached) return null;
                
                // Check if expired
                if (Date.now() - cached.timestamp > this.maxAge) {
                    this.cache.delete(key);
                    return null;
                }
                
                // Move to front (LRU)
                this.cache.delete(key);
                this.cache.set(key, cached);
                
                console.log(`⚡ Cache HIT for ${days}D chart`);
                return cached.data;
            }
            
            set(from, to, days, data) {
                const key = this.getCacheKey(from, to, days);
                
                // Enforce size limit
                if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
                    const firstKey = this.cache.keys().next().value;
                    this.cache.delete(firstKey);
                }
                
                this.cache.set(key, {
                    data: data,
                    timestamp: Date.now()
                });
                
                console.log(`💾 Cached ${days}D chart data`);
            }
        }

        // Initialize cache system immediately
        if (!window.chartCache) {
            window.chartCache = new SmartChartCache();
            console.log('📊 Chart cache system initialized');
        }
        
        // Initialize StateManager sync helper
        function syncWithStateManager() {
            // Subscribe to state changes to keep globals in sync during migration
            stateManager.subscribe('*', (newState) => {
                // Keep globals in sync during migration
                homeCountry = newState.homeCountry;
                destinationCountry = newState.destinationCountry;
                destinationCountries = newState.destinationCountries;
                // REMOVE OR COMMENT OUT: isPremiumUser = newState.isPremiumUser;
                activeOverlays = newState.activeOverlays;
                aiPredictionsActive = newState.aiPredictionsActive;
                
                // Also sync window globals if they exist
                if (window.currentExchangeRates !== newState.currentExchangeRates) {
                    window.currentExchangeRates = newState.currentExchangeRates;
                }
            });
            
            // Initial sync of state
            stateManager.setState({
                homeCountry: homeCountry,
                destinationCountry: destinationCountry,
                destinationCountries: destinationCountries,
                isPremiumUser: premiumFeaturesManager.isPremium(),
                activeOverlays: activeOverlays || [],
                aiPredictionsActive: aiPredictionsActive || false
            });
            // Initialize overlay manager with state manager
            overlayManager.initialize(stateManager);
        }

        // Store trend data to prevent random changes
        window.currencyTrends = window.currencyTrends || {};

        function getCurrencyTrend(currencyCode) {
            if (!window.currencyTrends[currencyCode]) {
                // Generate once and store
                const isUp = Math.random() > 0.5;
                const percentage = (Math.random() * 2 + 0.1).toFixed(2); // 0.1% to 2.1%
                window.currencyTrends[currencyCode] = {
                    direction: isUp ? 'up' : 'down',
                    percentage: percentage,
                    color: isUp ? '#10b981' : '#ef4444'
                };
            }
            return window.currencyTrends[currencyCode];
        }        
        
        // Multiple currency overlay system
        let activeOverlays = []; // Array to store active overlay currencies
        let overlayCounter = 0;
        
        // Technical indicators now managed by technicalIndicators module
        let activeIndicators = technicalIndicators.getActiveIndicators();
        
        // ============= Trend PREDICTION SYSTEM VARIABLES =============
        let aiPredictionsActive = false;
        let aiPredictionData = null;
        let aiConfidenceLevel = 80; // Default 80% confidence interval
        let aiPredictionDays = 7; // Predict 7 days ahead
        let aiProcessingTime = 1200; // Realistic processing delay (ms)

        // AI Algorithm Configuration
        const AI_ALGORITHMS = {
            linear: {
                name: 'Linear Regression',
                description: 'Trend-based mathematical projection',
                weight: 0.4,
                color: '#4285f4'
            },
            momentum: {
                name: 'Momentum Analysis', 
                description: 'Recent price action patterns',
                weight: 0.3,
                color: '#34a853'
            },
            hybrid: {
                name: 'Hybrid ML Model',
                description: 'Combined algorithmic approach',
                weight: 1.0,
                color: '#ea4335'
            },
            neural: {
                name: 'Neural Network',
                description: 'Deep learning pattern recognition',
                weight: 0.6,
                color: '#9c27b0'
            }
        };

        // Currently active AI algorithm
        let activeAIAlgorithm = 'hybrid';

        // AI Prediction Accuracy Tracking
        let aiAccuracyHistory = [];
        let aiPredictionCache = new Map(); // Cache predictions for performance

        // AI Confidence Levels
        const AI_CONFIDENCE_LEVELS = {
            conservative: { level: 95, label: 'Conservative (95%)', color: '#137333' },
            balanced: { level: 80, label: 'Balanced (80%)', color: '#1a73e8' },
            aggressive: { level: 65, label: 'Aggressive (65%)', color: '#d93025' }
        };

        // AI Market Conditions Detection
        let marketConditions = {
            volatility: 'normal', // low, normal, high
            trend: 'neutral', // bullish, bearish, neutral
            momentum: 'stable', // accelerating, stable, decelerating
            confidence: 80
        };

        // AI Learning Parameters
        const AI_LEARNING_CONFIG = {
            minDataPoints: 14, // Minimum data needed for predictions
            maxLookback: 90, // Maximum historical days to analyze
            adaptivePeriods: [7, 14, 30], // Different analysis windows
            noiseFilter: 0.02, // Filter out small fluctuations
            trendSensitivity: 0.01 // Minimum change to detect trend
        };

        // AI Prediction Types
        const PREDICTION_TYPES = {
            price: 'Exchange Rate Forecast',
            trend: 'Trend Direction',
            volatility: 'Volatility Prediction',
            support: 'Support Level',
            resistance: 'Resistance Level'
        };

        // AI Visual Settings
        const AI_VISUAL_CONFIG = {
            forecastColor: '#34a853',
            confidenceColor: '#34a85330',
            trendColors: {
                bullish: '#137333',
                bearish: '#d93025', 
                neutral: '#5f6368'
            },
            predictionDash: [10, 5],
            confidenceDash: [5, 5]
        };
        
        // AI Performance Metrics
        let aiPerformanceMetrics = {
            totalPredictions: 0,
            accuratePredictions: 0,
            averageAccuracy: 0,
            bestAlgorithm: 'hybrid',
            lastUpdated: null
        };

        // AI Error Handling
        const AI_ERROR_MESSAGES = {
            insufficientData: 'Need at least 7 days of data for Mathematical Analysis',
            apiLimitReached: 'AI prediction limit reached. Upgrade for unlimited forecasts',
            processingError: 'AI processing error. Please try again',
            networkError: 'Network error during AI calculation'
        };

        // Initialize state synchronization
        syncWithStateManager();

        // Sync country selection manager with global variables
        function syncCountryVariables() {
            // When CountrySelectionManager updates, sync back to globals
            stateManager.subscribe('homeCountry', (newHome) => {
                homeCountry = newHome;
                // ADD THIS LINE to show buttons when home country is selected:
                if (newHome) {
                    updateAddDestinationButton();
                    showAmountController();
                }
            });
            
            stateManager.subscribe('destinationCountry', (newDest) => {
                destinationCountry = newDest;
                // ADD THIS LINE:
                updateAddDestinationButton();
                updateDestinationsList();
            });
            
            stateManager.subscribe('destinationCountries', (newDests) => {
                destinationCountries = newDests || [];
                // ADD THIS LINE:
                updateAddDestinationButton();
                updateDestinationsList();
            });
        }

        // Call the sync function
        syncCountryVariables();

        // NOTE: CountrySelectionManager will be initialized LATER after map is ready
                     
        async function waitForScripts() {
            return new Promise(resolve => {
                const checkScripts = () => {
                    if (window.countryToCurrency && window.idNormalizationMap) {
                        resolve();
                    } else {
                        setTimeout(checkScripts, 100);
                    }
                };
                checkScripts();
            });
        }

        async function loadMapData() {
            try {
                // Try multiple map data sources
                const mapUrls = [
                    'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
                    'https://unpkg.com/world-atlas@2.0.2/countries-110m.json',
                    'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json'
                ];
                
                for (const url of mapUrls) {
                    try {
                        console.log(`Trying to load map from: ${url}`);
                        const response = await fetch(url);
                        if (response.ok) {
                            const data = await response.json();
                            console.log('✅ Map data loaded successfully from:', url);
                            return data;
                        }
                    } catch (error) {
                        console.warn(`Failed to load from ${url}:`, error);
                    }
                }
                
                throw new Error('Could not load map data from any source');
            } catch (error) {
                handleError(error, 'Map Data Loading');
                throw error;
            }
        }

        // ============================================================================
        // CURRENCY OPERATIONS
        // ============================================================================

        /**
         * Get currency information for a country
         * @param {string} countryName - Name of the country
         * @returns {Object|null} Currency data or null if not found
         */

        function getCurrencyForCountry(countryName) {
            if (!window.countryToCurrency) {
                console.error('countryToCurrency not loaded');
                return null;
            }
            
            const currencyCode = window.countryToCurrency[countryName];
            if (!currencyCode) {
                console.warn(`No currency code found for country: "${countryName}"`);
                return null;
            }
            
            // Use either the imported or window version of CURRENCY_SYMBOLS
            const symbols = window.CURRENCY_SYMBOLS || CURRENCY_SYMBOLS || {};
            
            if (!symbols[currencyCode]) {
                console.warn(`No symbol data found for currency: "${currencyCode}"`);
                return null;
            }
            
            return {
                code: currencyCode,
                ...symbols[currencyCode]
            };
        }
        function selectCountryByClick(countryName, feature = null) {
            countrySelectionManager.selectCountryByClick(countryName, feature);
        }
        // ============================================================================
        // INITIALIZATION
        // ============================================================================

        /**
         * Initialize application on DOM ready
         * Sets up map, managers, and event listeners
         */

        async function initApp() {
            try {
                // Initialize API configuration first
                initializeAPIKey();

                // Initialize UI managers
                window.progressManager = progressManager;
                window.uiManager = uiManager;
                window.notificationManager = notificationManager;

                showLoading(true);
                hideError();

                // Initialize optional managers with error handling
                if (typeof modalManager !== 'undefined') {
                    window.modalManager = modalManager;                    
                } else {
                    console.warn('⚠️ ModalManager module not loaded');
                }

                // Initialize data export manager
                if (typeof dataExportManager !== 'undefined') {
                    window.dataExportManager = dataExportManager;                    
                } else {
                    console.warn('⚠️ DataExportManager module not loaded');
                }

                // Load external dependencies                
                await waitForScripts();                
                
                // Initialize map and country data
                worldData = await loadMapData();
                                
                // Validate data
                if (!worldData) {
                    throw new Error('Map data is null or undefined');
                }
                
                console.log('Map data type:', worldData.type);
                
                // Process TopoJSON if needed
                if (worldData.type === 'Topology') {
                    if (!worldData.objects || !worldData.objects.countries) {
                        throw new Error('TopoJSON missing countries object');
                    }
                    console.log('Converting TopoJSON to GeoJSON features using topojson.feature...');
                    
                    // Use topojson.feature to properly convert TopoJSON to GeoJSON
                    const geojsonData = topojson.feature(worldData, worldData.objects.countries);
                    console.log('Converted TopoJSON to GeoJSON:', geojsonData.type, 'with', geojsonData.features?.length, 'features');
                    
                    worldData = geojsonData;
                } else if (worldData.type !== 'FeatureCollection' && worldData.type !== 'GeometryCollection') {
                    throw new Error(`Unexpected data type: ${worldData.type}`);
                }
                
                // Process countries and populate dropdowns
                const countries = [];
                if (window.countryToCurrency) {
                    Object.keys(window.countryToCurrency).forEach(countryName => {
                        const currencyCode = window.countryToCurrency[countryName];
                        const currency = currencySymbols[currencyCode];
                        if (currency) {
                            countries.push({
                                name: countryName,
                                currency: {
                                    code: currencyCode,
                                    ...currency
                                }
                            });
                        }
                    });
                }
                
                countries.sort((a, b) => a.name.localeCompare(b.name));
                populateDropdowns(countries);
                
                // Initialize map using module
                console.log('Drawing map...');
                const mapResult = await initializeMap();
                window.mapManager = mapResult.mapManager; // Make globally accessible
                window.countryFeatureMap = mapResult.countryFeatureMap; // This is returned directly

                // Initialize MapInteractionManager immediately (don't wait for map load event)
                console.log('Initializing MapInteractionManager...');
                mapInteractionManager.init({
                    stateManager: stateManager,  // Make sure this is passed
                    mapManager: window.mapManager,
                    uiManager: uiManager,
                    countrySelectionManager: countrySelectionManager,
                    exchangeRateManager: exchangeRateManager
                });
                window.mapInteractionManager = mapInteractionManager;
                
                // Initialize Chart UI Manager
                await chartUIManager.init({
                    chartManager: window.chartManager,
                    technicalIndicators: window.technicalIndicators,
                    premiumFeaturesManager: window.premiumFeaturesManager,
                    aiPredictions: window.aiPredictions
                });
                console.log('✅ Chart UI Manager initialized');
                
                // Also ensure exchangeRateManager is available globally (it's imported but not set on window)
                window.exchangeRateManager = exchangeRateManager;

                // NOW initialize country selection manager AFTER map is ready
                console.log('Initializing country selection manager...');
                countrySelectionManager.initialize(stateManager, window.mapManager, getCurrencyForCountry);
                countrySelectionManager.setCountryFeatureMap(mapResult.countryFeatureMap);
                window.countrySelectionManager = countrySelectionManager;                
                
                showLoading(false);
                if (window.mapManager) {
                    window.mapManager.updateMapStatus();
                }
                console.log('App initialization complete');
                
            } catch (error) {
                handleError(error, 'Application Initialization');
                showError(`Failed to load the application: ${error.message}`);
                showLoading(false);
            }
            console.log('App initialization complete');
        
            // Don't make any API calls until user selects countries
            console.log('🎯 Ready for user interaction - no API calls made yet');

                // Initialize smart caching system
                console.log('💾 Smart Cache System: Enabled');
                
                // Initialize cache manager
                const cacheManager = new SmartCacheManager();
                // Make cache manager globally available
                window.cacheManager = cacheManager;
                
                // Pre-load popular currency pairs in background (after 5 seconds)
                setTimeout(() => {
                    preloadPopularPairs(cacheManager);  // ← PASS THE PARAMETER
                }, 5000);

                // Initialize map reset button with enhanced debugging
                const mapResetBtn = document.getElementById('mapResetBtn');
                console.log('Looking for mapResetBtn:', mapResetBtn);

                if (mapResetBtn) {
                    mapResetBtn.addEventListener('click', function(event) {
                        console.log('🎯 Reset button clicked!');
                        
                        // Get the SVG and group elements directly
                        const svg = d3.select('#worldMap');
                        const mapGroup = svg.select('g');
                        
                        if (mapGroup.empty()) {
                            console.error('❌ Map group not found');
                            return;
                        }
                        
                        // Try multiple zoom sources in order of preference
                        const zoom = window.mapZoom || 
                                     window.zoomBehavior || 
                                     (window.mapManager && window.mapManager.zoomBehavior) ||
                                     (window.mapInteractionManager && window.mapInteractionManager.zoomBehavior);
                        
                        if (zoom) {
                            // Best method: Use D3 zoom behavior
                            try {
                                svg.transition()
                                    .duration(250)
                                    .call(zoom.transform, d3.zoomIdentity);
                                console.log('✅ Map reset using zoom behavior');
                            } catch (error) {
                                console.error('❌ Zoom reset failed:', error);
                                // Fallback to direct transform
                                mapGroup.transition()
                                    .duration(250)
                                    .attr('transform', 'translate(0,0) scale(1)');
                                console.log('✅ Map reset using direct transform (fallback)');
                            }
                        } else {
                            // Direct transform reset as last resort
                            mapGroup.transition()
                                .duration(250)
                                .attr('transform', 'translate(0,0) scale(1)');
                            console.log('✅ Map reset using direct transform (no zoom found)');
                        }
                        
                        // Also try to call mapInteractionManager's reset if available
                        if (window.mapInteractionManager && typeof window.mapInteractionManager.resetMapView === 'function') {
                            try {
                                window.mapInteractionManager.resetMapView();
                                console.log('✅ Also called mapInteractionManager.resetMapView()');
                            } catch (error) {
                                console.log('⚠️ mapInteractionManager.resetMapView() failed:', error);
                            }
                        }
                    });
                    
                    // Add hover effects
                    mapResetBtn.addEventListener('mouseenter', function() {
                        this.style.background = 'rgba(255, 255, 255, 1)';
                        this.style.transform = 'scale(1.05)';
                    });
                    
                    mapResetBtn.addEventListener('mouseleave', function() {
                        this.style.background = 'rgba(255, 255, 255, 0.95)';
                        this.style.transform = 'scale(1)';
                    });
                    
                    console.log('✅ Map reset button event listeners added');
                } else {
                    console.log('❌ mapResetBtn element not found in DOM');
                }

                // Also check if mapInteractionManager is available at init time
                console.log('At init - mapInteractionManager available:', !!window.mapInteractionManager);
        }

        // Debug function to check chart visibility
        window.debugChart = function() {
            const container = document.getElementById('chartContainer');
            const canvas = document.getElementById('historicalChart');
            const wrapper = document.querySelector('.chart-wrapper');
            
            console.log('=== CHART DEBUG ===');
            console.log('Container:', {
                exists: !!container,
                display: container?.style.display,
                visibility: container?.style.visibility,
                height: container?.offsetHeight,
                hasActiveClass: container?.classList.contains('chart-active')
            });
            console.log('Canvas:', {
                exists: !!canvas,
                display: canvas?.style.display,
                visibility: canvas?.style.visibility,
                height: canvas?.offsetHeight
            });
            console.log('Wrapper:', {
                exists: !!wrapper,
                display: wrapper?.style.display,
                height: wrapper?.offsetHeight
            });
            console.log('Chart Manager:', {
                hasChart: !!window.chartManager?.currentChart,
                chartDestroyed: window.chartManager?.currentChart?._destroyed
            });
        };

        function populateDropdowns(countries) {
            const homeSelect = document.getElementById('homeCountry');
            const destSelect = document.getElementById('destinationCountry');
            
            // Clear existing options
            homeSelect.innerHTML = '<option value="">Home Currency</option>';
            destSelect.innerHTML = '<option value="">Destination  Currency</option>';
            
            // Define regions for grouping - PROPERLY ASSIGNED
            const regions = {
                'Most Popular': {
                    icon: '⭐',
                    countries: ['United States', 'United Kingdom', 'Japan', 'Canada', 'Australia', 'Switzerland', 'China', 'India']
                },
                'Americas': {
                    icon: '🌎',
                    countries: ['Brazil', 'Mexico', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Uruguay', 'Paraguay', 'Bolivia', 'Ecuador', 'Venezuela', 'Guatemala', 'Costa Rica', 'Panama', 'Honduras', 'El Salvador', 'Nicaragua', 'Dominican Republic', 'Cuba', 'Jamaica', 'Haiti', 'Bahamas', 'Barbados', 'Trinidad and Tobago', 'Belize', 'Guyana', 'Suriname', 'Grenada', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Antigua and Barbuda', 'Dominica', 'Saint Kitts and Nevis']
                },
                'Europe': {
                    icon: '🇪🇺',
                    countries: ['Norway', 'Sweden', 'Denmark', 'Finland', 'Iceland', 'Poland', 'Czech Republic', 'Hungary', 'Romania', 'Bulgaria', 'Croatia', 'Serbia', 'Albania', 'Greece', 'Turkey', 'Russia', 'Ukraine', 'Belarus', 'Lithuania', 'Latvia', 'Estonia', 'Moldova', 'Georgia', 'Armenia', 'Azerbaijan', 'Cyprus', 'Malta', 'Luxembourg', 'Belgium', 'Netherlands', 'Germany', 'France', 'Spain', 'Portugal', 'Italy', 'Austria', 'Slovenia', 'Slovakia', 'Bosnia and Herzegovina', 'North Macedonia', 'Montenegro', 'Kosovo', 'Ireland', 'Andorra', 'Monaco', 'San Marino', 'Vatican City', 'Liechtenstein', 'Greenland'] // Moved Greenland here (Danish territory)
                },
                'Asia-Pacific': {
                    icon: '🏯',
                    countries: ['South Korea', 'Singapore', 'Hong Kong', 'Taiwan', 'Thailand', 'Indonesia', 'Malaysia', 'Philippines', 'Vietnam', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Myanmar', 'Cambodia', 'Laos', 'Mongolia', 'Fiji', 'Papua New Guinea', 'New Zealand', 'Brunei', 'Maldives', 'Bhutan', 'Timor-Leste', 'Samoa', 'Tonga', 'Vanuatu', 'Solomon Islands', 'Kiribati', 'Palau', 'Marshall Islands', 'Micronesia', 'Nauru', 'Tuvalu', 'Afghanistan', 'Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Tajikistan', 'Kyrgyzstan', 'North Korea'] // Added North Korea here
                },
                'Middle East': {
                    icon: '🕌',
                    countries: ['Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Jordan', 'Lebanon', 'Israel', 'Iraq', 'Iran', 'Yemen', 'Syria', 'Palestine']
                },
                'Africa': {
                    icon: '🌍',
                    countries: ['South Africa', 'Nigeria', 'Egypt', 'Kenya', 'Morocco', 'Ethiopia', 'Ghana', 'Tanzania', 'Uganda', 'Algeria', 'Sudan', 'Tunisia', 'Libya', 'Senegal', 'Zimbabwe', 'Zambia', 'Rwanda', 'Somalia', 'Chad', 'Guinea', 'Benin', 'Burundi', 'Sierra Leone', 'Togo', 'Liberia', 'Mauritania', 'Eritrea', 'Gambia', 'Botswana', 'Namibia', 'Mauritius', 'Eswatini', 'Lesotho', 'Equatorial Guinea', 'Djibouti', 'Comoros', 'Cape Verde', 'Sao Tome and Principe', 'Seychelles', 'Angola', 'Mozambique', 'Madagascar', 'Cameroon', 'Ivory Coast', 'Niger', 'Burkina Faso', 'Mali', 'Malawi', 'Democratic Republic of the Congo', 'Republic of the Congo', 'Congo (Brazzaville)', 'Congo (Kinshasa)', 'Gabon', 'Central African Republic', 'South Sudan', 'Guinea-Bissau'] // Added both Congo names and Guinea-Bissau
                }
            };
            
            // Sort countries into their groups
            const groupedCountries = {};
            const processedCountries = new Set();
            
            // First, organize by defined regions
            Object.entries(regions).forEach(([regionName, regionData]) => {
                groupedCountries[regionName] = {
                    icon: regionData.icon,
                    countries: []
                };
                
                regionData.countries.forEach(countryName => {
                    // Case-insensitive matching to handle "And" vs "and" differences
                    const country = countries.find(c => 
                        c.name.toLowerCase() === countryName.toLowerCase() ||
                        c.name.replace(/\s+/g, '').toLowerCase() === countryName.replace(/\s+/g, '').toLowerCase()
                    );
                    if (country) {
                        groupedCountries[regionName].countries.push(country);
                        processedCountries.add(country.name);
                    }
                });
            });
            
            // Check for any remaining countries (should be none or very few)
            const otherCountries = countries.filter(c => !processedCountries.has(c.name));
            if (otherCountries.length > 0) {
                // Log them so we can assign them properly
                console.log('Unassigned countries found:', otherCountries.map(c => c.name));
                
                // Only add "Other" if there are actually unassigned countries
                if (otherCountries.length > 0) {
                    groupedCountries['Other'] = {
                        icon: '🌐',
                        countries: otherCountries.sort((a, b) => a.name.localeCompare(b.name))
                    };
                }
            }

            // Build the dropdown options
            Object.entries(groupedCountries).forEach(([groupName, groupData]) => {
                if (groupData.countries.length === 0) return;
                
                // Create optgroup for home select
                const homeOptgroup = document.createElement('optgroup');
                homeOptgroup.label = `${groupData.icon} ${groupName}`;
                
                // Create optgroup for destination select
                const destOptgroup = document.createElement('optgroup');
                destOptgroup.label = `${groupData.icon} ${groupName}`;
                
                // Sort countries alphabetically within each group (except Most Popular)
                if (groupName !== 'Most Popular') {
                    groupData.countries.sort((a, b) => a.name.localeCompare(b.name));
                }
                
                // Add countries to optgroups
                groupData.countries.forEach(country => {
                    // Home option
                    const homeOption = document.createElement('option');
                    homeOption.value = country.name;
                    homeOption.textContent = `${country.currency.code} - ${country.name}`;
                    if (groupName === 'Most Popular') {
                        homeOption.style.fontWeight = '600';
                    }
                    homeOptgroup.appendChild(homeOption);
                    
                    // Destination option
                    const destOption = document.createElement('option');
                    destOption.value = country.name;
                    destOption.textContent = `${country.currency.code} - ${country.name}`;
                    if (groupName === 'Most Popular') {
                        destOption.style.fontWeight = '600';
                    }
                    destOptgroup.appendChild(destOption);
                });
                
                homeSelect.appendChild(homeOptgroup);
                destSelect.appendChild(destOptgroup);
            }); 

            // Add search functionality hint
            const addSearchHint = (select) => {
                const hint = document.createElement('option');
                hint.disabled = true;
                hint.textContent = '💡 Type to search...';
                hint.style.cssText = 'font-style: italic; color: #888;';
                select.insertBefore(hint, select.children[1]);
            };

            addSearchHint(homeSelect);
            addSearchHint(destSelect);

            // Add search functionality
            const addSearchFunctionality = (select) => {
                let searchTerm = '';
                let searchTimeout;
                
                select.addEventListener('keydown', function(e) {
                    // ... rest of the old search code ...
                });
            };

            addSearchFunctionality(homeSelect);
            addSearchFunctionality(destSelect);
            
            // Original event listeners remain the same
            homeSelect.addEventListener('change', (e) => {
                console.log('Home country dropdown changed to:', e.target.value);
                if (e.target.value) {
                    selectCountryByName(e.target.value, 'home');
                    setTimeout(() => {
                        updateAddDestinationButton();
                        showAmountController();
                    }, 200);
                }
            });

            destSelect.addEventListener('change', (e) => {
                console.log('Destination country dropdown changed to:', e.target.value);
                if (e.target.value) {
                    destinationCountries = [];
                    selectCountryByName(e.target.value, 'destination');
                    setTimeout(() => {
                        updateMultipleExchangeRates();
                        updateCompactDisplay();
                    }, 100);
                }
            });

            // Rest of the event listeners remain exactly the same
            const addDestinationBtn = document.getElementById('addDestinationBtn');
            if (addDestinationBtn) {
                addDestinationBtn.addEventListener('click', () => {
                    if (destinationCountries.length < 5) {
                        if (window.mapManager) {
                            window.mapManager.enterAddingMode();
                        }
                    }
                });
            }

            const clearAllBtn = document.getElementById('resetAllBtn');
            if (clearAllBtn) {
                clearAllBtn.addEventListener('click', () => {
                    clearAll();
                });
            }

            const globalAmount = document.getElementById('globalAmount');
            if (globalAmount) {
                globalAmount.addEventListener('input', () => {
                    updateAllConversions();
                });
            }

            const compactAmount = document.getElementById('compactAmount');
            if (compactAmount) {
                compactAmount.addEventListener('input', () => {
                    updateAllConversions();
                    updateCompactDisplay();
                });
            }

            const swapBtnDropdown = document.getElementById('swapBtnDropdown');
            if (swapBtnDropdown) {
                swapBtnDropdown.addEventListener('click', () => {
                    swapCountries();
                });
            }

            const swapBtnCompact = document.getElementById('swapBtnCompact');
            if (swapBtnCompact) {
                swapBtnCompact.addEventListener('click', () => {
                    swapCountries();
                });
            }

            const showChartsBtn = document.getElementById('showChartsBtn');
            if (showChartsBtn) {
                showChartsBtn.addEventListener('click', () => {
                    console.log('Charts button clicked');
                    showHistoricalChart();
                });
            }

            const showAPIBtn = document.getElementById('showAPIBtn');
            if (showAPIBtn) {
                showAPIBtn.addEventListener('click', () => {
                    console.log('API button clicked');
                    showAPIConfig();
                });
            }
        }        

        // ============================================================================
        // CHART OPERATIONS
        // ============================================================================

        /**
         * Display historical exchange rate chart
         * @returns {Promise<void>}
         */

        async function showHistoricalChart() {
            // Check if user can access historical charts
            if (!premiumFeaturesManager.canAccessFeature('historicalCharts')) {
                premiumFeaturesManager.showPremiumModal('Historical Charts');
                return;
            }
            
            if (!countrySelectionManager.getHomeCountry() || !countrySelectionManager.getDestinationCountry()) {
                alert('Please select both home and destination countries first');
                return;
            }
            
            // Pre-populate overlays from destinations
            console.log('🎯 Pre-populating overlays from selected destinations...');
            
            // Clear existing overlays first
            activeOverlays = [];
            overlayCounter = 0;
            
            // Get the main destination for comparison
            const mainDestination = countrySelectionManager.getDestinationCountry();
            
            // Add overlays for each destination (except the main one)
            let overlaysAdded = 0;
            destinationCountries.forEach((dest, index) => {
                // Skip the main destination (already shown as primary line)
                if (dest.name !== mainDestination.name && overlaysAdded < 3) {
                    const currency = getCurrencyForCountry(dest.name);
                    if (currency) {
                        const color = overlayColors[overlayCounter % overlayColors.length];
                        overlayCounter++;
                        
                        activeOverlays.push({
                            currency: currency.code,
                            country: dest.name,
                            color: color,
                            visible: true, // Start as visible
                            data: null,
                            isFromDestinations: true
                        });
                        
                        overlaysAdded++;
                        console.log(`✅ Added overlay for ${dest.name} (${currency.code})`);
                    }
                }
            });
            
            console.log(`🎯 Pre-populated ${overlaysAdded} overlays from ${destinationCountries.length} destinations`);
            // ========== ADD THIS NEW SECTION - END ==========
            
            // ACTIVATE AND SHOW CHART CONTAINER
            const container = document.getElementById('chartContainer');
            if (container) {
                // Force display with important flags
                container.style.display = 'block !important';
                container.style.visibility = 'visible';
                container.style.opacity = '1';
                container.style.minHeight = '400px';
                container.classList.add('chart-active');
                
                // Ensure wrapper is visible
                const wrapper = container.querySelector('.chart-wrapper');
                if (wrapper) {
                    wrapper.style.display = 'block';
                    wrapper.style.minHeight = '300px';
                }
                
                // ACTIVATE AND SHOW CHART CONTAINER
                const container = document.getElementById('chartContainer');
                if (container) {
                    // Remove any conflicting inline styles first
                    container.style.removeProperty('display');
                    
                    // Force display with important
                    container.classList.add('chart-active');
                    container.setAttribute('style', 'display: block !important; visibility: visible !important; opacity: 1 !important; min-height: 400px !important;');
                    
                    // Ensure wrapper is visible
                    const wrapper = container.querySelector('.chart-wrapper');
                    if (wrapper) {
                        wrapper.style.display = 'block';
                        wrapper.style.minHeight = '300px';
                    }
                    
                    console.log('📊 Chart container activated:', {
                        display: getComputedStyle(container).display,
                        visibility: getComputedStyle(container).visibility,
                        height: container.offsetHeight,
                        hasClass: container.classList.contains('chart-active')
                    });
                }
            }
            
            // Update chart header with overlay controls
            const chartHeader = container.querySelector('.chart-header');
                if (chartHeader) {
                    chartHeader.innerHTML = `
                        <div style="margin-bottom: 20px;">
                            <!-- Header Row with Title and Close/Export buttons -->
                            <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px;">
                                <div>
                                    <h3 style="margin: 0 0 4px 0; font-size: 1.25rem; font-weight: 600; color: #202124;">
                                        📈 Historical Exchange Rate
                                    </h3>
                                    <p style="
                                        margin: 0;
                                        font-size: 0.8rem;
                                        color: #5f6368;
                                        font-weight: 400;
                                    ">Historical data for educational purposes only • Not investment advice</p>
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <button onclick="exportChart()" style="
                                        background: white;
                                        color: #5f6368;
                                        border: 1px solid #dadce0;
                                        border-radius: 6px;
                                        padding: 8px 14px;
                                        font-size: 0.875rem;
                                        font-weight: 500;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        gap: 6px;
                                        transition: all 0.2s;
                                        height: 36px;
                                    "
                                    onmouseover="this.style.background='#f8f9fa'"
                                    onmouseout="this.style.background='white'">
                                        📥 Export
                                    </button>
                                    <button class="close-chart-btn" onclick="hideChart()" style="
                                        width: 36px;
                                        height: 36px;
                                        border-radius: 6px;
                                        border: 1px solid #dadce0;
                                        background: white;
                                        color: #5f6368;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        cursor: pointer;
                                        font-size: 1.25rem;
                                        transition: all 0.2s;
                                    "
                                    onmouseover="this.style.background='#f8f9fa'"
                                    onmouseout="this.style.background='white'">✕</button>
                                </div>
                            </div>
                            
                            <!-- Controls Row -->
                            <div class="chart-controls" style="
                                display: flex;
                                align-items: center;
                                gap: 16px;
                                padding-top: 12px;
                                border-top: 1px solid #e8eaed;
                            ">
                                <!-- Time Period Buttons -->
                                <div class="timeframe-buttons" style="display: flex; gap: 4px;">
                                    <button class="timeframe-btn active" data-period="7">7D</button>
                                    <button class="timeframe-btn" data-period="30">1M</button>
                                    <button class="timeframe-btn" data-period="90">3M</button>
                                    <button class="timeframe-btn" data-period="365">1Y</button>
                                </div>
                                
                                ${premiumFeaturesManager.isPremium() ? `
                                    <!-- Divider -->
                                    <div style="width: 1px; height: 24px; background: #e8eaed;"></div>
                                    
                                    <!-- Technical Indicators -->
                                    <div class="indicator-controls" style="display: flex; gap: 8px; align-items: center;">
                                        <button onclick="toggleIndicator('sma')" class="indicator-btn" data-indicator="sma">📈 SMA</button>
                                        <button onclick="toggleIndicator('bollinger')" class="indicator-btn" data-indicator="bollinger">📊 Bollinger</button>
                                        <button onclick="toggleIndicator('rsi')" class="indicator-btn" data-indicator="rsi">⚡ RSI</button>
                                        <button onclick="toggleAIPredictions()" class="indicator-btn" data-indicator="trend" style="
                                            background: linear-gradient(45deg, #4285f4, #34a853); 
                                            color: white; 
                                            border: none; 
                                            font-weight: 600;
                                        ">📈 Trend Analysis</button>
                                    </div>

                                    <!-- Divider before overlay currencies -->
                                    <div style="width: 1px; height: 20px; background: #e0e0e0; margin: 0 8px;"></div>

                                    <!-- Overlay currencies will be inserted here by updateOverlayControls() -->

                                    <!-- Divider before Manage button -->
                                    <div style="width: 1px; height: 20px; background: #e0e0e0; margin: 0 8px;"></div>

                                    <!-- Manage Overlays Button (pushed to the right) -->
                                    <div style="margin-left: auto;">
                                        <button onclick="showDestinationOverlayPanel()" style="
                                            background: #34a853;
                                            color: white;
                                            border: none;
                                            border-radius: 6px;
                                            padding: 8px 14px;
                                            font-size: 0.875rem;
                                            font-weight: 500;
                                            cursor: pointer;
                                            transition: all 0.2s;
                                        "
                                        onmouseover="this.style.background='#2e7d32'"
                                        onmouseout="this.style.background='#34a853'">
                                            🎯 Manage Overlays
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                
                // Call updateOverlayControls after setting the header HTML
                setTimeout(() => {
                    updateOverlayControls();
                }, 100);
            }
            
            // Scroll to chart
            container.scrollIntoView({ behavior: 'smooth' });
            
            // Clear cache if needed
            if (window.apiManager) {
                console.log('🗑️ Clearing cache for fresh historical data...');
                window.apiManager.cache.clear();
            }
            
            // Load initial 7-day data
            await loadHistoricalData(7);
            
            // Show educational context for indicators
            showIndicatorEducationalInfo();
            // Subtle footer disclaimer to chart container
            const chartContainer = document.getElementById('chartContainer');
            if (chartContainer && !document.getElementById('chartDisclaimer')) {
                const disclaimer = document.createElement('div');
                disclaimer.id = 'chartDisclaimer';
                disclaimer.style.cssText = `
                    margin-top: 12px;
                    padding: 8px 0;
                    border-top: 1px solid #e8eaed;
                    font-size: 0.65rem;
                    color: #9aa0a6;
                    text-align: center;
                    font-style: italic;
                `;
                disclaimer.textContent = 'Market data for informational purposes. Not investment advice.';
                chartContainer.appendChild(disclaimer);
            }
        }

        function hideChart() {
            // Remove chart-active class and hide container
            const container = document.getElementById('chartContainer');
            if (container) {
                container.classList.remove('chart-active');
                container.style.display = 'none';
                console.log('📊 Chart container hidden, chart-active class removed');
            }
            
            // Call the UI manager's hide method
            if (chartUIManager) {
                chartUIManager.hideChart();
            }
        }

        // PROGRESS SYSTEM FUNCTIONS
        function updateProgress(current, total, batchNumber = null, eta = null) {
            // Check if progressManager exists and has the method
            if (window.progressManager && typeof window.progressManager.createProgressBar === 'function') {
                const message = batchNumber 
                    ? `Processing batch ${batchNumber}... Getting real exchange rates`
                    : `Loading ${current}/${total} historical rates...`;
                
                const percentage = (current / total) * 100;
                
                // Create or update progress
                if (!window.currentProgressId) {
                    window.currentProgressId = window.progressManager.createProgressBar('chartContainer', message);
                }
                
                window.progressManager.updateProgress(window.currentProgressId, percentage, message);
                
                if (current >= total) {
                    window.progressManager.completeProgress(window.currentProgressId);
                    window.currentProgressId = null;
                }
            } else {
                // Fallback to basic progress display
                console.log(`Progress: ${current}/${total} (${((current/total) * 100).toFixed(0)}%)`);
                
                // Try to update DOM elements directly as fallback
                const progressBar = document.getElementById('progressBar');
                const progressText = document.getElementById('progressText');
                
                if (progressBar) {
                    const percentage = Math.round((current / total) * 100);
                    progressBar.style.width = `${percentage}%`;
                }
                
                if (progressText) {
                    if (batchNumber) {
                        progressText.textContent = `Processing batch ${batchNumber}... Getting real exchange rates`;
                    } else {
                        progressText.textContent = `Loading ${current}/${total} historical rates...`;
                    }
                }
            }
        }
        
        function addExistingOverlaysToChart(homeCurrency) {
            // Check if chart exists and is ready
            if (!currentChart) {
                console.log('⚠️ No chart available for adding overlays');
                return;
            }
            
            // Make sure the chart is fully initialized
            if (!currentChart.data || !currentChart.data.datasets) {
                console.log('⚠️ Chart not fully initialized yet');
                return;
            }
            
            // Get the main currency pair data for normalization
            const mainData = currentChart.data.datasets[0]?.data;
            if (!mainData || mainData.length === 0) {
                console.log('⚠️ No main data available for normalization');
                return;
            }
            
            const firstMainRate = mainData[0];
            
            activeOverlays.forEach((overlay, index) => {
            if (overlay.data && overlay.visible) {
                console.log(`➕ Re-adding overlay: ${overlay.currency} with color ${overlay.color}`);
                
                try {
                    // NO NORMALIZATION - USE ACTUAL RATES
                    const actualRates = overlay.data.map(item => item.rate);
                    
                    currentChart.data.datasets.push({
                        label: `${homeCurrency.code} to ${overlay.currency}`,
                        data: actualRates, // ACTUAL RATES, NOT NORMALIZED
                        borderColor: overlay.color,
                        backgroundColor: 'transparent',
                        borderWidth: 2, // Reduced from 3
                        fill: false,
                        tension: 0.2, // Reduced from 0.3
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointBackgroundColor: overlay.color,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2
                    });
                    
                    console.log(`✅ Added overlay ${overlay.currency}: First=${actualRates[0]}, Last=${actualRates[actualRates.length-1]}`);
                } catch (error) {
                    console.error(`❌ Error adding overlay ${overlay.currency}:`, error);
                }
            }
        });
            
            // Only update if chart still exists
            if (currentChart && currentChart.update) {
                currentChart.update();
                console.log(`✅ Chart now has ${currentChart.data.datasets.length} total datasets`);
            }
        }

        // OVERLAY TIMEFRAME 
        async function loadHistoricalData(days) {
            console.log('🚨 loadHistoricalData called - this will RECREATE the chart!');
            console.log('Current overlays before reload:', activeOverlays.map(o => o.currency));
            
            const homeCurrency = getCurrencyForCountry(homeCountry.name);
            const destCurrency = getCurrencyForCountry(destinationCountry.name);
            
            if (!homeCurrency || !destCurrency) {
                console.error('Currency information not available');
                showChartError('Currency information not available');
                return;
            }
            
            try {
                showChartLoading();

                // Ensure container stays visible and active during loading
                const container = document.getElementById('chartContainer');
                if (container && !container.classList.contains('chart-active')) {
                    container.classList.add('chart-active');
                    container.style.display = 'block';
                }
                
                // Show which timeframe is loading
                const progressText = document.getElementById('progressText');
                if (progressText) {
                    progressText.textContent = `Loading ${days} days of real exchange rate data...`;
                }
                
                console.log(`🔄 Loading ${days} days of ${homeCurrency.code} to ${destCurrency.code} data...`);               
                
                // Load main currency pair data
                const historicalData = await fetchRealHistoricalData(homeCurrency, destCurrency, days);
                
                if (!historicalData || historicalData.length === 0) {
                    throw new Error('No historical data available');
                }
                
                console.log(`📈 Main data loaded: ${historicalData.length} points`);
                
                // Load overlay data for the new timeframe
                console.log(`🔄 Loading overlay data for ${activeOverlays.length} overlays...`);
                
                const overlayPromises = activeOverlays.map(async overlay => {
                    try {
                        const overlayData = await fetchRealHistoricalData(
                            homeCurrency, 
                            { code: overlay.currency, ...currencySymbols[overlay.currency] }, 
                            days
                        );
                        return {
                            ...overlay,
                            data: overlayData,
                            error: null
                        };
                    } catch (error) {
                        console.warn(`Failed to reload ${overlay.currency} for ${days}D:`, error);
                        return {
                            ...overlay,
                            data: null,
                            error: error.message
                        };
                    }
                });
                
                const overlayDatasets = await Promise.all(overlayPromises);
                
                // Update overlay data in activeOverlays array
                overlayDatasets.forEach((newOverlay) => {
                    const existingOverlay = activeOverlays.find(o => o.currency === newOverlay.currency);
                    if (existingOverlay) {
                        existingOverlay.data = newOverlay.data;
                        existingOverlay.error = newOverlay.error;
                        console.log(`✅ Updated data for overlay ${existingOverlay.currency}: ${existingOverlay.data?.length} points`);
                    }
                });
                
                // Update chart with main data
                updateChart(historicalData, homeCurrency, destCurrency, days);
                
                // Add overlay datasets to the chart (only if chart was recreated)
                // Add overlay datasets to the chart
                if (currentChart && activeOverlays.length > 0) {
                    console.log(`📊 Checking for overlays to add...`);
                    console.log(`Current datasets: ${currentChart.data.datasets.length}`);
                    
                    // Remove any existing overlay datasets (keep only the main one)
                    currentChart.data.datasets = currentChart.data.datasets.filter((dataset, index) => {
                        // Keep the first dataset (main currency pair)
                        if (index === 0) return true;
                        // Remove any normalized overlays (they'll be re-added)
                        if (dataset.label && dataset.label.includes('(normalized)')) {
                            console.log(`Removing old overlay: ${dataset.label}`);
                            return false;
                        }
                        return true;
                    });
                    
                    console.log(`After cleanup, datasets: ${currentChart.data.datasets.length}`);
                    
                    // Get the main currency pair data for normalization
                    const mainData = currentChart.data.datasets[0].data;
                    const firstMainRate = mainData[0];
                    
                    // Now add all active overlays
                    activeOverlays.forEach((overlay, index) => {
                        if (overlay.data && overlay.visible) {
                            console.log(`🔍 Adding Overlay ${index + 1}:`);
                            console.log('- Currency:', overlay.currency);
                            console.log('- Data length:', overlay.data.length);
                            console.log('- First rate:', overlay.data[0]?.rate);
                            console.log('- Last rate:', overlay.data[overlay.data.length - 1]?.rate);
                            
                            // ADD THE MISSING VARIABLE
                            const firstOverlayRate = overlay.data[0].rate;
                            
                            // USE ACTUAL RATES - NO NORMALIZATION FOR PROFESSIONAL TOOL
                            const actualData = overlay.data.map(item => item.rate);
                            
                            console.log(`Adding overlay ${index + 1}: ${overlay.currency} with color ${overlay.color}`);
                            console.log('- First actual rate:', actualData[0]);
                            console.log('- Last actual rate:', actualData[actualData.length - 1]);
                            
                            // Create the dataset with REAL rates
                            const overlayDataset = {
                                label: `${homeCurrency.code} to ${overlay.currency}`,  // REMOVED "(normalized)"
                                data: actualData,  // USE ACTUAL DATA, NOT NORMALIZED
                                borderColor: overlay.color,
                                backgroundColor: 'transparent',  // Changed from overlay.color + '33'
                                borderWidth: 2,
                                fill: false,
                                tension: 0.3,
                                pointRadius: 0,
                                pointHoverRadius: 6,
                                pointBackgroundColor: overlay.color,
                                pointBorderColor: '#ffffff',
                                pointBorderWidth: 2,
                                hidden: false
                            };
                            
                            currentChart.data.datasets.push(overlayDataset);
                            
                            console.log('✅ Overlay added to chart');
                            console.log('Dataset added:', overlayDataset.label);
                            console.log('Total datasets now:', currentChart.data.datasets.length);
                        } else {
                            console.warn(`Overlay ${overlay.currency} has no data or is hidden`);
                        }
                    });
                    
                    console.log(`Chart now has ${currentChart.data.datasets.length} total datasets`);
                    
                    // IMPORTANT: Update the chart after adding all overlays
                    currentChart.update('none');  // Use 'none' for immediate update without animation
                } else if (currentChart && currentChart.data.datasets.length > 1) {
                    console.log(`📊 Chart already has overlays (${currentChart.data.datasets.length} datasets) - skipping addition`);
                }
                
                // Update active timeframe button
                updateActiveTimeframe(days);
                
                // Refresh overlay controls (in case of errors)
                updateOverlayControls();
                
                // Update API status
                showAPIStatus();
                
                console.log(`✅ Chart updated with main data + ${activeOverlays.filter(o => o.data && o.visible).length} overlays`);
                
            } catch (error) {
                handleError(error, 'Historical Data Loading');
                showChartError(`Failed to load historical data: ${error.message}`);
            }
        }

        

        /**
        * API Configuration
        * @private
        */
        let EXCHANGERATE_HOST_API_KEY = null;

        /**
         * Initialize API key from centralized config module
         * No hardcoded keys - all keys stored in apiConfigManager
         * @private
         */
        function initializeAPIKey() {
            let source = 'not initialized';
            
            // Initialize apiConfigManager if needed
            if (window.apiConfigManager && !window.apiConfigManager.isInitialized) {
                window.apiConfigManager.init();
            }
            
            // Check if we're in production mode (using proxy)
            const isProduction = window.apiConfigManager && window.apiConfigManager.isProduction;
            
            if (isProduction) {
                // Production mode - no API key needed, proxy handles authentication
                console.info('✅ Running in PRODUCTION mode with secure proxy');
                console.info('🔐 API authentication handled by Vercel proxy');
                source = 'Proxy Authentication';
                EXCHANGERATE_HOST_API_KEY = 'PROXY'; // Set a placeholder value
                
                // Optional: Show a success notification
                if (window.notificationManager) {
                    window.notificationManager.showSuccess('Connected to secure proxy server');
                }
            } else {
                // Development mode - need API key for direct access
                console.info('🔧 Running in DEVELOPMENT mode');
                
                // Get API key from the centralized module
                if (window.apiConfigManager && typeof window.apiConfigManager.getAPIKey === 'function') {
                    EXCHANGERATE_HOST_API_KEY = window.apiConfigManager.getAPIKey('exchangeratehost');
                    source = 'apiConfigManager.getAPIKey()';
                    
                    if (!EXCHANGERATE_HOST_API_KEY) {
                        console.warn('⚠️ No API key found for local development');
                        console.info('💡 Add the key to apiConfigManager.providers.exchangeratehost.apiKey');
                        console.info('💡 Or set it in localStorage: localStorage.setItem("exchangeRateApiKey", "your-key")');
                        
                        // Show user-friendly message for development
                        if (window.notificationManager) {
                            window.notificationManager.showWarning('API key needed for local development. Some features may be limited.');
                        }
                    }
                } else {
                    console.error('❌ apiConfigManager not available or getAPIKey method missing');
                }
            }
            
            // Log status (not the actual key!)
            console.info(`✅ API Key initialization: ${source}`);
            console.info(`📝 Status: ${EXCHANGERATE_HOST_API_KEY ? (isProduction ? 'Proxy Active' : 'Key Loaded') : '⚠️ Missing - API calls may fail'}`);
            
            if (DEBUG && DEBUG.enabled && !isProduction) {
                // Only show key details in development mode
                DEBUG.log(`API Key last 4 chars: ...${EXCHANGERATE_HOST_API_KEY?.slice(-4)}`);
            }
            
            return EXCHANGERATE_HOST_API_KEY;
        }

        // API Manager now in historicalDataManager module
        window.apiManager = historicalDataManager.apiManager;
        const apiManager = window.apiManager;

        async function fetchRealHistoricalData(homeCurrency, destCurrency, days) {
            // Initialize the manager with progress callback
            historicalDataManager.initialize((action, ...args) => {
                if (action === 'start') {
                    startProgress(args[0]);
                } else if (action === 'update') {
                    updateProgress(args[0], args[1], args[2]);
                } else if (action === 'finish') {
                    finishProgress();
                }
            });

            // Initialize Mathematical Analysis with historicalDataManager
            aiPredictions.initialize(historicalDataManager);
            
            // Use the manager to fetch data
            return await historicalDataManager.fetchRealHistoricalData(homeCurrency, destCurrency, days);
        }

        // Preload all timeframes for instant switching
        async function preloadAllTimeframes() {
            if (!homeCountry || !destinationCountry) return;
            
            const homeCurrency = getCurrencyForCountry(homeCountry.name);
            const destCurrency = getCurrencyForCountry(destinationCountry.name);
            
            console.log('🚀 Starting background preload of all timeframes...');
            
            // All timeframes to preload
            const timeframes = [
                { days: 7, priority: 1 },   // 1W - highest priority
                { days: 30, priority: 2 },  // 1M
                { days: 365, priority: 3 }, // 1Y
                { days: 90, priority: 4 },  // 3M
                //{ days: 180, priority: 5 }, // 6M
                //{ days: 730, priority: 6 }, // 2Y
                //{ days: 1825, priority: 7 } // 5Y
            ];
            
            // Sort by priority
            timeframes.sort((a, b) => a.priority - b.priority);
            
            // Load each timeframe with staggered timing
            for (const { days, priority } of timeframes) {
                setTimeout(async () => {
                    // Check if already cached
                    const cached = window.chartCache.get(
                        homeCurrency.code, 
                        destCurrency.code, 
                        days
                    );
                    
                    if (cached) {
                        console.log(`✅ ${days}D already cached`);
                        return;
                    }
                    
                    try {
                        // Fetch real data
                        const data = await fetchRealHistoricalData(
                            homeCurrency, 
                            destCurrency, 
                            days
                        );
                        
                        // Store in cache
                        window.chartCache.set(
                            homeCurrency.code,
                            destCurrency.code,
                            days,
                            data
                        );
                        
                        console.log(`✅ Pre-cached ${days}D chart`);
                    } catch (error) {
                        console.warn(`Failed to pre-cache ${days}D:`, error);
                    }
                }, priority * 200); // Stagger by 200ms per priority level
            }
        }

        function isWeekend(date) {
            const day = date.getDay();
            return day === 0 || day === 6;
        }

        function updateChart(data, homeCurrency, destCurrency, days) {
            // Use the chart manager
            chartManager.createChart(data, homeCurrency, destCurrency, days);
            
            // Wait for chart to be created
            setTimeout(() => {
                // Update local references for compatibility
                currentChart = chartManager.getChart();
                currentHistoricalData = chartManager.getHistoricalData();
                
                DEBUG.log('📊 Chart Update Debug:');
                DEBUG.log('- currentChart exists:', !!currentChart);
                DEBUG.log('- currentHistoricalData exists:', !!currentHistoricalData);
                DEBUG.log('- Historical data length:', currentHistoricalData?.length);
                
                // Re-add overlays if they exist
                if (activeOverlays && activeOverlays.length > 0) {
                    DEBUG.log(`🔄 Re-adding ${activeOverlays.length} overlays to new chart...`);
                    setTimeout(() => {
                        addExistingOverlaysToChart(homeCurrency);
                    }, 50);
                }
                
                // Update active timeframe button
                updateActiveTimeframe(days);
                
                // Update overlay controls
                updateOverlayControls();
                
                // Show API status
                showAPIStatus();
            }, 150);
        }

        function updateChartStats(highest, lowest, change, destCurrency) {
            document.getElementById('chartHighest').textContent = `${highest.toFixed(6)} ${destCurrency.code}`;
            document.getElementById('chartLowest').textContent = `${lowest.toFixed(6)} ${destCurrency.code}`;
            
            const changeEl = document.getElementById('chartChange');
            const changeText = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
            changeEl.textContent = changeText;
            changeEl.style.color = change >= 0 ? '#137333' : '#d93025';
            
            // Update data source disclaimer
            const disclaimerEl = document.getElementById('dataSourceText');
            if (disclaimerEl) {
                const totalAPIUsage = Object.values(apiConfigManager.usage).reduce((sum, usage) => sum + usage.used, 0);
                
                if (totalAPIUsage > 0) {
                    disclaimerEl.textContent = `Real current rates used. Historical data simulated due to API limitations.`;
                    document.getElementById('dataSourceDisclaimer').style.background = '#d1ecf1';
                    document.getElementById('dataSourceDisclaimer').style.borderColor = '#bee5eb';
                    document.getElementById('dataSourceDisclaimer').style.color = '#0c5460';
                } else {
                    disclaimerEl.textContent = `Sample data for demonstration. Configure API keys for real rates.`;
                }
            }
        }
        
        function updateActiveTimeframe(days) {
            document.querySelectorAll('.timeframe-btn').forEach(btn => {
                btn.classList.remove('active');
                if (parseInt(btn.dataset.period) === days) {
                    btn.classList.add('active');
                }
            });
        }

        function showChartLoading() {
            if (window.notificationManager) {
                notificationManager.showChartLoading();
            } else {
                chartManager.showChartLoading();
                // Also use UIManager if available
                //if (window.uiManager) {
                //    uiManager.showLoading('chartContainer');
                //}
            }
        }

        function startProgress(total) {
            window.progressStartTime = Date.now();
            
            // Reset any existing progress
            window.currentProgressId = null;
            
            // Try to create progress bar if manager exists
            if (window.progressManager && typeof window.progressManager.createProgressBar === 'function') {
                window.currentProgressId = window.progressManager.createProgressBar(
                    'chartContainer', 
                    `Starting to load ${total} data points...`
                );
            }
            
            // Also update using the regular function
            updateProgress(0, total);
        }

        function finishProgress() {
            // Complete progress if manager exists
            if (window.currentProgressId && window.progressManager && window.progressManager.completeProgress) {
                window.progressManager.completeProgress(window.currentProgressId);
                window.currentProgressId = null;
            }
            
            // Fallback DOM updates
            const progressBar = document.getElementById('progressBar');
            const progressText = document.getElementById('progressText');
            const progressStats = document.getElementById('progressStats');
            const progressETA = document.getElementById('progressETA');
            
            if (progressBar) progressBar.style.width = '100%';
            if (progressText) progressText.textContent = 'Processing data for chart...';
            if (progressStats) progressStats.textContent = '100% complete';
            if (progressETA) progressETA.textContent = 'Almost done!';
            // Clean up any chart loading notifications
            if (window.notificationManager) {
                window.notificationManager.hideProcessing('chart-loading');
            }
        }

        function showChartError(message) {
            if (window.notificationManager) {
                notificationManager.showChartError(message);
            } else {
                chartManager.showChartError(message);
            }
        }
        

        function selectCountryByName(countryName, type, providedFeature = null) {
            countrySelectionManager.selectCountryByName(countryName, type, providedFeature);
            
            // Force update compact display after selection
            setTimeout(() => {
                updateCompactDisplay();
                
                // FORCE CALCULATION when both countries are selected
                if (homeCountry && destinationCountry) {
                    // Get the current amount value
                    const amount = parseFloat(document.getElementById('compactAmount')?.value) || 1;
                    
                    // Trigger exchange rate fetch and calculation
                    updateMultipleExchangeRates().then(() => {
                        // Update the display with the calculated value
                        updateCompactDisplay();
                        
                        // Also trigger the green field to show result
                        const compactResult = document.getElementById('compactResult');
                        if (compactResult) {
                            const homeCurrency = getCurrencyForCountry(homeCountry.name);
                            const destCurrency = getCurrencyForCountry(destinationCountry.name);
                            
                            if (homeCurrency && destCurrency) {
                                // Get the exchange rate
                                const currentRates = exchangeRateManager.getCurrentRates();
                                if (currentRates && currentRates[destCurrency.code]) {
                                    const rate = currentRates[destCurrency.code];
                                    const result = (amount * rate).toFixed(2);
                                    compactResult.textContent = `${result} ${destCurrency.symbol}`;
                                    
                                    // Make the result field pulse to show it updated
                                    compactResult.style.animation = 'pulse 0.5s';
                                    setTimeout(() => {
                                        compactResult.style.animation = '';
                                    }, 500);
                                }
                            }
                        }
                    }); 
                    
                    // Also update via UIManager if available
                    if (window.uiManager) {
                        const homeCurrency = getCurrencyForCountry(homeCountry.name);
                        const destCurrency = getCurrencyForCountry(destinationCountry.name);
                        if (homeCurrency && destCurrency) {
                            uiManager.updateCurrencyDisplay(homeCurrency.code, destCurrency.code);
                        }
                    }
                    
                    // ========== ADD PRELOAD TRIGGER HERE ==========
                    // Start preloading chart data for instant switching
                    const homeCurrency = getCurrencyForCountry(homeCountry.name);
                    const destCurrency = getCurrencyForCountry(destinationCountry.name);
                    
                    if (homeCurrency && destCurrency) {
                        // Check if we need to preload for this currency pair
                        const pairKey = `${homeCurrency.code}_${destCurrency.code}`;
                        
                        if (!window.preloadedPairs || window.preloadedPairs !== pairKey) {
                            window.preloadedPairs = pairKey;
                            
                            // Delay preload to not interfere with initial calculations
                            setTimeout(() => {
                                console.log(`🚀 Starting background preload for ${pairKey}`);
                                
                                // Preload main timeframes
                                if (typeof preloadAllTimeframes === 'function') {
                                    preloadAllTimeframes();
                                }
                                
                                // Also preload common overlay currencies
                                if (typeof preloadOverlayCurrencies === 'function') {
                                    preloadOverlayCurrencies();
                                }
                            }, 2000); // 2 second delay to let all initial updates complete
                        }
                    }
                    // ========== END OF PRELOAD TRIGGER ==========
                } 
            }, 100); 
        }
        
        async function updateMultipleExchangeRates() {
            console.log('🔍 updateMultipleExchangeRates called');
            console.log('- homeCountry:', homeCountry || window.homeCountry);
            console.log('- destinationCountries:', destinationCountries || window.destinationCountries);
            console.log('- number of destinations:', (destinationCountries || window.destinationCountries || []).length);
            
            // Use window variables if local ones are not set
            const actualHome = homeCountry || window.homeCountry;
            const actualDestinations = destinationCountries || window.destinationCountries || [];
            
            if (!actualHome || actualDestinations.length === 0) {
                console.log('❌ Missing home or destinations');
                return;
            }
            
            try {
                hideError();
                
                const homeCurrency = getCurrencyForCountry(actualHome.name);
                if (!homeCurrency) {
                    showError('Currency information not available for home country');
                    return;
                }
                
                console.log(`Fetching exchange rates from ${homeCurrency.code} for ${actualDestinations.length} destinations`);
                
                // Use the ExchangeRateManager
                await exchangeRateManager.fetchExchangeRates(homeCurrency);
                
                // Calculate conversions for ALL destinations
                const conversions = exchangeRateManager.calculateConversions(
                    actualDestinations,  // Make sure we're using ALL destinations
                    homeCurrency, 
                    getCurrencyForCountry
                );

                console.log('📊 Conversions calculated:', conversions);
                console.log('📊 Number of conversions:', conversions.length);
                
                // Update other displays
                updateDestinationsList();
                updateCompactDisplay();
                
            } catch (error) {
                console.error('Exchange rate error:', error);
                showError(`Failed to get exchange rates: ${error.message}`);
            }
        }

        function showExchangeRate(rate, homeCurrency, destCurrency, homeCountryName, destCountryName, amount = null) {
            const resultDiv = document.getElementById('exchangeResult');
            const rateDisplay = document.getElementById('rateDisplay');
            const rateDetails = document.getElementById('rateDetails');
            const fromAmount = document.getElementById('fromAmount');
            const toAmount = document.getElementById('toAmount');
            const fromCurrency = document.getElementById('fromCurrency');
            const toCurrency = document.getElementById('toCurrency');
            
            if (amount === null) {
                amount = parseFloat(document.getElementById('globalAmount')?.value) || 1;
            }
            
            exchangeRateManager.setCurrentRate(rate);
            
            fromCurrency.textContent = homeCurrency.code;
            toCurrency.textContent = destCurrency.code;
            
            if (fromAmount) {
                fromAmount.value = amount;
                fromAmount.style.display = 'none';
            }
            
            const convertedAmount = (amount * rate).toFixed(2);
            toAmount.textContent = convertedAmount;
            
            const formattedRate = rate === 1 ? '1.0000' : rate.toFixed(4);
            rateDisplay.textContent = `1 ${homeCurrency.symbol} ${homeCurrency.code} = ${formattedRate} ${destCurrency.symbol} ${destCurrency.code}`;
            rateDetails.textContent = `${homeCountryName} → ${destCountryName} | Updated: ${new Date().toLocaleTimeString()}`;
            
            const swapBtn = document.getElementById('swapBtn');
            if (swapBtn) {
                swapBtn.onclick = function() {
                    console.log('Swapping currencies...');
                    swapCountries();
                };
            }
            
            resultDiv.style.display = 'block';
        }

        function hideExchangeRate() {
            const exchangeResult = document.getElementById('exchangeResult');
            if (exchangeResult) {
                exchangeResult.style.display = 'none';
            }
            const existingResults = document.getElementById('multipleResults');
            if (existingResults) {
                existingResults.remove();
            }
        }

        function swapCountries() {
            countrySelectionManager.swapCountries();
            
            // Force refresh of the destinations list after swap to remove self-conversions
            setTimeout(() => {
                if (window.updateDestinationsList) {
                    window.updateDestinationsList();
                }
            }, 100);
        }

        function showMultipleExchangeRates(conversions, homeCurrency) {            
            const amount = parseFloat(document.getElementById('globalAmount')?.value) || 1;
            
            // Hide single result display
            document.getElementById('exchangeResult').style.display = 'none';
            
            // Remove existing results
            const existingResults = document.getElementById('multipleResults');
            if (existingResults) {
                existingResults.remove();
            }
            
            // Create new results container
            const resultsDiv = document.createElement('div');
            resultsDiv.id = 'multipleResults';
            resultsDiv.className = 'multiple-results';
            
            // Build HTML for ALL conversions
            const conversionCards = conversions.map(conv => `
                <div class="conversion-card" style="
                    background: white;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 1.5rem;">${getCountryFlag(conv.country)}</span>
                        <div>
                            <div style="font-weight: 600; color: #1a73e8;">
                                ${conv.country}
                            </div>
                            <div style="color: #5f6368; font-size: 0.875rem;">
                                ${conv.currency.name}
                            </div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.5rem; font-weight: 600; color: #137333;">
                            ${(amount * conv.rate).toFixed(2)} ${conv.currency.symbol}
                        </div>
                        <div style="color: #5f6368; font-size: 0.75rem;">
                            1 ${homeCurrency.code} = ${conv.rate.toFixed(4)} ${conv.currency.code}
                        </div>
                    </div>
                </div>
            `).join('');
            
            resultsDiv.innerHTML = `
                <div class="results-header" style="
                    text-align: center;
                    margin-bottom: 24px;
                    padding: 20px;
                    background: linear-gradient(135deg, #f8f9fa, #e8f0fe);
                    border-radius: 12px;
                ">
                    <h3 style="margin: 0 0 8px 0; font-size: 1.25rem;">
                        💱 Converting ${amount} ${homeCurrency.symbol} ${homeCurrency.code}
                    </h3>
                    <p style="margin: 0; color: #5f6368;">
                        From ${homeCountry.name} to ${conversions.length} destination${conversions.length > 1 ? 's' : ''} | Updated: ${new Date().toLocaleTimeString()}
                    </p>
                </div>
                
                <div class="conversion-cards-container">
                    ${conversionCards}
                </div>
                
                <div style="text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                    <button onclick="showHistoricalChart()" style="
                        background: #1a73e8;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        padding: 12px 20px;
                        font-size: 0.875rem;
                        font-weight: 500;
                        cursor: pointer;
                        margin-right: 12px;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                    ">📈 Show Historical Chart</button>
                    
                    <button onclick="showAPIConfig()" style="
                        background: white;
                        color: #137333;
                        border: 2px solid #137333;
                        border-radius: 8px;
                        padding: 12px 20px;
                        font-size: 0.875rem;
                        font-weight: 500;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                    ">🔧 API Settings</button>
                </div>
            `;
            
            // Find where to insert the results
            const destList = document.getElementById('destinationsList');
            if (destList && destList.parentNode) {
                // Insert after the buttons div
                const buttonsDiv = destList.nextElementSibling;
                if (buttonsDiv && buttonsDiv.nextElementSibling) {
                    buttonsDiv.parentNode.insertBefore(resultsDiv, buttonsDiv.nextElementSibling);
                } else if (buttonsDiv) {
                    buttonsDiv.parentNode.appendChild(resultsDiv);
                } else {
                    destList.parentNode.appendChild(resultsDiv);
                }
            } else {
                // Fallback: insert after the map
                const mapContainer = document.querySelector('.map-container-primary');
                if (mapContainer) {
                    mapContainer.appendChild(resultsDiv);
                }
            }
            
            console.log('✅ Created conversion cards for', conversions.length, 'destinations');
        }

        function updateAddDestinationButton() {
            console.log('🔍 updateAddDestinationButton called');
            
            // ALWAYS use window scope to avoid closure issues
            const actualHomeCountry = window.homeCountry;
            const actualDestCountries = window.destinationCountries || [];
            
            console.log('- window.homeCountry:', window.homeCountry);
            console.log('- window.destinationCountries:', window.destinationCountries);
            
            const addBtn = document.getElementById('addDestinationBtn');
            const clearAllBtn = document.getElementById('resetAllBtn');
            const countSpan = document.getElementById('destinationCount');
            
            if (!addBtn || !clearAllBtn) {
                console.error('Buttons not found in DOM');
                return;
            }
            
            // Update max destinations based on premium status
            const maxDestinations = premiumFeaturesManager.getMaxDestinations();
            
            if (actualHomeCountry && actualHomeCountry.name) {
                console.log('✅ Home country found, showing buttons');
                addBtn.style.display = 'inline-flex';
                
                const currentCount = actualDestCountries.length;
                
                if (countSpan) {
                    countSpan.textContent = `(${currentCount}/${maxDestinations})`;
                }
                
                if (currentCount >= maxDestinations) {
                    addBtn.disabled = true;
                    if (maxDestinations === 5) {
                        addBtn.innerHTML = '✅ Maximum 5 Destinations <span id="destinationCount">(5/5)</span>';
                    } else {
                        addBtn.innerHTML = `⭐ Upgrade for More <span id="destinationCount">(${currentCount}/${maxDestinations})</span>`;
                        addBtn.onclick = () => {
                            if (window.premiumFeaturesManager.showPremiumModal) {
                                window.premiumFeaturesManager.showPremiumModal('Additional Destinations');
                            }
                        };
                    }
                } else {
                    addBtn.disabled = false;
                    addBtn.innerHTML = `➕ Add Another Destination <span id="destinationCount">(${currentCount}/${maxDestinations})</span>`;
                    addBtn.onclick = () => {
                        if (window.mapInteractionManager) {
                            window.mapInteractionManager.handleAddDestinationClick();
                        } else if (actualDestCountries.length < maxDestinations) {
                            // Fallback to old method
                            if (window.mapManager) {
                                window.mapManager.enterAddingMode();
                            }
                        } else {
                            if (window.premiumFeaturesManager.showPremiumModal) {
                                window.premiumFeaturesManager.showPremiumModal('Additional Destinations');
                            }
                        }
                    };
                }

                // Show clear button if there are destinations or home country
                if (currentCount > 0 || actualHomeCountry) {
                    clearAllBtn.style.display = 'inline-flex';
                    clearAllBtn.onclick = () => {
                        if (window.clearAll) {
                            window.clearAll();
                        }
                    };
                } else {
                    clearAllBtn.style.display = 'none';
                }
            } else {
                console.log('❌ No home country in window scope, hiding buttons');
                addBtn.style.display = 'none';
                clearAllBtn.style.display = 'none';
            }
        }

        // Re-export to window to ensure the new version is used
        window.updateAddDestinationButton = updateAddDestinationButton;

        function showAmountController() {
            const amountController = document.getElementById('amountController');
            if (amountController) {
                if (homeCountry && (destinationCountry || destinationCountries.length > 0)) {
                    amountController.style.display = 'block';
                    
                    // Trigger initial conversion calculation
                    setTimeout(() => {
                        updateAllConversions();
                        updateCompactDisplay();
                    }, 100);
                } else {
                    amountController.style.display = 'none';
                }
            }
        }

        function updateAllConversions() {
            if (homeCountry && destinationCountries.length > 0) {
                updateMultipleExchangeRates();
            }
        }

        function clearAll() {
            countrySelectionManager.clearAll();
        }

        function updateSwapButtonVisibility() {
            // Update both swap buttons (old dropdown and new compact)
            const swapBtnDropdown = document.getElementById('swapBtnDropdown');
            const swapBtnCompact = document.getElementById('swapBtnCompact');
            
            const shouldShow = homeCountry && destinationCountry;
            
            if (swapBtnDropdown) {
                swapBtnDropdown.style.display = shouldShow ? 'flex' : 'none';
            }
            
            if (swapBtnCompact) {
                swapBtnCompact.style.display = shouldShow ? 'flex' : 'none';
            }
        }
        function updateCompactDisplay() {
            const compactResult = document.getElementById('compactResult');
            const compactAmount = document.getElementById('compactAmount');
            
            if (!compactResult) return;
            
            // Debug logging
            console.log('📊 updateCompactDisplay called');
            console.log('- homeCountry:', homeCountry);
            console.log('- destinationCountry:', destinationCountry);
            
            // Use globals directly since they're being synced
            if (!homeCountry || !destinationCountry) {
                compactResult.textContent = 'Select currencies';
                return;
            }
            
            // Ensure amount field has a value
            if (compactAmount && !compactAmount.value) {
                compactAmount.value = '1';
            }
            
            const amount = parseFloat(compactAmount?.value) || 1;
            const currentRates = exchangeRateManager.getCurrentRates() || window.currentExchangeRates;
            
            console.log('- currentRates available:', !!currentRates);
            
            if (currentRates) {
                const homeCurrency = getCurrencyForCountry(homeCountry.name);
                const destCurrency = getCurrencyForCountry(destinationCountry.name);
                
                if (homeCurrency && destCurrency) {
                    const rate = currentRates[destCurrency.code];
                    console.log(`- Rate for ${destCurrency.code}:`, rate);
                    
                    if (rate !== null && rate !== undefined) {
                        const result = (amount * rate).toFixed(2);
                        compactResult.textContent = `${result} ${destCurrency.symbol}`;
                        console.log(`✅ Display updated: ${result} ${destCurrency.symbol}`);
                    } else {
                        // Rate not in cache, fetch it
                        compactResult.textContent = 'Calculating...';
                        console.log('⏳ Rate not in cache, fetching...');
                        updateMultipleExchangeRates();
                    }
                }
            } else {
                // No rates yet, trigger fetch
                compactResult.textContent = 'Loading...';
                console.log('⏳ No rates available, fetching...');
                updateMultipleExchangeRates();
            }
        }

        function updateCompactDisplayWithConversion(conversion, homeCurrency, amount) {
            const compactResult = document.getElementById('compactResult');
            if (!compactResult) return;
            
            const result = (amount * conversion.rate).toFixed(2);
            compactResult.textContent = `${result} ${conversion.currency.symbol}`;
        }        

        function addDestination(countryName) {
            countrySelectionManager.addDestination(countryName);
        }

        function removeDestination(countryName) {
            console.log('🗑️ Removing destination:', countryName);
            
            // Call the country selection manager to handle the removal
            countrySelectionManager.removeDestination(countryName);
            
            // The manager already updates these, but let's ensure sync
            destinationCountries = countrySelectionManager.getDestinationCountries();
            window.destinationCountries = destinationCountries;
            
            // Force UI updates (the manager should do this, but let's be sure)
            setTimeout(() => {
                updateDestinationsList();
                updateAddDestinationButton();
                
                // Update exchange rates if we still have destinations
                if (destinationCountries.length > 0 && homeCountry) {
                    updateMultipleExchangeRates();
                }
            }, 100);
            
            console.log('✅ Destination removed, remaining:', destinationCountries.length);
        }

        // Make sure it's globally accessible
        window.removeDestination = removeDestination;

        function updateDestinationsList() {
            const listContainer = document.getElementById('destinationsList');
            listContainer.innerHTML = '';
            
            // Remove redundant displays
            const existingResults = document.getElementById('multipleResults');
            if (existingResults) existingResults.remove();
            
            const amount = parseFloat(document.getElementById('globalAmount')?.value || document.getElementById('compactAmount')?.value) || 1;
            const homeCurrency = homeCountry ? getCurrencyForCountry(homeCountry.name) : null;
            
            if (!homeCurrency || destinationCountries.length === 0) return;
            
            // Create modern container
            const container = document.createElement('div');
            container.style.cssText = `
                background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
                border-radius: 24px;
                padding: 24px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
                margin: 20px 0;
            `;
            
            // Modern header with gradient
            const header = document.createElement('div');
            header.style.cssText = `
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 16px;
                padding: 24px;
                margin-bottom: 20px;
                color: white;
                position: relative;
                overflow: hidden;
            `;
            
            header.innerHTML = `
                <div style="position: relative; z-index: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <div style="font-size: 0.875rem; opacity: 0.9; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                            From ${homeCountry.name}
                        </div>
                        <div style="
                            background: rgba(255, 255, 255, 0.2);
                            backdrop-filter: blur(10px);
                            padding: 6px 12px;
                            border-radius: 20px;
                            font-size: 0.75rem;
                            font-weight: 600;
                        ">
                            LIVE RATES
                        </div>
                    </div>
                    <div style="display: flex; align-items: baseline; gap: 8px;">
                        <span style="font-size: 3rem; font-weight: 700; line-height: 1;">
                            ${amount}
                        </span>
                        <span style="font-size: 1.5rem; font-weight: 500; opacity: 0.9;">
                            ${homeCurrency.code}
                        </span>
                    </div>
                    <div style="font-size: 0.875rem; opacity: 0.8; margin-top: 8px;">
                        Last updated: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
                
                <!-- Decorative circles -->
                <div style="
                    position: absolute;
                    width: 200px;
                    height: 200px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 50%;
                    top: -100px;
                    right: -50px;
                "></div>
                <div style="
                    position: absolute;
                    width: 150px;
                    height: 150px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 50%;
                    bottom: -75px;
                    left: -30px;
                "></div>
            `;
            
            container.appendChild(header);
            
            // Conversion cards with modern design
            destinationCountries.forEach((dest, index) => {
                // Skip if this destination is the same as home (prevent self-conversion)
                if (homeCountry && dest.name === homeCountry.name) {
                    return;
                }
                
                const currency = getCurrencyForCountry(dest.name);
                if (!currency) return;
                
                const currentRates = exchangeRateManager.getCurrentRates();
                const rate = currentRates?.[currency.code] || null;
                const convertedAmount = rate ? (amount * rate) : null;
                
                const card = document.createElement('div');
                card.style.cssText = `
                    background: white;
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
                    cursor: pointer;
                    border: 2px solid transparent;
                    position: relative;
                    overflow: hidden;
                `;
                
                // Hover effects
                card.onmouseover = () => {
                    card.style.transform = 'translateY(-4px)';
                    card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.12)';
                    card.style.borderColor = '#667eea';
                };
                card.onmouseout = () => {
                    card.style.transform = 'translateY(0)';
                    card.style.boxShadow = 'none';
                    card.style.borderColor = 'transparent';
                };
                
                // Use persistent trend data instead of random
                const trendData = getCurrencyTrend(currency.code);
                const trend = trendData.direction;
                const trendPercent = trendData.percentage;
                
                card.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 20px; flex: 1;">
                        <!-- Modern flag container -->
                        <div style="
                            width: 56px;
                            height: 56px;
                            border-radius: 50%;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 1.75rem;
                            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                        ">
                            ${getCountryFlag(dest.name)}
                        </div>
                        
                        <!-- Country info -->
                        <div style="flex: 1;">
                            <div style="
                                font-weight: 600;
                                font-size: 1.125rem;
                                color: #1a1a1a;
                                margin-bottom: 4px;
                            ">
                                ${dest.name}
                            </div>
                            <div style="
                                color: #6b7280;
                                font-size: 0.875rem;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                            ">
                                <span>${currency.name}</span>
                                <span style="
                                    background: #f3f4f6;
                                    padding: 2px 6px;
                                    border-radius: 4px;
                                    font-size: 0.75rem;
                                    font-weight: 600;
                                    color: #6b7280;
                                ">${currency.code}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Conversion amount with trend -->
                    <div style="display: flex; align-items: center; gap: 24px;">
                        <div style="text-align: right;">
                            <div style="
                                font-size: 1.875rem;
                                font-weight: 700;
                                color: #10b981;
                                margin-bottom: 4px;
                                display: flex;
                                align-items: baseline;
                                gap: 4px;
                            ">
                                ${convertedAmount ? convertedAmount.toFixed(2) : '---'}
                                <span style="font-size: 1.125rem; font-weight: 500;">${currency.symbol}</span>
                            </div>
                            
                            <!-- Rate with trend indicator -->
                            <div style="
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                font-size: 0.875rem;
                            ">
                                <span style="color: #6b7280;">
                                    1 ${homeCurrency.code} = ${rate ? rate.toFixed(4) : '---'} ${currency.code}
                                </span>
                                <span style="
                                    display: inline-flex;
                                    align-items: center;
                                    gap: 2px;
                                    padding: 2px 6px;
                                    border-radius: 6px;
                                    font-size: 0.75rem;
                                    font-weight: 600;
                                    background: ${trend === 'up' ? '#dcfce7' : '#fee2e2'};
                                    color: ${trend === 'up' ? '#16a34a' : '#dc2626'};
                                ">
                                    ${trend === 'up' ? '↑' : '↓'} ${trendPercent}%
                                </span>
                            </div>
                        </div>
                        
                        <!-- Modern remove button -->
                        <button 
                            onclick="event.stopPropagation(); removeDestination('${dest.name}')"
                            style="
                                width: 40px;
                                height: 40px;
                                border-radius: 12px;
                                border: none;
                                background: #f3f4f6;
                                color: #6b7280;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                cursor: pointer;
                                transition: all 0.2s;
                                font-size: 1.25rem;
                            "
                            onmouseover="this.style.background='#fee2e2'; this.style.color='#dc2626';"
                            onmouseout="this.style.background='#f3f4f6'; this.style.color='#6b7280';"
                        >
                            ✕
                        </button>
                    </div>
                `;
                
                container.appendChild(card);
            });
            
            // Action buttons section
            const actions = document.createElement('div');
            actions.style.cssText = `
                display: flex;
                gap: 12px;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
            `;
            
            actions.innerHTML = `
                <button onclick="showHistoricalChart()" style="
                    flex: 1;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    padding: 14px 20px;
                    font-weight: 600;
                    font-size: 0.95rem;
                    cursor: pointer;
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                "
                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(102, 126, 234, 0.4)';"
                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.3)';"
                >
                    <span>📈</span> View Charts
                </button>
                
                <button onclick="shareResults()" style="
                    background: white;
                    color: #6b7280;
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 14px 20px;
                    font-weight: 600;
                    font-size: 0.95rem;
                    cursor: pointer;
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                "
                onmouseover="this.style.borderColor='#667eea'; this.style.color='#667eea';"
                onmouseout="this.style.borderColor='#e5e7eb'; this.style.color='#6b7280';"
                >
                    <span>📤</span> Share
                </button>
            `;
            
            container.appendChild(actions);
            listContainer.appendChild(container);
        }

        // Share function using DataExportManager
        window.shareResults = async function() {
            if (window.dataExportManager) {
                // Prepare share data
                const title = 'Currency Exchange Rates';
                let text = `Exchange rates from ${homeCountry?.name || 'your location'}`;
                
                if (destinationCountries && destinationCountries.length > 0) {
                    text += ` to ${destinationCountries.length} destination${destinationCountries.length > 1 ? 's' : ''}`;
                }
                
                await dataExportManager.shareData(title, text);
            } else {
                alert('Share feature not available');
            }
        };

        function getCountryFlag(countryName) {
            return FLAG_MAP[countryName] || '🌍';
        }

        function showLoading(show) {
            const loadingDiv = document.getElementById('mapLoading');
            const worldMap = document.getElementById('worldMap');
            
            if (window.uiManager) {
                if (show) {
                    uiManager.showLoading('mapLoading');
                    if (worldMap) worldMap.style.display = 'none';
                } else {
                    uiManager.hideLoading('mapLoading');
                    if (worldMap) worldMap.style.display = 'block';
                    // Also hide the loading text
                    if (loadingDiv) loadingDiv.style.display = 'none';
                }
            } else {
                // Fallback
                if (loadingDiv) loadingDiv.style.display = show ? 'block' : 'none';
                if (worldMap) worldMap.style.display = show ? 'none' : 'block';
            }
        }

        function showError(message) {
            if (window.notificationManager) {
                notificationManager.showError(message);
            } else if (window.uiManager) {
                uiManager.showError(message, 'errorMessage');
            } else {
                // Fallback
                const errorDiv = document.getElementById('errorMessage');
                if (errorDiv) {
                    errorDiv.textContent = message;
                    errorDiv.style.display = 'block';
                }
            }
        }

        function hideError() {
            if (window.notificationManager) {
                notificationManager.hideError();
            } else if (window.uiManager) {
                uiManager.hideError('errorMessage');
            } else {
                // Fallback
                const errorDiv = document.getElementById('errorMessage');
                if (errorDiv) {
                    errorDiv.style.display = 'none';
                }
            }
        }

        /**
         * Centralized error handler
         * @param {Error} error - Error object
         * @param {string} context - Where the error occurred
         */
        function handleError(error, context = 'Unknown') {
            const errorMessage = `Error in ${context}: ${error.message}`;
            
            if (window.notificationManager) {
                notificationManager.showError(errorMessage);
            }
            
            // Log to error tracking service in production
            if (typeof trackError === 'function') {
                trackError(error, { context });
            }
            
            DEBUG.error(errorMessage, error);
        }
  
        // Add event listeners for timeframe buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('timeframe-btn')) {
                const days = parseInt(e.target.dataset.period);
                loadHistoricalData(days);

                // ✅ ADD THIS: Auto-regenerate AI after timeframe change
                if (aiPredictionsActive) {
                    setTimeout(() => {
                        console.log('🤖 Regenerating AI for new timeframe...');
                        generateAIPredictions();
                    }, 1000); // Longer delay for data loading
                }
            }
        });
        // ============= CACHE MANAGEMENT FUNCTIONS =============
        
        // Make functions globally available for onclick handlers
        window.removeDestination = removeDestination;
        window.showHistoricalChart = showHistoricalChart;
        window.hideChart = hideChart;
        window.showDestinationOverlayPanel = showDestinationOverlayPanel;
        window.toggleDestinationOverlay = toggleDestinationOverlay;
        window.closeOverlayPanel = closeOverlayPanel;
        window.populateOverlayLists = populateOverlayLists;

        // **************
        // BLOCK 3: Multiple Currency Overlay Functions (ADD THIS)
        function addCurrencyOverlay() {
            premiumFeaturesManager.requiresPremium('multipleOverlays', () => {
                if (activeOverlays.length >= 3) {
                    alert('Maximum 3 currency overlays allowed');
                    return;
                }
                
                showCurrencySelector();
            });
        }

        function showCurrencySelector() {
            if (window.modalManager) {
                modalManager.showCurrencySelector();
            } else {
                // Original implementation as fallback
                const existingSelector = document.getElementById('currencySelector');
                if (existingSelector) {
                    existingSelector.remove();
                }
                
                const selector = document.createElement('div');
                selector.id = 'currencySelector';
                
            }
        }
        
        function closeCurrencySelector() {
            if (window.modalManager && modalManager.isModalOpen('currencySelector')) {
                modalManager.closeModal('currencySelector');
            } else {
                const selector = document.getElementById('currencySelector');
                if (selector) {
                    selector.remove();
                }
            }
        }

        function confirmAddOverlay() {
            const currencyCode = document.getElementById('overlayCurrency').value;
            if (!currencyCode) {
                alert('Please select a currency');
                return;
            }
            
            // Check throttling
            if (!requestThrottle.canRequest('add_overlay')) {
                alert('⚠️ Please wait before adding another overlay (rate limit protection)');
                return;
            }
            
            // Validation checks
            const destCurrency = getCurrencyForCountry(destinationCountry.name);
            if (destCurrency && currencyCode === destCurrency.code) {
                alert(`${currencyCode} is already your destination currency. Choose a different currency for overlay.`);
                return;
            }
            
            const homeCurrency = getCurrencyForCountry(homeCountry.name);
            if (homeCurrency && currencyCode === homeCurrency.code) {
                alert(`${currencyCode} is your home currency (always 1.0). Choose a different currency for overlay.`);
                return;
            }
            
            // Use OverlayManager to add
            if (overlayManager.addOverlay(currencyCode, null, false)) {
                closeCurrencySelector();
                
                // Update chart with new overlay
                updateChartWithOverlays(homeCurrency);
                updateOverlayControls();
                
                // Auto-regenerate AI if active
                if (aiPredictionsActive) {
                    console.log('🤖 Regenerating AI for new overlay...');
                    setTimeout(() => {
                        generateAIPredictions();
                    }, 500);
                }
            }
        }

        function removeOverlay(currencyCode) {
            overlayManager.removeOverlay(currencyCode);
            
            // Update chart if home country exists
            if (homeCountry) {
                const homeCurrency = getCurrencyForCountry(homeCountry.name);
                if (homeCurrency) {
                    updateChartWithOverlays(homeCurrency);
                }
            }
            
            updateOverlayControls();
            // Clean up any stale forecast data
            if (currentChart) {
                currentChart.data.datasets = currentChart.data.datasets.filter(dataset => {
                    // Remove forecasts for removed overlays
                    if (dataset.isAI && dataset.label.includes(currencyCode)) {
                        return false;
                    }
                    return true;
                });
                currentChart.update();
            }
            // Auto-regenerate AI if active
            if (aiPredictionsActive) {
                console.log('🤖 Regenerating AI after overlay removal...');
                setTimeout(() => {
                    generateAIPredictions();
                }, 500);
            }
        }

        function toggleOverlay(currencyCode) {
            console.log(`🔄 TOGGLE OVERLAY CALLED: ${currencyCode}`);
            
            if (overlayManager.toggleOverlay(currencyCode)) {
                const homeCurrency = getCurrencyForCountry(homeCountry.name);
                updateChartWithOverlays(homeCurrency);
                updateOverlayControls();
            }
        }

        async function updateChartWithOverlays(homeCurrency) {
            if (!currentChart || !homeCountry) return;
            
            
            
            // 🚨 CRITICAL: Add throttling check here
            if (!requestThrottle.canRequest('overlay_update')) {
                console.warn('🚫 Overlay update throttled - too many recent requests');
                return;
            }
            
            console.log(`🔄 Updating chart overlays (${activeOverlays.length} overlays)`);
            
            try {
                // Get current timeframe
                const activeTimeframe = document.querySelector('.timeframe-btn.active');
                const days = activeTimeframe ? parseInt(activeTimeframe.dataset.period) : 7;
                
                // Simply reload all data for current timeframe
                await loadHistoricalData(days);
                
            } catch (error) {
                console.error('Error updating chart with overlays:', error);
            }
        }

        function updateOverlayControls() {
            // Find the controls container
            const chartControls = document.querySelector('.chart-controls');
            if (!chartControls) {
                console.log('Chart controls container not found');
                return;
            }
            
            // Remove ALL existing overlay buttons
            const existingControls = chartControls.querySelector('.overlay-controls');
            if (existingControls) {
                existingControls.remove();
            }
            
            // Also remove any standalone overlay buttons
            chartControls.querySelectorAll('[data-overlay-button]').forEach(btn => btn.remove());
            
            // Only show VISIBLE overlays
            const visibleOverlays = activeOverlays.filter(o => o.visible && o.data);
            
            if (visibleOverlays.length === 0) {
                console.log('No visible overlays to display');
                return;
            }
            
            // Create overlay controls container
            const overlayControls = document.createElement('div');
            overlayControls.className = 'overlay-controls';
            overlayControls.style.cssText = `
                display: inline-flex; 
                gap: 6px; 
                align-items: center; 
                margin: 0 16px;
            `;
            
            visibleOverlays.forEach(overlay => {
                const control = document.createElement('button');
                control.setAttribute('data-overlay-button', overlay.currency);
                control.style.cssText = `
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                    padding: 3px 6px;
                    font-size: 0.75rem;
                    background: ${overlay.color};
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                `;
                
                control.innerHTML = `
                    ${overlay.currency}
                    <span onclick="event.stopPropagation(); removeOverlay('${overlay.currency}')" style="
                        margin-left: 4px;
                        font-weight: bold;
                        opacity: 0.8;
                        font-size: 1rem;
                    ">×</span>
                `;
                
                overlayControls.appendChild(control);
            });
            
            // Find the indicator controls and insert after them
            const indicatorControls = chartControls.querySelector('.indicator-controls');
            if (indicatorControls && indicatorControls.parentNode) {
                // Insert the overlay controls right after the indicator controls
                indicatorControls.parentNode.insertBefore(overlayControls, indicatorControls.nextSibling);
            } else {
                // No indicator controls found, append to chart controls
                chartControls.appendChild(overlayControls);
            }
            
            console.log(`Updated overlay controls: ${visibleOverlays.length} visible overlays`);
        }

        // API Status indicator
        function showAPIStatus() {
            if (window.notificationManager) {
                notificationManager.showAPIStatus();
            } else {
                // Original fallback code
                const status = document.getElementById('apiStatus');
                if (!status) {
                    const statusDiv = document.createElement('div');
                    statusDiv.id = 'apiStatus';
                    statusDiv.style.cssText = `
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        background: #2d3748;
                        color: white;
                        padding: 8px 12px;
                        border-radius: 6px;
                        font-size: 0.75rem;
                        z-index: 1000;
                        opacity: 0.8;
                    `;
                    document.body.appendChild(statusDiv);
                }
            }
        
            
            // Show real API status
            const totalUsed = apiConfigManager.usage.exchangerate.used;
            const mode = totalUsed > 0 ? 'Live Data' : 'Sample Data';

        }


        // Professional Algorithm Status Display
        function showAlgorithmStatus() {
            if (window.notificationManager) {
                notificationManager.showAlgorithmStatus();
            } else {
                // Keep original implementation as fallback
                const existingStatus = document.getElementById('algorithmStatus');
                if (existingStatus) {
                    existingStatus.remove();
                }
                
                const statusDiv = document.createElement('div');
                statusDiv.id = 'algorithmStatus';
                statusDiv.style.cssText = `
                    position: fixed;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(135deg, #f8f9fa, #e8f0fe);
                    border: 1px solid #dadce0;
                    border-bottom: none;
                    border-radius: 12px 12px 0 0;
                    padding: 12px 24px;
                    display: flex;
                    gap: 20px;
                    align-items: center;
                    box-shadow: 0 -4px 12px rgba(60, 64, 67, 0.15);
                    z-index: 1000;
                    backdrop-filter: blur(8px);
                    max-width: 90vw;
                    overflow-x: auto;
                `;
                
                // REAL DATA CALCULATIONS
                const overlayCount = window.overlayManager?.getActiveOverlays()?.filter(o => o.visible).length || 0;
                const cacheStats = window.cacheManager?.getCacheStats() || getCacheStatsForStatus();
                const apiUsage = window.apiConfigManager?.usage?.exchangerate || { used: 0, limit: 1500 };
                
                // Determine algorithm status
                const algorithmStatus = window.currentChart ? '🟢 Active' : '⚪ Idle';
                
                // Determine mode based on actual usage
                const mode = overlayCount > 0 ? 'Multi-Currency Analysis' : 
                            window.currentChart ? 'Single Pair Analysis' : 
                            'Ready';
                
                // Calculate real cache performance
                const hitRate = cacheStats.hitRate || '0%';
                const cacheEntries = cacheStats.size || cacheStats.entries || 0;
                const apiSaved = cacheStats.hits || 0;
                
                // Determine system mode
                const systemMode = cacheEntries > 10 ? '⚡ Cache Optimized' :
                                cacheEntries > 0 ? '🔄 Hybrid Mode' :
                                '📡 Live Data';
                
                // Performance status based on real metrics
                const perfStatus = parseFloat(hitRate) > 50 ? '🚀 Optimized' :
                                parseFloat(hitRate) > 20 ? '📈 Building' :
                                '🔄 Warming Up';
                
                statusDiv.innerHTML = `
                    <div style="background: rgba(255,255,255,0.9); border: 1px solid #dadce0; border-radius: 8px; padding: 8px 12px; font-size: 0.75rem; color: #5f6368; white-space: nowrap;">
                        <div style="color: #1a73e8; font-weight: 600; margin-bottom: 2px;">🏦 MAPRATES PRO</div>
                        <div style="margin: 1px 0;">📈 Chart: ${algorithmStatus}</div>
                        <div style="margin: 1px 0;">📊 Overlays: ${overlayCount}/3 active</div>
                        <div style="margin: 1px 0;">⚡ Mode: ${mode}</div>
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.9); border: 1px solid #dadce0; border-radius: 8px; padding: 8px 12px; font-size: 0.75rem; color: #5f6368; white-space: nowrap;">
                        <div style="color: #1a73e8; font-weight: 600; margin-bottom: 2px;">📡 SYSTEM STATUS</div>
                        <div style="margin: 1px 0;">🔌 API: ${apiUsage.used}/${apiUsage.limit} requests</div>
                        <div style="margin: 1px 0;">💾 Cache: ${cacheEntries} entries</div>
                        <div style="margin: 1px 0;">${systemMode}</div>
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.9); border: 1px solid #dadce0; border-radius: 8px; padding: 8px 12px; font-size: 0.75rem; color: #5f6368; white-space: nowrap;">
                        <div style="color: #34a853; font-weight: 600; margin-bottom: 2px;">⚡ PERFORMANCE</div>
                        <div style="margin: 1px 0;">📊 Hit Rate: ${hitRate}</div>
                        <div style="margin: 1px 0;">💰 API Saved: ${apiSaved} calls</div>
                        <div style="margin: 1px 0;">${perfStatus}</div>
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.9); border: 1px solid #fbb034; border-radius: 8px; padding: 8px 12px; font-size: 0.75rem; color: #5f6368; white-space: nowrap;">
                        <div style="color: #f57c00; font-weight: 600; margin-bottom: 2px;">⚠️ EDUCATIONAL TOOL</div>
                        <div style="margin: 1px 0; font-size: 0.7rem; color: #666;">For Information Only</div>
                        <div style="margin: 1px 0; font-size: 0.7rem; color: #666;">Not Financial Advice</div>
                        <div style="margin: 1px 0; font-size: 0.7rem; color: #666;">No Trading Recommendations</div>
                    </div>
                `;
                
                document.body.appendChild(statusDiv);
                
                if (!document.body.style.paddingBottom) {
                    document.body.style.paddingBottom = '80px';
                }
            }
        }
        // API Configuration Functions
        function showAPIConfig() {
            const panel = document.getElementById('apiConfigPanel');
            panel.style.display = 'block';
            panel.scrollIntoView({ behavior: 'smooth' });
            updateAPIUsageDisplays();

            // Initialize cache stats display
            setTimeout(() => {
                refreshCacheStats();
            }, 100);
        }

        function hideAPIConfig() {
            document.getElementById('apiConfigPanel').style.display = 'none';
        }

        async function configureFixerAPI() {
            const apiKey = document.getElementById('fixerApiKey').value.trim();
            if (!apiKey) {
                alert('Please enter a valid API key');
                return;
            }
            
            const success = await apiConfigManager.configureAPIKey('fixer', apiKey);
            if (success) {
                document.getElementById('fixerStatus').innerHTML = '✅ Active';
                document.getElementById('fixerStatus').style.color = 'var(--success-green)';
                alert('✅ Fixer.io API configured successfully!');
            } else {
                alert('❌ Invalid API key. Please check and try again.');
            }
        }

        async function testAPIKey(providerName, apiKey) {
            const provider = apiConfigManager.getProviders()[providerName];
            
            try {
                let testUrl = `${provider.baseUrl}/latest?access_key=${apiKey}&base=USD&symbols=EUR`;
                const response = await fetch(testUrl);
                const data = await response.json();
                
                return response.ok && data.success && data.rates && data.rates.EUR;
            } catch (error) {
                return false;
            }
        }

        function updateAPIUsageDisplays() {
            document.getElementById('exchangerateUsage').textContent = 
                `${apiConfigManager.usage.exchangerate.used}/${apiConfigManager.usage.exchangerate.limit}`;
            updateAPIStatusIndicator();
        }

        function updateAPIStatusIndicator() {
            const statusDiv = document.getElementById('apiStatus');
            if (!statusDiv) return;
            
            const totalUsed = Object.values(apiConfigManager.usage).reduce((sum, usage) => sum + usage.used, 0);
            const exchangerateUsage = apiConfigManager.usage.exchangerate;
            const cacheStats = apiManager.getCacheStats();
            
            statusDiv.innerHTML = `
                📡 API: ${exchangerateUsage.used}/${exchangerateUsage.limit} requests
                <br>📊 Overlays: ${activeOverlays.length} active
                <br>💾 Cache: ${cacheStats.size} entries
                <br>🔄 Mode: ${totalUsed > 0 ? 'Live Data' : 'Sample Data'}
            `;
        }
        function showDestinationOverlayPanel() {
            if (window.modalManager) {
                modalManager.showOverlayPanel();
            } else {
                // Keep original implementation as fallback
                const existingPanel = document.getElementById('overlayManagementPanel');
                if (existingPanel) {
                    existingPanel.remove();
                }
                // ... rest of original implementation
            }
        }

        function populateOverlayLists() {
            const destinationList = document.getElementById('destinationOverlayList');
            const otherList = document.getElementById('otherOverlayList');
            
            if (!destinationList || !otherList) return;
            
            destinationList.innerHTML = '';
            otherList.innerHTML = '';
            
            const homeCurrency = getCurrencyForCountry(homeCountry.name);
            const activeCount = activeOverlays.filter(o => o.visible).length;
            
            destinationCountries.forEach(dest => {
                const destCurrency = getCurrencyForCountry(dest.name);
                
                if ((destinationCountry && dest.name === destinationCountry.name) || 
                    (homeCurrency && destCurrency.code === homeCurrency.code)) return;
                
                const overlay = activeOverlays.find(o => o.currency === destCurrency.code);
                const isActive = overlay && overlay.visible;
                const canToggle = activeCount < 3 || isActive;
                
                const item = document.createElement('div');
                item.style.cssText = `
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 12px;
                    margin-bottom: 8px;
                    background: ${isActive ? '#e8f5e8' : '#f8f9fa'};
                    border: 1px solid ${isActive ? '#34a853' : '#dadce0'};
                    border-radius: 6px;
                `;
                
                item.innerHTML = `
                    <div>
                        <span style="font-weight: 500;">${getCountryFlag(dest.name)} ${dest.name}</span>
                        <span style="color: #5f6368; font-size: 0.875rem; margin-left: 8px;">${destCurrency.code}</span>
                    </div>
                    <label style="display: flex; align-items: center; cursor: ${canToggle ? 'pointer' : 'not-allowed'};">
                        <input type="checkbox" 
                            ${isActive ? 'checked' : ''} 
                            ${!canToggle ? 'disabled' : ''}
                            onchange="toggleDestinationOverlay('${destCurrency.code}', '${dest.name}')"
                            style="margin-right: 8px;">
                        <span style="color: ${canToggle ? '#1a73e8' : '#9aa0a6'};">${isActive ? 'Active' : 'Inactive'}</span>
                    </label>
                `;
                
                destinationList.appendChild(item);
            });
            
            const otherOverlays = activeOverlays.filter(o => !o.isFromDestinations);
            otherOverlays.forEach(overlay => {
                const isActive = overlay.visible;
                const canToggle = activeCount < 3 || isActive;
                
                const item = document.createElement('div');
                item.style.cssText = `
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 12px;
                    margin-bottom: 8px;
                    background: ${isActive ? '#e8f5e8' : '#f8f9fa'};
                    border: 1px solid ${isActive ? '#34a853' : '#dadce0'};
                    border-radius: 6px;
                `;
                
                const currencyInfo = currencySymbols[overlay.currency];
                
                item.innerHTML = `
                    <div>
                        <span style="font-weight: 500;">${overlay.currency}</span>
                        <span style="color: #5f6368; font-size: 0.875rem; margin-left: 8px;">${currencyInfo?.name || 'Currency'}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <label style="display: flex; align-items: center; cursor: ${canToggle ? 'pointer' : 'not-allowed'};">
                            <input type="checkbox" 
                                ${isActive ? 'checked' : ''} 
                                ${!canToggle ? 'disabled' : ''}
                                onchange="toggleOverlay('${overlay.currency}')"
                                style="margin-right: 8px;">
                            <span style="color: ${canToggle ? '#1a73e8' : '#9aa0a6'};">${isActive ? 'Active' : 'Inactive'}</span>
                        </label>
                        <button onclick="removeOverlay('${overlay.currency}')" style="
                            background: #ea4335;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            width: 24px;
                            height: 24px;
                            font-size: 12px;
                            cursor: pointer;
                        ">×</button>
                    </div>
                `;
                
                otherList.appendChild(item);
            });
            
            if (activeCount >= 3) {
                const warning = document.createElement('div');
                warning.style.cssText = `
                    background: #fff3e0;
                    border: 1px solid #f57c00;
                    border-radius: 6px;
                    padding: 8px 12px;
                    margin-top: 12px;
                    font-size: 0.875rem;
                    color: #ef6c00;
                `;
                warning.textContent = `⚠️ Maximum 3 overlays active (${activeCount}/3). Disable one to enable another.`;
                
                if (destinationList.children.length > 0) {
                    destinationList.appendChild(warning);
                } else if (otherList.children.length > 0) {
                    otherList.appendChild(warning);
                }
            }
        }

        function toggleDestinationOverlay(currencyCode, countryName) {
            const overlay = activeOverlays.find(o => o.currency === currencyCode);
            const activeCount = activeOverlays.filter(o => o.visible).length;
            
            if (overlay) {
                if (!overlay.visible && activeCount >= 3) {
                    alert('Maximum 3 overlays active. Disable another overlay first.');
                    return;
                }
                overlay.visible = !overlay.visible;
            } else {
                if (activeCount >= 3) {
                    alert('Maximum 3 overlays active. Disable another overlay first.');
                    return;
                }
                
                const color = overlayColors[overlayCounter % overlayColors.length];
                overlayCounter++;
                
                const newOverlay = {
                    currency: currencyCode,
                    country: countryName,
                    color: color,
                    visible: true,
                    data: null,
                    isFromDestinations: true
                };
                
                activeOverlays.push(newOverlay);
            }
            
            const homeCurrency = getCurrencyForCountry(homeCountry.name);
            updateChartWithOverlays(homeCurrency);
            populateOverlayLists();

            setTimeout(() => {
                updateOverlayControls();
            }, 500);
            
        }

        function closeOverlayPanel() {
            if (window.modalManager && modalManager.isModalOpen('overlayPanel')) {
                modalManager.closeModal('overlayPanel');
            } else {
                const panel = document.getElementById('overlayManagementPanel');
                if (panel) {
                    panel.remove();
                }
            }
        }

        // Make overlay functions globally available
        window.addCurrencyOverlay = addCurrencyOverlay;
        window.confirmAddOverlay = confirmAddOverlay;
        window.closeCurrencySelector = closeCurrencySelector;
        window.removeOverlay = removeOverlay;
        window.toggleOverlay = toggleOverlay;
        window.showAPIConfig = showAPIConfig;
        window.hideAPIConfig = hideAPIConfig;
        window.configureFixerAPI = configureFixerAPI;
        window.showDestinationOverlayPanel = showDestinationOverlayPanel;
        window.toggleDestinationOverlay = toggleDestinationOverlay;
        window.closeOverlayPanel = closeOverlayPanel;
        window.populateOverlayLists = populateOverlayLists;

        // ============= TECHNICAL INDICATORS SYSTEM =============

        function toggleIndicator(indicatorType) {
            if (!premiumFeaturesManager.canAccessFeature('technicalIndicators')) {
                premiumFeaturesManager.showPremiumModal('Technical Indicators');
                return;
            }
            
            // Check if technicalIndicators module is available
            if (!window.technicalIndicators) {
                console.error('Technical indicators module not loaded');
                return;
            }
            
            // Make sure activeIndicators structure exists
            if (!window.technicalIndicators.activeIndicators) {
                window.technicalIndicators.activeIndicators = {};
            }
            
            // Initialize the indicator if it doesn't exist
            if (!window.technicalIndicators.activeIndicators[indicatorType]) {
                window.technicalIndicators.activeIndicators[indicatorType] = { 
                    active: false,
                    period: indicatorType === 'sma' ? 20 : (indicatorType === 'rsi' ? 14 : 20)
                };
            }
            
            // Now toggle it
            const isActive = technicalIndicators.toggleIndicator(indicatorType);
            
            updateIndicatorButtons();
            updateChartWithIndicators();
            
            // Show educational info when any indicator is activated
            if (isActive) {
                showIndicatorEducationalInfo();
            }
        }

        function updateIndicatorButtons() {
            document.querySelectorAll('.indicator-btn').forEach(btn => {
                const indicator = btn.dataset.indicator;
                if (activeIndicators[indicator]?.active) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }

        function calculateSMA(data, period) {
            if (data.length < period) return Array(data.length).fill(null);
            
            const smaData = [];
            
            // Fill beginning with nulls
            for (let i = 0; i < period - 1; i++) {
                smaData.push(null);
            }
            
            // Calculate SMA for remaining points
            for (let i = period - 1; i < data.length; i++) {
                const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
                smaData.push(sum / period);
            }
            
            return smaData; // Same length as input data
        }

        function calculateBollingerBands(data, period = 20, stdDev = 0.5) {
            if (data.length < period) {
                return { 
                    upper: Array(data.length).fill(null), 
                    middle: Array(data.length).fill(null), 
                    lower: Array(data.length).fill(null) 
                };
            }
            
            const upper = [];
            const middle = [];
            const lower = [];
            
            // Fill beginning with nulls
            for (let i = 0; i < period - 1; i++) {
                upper.push(null);
                middle.push(null);
                lower.push(null);
            }
            
            // Calculate for remaining points
            for (let i = period - 1; i < data.length; i++) {
                const dataSlice = data.slice(i - period + 1, i + 1);
                const mean = dataSlice.reduce((acc, val) => acc + val, 0) / period;
                
                const squaredDiffs = dataSlice.map(val => Math.pow(val - mean, 2));
                const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / period;
                const standardDeviation = Math.sqrt(variance);
                
                upper.push(mean + (standardDeviation * stdDev));
                middle.push(mean);
                lower.push(mean - (standardDeviation * stdDev));
            }
            
            return { upper, middle, lower }; // Same length as input data
        }

        function calculateRSI(data, period = 14) {
            if (data.length < period + 1) {
                return Array(data.length).fill(null);
            }
            
            const rsiData = [];
            
            // Fill beginning with nulls
            for (let i = 0; i < period; i++) {
                rsiData.push(null);
            }
            
            const gains = [];
            const losses = [];
            
            // Calculate price changes
            for (let i = 1; i < data.length; i++) {
                const change = data[i] - data[i - 1];
                gains.push(change > 0 ? change : 0);
                losses.push(change < 0 ? Math.abs(change) : 0);
            }
            
            // Calculate RSI for remaining points
            for (let i = period - 1; i < gains.length; i++) {
                const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
                const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
                
                if (avgLoss === 0) {
                    rsiData.push(100);
                } else {
                    const rs = avgGain / avgLoss;
                    const rsi = 100 - (100 / (1 + rs));
                    rsiData.push(rsi);
                }
            }
            
            return rsiData; // Same length as input data
        }

        function addRSIIndicator() {
            if (!currentChart || !currentHistoricalData) return;
            
            const data = currentHistoricalData.map(item => item.rate);
            const rsiData = calculateRSI(data, activeIndicators.rsi.period);
            const rsiOffset = Array(activeIndicators.rsi.period).fill(null);
            
            // Add RSI as separate y-axis
            currentChart.options.scales.y2 = {
                type: 'linear',
                display: true,
                position: 'right',
                min: 0,
                max: 100,
                grid: { drawOnChartArea: false },
                ticks: {
                    color: '#5f6368',
                    font: { size: 10 },
                    callback: function(value) { return value.toFixed(0); }
                }
            };
            
            currentChart.data.datasets.push({
                label: `RSI (${activeIndicators.rsi.period}) - ${activeIndicators.rsi.period} day warmup`,
                data: rsiData,
                borderColor: '#ea4335',
                backgroundColor: 'transparent',
                borderWidth: 3,
                fill: false,
                tension: 0.2,
                pointRadius: 0,
                isIndicator: true,
                yAxisID: 'y2',
                spanGaps: true
            });
            
            console.log('Chart labels length:', currentChart.data.labels.length);

currentChart.update('none');
            currentChart.update();
        }

        function updateChartWithIndicators() {
            const chart = chartManager.getChart();
            const historicalData = chartManager.getHistoricalData();
            
            if (!chart || !historicalData) {
                console.error('❌ Missing chart or data for indicators');
                return;
            }
            
            technicalIndicators.addIndicatorsToChart(chart, historicalData);
        }
        // Make functions globally available
        window.toggleIndicator = toggleIndicator;
        window.refreshCacheStats = refreshCacheStats;
        window.clearCache = clearCache;
        window.preloadPopularPairs = preloadPopularPairs;

        // ============= AI PREDICTION SYSTEM =============

        function toggleAIPredictions() {
            if (!premiumFeaturesManager.canAccessFeature('aiPredictions')) {
                premiumFeaturesManager.showPremiumModal('Mathematical Analysis & Forecasting');
                return;
            }
            // Show educational warning on first activation
            if (!aiPredictionsActive && !window.hasShownAIWarning) {
                if (confirm(
                    "⚠️ EDUCATIONAL DEMONSTRATION\n\n" +
                    "This feature shows statistical projections for learning purposes only.\n\n" +
                    "These are NOT predictions and should NEVER be used for trading decisions.\n\n" +
                    "Do you understand this is for educational purposes only?"
                )) {
                    window.hasShownAIWarning = true;
                } else {
                    return; // Don't activate if user doesn't acknowledge
                }
            }
            
            const isActive = aiPredictions.toggleAIPredictions();
            aiPredictionsActive = isActive; // Keep local reference for compatibility
            
            console.log(`📊 Mathematical Analysis toggled: ${isActive}`);
            
            updateAIButton();
            showAlgorithmStatus();
            
            if (isActive) {
                generateAIPredictions();
            } else {
                removeAIPredictions();
            }
        }

        function updateAIButton() {
            const btn = document.querySelector('[data-indicator="ai"]');
            if (btn) {
                if (aiPredictionsActive) {
                    btn.classList.add('active');
                    btn.innerHTML = '🤖 AI Active';
                    btn.style.background = 'linear-gradient(45deg, #34a853, #0f9d58)';
                } else {
                    btn.classList.remove('active');
                    btn.innerHTML = '📊 Trend Projection';
                    btn.style.background = 'linear-gradient(45deg, #4285f4, #34a853)';
                }
            }
        }
        
        function addMultiCurrencyAIPredictionsToChart() {
            if (!currentChart || !aiPredictionData) {
                console.warn('⚠️ Chart or prediction data not ready');
                return;
            }
            
            console.log('📊 Adding multi-currency predictions to chart...');
            
            // Remove any existing AI datasets first
            currentChart.data.datasets = currentChart.data.datasets.filter(dataset => !dataset.isAI);
            
            // Get destination currency for main pair
            const destCurrency = getCurrencyForCountry(destinationCountry.name);
            const homeCurrency = getCurrencyForCountry(homeCountry.name);
            
            // Add main prediction
            if (aiPredictionData.main) {
                console.log(`Adding main prediction: ${homeCurrency.code} → ${destCurrency.code}`);
                addSingleAIPrediction(
                    aiPredictionData.main, 
                    destCurrency.code, 
                    '#4285f4', // blue for main
                    'main'
                );
            }
            
            // Add overlay predictions
            if (aiPredictionData.overlays && aiPredictionData.overlays.length > 0) {
                aiPredictionData.overlays.forEach((overlayPred, index) => {
                    console.log(`Adding overlay prediction ${index + 1}: ${overlayPred.currency}`);
                    
                    // Use a slightly different shade for overlay predictions
                    const overlayColor = overlayPred.color || '#34a853';
                    
                    addSingleAIPrediction(
                        overlayPred.prediction,
                        overlayPred.currency,
                        overlayColor,
                        'overlay'
                    );
                });
            }
            
            // Update chart
            currentChart.update('none');
            
            // Show multi-currency summary
            showMultiCurrencyAISummary();
            
            // Show algorithm status
            showAlgorithmStatus();
            
            console.log(`✅ Added predictions for ${1 + (aiPredictionData.overlays?.length || 0)} currency pairs`);
        }

        async function generateAIPredictions() {            
            if (!currentHistoricalData || currentHistoricalData.length < 7) {
                console.warn('⚠️ Not enough data for Mathematical Analysis');
                console.log('Available data points:', currentHistoricalData?.length || 0);
                showAIError(aiPredictions.AI_ERROR_MESSAGES.insufficientData);
                aiPredictions.aiPredictionsActive = false;
                aiPredictionsActive = false;
                updateAIButton();
                return;
            }
            if (!currentHistoricalData || currentHistoricalData.length < 7) {
                console.warn('⚠️ Not enough data for Mathematical Analysis');
                showAIError(aiPredictions.AI_ERROR_MESSAGES.insufficientData);
                aiPredictions.aiPredictionsActive = false;
                aiPredictionsActive = false;
                updateAIButton();
                return;
            }
            
            console.log('📊 Generating Mathematical Analysis for main pair + overlays...');
            showAIProcessing();

            // Auto-hide processing notification after max 5 seconds
            setTimeout(() => {
                if (window.notificationManager) {
                    window.notificationManager.hideProcessing('ai-processing');
                }
            }, 5000);
            
            try {
                // Get current rate data for main pair
                const rates = currentHistoricalData.map(item => item.rate);
                const dates = currentHistoricalData.map(item => item.date);
                
                // Get currency codes
                const homeCurrency = getCurrencyForCountry(homeCountry.name);
                const destCurrency = getCurrencyForCountry(destinationCountry.name);
                
                // Generate predictions for main currency pair
                const mainPredictions = await aiPredictions.calculateAIPredictions(
                    rates, 
                    dates, 
                    'main', 
                    destCurrency.code,
                    homeCurrency.code
                );
                
                // Generate predictions for each overlay
                const overlayPredictions = [];
                
                for (const overlay of activeOverlays) {
                    if (overlay.data && overlay.visible) {
                        console.log(`🤖 Generating AI for overlay: ${overlay.currency}`);
                        const overlayRates = overlay.data.map(item => item.rate);
                        const overlayDates = overlay.data.map(item => item.date);
                        
                        const prediction = await aiPredictions.calculateAIPredictions(
                            overlayRates, 
                            overlayDates, 
                            overlay.currency, 
                            overlay.currency,
                            homeCurrency.code
                        );
                        overlayPredictions.push({
                            currency: overlay.currency,
                            color: overlay.color,
                            prediction: prediction
                        });
                    }
                }
                
                aiPredictionData = {
                    main: mainPredictions,
                    overlays: overlayPredictions,
                    timestamp: new Date().toISOString()
                };
                
                addMultiCurrencyAIPredictionsToChart();
                
                // Update performance metrics
                aiPredictions.updatePerformanceMetrics();
                
                console.log('✅ Mathematical Analysis generated for', 1 + overlayPredictions.length, 'currency pairs');
                
            } catch (error) {
                console.error('❌ Mathematical Analysis error:', error);
                showAIError(aiPredictions.AI_ERROR_MESSAGES.processingError);
                aiPredictions.aiPredictionsActive = false;
                aiPredictionsActive = false;
                updateAIButton();
            }
        }

        function showAIProcessing() {
            if (window.notificationManager) {
                notificationManager.showAIProcessing();
            } else {
                const btn = document.querySelector('[data-indicator="ai"]');
                if (btn) {
                    btn.innerHTML = '🤖 Processing...';
                    btn.style.background = 'linear-gradient(45deg, #fbbc04, #f29900)';
                }
            }
        }

        function showAIError(message) {
            if (window.notificationManager) {
                notificationManager.showAIError(message);
            } else {
                // Original fallback code
                const btn = document.querySelector('[data-indicator="ai"]');
                if (btn) {
                    btn.innerHTML = '🤖 Error';
                    btn.style.background = 'linear-gradient(45deg, #ea4335, #d93025)';
                    
                    setTimeout(() => {
                        btn.innerHTML = '📊 Trend Projection';
                        btn.style.background = 'linear-gradient(45deg, #4285f4, #34a853)';
                    }, 3000);
                }
                
                console.error('📊 Trend Error:', message);
            }
        }
     
        function addSingleAIPrediction(prediction, targetCurrency, color, type) {
            const forecast = prediction.forecast;
            const currentLabels = [...currentChart.data.labels];
            
            // Add forecast dates to labels (only once for main)
            if (type === 'main') {
                const forecastLabels = forecast.map(pred => {
                    const date = new Date(pred.date);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                });
                
                const extendedLabels = [...currentLabels, ...forecastLabels];
                currentChart.data.labels = extendedLabels;
                
                // Extend all existing datasets with null values
                currentChart.data.datasets.forEach(dataset => {
                    if (!dataset.isAI) {
                        dataset.data = [...dataset.data, ...Array(forecast.length).fill(null)];
                    }
                });
            }
            
            // Get the data length
            const dataLength = currentChart.data.datasets[0].data.length - forecast.length;
            let lastActualValue = null;
            let historicalData = [];
            
            // Find the last actual value and historical data
            if (type === 'overlay') {
                const matchingDataset = currentChart.data.datasets.find(d => 
                    d.label && d.label.includes(`to ${targetCurrency}`) && !d.isAI && !d.label.includes('Forecast')
                );
                
                if (matchingDataset && matchingDataset.data) {
                    historicalData = matchingDataset.data.filter(v => v !== null);
                    lastActualValue = historicalData[historicalData.length - 1];
                }
            } else {
                const mainDataset = currentChart.data.datasets[0];
                if (mainDataset && mainDataset.data) {
                    historicalData = mainDataset.data.filter(v => v !== null);
                    lastActualValue = historicalData[historicalData.length - 1];
                }
            }

            // DECLARE historicalVolatility at function scope so it's available everywhere
            let historicalVolatility = 0.01; // Default 1% daily volatility
            
            // Professional but honest projection
            let forecastData;
            
            if (lastActualValue && historicalData.length >= 2) {
                // Calculate simple historical statistics
                const returns = [];
                for (let i = 1; i < historicalData.length; i++) {
                    returns.push((historicalData[i] - historicalData[i-1]) / historicalData[i-1]);
                }
                
                // Calculate historical volatility (standard deviation of returns)
                const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
                const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
                historicalVolatility = Math.sqrt(variance); // UPDATE the variable (no const/let)
                
                // Calculate simple trend (last 3 points if available)
                const recentPoints = historicalData.slice(-Math.min(3, historicalData.length));
                const recentTrend = recentPoints.length > 1 
                    ? (recentPoints[recentPoints.length - 1] - recentPoints[0]) / recentPoints[0] / recentPoints.length
                    : 0;
                
                // Start forecast
                forecastData = Array(dataLength - 1).fill(null);
                forecastData.push(lastActualValue);
                
                // Simple random walk with drift (Monte Carlo simulation approach)
                let currentValue = lastActualValue;
                
                for (let day = 1; day <= forecast.length; day++) {
                    // Daily drift (trend continuation with decay)
                    const trendDecay = Math.exp(-day / 14); // Trend decays over 2 weeks
                    const drift = recentTrend * trendDecay * 0.5; // Conservative trend following
                    
                    // Random component based on historical volatility
                    const randomShock = (Math.random() - 0.5) * 2 * historicalVolatility;
                    
                    // Combine drift and random walk
                    const dailyReturn = drift + randomShock;
                    
                    // Apply reasonable limits (99.7% of normal distribution)
                    const maxDailyMove = historicalVolatility * 3; // 3 sigma limit
                    const cappedReturn = Math.max(-maxDailyMove, Math.min(maxDailyMove, dailyReturn));
                    
                    // Update value
                    currentValue = currentValue * (1 + cappedReturn);
                    forecastData.push(currentValue);
                }
                
            } else {
                // Insufficient data
                forecastData = Array(dataLength + forecast.length).fill(null);
            }
            
            // Create dataset with professional styling
            const dataset = {
                label: `📊 ${targetCurrency} Statistical Projection`,
                data: forecastData,
                borderColor: color,
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [6, 3], // Clear indication it's a projection
                fill: false,
                tension: 0.2, // Slight smoothing
                pointRadius: 0,
                pointHoverRadius: 5,
                pointBackgroundColor: color,
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                isAI: true
            };
            
            currentChart.data.datasets.push(dataset);
            
            // Add confidence intervals (only for main currency)
            // NOW historicalVolatility is available here because it's declared at function scope
            if (type === 'main' && historicalData.length >= 2 && forecastData) {
                const upperBandData = Array(dataLength).fill(null);
                const lowerBandData = Array(dataLength).fill(null);
                
                // Standard error increases with sqrt(time) - this is finance theory
                for (let i = 0; i < forecast.length; i++) {
                    const forecastValue = forecastData[dataLength + i];
                    if (forecastValue !== null) {
                        // Confidence interval based on historical volatility
                        // Widens with square root of time (standard in finance)
                        const daysAhead = i + 1;
                        const confidenceWidth = historicalVolatility * Math.sqrt(daysAhead) * 1.96; // 95% confidence
                        
                        // Cap at reasonable bounds
                        const maxWidth = 0.15; // Max 15% deviation
                        const actualWidth = Math.min(confidenceWidth, maxWidth);
                        
                        upperBandData.push(forecastValue * (1 + actualWidth));
                        lowerBandData.push(forecastValue * (1 - actualWidth));
                    }
                }
                
                // Subtle confidence bands
                currentChart.data.datasets.push({
                    label: `95% Confidence Upper`,
                    data: upperBandData,
                    borderColor: color + '20',
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderDash: [2, 4],
                    fill: false,
                    pointRadius: 0,
                    isAI: true
                });
                
                currentChart.data.datasets.push({
                    label: `95% Confidence Lower`,
                    data: lowerBandData,
                    borderColor: color + '08', // Very subtle fill
                    borderWidth: 1,
                    borderDash: [2, 4],
                    fill: '-1',
                    pointRadius: 0,
                    isAI: true
                });
            }
        }

        // Simple helper to calculate historical volatility
        function calculateHistoricalVolatility(data) {
            if (data.length < 2) return 0.01; // Default 1% daily volatility
            
            const returns = [];
            for (let i = 1; i < data.length; i++) {
                returns.push(Math.log(data[i] / data[i-1])); // Log returns (standard in finance)
            }
            
            const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
            const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
            
            return Math.sqrt(variance);
        }

        // Professional calculation helper functions
        function calculateVolatility(data) {
            if (data.length < 2) return 0.005;
            
            const returns = [];
            for (let i = 1; i < data.length; i++) {
                returns.push((data[i] - data[i-1]) / data[i-1]);
            }
            
            const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
            const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
            return Math.sqrt(variance);
        }

        function calculateTrend(data) {
            if (data.length < 2) return { direction: 0, strength: 0 };
            
            // Linear regression for trend
            const n = data.length;
            const indices = Array.from({length: n}, (_, i) => i);
            
            const sumX = indices.reduce((a, b) => a + b, 0);
            const sumY = data.reduce((a, b) => a + b, 0);
            const sumXY = indices.reduce((sum, x, i) => sum + x * data[i], 0);
            const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);
            
            const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
            const avgValue = sumY / n;
            const normalizedSlope = slope / avgValue;
            
            return {
                direction: Math.sign(slope),
                strength: Math.min(Math.abs(normalizedSlope), 0.01) // Cap at 1% per period
            };
        }

        function calculateMomentum(data) {
            if (data.length < 3) return 0;
            
            const recentPeriod = Math.min(3, Math.floor(data.length / 2));
            const recent = data.slice(-recentPeriod);
            const earlier = data.slice(-recentPeriod * 2, -recentPeriod);
            
            const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
            const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
            
            return (recentAvg - earlierAvg) / earlierAvg;
        }

        function calculateMeanReversion(data) {
            const mean = data.reduce((a, b) => a + b, 0) / data.length;
            const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
            const stdDev = Math.sqrt(variance);
            
            return { mean, stdDev };
        }

        function darkenColor(color, factor) {
            // Convert hex to RGB, darken, convert back
            const hex = color.replace('#', '');
            const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - factor));
            const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - factor));
            const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - factor));
            
            return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
        }

        function removeAIPredictions() {
            if (!currentChart) return;
            
            console.log('🤖 Removing Mathematical Analysis...');
            
            // Remove AI datasets
            currentChart.data.datasets = currentChart.data.datasets.filter(dataset => !dataset.isAI);
            
            // Restore original data
            if (currentHistoricalData) {
                const originalLabels = currentHistoricalData.map(item => {
                    const date = new Date(item.date);
                    const days = currentHistoricalData.length;
                    if (days <= 7) {
                        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    } else if (days <= 90) {
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    } else {
                        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                    }
                });
                
                currentChart.data.labels = originalLabels;
                currentChart.data.datasets[0].data = currentHistoricalData.map(item => item.rate);
            }
            
            // Remove AI summary
            const aiSummary = document.querySelector('.ai-summary');
            if (aiSummary) {
                aiSummary.remove();
            }
            
            currentChart.update();
            console.log('✅ Mathematical Analysis removed');
        }

        function showAIPredictionSummary() {
            if (!aiPredictionData) return;
            
            const trend = aiPredictionData.trend;
            const accuracy = aiPredictionData.accuracy;
            const firstForecast = aiPredictionData.forecast[0];
            const lastForecast = aiPredictionData.forecast[aiPredictionData.forecast.length - 1];
            
            const trendEmoji = trend === 'bullish' ? '📈' : trend === 'bearish' ? '📉' : '➡️';
            const trendColor = trend === 'bullish' ? '#34a853' : trend === 'bearish' ? '#ea4335' : '#9aa0a6';
            
            // Add AI summary to chart info
            const chartInfo = document.querySelector('.chart-info');
            if (chartInfo) {
                const existingSummary = chartInfo.querySelector('.ai-summary');
                if (existingSummary) {
                    existingSummary.remove();
                }
                
                const summaryDiv = document.createElement('div');
                summaryDiv.className = 'ai-summary';
                summaryDiv.style.cssText = `
                    background: linear-gradient(135deg, #f8f9fa, #e8f0fe);
                    border: 1px solid #dadce0;
                    border-radius: 8px;
                    padding: 16px;
                    margin-top: 16px;
                    text-align: center;
                `;
                
                summaryDiv.innerHTML = `
                    <!-- Professional disclaimer integrated naturally -->
                    <div style="
                        font-size: 0.7rem;
                        color: #9aa0a6;
                        text-align: center;
                        padding: 4px 0;
                        border-bottom: 1px solid #e8eaed;
                        margin-bottom: 12px;
                    ">
                        Statistical analysis • Informational purposes only
                    </div>
                        <div style="font-size: 0.875rem; color: #c62828; line-height: 1.5;">
                            These statistical projections demonstrate mathematical modeling techniques.<br>
                            They are <strong>NOT predictions</strong> and should <strong>NEVER</strong> be used for trading.<br>
                            Real markets are affected by news, events, and factors not captured here.<br>
                            <strong style="text-decoration: underline;">Always consult qualified financial advisors for investment decisions.</strong>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin: 0 0 8px 0; color: #1a73e8; font-size: 1.1rem;">📚 Multi-Currency Statistical Analysis</h4>

                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
                        <div style="display: flex; flex-direction: column; align-items: center;">
                            <span style="font-size: 24px; margin-bottom: 4px;">${trendEmoji}</span>
                            <span style="font-size: 0.75rem; color: #5f6368; text-transform: uppercase; letter-spacing: 0.5px;">7-Day Trend</span>
                            <span style="font-weight: 600; color: ${trendColor}; text-transform: capitalize;">${trend}</span>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center;">
                            <span style="font-size: 24px; margin-bottom: 4px;">🎯</span>
                            <span style="font-size: 0.75rem; color: #5f6368; text-transform: uppercase; letter-spacing: 0.5px;">Accuracy</span>
                            <span style="font-weight: 600; color: #1a73e8;">${accuracy.toFixed(0)}%</span>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center;">
                            <span style="font-size: 24px; margin-bottom: 4px;">📊</span>
                            <span style="font-size: 0.75rem; color: #5f6368; text-transform: uppercase; letter-spacing: 0.5px;">Algorithm</span>
                            <span style="font-weight: 600; color: #1a73e8;">Hybrid ML</span>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center;">
                            <span style="font-size: 24px; margin-bottom: 4px;">🔮</span>
                            <span style="font-size: 0.75rem; color: #5f6368; text-transform: uppercase; letter-spacing: 0.5px;">Next 7 Days</span>
                            <span style="font-weight: 600; color: #34a853;">${lastForecast.value.toFixed(4)}</span>
                        </div>
                    </div>
                `;
                
                chartInfo.appendChild(summaryDiv);
            }
            
            console.log('🤖 AI Summary displayed');
        }

        function showMultiCurrencyAISummary() {
            console.log('🚨 FUNCTION CALLED - showMultiCurrencyAISummary');
    
            if (!aiPredictionData) return;

            const homeCurrency = getCurrencyForCountry(homeCountry.name);
            if (!homeCurrency) return;

            console.log('- Active overlays in chart:', activeOverlays.map(o => o.currency));
            
            const mainTrend = aiPredictionData.main.trend;
            const mainAccuracy = aiPredictionData.main.accuracy;
            
            // Get destination currency dynamically
            const destCurrency = getCurrencyForCountry(destinationCountry.name);
            let bestCurrency = { name: destCurrency.code, trend: mainTrend, accuracy: mainAccuracy, change: 0 };
            let worstCurrency = { name: destCurrency.code, trend: mainTrend, accuracy: mainAccuracy, change: 0 };
            
            // Calculate trend changes for comparison
            const mainChange = calculateTrendChange(aiPredictionData.main);
            bestCurrency.change = mainChange;
            worstCurrency.change = mainChange;
            
            // Only use overlays that are actually visible/active
            activeOverlays.forEach(activeOverlay => {
                if (activeOverlay.visible) {
                    // Find matching prediction data
                    const matchingPrediction = aiPredictionData.overlays.find(pred => pred.currency === activeOverlay.currency);
                    
                    if (matchingPrediction) {
                        const change = calculateTrendChange(matchingPrediction.prediction);
                        if (change > bestCurrency.change) {
                            bestCurrency = { name: activeOverlay.currency, trend: matchingPrediction.prediction.trend, accuracy: matchingPrediction.prediction.accuracy, change };
                        }
                        if (change < worstCurrency.change) {
                            worstCurrency = { name: activeOverlay.currency, trend: matchingPrediction.prediction.trend, accuracy: matchingPrediction.prediction.accuracy, change };
                        }
                    }
                }
            });
            
            // Add enhanced AI summary
            const chartInfo = document.querySelector('.chart-info');
            if (chartInfo) {
                const existingSummary = chartInfo.querySelector('.ai-summary');
                if (existingSummary) {
                    existingSummary.remove();
                }
                
                const summaryDiv = document.createElement('div');
                summaryDiv.className = 'ai-summary';
                summaryDiv.style.cssText = `
                    background: linear-gradient(135deg, #f8f9fa, #e8f0fe);
                    border: 1px solid #dadce0;
                    border-radius: 12px;
                    padding: 20px;
                    margin-top: 16px;
                    text-align: center;
                `;
                
                const totalPairs = 1 + activeOverlays.filter(o => o.visible).length;
                
                summaryDiv.innerHTML = `
                    
                    
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin: 0 0 8px 0; color: #1a73e8; font-size: 1.1rem;">📚 Multi-Currency Educational Analysis</h4>
                        <p style="margin: 0; color: #5f6368; font-size: 0.875rem;">${totalPairs} currency pairs analyzed • Educational data patterns • For learning purposes only</p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
                        ${(() => {
                            const hasPositive = bestCurrency.change > 0;
                            const allNegative = bestCurrency.change <= 0 && worstCurrency.change <= 0;
                            
                            if (allNegative) {
                                // All negative - show "Least Risk" vs "Highest Risk"
                                return `
                                    <div style="padding: 12px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #1976d2;">
                                        <div style="font-size: 1.25rem; margin-bottom: 4px;">🛡️</div>
                                        <div style="font-size: 0.75rem; color: #1565c0; font-weight: 600; text-transform: uppercase;">LOWEST VOLATILITY</div>
                                        <div style="font-size: 1rem; font-weight: 600; color: #1565c0;">${homeCurrency.code} → ${bestCurrency.name}</div>
                                        <div style="font-size: 0.875rem; color: #1565c0;">${bestCurrency.change.toFixed(2)}% historical pattern</div>
                                    </div>
                                    
                                    <div style="padding: 12px; background: #fce8e6; border-radius: 8px; border-left: 4px solid #ea4335;">
                                        <div style="font-size: 1.25rem; margin-bottom: 4px;">⚠️</div>
                                        <div style="font-size: 0.75rem; color: #d93025; font-weight: 600; text-transform: uppercase;">HIGHEST VOLATILITY</div>
                                        <div style="font-size: 1rem; font-weight: 600; color: #d93025;">${homeCurrency.code} → ${worstCurrency.name}</div>
                                        <div style="font-size: 0.875rem; color: #d93025;">${worstCurrency.change.toFixed(2)}% historical pattern</div>
                                    </div>
                                `;
                            } else {
                                // Has positive - show "Best Opportunity" vs "Highest Risk"
                                return `
                                    <div style="padding: 12px; background: #e8f5e8; border-radius: 8px; border-left: 4px solid #34a853;">
                                        <div style="font-size: 1.25rem; margin-bottom: 4px;">📈</div>
                                        <div style="font-size: 0.75rem; color: #137333; font-weight: 600; text-transform: uppercase;">STRONGEST TREND</div>
                                        <div style="font-size: 1rem; font-weight: 600; color: #137333;">${homeCurrency.code} → ${bestCurrency.name}</div>
                                        <div style="font-size: 0.875rem; color: #137333;">+${bestCurrency.change.toFixed(2)}% historical pattern</div>
                                    </div>
                                    
                                    <div style="padding: 12px; background: #fce8e6; border-radius: 8px; border-left: 4px solid #ea4335;">
                                        <div style="font-size: 1.25rem; margin-bottom: 4px;">📉</div>
                                        <div style="font-size: 0.75rem; color: #d93025; font-weight: 600; text-transform: uppercase;">HIGHEST VOLATILITY</div>
                                        <div style="font-size: 1rem; font-weight: 600; color: #d93025;">${homeCurrency.code} → ${worstCurrency.name}</div>
                                        <div style="font-size: 0.875rem; color: #d93025;">${worstCurrency.change.toFixed(2)}% historical pattern</div>
                                    </div>
                                `;
                            }
                        })()}
                        
                        <div style="padding: 12px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #1a73e8;">
                            <div style="font-size: 1.25rem; margin-bottom: 4px;">🎯</div>
                            <div style="font-size: 0.75rem; color: #1565c0; font-weight: 600; text-transform: uppercase;">PATTERN CONSISTENCY</div>
                            <div style="font-size: 1rem; font-weight: 600; color: #1565c0;">${calculateAverageAccuracy().toFixed(0)}%</div>
                            <div style="font-size: 0.875rem; color: #1565c0;">Historical data analysis</div>
                        </div>

                        <div style="padding: 12px; background: #fff3e0; border-radius: 8px; border-left: 4px solid #f57c00;">
                            <div style="font-size: 1.25rem; margin-bottom: 4px;">🏦</div>
                            <div style="font-size: 0.75rem; color: #ef6c00; font-weight: 600; text-transform: uppercase;">Algorithm</div>
                            <div style="font-size: 1rem; font-weight: 600; color: #ef6c00;">Deterministic</div>
                            <div style="font-size: 0.875rem; color: #ef6c00;">Educational-grade</div>
                        </div>

                    </div>
                    
                    <div style="font-size: 0.75rem; color: #9aa0a6; font-style: italic;">
                        💡 Educational analysis • Updates automatically • For learning purposes only • Not financial advice
                    </div>
                `;
                
                chartInfo.appendChild(summaryDiv);
                
            }
                        
            console.log('🤖 Multi-currency AI summary displayed');
        }
        // Add Educational Context for Technical Indicators
        function showIndicatorEducationalInfo() {
            if (window.notificationManager) {
                notificationManager.showIndicatorEducationalInfo();
            } else {
                // Keep original implementation as fallback
                if (document.getElementById('indicatorEducationalInfo')) return;
                
                const chartInfo = document.querySelector('.chart-info');
                if (!chartInfo) return;
                
                const infoPanel = document.createElement('div');
                infoPanel.id = 'indicatorEducationalInfo';
                infoPanel.style.cssText = `
                    background: linear-gradient(135deg, #f0f4f8, #e2e8f0);
                    border: 1px solid #cbd5e0;
                    border-radius: 8px;
                    padding: 16px;
                    margin: 16px 0;
                    font-size: 0.875rem;
                `;
                
                infoPanel.innerHTML = `
                    <h4 style="color: #2d3748; margin-bottom: 12px;">📚 Understanding These Indicators (Educational Reference):</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px;">
                        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 3px solid #4285f4;">
                            <strong style="color: #4285f4;">📈 SMA (Simple Moving Average)</strong>
                            <p style="margin: 4px 0; color: #4a5568; font-size: 0.8rem;">
                                Shows average price over X days. When price is above SMA, it may indicate upward trend.
                                <br><em>Used by traders to identify trend direction.</em>
                            </p>
                        </div>
                        
                        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 3px solid #34a853;">
                            <strong style="color: #34a853;">📊 Bollinger Bands</strong>
                            <p style="margin: 4px 0; color: #4a5568; font-size: 0.8rem;">
                                Shows volatility range. Narrow bands = low volatility, Wide bands = high volatility.
                                <br><em>Helps identify overbought/oversold conditions.</em>
                            </p>
                        </div>
                        
                        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 3px solid #ea4335;">
                            <strong style="color: #ea4335;">⚡ RSI (Relative Strength Index)</strong>
                            <p style="margin: 4px 0; color: #4a5568; font-size: 0.8rem;">
                                Momentum indicator (0-100). Above 70 = potentially overbought, Below 30 = potentially oversold.
                                <br><em>Helps identify potential reversal points.</em>
                            </p>
                        </div>
                        
                        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 3px solid #fbbc04;">
                            <strong style="color: #fbbc04;">📉 Trend Projections</strong>
                            <p style="margin: 4px 0; color: #4a5568; font-size: 0.8rem;">
                                Mathematical extrapolation based on historical patterns. NOT predictions of future prices.
                                <br><em>For educational understanding only.</em>
                            </p>
                        </div>
                    </div>
                    
                    <div style="
                        background: #fff5f5;
                        border: 1px solid #feb2b2;
                        border-radius: 6px;
                        padding: 12px;
                        margin-top: 12px;
                        color: #c53030;
                        font-size: 0.8rem;
                    ">
                        <strong>⚠️ Educational Notice:</strong> These indicators are for learning purposes only. 
                        Real trading involves significant risk and requires professional knowledge, licenses, and consideration of many factors 
                        not shown here. This tool does not provide investment advice.
                    </div>
                `;
                
                chartInfo.appendChild(infoPanel);
            }
        }

        function calculateTrendChange(prediction) {
            return aiPredictions.calculateTrendChange(prediction);
        }

        function calculateAverageAccuracy() {
            if (!aiPredictionData) return 0;
            return aiPredictions.calculateAverageAccuracy(aiPredictionData.main, aiPredictionData.overlays);
        }

        // ============================================================================
        // DATA EXPORT OPERATIONS
        // ============================================================================

        /**
         * Export chart data in selected format
         */

        function exportChart() {
            if (!currentChart || !window.dataExportManager) {
                console.error('Chart or export manager not available');
                return;
            }
            
            // Prepare chart data for export
            const exportData = {
                labels: currentChart.data.labels,
                datasets: currentChart.data.datasets.map(dataset => ({
                    label: dataset.label,
                    data: dataset.data,
                    currency: dataset.currency || null
                }))
            };
            
            // Show export menu
            dataExportManager.showExportMenu(exportData);
        }

        // Export current conversions
        function exportConversions() {
            if (!window.dataExportManager || !destinationCountries || destinationCountries.length === 0) {
                console.error('No data to export');
                return;
            }
            
            const homeCurrency = getCurrencyForCountry(homeCountry.name);
            const amount = parseFloat(document.getElementById('globalAmount')?.value) || 1;
            
            // Prepare conversion data
            const conversions = destinationCountries.map(dest => {
                const currency = getCurrencyForCountry(dest.name);
                const currentRates = exchangeRateManager.getCurrentRates();
                const rate = currentRates?.[currency.code] || 1;
                
                return {
                    country: dest.name,
                    currency: currency,
                    rate: rate
                };
            });
            
            dataExportManager.exportConversions(conversions, homeCurrency, amount, 'csv');
        }

        // ============= MINI CALCULATOR WIDGET =============
        let calculatorComparisons = [];
        let calculatorMinimized = false;

        // Mobile Calculator Detection Wrapper
        function detectAndInitializeCalculator() {
            // Check if mobile using DeviceManager
            if (window.DeviceManager && (window.DeviceManager.isMobile || window.DeviceManager.screenWidth < 768)) {
                console.log('📱 Mobile detected - using mobile calculator');
                if (window.professionalCalculator) {
                    window.professionalCalculator.init();
                }
                // Hide desktop calculator
                const desktopCalc = document.getElementById('miniCalculator');
                if (desktopCalc) {
                    desktopCalc.style.display = 'none';
                }
            } else {
                console.log('💻 Desktop detected - using desktop calculator');
                // Use existing desktop calculator
                initializeCalculator();
            }
        }

        // Initialize calculator with current currencies
        function initializeCalculator() {
            if (homeCountry && destinationCountry) {
                const homeCurrency = getCurrencyForCountry(homeCountry.name);
                const destCurrency = getCurrencyForCountry(destinationCountry.name);
                
                document.getElementById('calcCurrency1').textContent = homeCurrency.code;
                document.getElementById('calcCurrency2').textContent = destCurrency.code;
                
                // Trigger initial calculation
                calculateConversion('from');
            }
        }
        
        // Calculate conversion
        // Calculate conversion
        function calculateConversion(direction) {
            const amount1Input = document.getElementById('calcAmount1');
            const amount2Input = document.getElementById('calcAmount2');
            const currency1 = document.getElementById('calcCurrency1').value;
            const currency2 = document.getElementById('calcCurrency2').value;
            
            // Get current exchange rate using the global function
            const rate = window.getExchangeRate ? window.getExchangeRate(currency1, currency2) : null;
            
            if (!rate) {
                console.warn('Exchange rate not available for', currency1, 'to', currency2);
                // Show "No rate" instead of stopping
                if (direction === 'from') {
                    amount2Input.value = 'No rate';
                } else {
                    amount1Input.value = 'No rate';
                }
                document.getElementById('calcRateInfo').textContent = 'Rate unavailable';
                return;
            }
            
            if (direction === 'from') {
                const amount1 = parseFloat(amount1Input.value) || 0;
                const amount2 = amount1 * rate;
                amount2Input.value = amount2.toFixed(2);
            } else {
                const amount2 = parseFloat(amount2Input.value) || 0;
                const amount1 = amount2 / rate;
                amount1Input.value = amount1.toFixed(2);
            }
            
            // Update rate display
            const rateInfo = document.getElementById('calcRateInfo');
            if (rateInfo) {
                rateInfo.textContent = `1 ${currency1} = ${rate.toFixed(4)} ${currency2}`;
            }
        }
        
        function swapCalculatorCurrencies() {
            const select1 = document.getElementById('calcCurrency1');
            const select2 = document.getElementById('calcCurrency2');
            const amount1 = document.getElementById('calcAmount1').value;
            
            // Swap values
            const temp = select1.value;
            select1.value = select2.value;
            select2.value = temp;
            
            // Recalculate
            document.getElementById('calcAmount1').value = amount1;
            calculateConversion('from');
        }
        
        // Get exchange rate between any two currencies
        function getExchangeRate(from, to) {
            // Check for same currency
            if (from === to) return 1;
            
            // First check if we have direct rate from exchangeRateManager
            if (window.exchangeRateManager) {
                const rates = exchangeRateManager.getCurrentRates();
                if (rates) {
                    // Check if we have the home currency as base
                    const homeCurrency = homeCountry ? getCurrencyForCountry(homeCountry.name) : null;
                    
                    if (homeCurrency && from === homeCurrency.code && rates[to]) {
                        return rates[to];
                    }
                    
                    // Try inverse rate
                    if (homeCurrency && to === homeCurrency.code && rates[from]) {
                        return 1 / rates[from];
                    }
                    
                    // Cross rate calculation if both currencies are in rates
                    if (rates[from] && rates[to]) {
                        return rates[to] / rates[from];
                    }
                }
            }
            
            // Fallback to stored conversion rate if it matches current selection
            if (homeCountry && destinationCountry) {
                const homeCurrency = getCurrencyForCountry(homeCountry.name);
                const destCurrency = getCurrencyForCountry(destinationCountry.name);
                
                if (from === homeCurrency.code && to === destCurrency.code) {
                    // Use the current stored rate
                    const currentRates = exchangeRateManager.getCurrentRates();
                    if (currentRates && currentRates[destCurrency.code]) {
                        return currentRates[destCurrency.code];
                    }
                } else if (from === destCurrency.code && to === homeCurrency.code) {
                    // Inverse of stored rate
                    const currentRates = exchangeRateManager.getCurrentRates();
                    if (currentRates && currentRates[destCurrency.code]) {
                        return 1 / currentRates[destCurrency.code];
                    }
                }
            }
            
            // NEVER return fake data - return null if no rate available
            console.warn(`No exchange rate available for ${from} to ${to}`);
            return null;
        }
        
        // Make it globally available for both calculators
        window.getExchangeRate = getExchangeRate;
        
        // Update rate display in calculator
        function updateCalculatorRateDisplay(from, to, rate) {
            const rateInfo = document.getElementById('calcRateInfo');
            const timestamp = document.getElementById('calcLastUpdate');
            
            rateInfo.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;
            
            // Show when rate was last updated
            const now = new Date();
            timestamp.textContent = `Updated: ${now.toLocaleTimeString()}`;
        }
        
        // Copy calculation to clipboard
        function copyCalculation() {
            const amount1 = document.getElementById('calcAmount1').value;
            const amount2 = document.getElementById('calcAmount2').value;
            const currency1 = document.getElementById('calcCurrency1').textContent;
            const currency2 = document.getElementById('calcCurrency2').textContent;
            
            const text = `${amount1} ${currency1} = ${amount2} ${currency2}`;
            
            navigator.clipboard.writeText(text).then(() => {
                // Show success feedback
                const btn = event.target;
                const originalText = btn.textContent;
                btn.textContent = '✓ Copied!';
                btn.style.background = 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
                
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy:', err);
                alert('Failed to copy to clipboard');
            });
        }
        
        
        
        // Add current calculation to comparison list
        function addToComparison() {
            const amount1 = document.getElementById('calcAmount1').value;
            const amount2 = document.getElementById('calcAmount2').value;
            const currency1 = document.getElementById('calcCurrency1').textContent;
            const currency2 = document.getElementById('calcCurrency2').textContent;
            
            const comparison = {
                id: Date.now(),
                from: `${amount1} ${currency1}`,
                to: `${amount2} ${currency2}`,
                rate: getExchangeRate(currency1, currency2)
            };
            
            calculatorComparisons.push(comparison);
            
            // Show comparisons section
            document.getElementById('calcComparisons').style.display = 'block';
            
            // Update display
            updateComparisonList();
            
            // Limit to 5 comparisons
            if (calculatorComparisons.length > 5) {
                calculatorComparisons.shift();
            }
        }
        
        // Update comparison list display
        function updateComparisonList() {
            const list = document.getElementById('comparisonList');
            
            list.innerHTML = calculatorComparisons.map(comp => `
                <div class="comparison-item">
                    <span>${comp.from} = ${comp.to}</span>
                    <span class="comparison-remove" onclick="removeComparison(${comp.id})">×</span>
                </div>
            `).join('');
        }
        
        // Remove comparison from list
        function removeComparison(id) {
            calculatorComparisons = calculatorComparisons.filter(c => c.id !== id);
            updateComparisonList();
            
            if (calculatorComparisons.length === 0) {
                document.getElementById('calcComparisons').style.display = 'none';
            }
        }
        
        // Toggle calculator minimize/maximize
        function toggleCalculator() {
            const widget = document.getElementById('miniCalculator');
            const minimizeBtn = widget.querySelector('.calculator-minimize');
            
            calculatorMinimized = !calculatorMinimized;
            
            if (calculatorMinimized) {
                widget.classList.add('minimized');
                minimizeBtn.textContent = '+';
            } else {
                widget.classList.remove('minimized');
                minimizeBtn.textContent = '−';
            }
        }
        
        // Make calculator draggable
        function makeCalculatorDraggable() {
            const widget = document.getElementById('miniCalculator');
            const header = widget.querySelector('.calculator-header');
            
            let isDragging = false;
            let currentX;
            let currentY;
            let initialX;
            let initialY;
            let xOffset = 0;
            let yOffset = 0;
            
            header.addEventListener('mousedown', dragStart);
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', dragEnd);
            
            function dragStart(e) {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
                
                if (e.target === header || e.target.parentElement === header) {
                    isDragging = true;
                }
            }
            
            function drag(e) {
                if (isDragging) {
                    e.preventDefault();
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                    
                    xOffset = currentX;
                    yOffset = currentY;
                    
                    widget.style.transform = `translate(${currentX}px, ${currentY}px)`;
                }
            }
            
            function dragEnd(e) {
                initialX = currentX;
                initialY = currentY;
                isDragging = false;
            }
        }
        
        // Professional Mobile-Optimized Calculator System
        class ProfessionalCalculator {
            constructor() {
                this.isInitialized = false;
                this.currentMode = null;
                this.exchangeRates = new Map();
                this.lastUpdate = null;
            }
            
            init() {
                if (this.isInitialized) return;
                
                // Determine display mode based on device
                if (window.DeviceManager.isMobile || window.DeviceManager.screenWidth < 768) {
                    this.initMobileCalculator();
                    this.currentMode = 'mobile';
                } else if (window.DeviceManager.isTablet) {
                    this.initTabletCalculator();
                    this.currentMode = 'tablet';
                } else {
                    this.initDesktopCalculator();
                    this.currentMode = 'desktop';
                }
                
                this.isInitialized = true;
                console.log(`💱 Calculator initialized in ${this.currentMode} mode`);
            }
            
            initMobileCalculator() {
                // Remove any existing desktop calculator
                const existingCalc = document.getElementById('miniCalculator');
                if (existingCalc) {
                    existingCalc.style.display = 'none';
                }
                
                // Create mobile-optimized bottom sheet calculator
                this.createMobileBottomSheet();
            }
            
            createMobileBottomSheet() {
                // Create toggle button (small, unobtrusive)
                const toggleBtn = document.createElement('div');
                toggleBtn.id = 'mobileCalcToggle';
                toggleBtn.className = 'mobile-calc-toggle';
                toggleBtn.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1.81.45 1.61 1.67 1.61 1.16 0 1.6-.64 1.6-1.39 0-.93-.53-1.28-2.05-1.84-1.86-.68-3.15-1.55-3.15-3.39 0-1.65 1.16-2.95 2.99-3.3V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.63-1.63-1.63-1.01 0-1.46.58-1.46 1.28 0 .64.45 1.02 1.8 1.47 1.96.68 3.28 1.46 3.28 3.56 0 1.74-1.09 3.04-2.88 3.37z"/>
                    </svg>
                `;
                
                // Create bottom sheet panel
                const bottomSheet = document.createElement('div');
                bottomSheet.id = 'mobileCalcSheet';
                bottomSheet.className = 'mobile-calc-sheet';
                bottomSheet.innerHTML = `
                    <div class="sheet-handle"></div>
                    <div class="sheet-header">
                        <h3>Quick Convert</h3>
                        <button class="sheet-close">×</button>
                    </div>
                    <div class="sheet-content">
                        <div class="calc-row">
                            <input type="number" id="mobileCalcFrom" class="calc-input" placeholder="0.00" inputmode="decimal">
                            <select id="mobileFromCurrency" class="calc-select">
                                ${this.generateCurrencyOptions()}
                            </select>
                        </div>
                        <button class="calc-swap-btn" aria-label="Swap currencies">⇄</button>
                        <div class="calc-row">
                            <input type="number" id="mobileCalcTo" class="calc-input" placeholder="0.00" inputmode="decimal" readonly>
                            <select id="mobileToCurrency" class="calc-select">
                                ${this.generateCurrencyOptions()}
                            </select>
                        </div>
                        <div class="rate-info">
                            <span id="mobileRateDisplay">Select currencies</span>
                            <span id="mobileLastUpdate"></span>
                        </div>
                    </div>
                `;
                
                // Add to DOM
                document.body.appendChild(toggleBtn);
                document.body.appendChild(bottomSheet);
                
                // Setup event handlers
                this.setupMobileEventHandlers();
            }
            
            generateCurrencyOptions() {
                // Use real currency data
                const majorCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY'];
                
                // Add current selected currencies first if available
                if (window.homeCountry) {
                    const homeCurrency = getCurrencyForCountry(window.homeCountry.name);
                    if (homeCurrency && !majorCurrencies.includes(homeCurrency.code)) {
                        majorCurrencies.unshift(homeCurrency.code);
                    }
                }
                
                if (window.destinationCountry) {
                    const destCurrency = getCurrencyForCountry(window.destinationCountry.name);
                    if (destCurrency && !majorCurrencies.includes(destCurrency.code)) {
                        majorCurrencies.splice(1, 0, destCurrency.code);
                    }
                }
                
                return majorCurrencies.map(code => 
                    `<option value="${code}">${code}</option>`
                ).join('');
            }
            
            setupMobileEventHandlers() {
                const toggleBtn = document.getElementById('mobileCalcToggle');
                const sheet = document.getElementById('mobileCalcSheet');
                const closeBtn = sheet.querySelector('.sheet-close');
                const swapBtn = sheet.querySelector('.calc-swap-btn');
                const fromInput = document.getElementById('mobileCalcFrom');
                const fromSelect = document.getElementById('mobileFromCurrency');
                const toSelect = document.getElementById('mobileToCurrency');
                
                // Toggle sheet
                toggleBtn.addEventListener('click', () => {
                    sheet.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    this.performCalculation();
                });
                
                // Close sheet
                closeBtn.addEventListener('click', () => {
                    sheet.classList.remove('active');
                    document.body.style.overflow = '';
                });
                
                // Swipe down to close
                let startY = 0;
                const handle = sheet.querySelector('.sheet-handle');
                
                handle.addEventListener('touchstart', (e) => {
                    startY = e.touches[0].clientY;
                });
                
                handle.addEventListener('touchmove', (e) => {
                    const currentY = e.touches[0].clientY;
                    const diff = currentY - startY;
                    
                    if (diff > 0) {
                        sheet.style.transform = `translateY(${diff}px)`;
                    }
                });
                
                handle.addEventListener('touchend', (e) => {
                    const currentY = e.changedTouches[0].clientY;
                    const diff = currentY - startY;
                    
                    if (diff > 100) {
                        sheet.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                    sheet.style.transform = '';
                });
                
                // Swap currencies
                swapBtn.addEventListener('click', () => {
                    const temp = fromSelect.value;
                    fromSelect.value = toSelect.value;
                    toSelect.value = temp;
                    this.performCalculation();
                });
                
                // Calculate on input
                fromInput.addEventListener('input', () => this.performCalculation());
                fromSelect.addEventListener('change', () => this.performCalculation());
                toSelect.addEventListener('change', () => this.performCalculation());
            }
            
            async performCalculation() {
                const amount = parseFloat(document.getElementById('mobileCalcFrom').value) || 0;
                const fromCurrency = document.getElementById('mobileFromCurrency').value;
                const toCurrency = document.getElementById('mobileToCurrency').value;
                const toInput = document.getElementById('mobileCalcTo');
                const rateDisplay = document.getElementById('mobileRateDisplay');
                const updateDisplay = document.getElementById('mobileLastUpdate');
                
                if (amount === 0) {
                    toInput.value = '0.00';
                    return;
                }
                
                // Get real exchange rate
                let rate = await this.getRealExchangeRate(fromCurrency, toCurrency);
                
                if (rate) {
                    const result = (amount * rate).toFixed(2);
                    toInput.value = result;
                    rateDisplay.textContent = `1 ${fromCurrency} = ${rate.toFixed(6)} ${toCurrency}`;
                    updateDisplay.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
                } else {
                    toInput.value = 'No rate available';
                    rateDisplay.textContent = 'Rate unavailable';
                }
            }
            
            async getRealExchangeRate(from, to) {
                // Check for same currency
                if (from === to) return 1;
                
                // Try to use the global getExchangeRate function first
                if (window.getExchangeRate) {
                    const rate = window.getExchangeRate(from, to);
                    if (rate !== null) {
                        return rate;
                    }
                }
                
                // If no cached rate, fetch fresh data
                if (window.exchangeRateManager) {
                    try {
                        console.log(`📡 Fetching fresh rate for ${from} to ${to}`);
                        
                        // Create a temporary currency object for the fetch
                        const tempCurrency = { 
                            code: from,
                            symbol: window.CURRENCY_SYMBOLS?.[from]?.symbol || from,
                            name: window.CURRENCY_SYMBOLS?.[from]?.name || from
                        };
                        
                        // Fetch fresh rates with 'from' as base
                        await exchangeRateManager.fetchExchangeRates(tempCurrency);
                        
                        // Get the newly fetched rates
                        const newRates = exchangeRateManager.getCurrentRates();
                        
                        // Check if we got the rate we need
                        if (newRates && newRates[to]) {
                            console.log(`✅ Got rate: 1 ${from} = ${newRates[to]} ${to}`);
                            return newRates[to];
                        }
                        
                        console.warn(`⚠️ Rate for ${to} not found in fetched data`);
                    } catch (error) {
                        console.error(`❌ Failed to fetch rate for ${from} to ${to}:`, error);
                    }
                }
                
                return null;
            }
            
            initDesktopCalculator() {
                // Keep existing desktop calculator
                const calc = document.getElementById('miniCalculator');
                if (calc) {
                    calc.style.display = 'block';
                    makeCalculatorDraggable();
                }
            }
            
            initTabletCalculator() {
                // Tablet uses desktop calculator but positioned differently
                this.initDesktopCalculator();
                const calc = document.getElementById('miniCalculator');
                if (calc) {
                    calc.style.right = '20px';
                    calc.style.bottom = '100px';
                }
            }
        }
        
        // Initialize professional calculator
        window.professionalCalculator = new ProfessionalCalculator();
        
        // Initialize when DOM ready
        //document.addEventListener('DOMContentLoaded', () => {
          //  setTimeout(() => {
          //      window.professionalCalculator.init();
          //  }, 500);
       // });

// Update calculator when countries change
const originalSelectCountryByName = selectCountryByName;
selectCountryByName = function(countryName, type, providedFeature = null) {
    originalSelectCountryByName(countryName, type, providedFeature);
    
    // Update calculator currencies
    setTimeout(() => {
        initializeCalculator();
    }, 500);
};
        
        // Clear Cache function (Button)
        window.clearAllCaches = function() {
            if (window.cacheManager) {
                // clearCache is already imported and handles everything
                clearCache(window.cacheManager);
            } else {
                console.error('Cache manager not available');
            }
        };

        // for better mobile experience
        if ('ontouchstart' in window) {
            // Enable better touch scrolling
            document.querySelectorAll('.scrollable-section').forEach(el => {
                el.style.scrollBehavior = 'smooth';
            });
            
            // Make map more responsive to touch
            const map = document.getElementById('worldMap');
            if (map) {
                let scale = 1;
                map.addEventListener('gesturechange', (e) => {
                    e.preventDefault();
                    scale = e.scale;
                    map.style.transform = `scale(${scale})`;
                });
            }
        }

        // Ensure calculator is properly initialized and positioned
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
                // Initialize appropriate calculator based on device
                if (window.DeviceManager && (window.DeviceManager.isMobile || window.DeviceManager.screenWidth < 768)) {
                    console.log('📱 Mobile detected - initializing mobile calculator');
                    if (window.professionalCalculator) {
                        window.professionalCalculator.init();
                    }
                    // Hide desktop calculator
                    const desktopCalc = document.getElementById('miniCalculator');
                    if (desktopCalc) {
                        desktopCalc.style.display = 'none';
                    }
                } else {
                    console.log('💻 Desktop detected - initializing desktop calculator');
                    // Ensure desktop calculator is in body
                    const calc = document.getElementById('miniCalculator');
                    if (calc && calc.parentElement.id === 'exchangeResult') {
                        document.body.appendChild(calc);
                        console.log('✅ Calculator moved to body');
                    }
                    // Initialize desktop calculator
                    initializeCalculator();
                    makeCalculatorDraggable();
                }
            }, 1000);
        });

        // Make functions globally available
        window.exportChart = exportChart;
        window.exportConversions = exportConversions;

        // Make functions globally available
        window.toggleIndicator = toggleIndicator;

        // Initialize the app when DOM is ready
        document.addEventListener('DOMContentLoaded', initApp);

        // Make functions globally accessible for HTML onclick events
        window.showCurrencySelector = showCurrencySelector;
        
       // Make API functions available for cache module
        window.fetchRealHistoricalData = fetchRealHistoricalData;

        // Make function globally available for map module
        window.selectCountryByClick = selectCountryByClick;

        // global exports:
        window.toggleAIPredictions = toggleAIPredictions;

        // Make deterministic functions globally available for AI and other modules
        window.createCurrencyPairHash = (...args) => historicalDataManager.createCurrencyPairHash(...args);
        window.seededRandom = (...args) => historicalDataManager.seededRandom(...args);
        window.createDateHash = (...args) => historicalDataManager.createDateHash(...args);
        window.createDeterministicVariation = (...args) => historicalDataManager.createDeterministicVariation(...args);
        window.showIndicatorEducationalInfo = showIndicatorEducationalInfo;
        window.updateAddDestinationButton = updateAddDestinationButton;
        window.updateDestinationsList = updateDestinationsList;
        window.showAmountController = showAmountController;
        window.updateMultipleExchangeRates = updateMultipleExchangeRates;
        window.showMultipleExchangeRates = showMultipleExchangeRates;
        window.showPremiumModal = (feature) => premiumFeaturesManager.showPremiumModal(feature);
        window.closePremiumModal = () => premiumFeaturesManager.closePremiumModal();
        window.upgradeToPremium = () => premiumFeaturesManager.upgradeToPremium();

