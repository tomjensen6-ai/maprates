/**
 * Sports Bootstrap - Loads sports functionality without affecting currency app
 */

console.log('🚀 sportsBootstrap.js file loaded!');

let sportsApp = null;
let sportsLoaded = false;

async function loadGlobalCityPinManager() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/assets/modules/sports/data/globalCityPinManager.js?v=' + Date.now();
        script.onload = () => {
            console.log('✅ GlobalCityPinManager loaded successfully');
            resolve();
        };
        script.onerror = () => {
            console.error('❌ Failed to load GlobalCityPinManager');
            reject();
        };
        document.head.appendChild(script);
    });
}

/**
 * Load sports functionality on demand
 */
async function loadSportsApp() {
    console.log('📱 loadSportsApp called');
    
    try {
        console.log('🔄 Attempting to import SportsApp...');
        
        // LOAD GlobalCityPinManager FIRST
        await loadGlobalCityPinManager();
        
        // Then load SportsApp
        console.log('🔄 Attempting to import SportsApp...');
        const { SportsApp } = await import('../modules/sports/sportsApp.js?v=' + Date.now());
        
        if (SportsApp) {
            window.sportsApp = new SportsApp();
            await window.sportsApp.initialize();
            console.log('✅ SportsApp loaded and initialized');
            if (window.sportsApp && window.sportsApp.activate) {
                await window.sportsApp.activate();
                console.log('✅ Sports mode UI activated');
            } else {
                console.error('❌ SportsApp.activate method not found');
            }
        }
        
    } catch (error) {
        console.error('❌ Error loading sports app:', error);
    }
}

/**
 * Switch to sports mode
 */
async function activateSportsMode() {
    console.log('⚽ activateSportsMode called');
    const app = await loadSportsApp();
    if (app) {
        await app.activate();
        return true;
    }
    return false;
}

/**
 * Switch back to currency mode
 */
async function activateCurrencyMode() {
    console.log('💱 activateCurrencyMode called');
    if (sportsApp) {
        await sportsApp.deactivate();
    }
    return true;
}

// Add sports mode activation button
console.log('🎯 Creating sports activation button...');
const sportsButton = document.createElement('button');
sportsButton.textContent = '⚽ Switch to Sports Mode';
sportsButton.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 10000;
    background: #28a745;
    color: white;
    border: none;
    padding: 12px 16px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
`;

sportsButton.onclick = async function() {
    console.log('🎯 Sports mode button clicked!');
    sportsButton.textContent = '🔄 Loading Sports...';
    sportsButton.disabled = true;
    
    const success = await activateSportsMode();
    
    if (success) {
        sportsButton.textContent = '✅ Sports Mode Active';
        sportsButton.style.background = '#007bff';
        
        // Add currency mode button
        const currencyButton = document.createElement('button');
        currencyButton.textContent = '💱 Back to Currency';
        currencyButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 200px;
            z-index: 10000;
            background: #6c757d;
            color: white;
            border: none;
            padding: 12px 16px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        `;
        
        currencyButton.onclick = async function() {
            await activateCurrencyMode();
            currencyButton.remove();
            sportsButton.textContent = '⚽ Switch to Sports Mode';
            sportsButton.style.background = '#28a745';
            sportsButton.disabled = false;
        };
        
        document.body.appendChild(currencyButton);
    } else {
        sportsButton.textContent = '❌ Sports Failed';
        sportsButton.style.background = '#dc3545';
        setTimeout(() => {
            sportsButton.textContent = '⚽ Switch to Sports Mode';
            sportsButton.style.background = '#28a745';
            sportsButton.disabled = false;
        }, 3000);
    }
};

// Wait for DOM to be ready, then add button
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📄 DOM loaded, adding sports button');
        document.body.appendChild(sportsButton);
    });
} else {
    console.log('📄 DOM already ready, adding sports button');
    document.body.appendChild(sportsButton);
}

// Export functions
window.SportsBootstrap = {
    loadSportsApp,
    activateSportsMode,
    activateCurrencyMode
};

console.log('✅ sportsBootstrap.js setup complete');