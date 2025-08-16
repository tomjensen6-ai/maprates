// UIManager - Handles all UI updates and DOM manipulation
class UIManager {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // We'll add listeners here as we migrate functionality
    }

    // Update currency display in the UI
    updateCurrencyDisplay(source, destination) {
        // Update source currency displays
        const sourceElements = document.querySelectorAll('.source-currency-code');
        sourceElements.forEach(el => {
            if (el) el.textContent = source;
        });

        // Update destination currency displays
        const destElements = document.querySelectorAll('.destination-currency-code');
        destElements.forEach(el => {
            if (el) el.textContent = destination;
        });

        // Update currency pair display
        const pairDisplay = document.getElementById('currencyPairDisplay');
        if (pairDisplay) {
            pairDisplay.textContent = `${source}/${destination}`;
        }
    }

    // Update exchange rate display
    updateExchangeRateDisplay(rate, source, destination) {
        const rateDisplay = document.getElementById('exchangeRateDisplay');
        if (rateDisplay && rate) {
            rateDisplay.textContent = `1 ${source} = ${rate.toFixed(4)} ${destination}`;
        }
    }

    // Update amount displays
    updateAmountDisplay(amount, convertedAmount, source, destination) {
        // Update main display
        const amountDisplay = document.getElementById('amountDisplay');
        if (amountDisplay) {
            amountDisplay.textContent = `${amount} ${source} = ${convertedAmount.toFixed(2)} ${destination}`;
        }

        // Update compact display
        const compactDisplay = document.querySelector('.compact-display');
        if (compactDisplay) {
            compactDisplay.innerHTML = `
                <div class="compact-amount">${amount} ${source}</div>
                <div class="compact-equals">=</div>
                <div class="compact-converted">${convertedAmount.toFixed(2)} ${destination}</div>
            `;
        }
    }

    // Show/hide loading states
    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('loading');
            const spinner = element.querySelector('.spinner');
            if (spinner) spinner.style.display = 'block';
        }
    }

    hideLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('loading');
            const spinner = element.querySelector('.spinner');
            if (spinner) spinner.style.display = 'none';
        }
    }

    // Update conversion cards
    updateConversionCards(results) {
        const container = document.getElementById('conversionResults');
        if (!container) return;

        // Clear existing cards
        container.innerHTML = '';

        // Create cards for each result
        results.forEach(result => {
            const card = this.createConversionCard(result);
            container.appendChild(card);
        });

        // Show the container
        container.style.display = 'grid';
    }

    // Create a single conversion card
    createConversionCard(data) {
        const card = document.createElement('div');
        card.className = 'conversion-card';
        card.innerHTML = `
            <div class="card-header">
                <span class="card-amount">${data.amount}</span>
                <span class="card-currency">${data.fromCurrency}</span>
            </div>
            <div class="card-equals">=</div>
            <div class="card-result">
                <span class="card-converted">${data.converted.toFixed(2)}</span>
                <span class="card-currency">${data.toCurrency}</span>
            </div>
            <div class="card-rate">Rate: ${data.rate.toFixed(4)}</div>
        `;
        return card;
    }

    // Toggle premium features overlay
    togglePremiumOverlay(show) {
        const overlay = document.getElementById('premiumOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    // Update historical data display
    updateHistoricalDisplay(data) {
        const container = document.getElementById('historicalData');
        if (!container) return;

        // This will be populated based on your specific needs
        container.innerHTML = `
            <div class="historical-header">Historical Exchange Rates</div>
            <div class="historical-content">
                ${data.map(item => `
                    <div class="historical-item">
                        <span class="date">${item.date}</span>
                        <span class="rate">${item.rate.toFixed(4)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Show error messages
    showError(message, elementId = 'errorMessage') {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        }
    }

    // Hide error messages
    hideError(elementId = 'errorMessage') {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    // Update trend indicators
    updateTrendIndicator(trend, elementId = 'trendIndicator') {
        const indicator = document.getElementById(elementId);
        if (!indicator) return;

        // Remove existing classes
        indicator.classList.remove('trend-up', 'trend-down', 'trend-neutral');

        // Add appropriate class and icon
        if (trend > 0) {
            indicator.classList.add('trend-up');
            indicator.innerHTML = '↑ ' + Math.abs(trend).toFixed(2) + '%';
        } else if (trend < 0) {
            indicator.classList.add('trend-down');
            indicator.innerHTML = '↓ ' + Math.abs(trend).toFixed(2) + '%';
        } else {
            indicator.classList.add('trend-neutral');
            indicator.innerHTML = '→ 0.00%';
        }
    }

    // Toggle visibility of sections
    toggleSection(sectionId, show) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = show ? 'block' : 'none';
        }
    }

    // Update statistics display
    updateStatistics(stats) {
        if (!stats) return;

        // Update each stat if element exists
        if (stats.average !== undefined) {
            const avgElement = document.getElementById('statAverage');
            if (avgElement) avgElement.textContent = stats.average.toFixed(4);
        }

        if (stats.min !== undefined) {
            const minElement = document.getElementById('statMin');
            if (minElement) minElement.textContent = stats.min.toFixed(4);
        }

        if (stats.max !== undefined) {
            const maxElement = document.getElementById('statMax');
            if (maxElement) maxElement.textContent = stats.max.toFixed(4);
        }

        if (stats.volatility !== undefined) {
            const volElement = document.getElementById('statVolatility');
            if (volElement) volElement.textContent = stats.volatility.toFixed(2) + '%';
        }
    }

    // Update alerts display
    updateAlertsDisplay(alerts) {
        const container = document.getElementById('alertsContainer');
        if (!container) return;

        container.innerHTML = '';
        alerts.forEach(alert => {
            const alertElement = document.createElement('div');
            alertElement.className = `alert alert-${alert.type}`;
            alertElement.innerHTML = `
                <span class="alert-icon">${this.getAlertIcon(alert.type)}</span>
                <span class="alert-message">${alert.message}</span>
                <span class="alert-time">${alert.time}</span>
            `;
            container.appendChild(alertElement);
        });
    }

    // Get alert icon based on type
    getAlertIcon(type) {
        const icons = {
            'info': 'ℹ️',
            'warning': '⚠️',
            'success': '✅',
            'error': '❌'
        };
        return icons[type] || 'ℹ️';
    }

    // Update favorite pairs display
    updateFavoritePairs(pairs) {
        const container = document.getElementById('favoritePairs');
        if (!container) return;

        container.innerHTML = '';
        pairs.forEach(pair => {
            const pairElement = document.createElement('div');
            pairElement.className = 'favorite-pair';
            pairElement.dataset.pair = pair;
            pairElement.innerHTML = `
                <span class="pair-name">${pair}</span>
                <span class="pair-rate" id="rate-${pair}">Loading...</span>
                <button class="remove-favorite" data-pair="${pair}">×</button>
            `;
            container.appendChild(pairElement);
        });
    }

    // Animation helper for smooth transitions
    animateValue(element, start, end, duration = 1000) {
        if (!element) return;

        const range = end - start;
        const increment = range / (duration / 10);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = current.toFixed(4);
        }, 10);
    }

    // Update mobile menu state
    toggleMobileMenu(show) {
        const menu = document.getElementById('mobileMenu');
        const overlay = document.getElementById('menuOverlay');
        
        if (menu) {
            menu.classList.toggle('show', show);
        }
        if (overlay) {
            overlay.style.display = show ? 'block' : 'none';
        }
    }

    // Update theme
    updateTheme(theme) {
        document.body.className = `theme-${theme}`;
        localStorage.setItem('selectedTheme', theme);
    }
}

// Create and export singleton instance  
const uiManager = new UIManager();
export { uiManager };