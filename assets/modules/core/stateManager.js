// stateManager.js - Central state management for the application
class StateManager {
    constructor() {
        // Initialize with default state
        this.state = {
            // Country selections
            homeCountry: null,
            homeCurrency: null,
            destinationCountry: null,
            destinationCurrency: null,
            destinationCountries: [],
            
            // Feature states
            activeOverlays: [],
            activeIndicators: {
                sma: false,
                bollinger: false,
                rsi: false
            },
            
            // UI states
            isPremiumUser: true,
            currentTimeframe: '7D',
            selectedAlgorithm: 'hybrid',
            aiPredictionsActive: false,
            
            // Data states
            currentRate: null,
            historicalData: null,
            predictions: null,
            currentExchangeRates: null,
            
            // Map states
            selectedCountryElement: null,
            mapMode: 'interactive'
        };
        
        // Store listeners for state changes
        this.listeners = new Map();
    }
    
    // Get current state or specific property
    getState(key = null) {
        if (key) {
            return this.state[key];
        }
        return { ...this.state };
    }
    
    // Update state and notify listeners
    setState(updates) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...updates };
        
        // Notify listeners about changed keys
        Object.keys(updates).forEach(key => {
            if (this.listeners.has(key)) {
                this.listeners.get(key).forEach(callback => {
                    callback(this.state[key], oldState[key]);
                });
            }
        });
        
        // Notify global listeners
        if (this.listeners.has('*')) {
            this.listeners.get('*').forEach(callback => {
                callback(this.state, oldState);
            });
        }
    }
    
    // Subscribe to state changes
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(key);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }
    
    // Helper methods for common operations
    setHomeCountry(country, currency) {
        this.setState({
            homeCountry: country,
            homeCurrency: currency
        });
    }
    
    setDestinationCountry(country, currency) {
        this.setState({
            destinationCountry: country,
            destinationCurrency: currency
        });
    }
    
    addDestinationCountry(country) {
        const current = this.state.destinationCountries;
        if (!current.some(c => c.name === country.name)) {
            this.setState({
                destinationCountries: [...current, country]
            });
        }
    }
    
    removeDestinationCountry(countryName) {
        this.setState({
            destinationCountries: this.state.destinationCountries.filter(
                c => c.name !== countryName
            )
        });
    }
    
    toggleIndicator(indicator) {
        this.setState({
            activeIndicators: {
                ...this.state.activeIndicators,
                [indicator]: !this.state.activeIndicators[indicator]
            }
        });
    }
    
    addOverlay(currencyPair) {
        if (!this.state.activeOverlays.some(o => o.currency === currencyPair)) {
            this.setState({
                activeOverlays: [...this.state.activeOverlays, currencyPair]
            });
        }
    }
    
    removeOverlay(currencyPair) {
        this.setState({
            activeOverlays: this.state.activeOverlays.filter(
                overlay => overlay.currency !== currencyPair
            )
        });
    }
    
    clearOverlays() {
        this.setState({ activeOverlays: [] });
    }
    
    reset() {
        this.setState({
            homeCountry: null,
            homeCurrency: null,
            destinationCountry: null,
            destinationCurrency: null,
            destinationCountries: [],
            activeOverlays: []
        });
    }
}

// Create singleton instance
const stateManager = new StateManager();

// Export for ES6 modules
export { stateManager };

// Also make available globally for gradual migration
window.stateManager = stateManager;