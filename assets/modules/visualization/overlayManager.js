// overlayManager.js - Manages currency overlays for charts
import { overlayColors } from '/assets/config/constants.js';
import { CURRENCY_SYMBOLS } from '/assets/config/constants.js';

class OverlayManager {
    constructor() {
        this.overlayCounter = 0;
        this.maxOverlays = 3;
        this.stateManager = null; // Will be set during initialization
    }
    
    initialize(stateManager) {
        this.stateManager = stateManager;
        console.log('🎨 OverlayManager initialized');
    }
    
    getActiveOverlays() {
        return this.stateManager?.getState('activeOverlays') || [];
    }
    
    addOverlay(currencyCode, country = null, isFromDestinations = false) {
        const activeOverlays = this.getActiveOverlays();
        
        // Check if already exists
        if (activeOverlays.find(o => o.currency === currencyCode)) {
            console.warn(`Overlay ${currencyCode} already exists`);
            return false;
        }
        
        // Check max limit
        const visibleCount = activeOverlays.filter(o => o.visible).length;
        if (visibleCount >= this.maxOverlays) {
            alert(`Maximum ${this.maxOverlays} overlays allowed`);
            return false;
        }
        
        const color = overlayColors[this.overlayCounter % overlayColors.length];
        this.overlayCounter++;
        
        const overlay = {
            currency: currencyCode,
            country: country,
            color: color,
            visible: true,
            data: null,
            isFromDestinations: isFromDestinations
        };
        
        const newOverlays = [...activeOverlays, overlay];
        this.stateManager.setState({ activeOverlays: newOverlays });
        
        console.log(`✅ Added overlay: ${currencyCode} with color ${color}`);
        return true;
    }
    
    removeOverlay(currencyCode) {
        const activeOverlays = this.getActiveOverlays();
        const newOverlays = activeOverlays.filter(o => o.currency !== currencyCode);
        this.stateManager.setState({ activeOverlays: newOverlays });
        console.log(`🗑️ Removed overlay: ${currencyCode}`);
    }
    
    toggleOverlay(currencyCode) {
        const activeOverlays = this.getActiveOverlays();
        const overlay = activeOverlays.find(o => o.currency === currencyCode);
        
        if (!overlay) {
            console.warn(`Overlay ${currencyCode} not found`);
            return false;
        }
        
        // Check if we can enable it
        const visibleCount = activeOverlays.filter(o => o.visible).length;
        if (!overlay.visible && visibleCount >= this.maxOverlays) {
            alert(`Maximum ${this.maxOverlays} overlays active. Disable another overlay first.`);
            return false;
        }
        
        overlay.visible = !overlay.visible;
        this.stateManager.setState({ activeOverlays: [...activeOverlays] });
        
        console.log(`🔄 Toggled overlay ${currencyCode}: ${overlay.visible ? 'ON' : 'OFF'}`);
        return true;
    }
    
    clearOverlays() {
        this.stateManager.setState({ activeOverlays: [] });
        this.overlayCounter = 0;
        console.log('🗑️ Cleared all overlays');
    }
    
    updateOverlayData(currencyCode, data) {
        const activeOverlays = this.getActiveOverlays();
        const overlay = activeOverlays.find(o => o.currency === currencyCode);
        
        if (overlay) {
            overlay.data = data;
            this.stateManager.setState({ activeOverlays: [...activeOverlays] });
            console.log(`📊 Updated data for overlay ${currencyCode}`);
            return true;
        }
        return false;
    }
    
    getVisibleOverlays() {
        return this.getActiveOverlays().filter(o => o.visible);
    }
    
    canAddOverlay() {
        const visibleCount = this.getVisibleOverlays().length;
        return visibleCount < this.maxOverlays;
    }
    
    // Pre-populate overlays from destination countries
    populateFromDestinations(destinationCountries, homeCountry, destinationCountry, getCurrencyForCountry) {
        console.log('🎯 Pre-populating overlays from destinations...');
        
        // Clear existing overlays
        this.clearOverlays();
        
        const homeCurrency = getCurrencyForCountry(homeCountry.name);
        let addedCount = 0;
        
        destinationCountries.forEach((dest) => {
            if (addedCount >= this.maxOverlays) return;
            
            const destCurrency = getCurrencyForCountry(dest.name);
            
            // Skip if same as main destination
            if (destinationCountry && dest.name === destinationCountry.name) return;
            
            // Skip if same as home currency
            if (homeCurrency && destCurrency.code === homeCurrency.code) return;
            
            if (this.addOverlay(destCurrency.code, dest.name, true)) {
                addedCount++;
            }
        });
        
        console.log(`✅ Pre-populated ${addedCount} overlays from destinations`);
        return addedCount;
    }
}

// Create singleton instance
const overlayManager = new OverlayManager();

// Export for ES6 modules
export { overlayManager };

// Make available globally for HTML onclick handlers
window.overlayManager = overlayManager;