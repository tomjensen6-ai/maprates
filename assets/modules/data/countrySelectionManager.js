// Country Selection Manager Module
// Handles country selection, dropdown management, and destination management

export class CountrySelectionManager {
    constructor() {
        this.homeCountry = null;
        this.destinationCountry = null;
        this.destinationCountries = [];
        this.countryFeatureMap = null;
        this.mapMode = 'interactive'; // 'interactive', 'adding', 'locked'
        this.maxDestinations = {
            free: 2,
            premium: 5
        };
    }

    initialize(stateManager, mapManager, getCurrencyForCountry) {
        this.stateManager = stateManager;
        this.mapManager = mapManager;
        this.getCurrencyForCountry = getCurrencyForCountry;
        
        // Subscribe to state changes
        this.stateManager.subscribe('homeCountry', (newHome) => {
            this.homeCountry = newHome;
        });
        
        this.stateManager.subscribe('destinationCountry', (newDest) => {
            this.destinationCountry = newDest;
        });
        
        this.stateManager.subscribe('destinationCountries', (newDests) => {
            this.destinationCountries = newDests;
        });
    }

    selectCountryByName(countryName, type, providedFeature = null) {
        console.log('selectCountryByName called:', countryName, type, providedFeature);
        console.log('🔍 BEFORE selection:');
        console.log('- this.homeCountry:', this.homeCountry);
        console.log('- window.homeCountry:', window.homeCountry);
        console.log('- this.destinationCountries:', this.destinationCountries);
        console.log('- window.destinationCountries:', window.destinationCountries);
        
        // Use provided feature or try to get it from the map
        const feature = providedFeature || (this.countryFeatureMap ? this.countryFeatureMap.get(countryName) : null);
        
        if (!feature) {
            console.warn('⚠️ No feature found for country:', countryName, '- continuing without map highlight');
        }
        
        if (type === 'home') {
            const countryObj = { name: countryName, feature: feature };
            this.homeCountry = countryObj;
            this.stateManager.setState({
                homeCountry: countryObj,
                homeCurrency: this.getCurrencyForCountry(countryName)?.code || null
            });
            
            console.log('✅ Set home country to:', countryObj);
            
            // Sync with global for compatibility
            window.homeCountry = countryObj;
            
            // Trigger UI updates
            this.updateAddDestinationButton();
            this.updateSwapButtonVisibility();
            this.showAmountController();
            
            // Trigger exchange rate update when destination is set
            if (this.homeCountry && this.destinationCountries.length > 0) {
                console.log('🔄 Triggering exchange rate update');
                this.triggerExchangeRateUpdate();
            }
            
            if (this.destinationCountry && this.destinationCountry.name !== countryName) {
                this.triggerExchangeRateUpdate();
            } else if (this.destinationCountries.length > 0) {
                this.triggerExchangeRateUpdate();
            }
            
        } else if (type === 'destination') {
            const countryObj = { name: countryName, feature: feature };
            this.destinationCountry = countryObj;
            
            // When setting a destination from dropdown, clear others first
            if (this.destinationCountries.length === 0 ||
                (this.destinationCountries.length === 1 && this.destinationCountries[0].name !== countryName)) {
                this.destinationCountries = [{ name: countryName, feature: feature }];
            } else if (!this.destinationCountries.find(dest => dest.name === countryName)) {
                this.destinationCountries.push({ name: countryName, feature: feature });
            }
            
            this.stateManager.setState({
                destinationCountry: countryObj,
                destinationCurrency: this.getCurrencyForCountry(countryName)?.code || null,
                destinationCountries: this.destinationCountries
            });
            
            console.log('✅ Set destination country to:', countryObj);
            
            // Sync with global for compatibility
            window.destinationCountry = countryObj;
            window.destinationCountries = this.destinationCountries;
            
            this.updateDestinationsList();
            this.updateAddDestinationButton();
        }
        
        // UPDATE THE MAP HIGHLIGHTING
        if (this.mapManager) {
            this.mapManager.updateCountrySelection(this.homeCountry, this.destinationCountries);
        }
        
        // ============= NEW AUTO-CALCULATION TRIGGER =============
        // Check if both countries are now selected and trigger auto-calculation
        if (this.homeCountry && this.destinationCountry) {
            console.log('🎯 Both countries selected - triggering auto-calculation');
            
            // Set default amount if empty
            const compactAmount = document.getElementById('compactAmount');
            if (compactAmount && !compactAmount.value) {
                compactAmount.value = '1';
            }
            
            // Trigger exchange rate fetch and calculation
            setTimeout(() => {
                if (window.exchangeRateManager) {
                    const homeCurrency = this.getCurrencyForCountry(this.homeCountry.name);
                    if (homeCurrency) {
                        console.log('💱 Fetching exchange rates for auto-calculation...');
                        
                        window.exchangeRateManager.fetchExchangeRates(homeCurrency).then(() => {
                            console.log('✅ Exchange rates fetched, updating display');
                            
                            // Force compact display update
                            if (window.updateCompactDisplay) {
                                window.updateCompactDisplay();
                            }
                            
                            // Force update of multiple results if function exists
                            if (window.updateMultipleExchangeRates) {
                                window.updateMultipleExchangeRates();
                            }
                            
                            // Visual feedback - make the green result field pulse
                            const compactResult = document.getElementById('compactResult');
                            if (compactResult) {
                                // Add a subtle animation to show calculation completed
                                compactResult.style.transition = 'all 0.3s ease';
                                compactResult.style.backgroundColor = 'rgba(52, 168, 83, 0.1)';
                                compactResult.style.transform = 'scale(1.05)';
                                
                                setTimeout(() => {
                                    compactResult.style.backgroundColor = '';
                                    compactResult.style.transform = 'scale(1)';
                                }, 300);
                            }
                            
                            console.log('✅ Auto-calculation completed');
                        }).catch(error => {
                            console.error('❌ Auto-calculation failed:', error);
                        });
                    }
                }
            }, 150); // Small delay to ensure UI is ready
        }
        // ============= END OF NEW AUTO-CALCULATION TRIGGER =============
        
        console.log('🔍 AFTER selection:');
        console.log('- this.homeCountry:', this.homeCountry);
        console.log('- window.homeCountry:', window.homeCountry);
        console.log('- this.destinationCountries:', this.destinationCountries);
        console.log('- window.destinationCountries:', window.destinationCountries);
    }

