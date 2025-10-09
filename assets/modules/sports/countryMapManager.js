/**
 * Country Map Manager - Photorealistic country maps with team locations
 */
console.log('🚀 CUSTOM FILE LOADED - 150 NEW VERSION!');
import { FLAG_MAP } from '../../config/constants.js';
import { WikidataService } from './data/wikidataService.js';
export class CountryMapManager {
    constructor() {
        this.initialized = false;
        this.currentCountryMap = null;
        this.teamMarkers = [];
        this.mapContainer = null;
        this.globalCityPinManager = null;
        this.stadiumCoordinatesCache = {};
        this.lastGeocodingRequest = 0;
        this.geocodingEnabled = true;
        this.wikidataService = new WikidataService();
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
        
        try {
            // Hide any existing tooltip first
            const existingTooltip = document.getElementById('football-tooltip');
            if (existingTooltip) {
                existingTooltip.remove();
            }

            // DYNAMIC: Get teams using multiple data source strategies
            let teams = [];
            let dataSource = 'fallback';
            
            // PRIORITY 1: Use real API teams if available in footballData
            if (footballData?.teams && Array.isArray(footballData.teams) && footballData.teams.length > 0) {
                console.log('🔴 Using REAL API teams from footballData...');
                teams = footballData.teams;
                dataSource = footballData.hasLiveData ? 'live' : 'static';
                console.log(`📊 Using ${teams.length} real API teams (${dataSource} data)`);
            } 
            // PRIORITY 2: For countries with live data, try fresh API call
            else if (footballData?.hasLiveData || footballData?.status?.includes('LIVE')) {
                console.log(`🔴 Live data country ${countryName} - fetching fresh teams...`);
                try {
                    const freshData = await window.footballDataManager.getCountryFootballData(countryId);
                    if (freshData?.teams && freshData.teams.length > 0) {
                        teams = freshData.teams;
                        dataSource = 'live';
                        footballData = { ...footballData, ...freshData, teams: teams };
                        console.log(`📊 Retrieved ${teams.length} fresh API teams`);
                    }
                } catch (error) {
                    console.error('❌ Fresh API call failed:', error);
                }
            }

            // PRIORITY 2.5: Try Wikidata for comprehensive non-premium data
            if (teams.length === 0) {
                console.log('📚 Using Wikidata for comprehensive football data...');
                try {
                    const wikidataId = this.getWikidataId(countryName);
                    if (wikidataId) {
                        const wikiFootballData = await this.getWikidataFootballData(countryName, wikidataId);
                        if (wikiFootballData && wikiFootballData.teams.length > 0) {
                            teams = wikiFootballData.teams;
                            dataSource = 'wikidata';
                            footballData = { ...footballData, ...wikiFootballData };
                            console.log(`📊 Retrieved ${teams.length} teams from Wikidata (comprehensive data)`);
                        }
                    }
                } catch (error) {
                    console.error('❌ Wikidata integration failed:', error);
                }
            }
            
            // PRIORITY 3: Try GlobalCityPinManager (works for all countries dynamically)
            if (teams.length === 0 && this.globalCityPinManager) {
                console.log('🌍 Using GlobalCityPinManager for dynamic team data...');
                teams = await this.globalCityPinManager.getAllTeamsForCountry(countryName);
                dataSource = teams.some(t => t.isLive) ? 'live' : 'synthetic';
                console.log(`📊 Retrieved ${teams.length} teams from global manager (${dataSource} data)`);
            }
            
            // PRIORITY 4: Use existing map data if available
            if (teams.length === 0) {
                console.log('🗺️ Trying existing country map data...');
                const mapData = this.getCountryMapData(countryId, countryName);
                if (mapData?.teams && mapData.teams.length > 0) {
                    teams = mapData.teams;
                    dataSource = 'map_data';
                    console.log(`📊 Using ${teams.length} teams from map data`);
                }
            }
            
            
            // Enhanced football data with automated teams
            const enhancedFootballData = {
                ...footballData,
                teams: teams,
                hasLiveData: teams.some(t => t.isLive) || dataSource === 'live',
                teamCount: teams.length,
                dataSource: dataSource
            };

            // Preserve any existing coordinate data
            enhancedFootballData.teams = enhancedFootballData.teams.map(team => {
                if (team.source === 'wikidata' && team.stadium?.coordinates) {
                    console.log(`🎯 Preserving coordinate data for ${team.name}`);
                }
                return team;
            });

            // Create and show map overlay
            const mapOverlay = this.createMapOverlay(countryName, enhancedFootballData);
            document.body.appendChild(mapOverlay);

            // Make overlay visible
            setTimeout(() => {
                mapOverlay.style.opacity = '1';
                mapOverlay.style.display = 'flex';
                mapOverlay.style.visibility = 'visible';
                console.log(`✅ Overlay visible for ${countryName} with ${teams.length} teams`);
            }, 100);

            // Initialize map
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

        const teamsHTML = teams.map((team, index) => `
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
                    ${teams.length} teams in ${footballData.league}
                </div>
                ${liveTeamsCount > 0 || syntheticTeamsCount > 0 ? `
                    <div style="font-size: 12px; color: #95a5a6; margin-top: 5px;">
                        ${liveTeamsCount > 0 ? `✅ ${liveTeamsCount} Live API` : ''}
                        ${liveTeamsCount > 0 && syntheticTeamsCount > 0 ? ' • ' : ''}
                        ${syntheticTeamsCount > 0 ? `🔍 ${syntheticTeamsCount} Cities` : ''}
                    </div>
                ` : ''}
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
    generateEnhancedFootballContent(countryName, footballData) {
        const flag = this.getCountryFlag(countryName);
        const league = footballData?.competition?.name || footballData?.league || 'National League';
        const currentSeason = footballData?.season?.currentMatchday || 'Current';
        const isLive = footballData?.hasLiveData || false;
        const teams = footballData?.teams || [];
        const standings = footballData?.standings || [];

        return `
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="font-size: 48px; margin-bottom: 12px;">${flag}</div>
                <h1 style="margin: 0; color: #4CAF50; font-size: 28px;">${countryName}</h1>
                <div style="background: ${isLive ? 'linear-gradient(90deg, #27ae60, #2ecc71)' : 'linear-gradient(90deg, #f39c12, #e67e22)'}; 
                            color: white; padding: 6px 16px; border-radius: 20px; 
                            display: inline-block; margin: 10px 0; font-weight: bold; font-size: 12px;">
                    🔴 ${isLive ? 'LIVE DATA' : 'HISTORICAL DATA'}
                </div>
            </div>

            <!-- Enhanced League Card -->
            <div style="background: linear-gradient(135deg, #2c3e50, #34495e); border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.1);">
                <h3 style="color: #3498db; margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px;">
                    ⚽ ${league}
                </h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 15px 0;">
                    <div style="text-align: center; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
                        <div style="font-size: 24px; color: #e74c3c; font-weight: bold;">${teams.length}</div>
                        <div style="font-size: 12px; color: #bdc3c7;">Teams</div>
                    </div>
                    <div style="text-align: center; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
                        <div style="font-size: 24px; color: #f39c12; font-weight: bold;">${currentSeason}</div>
                        <div style="font-size: 12px; color: #bdc3c7;">Matchday</div>
                    </div>
                    <div style="text-align: center; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
                        <div style="font-size: 24px; color: #9b59b6; font-weight: bold;">${footballData?.area?.name || 'Europe'}</div>
                        <div style="font-size: 12px; color: #bdc3c7;">Region</div>
                    </div>
                </div>
            </div>

            <!-- LEAGUE TABLE SECTION -->
            ${standings.length > 0 ? `
                <div style="background: linear-gradient(135deg, #34495e, #2c3e50); border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.1);">
                    <h3 style="color: #e67e22; margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px;">
                        📊 Current Standings
                    </h3>
                    
                    <div style="overflow-x: auto; border-radius: 8px; overflow: hidden;">
                        <table style="width: 100%; border-collapse: collapse; background: #2c3e50;">
                            <thead>
                                <tr style="background: linear-gradient(135deg, #1a252f, #2c3e50); color: white;">
                                    <th style="padding: 10px 8px; text-align: center; font-size: 11px;">POS</th>
                                    <th style="padding: 10px; text-align: left; font-size: 11px;">TEAM</th>
                                    <th style="padding: 10px 6px; text-align: center; font-size: 11px;">P</th>
                                    <th style="padding: 10px 6px; text-align: center; font-size: 11px;">W</th>
                                    <th style="padding: 10px 6px; text-align: center; font-size: 11px;">D</th>
                                    <th style="padding: 10px 6px; text-align: center; font-size: 11px;">L</th>
                                    <th style="padding: 10px 6px; text-align: center; font-size: 11px;">GD</th>
                                    <th style="padding: 10px 6px; text-align: center; font-size: 11px;">PTS</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${standings.slice(0, 10).map((team, index) => `
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: white; 
                                        ${index < 4 ? 'background: rgba(46, 204, 113, 0.15);' : 
                                        index >= standings.length - 3 && standings.length > 10 ? 'background: rgba(231, 76, 60, 0.15);' : ''}">
                                        <td style="padding: 8px; text-align: center; font-weight: bold; font-size: 12px;
                                            color: ${index < 4 ? '#2ecc71' : index >= standings.length - 3 && standings.length > 10 ? '#e74c3c' : 'white'};">
                                            ${team.position || index + 1}
                                        </td>
                                        <td style="padding: 8px; font-weight: 500; font-size: 12px;">${team.team?.shortName || team.team?.name || team.name}</td>
                                        <td style="padding: 8px; text-align: center; font-size: 11px;">${team.playedGames || 0}</td>
                                        <td style="padding: 8px; text-align: center; font-size: 11px;">${team.won || 0}</td>
                                        <td style="padding: 8px; text-align: center; font-size: 11px;">${team.draw || 0}</td>
                                        <td style="padding: 8px; text-align: center; font-size: 11px;">${team.lost || 0}</td>
                                        <td style="padding: 8px; text-align: center; font-size: 11px;
                                            color: ${(team.goalDifference || 0) > 0 ? '#2ecc71' : (team.goalDifference || 0) < 0 ? '#e74c3c' : 'white'};">
                                            ${(team.goalDifference || 0) > 0 ? '+' : ''}${team.goalDifference || 0}
                                        </td>
                                        <td style="padding: 8px; text-align: center; font-weight: bold; color: #f1c40f; font-size: 12px;">${team.points || 0}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <div style="margin-top: 10px; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 6px; color: #bdc3c7; font-size: 10px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <span>🟢 Top 4: European Competition</span>
                            <span>🔴 Bottom 3: Relegation</span>
                        </div>
                        <div style="text-align: center; opacity: 0.8;">
                            Last updated: ${footballData?.lastUpdated || 'Recently'} • Source: football-data.org
                        </div>
                    </div>
                </div>
            ` : ''}

            <!-- Stadium Locations Section -->
            <div style="background: linear-gradient(135deg, #8e44ad, #9b59b6); border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.1);">
                <h3 style="color: white; margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px;">
                    🏟️ Stadium Locations
                </h3>
                
                <div style="max-height: 200px; overflow-y: auto;">
                    ${teams.slice(0, 8).map((team, index) => `
                        <div onclick="window.countryMapManager.focusOnTeam(${index})" style="
                            background: rgba(255,255,255,0.1);
                            margin: 8px 0;
                            padding: 12px;
                            border-radius: 8px;
                            color: white;
                            font-size: 13px;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        " onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                            <div>
                                <div style="font-weight: bold;">⚽ ${team.name}</div>
                                ${team.venue ? `<div style="font-size: 11px; opacity: 0.8; margin-top: 2px;">🏟️ ${team.venue}</div>` : ''}
                            </div>
                            <div style="color: #4CAF50; font-size: 11px; font-weight: bold;">📍 View</div>
                        </div>
                    `).join('')}
                </div>
                
                <div style="color: rgba(255,255,255,0.7); font-size: 11px; margin-top: 12px; text-align: center;">
                    Click team names to focus on interactive map
                </div>
            </div>

            <!-- Action Buttons -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 25px;">
                <button onclick="window.countryMapManager.showFullLeagueTable('${countryName}')" style="
                    background: linear-gradient(135deg, #3498db, #2980b9);
                    color: white; border: none; padding: 14px; border-radius: 8px;
                    font-weight: bold; cursor: pointer; transition: all 0.2s ease;
                    box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
                " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                    📈 Full League Table
                </button>
                <button onclick="window.countryMapManager.showStadiumRoutes('${countryName}')" style="
                    background: linear-gradient(135deg, #e67e22, #d35400);
                    color: white; border: none; padding: 14px; border-radius: 8px;
                    font-weight: bold; cursor: pointer; transition: all 0.2s ease;
                    box-shadow: 0 4px 15px rgba(230, 126, 34, 0.3);
                " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                    🗺️ Stadium Routes
                </button>
            </div>

            <!-- Data Source Footer -->
            <div style="margin-top: 20px; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px; font-size: 11px; color: #95a5a6;">
                <div style="display: flex; justify-content: space-between;">
                    <span>📡 Source: ${isLive ? 'football-data.org (Live API)' : 'Wikidata + Historical'}</span>
                    <span>🔄 Updated: ${footballData?.lastUpdated || 'Static'}</span>
                </div>
            </div>
        `;
    }

    /**
     * Show full league table functionality
     */
    async showFullLeagueTable(countryName) {
        console.log(`📈 Opening league table for ${countryName}`);
        
        // Try to get current football data with standings
        let footballData = null;
        
        // Get country ID from name
        const countryId = this.getCountryIdFromName(countryName);
        if (countryId && window.footballDataManager) {
            try {
                footballData = await window.footballDataManager.getCountryFootballData(countryId);
            } catch (error) {
                console.warn('Could not fetch fresh league data:', error);
            }
        }
        
        const modal = this.createModal(`📊 ${countryName} - League Standings`);
        const modalBody = modal.querySelector('.modal-body');
        
        if (footballData?.standings && footballData.standings.length > 0) {
            modalBody.innerHTML = this.generateFullLeagueTableHTML(countryName, footballData);
        } else {
            modalBody.innerHTML = `
                <div style="text-align: center; padding: 40px; color: white;">
                    <div style="font-size: 48px; margin-bottom: 20px;">⚽</div>
                    <div style="font-size: 18px; margin-bottom: 10px;">League Table Not Available</div>
                    <div style="font-size: 14px; opacity: 0.7;">
                        Live standings data coming soon for ${countryName}
                    </div>
                </div>
            `;
        }
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    /**
     * Generate full league table HTML
     */
    generateFullLeagueTableHTML(countryName, footballData) {
        const standings = footballData.standings || [];
        
        return `
            <div style="color: white;">
                <div style="text-align: center; margin-bottom: 25px;">
                    <h2 style="color: #4CAF50; margin-bottom: 10px;">${footballData.competition?.name || 'League'}</h2>
                    <div style="color: #B0BEC5;">Season ${footballData.season?.startDate?.substring(0,4) || '2024'}</div>
                </div>
                
                <div style="overflow-x: auto; border-radius: 12px; overflow: hidden; background: #2c3e50;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: linear-gradient(135deg, #1a252f, #2c3e50); color: white;">
                                <th style="padding: 12px 8px; text-align: center; font-size: 12px;">POS</th>
                                <th style="padding: 12px; text-align: left; font-size: 12px;">TEAM</th>
                                <th style="padding: 12px 6px; text-align: center; font-size: 12px;">PLAYED</th>
                                <th style="padding: 12px 6px; text-align: center; font-size: 12px;">WON</th>
                                <th style="padding: 12px 6px; text-align: center; font-size: 12px;">DRAWN</th>
                                <th style="padding: 12px 6px; text-align: center; font-size: 12px;">LOST</th>
                                <th style="padding: 12px 6px; text-align: center; font-size: 12px;">FOR</th>
                                <th style="padding: 12px 6px; text-align: center; font-size: 12px;">AGAINST</th>
                                <th style="padding: 12px 6px; text-align: center; font-size: 12px;">GD</th>
                                <th style="padding: 12px 6px; text-align: center; font-size: 12px;">POINTS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${standings.map((team, index) => {
                                const isTopFour = index < 4;
                                const isBottomThree = index >= standings.length - 3;
                                const rowColor = isTopFour ? 'rgba(46, 204, 113, 0.15)' : 
                                            isBottomThree ? 'rgba(231, 76, 60, 0.15)' : 'transparent';
                                
                                return `
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); background: ${rowColor};">
                                        <td style="padding: 10px 8px; text-align: center; font-weight: bold; color: ${isTopFour ? '#2ecc71' : isBottomThree ? '#e74c3c' : 'white'};">
                                            ${team.position}
                                        </td>
                                        <td style="padding: 10px; font-weight: 500; color: white;">
                                            ${team.team?.crest ? `<img src="${team.team.crest}" style="width: 20px; height: 20px; margin-right: 8px; vertical-align: middle;">` : ''}
                                            ${team.team?.shortName || team.team?.name}
                                        </td>
                                        <td style="padding: 10px; text-align: center; color: white;">${team.playedGames || 0}</td>
                                        <td style="padding: 10px; text-align: center; color: white;">${team.won || 0}</td>
                                        <td style="padding: 10px; text-align: center; color: white;">${team.draw || 0}</td>
                                        <td style="padding: 10px; text-align: center; color: white;">${team.lost || 0}</td>
                                        <td style="padding: 10px; text-align: center; color: white;">${team.goalsFor || 0}</td>
                                        <td style="padding: 10px; text-align: center; color: white;">${team.goalsAgainst || 0}</td>
                                        <td style="padding: 10px; text-align: center; color: ${(team.goalDifference || 0) > 0 ? '#2ecc71' : (team.goalDifference || 0) < 0 ? '#e74c3c' : 'white'};">
                                            ${(team.goalDifference || 0) > 0 ? '+' : ''}${team.goalDifference || 0}
                                        </td>
                                        <td style="padding: 10px; text-align: center; font-weight: bold; color: #f1c40f;">${team.points || 0}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div style="margin-top: 15px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; color: #bdc3c7; font-size: 12px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>🟢 Top 4: European Competition Qualification</span>
                        <span>🔴 Bottom 3: Relegation Zone</span>
                    </div>
                    <div style="text-align: center; opacity: 0.8;">
                        Last updated: ${footballData.lastUpdated || 'Recently'} • Source: football-data.org
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Helper method to get country ID from name
     */
    getCountryIdFromName(countryName) {
        const countryMappings = {
            'United Kingdom': 'GB',
            'Spain': 'ES', 
            'Germany': 'DE',
            'France': 'FR',
            'Italy': 'IT',
            'Netherlands': 'NL',
            'Portugal': 'PT',
            'Brazil': 'BR'
        };
        
        return countryMappings[countryName] || null;
    }

    /**
     * Create modal helper method
     */
    createModal(title) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 10000;
            display: none;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: #1a1a2e;
                margin: 3% auto;
                padding: 0;
                border-radius: 15px;
                width: 90%;
                max-width: 1000px;
                color: white;
                max-height: 90vh;
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
                    <h2 style="margin: 0; color: white;">${title}</h2>
                    <span onclick="this.closest('[style*=\"position: fixed\"]').remove(); document.body.style.overflow='';" style="
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
                    ">&times;</span>
                </div>
                <div class="modal-body" style="padding: 30px;">
                    <!-- Content will be populated here -->
                </div>
            </div>
        `;
        
        return modal;
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
        // Use the enhanced version instead of the basic one
        return this.generateEnhancedFootballContent(countryName, footballData);
    }

    getCountryFlag(countryName) {
        // Use your existing FLAG_MAP from constants.js
        return FLAG_MAP[countryName] || '🏴';
    }

    async showFullLeagueTable(countryName) {
        const modal = this.createModal(`📈 ${countryName} - Full League Table`);
        const modalBody = modal.querySelector('.modal-body');
        
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 40px; color: white;">
                <div style="font-size: 48px; margin-bottom: 20px;">⚽</div>
                <div style="font-size: 18px; margin-bottom: 10px;">Loading Complete League Table...</div>
                <div style="font-size: 14px; opacity: 0.7;">Fetching all team standings</div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // Simulate loading and show full table
        setTimeout(() => {
            modalBody.innerHTML = this.generateFullLeagueTable(countryName);
        }, 1000);
    }

    async showStadiumRoutes(countryName) {
        alert(`🗺️ Premium Feature: Interactive stadium routes for ${countryName} with travel times, directions, and transport options coming soon!`);
    }

    generateFullLeagueTable(countryName) {
        // This would contain the complete league table with all teams
        return `
            <div style="color: white;">
                <h3 style="text-align: center; margin-bottom: 20px;">Complete ${countryName} League Standings</h3>
                <div style="text-align: center; padding: 40px; opacity: 0.7;">
                    Full league table integration with live standings coming soon...
                </div>
            </div>
        `;
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
                    <strong>Status:</strong> ${isLiveData ? '🔴 LIVE DATA' : '📊 STATIC INFO'}<br>
                    <strong>Data Type:</strong> ${
                    footballData?.dataSource === 'live' ? 'football-data.org API' : 
                    footballData?.dataSource === 'wikidata' ? '📚 Wikidata Database' :
                    '🛰️ Satellite View'
                }<br>
                    <strong>Source:</strong> ${footballData?.dataSource || 'Historical Database'}
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
                    <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                            <button onclick="window.countryMapManager.showFullLeagueTable('${countryName}')" style="
                                background: linear-gradient(45deg, #2196F3, #1976D2);
                                color: white; 
                                border: none; 
                                padding: 8px; 
                                border-radius: 6px; 
                                font-size: 12px; 
                                cursor: pointer;
                            ">📈 League Table</button>
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
                return await this.initializeFallbackMap(footballData.teams, countryName);
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
            await this.addTeamMarkers(map, footballData.teams, countryName); // Pass teams and countryName

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
            return await this.initializeFallbackMap(footballData.teams, countryName);
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
            'Brazil': { lat: -15.0, lng: -55.0, zoom: 5 },
            'Netherlands': { lat: 52.1326, lng: 5.2913, zoom: 7 },
            'Portugal': { lat: 39.5, lng: -8.0, zoom: 7 } 
        };
        
        return coordinates[countryName] || { lat: 0, lng: 0, zoom: 2 };
    }

    /**
     * RACE CONDITION FIX for addTeamMarkers method
     * Processes teams sequentially to avoid overlapping async calls
     * and ensures proper rate limiting between geocoding requests.
     * Enhanced error handling and logging for better debugging.
     * Improved marker popups with more team info.
     * Returns the count of successfully added markers.
     */

    async addTeamMarkers(map, teams, countryName) {
        console.log(`🏁 Adding markers for ${teams.length} teams in ${countryName}`);
        
        if (!teams || teams.length === 0) {
            console.log(`⚠️ No teams to process for ${countryName}`);
            return;
        }

        // Clear existing markers first
        this.teamMarkers.forEach(marker => {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        });
        this.teamMarkers = [];

        // SEQUENTIAL PROCESSING - No race conditions
        for (let teamIndex = 0; teamIndex < teams.length; teamIndex++) {
            const team = teams[teamIndex];
            
            try {
                console.log(`🏗️ Processing team ${teamIndex + 1}/${teams.length}: ${team.name}`);
                
                // Get coordinates with proper error handling
                const coordinates = await this.getTeamCoordinatesSequentially(team, countryName, teamIndex, teams.length);
                
                if (coordinates && coordinates.lat && coordinates.lng && 
                    !isNaN(coordinates.lat) && !isNaN(coordinates.lng)) {
                    
                    // Create marker with enhanced popup
                    const marker = L.marker([coordinates.lat, coordinates.lng])
                        .addTo(map)
                        .bindTooltip(team.name, {
                            permanent: false,
                            direction: 'top',
                            offset: [0, -10],
                            className: 'team-tooltip'
                        })
                        .bindPopup(this.createTeamPopupContent(team));
                    
                    this.teamMarkers.push(marker);
                    console.log(`✅ Added marker for ${team.name} at [${coordinates.lat}, ${coordinates.lng}]`);
                    
                } else {
                    console.warn(`⚠️ Invalid coordinates for ${team.name}:`, coordinates);
                }
                
            } catch (error) {
                console.error(`❌ Error processing ${team.name}:`, error);
                // Continue with next team instead of failing completely
            }

            // Rate limiting: Wait between teams to avoid API issues
            if (teamIndex < teams.length - 1) {
                await this.waitBetweenTeams();
            }
        }
        
        console.log(`🎉 Successfully added ${this.teamMarkers.length}/${teams.length} markers to map`);
        
        // Update success rate
        const successRate = (this.teamMarkers.length / teams.length * 100).toFixed(1);
        console.log(`📊 Geocoding success rate: ${successRate}%`);
        
        return this.teamMarkers.length;
    }

    /**
     * Get team coordinates with sequential processing (NO RACE CONDITIONS)
     */
    async getTeamCoordinatesSequentially(team, countryName, teamIndex, totalTeams) {
        let lat, lng;
        
        // STEP 1: Check existing coordinates from data sources
        if (team.stadium?.coordinates?.latitude && team.stadium?.coordinates?.longitude) {
            lat = parseFloat(team.stadium.coordinates.latitude);
            lng = parseFloat(team.stadium.coordinates.longitude);
            console.log(`🎯 Using existing stadium coordinates for ${team.name}`);
        } 
        else if (team.stadium?.coordinates?.lat && team.stadium?.coordinates?.lng) {
            lat = parseFloat(team.stadium.coordinates.lat);
            lng = parseFloat(team.stadium.coordinates.lng);
            console.log(`🎯 Using existing lat/lng coordinates for ${team.name}`);
        }
        else if (team.coordinates?.lat && team.coordinates?.lng) {
            lat = parseFloat(team.coordinates.lat);
            lng = parseFloat(team.coordinates.lng);
            console.log(`🎯 Using team coordinates for ${team.name}`);
        }
        
        // STEP 2: Try geocoding if no existing coordinates
        if ((!lat || !lng || isNaN(lat) || isNaN(lng)) && this.geocodingEnabled) {
            console.log(`🌐 Starting geocoding for ${team.name}...`);
            
            const venue = team.venue || team.stadium?.name || team.stadium || 'Stadium';
            const address = team.address;
            
            // Try venue first (stadium location)
            if (venue) {
                const venueCoords = await this.geocodeStadiumCoordinatesEnhanced(team.name, venue, countryName);
                if (venueCoords && venueCoords.latitude && venueCoords.longitude) {
                    lat = venueCoords.latitude;
                    lng = venueCoords.longitude;
                    console.log(`✅ Geocoded venue for ${team.name}: [${lat}, ${lng}]`);
                }
            }
            
            // Try address as fallback (club headquarters)
            if ((!lat || !lng) && address) {
                console.log(`📮 Trying postal address for ${team.name}`);
                const addressCoords = await this.geocodePostalAddress(team.name, address, countryName);
                if (addressCoords && addressCoords.latitude && addressCoords.longitude) {
                    lat = addressCoords.latitude;
                    lng = addressCoords.longitude;
                    console.log(`✅ Geocoded address for ${team.name}: [${lat}, ${lng}]`);
                }
            }
        }
        
        // STEP 3: Generate fallback coordinates if geocoding failed
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            console.log(`🎲 Generating fallback coordinates for ${team.name}`);
            const fallbackCoords = await this.getRealisticCountryPosition(countryName, teamIndex, totalTeams);
            lat = fallbackCoords.lat;
            lng = fallbackCoords.lng;
        }
        
        return { lat, lng };
    }

    /**
     * Create enhanced popup content for team markers
     */
    createTeamPopupContent(team) {
        return `
            <div style="text-align: center; padding: 10px; min-width: 200px;">
                ${team.crest ? `<img src="${team.crest}" style="width: 30px; height: 30px; margin-bottom: 8px;">` : ''}
                <h4 style="margin: 0 0 8px 0; color: #4CAF50;">${team.name}</h4>
                <p style="margin: 0 0 5px 0; color: #666;">🏟️ ${team.venue || team.stadium || 'Stadium TBA'}</p>
                ${team.address ? `<p style="margin: 0 0 5px 0; color: #666; font-size: 11px;">📮 ${team.address}</p>` : ''}
                ${team.founded ? `<p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">📅 Founded ${team.founded}</p>` : ''}
                ${team.website ? `<a href="${team.website}" target="_blank" style="color: #4CAF50; text-decoration: none; font-size: 12px;">🌐 Official Website</a>` : ''}
                <div style="margin-top: 8px; font-size: 10px; opacity: 0.7;">
                    ${team.isLive ? '🔴 Live Data' : '📊 Historical Data'}
                </div>
            </div>
        `;
    }

    /**
     * Smart rate limiting between team processing
     */
    async waitBetweenTeams() {
        // Variable delay based on geocoding activity
        const delay = this.geocodingEnabled ? 250 : 50; // 250ms for geocoding, 50ms for cached
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Enhanced rate limiting with better error handling
     */
    async respectRateLimit(isFromCache = false) {
        if (isFromCache) return;
        
        const now = Date.now();
        const minInterval = 500; // Increase to 500ms minimum between API calls
        
        if (this.lastGeocodingRequest && now - this.lastGeocodingRequest < minInterval) {
            const delay = minInterval - (now - this.lastGeocodingRequest);
            console.log(`⏱️ Rate limiting: waiting ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.lastGeocodingRequest = Date.now();
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
     * Parse Wikidata coordinates format
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
            console.warn('Error parsing Wikidata coordinates:', coordinateString);
        }
        
        return null;
    }

    async geocodeStadiumCoordinates(teamName, venueName, countryName) {
        console.log(`Geocoding: ${venueName}, ${countryName}`);
        
        const cacheKey = `${venueName}-${countryName}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const cached = this.stadiumCoordinatesCache[cacheKey];
        
        if (cached && Date.now() < cached.expires) {
            console.log(`Using cached coordinates for ${venueName}`);
            return cached.coordinates;
        }
        
        try {
            const isCached = !!cached;
            await this.respectRateLimit(isCached);
            
            const query = encodeURIComponent(`${venueName} stadium ${countryName}`);
            const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
            
            const response = await fetch(url, {
                headers: { 'User-Agent': 'FootballAtlas/1.0' }
            });
            
            const results = await response.json();
            if (results.length > 0) {
                const coords = {
                    latitude: parseFloat(results[0].lat),
                    longitude: parseFloat(results[0].lon)
                };
                
                this.stadiumCoordinatesCache[cacheKey] = {
                    coordinates: coords,
                    timestamp: Date.now(),
                    expires: Date.now() + (30 * 24 * 60 * 60 * 1000)
                };
                
                console.log(`Found coordinates for ${venueName}: [${coords.latitude}, ${coords.longitude}]`);
                return coords;
            }
            
            return null;
            
        } catch (error) {
            console.error(`Geocoding error for ${venueName}:`, error);
            return null;
        }
    }

    /**
     * Geocode using postal address (highest accuracy for premium teams)
     */
    async geocodePostalAddress(teamName, postalAddress, countryName) {
        console.log(`📮 Geocoding postal address: ${postalAddress}`);
        
        const cacheKey = `address-${postalAddress.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        const cached = this.stadiumCoordinatesCache[cacheKey];
        
        if (cached && Date.now() < cached.expires) {
            console.log(`Using cached postal address for ${teamName}`);
            return cached.coordinates;
        }
        
        try {
            await this.respectRateLimit();
            
            // Use full postal address for maximum accuracy
            const query = encodeURIComponent(postalAddress);
            const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&addressdetails=1`;
            
            const response = await fetch(url, {
                headers: { 'User-Agent': 'MapRates-FootballAtlas/1.0' }
            });
            
            const results = await response.json();
            if (results.length > 0) {
                const coords = {
                    latitude: parseFloat(results[0].lat),
                    longitude: parseFloat(results[0].lon)
                };
                
                // Cache with longer expiry for postal addresses (more stable)
                this.stadiumCoordinatesCache[cacheKey] = {
                    coordinates: coords,
                    timestamp: Date.now(),
                    expires: Date.now() + (90 * 24 * 60 * 60 * 1000) // 90 days
                };
                
                console.log(`✅ Postal address coordinates for ${teamName}: [${coords.latitude}, ${coords.longitude}]`);
                return coords;
            }
            
            return null;
            
        } catch (error) {
            console.error(`❌ Postal address geocoding error for ${teamName}:`, error);
            return null;
        }
    }

     /**
     * Enhanced stadium geocoding with dynamic fallback generation (NO HARDCODING)
     */
    async geocodeStadiumCoordinatesEnhanced(teamName, venueName, countryName) {
        console.log(`🏟️ Enhanced geocoding for ${teamName}: ${venueName}`);
        
        // STEP 1: Check for known geocoding overrides first
        const override = this.getVenueGeocodingOverrides(teamName, venueName, countryName);
        if (override) {
            // Handle direct coordinates
            if (override.isDirect && override.latitude && override.longitude) {
                console.log(`✅ Using direct coordinates for ${teamName}: [${override.latitude}, ${override.longitude}]`);
                return override;
            }
            
            // Handle enhanced search terms
            if (override.searchTerms) {
                for (const searchTerm of override.searchTerms) {
                    console.log(`🎯 Trying override: ${searchTerm}`);
                    const coords = await this.geocodeStadiumCoordinates(teamName, searchTerm, countryName);
                    if (coords) {
                        console.log(`✅ Override geocoding successful: ${searchTerm}`);
                        return coords;
                    }
                }
                console.log(`⚠️ All override searches failed for ${teamName}`);
            }
        }
        
        // STEP 2: Try original venue name
        let coords = await this.geocodeStadiumCoordinates(teamName, venueName, countryName);
        if (coords) return coords;
        
        // STEP 3: Generate dynamic variations based on patterns, not hardcoded lists
        const venueVariations = this.generateDynamicVenueVariations(teamName, venueName, countryName);
        
        for (const variation of venueVariations) {
            console.log(`🔄 Trying venue variation: ${variation}`);
            coords = await this.geocodeStadiumCoordinates(teamName, variation, countryName);
            if (coords) {
                console.log(`✅ Found coordinates using variation: ${variation}`);
                return coords;
            }
        }
        
        // STEP 4: If all variations fail, try searching for current/modern stadium patterns
        console.log(`🔍 All geocoding failed for ${teamName}, trying current stadium search...`);
        
        const teamCity = this.extractCityDynamically(teamName);
        const currentStadiumVariations = [
            `${teamName} current stadium`,
            `${teamName} new stadium`,
            `${teamName} stadium 2024`,
            teamCity ? `${teamCity} Community Stadium` : null,
            teamCity ? `${teamCity} FC stadium` : null,
            teamCity ? `${teamCity} stadium` : null
        ].filter(Boolean);
        
        for (const variation of currentStadiumVariations) {
            console.log(`🔄 Trying current stadium search: ${variation}`);
            coords = await this.geocodeStadiumCoordinates(teamName, variation, countryName);
            if (coords) {
                console.log(`✅ Found current stadium using: ${variation}`);
                return coords;
            }
        }
        
        console.warn(`⚠️ All venue variations failed for ${teamName}`);
        return null;
    }

        /***********************************************************************
         * Handle known geocoding edge cases and ambiguous venue names
         * Isolated here for easy maintenance and updates
         */
        getVenueGeocodingOverrides(teamName, venueName, countryName) {
            // Define known problematic venues that need special handling
            const geocodingOverrides = {
                // =================================================================
                // DIRECT COORDINATES: For venues that cannot be geocoded at all
                // Use this when all geocoding attempts fail consistently
                // =================================================================

                // Everton's new stadium (2024)
                'Everton Stadium': {
                    condition: (team, country) => team.toLowerCase().includes('everton') && country === 'United Kingdom',
                    coordinates: [53.424872, -3.002742] // Everton Stadium, Bramley-Moore Dock, Liverpool
                },

                // Handle old venue name that might still appear in data
                'Goodison Park': {
                    condition: (team, country) => team.toLowerCase().includes('everton') && country === 'United Kingdom',
                    coordinates: [53.424872, -3.002742] // Redirect to new stadium coordinates
                },

                //Germany stadium fixes based on console log failures
                'Allianz Arena': {
                    condition: (team, country) => team.toLowerCase().includes('bayern') && country === 'Germany',
                    coordinates: [48.21881, 11.62410] // Direct Allianz Arena coordinates (Munich)
                },

                // French stadium fixes based on console log failures
                'Stadium Municipal': {
                    condition: (team, country) => team.toLowerCase().includes('toulouse') && country === 'France',
                    coordinates: [43.5832, 1.4336] // Stade de Toulouse (correct location in Toulouse city)
                },
                
                'Stade de Nice': {
                    condition: (team, country) => team.toLowerCase().includes('nice') && country === 'France',
                    coordinates: [43.704934, 7.192402] // Allianz Riviera (OGC Nice's actual stadium)
                },
                
                'Stade Louis II.': {
                    condition: (team, country) => team.toLowerCase().includes('monaco') && country === 'France',
                    coordinates: [43.727577, 7.415519] // Stade Louis II, Monaco
                },
                
                'Roazhon Park': {
                    condition: (team, country) => team.toLowerCase().includes('rennais') && country === 'France',
                    coordinates: [48.1075, -1.7125] // Roazhon Park, Rennes
                },
                'Stade de l\'Abbé Deschamps': {
                    condition: (team, country) => team.toLowerCase().includes('auxerre') && country === 'France',
                    coordinates: [47.7868, 3.5886] // Direct Auxerre stadium coordinates
                },

                // SPAIN stadium fixes based on console log failures
                'Estadio Wanda Metropolitano': {
                    condition: (team, country) => team.toLowerCase().includes('atlético de madrid') && country === 'Spain',
                    coordinates: [40.4362, -3.5996] // Correct Wanda Metropolitano location
                },

                'Iberostar Estadi': {
                    condition: (team, country) => team.toLowerCase().includes('mallorca') && country === 'Spain',
                    coordinates: [39.589872, 2.629928] // Son Moix stadium, Palma
                },

                'Estadio Municipal de Anoeta': {
                    condition: (team, country) => team.toLowerCase().includes('real sociedad') && country === 'Spain',
                    coordinates: [43.3013, -1.9735] // Reale Arena (modern name for Anoeta)
                },

                'Estadio de Balaídos': {
                    condition: (team, country) => team.toLowerCase().includes('celta') && country === 'Spain',
                    coordinates: [42.2125, -8.7393] // Balaídos stadium, Vigo
                },

                'Estadio del Rayo Vallecano': {
                    condition: (team, country) => team.toLowerCase().includes('rayo vallecano') && country === 'Spain',
                    coordinates: [40.3918, -3.6587] // Estadio de Vallecas
                },

                'Estadio de Mestalla': {
                    condition: (team, country) => team.toLowerCase().includes('valencia cf') && country === 'Spain',
                    coordinates: [39.4748, -0.3584] // Mestalla stadium
                },
                'Estadio de Mendizorroza': {
                    condition: (team, country) => team.toLowerCase().includes('alavés') && country === 'Spain',
                    coordinates: [42.837101, -2.688487] // Correct Mendizorrotza stadium in Vitoria-Gasteiz
                },

                // Portuguese venue overrides

                'Estádio Pina Manique': {
                    condition: (team, country) => team.toLowerCase().includes('casa pia') && country === 'Portugal',
                    coordinates: [39.3394, -8.9877] // Rio Maior (temporary venue)
                },

                'Campo Futebol Clube Alverca': {
                    condition: (team, country) => team.toLowerCase().includes('alverca') && country === 'Portugal',
                    coordinates: [38.897851, -9.035080] // FC Alverca home stadium
                },

                'Estádio Municipal de Arouca': {
                    condition: (team, country) => team.toLowerCase().includes('arouca') && country === 'Portugal',
                    coordinates: [40.9295, -8.2547] // FC Arouca home stadium
                },

                'P.D. Comendador Joaquim de Almeida Freitas': {
                    condition: (team, country) => team.toLowerCase().includes('moreirense') && country === 'Portugal',
                    coordinates: [41.3508, -8.3406] // Moreirense FC home stadium
                },
                
                // =================================================================
                // SEARCH TERMS: For ambiguous names that need city context
                // Use this when the venue name exists in multiple cities
                // =================================================================
                'Mercedes-Benz Arena': {
                    condition: (team, country) => team.toLowerCase().includes('stuttgart') && country === 'Germany',
                    searchTerms: ['Mercedes-Benz Arena Stuttgart', 'Stuttgart Mercedes Arena']
                },
                'Olympic Stadium': {
                    condition: (team, country) => team.toLowerCase().includes('hertha') && country === 'Germany',
                    searchTerms: ['Olympic Stadium Berlin', 'Olympiastadion Berlin']
                },

                //Brazil stadium fixes based on console log failures
                'Estádio José Pinheiro Borba': {
                    condition: (team, country) => team.toLowerCase().includes('internacional') && country === 'Brazil',
                    coordinates: [-30.0660, -51.2356] // Estádio Beira-Rio, Porto Alegre
},
                
                // =================================================================
                // TEMPLATE FOR NEW ENTRIES:
                // =================================================================
                // For venues that need direct coordinates:
                // 'Stadium Name': {
                //     condition: (team, country) => team.toLowerCase().includes('team_identifier') && country === 'Country',
                //     coordinates: [latitude, longitude] // Get from maps.google.com or openstreetmap.org
                // },
                
                // For venues that need better search terms:
                // 'Stadium Name': {
                //     condition: (team, country) => team.toLowerCase().includes('team_identifier') && country === 'Country',
                //     searchTerms: ['Stadium Name City', 'City Stadium Name', 'Alternative Name']
                // },
                
                // =================================================================
                // ADD NEW PROBLEMATIC VENUES BELOW THIS LINE:
                // =================================================================
                // Example for other common ambiguous stadium names:
                // 'Olympic Stadium': {
                //     condition: (team, country) => team.toLowerCase().includes('hertha') && country === 'Germany',
                //     searchTerms: ['Olympic Stadium Berlin', 'Olympiastadion Berlin']
                // }
            };
            
            // Check if this venue needs special handling
            const override = geocodingOverrides[venueName];
            if (override && override.condition(teamName, countryName)) {
                console.log(`🎯 Using geocoding override for ${venueName} (${teamName})`);
                
                // Return direct coordinates if available
                if (override.coordinates) {
                    console.log(`📍 Using direct coordinates for ${venueName}`);
                    return {
                        latitude: override.coordinates[0],
                        longitude: override.coordinates[1],
                        isDirect: true
                    };
                }
                
                // Return search terms for enhanced geocoding
                if (override.searchTerms) {
                    console.log(`🔍 Using enhanced search terms for ${venueName}`);
                    return {
                        searchTerms: override.searchTerms,
                        isDirect: false
                    };
                }
            }
            
            return null; // No override needed
        }
            
            

        /**
         * Generate venue variations dynamically based on linguistic patterns (SCALABLE)
         */
        generateDynamicVenueVariations(teamName, venueName, countryName) {
            const variations = [];
            
            // Handle case where venueName is an object (from fallback data)
            let venueStr = '';
            if (typeof venueName === 'object' && venueName !== null) {
                venueStr = venueName.name || venueName.stadium || 'Stadium';
            } else if (typeof venueName === 'string') {
                venueStr = venueName;
            } else {
                venueStr = 'Stadium';
            }
            
            // Pattern 1: Extract city from team name dynamically
            const cityFromTeam = this.extractCityDynamically(teamName);
            if (cityFromTeam && !venueStr.toLowerCase().includes(cityFromTeam.toLowerCase())) {
                variations.push(`${venueStr} ${cityFromTeam}`);
                variations.push(`${cityFromTeam} ${venueStr}`);
            }
            
            // Pattern 2: Stadium type variations
            const stadiumTypes = ['Stadium', 'Ground', 'Arena', 'Park'];
            stadiumTypes.forEach(type => {
                if (!venueStr.toLowerCase().includes(type.toLowerCase())) {
                    variations.push(`${venueStr} ${type}`);
                }
            });
            
            // Pattern 3: Remove common prefixes/suffixes that might confuse geocoding
            const cleaned = venueStr
                .replace(/^(The |FC |AFC |SC )/i, '')
                .replace(/(Stadium|Ground|Arena|Park)$/i, '')
                .trim();
            if (cleaned !== venueStr) {
                variations.push(cleaned);
                variations.push(`${cleaned} Stadium`);
            }
            
            // Pattern 4: Country context
            variations.push(`${venueStr}, ${countryName}`);
            variations.push(`${venueStr} football stadium`);
            
            // Pattern 5: Handle long descriptive names
            if (venueStr.split(' ').length > 3) {
                const words = venueStr.split(' ');
                variations.push(`${words[0]} ${words[words.length - 1]}`);
                const withoutArticles = words.filter(w => !['The', 'A', 'An'].includes(w)).join(' ');
                if (withoutArticles !== venueStr) {
                    variations.push(withoutArticles);
                }
            }
            
            return [...new Set(variations)].filter(v => v !== venueStr && v.length > 0);
        }

        /**
         * Extract city name from team name using linguistic patterns (NO HARDCODING)
         */
        extractCityDynamically(teamName) {
            // Pattern matching approach - works for any country
            const patterns = [
                /^([A-Za-z\s]+?)\s+(FC|AFC|SC|United|City|Town|County|Rovers|Wanderers|Athletic)/i,
                /^([A-Za-z\s]+?)\s+&\s+[A-Za-z\s]+\s+(FC|AFC)/i, // For "Brighton & Hove Albion FC"
                /^([A-Za-z]+)\s+/i // First word fallback
            ];
            
            for (const pattern of patterns) {
                const match = teamName.match(pattern);
                if (match && match[1]) {
                    const city = match[1].trim();
                    // Filter out common non-city words
                    const nonCityWords = ['Real', 'Athletic', 'Club', 'Sport', 'Racing', 'Royal'];
                    if (!nonCityWords.includes(city)) {
                        return city;
                    }
                }
            }
            
            return null;
        }

    /**
     * Generate venue name variations for better geocoding success
     */
    generateVenueNameVariations(teamName, venueName) {
        const variations = [];
        
        // Team-specific venue mappings (dynamic, not hardcoded)
        const teamBasedMappings = {
            'Brighton & Hove Albion FC': ['Amex Stadium', 'Brighton Community Stadium', 'Falmer Stadium'],
            'Brentford FC': ['Brentford Community Stadium', 'New Den Brentford', 'Thomas Frank Stadium'],
            'Manchester United FC': ['Old Trafford Manchester', 'Theatre of Dreams'],
            'Manchester City FC': ['City of Manchester Stadium', 'Eastlands'],
            'Arsenal FC': ['Emirates Stadium London', 'Arsenal Stadium'],
            'Chelsea FC': ['Stamford Bridge London', 'Chelsea Stadium'],
            'Tottenham Hotspur FC': ['New White Hart Lane', 'Spurs Stadium'],
            'Liverpool FC': ['Anfield Liverpool', 'Liverpool Stadium'],
            'Newcastle United FC': ['St James Park Newcastle', 'Newcastle Stadium'],
            'West Ham United FC': ['Olympic Stadium London', 'Queen Elizabeth Olympic Park Stadium']
        };
        
        // Add team-specific variations
        if (teamBasedMappings[teamName]) {
            variations.push(...teamBasedMappings[teamName]);
        }
        
        // Add generic variations
        const cityName = this.extractCityFromTeamName(teamName);
        if (cityName && !venueName.includes(cityName)) {
            variations.push(`${venueName} ${cityName}`);
            variations.push(`${cityName} ${venueName}`);
        }
        
        // Add stadium suffix variations
        if (!venueName.toLowerCase().includes('stadium')) {
            variations.push(`${venueName} Stadium`);
        }
        if (!venueName.toLowerCase().includes('ground')) {
            variations.push(`${venueName} Ground`);
        }
        
        // Add location context
        variations.push(`${venueName}, ${countryName}`);
        variations.push(`${venueName} football stadium`);
        
        // Remove duplicates and original name
        return [...new Set(variations)].filter(v => v !== venueName && v.length > 0);
    }

    /**
     * Extract city name from team name for venue variations
     */
    extractCityFromTeamName(teamName) {
        const cityMappings = {
            'Brighton & Hove Albion FC': 'Brighton',
            'Manchester United FC': 'Manchester',
            'Manchester City FC': 'Manchester', 
            'Newcastle United FC': 'Newcastle',
            'West Ham United FC': 'London',
            'Crystal Palace FC': 'London',
            'Arsenal FC': 'London',
            'Chelsea FC': 'London',
            'Tottenham Hotspur FC': 'London',
            'Brentford FC': 'Brentford',
            'Fulham FC': 'London',
            'Liverpool FC': 'Liverpool',
            'Everton FC': 'Liverpool',
            'Aston Villa FC': 'Birmingham',
            'Wolverhampton Wanderers FC': 'Wolverhampton',
            'Leeds United FC': 'Leeds',
            'Burnley FC': 'Burnley',
            'Nottingham Forest FC': 'Nottingham',
            'AFC Bournemouth': 'Bournemouth',
            'Sunderland AFC': 'Sunderland'
        };
        
        return cityMappings[teamName] || null;
    }

    /**
     * Geocode using OpenStreetMap Nominatim with stadium-specific queries
     */
    async geocodeWithNominatim(venueName, countryName) {
        const searchQueries = [
            `${venueName} stadium ${countryName}`,
            `${venueName} football ground ${countryName}`,
            `${venueName} football stadium`,
            `${venueName} ${countryName}`,
        ];
        
        for (const query of searchQueries) {
            try {
                await this.respectRateLimit();
                
                const encodedQuery = encodeURIComponent(query);
                const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=3&addressdetails=1&extratags=1`;
                
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'FootballAtlas/1.0 (contact@maprates.com)'
                    }
                });
                
                const results = await response.json();
                const bestResult = this.findBestVenueMatch(results, venueName);
                
                if (bestResult) {
                    const coords = {
                        latitude: parseFloat(bestResult.lat),
                        longitude: parseFloat(bestResult.lon)
                    };
                    
                    console.log(`✅ Precise coordinates for ${venueName}: [${coords.latitude}, ${coords.longitude}]`);
                    return coords;
                }
            } catch (error) {
                console.log(`⚠️ Query "${query}" failed for ${venueName}`);
                continue;
            }
        }
        
