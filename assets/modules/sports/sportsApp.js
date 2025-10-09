// BUILD VERSION: 2025-08-23-FINAL
console.log('🚀 LOADING SPORTSAPP.JS - VERSION 2025-08-23-FINAL');

/**
 * Standalone Sports App - Runs independently of currency app
 */

import { TabSwitcher } from './tabSwitcher.js';
// import { FootballDataManager } from './football/footballDataManager.js';

import { GlobalDataManager } from './data/globalDataManager.js';

// Load flag constants globally
import { FLAG_MAP } from '/assets/config/constants.js';
window.FLAG_MAP = FLAG_MAP;

import { CountryMapManager } from './countryMapManager.js';

import { GlobalFootballAtlas } from './data/globalFootballAtlas.js';

export class SportsApp {
    constructor() {
        this.initialized = false;
        this.active = false;
        this.tabSwitcher = null;
        this.footballManager = null;
        this.countryMapManager = null;
        this.globalDataManager = null;
        this.tooltipTimer = null;
        this.currentTooltipCountry = null;
        this.tooltipDelay = 150; // milliseconds
        this.isTooltipHovered = false;
        this.globalAtlas = null;
        this.originalMapEvents = new Map(); // Store original event handlers
    }

    async initialize() {
        console.log('🚀 NEW VERSION OF SPORTSAPP LOADING - BUILD 2025-08-23');
        if (this.initialized) return;
        
        try {
            // Initialize tab switcher
            this.tabSwitcher = new TabSwitcher();
            this.tabSwitcher.initialize();
            
            // Initialize global data manager FIRST
            console.log('🌍 Initializing Global Data Manager...');
            this.globalDataManager = new GlobalDataManager();
            await this.globalDataManager.initialize();
            console.log('✅ Global Data Manager ready for 211+ FIFA countries');
            
            // Initialize football data manager SECOND
            console.log('⚽ Loading FootballDataManager...');
            const cacheBuster = Date.now();
            const { FootballDataManager } = await import(`./football/footballDataManager.js?v=${cacheBuster}`);
            this.footballManager = new FootballDataManager();
            await this.footballManager.initialize();
            console.log('✅ FootballDataManager initialized');
            
            // Initialize country map manager THIRD (depends on football manager)
            console.log('🗺️ Initializing CountryMapManager...');
            this.countryMapManager = new CountryMapManager();
            await this.countryMapManager.initialize();
            console.log('✅ CountryMapManager initialized');

            // Initialize global football atlas LAST (depends on football manager)
            console.log('🌍 Creating Global Football Atlas...');
            const { GlobalFootballAtlas } = await import('./data/globalFootballAtlas.js');
            this.globalAtlas = new GlobalFootballAtlas(this.footballManager);
            window.globalFootballAtlas = this.globalAtlas;
            console.log('✅ Global Football Atlas created and exposed globally');
            
            // EXPOSE ALL TO GLOBAL WINDOW FOR ACCESS
            window.footballDataManager = this.footballManager;
            window.globalDataManager = this.globalDataManager;
            window.countryMapManager = this.countryMapManager; // <- KEY FIX
            window.sportsApp = this;
            
            this.initialized = true;
            console.log('✅ Sports App initialized with all global references');
            
        } catch (error) {
            console.error('❌ Sports App initialization failed:', error);
            throw error;
        }
    }

    async activate() {
        if (this.active) return;
        
        try {
            // ADD SPORTS MODE CLASS TO BODY
            document.body.classList.add('sports-mode');
            
            // HIDE ALL CURRENCY ELEMENTS
            this.hideCurrencyInterface();
            
            // APPLY SPORTS THEME
            this.applySportsTheme();
            
            // Store original map event handlers (to restore later)
            this.storeOriginalMapEvents();
            
            // Add sports-specific map behavior
            this.addSportsMapEvents();
            
            // Show sports interface
            this.showSportsInterface();

            // EXPOSE GLOBAL METHODS FOR onclick handlers
            window.countryMapManager = this.countryMapManager;
            window.sportsApp = this;
            
            // Make focusOnTeam available globally
            window.focusOnTeam = (teamIndex) => {
                if (this.countryMapManager && this.countryMapManager.focusOnTeam) {
                    this.countryMapManager.focusOnTeam(teamIndex);
                } else {
                    console.error('CountryMapManager or focusOnTeam method not available');
                }
            };

            // Start auto-updates for global data
            if (this.globalDataManager) {
                this.globalDataManager.startAutoUpdates();
                console.log('Auto-updates started for global team data');
            }
            
            this.active = true;
            console.log('Sports mode activated - Currency mode hidden');
            
        } catch (error) {
            console.error('Failed to activate sports mode:', error);
        }
    }

    async deactivate() {
        if (!this.active) return;
        
        try {
            // REMOVE SPORTS MODE CLASS FROM BODY
            document.body.classList.remove('sports-mode', 'no-currency-hover');
            
            // RESTORE CURRENCY INTERFACE
            this.restoreCurrencyInterface();
            
            // REMOVE SPORTS THEME
            this.removeSportsTheme();
            
            // Remove sports interface
            this.hideSportsInterface();
            
            // Remove sports map events
            this.removeSportsMapEvents();
            
            // Restore original map events
            this.restoreOriginalMapEvents();
            
            this.active = false;
            console.log('✅ Sports mode deactivated - Currency mode restored');
            
        } catch (error) {
            console.error('❌ Failed to deactivate sports mode:', error);
        }
    }

    restoreCurrencyInterface() {
        // Restore hidden elements
        if (this.hiddenElements) {
            this.hiddenElements.forEach(({ element, originalDisplay }) => {
                element.style.display = originalDisplay;
            });
            this.hiddenElements = [];
        }
    }

    removeSportsTheme() {
        const sportsStyle = document.getElementById('sports-theme');
        if (sportsStyle) sportsStyle.remove();
    }

    hideSportsInterface() {
        const sportsHeader = document.getElementById('sports-header');
        if (sportsHeader) sportsHeader.remove();
        
        // Restore map position
        const mapContainer = document.querySelector('.map-container') || document.querySelector('#map');
        if (mapContainer) {
            mapContainer.style.paddingTop = '';
        }
    }

    storeOriginalMapEvents() {
        // Store references to original currency map events
        // This is safe - we're just storing references, not changing anything
        const mapElement = document.querySelector('#map svg') || document.querySelector('.map-container');
        if (mapElement) {
            // Store original click handlers if they exist
            this.originalMapEvents.set('click', mapElement.onclick);
            this.originalMapEvents.set('mouseover', mapElement.onmouseover);
        }
    }

    addSportsMapEvents() {
        // Add sports-specific map interactions by targeting individual country paths
        const countryPaths = document.querySelectorAll('#worldMap path');
        console.log(`🗺️ Found ${countryPaths.length} country paths for sports events`);
        
        countryPaths.forEach(path => {
            // Add sports hover handler (use addEventListener instead of direct assignment)
            path.addEventListener('mouseenter', (event) => {
                this.handleSportsMapHover(event);
            });
            // Add sports leave handler
            path.addEventListener('mouseleave', (event) => {
                this.handleSportsMapLeave(event);
            });
            
            // Add sports click handler
            path.addEventListener('click', (event) => {
                event.stopPropagation();
                event.preventDefault();
                this.handleSportsMapClick(event);
            }, true); // Use capture phase
        });
    }

    handleSportsMapLeave(event) {
        // Clear the timer if mouse leaves before delay
        if (this.tooltipTimer) {
            clearTimeout(this.tooltipTimer);
            this.tooltipTimer = null;
        }
        
        // Don't hide tooltip immediately - give user time to move to tooltip
        setTimeout(() => {
            if (!this.isTooltipHovered) {
                this.hideTooltip();
            }
        }, 200); // 200ms grace period
    }