    selectCountryByClick(countryName, feature = null) {
        let actualCountryName = countryName;
        let actualFeature = feature;
        
        // Handle if countryName is actually a feature object
        if (typeof countryName === 'object' && countryName !== null && countryName.type === 'Feature') {
            actualFeature = countryName;
            if (countryName.properties && countryName.properties.name) {
                actualCountryName = countryName.properties.name;
            } else {
                console.log('Cannot extract country name from feature:', countryName);
                return;
            }
        }
        
        console.log('Country clicked:', actualCountryName, actualFeature);
        
        // Don't select if it's a region without currency
        if (!actualCountryName || actualCountryName === "No currency system") {
            console.log('Invalid country selection');
            return;
        }
        
        // Check map mode - if locked, don't allow selection
        if (this.mapManager && this.mapManager.mapMode === 'locked') {
            console.log('Map is locked - use Clear All or Add Destination button');
            return;
        }
        
        // If in adding mode, add as destination
        if (this.mapManager && this.mapManager.mapMode === 'adding') {
            this.addDestination(actualCountryName);
            this.mapManager.exitAddingMode();
            this.mapManager.lockMap();
            return;
        }
        
        // Normal selection logic (for free version - 2 countries max)
        const state = this.stateManager.getState();
        if (!state.homeCountry) {
            // First click - set as home
            this.selectCountryByName(actualCountryName, 'home', actualFeature);
            
            // Update dropdown
            const homeSelect = document.getElementById('homeCountry');
            if (homeSelect) homeSelect.value = actualCountryName;
            
        } else if (!state.destinationCountry) {
            // Second click - set as destination
            this.selectCountryByName(actualCountryName, 'destination', actualFeature);
            
            // Update dropdown
            const destSelect = document.getElementById('destinationCountry');
            if (destSelect) destSelect.value = actualCountryName;
            
        } else {
            // Both already selected - start over (free version behavior)
            console.log('Starting over - clearing selections');
            this.clearAll();
            
            // Set the clicked country as new home
            setTimeout(() => {
                this.selectCountryByName(actualCountryName, 'home', actualFeature);
                const homeSelect = document.getElementById('homeCountry');
                if (homeSelect) homeSelect.value = actualCountryName;
            }, 100);
        }
    }

