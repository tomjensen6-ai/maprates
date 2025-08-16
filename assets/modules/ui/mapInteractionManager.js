/**
 * MapInteractionManager - Handles all map interaction events and country selection
 * Manages click events, hover effects, and country selection logic
 */
class MapInteractionManager {
    constructor() {
        this.selectedCountries = new Set();
        this.maxDestinations = 5;
        this.hoveredCountry = null;
        this.isInitialized = false;
        this.mapMode = 'interactive'; // 'interactive', 'adding', 'locked'
        this.pendingDestinationAdd = false;
        this.retryCount = 0;
        this.maxRetries = 10; // Maximum retry attempts
        
        // Dependencies injected during init
        this.stateManager = null;
        this.mapManager = null;
        this.uiManager = null;
        this.countrySelectionManager = null;
        this.exchangeRateManager = null;

        
    }

    /**
     * Initialize the map interaction manager with dependencies
     */
    init(dependencies = {}) {
        if (this.isInitialized) {
            console.log('MapInteractionManager already initialized');
            return;
        }
        
        // Inject dependencies
        this.stateManager = dependencies.stateManager || window.stateManager;
        this.mapManager = dependencies.mapManager || window.mapManager;
        this.uiManager = dependencies.uiManager || window.uiManager;
        this.countrySelectionManager = dependencies.countrySelectionManager || window.countrySelectionManager;
        this.exchangeRateManager = dependencies.exchangeRateManager || window.exchangeRateManager;
        
        // Don't fail if map isn't ready - just set up what we can
        if (!this.mapManager || !this.mapManager.map) {
            console.log('MapInteractionManager: Map not ready yet, initializing without map features');
        }
        
        // Set up event listeners (non-map dependent)
        this.setupEventListeners();
        
        // Sync with state manager if available
        if (this.stateManager) {
            this.syncWithStateManager();
        }
        
        this.isInitialized = true;
        console.log('✅ MapInteractionManager initialized');
        
        // Don't retry - the module will work with what's available
        this.retryCount = 0;
    }

    /**
     * Sync with state manager for map mode and selections
     */
    syncWithStateManager() {
        if (!this.stateManager) return;
        
        // Subscribe to state changes
        this.stateManager.subscribe('mapMode', (mode) => {
            this.mapMode = mode;
            this.updateMapCursor();
        });
        
        this.stateManager.subscribe('pendingDestinationAdd', (pending) => {
            this.pendingDestinationAdd = pending;
        });
    }

    /**
     * Set up all map-related event listeners
     */
    setupEventListeners() {
        // Listen for add destination button clicks
        const addDestBtn = document.getElementById('addDestinationBtn');
        if (addDestBtn) {
            // Remove existing listener and add new one
            const newAddBtn = addDestBtn.cloneNode(true);
            addDestBtn.parentNode.replaceChild(newAddBtn, addDestBtn);
            
            newAddBtn.addEventListener('click', () => {
                this.handleAddDestinationClick();
            });
        }
    }

    /**
     * Handle add destination button click
     */
    handleAddDestinationClick() {
        if (!this.stateManager) {
            console.error('StateManager not available');
            return;
        }
        
        const state = this.stateManager.getState();
        const destinations = state.destinationCountries || [];
        const maxDest = state.isPremiumUser ? 5 : 2;
        
        if (destinations.length < maxDest) {
            this.enterAddingMode();
        } else {
            if (window.showPremiumModal) {
                window.showPremiumModal('Additional Destinations');
            }
        }
    }

    /**
     * Enter adding mode for map clicks
     */
    enterAddingMode() {
        console.log('🗺️ Entering destination adding mode');
        this.mapMode = 'adding';
        this.pendingDestinationAdd = true;
        
        // Update state
        if (this.stateManager) {
            this.stateManager.setState({
                mapMode: 'adding',
                pendingDestinationAdd: true
            });
        }
        
        // Update cursor
        this.updateMapCursor();
        
        // Show notification
        if (this.uiManager && this.uiManager.showNotification) {
            this.uiManager.showNotification(
                '📍 Click on the map to add a destination country',
                'info'
            );
        }
        
        // Update MapManager mode
        if (this.mapManager && this.mapManager.enterAddingMode) {
            this.mapManager.enterAddingMode();
        }
    }

    /**
     * Exit adding mode
     */
    exitAddingMode() {
        console.log('🗺️ Exiting destination adding mode');
        this.mapMode = 'interactive';
        this.pendingDestinationAdd = false;
        
        // Update state
        if (this.stateManager) {
            this.stateManager.setState({
                mapMode: 'interactive',
                pendingDestinationAdd: false
            });
        }
        
        // Update cursor
        this.updateMapCursor();
        
        // Update MapManager mode
        if (this.mapManager && this.mapManager.exitAddingMode) {
            this.mapManager.exitAddingMode();
        }
    }