    hideTooltip() {
        const tooltip = document.getElementById('football-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
        this.currentTooltipCountry = null;
        this.isTooltipHovered = false;
    }

    removeSportsMapEvents() {
        const mapElement = document.querySelector('#map svg') || document.querySelector('.map-container');
        if (!mapElement) return;

        // Remove sports event handlers
        mapElement.onclick = null;
        mapElement.onmouseover = null;
    }

    restoreOriginalMapEvents() {
        const mapElement = document.querySelector('#map svg') || document.querySelector('.map-container');
        if (!mapElement) return;

        // Restore original currency event handlers
        mapElement.onclick = this.originalMapEvents.get('click');
        mapElement.onmouseover = this.originalMapEvents.get('mouseover');
    }

    async handleSportsMapClick(event) {
        console.log('⚽ SPORTS CLICK DETECTED!', event.target);
        
        // Get country from the event target
        const countryElement = event.target.closest('[data-id]') || event.target;
        const countryCode = countryElement.getAttribute('data-id') ||
                        countryElement.id ||
                        this.extractCountryFromClass(countryElement);

        if (!countryCode) return;

        // Get preliminary country name to check if it's valid
        let preliminaryCountryName = null;
        if (countryCode.startsWith('country_')) {
            const countryIndex = parseInt(countryCode.replace('country_', ''));
            const pathElement = document.querySelector(`#${countryCode}`);
            if (pathElement && pathElement.__data__ && window.mapManager && window.mapManager.getCountryNameFromFeature) {
                preliminaryCountryName = window.mapManager.getCountryNameFromFeature(pathElement.__data__, countryIndex);
            }
        }

        // FILTER OUT INVALID REGIONS - Don't show popups for these
        const invalidRegions = [
            'No currency system',
            'undefined',
            'Antarctica',
            'Greenland',
            'Western Sahara',
            'W. Sahara',
            'French Southern Territories',
            'Fr. S. Antarctic Lands',
            'Svalbard and Jan Mayen',
            'Bouvet Island',
            'Heard Island and McDonald Islands',
            'South Georgia and the South Sandwich Islands',
            'British Indian Ocean Territory',
            'United States Minor Outlying Islands'
        ];

        if (invalidRegions.includes(preliminaryCountryName)) {
            console.log(`🚫 Skipping invalid region click: ${preliminaryCountryName}`);
            return; // Exit early - no popup for invalid regions
        }

        console.log(`Sports: Clicked on valid country ${countryCode} (${preliminaryCountryName})`);

        // Get football data for this country
        const footballData = await this.footballManager.getCountryFootballData(countryCode);
        
        // Double-check the final country name isn't invalid
        if (invalidRegions.includes(footballData.countryName)) {
            console.log(`🚫 Skipping invalid final country: ${footballData.countryName}`);
            return;
        }

        // DIRECTLY OPEN DETAILED VIEW (same as clicking "Click for Detailed View" button)
        // This replaces the old showFootballInfo call
        console.log(`🗺️ Opening detailed view for ${footballData.countryName}...`);
        this.openCountryDetailView(countryCode, footballData.countryName, footballData);
    }

    async handleSportsMapHover(event) {
        const countryElement = event.target.closest('[data-id]') || event.target;
        const countryCode = countryElement.getAttribute('data-id') || 
                        countryElement.id || 
                        this.extractCountryFromClass(countryElement);

        if (!countryCode) return;

        // Clear any existing timer
        if (this.tooltipTimer) {
            clearTimeout(this.tooltipTimer);
            this.tooltipTimer = null;
        }
        
        // If hovering over the same country, do nothing
        if (this.currentTooltipCountry === countryCode) {
            return;
        }
        
        // EARLY CHECK: Skip invalid country IDs that we know will cause issues
        if (countryCode.startsWith('country_')) {
            const countryIndex = parseInt(countryCode.replace('country_', ''));
            // Skip certain indices that are known to be invalid (you can add more as needed)
            if ([6, 38, 39].includes(countryIndex)) {
                console.log(`🚫 Skipping known invalid region index: ${countryIndex}`);
                return;
            }
        }

        // Set a small delay before showing new tooltip
        this.tooltipTimer = setTimeout(async () => {
            console.log(`🎯 Sports hover on: ${countryCode}`);

            // Get football data for this country
            const footballData = await this.footballManager.getCountryFootballData(countryCode);
            
            console.log(`📊 Football data received:`, footballData);

            // Only filter out truly invalid regions
            const invalidRegions = [
                'No currency system',
                'undefined',
                'Country 39',
                'Antarctica',
                'Greenland', 
                'Western Sahara',
                'W. Sahara',
                'French Southern Territories',
                'Fr. S. Antarctic Lands',
                'Svalbard and Jan Mayen',
                'Bouvet Island',
                'Heard Island and McDonald Islands',
                'South Georgia and the South Sandwich Islands',
                'British Indian Ocean Territory',
                'United States Minor Outlying Islands'
            ];

            if (invalidRegions.includes(footballData.countryName)) {
                console.log(`🚫 Skipping invalid region: ${footballData.countryName}`);
                return;
            }

            // Show tooltip for ALL valid countries
            console.log(`✅ Showing tooltip for: ${footballData.countryName}`);
            this.showPremiumFootballTooltip(event, countryCode, footballData);
            this.currentTooltipCountry = countryCode;
        }, this.tooltipDelay);
    }

    extractCountryFromClass(element) {
        // Try to extract country code from class names
        const classes = element.className.baseVal || element.className || '';
        const match = classes.match(/country-([A-Z]{2,3})/i);
        return match ? match[1].toUpperCase() : null;
    }

    showSportsOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'sports-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 60px;
            left: 20px;
            background: rgba(0, 123, 255, 0.9);
            color: white;
            padding: 15px;
            border-radius: 8px;
            z-index: 9999;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        
        overlay.innerHTML = `
            <h3>⚽ Football Mode Active</h3>
            <p>Click on countries to see football league information</p>
            <p><strong>Live data:</strong> UK, Germany, Spain, Italy, France, Netherlands, Portugal, Brazil</p>
            <p><strong>Basic info:</strong> All other countries</p>
        `;
        
        document.body.appendChild(overlay);
    }