    addDestination(countryName) {
        const isPremium = this.stateManager.getState().isPremiumUser;
        const maxDest = isPremium ? this.maxDestinations.premium : this.maxDestinations.free;
        
        if (this.destinationCountries.length >= maxDest) return;
        
        const feature = this.countryFeatureMap ? this.countryFeatureMap.get(countryName) : null;
        const newDestination = { name: countryName, feature: feature };
        
        this.destinationCountries.push(newDestination);
        
        if (!this.destinationCountry) {
            this.destinationCountry = newDestination;
            document.getElementById('destinationCountry').value = countryName;
        }
        
        this.mapMode = 'locked';
        
        this.updateDestinationsList();
        this.updateAddDestinationButton();
        
        if (this.mapManager) {
            this.mapManager.updateCountrySelection(this.homeCountry, this.destinationCountries);
            this.mapManager.lockMap();
        }
        
        this.showAmountController();
        
        if (this.homeCountry) {
            this.triggerExchangeRateUpdate();
        }
    }

    removeDestination(countryName) {
        console.log('📍 CountrySelectionManager: Removing', countryName);
        
        // Remove from the array
        this.destinationCountries = this.destinationCountries.filter(dest => dest.name !== countryName);
        
        // Sync with global variables
        window.destinationCountries = this.destinationCountries;
        
        // Update state manager
        this.stateManager.setState({
            destinationCountries: this.destinationCountries
        });
        
        // If we removed the current destination, update it
        if (this.destinationCountry && this.destinationCountry.name === countryName) {
            this.destinationCountry = this.destinationCountries.length > 0 ? this.destinationCountries[0] : null;
            window.destinationCountry = this.destinationCountry;
            
            this.stateManager.setState({
                destinationCountry: this.destinationCountry
            });
            
            // Update dropdown
            const destSelect = document.getElementById('destinationCountry');
            if (destSelect) {
                destSelect.value = this.destinationCountry ? this.destinationCountry.name : '';
            }
        }
        
        // Update the map
        if (this.mapManager) {
            this.mapManager.updateCountrySelection(this.homeCountry, this.destinationCountries);
            
            // Unlock map if no destinations left
            if (this.destinationCountries.length === 0) {
                this.mapManager.unlockMap();
            }
        }
        
        // Update UI
        this.updateDestinationsList();
        this.updateAddDestinationButton();
        
        // Update exchange rates or hide them
        if (this.destinationCountries.length === 0) {
            this.hideExchangeRate();
        } else if (this.homeCountry) {
            this.triggerExchangeRateUpdate();
        }
        
        console.log('✅ Removed. Remaining:', this.destinationCountries.length);
    }

