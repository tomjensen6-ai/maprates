/**
 * Country Map Manager - Photorealistic country maps with team locations
 */
console.log('🚀 CUSTOM FILE LOADED - 150 NEW VERSION!');
import { FLAG_MAP } from '../../config/constants.js';
export class CountryMapManager {
    constructor() {
        this.initialized = false;
        this.currentCountryMap = null;
        this.teamMarkers = [];
        this.mapContainer = null;
        this.globalCityPinManager = null;
        this.stadiumCoordinatesCache = {};
    }

    async initialize() {
        if (this.initialized) return;
        
        console.log('🗺️ CountryMapManager initializing...');

        if (!window.globalCityPinManager) {
            console.log('⏳ Waiting for GlobalCityPinManager...');
            await this.waitForGlobalManager();
        }
        this.globalCityPinManager = window.globalCityPinManager;
        this.initialized = true;
    }

    /**
     * Wait for GlobalCityPinManager to load
     */
    async waitForGlobalManager() {
        return new Promise((resolve) => {
            const checkManager = () => {
                if (window.globalCityPinManager) {
                    resolve();
                } else {
                    setTimeout(checkManager, 100);
                }
            };
            checkManager();
        });
    }

    /**
     * ENHANCED: Show detailed country map with automated team generation
     */
    async showCountryDetailMap(countryId, countryName, footballData) {
        console.log(`🗺️ Loading enhanced view for ${countryName} with global city pins`);
        console.log('📊 Football data:', footballData);
        
        // DEBUG: Let's see what's actually in the football data
        console.log('🔍 Debug football data structure:');
        console.log('- countryName:', footballData?.countryName);
        console.log('- league:', footballData?.league);
        console.log('- teams:', footballData?.teams);
        console.log('- teams length:', footballData?.teams?.length || 0);
        console.log('- hasLiveData:', footballData?.hasLiveData);
        console.log('- status:', footballData?.status);

        try {
            // Hide any existing tooltip first
            const existingTooltip = document.getElementById('football-tooltip');
            if (existingTooltip) {
                existingTooltip.remove();
            }

            // ENHANCED: Get teams using GlobalCityPinManager (AUTOMATED FOR ALL COUNTRIES)
            let teams = [];
            let dataSource = 'fallback';
            
            // PRIORITY: Use real API teams if available in footballData
            if (footballData?.teams && footballData.teams.length > 0) {
                console.log('🔴 Using REAL API teams from footballData...');
                teams = footballData.teams;
                dataSource = footballData.hasLiveData ? 'live' : 'static';
                console.log(`📊 Using ${teams.length} real API teams (${dataSource} data)`);
            } else if (this.globalCityPinManager) {
                console.log('🌍 Fallback to GlobalCityPinManager for team data...');
                teams = await this.globalCityPinManager.getAllTeamsForCountry(countryName);
                dataSource = teams.some(t => t.isLive) ? 'live' : 'synthetic';
                console.log(`📊 Retrieved ${teams.length} teams (${dataSource} data)`);
            } else {
                console.warn('⚠️ GlobalCityPinManager not available, using existing method');
                // Fall back to your existing getCountryMapData method
                const countryData = this.getCountryMapData(countryId, countryName);
                teams = countryData?.teams || this.getSampleTeams(countryName);
            }

            // Enhanced football data with automated teams
            const enhancedFootballData = {
                ...footballData,
                teams: teams,
                hasLiveData: teams.some(t => t.isLive),
                teamCount: teams.length,
                dataSource: dataSource
            };

            // Use your EXISTING createMapOverlay method but with enhanced data
            const mapOverlay = this.createMapOverlay(countryName, enhancedFootballData);
                document.body.appendChild(mapOverlay);

                // Make overlay visible immediately
                setTimeout(() => {
                    mapOverlay.style.opacity = '1';
                    mapOverlay.style.display = 'flex';
                    mapOverlay.style.visibility = 'visible';
                    console.log(`✅ Overlay made visible for ${countryName}`);
                }, 100);

                // Initialize map after visibility
                setTimeout(async () => {
                    await this.initializeCountryMap(countryId, countryName, enhancedFootballData, mapOverlay);
                }, 200);
            
            console.log(`✅ Enhanced country detail map shown for ${countryName} with ${teams.length} teams`);
            
        } catch (error) {
            console.error('❌ Error showing enhanced country detail:', error);
        }
    }

    /**
     * ENHANCED: Get teams with global city pin integration
     */
    async getEnhancedTeams(countryName) {
        // First try GlobalCityPinManager
        if (this.globalCityPinManager) {
            try {
                const teams = await this.globalCityPinManager.getAllTeamsForCountry(countryName);
                if (teams && teams.length > 0) {
                    return teams.map(team => ({
                        // Convert to your existing format
                        name: team.name,
                        city: team.city,
                        stadium: team.venue || team.stadium,
                        venue: team.venue || team.stadium,
                        capacity: team.capacity || 50000,
                        founded: team.founded || 1950,
                        colors: team.colors || ['#4CAF50', '#FFFFFF'],
                        coordinates: this.convertCoordinates(team.coordinates),
                        achievements: team.achievements || ['Professional Club'],
                        isLive: team.isLive || false,
                        website: team.website
                    }));
                }
            } catch (error) {
                console.log('Global manager failed, using existing teams:', error);
            }
        }
        
        // Fall back to your existing getSampleTeams method
        return this.getSampleTeams(countryName);
    }

    /**
     * Convert global coordinates to your map positioning format
     */
    convertCoordinates(coords) {
        if (!coords || !coords.lat || !coords.lng) {
            // Return random position if no coordinates
            return {
                x: Math.random() * 80 + 10, // 10-90%
                y: Math.random() * 80 + 10  // 10-90%
            };
        }
        
        // Simple coordinate-to-percentage conversion
        // In a real implementation, this would use proper map projection
        const x = Math.min(Math.max((coords.lng + 180) / 3.6, 10), 90);
        const y = Math.min(Math.max((90 - coords.lat) / 1.8, 10), 90);
        
        return { x, y };
    }