    hideSportsOverlay() {
        const overlay = document.getElementById('sports-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    showFootballInfo(countryCode, footballData) {
        // Remove existing info
        const existing = document.getElementById('football-info');
        if (existing) existing.remove();

        // Create info panel
        const infoPanel = document.createElement('div');
        infoPanel.id = 'football-info';
        infoPanel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            z-index: 10001;
            max-width: 400px;
            min-width: 300px;
        `;

        infoPanel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h2 style="margin: 0; color: #333;">${footballData.countryName || this.getCountryName(countryCode)}</h2>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
            </div>
            
            <div style="margin-bottom: 10px;">
                <span style="background: ${footballData.isLive ? '#28a745' : '#6c757d'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    ${footballData.status}
                </span>
            </div>
            
            <div style="margin-bottom: 15px;">
                <strong>League:</strong> ${footballData.league}
            </div>
            
            ${footballData.currentLeader ? `
                <div style="margin-bottom: 10px;">
                    <strong>Current Leader:</strong> ${footballData.currentLeader} (${footballData.points} pts)
                </div>
            ` : ''}
            
            ${footballData.lastChampion ? `
                <div style="margin-bottom: 10px;">
                    <strong>Last Champion:</strong> ${footballData.lastChampion}
                </div>
            ` : ''}
            
            ${footballData.nextMatch ? `
                <div style="margin-bottom: 10px;">
                    <strong>Next Match:</strong> ${footballData.nextMatch}
                </div>
            ` : ''}
            
            ${footballData.upgradePrompt ? `
                <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 6px; font-size: 14px; color: #6c757d;">
                    💡 ${footballData.upgradePrompt}
                </div>
            ` : ''}
            
            <div style="margin-top: 15px; font-size: 12px; color: #999;">
                Data source: ${footballData.dataSource || 'Educational database'}
            </div>
        `;

        document.body.appendChild(infoPanel);

        // Auto-close after 10 seconds
        setTimeout(() => {
            if (document.getElementById('football-info')) {
                infoPanel.remove();
            }
        }, 10000);
    }

    showPremiumFootballTooltip(event, countryCode, footballData) {
        console.log(`🎨 Creating premium tooltip for ${footballData.countryName}`);
        
        // Remove existing tooltip
        const existing = document.getElementById('football-tooltip');
        if (existing) existing.remove();

        // Get enhanced country data
        const countryName = footballData.countryName || this.getCountryName(countryCode);
        const flag = FLAG_MAP[countryName] || this.getCountryFlag(countryCode);
        const population = this.getCountryPopulation(countryCode);
        const heritage = this.getFootballHeritage(countryName);

        // Create premium tooltip with glassmorphism design
        const tooltip = document.createElement('div');
        tooltip.id = 'football-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            background: linear-gradient(145deg, rgba(26, 26, 46, 0.95), rgba(22, 33, 62, 0.95));
            color: white;
            padding: 20px;
            border-radius: 16px;
            font-size: 14px;
            z-index: 999999;
            pointer-events: auto;
            max-width: 350px;
            min-width: 300px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.1);
            backdrop-filter: blur(20px) saturate(180%);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            animation: tooltipFadeIn 0.3s ease-out;
        `;

        tooltip.innerHTML = `
            <style>
                @keyframes tooltipFadeIn {
                    0% { opacity: 0; transform: translateY(10px) scale(0.95); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                .heritage-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin: 6px 0;
                    color: #E0E0E0;
                    font-size: 13px;
                }
                .status-badge {
                    display: inline-block;
                    padding: 4px 10px;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: bold;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .live-badge { background: linear-gradient(45deg, #4CAF50, #45a049); }
                .static-badge { background: linear-gradient(45deg, #FF9800, #f57c00); }
                .cta-section {
                    background: linear-gradient(90deg, rgba(76, 175, 80, 0.2), rgba(32, 201, 151, 0.2));
                    border-radius: 10px;
                    padding: 12px;
                    margin-top: 15px;
                    border: 1px solid rgba(76, 175, 80, 0.3);
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .cta-section:hover {
                    transform: scale(1.02);
                    background: linear-gradient(90deg, rgba(76, 175, 80, 0.3), rgba(32, 201, 151, 0.3));
                }
            </style>
            
            <!-- Header Section -->
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px;">
                <span style="font-size: 32px; filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));">${flag}</span>
                <div style="flex: 1;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: bold; color: #4CAF50; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">${countryName}</h3>
                    <div style="color: #B0BEC5; font-size: 12px; margin-top: 2px;">
                        👥 ${population} • 🌍 ${this.getContinent(countryName)}
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="status-badge ${footballData.isLive ? 'live-badge' : 'static-badge'}">
                        ${footballData.isLive ? '🔴 LIVE' : '📊 INFO'}
                    </span>
                    <button onclick="document.getElementById('football-tooltip').remove()" style="
                        background: rgba(255,255,255,0.1);
                        border: 1px solid rgba(255,255,255,0.2);
                        color: rgba(255,255,255,0.7);
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 14px;
                        font-weight: bold;
                        transition: all 0.2s ease;
                        padding: 0;
                    " onmouseover="this.style.background='rgba(255,255,255,0.2)'; this.style.color='white';" 
                    onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.color='rgba(255,255,255,0.7)';">×</button>
                </div>
            </div>
            
            <!-- Football Section -->
            <div style="margin-bottom: 15px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                    <span style="font-size: 16px;">⚽</span>
                    <strong style="color: #64B5F6; font-size: 15px;">${footballData.league}</strong>
                </div>
                
                ${footballData.currentLeader ? `
                    <div class="heritage-item">
                        <span>🏆</span>
                        <span><strong>Current Leader:</strong> ${footballData.currentLeader} (${footballData.points} pts)</span>
                    </div>
                ` : ''}
                
                ${footballData.lastChampion ? `
                    <div class="heritage-item">
                        <span>🥇</span>
                        <span><strong>Last Champion:</strong> ${footballData.lastChampion}</span>
                    </div>
                ` : ''}
            </div>
            
            <!-- Football Heritage Section -->
            ${heritage.worldCups > 0 || heritage.regionalChampion || heritage.famousPlayers.length > 0 ? `
                <div style="margin-bottom: 15px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <div style="color: #FFD700; font-size: 13px; font-weight: bold; margin-bottom: 8px;">⭐ Football Heritage</div>
                    
                    ${heritage.worldCups > 0 ? `
                        <div class="heritage-item">
                            <span>🏆</span>
                            <span>${heritage.worldCups} World Cup${heritage.worldCups > 1 ? 's' : ''} (${heritage.worldCupYears})</span>
                        </div>
                    ` : ''}
                    
                    ${heritage.regionalChampion ? `
                        <div class="heritage-item">
                            <span>🥇</span>
                            <span>${heritage.regionalChampion} ${heritage.regionalWins}</span>
                        </div>
                    ` : ''}
                    
                    ${heritage.famousPlayers.length > 0 ? `
                        <div class="heritage-item">
                            <span>⭐</span>
                            <span><strong>Legend:</strong> ${heritage.famousPlayers[0]}</span>
                        </div>
                    ` : ''}
                    
                    ${heritage.topClubs.length > 0 ? `
                        <div class="heritage-item">
                            <span>🏟️</span>
                            <span><strong>Top Club:</strong> ${heritage.topClubs[0]}</span>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            <!-- Call-to-Action Section -->
            <div class="cta-section" id="detailed-view-cta">
                <div style="color: #4CAF50; font-size: 13px; font-weight: bold; margin-bottom: 4px;">
                    🖱️ Click for Detailed View
                </div>
                <div style="color: #B0BEC5; font-size: 11px;">
                    Explore leagues, stadiums & team locations
                </div>
            </div>
            
            <!-- Data Source -->
            <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 11px; color: #666; text-align: center;">
                ${footballData.dataSource || 'Educational Database'}
            </div>
        `;

        // Position tooltip smartly (avoid screen edges)
        let left = event.pageX + 15;
        let top = event.pageY - 10;
        
        // Prevent overflow
        if (left + 350 > window.innerWidth) {
            left = event.pageX - 365;
        }
        if (top + 400 > window.innerHeight) {
            top = event.pageY - 410;
        }
        
        tooltip.style.left = Math.max(10, left) + 'px';
        tooltip.style.top = Math.max(10, top) + 'px';

        document.body.appendChild(tooltip);

        // Add hover handlers to tooltip
        tooltip.addEventListener('mouseenter', () => {
            this.isTooltipHovered = true;
        });

        tooltip.addEventListener('mouseleave', () => {
            this.isTooltipHovered = false;
            this.hideTooltip();
        });

        // Add click handler for detailed view - using a simpler, more reliable approach
        const ctaButton = document.getElementById('detailed-view-cta');
        if (ctaButton) {
            ctaButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ CTA clicked for:', countryName);
                
                // Close tooltip immediately
                tooltip.remove();
                
                // Open detailed view
                this.openCountryDetailView(countryCode, countryName, footballData);
            });
            console.log(`✅ Click handler added for detailed view: ${countryName}`);
        }

        // Auto-remove tooltip after 6 seconds
        setTimeout(() => {
            if (document.getElementById('football-tooltip')) {
                tooltip.style.opacity = '0';
                tooltip.style.transform = 'translateY(-10px) scale(0.95)';
                setTimeout(() => tooltip.remove(), 300);
            }
        }, 6000);
    }

    // Add helper methods
    getCountryFlag(countryCode) {
        const flags = {
            'GB': '🇬🇧', 'DE': '🇩🇪', 'IT': '🇮🇹', 'ES': '🇪🇸', 'FR': '🇫🇷',
            'NL': '🇳🇱', 'PT': '🇵🇹', 'BR': '🇧🇷', 'NO': '🇳🇴', 'SE': '🇸🇪',
            'DK': '🇩🇰', 'US': '🇺🇸', 'AU': '🇦🇺', 'JP': '🇯🇵', 'CN': '🇨🇳',
            'IN': '🇮🇳', 'CA': '🇨🇦', 'MX': '🇲🇽', 'AR': '🇦🇷', 'RU': '🇷🇺'
        };
        return flags[countryCode] || '🌍';
    }

    getCountryPopulation(countryCode) {
        const populations = {
            'GB': '67.5M', 'DE': '83.2M', 'IT': '59.1M', 'ES': '47.4M', 'FR': '68.0M',
            'NL': '17.4M', 'PT': '10.3M', 'BR': '215M', 'NO': '5.4M', 'SE': '10.4M',
            'DK': '5.8M', 'US': '331M', 'AU': '25.7M', 'JP': '125M', 'CN': '1.41B',
            'IN': '1.38B', 'CA': '38.2M', 'MX': '129M', 'AR': '45.4M', 'RU': '146M'
        };
        return populations[countryCode] || 'N/A';
    }

    getCountryName(countryCode) {
        const countryNames = {
            'GB': 'United Kingdom', 'DE': 'Germany', 'IT': 'Italy', 'ES': 'Spain',
            'FR': 'France', 'NL': 'Netherlands', 'PT': 'Portugal', 'BR': 'Brazil',
            'NO': 'Norway', 'SE': 'Sweden', 'DK': 'Denmark', 'US': 'United States'
        };
        return countryNames[countryCode] || countryCode;
    }

    getStatus() {
        return {
            initialized: this.initialized,
            active: this.active,
            football: this.footballManager?.getStatus() || null
        };
    }

    //  METHODS INSIDE THE CLASS
    hideCurrencyInterface() {
        // Hide currency calculator
        const calculator = document.querySelector('.calculator') || document.querySelector('#calculator');
        if (calculator) {
            calculator.style.display = 'none';
            this.hiddenElements = this.hiddenElements || [];
            this.hiddenElements.push({ element: calculator, originalDisplay: calculator.style.display });
        }
        
        // Hide ALL currency text and instructions
        document.querySelectorAll('.country-popup, .currency-tooltip, .currency-instructions').forEach(el => {
            el.style.display = 'none';
        });
        
        // Hide currency buttons/controls/dropdowns
        document.querySelectorAll('.currency-controls, .add-destination-btn, .remove-destination-btn, select, .currency-selector, .destination-container').forEach(el => {
            el.style.display = 'none';
            this.hiddenElements = this.hiddenElements || [];
            this.hiddenElements.push({ element: el, originalDisplay: el.style.display || 'block' });
        });
        
        // Hide text content about currency
        const textElements = document.querySelectorAll('p, div, span');
        textElements.forEach(el => {
            if (el.textContent.includes('Professional currency analysis') || 
                el.textContent.includes('Click countries for instant analysis') ||
                el.textContent.includes('Click countries to select')) {
                el.style.display = 'none';
                this.hiddenElements = this.hiddenElements || [];
                this.hiddenElements.push({ element: el, originalDisplay: el.style.display || 'block' });
            }
        });
        
        // Disable currency hover events
        document.body.classList.add('no-currency-hover');
    }

    applySportsTheme() {
        // Add sports theme CSS
        const sportsStyle = document.createElement('style');
        sportsStyle.id = 'sports-theme';
        sportsStyle.textContent = `
            .sports-mode {
                --primary-color: #28a745;
                --secondary-color: #20c997;
                --accent-color: #fd7e14;
            }
            
            .sports-mode .no-currency-hover .country:hover {
                /* Disable currency hover effects */
                stroke: none !important;
                fill: none !important;
            }
            
            /* FORCE the map to be visible with higher specificity */
            .sports-mode #worldMap,
            body.sports-mode #worldMap,
            html body.sports-mode #worldMap {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            }
            
            .sports-mode .map-container,
            body.sports-mode .map-container {
                display: block !important;
                height: 100vh !important;
                visibility: visible !important;
            }
            
            /* Hide currency UI elements but keep map visible */
            .sports-mode select,
            .sports-mode .currency-selector,
            .sports-mode .destination-container,
            .sports-mode .currency-controls,
            .sports-mode .add-destination-btn,
            .sports-mode .remove-destination-btn {
                display: none !important;
            }
        `;
        document.head.appendChild(sportsStyle);
    }

    showSportsInterface() {
        // Remove the basic overlay, add full sports interface
        this.hideSportsOverlay();
        
        // CREATE MAP CONTAINER IF IT DOESN'T EXIST
        let mapContainer = document.querySelector('#map');
        if (!mapContainer) {
            console.log('🔧 Creating missing map container...');
            mapContainer = document.createElement('div');
            mapContainer.id = 'map';
            mapContainer.style.cssText = `
                width: 100%;
                height: calc(100vh - 80px);
                margin-top: 80px;
                display: flex;
                justify-content: center;
                align-items: center;
                position: relative;
            `;
            
            // Find the SVG and put it in the container
            const worldMap = document.querySelector('#worldMap');
            if (worldMap) {
                // Remove SVG from wherever it currently is
                worldMap.remove();
                // Add it to our new container
                mapContainer.appendChild(worldMap);
            }
            
            // Add container to page
            document.body.appendChild(mapContainer);
            console.log('✅ Map container created and SVG moved into it');
        }
        
        // FORCE show ALL map elements
        const worldMap = document.querySelector('#worldMap');
        
        if (mapContainer) {
            mapContainer.style.display = 'block';
            mapContainer.style.visibility = 'visible';
            mapContainer.style.opacity = '1';
            console.log('✅ Map container forced visible');
        }
        
        if (worldMap) {
            worldMap.style.display = 'block';
            worldMap.style.visibility = 'visible';
            worldMap.style.opacity = '1';
            worldMap.style.width = '100%';
            worldMap.style.height = 'auto';
            console.log('✅ World map SVG forced visible');
        }
        
        // Force all country paths to be visible
        const countryPaths = document.querySelectorAll('#worldMap path');
        countryPaths.forEach(path => {
            path.style.visibility = 'visible';
            path.style.opacity = '1';
        });
        console.log(`✅ Forced ${countryPaths.length} country paths visible`);
        
        // Create sports header
        const sportsHeader = document.createElement('div');
        sportsHeader.id = 'sports-header';
        sportsHeader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            padding: 15px 20px;
            z-index: 10000;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        
        sportsHeader.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <h1 style="margin: 0; font-size: 24px; font-weight: bold;">⚽ MapRates Sports</h1>
                <div style="font-size: 14px; opacity: 0.9;">Live Football Data & League Information</div>
            </div>
            <button id="back-to-currency" style="
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
            " onclick="window.sportsApp.deactivate()">← Back to Currency</button>
        `;
        
        document.body.appendChild(sportsHeader);

        

        // Add back button functionality with better error handling
        setTimeout(() => {
            const backButton = document.getElementById('back-to-currency');
            if (backButton) {
                backButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Back button clicked - deactivating sports mode');
                    this.deactivate();
                });
            } else {
                console.error('Back button not found!');
            }
        }, 100);
    }

    /**
     * Add missing league table functionality
     */
    async showLeagueTable(countryName) {
        console.log(`Loading league table for ${countryName}...`);
        
        // Create and show modal
        const modal = this.createModal(`League Table - ${countryName}`);
        
        // Show loading state
        const modalBody = modal.querySelector('.modal-body');
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 40px; color: white;">
                <div style="font-size: 48px; margin-bottom: 20px;">⚽</div>
                <div style="font-size: 18px; margin-bottom: 10px;">Loading League Table...</div>
                <div style="font-size: 14px; opacity: 0.7;">Fetching latest standings</div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // Get real data from football manager
        try {
            const footballData = await this.footballManager.getCountryFootballData(countryName);
            setTimeout(() => {
                modalBody.innerHTML = this.generateLeagueTableHTML(countryName, footballData);
            }, 1000);
        } catch (error) {
            setTimeout(() => {
                modalBody.innerHTML = `<div style="text-align: center; color: #e74c3c;">Error loading league data</div>`;
            }, 1000);
        }
    }

    generateLeagueTableHTML(countryName, footballData) {
        // Use real data if available, otherwise sample data
        const standings = footballData?.standings || this.getSampleStandings(countryName);

        return `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; background: #2c3e50; border-radius: 8px; overflow: hidden;">
                    <thead>
                        <tr style="background: linear-gradient(135deg, #34495e, #2c3e50); color: white;">
                            <th style="padding: 12px 8px; text-align: center; font-size: 12px;">POS</th>
                            <th style="padding: 12px; text-align: left; font-size: 12px;">TEAM</th>
                            <th style="padding: 12px 8px; text-align: center; font-size: 12px;">P</th>
                            <th style="padding: 12px 8px; text-align: center; font-size: 12px;">W</th>
                            <th style="padding: 12px 8px; text-align: center; font-size: 12px;">D</th>
                            <th style="padding: 12px 8px; text-align: center; font-size: 12px;">L</th>
                            <th style="padding: 12px 8px; text-align: center; font-size: 12px;">GD</th>
                            <th style="padding: 12px 8px; text-align: center; font-size: 12px;">PTS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${standings.map((team, index) => `
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: white; ${index < 4 ? 'background: rgba(46, 204, 113, 0.1);' : index >= standings.length - 3 ? 'background: rgba(231, 76, 60, 0.1);' : ''}">
                                <td style="padding: 12px 8px; text-align: center; font-weight: bold; color: ${index < 4 ? '#2ecc71' : index >= standings.length - 3 ? '#e74c3c' : 'white'};">${team.position || index + 1}</td>
                                <td style="padding: 12px; font-weight: 500;">${team.team?.name || team.name}</td>
                                <td style="padding: 12px 8px; text-align: center;">${team.playedGames || team.played || 0}</td>
                                <td style="padding: 12px 8px; text-align: center;">${team.won || 0}</td>
                                <td style="padding: 12px 8px; text-align: center;">${team.draw || 0}</td>
                                <td style="padding: 12px 8px; text-align: center;">${team.lost || 0}</td>
                                <td style="padding: 12px 8px; text-align: center; color: ${(team.goalDifference || 0) > 0 ? '#2ecc71' : (team.goalDifference || 0) < 0 ? '#e74c3c' : 'white'};">${(team.goalDifference || 0) > 0 ? '+' : ''}${team.goalDifference || 0}</td>
                                <td style="padding: 12px 8px; text-align: center; font-weight: bold; color: #f1c40f;">${team.points || 0}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div style="margin-top: 15px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 6px; color: #bdc3c7; font-size: 11px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>🟢 Top 4: Champions League</span>
                    <span>🔴 Bottom 3: Relegation Zone</span>
                </div>
                <div style="text-align: center; opacity: 0.8;">
                    Last updated: ${footballData?.lastUpdated || 'Recently'} • Source: ${footballData?.dataSource || 'football-data.org'}
                </div>
            </div>
        `;
    }

    getSampleStandings(countryName) {
        // Sample data for demonstration
        const samples = {
            'United Kingdom': [
                { name: 'Manchester City', played: 28, won: 20, draw: 5, lost: 3, goalDifference: 41, points: 65 },
                { name: 'Arsenal', played: 28, won: 19, draw: 6, lost: 3, goalDifference: 35, points: 63 },
                { name: 'Liverpool', played: 28, won: 17, draw: 8, lost: 3, goalDifference: 28, points: 59 },
                { name: 'Aston Villa', played: 28, won: 16, draw: 6, lost: 6, goalDifference: 15, points: 54 }
            ],
            'Germany': [
                { name: 'Bayern Munich', played: 25, won: 18, draw: 4, lost: 3, goalDifference: 35, points: 58 },
                { name: 'Borussia Dortmund', played: 25, won: 16, draw: 6, lost: 3, goalDifference: 28, points: 54 },
                { name: 'RB Leipzig', played: 25, won: 15, draw: 5, lost: 5, goalDifference: 22, points: 50 },
                { name: 'Bayer Leverkusen', played: 25, won: 14, draw: 7, lost: 4, goalDifference: 18, points: 49 }
            ]
        };
        
        return samples[countryName] || [
            { name: `${countryName} FC`, played: 20, won: 12, draw: 5, lost: 3, goalDifference: 15, points: 41 },
            { name: `${countryName} United`, played: 20, won: 10, draw: 6, lost: 4, goalDifference: 8, points: 36 }
        ];
    }

    createModal(title) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            display: none;
            position: fixed;
            z-index: 15000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.8);
            backdrop-filter: blur(5px);
        `;

        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                margin: 3% auto;
                padding: 0;
                border-radius: 15px;
                width: 85%;
                max-width: 900px;
                color: white;
                box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
                max-height: 85vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            ">
                <div style="
                    background: linear-gradient(135deg, #3498db, #2980b9);
                    padding: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-shrink: 0;
                ">
                    <h2 style="margin: 0; color: white; font-size: 20px;">${title}</h2>
                    <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" style="
                        background: rgba(255,255,255,0.2);
                        border: none;
                        color: white;
                        width: 36px;
                        height: 36px;
                        border-radius: 50%;
                        cursor: pointer;
                        font-size: 18px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">×</button>
                </div>
                <div class="modal-body" style="padding: 25px; overflow-y: auto; flex: 1;">
                    <!-- Content will be populated here -->
                </div>
            </div>
        `;

        return modal;
    }

    async showStadiumMap(countryName) {
        console.log(`Opening stadium map for ${countryName}...`);
        
        // Use the existing country detail map functionality
        const countryCode = this.getCountryCodeFromName(countryName);
        const footballData = await this.footballManager.getCountryFootballData(countryCode);
        
        // Open the detailed country view which includes stadium locations
        this.openCountryDetailView(countryCode, countryName, footballData);
    }

    getCountryCodeFromName(countryName) {
        const codes = {
            'United Kingdom': 'GB',
            'Germany': 'DE',
            'Spain': 'ES',
            'Italy': 'IT',
            'France': 'FR',
            'Netherlands': 'NL',
            'Portugal': 'PT',
            'Brazil': 'BR'
        };
        return codes[countryName] || countryName;
    }

    /**
     * Get flag from your existing constants.js file
     */
    //getFlagFromConstants(countryName) {
      //  return FLAG_MAP[countryName] || null;
    // } - this is not need as I added this directly in showPremiumFootballTooltip method

    /**
     * Get continent for country (ALL 211+ FIFA MEMBERS)
     */
    getContinent(countryName) {
        const continents = {
            // EUROPE (UEFA - 55 members)
            'Albania': 'Europe', 'Andorra': 'Europe', 'Armenia': 'Europe', 'Austria': 'Europe', 'Azerbaijan': 'Europe',
            'Belarus': 'Europe', 'Belgium': 'Europe', 'Bosnia and Herzegovina': 'Europe', 'Bulgaria': 'Europe',
            'Croatia': 'Europe', 'Cyprus': 'Europe', 'Czech Republic': 'Europe', 'Czechia': 'Europe', 'Denmark': 'Europe',
            'England': 'Europe', 'Estonia': 'Europe', 'Faroe Islands': 'Europe', 'Finland': 'Europe', 'France': 'Europe',
            'Georgia': 'Europe', 'Germany': 'Europe', 'Gibraltar': 'Europe', 'Greece': 'Europe', 'Hungary': 'Europe',
            'Iceland': 'Europe', 'Ireland': 'Europe', 'Israel': 'Europe', 'Italy': 'Europe', 'Kazakhstan': 'Europe',
            'Kosovo': 'Europe', 'Latvia': 'Europe', 'Liechtenstein': 'Europe', 'Lithuania': 'Europe', 'Luxembourg': 'Europe',
            'Malta': 'Europe', 'Moldova': 'Europe', 'Monaco': 'Europe', 'Montenegro': 'Europe', 'Netherlands': 'Europe',
            'North Macedonia': 'Europe', 'Macedonia': 'Europe', 'Norway': 'Europe', 'Poland': 'Europe', 'Portugal': 'Europe',
            'Romania': 'Europe', 'Russia': 'Europe', 'San Marino': 'Europe', 'Scotland': 'Europe', 'Serbia': 'Europe',
            'Slovakia': 'Europe', 'Slovenia': 'Europe', 'Spain': 'Europe', 'Sweden': 'Europe', 'Switzerland': 'Europe',
            'Turkey': 'Europe', 'Ukraine': 'Europe', 'United Kingdom': 'Europe', 'Wales': 'Europe',

            // SOUTH AMERICA (CONMEBOL - 10 members)
            'Argentina': 'South America', 'Bolivia': 'South America', 'Brazil': 'South America', 'Chile': 'South America',
            'Colombia': 'South America', 'Ecuador': 'South America', 'Paraguay': 'South America', 'Peru': 'South America',
            'Uruguay': 'South America', 'Venezuela': 'South America',

            // NORTH/CENTRAL AMERICA & CARIBBEAN (CONCACAF - 41 members)
            'Anguilla': 'North America', 'Antigua and Barbuda': 'North America', 'Aruba': 'North America', 'Bahamas': 'North America',
            'Barbados': 'North America', 'Belize': 'North America', 'Bermuda': 'North America', 'British Virgin Islands': 'North America',
            'Canada': 'North America', 'Cayman Islands': 'North America', 'Costa Rica': 'North America', 'Cuba': 'North America',
            'Curaçao': 'North America', 'Dominica': 'North America', 'Dominican Republic': 'North America', 'El Salvador': 'North America',
            'Grenada': 'North America', 'Guadeloupe': 'North America', 'Guatemala': 'North America', 'Guyana': 'North America',
            'Haiti': 'North America', 'Honduras': 'North America', 'Jamaica': 'North America', 'Martinique': 'North America',
            'Mexico': 'North America', 'Montserrat': 'North America', 'Nicaragua': 'North America', 'Panama': 'North America',
            'Puerto Rico': 'North America', 'Saint Kitts and Nevis': 'North America', 'Saint Lucia': 'North America',
            'Saint Martin': 'North America', 'Saint Vincent and the Grenadines': 'North America', 'Sint Maarten': 'North America',
            'Suriname': 'North America', 'Trinidad and Tobago': 'North America', 'Turks and Caicos Islands': 'North America',
            'United States': 'North America', 'United States of America': 'North America', 'US Virgin Islands': 'North America',

            // AFRICA (CAF - 54 members)
            'Algeria': 'Africa', 'Angola': 'Africa', 'Benin': 'Africa', 'Botswana': 'Africa', 'Burkina Faso': 'Africa',
            'Burundi': 'Africa', 'Cameroon': 'Africa', 'Cape Verde': 'Africa', 'Central African Republic': 'Africa',
            'Chad': 'Africa', 'Comoros': 'Africa', 'Congo': 'Africa', 'Democratic Republic of the Congo': 'Africa',
            'Dem. Rep. Congo': 'Africa', 'Djibouti': 'Africa', 'Egypt': 'Africa', 'Equatorial Guinea': 'Africa',
            'Eritrea': 'Africa', 'Eswatini': 'Africa', 'Ethiopia': 'Africa', 'Gabon': 'Africa', 'Gambia': 'Africa',
            'Ghana': 'Africa', 'Guinea': 'Africa', 'Guinea-Bissau': 'Africa', 'Ivory Coast': 'Africa', 'Côte d\'Ivoire': 'Africa',
            'Kenya': 'Africa', 'Lesotho': 'Africa', 'Liberia': 'Africa', 'Libya': 'Africa', 'Madagascar': 'Africa',
            'Malawi': 'Africa', 'Mali': 'Africa', 'Mauritania': 'Africa', 'Mauritius': 'Africa', 'Morocco': 'Africa',
            'Mozambique': 'Africa', 'Namibia': 'Africa', 'Niger': 'Africa', 'Nigeria': 'Africa', 'Rwanda': 'Africa',
            'São Tomé and Príncipe': 'Africa', 'Senegal': 'Africa', 'Seychelles': 'Africa', 'Sierra Leone': 'Africa',
            'Somalia': 'Africa', 'South Africa': 'Africa', 'South Sudan': 'Africa', 'Sudan': 'Africa', 'Tanzania': 'Africa',
            'Togo': 'Africa', 'Tunisia': 'Africa', 'Uganda': 'Africa', 'Zambia': 'Africa', 'Zimbabwe': 'Africa',

            // ASIA (AFC - 47 members)
            'Afghanistan': 'Asia', 'Australia': 'Oceania', 'Bahrain': 'Asia', 'Bangladesh': 'Asia', 'Bhutan': 'Asia',
            'Brunei': 'Asia', 'Cambodia': 'Asia', 'China': 'Asia', 'Chinese Taipei': 'Asia', 'Taiwan': 'Asia',
            'Guam': 'Oceania', 'Hong Kong': 'Asia', 'India': 'Asia', 'Indonesia': 'Asia', 'Iran': 'Asia', 'Iraq': 'Asia',
            'Japan': 'Asia', 'Jordan': 'Asia', 'Kuwait': 'Asia', 'Kyrgyzstan': 'Asia', 'Laos': 'Asia', 'Lebanon': 'Asia',
            'Macau': 'Asia', 'Malaysia': 'Asia', 'Maldives': 'Asia', 'Mongolia': 'Asia', 'Myanmar': 'Asia', 'Nepal': 'Asia',
            'North Korea': 'Asia', 'Oman': 'Asia', 'Pakistan': 'Asia', 'Palestine': 'Asia', 'Philippines': 'Asia',
            'Qatar': 'Asia', 'Saudi Arabia': 'Asia', 'Singapore': 'Asia', 'South Korea': 'Asia', 'Sri Lanka': 'Asia',
            'Syria': 'Asia', 'Tajikistan': 'Asia', 'Thailand': 'Asia', 'Timor-Leste': 'Asia', 'Turkmenistan': 'Asia',
            'United Arab Emirates': 'Asia', 'Uzbekistan': 'Asia', 'Vietnam': 'Asia', 'Yemen': 'Asia',

            // OCEANIA (OFC - 11 members)
            'American Samoa': 'Oceania', 'Cook Islands': 'Oceania', 'Fiji': 'Oceania', 'Kiribati': 'Oceania',
            'New Caledonia': 'Oceania', 'New Zealand': 'Oceania', 'Papua New Guinea': 'Oceania', 'Samoa': 'Oceania',
            'Solomon Islands': 'Oceania', 'Tahiti': 'Oceania', 'Tonga': 'Oceania', 'Vanuatu': 'Oceania'
        };
        
        return continents[countryName] || 'World';
    }

    /**
     * Get football heritage data (COMPLETE FIFA DATA with REGIONAL CHAMPIONSHIPS - ALL 211+ COUNTRIES)
     */
    getFootballHeritage(countryName) {
        const heritage = {
            // WORLD CUP WINNERS (8 countries) + REGIONAL CHAMPIONSHIPS
            'Brazil': { 
                worldCups: 5, worldCupYears: '1958, 1962, 1970, 1994, 2002', 
                regionalChampion: 'Copa América Champion', regionalWins: '9x (1919-2019)',
                famousPlayers: ['Pelé', 'Ronaldo', 'Ronaldinho'], topClubs: ['Santos', 'Flamengo', 'São Paulo'] 
            },
            'Germany': { 
                worldCups: 4, worldCupYears: '1954, 1974, 1990, 2014', 
                regionalChampion: 'European Champion', regionalWins: '3x (1972, 1980, 1996)',
                famousPlayers: ['Franz Beckenbauer', 'Gerd Müller'], topClubs: ['Bayern Munich', 'Borussia Dortmund'] 
            },
            'Italy': { 
                worldCups: 4, worldCupYears: '1934, 1938, 1982, 2006', 
                regionalChampion: 'European Champion', regionalWins: '2x (1968, 2021)',
                famousPlayers: ['Roberto Baggio', 'Francesco Totti'], topClubs: ['Juventus', 'AC Milan', 'Inter Milan'] 
            },
            'Argentina': { 
                worldCups: 3, worldCupYears: '1978, 1986, 2022', 
                regionalChampion: 'Copa América Champion', regionalWins: '15x (1921-2021)',
                famousPlayers: ['Diego Maradona', 'Lionel Messi'], topClubs: ['Boca Juniors', 'River Plate'] 
            },
            'France': { 
                worldCups: 2, worldCupYears: '1998, 2018', 
                regionalChampion: 'European Champion', regionalWins: '2x (1984, 2000)',
                famousPlayers: ['Zinedine Zidane', 'Thierry Henry'], topClubs: ['Paris Saint-Germain', 'Marseille'] 
            },
            'Uruguay': { 
                worldCups: 2, worldCupYears: '1930, 1950', 
                regionalChampion: 'Copa América Champion', regionalWins: '15x (1916-2011)',
                famousPlayers: ['Diego Forlán', 'Luis Suárez'], topClubs: ['Nacional', 'Peñarol'] 
            },
            'United Kingdom': { 
                worldCups: 1, worldCupYears: '1966', 
                regionalChampion: 'European Champion', regionalWins: '1x (2021)',
                famousPlayers: ['Bobby Charlton', 'David Beckham'], topClubs: ['Manchester United', 'Liverpool', 'Arsenal'] 
            },
            'England': { 
                worldCups: 1, worldCupYears: '1966', 
                regionalChampion: 'European Champion', regionalWins: '1x (2021)',
                famousPlayers: ['Bobby Charlton', 'David Beckham'], topClubs: ['Manchester United', 'Liverpool', 'Arsenal'] 
            },
            'Spain': { 
                worldCups: 1, worldCupYears: '2010', 
                regionalChampion: 'European Champion', regionalWins: '3x (1964, 2008, 2012)',
                famousPlayers: ['Xavi', 'Andrés Iniesta'], topClubs: ['Real Madrid', 'Barcelona'] 
            },

            // EUROPEAN POWERHOUSES (UEFA) + REGIONAL CHAMPIONSHIPS
            'Netherlands': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'European Champion', regionalWins: '1x (1988)',
                famousPlayers: ['Johan Cruyff', 'Ruud van Nistelrooy'], topClubs: ['Ajax', 'PSV Eindhoven'] 
            },
            'Portugal': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'European Champion', regionalWins: '1x (2016)',
                famousPlayers: ['Cristiano Ronaldo', 'Eusébio'], topClubs: ['FC Porto', 'Benfica', 'Sporting CP'] 
            },
            'Belgium': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['Eden Hazard', 'Kevin De Bruyne'], topClubs: ['Club Brugge', 'Anderlecht'] 
            },
            'Croatia': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['Luka Modrić', 'Davor Šuker'], topClubs: ['Dinamo Zagreb', 'Hajduk Split'] 
            },
            'Poland': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['Robert Lewandowski', 'Zbigniew Boniek'], topClubs: ['Legia Warsaw', 'Wisła Kraków'] 
            },
            'Czech Republic': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'European Champion', regionalWins: '1x (1976 as Czechoslovakia)',
                famousPlayers: ['Pavel Nedvěd', 'Tomáš Rosický'], topClubs: ['Sparta Prague', 'Slavia Prague'] 
            },
            'Denmark': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'European Champion', regionalWins: '1x (1992)',
                famousPlayers: ['Michael Laudrup', 'Peter Schmeichel'], topClubs: ['FC Copenhagen', 'Brøndby'] 
            },
            'Sweden': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['Zlatan Ibrahimović', 'Henrik Larsson'], topClubs: ['IFK Göteborg', 'Malmö FF'] 
            },
            'Norway': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['Erling Haaland', 'Ole Gunnar Solskjær'], topClubs: ['Rosenborg', 'Molde'] 
            },
            'Switzerland': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['Xherdan Shaqiri', 'Granit Xhaka'], topClubs: ['FC Basel', 'Young Boys'] 
            },
            'Austria': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['David Alaba', 'Marko Arnautović'], topClubs: ['Red Bull Salzburg', 'Austria Vienna'] 
            },
            'Russia': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'European Champion', regionalWins: '1x (1960 as Soviet Union)',
                famousPlayers: ['Andrey Arshavin', 'Igor Akinfeev'], topClubs: ['Spartak Moscow', 'CSKA Moscow'] 
            },
            'Ukraine': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['Andriy Shevchenko', 'Andriy Yarmolenko'], topClubs: ['Dynamo Kyiv', 'Shakhtar Donetsk'] 
            },
            'Turkey': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['Hakan Şükür', 'Arda Turan'], topClubs: ['Galatasaray', 'Fenerbahçe'] 
            },
            'Greece': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'European Champion', regionalWins: '1x (2004)',
                famousPlayers: ['Theodoros Zagorakis', 'Giorgos Karagounis'], topClubs: ['Olympiacos', 'Panathinaikos'] 
            },
            'Serbia': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'European Champion', regionalWins: '1x (1968 as Yugoslavia)',
                famousPlayers: ['Nemanja Matić', 'Aleksandar Mitrović'], topClubs: ['Red Star Belgrade', 'Partizan'] 
            },
            'Romania': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['Gheorghe Hagi', 'Adrian Mutu'], topClubs: ['Steaua Bucharest', 'Dinamo Bucharest'] 
            },
            'Bulgaria': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['Hristo Stoichkov', 'Dimitar Berbatov'], topClubs: ['CSKA Sofia', 'Levski Sofia'] 
            },
            'Slovakia': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['Marek Hamšík', 'Martin Škrtel'], topClubs: ['Slovan Bratislava', 'Spartak Trnava'] 
            },
            'Slovenia': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['Samir Handanović', 'Josip Iličić'], topClubs: ['Olimpija Ljubljana', 'Maribor'] 
            },
            'Bosnia and Herzegovina': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['Edin Džeko', 'Miralem Pjanić'], topClubs: ['FK Sarajevo', 'Željezničar'] 
            },
            'North Macedonia': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['Goran Pandev', 'Eljif Elmas'], topClubs: ['Vardar', 'Shkupi'] 
            },
            'Albania': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['Lorik Cana', 'Ermir Lenjani'], topClubs: ['KF Tirana', 'Partizani'] 
            },
            'Montenegro': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['Stevan Jovetić', 'Mirko Vučinić'], topClubs: ['Budućnost', 'Sutjeska'] 
            },
            'Finland': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['Teemu Pukki', 'Jari Litmanen'], topClubs: ['HJK Helsinki', 'FC Inter'] 
            },
            'Iceland': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['Gylfi Sigurðsson', 'Aron Gunnarsson'], topClubs: ['KR Reykjavik', 'Valur'] 
            },

            // SOUTH AMERICAN POWERHOUSES (CONMEBOL) + REGIONAL CHAMPIONSHIPS
            'Colombia': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'Copa América Champion', regionalWins: '1x (2001)',
                famousPlayers: ['James Rodríguez', 'Carlos Valderrama'], topClubs: ['Millonarios', 'América de Cali'] 
            },
            'Chile': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'Copa América Champion', regionalWins: '2x (2015, 2016)',
                famousPlayers: ['Alexis Sánchez', 'Arturo Vidal'], topClubs: ['Colo-Colo', 'Universidad de Chile'] 
            },
            'Peru': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'Copa América Champion', regionalWins: '2x (1939, 1975)',
                famousPlayers: ['Paolo Guerrero', 'Jefferson Farfán'], topClubs: ['Universitario', 'Alianza Lima'] 
            },
            'Ecuador': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['Antonio Valencia', 'Enner Valencia'], topClubs: ['LDU Quito', 'Barcelona SC'] 
            },
            'Paraguay': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'Copa América Champion', regionalWins: '2x (1953, 1979)',
                famousPlayers: ['Roque Santa Cruz', 'José Luis Chilavert'], topClubs: ['Olimpia', 'Cerro Porteño'] 
            },
            'Venezuela': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['Juan Arango', 'Salomón Rondón'], topClubs: ['Caracas FC', 'Deportivo Táchira'] 
            },
            'Bolivia': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'Copa América Champion', regionalWins: '1x (1963)',
                famousPlayers: ['Marcelo Moreno', 'Ronald Raldes'], topClubs: ['Bolívar', 'The Strongest'] 
            },

            // NORTH/CENTRAL AMERICA & CARIBBEAN (CONCACAF) + REGIONAL CHAMPIONSHIPS
            'Mexico': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'CONCACAF Gold Cup Champion', regionalWins: '12x (1965-2019)',
                famousPlayers: ['Hugo Sánchez', 'Rafael Márquez'], topClubs: ['Club América', 'Chivas'] 
            },
            'United States': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'CONCACAF Gold Cup Champion', regionalWins: '7x (1991-2021)',
                famousPlayers: ['Landon Donovan', 'Christian Pulisic'], topClubs: ['LA Galaxy', 'Seattle Sounders'] 
            },
            'Canada': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'CONCACAF Gold Cup Champion', regionalWins: '1x (2000)',
                famousPlayers: ['Alphonso Davies', 'Jonathan David'], topClubs: ['Toronto FC', 'Vancouver Whitecaps'] 
            },
            'Costa Rica': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['Keylor Navas', 'Bryan Ruiz'], topClubs: ['Saprissa', 'Alajuelense'] 
            },
            'Panama': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['Román Torres', 'Gabriel Gómez'], topClubs: ['Tauro FC', 'Plaza Amador'] 
            },
            'Honduras': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['David Suazo', 'Wilson Palacios'], topClubs: ['Olimpia', 'Motagua'] 
            },
            'Jamaica': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['Raheem Sterling', 'Leon Bailey'], topClubs: ['Harbour View', 'Waterhouse'] 
            },

            // AFRICAN POWERHOUSES (CAF) + REGIONAL CHAMPIONSHIPS
            'Nigeria': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'Africa Cup of Nations Champion', regionalWins: '3x (1980, 1994, 2013)',
                famousPlayers: ['Jay-Jay Okocha', 'Kanu'], topClubs: ['Enyimba', 'Kano Pillars'] 
            },
            'Egypt': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'Africa Cup of Nations Champion', regionalWins: '7x (1957-2010)',
                famousPlayers: ['Mohamed Salah', 'Mohamed Aboutrika'], topClubs: ['Al Ahly', 'Zamalek'] 
            },
            'South Africa': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'Africa Cup of Nations Champion', regionalWins: '1x (1996)',
                famousPlayers: ['Lucas Radebe', 'Benni McCarthy'], topClubs: ['Kaizer Chiefs', 'Orlando Pirates'] 
            },
            'Morocco': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'Africa Cup of Nations Champion', regionalWins: '1x (1976)',
                famousPlayers: ['Achraf Hakimi', 'Youssef En-Nesyri'], topClubs: ['Raja Casablanca', 'Wydad'] 
            },
            'Algeria': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'Africa Cup of Nations Champion', regionalWins: '2x (1990, 2019)',
                famousPlayers: ['Riyad Mahrez', 'Islam Slimani'], topClubs: ['JS Kabylie', 'MC Alger'] 
            },
            'Tunisia': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'Africa Cup of Nations Champion', regionalWins: '1x (2004)',
                famousPlayers: ['Wahbi Khazri', 'Youssef Msakni'], topClubs: ['Espérance', 'Club Africain'] 
            },
            'Ghana': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'Africa Cup of Nations Champion', regionalWins: '4x (1963-1982)',
                famousPlayers: ['Michael Essien', 'Asamoah Gyan'], topClubs: ['Hearts of Oak', 'Asante Kotoko'] 
            },
            'Cameroon': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'Africa Cup of Nations Champion', regionalWins: '5x (1984-2017)',
                famousPlayers: ['Samuel Eto\'o', 'Roger Milla'], topClubs: ['Canon Yaoundé', 'Tonnerre'] 
            },
            'Ivory Coast': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'Africa Cup of Nations Champion', regionalWins: '2x (1992, 2015)',
                famousPlayers: ['Didier Drogba', 'Yaya Touré'], topClubs: ['ASEC Mimosas', 'Africa Sports'] 
            },
            'Senegal': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'Africa Cup of Nations Champion', regionalWins: '1x (2021)',
                famousPlayers: ['Sadio Mané', 'Kalidou Koulibaly'], topClubs: ['ASC Jeanne d\'Arc', 'Casa Sports'] 
            },

            // ASIAN POWERHOUSES (AFC) + REGIONAL CHAMPIONSHIPS
            'Japan': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'AFC Asian Cup Champion', regionalWins: '4x (1992, 2000, 2004, 2011)',
                famousPlayers: ['Hidetoshi Nakata', 'Shinji Kagawa'], topClubs: ['Kashima Antlers', 'Urawa Red Diamonds'] 
            },
            'South Korea': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'AFC Asian Cup Champion', regionalWins: '2x (1956, 1960)',
                famousPlayers: ['Park Ji-sung', 'Son Heung-min'], topClubs: ['FC Seoul', 'Jeonbuk Motors'] 
            },
            'Iran': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'AFC Asian Cup Champion', regionalWins: '3x (1968, 1972, 1976)',
                famousPlayers: ['Ali Daei', 'Sardar Azmoun'], topClubs: ['Persepolis', 'Esteghlal'] 
            },
            'Saudi Arabia': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'AFC Asian Cup Champion', regionalWins: '3x (1984, 1988, 1996)',
                famousPlayers: ['Sami Al-Jaber', 'Salem Al-Dawsari'], topClubs: ['Al-Hilal', 'Al-Nassr'] 
            },
            'Australia': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'AFC Asian Cup Champion', regionalWins: '1x (2015)',
                famousPlayers: ['Tim Cahill', 'Harry Kewell'], topClubs: ['Melbourne Victory', 'Sydney FC'] 
            },
            'Qatar': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'AFC Asian Cup Champion', regionalWins: '1x (2019)',
                famousPlayers: ['Hassan Al-Haydos', 'Akram Afif'], topClubs: ['Al-Sadd', 'Al-Duhail'] 
            },
            'United Arab Emirates': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['Omar Abdulrahman', 'Ali Mabkhout'], topClubs: ['Al-Ain', 'Al-Ahli Dubai'] 
            },
            'China': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['Sun Jihai', 'Wu Lei'], topClubs: ['Shanghai SIPG', 'Guangzhou FC'] 
            },
            'Iraq': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: 'AFC Asian Cup Champion', regionalWins: '1x (2007)',
                famousPlayers: ['Younis Mahmoud', 'Nashat Akram'], topClubs: ['Al-Zawraa', 'Al-Quwa Al-Jawiya'] 
            },
            'India': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: ['Sunil Chhetri', 'Bhaichung Bhutia'], topClubs: ['Bengaluru FC', 'Mumbai City'] 
            },

            // ALL OTHER FIFA MEMBERS (Default for remaining 150+ countries)
            'default': { 
                worldCups: 0, worldCupYears: '', 
                regionalChampion: null, regionalWins: '',
                famousPlayers: [], topClubs: [] 
            }
        };
        
        return heritage[countryName] || heritage['default'];
    }

    /**
     * Open detailed country view with photorealistic maps
     */
    async openCountryDetailView(countryCode, countryName, footballData) {
        console.log(`🗺️ openCountryDetailView called with:`, { countryCode, countryName, footballData });
        
        // Check if countryMapManager exists
        if (!this.countryMapManager) {
            console.error('❌ countryMapManager is not initialized!');
            return;
        }
        
        console.log(`🗺️ countryMapManager status:`, this.countryMapManager.getStatus());

                
        // Close any existing tooltips
        const tooltip = document.getElementById('football-tooltip');
        if (tooltip) {
            console.log('🗑️ Removing existing tooltip');
            tooltip.remove();
        }
        
        try {
            console.log(`🗺️ Calling showCountryDetailMap...`);
            // Open the country detail map
            await this.countryMapManager.showCountryDetailMap(countryCode, countryName, footballData);
            console.log(`✅ showCountryDetailMap completed`);
        } catch (error) {
            console.error(`❌ Error in showCountryDetailMap:`, error);
        }
    }

    // Initialize the global system
    async initializeGlobalAtlas() {
        console.log('🌍 Starting Global Football Atlas initialization...');
        
        try {
            // Create globalAtlas if it doesn't exist yet
            if (!this.globalAtlas) {
                console.log('🔧 Creating Global Atlas now...');
                this.globalAtlas = new GlobalFootballAtlas(this.footballManager || window.footballDataManager);
                window.globalFootballAtlas = this.globalAtlas;
            }
            
            const summary = await this.globalAtlas.initialize();
            
            console.log('✅ GLOBAL FOOTBALL ATLAS READY!');
            console.log('📊 System Summary:', summary);
            
            return summary;
        } catch (error) {
            console.error('❌ Global Football Atlas initialization failed:', error);
        }
    }

} // ← Final closing brace for the SPORT APP class