    /**
     * Update map cursor based on mode
     */
    updateMapCursor() {
        if (!this.mapManager || !this.mapManager.map) return;
        
        try {
            const canvas = this.mapManager.map.getCanvas();
            if (canvas) {
                if (this.mapMode === 'adding') {
                    canvas.style.cursor = 'crosshair';
                } else {
                    canvas.style.cursor = '';
                }
            }
        } catch (error) {
            console.warn('Could not update map cursor:', error);
        }
    }

    /**
     * Get current map mode
     */
    getMapMode() {
        return this.mapMode;
    }

    /**
     * Check if in adding mode
     */
    isInAddingMode() {
        return this.mapMode === 'adding' || this.pendingDestinationAdd;
    }

    /**
     * Handle country selection from map
     * This is called by MapManager when a country is clicked
     */
    handleCountrySelection(countryName, feature) {
        if (!this.countrySelectionManager) {
            console.error('CountrySelectionManager not available');
            return;
        }
        
        if (this.isInAddingMode()) {
            // Adding a destination
            this.countrySelectionManager.addDestination(countryName);
            this.exitAddingMode();
        } else {
            // Normal selection logic
            this.countrySelectionManager.selectCountryByClick(countryName, feature);
        }
    }
    
    // Reset map to initial view - Preserves D3 zoom functionality
    
        resetMapView() {
            console.log('resetMapView called, checking components...');
            console.log('this.svg exists:', !!this.svg);
            console.log('this.zoomBehavior exists:', !!this.zoomBehavior);
            
            // Get SVG and map group directly from DOM
            const svg = d3.select('#worldMap');
            const mapGroup = svg.select('g');
            
            if (!mapGroup.node()) {
                console.error('Map group element not found');
                return;
            }
            
            // If we have zoom behavior, use it
            if (this.zoomBehavior) {
                svg.transition()
                    .duration(250)
                    .call(this.zoomBehavior.transform, d3.zoomIdentity)
                    .on('end', () => {
                        // Ensure the transform is applied
                        mapGroup.attr('transform', 'translate(0,0) scale(1)');
                        console.log('✅ Map reset with zoom behavior');
                    });
            } else {
                // Direct transform without zoom behavior
                mapGroup.transition()
                    .duration(250)
                    .attr('transform', 'translate(0,0) scale(1)')
                    .on('end', () => {
                        // Try to update D3 zoom state if available
                        if (window.zoomBehavior) {
                            svg.call(window.zoomBehavior.transform, d3.zoomIdentity);
                        }
                        console.log('✅ Map reset with direct transform');
                    });
            }
            
            console.log('Map view reset initiated');
        }

    /**
     * Reset the manager
     */
    reset() {
        this.selectedCountries.clear();
        this.mapMode = 'interactive';
        this.pendingDestinationAdd = false;
        this.hoveredCountry = null;
        this.updateMapCursor();
    }
    initializeMapReferences() {
        // Get SVG reference
        this.svg = d3.select('#worldMap');
        
        // Try to get existing zoom behavior
        if (window.zoomBehavior) {
            this.zoomBehavior = window.zoomBehavior;
        } else if (window.mapManager && window.mapManager.zoomBehavior) {
            this.zoomBehavior = window.mapManager.zoomBehavior;
        } else {
            // Create new zoom behavior
            this.zoomBehavior = d3.zoom()
                .scaleExtent([0.5, 8])
                .on('zoom', (event) => {
                    const mapGroup = this.svg.select('g');
                    mapGroup.attr('transform', event.transform);
                });
        }
        
        console.log('Map references initialized:', {
            svg: !!this.svg.node(),
            zoomBehavior: !!this.zoomBehavior
        });
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.reset();
        this.isInitialized = false;
        this.retryCount = 0;
    }
}

// Check various possible locations
console.log('window.zoomBehavior:', window.zoomBehavior);
console.log('window.zoom:', window.zoom);
console.log('SVG zoom data:', d3.select('#worldMap').property('__zoom'));
console.log('MapManager zoom:', window.mapManager?.zoomBehavior);
console.log('MapInteractionManager zoom:', window.mapInteractionManager?.zoomBehavior);

// Check if D3 zoom is attached to SVG
const svg = d3.select('#worldMap');
console.log('SVG node:', svg.node());
console.log('SVG data:', svg.datum());

// Create and export instance
const mapInteractionManager = new MapInteractionManager();

// Expose to window for debugging
window.mapInteractionManager = mapInteractionManager;

export default mapInteractionManager;