    /**
     * Create the detailed map interface
     */
    createDetailedMapInterface(countryData, footballData) {
        // Create overlay container
        const overlay = document.createElement('div');
        overlay.id = 'country-detail-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.95);
            z-index: 100000;
            display: flex;
            flex-direction: column;
        `;

        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        `;

        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-size: 32px;">${countryData.flag}</span>
                <div>
                    <h1 style="margin: 0; font-size: 24px; color: #4CAF50;">${countryData.name}</h1>
                    <div style="color: #B0BEC5; font-size: 14px;">⚽ ${footballData.league} • 🏟️ ${countryData.teams.length} Professional Teams</div>
                </div>
            </div>
            <button onclick="window.sportsApp.countryMapManager.hideCountryDetailMap()" 
                    style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); 
                           color: white; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px;">
                ✕ Close
            </button>
        `;

        // Create map container
        this.mapContainer = document.createElement('div');
        this.mapContainer.id = 'country-map-container';
        this.mapContainer.style.cssText = `
            flex: 1;
            position: relative;
            background: #1a1a1a;
            overflow: hidden;
        `;

        // Create team info sidebar
        const sidebar = this.createTeamSidebar(countryData, footballData);

        // Create main content area
        const mainContent = document.createElement('div');
        mainContent.style.cssText = `
            display: flex;
            flex: 1;
        `;

        mainContent.appendChild(this.mapContainer);
        mainContent.appendChild(sidebar);

        overlay.appendChild(header);
        overlay.appendChild(mainContent);
        document.body.appendChild(overlay);

        this.currentCountryMap = overlay;
    }

    /**
     * Create team information sidebar
     */
    createTeamSidebar(countryData, footballData) {
        const teams = footballData?.teams || countryData.teams || [];
        const liveTeamsCount = teams.filter(t => t.isLive).length;
        const syntheticTeamsCount = teams.filter(t => !t.isLive).length;
        const sidebar = document.createElement('div');
        sidebar.style.cssText = `
            width: 350px;
            background: linear-gradient(145deg, #1a1a2e, #16213e);
            color: white;
            overflow-y: auto;
            border-left: 1px solid rgba(255,255,255,0.1);
        `;
        // ENHANCED header with data source info:
        const headerInfo = `
            <div style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <h2 style="margin: 0 0 10px 0; color: #FFD700;">⚽ Professional Teams</h2>
                <div style="font-size: 14px; color: #B0BEC5;">
                    ${teams.length} teams in ${footballData.league}
                </div>
                ${liveTeamsCount > 0 || syntheticTeamsCount > 0 ? `
                    <div style="font-size: 12px; color: #95a5a6; margin-top: 5px;">
                        ${liveTeamsCount > 0 ? `✅ ${liveTeamsCount} Live API` : ''}
                        ${liveTeamsCount > 0 && syntheticTeamsCount > 0 ? ' • ' : ''}
                        ${syntheticTeamsCount > 0 ? `📍 ${syntheticTeamsCount} Cities` : ''}
                    </div>
                ` : ''}
            </div>
        `;

        const teamsHTML = (countryData.teams || []).map((team, index) => `
            <div class="team-card" onclick="window.sportsApp?.countryMapManager?.showTeamDetails({name: '${team.name}', stadium: '${team.stadium || team.venue || 'Stadium TBA'}', founded: '${team.founded || 'Unknown'}', website: '${team.website || '#'}'})"
                 style="padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer; transition: all 0.2s ease;"
                 onmouseover="this.style.background='rgba(76, 175, 80, 0.1)'" 
                 onmouseout="this.style.background='transparent'">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                    <div style="width: 40px; height: 40px; background: ${team.colors[0]}; border-radius: 50%; 
                                display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">
                        ${team.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h3 style="margin: 0; font-size: 16px; color: #4CAF50;">${team.name}</h3>
                        <div style="font-size: 12px; color: #B0BEC5;">${team.city} • ${team.founded}</div>
                    </div>
                </div>
                <div style="font-size: 13px; color: #E0E0E0; margin-bottom: 8px;">
                    🏟️ ${team.stadium} (${team.capacity.toLocaleString()})
                </div>
                <div style="font-size: 12px; color: #FFD700;">
                    🏆 ${team.achievements.length > 0 ? team.achievements[0] : 'Professional Club'}
                </div>
            </div>
        `).join('');

        sidebar.innerHTML = `
            <div style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <h2 style="margin: 0 0 10px 0; color: #FFD700;">⚽ Professional Teams</h2>
                <div style="font-size: 14px; color: #B0BEC5;">
                    ${countryData.teams.length} teams in ${footballData.league}
                </div>
            </div>
            <div style="overflow-y: auto; max-height: calc(100vh - 200px);">
                ${teamsHTML}
            </div>
        `;

        return sidebar;
    }

    /**
     * Load photorealistic satellite map
     */
    async loadPhotorealisticMap(countryData) {
        const mapElement = document.createElement('div');
        mapElement.style.cssText = `
            width: 100%;
            height: 100%;
            background-image: url('${countryData.satelliteImageUrl}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            position: relative;
        `;

        // Add loading indicator
        const loader = document.createElement('div');
        loader.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        `;
        loader.innerHTML = `
            <div style="font-size: 16px; margin-bottom: 10px;">🛰️ Loading Satellite View...</div>
            <div style="width: 200px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; overflow: hidden;">
                <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #4CAF50, #45a049); 
                           animation: loading 2s ease-in-out infinite;"></div>
            </div>
            <style>
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            </style>
        `;

        mapElement.appendChild(loader);
        this.mapContainer.appendChild(mapElement);

        // Simulate loading time and remove loader
        setTimeout(() => {
            if (loader.parentNode) {
                loader.remove();
            }
        }, 2000);
    }

    /**
     * Add team location markers to the map
     */
    // Use coordinates from multiple sources with WikiData geocoding
    let lat = team.coordinates?.lat || team.lat || team.latitude || team.stadium?.coordinates?.latitude;
    let lng = team.coordinates?.lng || team.lng || team.longitude || team.stadium?.coordinates?.longitude;

    console.log(`🔍 ${team.name} coordinate search:`, {
        'team.coordinates': team.coordinates,
        'team.lat': team.lat,
        'team.lng': team.lng,
        'detected lat': lat,
        'detected lng': lng
    });

    // If no coordinates, try geocoding the stadium
    if (!lat || !lng) {
        const venue = team.venue || team.stadium;
        if (venue) {
            console.log(`🌐 Attempting to geocode stadium: ${venue} for ${team.name}`);
            const geocodedCoords = await this.geocodeStadiumCoordinates(team.name, venue, countryName);
            
            if (geocodedCoords) {
                lat = geocodedCoords.latitude;
                lng = geocodedCoords.longitude;
                console.log(`📍 Using geocoded coordinates for ${team.name}: [${lat}, ${lng}]`);
            }
        }
    }

    // Final fallback to algorithmic positioning
    if (!lat || !lng) {
        const countryCenter = this.getCountryCenter(countryName);
        const angle = (index * 360 / teams.length) * (Math.PI / 180);
        const radius = 1.5;
        
        lat = countryCenter.lat + Math.cos(angle) * radius;
        lng = countryCenter.lng + Math.sin(angle) * radius;
        
        console.log(`📍 Using algorithmic coordinates for ${team.name} in ${countryName}: [${lat}, ${lng}]`);
    }

    /**
 * Enhanced status with global city pin info
 */
    getStatus() {
        return {
            initialized: this.initialized,
            hasActiveMap: !!this.currentCountryMap,
            markerCount: this.teamMarkers.length,
            hasGlobalManager: !!this.globalCityPinManager,
            globalManagerStatus: this.globalCityPinManager ? 'Available' : 'Not Available'
        };
    }

    /**
     * Show team tooltip on marker hover
     */
    showTeamTooltip(marker, team) {
        const tooltip = document.createElement('div');
        tooltip.id = 'team-marker-tooltip';
        tooltip.style.cssText = `
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            white-space: nowrap;
            z-index: 10001;
            margin-bottom: 5px;
        `;
        tooltip.textContent = `${team.name} - ${team.stadium}`;
        marker.appendChild(tooltip);
    }

    /**
     * Hide team tooltip
     */
    hideTeamTooltip() {
        const tooltip = document.getElementById('team-marker-tooltip');
        if (tooltip) tooltip.remove();
    }

    /**
     * Focus on specific team
     */
    focusTeam(teamIndex) {
        // Highlight the marker
        this.teamMarkers.forEach((marker, index) => {
            if (index === teamIndex) {
                marker.style.transform = 'translate(-50%, -50%) scale(2)';
                marker.style.zIndex = '10000';
                marker.style.animation = 'markerPulse 1s infinite';
            } else {
                marker.style.transform = 'translate(-50%, -50%) scale(1)';
                marker.style.zIndex = '1000';
                marker.style.animation = 'none';
            }
        });

        // Highlight team card in sidebar
        const teamCards = document.querySelectorAll('.team-card');
        teamCards.forEach((card, index) => {
            if (index === teamIndex) {
                card.style.background = 'rgba(76, 175, 80, 0.2)';
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                card.style.background = 'transparent';
            }
        });
    }

    /**
     * Hide the detailed country map
     */
    hideCountryDetailMap() {
        if (this.currentCountryMap) {
            this.currentCountryMap.remove();
            this.currentCountryMap = null;
        }
        this.teamMarkers = [];
        console.log('✅ Country detail map closed');
    }

    /**
     * Get country-specific map data (now loads from global database)
     */
    async getCountryMapData(countryCode, countryName) {
        try {
            console.log(`🔄 Loading global team data for ${countryCode}...`);
            
            // Use the global data manager
            const globalData = await window.globalDataManager.getCountryTeams(countryCode);
            
            if (!globalData || globalData.teams.length === 0) {
                console.log(`⚠️ No team data available for ${countryCode}`);
                return null;
            }

            console.log(`✅ Loaded ${globalData.teams.length} teams for ${countryName}`);
            return globalData;

        } catch (error) {
            console.error(`❌ Error loading team data for ${countryCode}:`, error);
            return null;
        }
    }

    /**
     * ENHANCED: Create map overlay with automated team data
     */
    createEnhancedMapOverlay(countryName, footballData) {
        const overlay = document.createElement('div');
        overlay.id = 'country-map-overlay';
        overlay.className = 'country-map-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #0f1419, #1a1f2e);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            opacity: 1;
            visibility: visible;
        `;

        const flag = this.getCountryFlag(countryName);
        const league = footballData?.league || 'National League';
        const teams = footballData?.teams || [];
        const liveTeamsCount = teams.filter(t => t.isLive).length;
        const syntheticTeamsCount = teams.filter(t => !t.isLive).length;
        
        overlay.innerHTML = `
            <!-- Enhanced Header with Data Source Info -->
            <div class="map-header" style="
                background: linear-gradient(135deg, #1a73e8, #4285f4);
                color: white;
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                z-index: 10001;
            ">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span style="font-size: 32px;">${flag}</span>
                    <div>
                        <h1 style="margin: 0; font-size: 24px;">${countryName}</h1>
                        <div style="opacity: 0.8; font-size: 14px;">
                            ⚽ ${league} • 🏟️ ${teams.length} Teams
                            ${liveTeamsCount > 0 ? ` • ✅ ${liveTeamsCount} Live` : ''}
                            ${syntheticTeamsCount > 0 ? ` • 📍 ${syntheticTeamsCount} Cities` : ''}
                        </div>
                    </div>
                </div>
                
                <button onclick="window.countryMapManager?.closeDetailMap() || document.getElementById('country-map-overlay')?.remove()" style="
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 16px;
                ">✕ Close</button>
            </div>
            
            <!-- Enhanced Map Container -->
            <div class="country-map-container" style="
                flex: 1;
                display: flex;
                position: relative;
                overflow: hidden;
                background: #1a1f2e;
            ">
                <!-- Main Map Area (70% width) -->
                <div id="main-map-area" style="
                    width: 70%;
                    height: 100%;
                    position: relative;
                    <!-- background: url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80') center/cover; -->
                    overflow: hidden;
                ">
                    <div class="country-label" style="
                        position: absolute;
                        top: 20px;
                        left: 20px;
                        color: #ecf0f1;
                        font-size: 24px;
                        font-weight: bold;
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                        z-index: 10;
                    ">${countryName}</div>
                    
                    <!-- Team Pins Container (THIS IS THE MISSING PIECE!) -->
                    <div id="team-pins-container" style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        z-index: 100;
                    "></div>
                </div>
                
                <!-- Team Sidebar (30% width) -->
                <div class="team-sidebar" style="
                    width: 30%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(10px);
                    border-left: 1px solid rgba(255, 255, 255, 0.1);
                    overflow-y: auto;
                    padding: 20px;
                ">
                    <h3 style="color: #ecf0f1; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                        ${countryName} Teams
                    </h3>
                    <div id="teams-list-container">
                        <!-- Teams will be populated by JavaScript -->
                    </div>
                </div>
            </div>
        `;

        // Make overlay visible
        setTimeout(() => {
            overlay.style.opacity = '1';
            overlay.style.display = 'flex';
            overlay.style.visibility = 'visible';
            console.log(`✅ Overlay made visible for ${countryName}`);
        }, 100);

        return overlay;
    }

    /**
     * Get country-specific map data and team locations
     */
    getCountryMapData(countryCode, countryName) {
        const countryData = {
            // MAJOR FOOTBALL COUNTRIES WITH DETAILED DATA
            'ES': {
                name: 'Spain',
                flag: '🇪🇸',
                satelliteImageUrl: 'https://images.unsplash.com/photo-1539650116574-75c0c6d89380?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                teams: [
                    {
                        name: 'Real Madrid CF',
                        city: 'Madrid',
                        stadium: 'Santiago Bernabéu',
                        capacity: 81044,
                        founded: 1902,
                        colors: ['#FFFFFF', '#FFD700'],
                        coordinates: { x: 49.5, y: 39.5 },
                        achievements: ['14 UEFA Champions League titles', '35 La Liga titles']
                    },
                    {
                        name: 'FC Barcelona',
                        city: 'Barcelona',
                        stadium: 'Camp Nou',
                        capacity: 99354,
                        founded: 1899,
                        colors: ['#004D98', '#FCBF49'],
                        coordinates: { x: 72.5, y: 32.0 },
                        achievements: ['5 UEFA Champions League titles', '27 La Liga titles']
                    },
                    {
                        name: 'Atlético Madrid',
                        city: 'Madrid',
                        stadium: 'Cívitas Metropolitano',
                        capacity: 68456,
                        founded: 1903,
                        colors: ['#CE2029', '#FFFFFF'],
                        coordinates: { x: 49.8, y: 39.8 },
                        achievements: ['3 Europa League titles', '11 La Liga titles']
                    },
                    {
                        name: 'Sevilla FC',
                        city: 'Sevilla',
                        stadium: 'Ramón Sánchez Pizjuán',
                        capacity: 43883,
                        founded: 1890,
                        colors: ['#FFFFFF', '#D50000'],
                        coordinates: { x: 29.5, y: 67.0 },
                        achievements: ['7 Europa League titles', '1 La Liga title']
                    },
                    {
                        name: 'Valencia CF',
                        city: 'Valencia',
                        stadium: 'Mestalla',
                        capacity: 49430,
                        founded: 1919,
                        colors: ['#FF8C00', '#000000'],
                        coordinates: { x: 61.0, y: 47.5 },
                        achievements: ['1 UEFA Cup', '6 La Liga titles']
                    },
                    {
                        name: 'Athletic Club',
                        city: 'Bilbao',
                        stadium: 'San Mamés',
                        capacity: 53289,
                        founded: 1898,
                        colors: ['#EE2737', '#FFFFFF'],
                        coordinates: { x: 41.0, y: 18.5 },
                        achievements: ['8 La Liga titles', '24 Copa del Rey']
                    }
                ]
            },

            'GB': {
                name: 'United Kingdom',
                flag: '🇬🇧',
                satelliteImageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                teams: [
                    {
                        name: 'Manchester United',
                        city: 'Manchester',
                        stadium: 'Old Trafford',
                        capacity: 74140,
                        founded: 1878,
                        colors: ['#DA020E', '#FBE122'],
                        coordinates: { x: 48.5, y: 42.0 },
                        achievements: ['3 UEFA Champions League', '20 Premier League titles']
                    },
                    {
                        name: 'Liverpool FC',
                        city: 'Liverpool',
                        stadium: 'Anfield',
                        capacity: 53394,
                        founded: 1892,
                        colors: ['#C8102E', '#F6EB61'],
                        coordinates: { x: 45.0, y: 42.5 },
                        achievements: ['6 UEFA Champions League', '19 League titles']
                    },
                    {
                        name: 'Manchester City',
                        city: 'Manchester',
                        stadium: 'Etihad Stadium',
                        capacity: 55017,
                        founded: 1880,
                        colors: ['#6CABDD', '#1C2C5B'],
                        coordinates: { x: 48.8, y: 42.3 },
                        achievements: ['1 UEFA Champions League', '10 Premier League titles']
                    },
                    {
                        name: 'Arsenal FC',
                        city: 'London',
                        stadium: 'Emirates Stadium',
                        capacity: 60704,
                        founded: 1886,
                        colors: ['#EF0107', '#9C824A'],
                        coordinates: { x: 52.0, y: 58.5 },
                        achievements: ['13 FA Cups', '13 League titles']
                    },
                    {
                        name: 'Chelsea FC',
                        city: 'London',
                        stadium: 'Stamford Bridge',
                        capacity: 40341,
                        founded: 1905,
                        colors: ['#034694', '#6A7FDB'],
                        coordinates: { x: 51.8, y: 59.0 },
                        achievements: ['2 UEFA Champions League', '6 Premier League titles']
                    },
                    {
                        name: 'Tottenham Hotspur',
                        city: 'London',
                        stadium: 'Tottenham Hotspur Stadium',
                        capacity: 62850,
                        founded: 1882,
                        colors: ['#132257', '#FFFFFF'],
                        coordinates: { x: 52.2, y: 58.2 },
                        achievements: ['2 League titles', '8 FA Cups']
                    }
                ]
            },

            'DE': {
                name: 'Germany',
                flag: '🇩🇪',
                satelliteImageUrl: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                teams: [
                    {
                        name: 'Bayern Munich',
                        city: 'Munich',
                        stadium: 'Allianz Arena',
                        capacity: 75024,
                        founded: 1900,
                        colors: ['#DC052D', '#0066B2'],
                        coordinates: { x: 61.0, y: 69.0 },
                        achievements: ['6 UEFA Champions League', '33 Bundesliga titles']
                    },
                    {
                        name: 'Borussia Dortmund',
                        city: 'Dortmund',
                        stadium: 'Signal Iduna Park',
                        capacity: 81365,
                        founded: 1909,
                        colors: ['#FDE100', '#000000'],
                        coordinates: { x: 52.0, y: 50.5 },
                        achievements: ['1 UEFA Champions League', '8 Bundesliga titles']
                    },
                    {
                        name: 'RB Leipzig',
                        city: 'Leipzig',
                        stadium: 'Red Bull Arena',
                        capacity: 47069,
                        founded: 2009,
                        colors: ['#DD0741', '#FFFFFF'],
                        coordinates: { x: 63.5, y: 47.0 },
                        achievements: ['DFB-Pokal finalist', 'Bundesliga runners-up']
                    },
                    {
                        name: 'Bayer Leverkusen',
                        city: 'Leverkusen',
                        stadium: 'BayArena',
                        capacity: 30210,
                        founded: 1904,
                        colors: ['#E32221', '#000000'],
                        coordinates: { x: 50.5, y: 48.5 },
                        achievements: ['1 UEFA Cup', 'Multiple Bundesliga runners-up']
                    }
                ]
            },

            'BR': {
                name: 'Brazil',
                flag: '🇧🇷',
                satelliteImageUrl: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                teams: [
                    {
                        name: 'Flamengo',
                        city: 'Rio de Janeiro',
                        stadium: 'Maracanã',
                        capacity: 78838,
                        founded: 1895,
                        colors: ['#E31837', '#000000'],
                        coordinates: { x: 82.0, y: 55.0 },
                        achievements: ['3 Copa Libertadores', '8 Brasileirão titles']
                    },
                    {
                        name: 'Santos FC',
                        city: 'Santos',
                        stadium: 'Vila Belmiro',
                        capacity: 16068,
                        founded: 1912,
                        colors: ['#FFFFFF', '#000000'],
                        coordinates: { x: 75.0, y: 58.0 },
                        achievements: ['3 Copa Libertadores', '8 Brasileirão titles']
                    },
                    {
                        name: 'São Paulo FC',
                        city: 'São Paulo',
                        stadium: 'Morumbi',
                        capacity: 67428,
                        founded: 1930,
                        colors: ['#FFFFFF', '#FF0000'],
                        coordinates: { x: 74.0, y: 57.0 },
                        achievements: ['3 Copa Libertadores', '6 Brasileirão titles']
                    },
                    {
                        name: 'Palmeiras',
                        city: 'São Paulo',
                        stadium: 'Allianz Parque',
                        capacity: 43713,
                        founded: 1914,
                        colors: ['#006B3F', '#FFFFFF'],
                        coordinates: { x: 73.8, y: 57.2 },
                        achievements: ['3 Copa Libertadores', '11 Brasileirão titles']
                    }
                ]
            },

            // DEFAULT for countries without detailed data
            'default': {
                name: countryName,
                flag: '🌍',
                satelliteImageUrl: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                teams: [
                    {
                        name: `${countryName} FC`,
                        city: 'Capital City',
                        stadium: 'National Stadium',
                        capacity: 50000,
                        founded: 1950,
                        colors: ['#4CAF50', '#FFFFFF'],
                        coordinates: { x: 50, y: 50 },
                        achievements: ['National Champions']
                    },
                    {
                        name: `${countryName} United`,
                        city: 'Major City',
                        stadium: 'City Stadium',
                        capacity: 35000,
                        founded: 1960,
                        colors: ['#2196F3', '#FFFFFF'],
                        coordinates: { x: 60, y: 40 },
                        achievements: ['Cup Winners']
                    }
                ]
            }
        };

        return countryData[countryCode] || countryData['default'];
    }

    getStatus() {
        return {
            initialized: this.initialized,
            hasActiveMap: !!this.currentCountryMap,
            markerCount: this.teamMarkers.length
        };
    }

    createFootballModal() {
        const modal = document.createElement('div');
        modal.id = 'football-detail-modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            z-index: 10000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.8);
        `;

        modal.innerHTML = `
            <div class="modal-content" style="
                background-color: #1a1a2e;
                margin: 5% auto;
                padding: 0;
                border-radius: 15px;
                width: 80%;
                max-width: 800px;
                color: white;
                box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
                max-height: 80vh;
                overflow-y: auto;
            ">
                <div class="modal-header" style="
                    background: linear-gradient(135deg, #1a73e8, #4285f4);
                    padding: 20px;
                    border-radius: 15px 15px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <h2 style="margin: 0; color: white;">Football Details</h2>
                    <span class="close-modal" style="
                        color: white;
                        font-size: 28px;
                        font-weight: bold;
                        cursor: pointer;
                        background: rgba(255,255,255,0.2);
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    " onclick="this.closest('#football-detail-modal').style.display='none'; document.body.style.overflow='';">&times;</span>
                </div>
                <div class="modal-body" style="padding: 30px;">
                    <!-- Content will be populated here -->
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });

        return modal;
    }

    generateFootballContent(countryName, footballData) {
        const flag = this.getCountryFlag(countryName);
        const league = footballData?.league || 'National League';
        const status = footballData?.status || '📊 STATIC INFO';
        const isLive = footballData?.isLive || false;

        return `
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 60px; margin-bottom: 15px;">${flag}</div>
                <h1 style="margin: 0; color: #4CAF50; font-size: 32px;">${countryName}</h1>
                <p style="color: #B0BEC5; margin: 10px 0;">${status}</p>
            </div>

            <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 25px; margin-bottom: 25px;">
                <h3 style="color: #4CAF50; margin-top: 0;">🏆 League Information</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
                    <div>
                        <strong>Primary League:</strong><br>
                        <span style="color: #4CAF50;">${league}</span>
                    </div>
                    <div>
                        <strong>Data Type:</strong><br>
                        <span style="color: ${isLive ? '#4CAF50' : '#FF9800'};">${isLive ? '🔴 Live Data' : '📚 Historical'}</span>
                    </div>
                </div>
            </div>

            ${isLive && footballData.currentLeader ? `
                <div style="background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3); border-radius: 10px; padding: 25px; margin-bottom: 25px;">
                    <h3 style="color: #4CAF50; margin-top: 0;">🏆 Current League Leader</h3>
                    <div style="font-size: 24px; font-weight: bold; color: #4CAF50; margin: 15px 0;">
                        ${footballData.currentLeader}
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0;">
                        <div style="text-align: center;">
                            <div style="font-size: 20px; color: #4CAF50;">${footballData.points}</div>
                            <small>Points</small>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 20px; color: #4CAF50;">${footballData.played}</div>
                            <small>Played</small>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 20px; color: #4CAF50;">${footballData.won}</div>
                            <small>Won</small>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 20px; color: #4CAF50;">${footballData.goalDifference}</div>
                            <small>Goal Diff</small>
                        </div>
                    </div>
                    <small style="color: #B0BEC5;">Last updated: ${footballData.lastUpdated}</small>
                </div>
            ` : `
                <div style="background: rgba(255, 152, 0, 0.1); border: 1px solid rgba(255, 152, 0, 0.3); border-radius: 10px; padding: 25px; margin-bottom: 25px;">
                    <h3 style="color: #FF9800; margin-top: 0;">📚 Historical Information</h3>
                    <p>This country has rich football heritage. Live league data and detailed statistics are available with premium features.</p>
                    <div style="margin-top: 20px;">
                        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin: 10px 0;">
                            <strong>🏟️ Stadium Information</strong> - Premium Feature
                        </div>
                        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin: 10px 0;">
                            <strong>📊 Team Statistics</strong> - Premium Feature  
                        </div>
                        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin: 10px 0;">
                            <strong>🏆 Historical Records</strong> - Premium Feature
                        </div>
                    </div>
                </div>
            `}

            <div style="text-align: center; padding-top: 20px;">
                <button onclick="alert('Premium features coming soon! 🚀')" style="
                    background: linear-gradient(135deg, #4CAF50, #45a049);
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 25px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: transform 0.2s ease;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    ⭐ Unlock Premium Features
                </button>
            </div>
        `;
    }

    getCountryFlag(countryName) {
        // Use your existing FLAG_MAP from constants.js
        return FLAG_MAP[countryName] || '🏴';
    }

    createMapOverlay(countryName, footballData) {
        const overlay = document.createElement('div');
        overlay.id = 'country-map-overlay';
        overlay.className = 'country-map-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #0f1419, #1a1f2e);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        const flag = this.getCountryFlag(countryName);
        const league = footballData?.league || 'National League';
        const teams = footballData?.teams || [];
        const isLiveData = footballData?.hasLiveData || false;
        
        // Create sample team data if none exists
        const sampleTeams = teams.length > 0 ? teams : this.getSampleTeams(countryName);
        
        overlay.innerHTML = `
            <!-- Leaflet CSS and JS -->
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            
            <!-- Header Bar -->
            <div class="map-header" style="
                background: linear-gradient(135deg, #1a73e8, #4285f4);
                color: white;
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                z-index: 10001;
            ">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span style="font-size: 32px;">${flag}</span>
                    <div>
                        <h1 style="margin: 0; font-size: 24px;">${countryName}</h1>
                        <div style="opacity: 0.8; font-size: 14px;">⚽ ${league} • 🏟️ ${sampleTeams.length} Teams</div>
                    </div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button class="map-controls-btn" onclick="window.countryMapManager.resetMapView()" style="
                        background: rgba(255,255,255,0.2);
                        border: 1px solid rgba(255,255,255,0.3);
                        color: white;
                        padding: 8px 12px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                    ">🎯 Reset View</button>
                    
                    <button class="close-map-btn" onclick="window.countryMapManager.closeDetailMap()" style="
                        background: rgba(255,255,255,0.2);
                        border: 1px solid rgba(255,255,255,0.3);
                        color: white;
                        padding: 8px 12px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 16px;
                    ">✕ Close</button>
                </div>
            </div>
            
            <!-- Real Interactive Map Container -->
            <div class="country-map-container" id="country-map-container" style="
                flex: 1;
                position: relative;
                overflow: hidden;
                background: #1a1f2e;
            ">
                <div id="leaflet-map" style="width: 100%; height: 100%;"></div>
                
                <div class="map-loading" id="map-loading" style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: white;
                    font-size: 18px;
                    z-index: 10002;
                    background: rgba(0,0,0,0.8);
                    padding: 20px;
                    border-radius: 12px;
                ">
                    <div style="text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 20px;">🗺️</div>
                        <div>Loading ${countryName} satellite map...</div>
                        <div style="font-size: 14px; opacity: 0.7; margin-top: 10px;">Preparing team locations</div>
                    </div>
                </div>
            </div>
            
            <!-- Enhanced Info Sidebar -->
            <div class="info-sidebar" style="
                position: absolute;
                top: 80px;
                right: 20px;
                width: 320px;
                background: rgba(26, 31, 46, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 12px;
                padding: 20px;
                border: 1px solid rgba(255,255,255,0.1);
                max-height: calc(100vh - 120px);
                overflow-y: auto;
                z-index: 10001;
            ">
                <h3 style="margin: 0 0 15px 0; color: #4CAF50;">📊 League Information</h3>
                <div style="color: white; margin-bottom: 15px;">
                    <strong>League:</strong> ${league}<br>
                    <strong>Teams:</strong> ${sampleTeams.length}<br>
                    <strong>Status:</strong> ${footballData?.status || 'Static Info'}<br>
                    <strong>Data Type:</strong> ${isLiveData ? '🔴 Live Data' : '🛰️ Satellite View'}
                </div>
                
                ${footballData?.currentLeader ? `
                    <div style="background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3); border-radius: 8px; padding: 15px; margin: 15px 0;">
                        <h4 style="margin: 0 0 10px 0; color: #4CAF50;">🏆 Current Leader</h4>
                        <div style="color: white;">
                            <strong>${footballData.currentLeader}</strong><br>
                            Points: ${footballData.points} | Played: ${footballData.played}
                        </div>
                    </div>
                ` : ''}
                
                <div style="margin-top: 20px;">
                    <h4 style="color: #4CAF50; margin-bottom: 10px;">🏟️ Stadium Locations</h4>
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${sampleTeams.slice(0, 8).map((team, index) => `
                            <div onclick="window.countryMapManager.focusOnTeam(${index})" style="
                                background: rgba(255,255,255,0.05);
                                margin: 5px 0;
                                padding: 8px 12px;
                                border-radius: 6px;
                                color: white;
                                font-size: 14px;
                                cursor: pointer;
                                transition: all 0.2s ease;
                            " onmouseover="this.style.background='rgba(76, 175, 80, 0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                                <strong>${team.name}</strong>
                                ${team.venue ? `<br><small>🏟️ ${team.venue}</small>` : ''}
                                <small style="color: #4CAF50; float: right;">📍 View</small>
                            </div>
                        `).join('')}
                    </div>
                    <div style="color: rgba(255,255,255,0.6); font-size: 12px; margin-top: 10px;">
                        Click team names to focus on map
                    </div>
                </div>
                
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                        <button onclick="window.countryMapManager.toggleMapStyle()" style="
                            background: linear-gradient(45deg, #2196F3, #1976D2);
                            color: white;
                            border: none;
                            padding: 8px;
                            border-radius: 6px;
                            font-size: 12px;
                            cursor: pointer;
                        ">🛰️ Satellite</button>
                        
                        <button onclick="window.countryMapManager.showTeamRoutes()" style="
                            background: linear-gradient(45deg, #FF9800, #F57C00);
                            color: white;
                            border: none;
                            padding: 8px;
                            border-radius: 6px;
                            font-size: 12px;
                            cursor: pointer;
                        ">🗺️ Routes</button>
                    </div>
                </div>
                
                <button onclick="alert('Premium features: Live match tracking, stadium tours, travel planning!')" style="
                    width: 100%;
                    background: linear-gradient(135deg, #4CAF50, #45a049);
                    color: white;
                    border: none;
                    padding: 12px;
                    border-radius: 8px;
                    font-weight: bold;
                    cursor: pointer;
                    margin-top: 15px;
                ">⭐ Upgrade to Premium</button>
            </div>
        `;
        // Make overlay visible
        setTimeout(() => {
            overlay.style.opacity = '1';
            overlay.style.display = 'flex';
            overlay.style.visibility = 'visible';
            console.log(`✅ Overlay made visible for ${countryName}`);
        }, 100);

        return overlay;
    }

    // initialize the actual map:
    async initializeCountryMap(countryId, countryName, footballData, overlay) {
        console.log(`🗺️ Initializing Leaflet map for ${countryName}`);
        
        try {
            const teams = footballData?.teams || [];
            
            // Load Leaflet library first
            await this.loadLeafletLibrary();
            
            // Find the correct map container
            const mapContainer = document.getElementById('leaflet-map');
            if (!mapContainer) {
                console.error('❌ Leaflet map container not found');
                return await this.initializeFallbackMap(teams, countryName);
            }
            
            // Clear any existing map
            mapContainer.innerHTML = '';
            
            // Initialize Leaflet map
            const coords = this.getCountryCoordinates(countryName);
            const map = L.map('leaflet-map').setView([coords.lat, coords.lng], coords.zoom);
            
            // Remove loading popup after map loads
            setTimeout(() => {
                const loadingElement = document.getElementById('map-loading');
                if (loadingElement) {
                    loadingElement.remove();
                    console.log('✅ Loading popup removed');
                }
            }, 1000);

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
            // Add team markers
            this.addTeamMarkers(map, teams, countryName);

            // Populate team sidebar
            setTimeout(() => {
                this.createSimpleTeamList(teams, countryName);
            }, 1200);
            
            // Store map reference
            this.currentMap = map;
            
            console.log(`✅ Leaflet map initialized for ${countryName}`);
            return true;
            
        } catch (error) {
            console.error('❌ Error initializing Leaflet map:', error);
            return await this.initializeFallbackMap(teams, countryName);
        }
    }

    async getCountryFeatureFromWorldData(countryName) {
        console.log(`🔍 Looking for geodata for ${countryName}`);
        
        // Access the converted GeoJSON data directly from the global scope
        // Based on your logs, the data exists after topojson.feature conversion
        
        // Try multiple possible global locations where the converted data might be stored
        const possibleDataSources = [
            window.geoJsonFeatures,
            window.convertedMapData,
            window.currentMapFeatures,
            window.mapFeatures
        ];
        
        for (const dataSource of possibleDataSources) {
            if (dataSource && Array.isArray(dataSource)) {
                console.log(`✅ Found ${dataSource.length} features in data source`);
                
                const countryFeature = dataSource.find(feature => {
                    const props = feature.properties;
                    return props.NAME === countryName || 
                        props.NAME_EN === countryName ||
                        props.ADMIN === countryName ||
                        props.NAME_LONG === countryName;
                });
                
                if (countryFeature) {
                    console.log(`✅ Found geodata for ${countryName}`);
                    return countryFeature;
                }
            }
        }
        
        console.log(`❌ No geodata found for ${countryName}`);
        return null;
    }

    async renderProfessionalCountryMap(countryFeature, teams, countryName) {
        // Load D3 if not available
        if (typeof d3 === 'undefined') {
            await this.loadD3Library();
        }
        const mapArea = document.getElementById('main-map-area');
        if (!mapArea) return false;
        
        // Use your existing D3 setup from mapManager.js
        const svg = d3.select(mapArea)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%');
        
        // Use your existing projection but fit to country bounds
        const projection = d3.geoNaturalEarth1()
            .fitSize([mapArea.clientWidth, mapArea.clientHeight], countryFeature);
        
        const path = d3.geoPath().projection(projection);
        
        // Render the country shape
        svg.append('path')
            .datum(countryFeature)
            .attr('d', path)
            .attr('fill', '#2c3e50')
            .attr('stroke', '#ecf0f1')
            .attr('stroke-width', 2);
        
        // Add team markers using real coordinates
        this.addRealTeamMarkers(svg, projection, teams);
        
        return true;
    }

    async loadD3Library() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://d3js.org/d3.v7.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    addRealTeamMarkers(svg, projection, teams) {
        teams.forEach((team, index) => {
            // Get country center as fallback for team coordinates
            const countryCenter = svg.select('path').node().getBBox();
            const centerX = countryCenter.x + countryCenter.width / 2;
            const centerY = countryCenter.y + countryCenter.height / 2;
            
            // Use team coordinates if available, otherwise spread around center
            const x = centerX + (index % 3 - 1) * 30;
            const y = centerY + Math.floor(index / 3) * 30;
            
            svg.append('circle')
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', 8)
                .attr('fill', team.isLive ? '#2ecc71' : '#e74c3c')
                .attr('stroke', '#ffffff')
                .attr('stroke-width', 2)
                .style('cursor', 'pointer')
                .on('click', () => {
                    alert(`${team.name}\nCity: ${team.city}\nVenue: ${team.venue || 'Stadium TBA'}`);
                });
        });
    }

    // Fallback Map
    async initializeFallbackMap(teams, countryName) {
        console.log(`🗺️ FALLBACK: Creating country map for ${countryName} with ${teams.length} teams`);
        
        try {
            // Find the CORRECT container - main-map-area, NOT team-pins-container
            const mapArea = document.getElementById('main-map-area');
            if (!mapArea) {
                console.log('❌ No main-map-area found');
                return false;
            }
            
            // Clear existing content
            mapArea.innerHTML = '';
            
            // Create a proper map background
            const mapDiv = document.createElement('div');
            mapDiv.style.cssText = `
                width: 100%;
                height: 100%;
                background: rgba(44, 62, 80, 0.9);
                position: relative;
                overflow: hidden;
                z-index: 200;
            `;
            
            // Add country label
            mapDiv.innerHTML = `
                <div style="
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    color: white;
                    font-size: 24px;
                    font-weight: bold;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                    z-index: 10;
                ">${countryName}</div>
                
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: rgba(255,255,255,0.2);
                    font-size: 48px;
                    font-weight: bold;
                    text-align: center;
                    z-index: 5;
                ">${countryName}<br><small style="font-size: 16px;">Interactive Map View</small></div>
            `;
            
            // Add this div to the map area FIRST
            mapArea.appendChild(mapDiv);
            
            // Now add team pins DIRECTLY to the mapDiv with CORRECT team names
            if (teams.length > 0) {
                console.log(`📍 Adding ${teams.length} pins with correct team names`);
                teams.forEach((team, index) => {
                    const pin = document.createElement('div');
                    pin.className = 'team-pin';
                    pin.setAttribute('data-team-name', team.name); // Store correct name
                    
                    // Use real coordinates if available, otherwise grid position
                    let leftPos, topPos;
                    
                    if (team.coordinates && team.coordinates.lat && team.coordinates.lng) {
                        // Convert real coordinates to map position (this would be proper geo positioning)
                        leftPos = Math.min(Math.max(20, Math.random() * 60 + 20), 80);
                        topPos = Math.min(Math.max(20, Math.random() * 60 + 20), 80);
                    } else {
                        // Use improved grid positioning - 5 columns instead of 3
                        const col = index % 5;
                        const row = Math.floor(index / 5);
                        leftPos = 15 + (col * 16); // 15%, 31%, 47%, 63%, 79%
                        topPos = 25 + (row * 18); // Better vertical spacing
                    }
                    
                    pin.style.cssText = `
                        position: absolute;
                        width: 20px;
                        height: 20px;
                        background: #e74c3c;
                        border: 3px solid #fff;
                        border-radius: 50%;
                        cursor: pointer;
                        left: ${leftPos}%;
                        top: ${topPos}%;
                        z-index: 300;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                    `;
                    
                    // Add hover tooltip with correct team name
                    pin.title = `${team.name} - ${team.venue || team.stadium || 'Stadium TBA'}`;
                    
                    pin.addEventListener('mouseenter', function() {
                        this.style.transform = 'scale(1.5)';
                        this.style.background = '#2ecc71';
                    });
                    
                    pin.addEventListener('mouseleave', function() {
                        this.style.transform = 'scale(1)';
                        this.style.background = '#e74c3c';
                    });
                    
                    // Click handler with CORRECT team data
                    pin.addEventListener('click', () => {
                        this.showTeamDetails({
                            name: team.name,
                            stadium: team.venue || team.stadium || 'Stadium TBA',
                            city: team.city || 'Unknown City',
                            founded: team.founded || 'Unknown',
                            website: team.website || '#'
                        });
                    });
                    
                    // Add pin to mapDiv
                    mapDiv.appendChild(pin);
                    
                    console.log(`✅ Pin ${index}: ${team.name} at ${leftPos}%, ${topPos}%`);
                });
            }
            
            console.log(`✅ FALLBACK: Created map with ${teams.length} teams in main-map-area`);
            return true;
            
        } catch (error) {
            console.error('❌ FALLBACK ERROR:', error);
            return false;
        }
    }

    // ADD this helper method:
    createSimpleTeamList(teams, countryName) {
        console.log(`📋 Creating simple team list for ${countryName}`);
        
        // Find sidebar or create a simple list
        const sidebar = document.querySelector('.team-sidebar') || 
                    document.getElementById('teams-list-container');
        
        if (sidebar) {
            const listDiv = document.createElement('div');
            listDiv.className = 'fallback-team-list';
            listDiv.style.marginTop = '20px';
            
            if (teams.length === 0) {
                listDiv.innerHTML = `
                    <div style="text-align: center; color: rgba(255,255,255,0.7);">
                        <div style="font-size: 48px; margin: 20px 0;">⚽</div>
                        <div style="font-size: 16px;">No team data available</div>
                        <div style="font-size: 12px; margin-top: 10px; opacity: 0.6;">
                            Live data coming soon for ${countryName}
                        </div>
                    </div>
                `;
            } else {
                const teamsHTML = teams.map((team, index) => `
                    <div style="
                        background: rgba(255,255,255,0.1);
                        margin: 8px 0;
                        padding: 12px;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    " onmouseover="this.style.background='rgba(76,175,80,0.2)'" 
                    onmouseout="this.style.background='rgba(255,255,255,0.1)'"
                    onclick="alert('${team.name}\\nCity: ${team.city}\\nVenue: ${team.venue || 'Stadium TBA'}')">
                        <div style="font-weight: bold; color: #4CAF50;">
                            ⚽ ${team.name}
                        </div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 4px;">
                            📍 ${team.city}
                            ${team.venue ? ` • 🏟️ ${team.venue}` : ''}
                        </div>
                    </div>
                `).join('');
                
                listDiv.innerHTML = `
                    <h4 style="color: #4CAF50; margin-bottom: 15px;">🏟️ Team Locations</h4>
                    ${teamsHTML}
                `;
            }
            
            sidebar.appendChild(listDiv);
        }
        
        return true;
    }

    getCountryCoordinates(countryName) {
        const coordinates = {
            'United Kingdom': { lat: 54.5, lng: -2.0, zoom: 6 },
            'Australia': { lat: -25.0, lng: 135.0, zoom: 5 },
            'Spain': { lat: 40.0, lng: -4.0, zoom: 6 },
            'Germany': { lat: 51.0, lng: 9.0, zoom: 6 },
            'France': { lat: 46.0, lng: 2.0, zoom: 6 },
            'Italy': { lat: 42.0, lng: 12.5, zoom: 6 },
            'Brazil': { lat: -15.0, lng: -55.0, zoom: 4 }
        };
        
        return coordinates[countryName] || { lat: 0, lng: 0, zoom: 2 };
    }

    addTeamMarkers(map, teams, countryName) {
    console.log(`📍 Adding markers for ${teams.length} teams in ${countryName}`);
    
    teams.forEach(async (team, index) => {
        console.log(`🔍 Processing team: ${team.name}`);
        console.log('📊 Full team object:', team);
        console.log('📍 Coordinates check:', {
            coordinates: team.coordinates,
            lat: team.lat,
            lng: team.lng,
            venue: team.venue,
            stadium: team.stadium
        });
        
        // Use coordinates from multiple sources with WikiData geocoding
        let lat = team.coordinates?.lat || team.lat || team.latitude || team.stadium?.coordinates?.latitude;
        let lng = team.coordinates?.lng || team.lng || team.longitude || team.stadium?.coordinates?.longitude;

        console.log(`🔍 ${team.name} coordinate search:`, {
            'team.coordinates': team.coordinates,
            'team.lat': team.lat,
            'team.lng': team.lng,
            'detected lat': lat,
            'detected lng': lng
        });

        // If no coordinates, try geocoding the stadium
        if (!lat || !lng) {
            const venue = team.venue || team.stadium;
            if (venue) {
                console.log(`🌐 Attempting to geocode stadium: ${venue} for ${team.name}`);
                const geocodedCoords = await this.geocodeStadiumCoordinates(team.name, venue, countryName);
                
                if (geocodedCoords) {
                    lat = geocodedCoords.latitude;
                    lng = geocodedCoords.longitude;
                    console.log(`📍 Using geocoded coordinates for ${team.name}: [${lat}, ${lng}]`);
                }
            }
        }

        // Final fallback to algorithmic positioning
        if (!lat || !lng) {
            const countryCenter = this.getCountryCenter(countryName);
            const angle = (index * 360 / teams.length) * (Math.PI / 180);
            const radius = 1.5;
            
            lat = countryCenter.lat + Math.cos(angle) * radius;
            lng = countryCenter.lng + Math.sin(angle) * radius;
            
            console.log(`📍 Using algorithmic coordinates for ${team.name} in ${countryName}: [${lat}, ${lng}]`);
        }
        
        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
            const marker = L.marker([lat, lng])
                .addTo(map)
                .bindTooltip(team.name, {
                    permanent: false,
                    direction: 'top',
                    offset: [0, -10],
                    className: 'team-tooltip'
                })
                .bindPopup(`
                    <div style="text-align: center; padding: 10px; min-width: 200px;">
                        ${team.crest ? `<img src="${team.crest}" style="width: 30px; height: 30px; margin-bottom: 8px;">` : ''}
                        <h4 style="margin: 0 0 8px 0; color: #4CAF50;">${team.name}</h4>
                        <p style="margin: 0 0 5px 0; color: #666;">🏟️ ${team.venue || team.stadium || 'Stadium TBA'}</p>
                        ${team.founded ? `<p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">📅 Founded ${team.founded}</p>` : ''}
                        ${team.website ? `<a href="${team.website}" target="_blank" style="color: #4CAF50; text-decoration: none; font-size: 12px;">🌐 Official Website</a>` : ''}
                        <div style="margin-top: 8px; font-size: 10px; opacity: 0.7;">
                            ${team.isLive ? '🔴 Live Data' : '📊 Historical Data'}
                        </div>
                    </div>
                `);
            
            this.teamMarkers.push(marker);
            console.log(`✅ Added marker for ${team.name} at [${lat}, ${lng}]`);
        } else {
            console.warn(`⚠️ No valid coordinates for ${team.name}`);
        }
    });
    
    console.log(`📍 Successfully added ${this.teamMarkers.length} markers to map`);
}

    getCountryCenter(countryName) {
        const centers = {
            'United Kingdom': { lat: 54.5, lng: -2.0 },
            'France': { lat: 46.0, lng: 2.0 },
            'Germany': { lat: 51.0, lng: 9.0 },
            'Spain': { lat: 40.0, lng: -4.0 },
            'Italy': { lat: 42.0, lng: 12.5 },
            'Brazil': { lat: -15.0, lng: -55.0 },
            'Netherlands': { lat: 52.0, lng: 5.0 },
            'Portugal': { lat: 39.0, lng: -8.0 }
        };
        
        return centers[countryName] || { lat: 0, lng: 0 };
    }

    /**
     * Geocode stadium coordinates using WikiData
     */
    async geocodeStadiumCoordinates(teamName, venueName, countryName) {
        const cacheKey = `stadium_${countryName}_${venueName}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
        
        // Check cache first
        if (this.stadiumCoordinatesCache && this.stadiumCoordinatesCache[cacheKey]) {
            console.log(`📍 Using cached coordinates for ${venueName}`);
            return this.stadiumCoordinatesCache[cacheKey];
        }
        
        try {
            // Use your existing WikiData service
            const wikidataService = new (await import('../../data/wikidataService.js')).WikidataService();
            
            // Build stadium-specific SPARQL query
            const query = `
                SELECT DISTINCT ?stadium ?stadiumLabel ?coordinate WHERE {
                    ?stadium wdt:P31/wdt:P279* wd:Q483110 .  # Instance of stadium
                    ?stadium rdfs:label ?stadiumLabel .
                    ?stadium wdt:P625 ?coordinate .
                    
                    FILTER(LANG(?stadiumLabel) = "en")
                    FILTER(CONTAINS(LCASE(?stadiumLabel), "${venueName.toLowerCase()}"))
                    
                    SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
                }
                LIMIT 5
            `;
            
            const response = await fetch('https://query.wikidata.org/sparql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/sparql-query',
                    'Accept': 'application/sparql-results+json',
                    'User-Agent': 'MapRates-Sports/1.0'
                },
                body: query
            });
            
            if (!response.ok) {
                throw new Error(`WikiData query failed: ${response.status}`);
            }
            
            const data = await response.json();
            const results = data.results.bindings;
            
            if (results.length > 0) {
                const coordinates = this.parseWikidataCoordinates(results[0].coordinate?.value);
                if (coordinates) {
                    // Cache the result
                    if (!this.stadiumCoordinatesCache) this.stadiumCoordinatesCache = {};
                    this.stadiumCoordinatesCache[cacheKey] = coordinates;
                    
                    console.log(`✅ Geocoded ${venueName}: [${coordinates.latitude}, ${coordinates.longitude}]`);
                    return coordinates;
                }
            }
            
            console.log(`❌ No coordinates found for stadium: ${venueName}`);
            return null;
            
        } catch (error) {
            console.error(`❌ Geocoding error for ${venueName}:`, error);
            return null;
        }
    }

    /**
     * Parse WikiData coordinates (reuse from WikiData service)
     */
    parseWikidataCoordinates(coordinateString) {
        if (!coordinateString) return null;
        
        try {
            const match = coordinateString.match(/Point\(([^ ]+) ([^ ]+)\)/);
            if (match) {
                return {
                    longitude: parseFloat(match[1]),
                    latitude: parseFloat(match[2])
                };
            }
        } catch (error) {
            console.warn('Error parsing coordinates:', coordinateString);
        }
        
        return null;
    }

    getTeamCoordinates(countryName) {
        // Dynamic venue-to-coordinate mapping using stadium names from API
        const venueCoordinates = {
            // UK Premier League Stadiums (using actual venue names from your API)
            'Emirates Stadium': { lat: 51.5549, lng: -0.1084 },
            'Villa Park': { lat: 52.5089, lng: -1.8711 },
            'Stamford Bridge': { lat: 51.4816, lng: -0.1909 },
            'Goodison Park': { lat: 53.4084, lng: -2.9916 },
            'Craven Cottage': { lat: 51.4749, lng: 0.0365 },
            'Anfield': { lat: 53.4308, lng: -2.9608 },
            'Etihad Stadium': { lat: 53.4631, lng: -2.2914 },
            'Old Trafford': { lat: 53.4631, lng: -2.2914 },
            "St. James' Park": { lat: 54.9740, lng: -1.6217 },
            'Stadium of Light': { lat: 54.9144, lng: -1.3873 },
            'Tottenham Hotspur Stadium': { lat: 51.6042, lng: -0.0667 },
            'Molineux Stadium': { lat: 52.5901, lng: -2.1306 },
            'Turf Moor': { lat: 53.7888, lng: -2.2304 },
            'Elland Road': { lat: 53.7782, lng: -1.5720 },
            'The City Ground': { lat: 52.9400, lng: -1.1327 },
            'Selhurst Park': { lat: 51.3983, lng: -0.0854 },
            'The American Express Community Stadium': { lat: 50.8611, lng: -0.0831 },
            'Griffin Park': { lat: 51.4902, lng: -0.3021 },
            'London Stadium': { lat: 51.5387, lng: -0.0166 },
            'Vitality Stadium': { lat: 50.7373, lng: -1.9877 }
        };
        
        return venueCoordinates;
    }

    // Add fallback coordinate generation
    generateFallbackCoordinates(countryName) {
        console.log(`🎯 Generating fallback coordinates for ${countryName}`);
        
        // Country center coordinates for spreading teams around
        const countryCenters = {
            'United Kingdom': { lat: 54.5, lng: -2.0 },
            'Germany': { lat: 51.0, lng: 9.0 },
            'Spain': { lat: 40.0, lng: -4.0 },
            'Italy': { lat: 42.0, lng: 12.5 },
            'France': { lat: 46.0, lng: 2.0 },
            'Netherlands': { lat: 52.0, lng: 5.0 },
            'Portugal': { lat: 39.0, lng: -8.0 },
            'Brazil': { lat: -15.0, lng: -55.0 }
        };
        
        const center = countryCenters[countryName] || { lat: 0, lng: 0 };
        
        // Generate coordinates in a circle around the center
        const coordinates = [];
        for (let i = 0; i < 20; i++) {
            const angle = (i * 360 / 20) * (Math.PI / 180);
            const radius = 2.0 + (Math.random() * 3.0); // 2-5 degrees radius
            
            coordinates.push({
                lat: center.lat + Math.cos(angle) * radius,
                lng: center.lng + Math.sin(angle) * radius
            });
        }
        
        return coordinates;
    }

    // Add control methods: - added new at the end
    //focusOnTeam(teamIndex) {
      //  if (this.currentMap && this.teamMarkers && this.teamMarkers[teamIndex]) {
      //      const marker = this.teamMarkers[teamIndex];
      //      this.currentMap.setView(marker.getLatLng(), 14);
      //      marker.openPopup();
      //  }
    // }

    toggleMapStyle() {
        alert('Premium feature: Switch between satellite, street, and terrain views!');
    }

    showTeamRoutes() {
        alert('Premium feature: Plan routes between stadiums and calculate travel times!');
    }

    resetMapView() {
        if (this.currentMap) {
            const countryName = document.querySelector('.map-header h1').textContent;
            const coords = this.getCountryCoordinates(countryName);
            this.currentMap.setView([coords.lat, coords.lng], coords.zoom);
        }
    }

    // Helper methods for professional map:
    async loadLeafletLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Create a simulated country map (placeholder for real map integration):
    createSimulatedCountryMap(countryName, footballData) {
        const mapDiv = document.createElement('div');
        mapDiv.style.cssText = `
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, #2c3e50, #3498db);
            position: relative;
            border-radius: 8px;
            overflow: hidden;
        `;
        
        // Get teams - use real teams if available, otherwise sample teams
        const realTeams = footballData?.teams || [];
        const sampleTeams = realTeams.length > 0 ? realTeams : this.getSampleTeams(countryName);
        
        // Get country outline SVG (simplified shapes)
        const countryOutline = this.getCountryOutlineSVG(countryName);
        
        mapDiv.innerHTML = `
            <!-- Country Outline Background -->
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                opacity: 0.3;
                z-index: 50;
            ">
                ${countryOutline}
            </div>
            
            <!-- Map Grid Lines for Realistic Feel -->
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-image: 
                    linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
                background-size: 50px 50px;
                z-index: 10;
            "></div>
            
            <!-- Map Legend -->
            <div style="
                position: absolute;
                bottom: 20px;
                left: 20px;
                background: rgba(0,0,0,0.7);
                color: white;
                padding: 10px 15px;
                border-radius: 8px;
                font-size: 12px;
                z-index: 102;
            ">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                    <div style="width: 12px; height: 12px; background: #4CAF50; border-radius: 50%; border: 2px solid white;"></div>
                    Football Clubs
                </div>
                <div style="opacity: 0.8;">Click markers for details</div>
            </div>
            
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                color: white;
                z-index: 100;
            ">
                <h2 style="margin: 0 0 20px 0; font-size: 36px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">${countryName}</h2>
                <div style="font-size: 18px; opacity: 0.9;">Interactive Map View</div>
                <div style="font-size: 14px; opacity: 0.7; margin-top: 10px;">
                    ${sampleTeams.length} team locations • Click markers for details
                </div>
            </div>
            
            <!-- Team markers with better positioning -->
            ${sampleTeams.slice(0, 8).map((team, index) => {
                // Create more realistic positioning for different countries
                const positions = this.getTeamPositions(countryName, index);
                
                return `
                    <div class="team-marker" 
                        onclick="window.countryMapManager.showTeamDetails('${team.name}', '${team.venue || 'Stadium TBA'}')" 
                        style="
                            position: absolute;
                            top: ${positions.top};
                            left: ${positions.left};
                            width: 16px;
                            height: 16px;
                            background: #4CAF50;
                            border: 3px solid white;
                            border-radius: 50%;
                            cursor: pointer;
                            animation: pulse 2s infinite;
                            z-index: 101;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                            transition: all 0.2s ease;
                        " 
                        title="${team.name} - ${team.venue || 'Stadium TBA'}"
                        onmouseover="this.style.transform='scale(1.5)'; this.style.background='#ff6b35';"
                        onmouseout="this.style.transform='scale(1)'; this.style.background='#4CAF50';">
                        <div style="
                            position: absolute;
                            top: -35px;
                            left: 50%;
                            transform: translateX(-50%);
                            background: rgba(0,0,0,0.8);
                            color: white;
                            padding: 4px 8px;
                            border-radius: 4px;
                            font-size: 12px;
                            white-space: nowrap;
                            opacity: 0;
                            transition: opacity 0.2s ease;
                            pointer-events: none;
                            z-index: 102;
                        " class="marker-tooltip">${team.name}</div>
                    </div>
                `;
            }).join('')}
            
            <style>
                @keyframes pulse {
                    0% { 
                        transform: scale(1);
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 0 rgba(76, 175, 80, 0.7);
                    }
                    50% { 
                        transform: scale(1.1);
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 8px rgba(76, 175, 80, 0.3);
                    }
                    100% { 
                        transform: scale(1);
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 0 rgba(76, 175, 80, 0);
                    }
                }
                
                .team-marker:hover .marker-tooltip {
                    opacity: 1 !important;
                }
                
                .team-marker:hover {
                    transform: scale(1.5) !important;
                    background: #ff6b35 !important;
                    z-index: 103 !important;
                }
            </style>
        `;
        
        return mapDiv;
    }

    getCountryOutlineSVG(countryName) {
        const outlines = {
            'United Kingdom': `
                <svg width="200" height="300" viewBox="0 0 200 300">
                    <path d="M100 50 L120 80 L110 120 L130 150 L120 200 L100 250 L80 240 L60 200 L70 150 L50 120 L60 80 Z" 
                        fill="rgba(255,255,255,0.2)" 
                        stroke="rgba(255,255,255,0.4)" 
                        stroke-width="2"/>
                </svg>
            `,
            'Australia': `
                <svg width="300" height="200" viewBox="0 0 300 200">
                    <path d="M50 100 L100 80 L150 85 L200 90 L250 95 L280 110 L270 140 L250 160 L200 170 L150 165 L100 160 L50 150 Z" 
                        fill="rgba(255,255,255,0.2)" 
                        stroke="rgba(255,255,255,0.4)" 
                        stroke-width="2"/>
                </svg>
            `,
            'Spain': `
                <svg width="250" height="200" viewBox="0 0 250 200">
                    <path d="M50 120 L80 100 L120 95 L160 100 L200 105 L220 120 L210 150 L180 160 L140 165 L100 160 L60 150 Z" 
                        fill="rgba(255,255,255,0.2)" 
                        stroke="rgba(255,255,255,0.4)" 
                        stroke-width="2"/>
                </svg>
            `
        };
        
        return outlines[countryName] || `
            <svg width="200" height="200" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="80" 
                        fill="rgba(255,255,255,0.2)" 
                        stroke="rgba(255,255,255,0.4)" 
                        stroke-width="2"/>
            </svg>
        `;
    }

    getTeamPositions(countryName, index) {
        const countryPositions = {
            'United Kingdom': [
                { top: '25%', left: '45%' }, // Manchester United
                { top: '28%', left: '47%' }, // Manchester City  
                { top: '35%', left: '42%' }, // Liverpool
                { top: '55%', left: '52%' }, // Chelsea
                { top: '52%', left: '50%' }, // Arsenal
                { top: '53%', left: '49%' }, // Tottenham
                { top: '40%', left: '35%' }, // Generic position 1
                { top: '60%', left: '45%' }  // Generic position 2
            ],
            'Australia': [
                { top: '60%', left: '70%' }, // Melbourne
                { top: '45%', left: '75%' }, // Sydney
                { top: '65%', left: '68%' }, // Melbourne City
                { top: '75%', left: '65%' }, // Adelaide
                { top: '35%', left: '25%' }, // Perth
                { top: '30%', left: '72%' }, // Brisbane
                { top: '85%', left: '75%' }, // Wellington (NZ)
                { top: '65%', left: '72%' }  // Western United
            ],
            'Spain': [
                { top: '40%', left: '55%' }, // Madrid
                { top: '60%', left: '75%' }, // Barcelona
                { top: '42%', left: '57%' }, // Atletico Madrid
                { top: '75%', left: '60%' }, // Sevilla
                { top: '65%', left: '70%' }, // Valencia
                { top: '35%', left: '45%' }, // Athletic Bilbao
                { top: '50%', left: '40%' }, // Generic position 1
                { top: '55%', left: '65%' }  // Generic position 2
            ]
        };
        
        const positions = countryPositions[countryName] || [
            { top: '30%', left: '40%' },
            { top: '40%', left: '60%' },
            { top: '60%', left: '45%' },
            { top: '50%', left: '55%' },
            { top: '35%', left: '50%' },
            { top: '65%', left: '40%' },
            { top: '45%', left: '35%' },
            { top: '55%', left: '65%' }
        ];
        
        return positions[index] || { top: `${30 + (index * 8)}%`, left: `${35 + (index * 5)}%` };
    }

    // Add method to close the detail map:
    closeDetailMap() {
        const overlay = document.getElementById('country-map-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }
        console.log('✅ Country detail map closed');
    }

    // Add method to reset map view:
    resetMapView() {
        console.log('🎯 Resetting country map view');
        // In a real map implementation, this would reset zoom and pan
        alert('Map view reset! (Premium feature: Full zoom/pan controls)');
    }

    getSampleTeams(countryName) {
        // Only return sample teams for NON-PREMIUM countries
        const premiumCountries = ['United Kingdom', 'Germany', 'Spain', 'Italy', 'France', 'Netherlands', 'Portugal', 'Brazil'];
        
        if (premiumCountries.includes(countryName)) {
            console.log(`🔴 ${countryName} is premium - should use real API data, not sample teams`);
            return []; // Return empty - real data should come from API
        }
        
        // Sample teams only for free countries
        const sampleTeams = {
            'Australia': [
                { name: 'Melbourne Victory', venue: 'Marvel Stadium', city: 'Melbourne' },
                { name: 'Sydney FC', venue: 'Allianz Stadium', city: 'Sydney' },
                { name: 'Melbourne City', venue: 'AAMI Park', city: 'Melbourne' }
            ],
            'United States': [
                { name: 'LA Galaxy', venue: 'Dignity Health Sports Park', city: 'Los Angeles' },
                { name: 'New York City FC', venue: 'Yankee Stadium', city: 'New York' },
                { name: 'Atlanta United', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' }
            ]
        };
        
        return sampleTeams[countryName] || [
            { name: `${countryName} FC`, venue: 'National Stadium', city: 'Capital City' },
            { name: `${countryName} United`, venue: 'Central Ground', city: 'Major City' }
        ];
    }

    showTeamDetails(team) {
        console.log('🏟️ Showing details for:', team.name || team);
        
        // Handle both old and new calling patterns
        const teamData = typeof team === 'string' ? { name: team, stadium: arguments[1] } : team;
        const safeTeam = {
            name: teamData.name || 'Unknown Team',
            stadium: teamData.stadium || teamData.venue || 'Unknown Stadium',
            founded: teamData.founded || 'Unknown',
            website: teamData.website || '#'
        };
        
        // Create or update team details panel
        let detailsPanel = document.getElementById('team-details-panel');
        if (!detailsPanel) {
            detailsPanel = document.createElement('div');
            detailsPanel.id = 'team-details-panel';
            detailsPanel.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                width: 300px;
                background: white;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                padding: 20px;
                z-index: 2000;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            `;
            document.body.appendChild(detailsPanel);
        }
        
        detailsPanel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #dc3545;">⚽ ${safeTeam.name}</h3>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; font-size: 20px; cursor: pointer; color: #999;">×</button>
            </div>
            <div style="color: #666; line-height: 1.6;">
                <p><strong>🏟️ Stadium:</strong> ${safeTeam.stadium}</p>
                <p><strong>📅 Founded:</strong> ${safeTeam.founded}</p>
                ${safeTeam.website && safeTeam.website !== '#' ? 
                    `<p><strong>🌐 Website:</strong> <a href="${safeTeam.website}" target="_blank" style="color: #dc3545;">Visit Site</a></p>` : 
                    ''}
            </div>
        `;
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (detailsPanel && detailsPanel.parentNode) {
                detailsPanel.remove();
            }
        }, 10000);
    }

    /**
     * Focus on a specific team marker on the map
     */
    focusOnTeam(teamIndex) {
        if (this.currentMap && this.teamMarkers && this.teamMarkers[teamIndex]) {
            const marker = this.teamMarkers[teamIndex];
            this.currentMap.setView(marker.getLatLng(), 12);
            marker.openPopup();
            
            // Highlight the team in the sidebar
            const teamCards = document.querySelectorAll('.team-card, [onclick*="focusOnTeam"]');
            teamCards.forEach((card, index) => {
                if (index === teamIndex) {
                    card.style.background = 'rgba(76, 175, 80, 0.2)';
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    card.style.background = 'transparent';
                }
            });
            
            console.log(`🎯 Focused on team ${teamIndex}: ${this.teamMarkers[teamIndex]?.getPopup()?.getContent()}`);
        }
    }

}
console.log('🔧 Selective updates applied - Global City Pins added without losing functionality!');
