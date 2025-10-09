/**
 * Non-invasive tab switcher - adds tabs without breaking existing UI
 */

export class TabSwitcher {
    constructor() {
        this.currentMode = 'currency';
        this.tabContainer = null;
    }

    /**
     * Add tab navigation without breaking existing layout
     */
    initialize() {
        // Find a safe place to add tabs (top of page)
        this.tabContainer = this.createTabContainer();
        this.createTabs();
    }

    createTabContainer() {
        const container = document.createElement('div');
        container.id = 'mode-tabs';
        container.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 10000;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 5px;
            display: flex;
            gap: 5px;
        `;
        
        document.body.appendChild(container);
        return container;
    }

    createTabs() {
        // Currency tab (always active by default)
        const currencyTab = this.createTab('💱 Currency', 'currency', true);
        currencyTab.onclick = () => this.switchToCurrency();
        
        // Sports tab
        const sportsTab = this.createTab('⚽ Football', 'sports', false);
        sportsTab.onclick = () => this.switchToSports();
        
        this.tabContainer.appendChild(currencyTab);
        this.tabContainer.appendChild(sportsTab);
    }

    createTab(text, mode, active) {
        const tab = document.createElement('button');
        tab.textContent = text;
        tab.className = `mode-tab ${mode}-tab`;
        tab.style.cssText = `
            padding: 8px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            background: ${active ? '#007bff' : '#f8f9fa'};
            color: ${active ? 'white' : '#333'};
            transition: all 0.2s;
        `;
        
        tab.onmouseover = () => {
            if (!tab.classList.contains('active')) {
                tab.style.background = '#e9ecef';
            }
        };
        
        tab.onmouseout = () => {
            if (!tab.classList.contains('active')) {
                tab.style.background = '#f8f9fa';
            }
        };
        
        return tab;
    }

    async switchToCurrency() {
        if (this.currentMode === 'currency') return;
        
        // Deactivate sports
        await window.SportsBootstrap.activateCurrencyMode();
        
        // Update UI
        this.updateTabState('currency');
        this.currentMode = 'currency';
        
        console.log('Switched to currency mode');
    }

    async switchToSports() {
        if (this.currentMode === 'sports') return;
        
        // Activate sports
        const success = await window.SportsBootstrap.activateSportsMode();
        
        if (success) {
            this.updateTabState('sports');
            this.currentMode = 'sports';
            console.log('Switched to sports mode');
        } else {
            alert('Failed to load sports feature');
        }
    }

    updateTabState(activeMode) {
        const tabs = this.tabContainer.querySelectorAll('.mode-tab');
        tabs.forEach(tab => {
            const isActive = tab.classList.contains(`${activeMode}-tab`);
            tab.classList.toggle('active', isActive);
            tab.style.background = isActive ? '#007bff' : '#f8f9fa';
            tab.style.color = isActive ? 'white' : '#333';
        });
    }
}