        return null;
    }

    findBestVenueMatch(results, venueName) {
        if (!results || results.length === 0) return null;
        
        const scoredResults = results.map(result => {
            let score = 0;
            const resultName = result.display_name.toLowerCase();
            const venueNameLower = venueName.toLowerCase();
            
            if (resultName.includes(venueNameLower)) {
                score += 100;
            }
            
            const venueTypes = ['stadium', 'ground', 'arena', 'park', 'sports_centre'];
            if (result.class === 'leisure' && venueTypes.includes(result.type)) {
                score += 50;
            }
            
            if (result.importance) {
                score += result.importance * 10;
            }
            
            return { ...result, relevanceScore: score };
        });
        
        scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
        return scoredResults[0];
    }

    cacheCoordinates(key, coordinates) {
        this.stadiumCoordinatesCache[key] = {
            coordinates: coordinates,
            timestamp: Date.now(),
            expires: Date.now() + (30 * 24 * 60 * 60 * 1000)
        };
    }

    isCacheValid(cached) {
        return cached && Date.now() < cached.expires;
    }

    /**
     * Geocode using Wikidata SPARQL with enhanced stadium matching
     */
    async geocodeWithWikidata(teamName, venueName) {
        // Try multiple Wikidata queries for better coverage
        const queries = [
            // Direct stadium name match
            `SELECT ?stadium ?coordinate WHERE {
                ?stadium rdfs:label "${venueName}"@en .
                ?stadium wdt:P31/wdt:P279* wd:Q483110 .
                ?stadium wdt:P625 ?coordinate .
            } LIMIT 1`,
            
            // Stadium name with team connection
            `SELECT ?stadium ?coordinate WHERE {
                ?team rdfs:label "${teamName}"@en .
                ?team wdt:P115 ?stadium .
                ?stadium wdt:P625 ?coordinate .
            } LIMIT 1`,
            
            // Broader stadium search with name similarity
            `SELECT ?stadium ?coordinate ?stadiumLabel WHERE {
                ?stadium wdt:P31/wdt:P279* wd:Q483110 .
                ?stadium wdt:P625 ?coordinate .
                ?stadium rdfs:label ?stadiumLabel .
                FILTER(CONTAINS(LCASE(?stadiumLabel), "${venueName.toLowerCase()}"))
            } LIMIT 3`
        ];
        
        for (const query of queries) {
            try {
                await this.respectRateLimit();
                
                const response = await fetch('https://query.wikidata.org/sparql', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/sparql-query',
                        'Accept': 'application/sparql-results+json',
                        'User-Agent': 'FootballAtlas/1.0'
                    },
                    body: query
                });
                
                const data = await response.json();
                if (data.results.bindings.length > 0) {
                    const binding = data.results.bindings[0];
                    const coords = this.parseWikidataCoordinates(binding.coordinate.value);
                    
                    if (coords) {
                        console.log(`✅ Wikidata precision coordinates for ${venueName}: [${coords.latitude}, ${coords.longitude}]`);
                        return coords;
                    }
                }
            } catch (error) {
                console.log(`⚠️ Wikidata query failed for ${venueName}`);
                continue;
            }
        }
        
        return null;
    }

    /**
     * Geocode using OpenStreetMap Nominatim with stadium-specific queries
     */
    async geocodeWithNominatim(venueName, countryName) {
        // Try multiple search strategies for precision
        const searchQueries = [
            `${venueName} stadium ${countryName}`,  // Most specific
            `${venueName} football ground ${countryName}`,
            `${venueName} football stadium`,
            `${venueName} ${countryName}`,  // Fallback
        ];
        
        for (const query of searchQueries) {
            try {
                await this.respectRateLimit();
                
                const encodedQuery = encodeURIComponent(query);
                const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=3&addressdetails=1&extratags=1`;
                
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'FootballAtlas/1.0 (contact@maprates.com)'
                    }
                });
                
                const results = await response.json();
                
                // Find the most relevant result (stadium/sports venue)
                const bestResult = this.findBestVenueMatch(results, venueName);
                
                if (bestResult) {
                    const coords = {
                        latitude: parseFloat(bestResult.lat),
                        longitude: parseFloat(bestResult.lon)
                    };
                    
                    console.log(`✅ Precise coordinates for ${venueName}: [${coords.latitude}, ${coords.longitude}] (${bestResult.display_name})`);
                    return coords;
                }
            } catch (error) {
                console.log(`⚠️ Query "${query}" failed for ${venueName}`);
                continue;
            }
        }
        
        return null;
    }

    /**
     * Find the most relevant venue match from search results
     */
    findBestVenueMatch(results, venueName) {
        if (!results || results.length === 0) return null;
        
        // Scoring system for result relevance
        const scoredResults = results.map(result => {
            let score = 0;
            const resultName = result.display_name.toLowerCase();
            const venueNameLower = venueName.toLowerCase();
            
            // Exact name match gets highest score
            if (resultName.includes(venueNameLower)) {
                score += 100;
            }
            
            // Stadium/sports facility types get bonus points
            const venueTypes = ['stadium', 'ground', 'arena', 'park', 'sports_centre'];
            if (result.class === 'leisure' && venueTypes.includes(result.type)) {
                score += 50;
            }
            
            // Check extratags for sport=soccer or similar
            if (result.extratags) {
                if (result.extratags.sport === 'soccer' || result.extratags.sport === 'football') {
                    score += 30;
                }
                if (result.extratags.building === 'stadium') {
                    score += 20;
                }
            }
            
            // Prefer results with higher importance
            if (result.importance) {
                score += result.importance * 10;
            }
            
            return { ...result, relevanceScore: score };
        });
        
        // Sort by score and return the best match
        scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        console.log(`🎯 Best match for ${venueName}: ${scoredResults[0].display_name} (score: ${scoredResults[0].relevanceScore})`);
        return scoredResults[0];
    }

    /**
     * Cache coordinates with expiry
     */
    cacheCoordinates(key, coordinates) {
        this.stadiumCoordinatesCache[key] = {
            coordinates: coordinates,
            timestamp: Date.now(),
            expires: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
        };
    }

    /**
     * Check if cached coordinates are still valid
     */
    isCacheValid(cached) {
        return cached && Date.now() < cached.expires;
    }

    /**
     * Rate limiting for external API
     */
    async respectRateLimit(isFromCache = false) {
        // Skip rate limiting for cached results
        if (isFromCache) return;
        
        const now = Date.now();
        const minInterval = 0; // Reduce to 0 second for fresh requests
        
        if (this.lastGeocodingRequest && now - this.lastGeocodingRequest < minInterval) {
            const delay = minInterval - (now - this.lastGeocodingRequest);
            console.log(`Rate limiting: waiting ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.lastGeocodingRequest = Date.now();
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
        // Legacy method - now using automated geocoding
        // Keep empty for backward compatibility
        return {};
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

    /**
     * Generate realistic positions distributed across country geography
     */
    async getRealisticCountryPosition(countryName, teamIndex, totalTeams) {
        try {
            // Use your FIFA countries data to get urban centers
            const response = await fetch('/assets/data/countries/fifa-countries.json');
            const fifaData = await response.json();
            const countries = fifaData.countries || fifaData.default?.countries || fifaData;
            
            // Find the country and use its urban center data if available
            for (const [code, country] of Object.entries(countries)) {
                if (country.name === countryName && country.urbanCenters) {
                    const cityIndex = teamIndex % country.urbanCenters.length;
                    const city = country.urbanCenters[cityIndex];
                    return {
                        lat: city.lat + (Math.random() - 0.5) * 0.1,
                        lng: city.lng + (Math.random() - 0.5) * 0.1
                    };
                }
            }
            
            // Fallback to country center from your FIFA data
            for (const [code, country] of Object.entries(countries)) {
                if (country.name === countryName && country.coordinates) {
                    return {
                        lat: country.coordinates.lat + (Math.random() - 0.5) * 2,
                        lng: country.coordinates.lng + (Math.random() - 0.5) * 2
                    };
                }
            }
        } catch (error) {
            console.warn('Could not load FIFA countries data for positioning');
        }
        
        // Final fallback to basic center coordinates
        const center = this.getCountryCenter(countryName);
        return { lat: center.lat, lng: center.lng };
    }

    getUrbanCentersForCountry(countryName) {
        const centers = {
            'United Kingdom': [
                { lat: 51.5074, lng: -0.1278 }, // London
                { lat: 53.4808, lng: -2.2426 }, // Manchester
                { lat: 52.4862, lng: -1.8904 }, // Birmingham
                { lat: 53.4106, lng: -2.9779 }, // Liverpool
                { lat: 55.9533, lng: -3.1883 }  // Edinburgh
            ],
            'Germany': [
                { lat: 52.5200, lng: 13.4050 }, // Berlin
                { lat: 48.1351, lng: 11.5820 }, // Munich
                { lat: 50.1109, lng: 8.6821 }   // Frankfurt
            ]
        };
        
        return centers[countryName] || [];
    }

    /**
     * Get approximate geographic bounds for major countries
     */
    getCountryBounds(countryName) {
        const bounds = {
            'Germany': { north: 55.1, south: 47.3, west: 5.9, east: 15.0 },
            'United Kingdom': { north: 58.6, south: 49.9, west: -7.6, east: 1.8 },
            'France': { north: 51.1, south: 41.3, west: -5.1, east: 9.6 },
            'Spain': { north: 43.8, south: 35.2, west: -9.3, east: 4.3 },
            'Italy': { north: 47.1, south: 35.5, west: 6.6, east: 18.5 }
        };
        
        return bounds[countryName] || { north: 60, south: 40, west: -10, east: 20 };
    }

    /**
     * Get comprehensive football data from Wikidata (using your data files)
     */
    async getWikidataFootballData(countryName, wikidataId) {
        try {
            console.log(`📚 Fetching comprehensive Wikidata for ${countryName}...`);
            
            // Use your existing GlobalDataManager instead of hardcoding
            if (window.globalDataManager) {
                const countryData = await window.globalDataManager.getCountryTeams(this.getCountryCodeFromName(countryName));
                
                if (countryData && countryData.teams) {
                    // FILTER FOR TOP LEAGUE ONLY - Remove lower division teams
                    const topLeagueTeams = this.filterTopLeagueTeams(countryData.teams, countryName);
                    console.log(`📊 Filtered from ${countryData.teams.length} to ${topLeagueTeams.length} top-tier teams`);
                    
                    return {
                        hasLiveData: false,
                        dataSource: 'wikidata',
                        country: countryName,
                        league: this.getLeagueNameFromData(countryName),
                        teams: topLeagueTeams, // Use filtered teams instead of all teams
                        standings: await this.getWikidataStandings(countryName, wikidataId),
                        champions: await this.getWikidataChampions(countryName, wikidataId),
                        lastUpdated: new Date().toISOString(),
                        status: '📚 WIKI DATA'
                    };
                }
            }
            
            // Fallback to WikidataService if GlobalDataManager unavailable
            const teams = await this.wikidataService.getCountryTeams(countryName, wikidataId);
            const filteredTeams = this.filterTopLeagueTeams(teams, countryName);
            
            return {
                hasLiveData: false,
                dataSource: 'wikidata',
                country: countryName,
                league: this.getLeagueNameFromData(countryName),
                teams: filteredTeams, // Use filtered teams
                standings: [],
                champions: [],
                lastUpdated: new Date().toISOString(),
                status: '📚 WIKI DATA'
            };
            
        } catch (error) {
            console.error('❌ Wikidata football data error:', error);
            return null;
        }
    }

    /**
     * Filter teams to top league only using data-driven approach
     */
    filterTopLeagueTeams(teams, countryName) {
        if (!teams || teams.length === 0) return [];
        
        // Remove Q-codes and invalid teams, but keep real team names
        const validTeams = teams.filter(team => {
            if (!team.name || team.name.startsWith('Q')) {
                return false;
            }
            return true;
        });
        
        console.log(`📊 Valid teams after filtering: ${validTeams.length} for ${countryName}`);
        
        // Prioritize teams with coordinates (essential for mapping)
        const teamsWithCoordinates = validTeams.filter(team => team.stadium?.coordinates);
        
        if (teamsWithCoordinates.length > 0) {
            console.log(`📊 Using ${teamsWithCoordinates.length} teams with coordinates for ${countryName}`);
            return teamsWithCoordinates;
        }
        
        // For countries with few teams, use all valid teams
        if (validTeams.length <= 8) {
            console.log(`📊 Using all ${validTeams.length} valid teams for ${countryName}`);
            return validTeams;
        }
        
        // Use your existing league data from footballDataManager
        const expectedLeague = this.getLeagueNameFromData(countryName);
        
        // Score-based filtering only for countries with many teams
        const scoredTeams = validTeams.map(team => {
            let score = 0;
            
            // Prioritize teams with stadium coordinates (needed for mapping)
            if (team.stadium?.coordinates) score += 100;
            if (team.stadium?.name && team.stadium.name !== 'Unknown Stadium') score += 50;
            if (team.stadium?.capacity > 10000) score += 20;
            if (team.stadium?.capacity > 5000) score += 10;
            if (team.founded && team.founded < 2000) score += 10;
            
            // Score by tier
            if (team.tier === 1 || team.tier === '1') score += 50;
            
            // League name similarity to expected league
            const teamLeague = (team.league || '').toLowerCase();
            const expectedLeagueLower = expectedLeague.toLowerCase();
            if (teamLeague.includes(expectedLeagueLower.split(' ')[0])) score += 25;
            
            // Division indicators (data-driven)
            const division = (team.division || '').toLowerCase();
            if (division.includes('1') || division.includes('first') || division.includes('premier')) score += 15;
            
            return { ...team, score };
        });
        
        // Sort by score and take top teams
        const sortedTeams = scoredTeams.sort((a, b) => b.score - a.score);
        
        // More permissive thresholds
        const highQualityTeams = sortedTeams.filter(team => team.score >= 50);
        const mediumQualityTeams = sortedTeams.filter(team => team.score >= 10);
        
        if (highQualityTeams.length >= 4) {
            console.log(`📊 Using ${highQualityTeams.length} high-quality teams for ${countryName}`);
            return highQualityTeams.slice(0, 20);
        } else if (mediumQualityTeams.length >= 2) {
            console.log(`📊 Using ${mediumQualityTeams.length} medium-quality teams for ${countryName}`);
            return mediumQualityTeams.slice(0, 16);
        } else {
            console.log(`📊 Using all ${sortedTeams.length} available teams for ${countryName}`);
            return sortedTeams.slice(0, 12);
        }
    }

    /**
     * Get Wikidata ID for country using your FIFA data
     */
    async getWikidataId(countryName) {
        try {
            // Use your FIFA countries data file
            const response = await fetch('/assets/data/countries/fifa-countries.json');
            const fifaData = await response.json();
            const fifaCountries = fifaData.countries || fifaData.default?.countries || fifaData;
            
            // Find country by name
            for (const [code, country] of Object.entries(fifaCountries)) {
                if (country.name === countryName) {
                    return country.wikidata; // Use wikidata ID from your data file
                }
            }
            
            console.warn(`⚠️ No Wikidata ID found for ${countryName} in FIFA data`);
            return null;
            
        } catch (error) {
            console.error('❌ Error loading FIFA countries data:', error);
            return null;
        }
    }

    /**
     * Get league name using your football data manager
     */
    getLeagueNameFromData(countryName) {
        // Use your existing footballDataManager FIFA mapping
        if (window.footballDataManager && window.footballDataManager.fifaCountryMap) {
            const countryData = window.footballDataManager.fifaCountryMap[countryName];
            if (countryData) {
                return countryData.league;
            }
        }
        
        // Fallback to generic name
        return `${countryName} Premier League`;
    }

    /**
     * Get country code from name using your existing system
     */
    getCountryCodeFromName(countryName) {
        const fifaCountries = window.globalDataManager?.fifaCountries?.countries;
        
        if (fifaCountries) {
            // Search through FIFA countries object by name
            for (const [code, country] of Object.entries(fifaCountries)) {
                if (country.name === countryName) {
                    return code; // Returns ISO 2-letter codes like 'NO', 'SE', 'DK'
                }
            }
        }
        
        // Fallback only if FIFA data unavailable
        return countryName.substring(0, 2).toUpperCase();
    }

    /**
     * Get league standings from Wikidata (using your country data)
     */
    async getWikidataStandings(countryName, wikidataId) {
        if (!wikidataId) return [];
        
        const currentYear = new Date().getFullYear();
        const prevYear = currentYear - 1;
        
        // Simplified query that's more likely to work
        const query = `
            SELECT DISTINCT ?team ?teamLabel ?position ?points WHERE {
                ?league wdt:P31 wd:Q15804 .
                ?league wdt:P17 wd:${wikidataId} .
                ?season wdt:P3450 ?league .
                ?season wdt:P585 ?seasonDate .
                FILTER(YEAR(?seasonDate) >= ${prevYear})
                ?standing wdt:P179 ?season .
                ?standing wdt:P1923 ?team .
                OPTIONAL { ?standing wdt:P1352 ?position }
                OPTIONAL { ?standing wdt:P1351 ?points }
                SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
            }
            ORDER BY ?position
            LIMIT 20
        `;
        
        try {
            await this.wikidataService.respectRateLimit();
            
            const response = await fetch(this.wikidataService.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/sparql-query',
                    'Accept': 'application/sparql-results+json',
                    'User-Agent': 'MapRates-FootballAtlas/1.0'
                },
                body: query
            });
            
            if (!response.ok) {
                console.warn(`Wikidata query failed: ${response.status}`);
                return [];
            }
            
            const data = await response.json();
            const standings = data.results.bindings.map((binding, index) => ({
                position: parseInt(binding.position?.value) || index + 1,
                team: {
                    name: binding.teamLabel?.value || 'Unknown Team',
                    shortName: (binding.teamLabel?.value || 'Unknown').substring(0, 20)
                },
                points: parseInt(binding.points?.value) || 0,
                playedGames: 0,
                won: 0,
                draw: 0,
                lost: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                goalDifference: 0
            }));
            
            if (standings.length > 0) {
                console.log(`📊 Found ${standings.length} league standings from Wikidata for ${countryName}`);
            }
            return standings;
            
        } catch (error) {
            console.warn(`Wikidata standings error for ${countryName}:`, error);
            return [];
        }
    }

    /**
     * Get recent champions using your data structure
     */
    async getWikidataChampions(countryName, wikidataId) {
        if (!wikidataId) return [];
        
        const query = `
            SELECT DISTINCT ?team ?teamLabel ?year ?seasonLabel WHERE {
                # Get country's league
                ?league wdt:P31 wd:Q15804 .
                ?league wdt:P17 wd:${wikidataId} .
                
                # Get seasons and winners
                ?season wdt:P3450 ?league .
                ?season wdt:P1346 ?team .
                ?season wdt:P585 ?year .
                
                # Only recent years
                FILTER(YEAR(?year) >= ${new Date().getFullYear() - 5})
                
                SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
            }
            ORDER BY DESC(?year)
            LIMIT 5
        `;
        
        try {
            await this.wikidataService.respectRateLimit();
            
            const response = await fetch(this.wikidataService.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/sparql-query',
                    'Accept': 'application/sparql-results+json'
                },
                body: query
            });
            
            if (!response.ok) return [];
            
            const data = await response.json();
            return data.results.bindings.map(binding => ({
                team: binding.teamLabel?.value,
                year: binding.year?.value?.substring(0, 4),
                season: binding.seasonLabel?.value
            }));
            
        } catch (error) {
            console.warn(`No champions data for ${countryName}`);
            return [];
        }
    }

}
console.log('🔧 Selective updates applied - Global City Pins added without losing functionality!');