    swapCountries() {
        if (!this.homeCountry || !this.destinationCountry) {
            console.log('Cannot swap: both countries must be selected');
            return;
        }
        
        console.log('Swapping countries:', this.homeCountry.name, '↔', this.destinationCountry.name);
        
        const originalHome = this.homeCountry;
        const originalDestination = this.destinationCountry;
        
        this.homeCountry = originalDestination;
        this.destinationCountry = originalHome;
        
        // Update destination countries list - maintain order
        let updatedDestinations = [];
        
        // If there's only one destination (the one we're swapping)
        if (this.destinationCountries.length === 1) {
            // Simply replace it with the old home
            updatedDestinations = [originalHome];
        } else {
            // Multiple destinations - replace the one being swapped at its original position
            updatedDestinations = this.destinationCountries.map(dest => {
                if (dest.name === originalDestination.name) {
                    // Replace the destination that's becoming home with the old home
                    return originalHome;
                }
                return dest;
            });
        }
        
        this.destinationCountries = updatedDestinations;
        
        // Update state with ALL changes
        this.stateManager.setState({
            homeCountry: this.homeCountry,
            destinationCountry: this.destinationCountry,
            destinationCountries: this.destinationCountries,
            homeCurrency: this.getCurrencyForCountry(this.homeCountry.name)?.code || null,
            destinationCurrency: this.getCurrencyForCountry(this.destinationCountry.name)?.code || null
        });
        
        document.getElementById('homeCountry').value = this.homeCountry.name;
        document.getElementById('destinationCountry').value = this.destinationCountry.name;
        
        // Sync with globals for compatibility
        window.homeCountry = this.homeCountry;
        window.destinationCountry = this.destinationCountry;
        window.destinationCountries = this.destinationCountries;
        
        if (this.mapManager) {
            this.mapManager.updateCountrySelection(this.homeCountry, this.destinationCountries);
        }
        
        // Force update the destinations list
        this.updateDestinationsList();
        
        this.triggerExchangeRateUpdate();
        
        // Force update compact display after swap
        setTimeout(() => {
            this.updateCompactDisplay();
        }, 500);
        
        console.log('Swap complete:', this.homeCountry.name, '→', this.destinationCountry.name);
        console.log('Destinations after swap:', this.destinationCountries.map(d => d.name));
    }

    clearAll() {
        this.homeCountry = null;
        this.destinationCountry = null;
        this.destinationCountries = [];
        this.mapMode = 'normal';

        // Sync with globals for compatibility
        window.homeCountry = null;
        window.destinationCountry = null;
        window.destinationCountries = [];
        
        // Update state
        this.stateManager.setState({
            homeCountry: null,
            destinationCountry: null,
            destinationCountries: []
        });
        
        if (this.mapManager) {
            this.mapManager.unlockMap();
            this.mapManager.reset();
        }
        
        // Clear UI elements
        const homeSelect = document.getElementById('homeCountry');
        if (homeSelect) homeSelect.value = '';
        
        const destSelect = document.getElementById('destinationCountry');
        if (destSelect) destSelect.value = '';
        
        const globalAmount = document.getElementById('globalAmount');
        if (globalAmount) globalAmount.value = '1';
        
        const compactAmount = document.getElementById('compactAmount');
        if (compactAmount) compactAmount.value = '1';
        
        this.updateDestinationsList();
        this.updateAddDestinationButton();
        this.updateSwapButtonVisibility();
        // Always trigger exchange rate update when we have both countries
        if (this.homeCountry && this.destinationCountries.length > 0) {
            console.log('🔄 Triggering exchange rate update from destination selection');
            this.triggerExchangeRateUpdate();
        }
        
        if (this.mapManager) {
            this.mapManager.updateCountrySelection(null, []);
        }
        
        this.hideExchangeRate();
        this.showAmountController();
        
        document.getElementById('worldMap').style.cursor = 'default';
        
        console.log('Cleared all - back to initial state');
    }

    setCountryFeatureMap(map) {
        this.countryFeatureMap = map;
    }

    getHomeCountry() {
        return this.homeCountry;
    }

    getDestinationCountry() {
        return this.destinationCountry;
    }

    getDestinationCountries() {
        return this.destinationCountries;
    }

    // These methods will call the actual UI update functions
    // They act as bridges to avoid circular dependencies
    triggerExchangeRateUpdate() {
        if (window.updateMultipleExchangeRates) {
            window.updateMultipleExchangeRates();
        }
    }

    updateDestinationsList() {
        if (window.updateDestinationsList) {
            window.updateDestinationsList();
        }
    }

    updateAddDestinationButton() {
        if (window.updateAddDestinationButton) {
            window.updateAddDestinationButton();
        }
    }

    updateSwapButtonVisibility() {
        if (window.updateSwapButtonVisibility) {
            window.updateSwapButtonVisibility();
        }
    }

    showAmountController() {
        if (window.showAmountController) {
            window.showAmountController();
        }
    }

    hideExchangeRate() {
        if (window.hideExchangeRate) {
            window.hideExchangeRate();
        }
    }

    updateCompactDisplay() {
        if (window.updateCompactDisplay) {
            window.updateCompactDisplay();
        }
    }
}

// Create singleton instance
export const countrySelectionManager = new CountrySelectionManager();