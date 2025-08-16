/**
 * ChartUIManager - Professional chart UI management system
 * Handles chart controls, display, timeframes, and user interactions
 * @module ChartUIManager
 * @version 1.0.0
 */
class ChartUIManager {
    constructor() {
        this.isInitialized = false;
        
        // Chart UI state
        this.state = {
            isChartVisible: false,
            activeTimeframe: 7,
            activeIndicators: new Set(),
            isLoading: false,
            currentChartType: 'line',
            zoomLevel: 1,
            panOffset: 0
        };
        
        // Available timeframes
        this.timeframes = [
            { days: 7, label: '7D', shortLabel: '7D' },
            { days: 30, label: '1 Month', shortLabel: '1M' },
            { days: 90, label: '3 Months', shortLabel: '3M' },
            { days: 365, label: '1 Year', shortLabel: '1Y' }
        ];
        
        // Chart container references
        this.containers = {
            main: null,
            header: null,
            controls: null,
            info: null,
            loading: null
        };
        
        // Dependencies
        this.chartManager = null;
        this.technicalIndicators = null;
        this.premiumFeaturesManager = null;
        this.aiPredictions = null;
        
        // Event handlers bound to this instance
        this.boundHandlers = {
            timeframeClick: this.handleTimeframeClick.bind(this),
            indicatorToggle: this.handleIndicatorToggle.bind(this),
            chartClose: this.handleChartClose.bind(this),
            windowResize: this.handleWindowResize.bind(this)
        };
        
        // Performance optimization
        this.resizeDebounceTimer = null;
        this.updateThrottleTimer = null;
    }

    /**
     * Initialize the Chart UI Manager
     * @param {Object} dependencies - Required dependencies
     * @returns {Promise<void>}
     */
    async init(dependencies = {}) {
        if (this.isInitialized) {
            console.warn('ChartUIManager already initialized');
            return;
        }

        try {
            // Inject dependencies
            this.chartManager = dependencies.chartManager || window.chartManager;
            this.technicalIndicators = dependencies.technicalIndicators || window.technicalIndicators;
            this.premiumFeaturesManager = dependencies.premiumFeaturesManager || window.premiumFeaturesManager;
            this.aiPredictions = dependencies.aiPredictions || window.aiPredictions;
            
            // Get container references
            this.initializeContainers();
            
            // Set up event listeners
            this.attachEventListeners();
            
            // Initialize chart header if container exists
            if (this.containers.main) {
                this.renderChartHeader();
            }
            
            this.isInitialized = true;
            console.log('✅ ChartUIManager initialized');
            
        } catch (error) {
            console.error('Failed to initialize ChartUIManager:', error);
            throw error;
        }
    }

    /**
     * Initialize container references
     * @private
     */
    initializeContainers() {
        this.containers.main = document.getElementById('chartContainer');
        this.containers.header = document.querySelector('.chart-header');
        this.containers.controls = document.querySelector('.chart-controls');
        this.containers.info = document.querySelector('.chart-info');
        this.containers.loading = document.querySelector('.chart-loading');
    }

    /**
     * Attach event listeners
     * @private
     */
    attachEventListeners() {
        // Window resize handler with debouncing
        window.addEventListener('resize', this.boundHandlers.windowResize);
        
        // Delegate click events for dynamic elements
        document.addEventListener('click', (e) => {
            // Timeframe buttons
            if (e.target.classList.contains('timeframe-btn')) {
                this.boundHandlers.timeframeClick(e);
            }
            
            // Indicator buttons
            if (e.target.classList.contains('indicator-btn')) {
                this.boundHandlers.indicatorToggle(e);
            }
            
            // Close button
            if (e.target.classList.contains('close-chart-btn')) {
                this.boundHandlers.chartClose(e);
            }
        });
    }

    /**
     * Show the chart with professional animations
     * @param {Object} options - Display options
     * @returns {Promise<void>}
     */
    async showChart(options = {}) {
        if (!this.containers.main) {
            console.error('Chart container not found');
            return;
        }

        // Check premium access if needed
        if (options.requiresPremium && !this.premiumFeaturesManager?.canAccessFeature('historicalCharts')) {
            this.premiumFeaturesManager?.showPremiumModal('Historical Charts');
            return;
        }

        // Show container with animation
        this.containers.main.style.display = 'block';
        this.containers.main.style.opacity = '0';
        
        // Trigger reflow for animation
        void this.containers.main.offsetHeight;
        
        // Animate in
        this.containers.main.style.transition = 'opacity 0.3s ease-in-out';
        this.containers.main.style.opacity = '1';
        
        // Update state
        this.state.isChartVisible = true;
        
        // Scroll into view smoothly
        if (options.scrollIntoView !== false) {
            this.containers.main.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }
        
        // Load initial data if provided
        if (options.loadData) {
            await this.loadChartData(options.timeframe || 7);
        }
        
        // Emit custom event
        this.emitEvent('chartShown', { options });
    }

    /**
     * Hide the chart with animation
     * @returns {Promise<void>}
     */
    async hideChart() {
        if (!this.containers.main) return;

        // Animate out
        this.containers.main.style.transition = 'opacity 0.3s ease-in-out';
        this.containers.main.style.opacity = '0';
        
        // Hide after animation
        setTimeout(() => {
            if (this.containers.main) {
                this.containers.main.style.display = 'none';
            }
        }, 300);
        
        // Update state
        this.state.isChartVisible = false;
        
        // Clean up chart
        if (this.chartManager) {
            this.chartManager.hideChart();
        }
        
        // Emit custom event
        this.emitEvent('chartHidden');
    }

    /**
     * Render the chart header with controls
     * @private
     */
    renderChartHeader() {
        if (!this.containers.header) return;

        const isPremium = this.premiumFeaturesManager?.isPremium() || false;
        
        this.containers.header.innerHTML = `
            <h3>📈 Historical Exchange Rate</h3>
            <div class="chart-controls">
                <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
                    ${this.renderTimeframeButtons()}
                    ${isPremium ? this.renderIndicatorControls() : ''}
                    ${isPremium ? this.renderAIButton() : ''}
                    ${isPremium ? this.renderOverlayButton() : ''}
                </div>
                <button class="close-chart-btn" aria-label="Close chart">✕</button>
            </div>
        `;
    }

    /**
     * Render timeframe buttons
     * @private
     * @returns {string} HTML string
     */
    renderTimeframeButtons() {
        return `
            <div class="timeframe-buttons">
                ${this.timeframes.map(tf => `
                    <button class="timeframe-btn ${tf.days === this.state.activeTimeframe ? 'active' : ''}" 
                            data-period="${tf.days}"
                            aria-label="${tf.label}">
                        ${tf.shortLabel}
                    </button>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render indicator control buttons
     * @private
     * @returns {string} HTML string
     */
    renderIndicatorControls() {
        const indicators = [
            { key: 'sma', icon: '📈', label: 'SMA' },
            { key: 'bollinger', icon: '📊', label: 'Bollinger' },
            { key: 'rsi', icon: '⚡', label: 'RSI' }
        ];

        return `
            <div class="indicator-controls" style="display: flex; gap: 8px; align-items: center;">
                ${indicators.map(ind => `
                    <button class="indicator-btn ${this.state.activeIndicators.has(ind.key) ? 'active' : ''}" 
                            data-indicator="${ind.key}"
                            aria-label="${ind.label} indicator">
                        ${ind.icon} ${ind.label}
                    </button>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render AI predictions button
     * @private
     * @returns {string} HTML string
     */
    renderAIButton() {
        const isActive = this.aiPredictions?.aiPredictionsActive || false;
        
        return `
            <button onclick="toggleAIPredictions()" 
                    class="indicator-btn" 
                    data-indicator="trend" 
                    style="background: linear-gradient(45deg, #4285f4, #34a853); 
                           color: white; 
                           border: none; 
                           font-weight: 600;">
                📈 Trend Analysis (Educational)
            </button>
        `;
    }

    /**
     * Render overlay management button
     * @private
     * @returns {string} HTML string
     */
    renderOverlayButton() {
        return `
            <button onclick="showDestinationOverlayPanel()" 
                    style="background: #34a853;
                           color: white;
                           border: none;
                           border-radius: 4px;
                           padding: 6px 12px;
                           font-size: 0.75rem;
                           font-weight: 500;
                           cursor: pointer;">
                🎯 Manage Overlays
            </button>
        `;
    }

    /**
     * Handle timeframe button click
     * @private
     * @param {Event} event - Click event
     */
    async handleTimeframeClick(event) {
        const button = event.target;
        const period = parseInt(button.dataset.period);
        
        if (period === this.state.activeTimeframe) return;
        
        // Update active state
        this.setActiveTimeframe(period);
        
        // Load new data
        await this.loadChartData(period);
        
        // Emit event
        this.emitEvent('timeframeChanged', { period });
    }

    /**
     * Set active timeframe
     * @param {number} days - Number of days
     */
    setActiveTimeframe(days) {
        this.state.activeTimeframe = days;
        
        // Update UI
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            const btnPeriod = parseInt(btn.dataset.period);
            btn.classList.toggle('active', btnPeriod === days);
        });
    }

    /**
     * Handle indicator toggle
     * @private
     * @param {Event} event - Click event
     */
    handleIndicatorToggle(event) {
        const button = event.target;
        const indicator = button.dataset.indicator;
        
        if (!indicator) return;
        
        // Check premium access
        if (!this.premiumFeaturesManager?.canAccessFeature('technicalIndicators')) {
            this.premiumFeaturesManager?.showPremiumModal('Technical Indicators');
            return;
        }
        
        // Toggle indicator
        if (this.state.activeIndicators.has(indicator)) {
            this.state.activeIndicators.delete(indicator);
            button.classList.remove('active');
        } else {
            this.state.activeIndicators.add(indicator);
            button.classList.add('active');
        }
        
        // Update chart
        if (this.technicalIndicators) {
            this.technicalIndicators.toggleIndicator(indicator);
        }
        
        // Emit event
        this.emitEvent('indicatorToggled', { indicator });
    }

    /**
     * Handle chart close
     * @private
     */
    handleChartClose() {
        this.hideChart();
    }

    /**
     * Handle window resize with debouncing
     * @private
     */
    handleWindowResize() {
        clearTimeout(this.resizeDebounceTimer);
        
        this.resizeDebounceTimer = setTimeout(() => {
            if (this.state.isChartVisible && this.chartManager) {
                this.chartManager.resize();
            }
        }, 250);
    }

    /**
     * Load chart data
     * @param {number} days - Number of days
     * @returns {Promise<void>}
     */
    async loadChartData(days) {
        this.showLoading(true);
        
        try {
            // This would call your existing loadHistoricalData function
            if (window.loadHistoricalData) {
                await window.loadHistoricalData(days);
            }
        } catch (error) {
            console.error('Failed to load chart data:', error);
            this.showError('Failed to load chart data');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Show/hide loading state
     * @param {boolean} show - Show or hide
     */
    showLoading(show) {
        this.state.isLoading = show;
        
        if (this.containers.loading) {
            this.containers.loading.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        console.error('Chart error:', message);
        // Implement error display UI
    }

    /**
     * Emit custom event
     * @private
     * @param {string} eventName - Event name
     * @param {Object} detail - Event detail
     */
    emitEvent(eventName, detail = {}) {
        const event = new CustomEvent(`chartUI:${eventName}`, { detail });
        document.dispatchEvent(event);
    }

    /**
     * Get current chart UI state
     * @returns {Object} Current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Destroy and cleanup
     */
    destroy() {
        // Remove event listeners
        window.removeEventListener('resize', this.boundHandlers.windowResize);
        
        // Clear timers
        clearTimeout(this.resizeDebounceTimer);
        clearTimeout(this.updateThrottleTimer);
        
        // Reset state
        this.state = {
            isChartVisible: false,
            activeTimeframe: 7,
            activeIndicators: new Set(),
            isLoading: false
        };
        
        this.isInitialized = false;
        console.log('ChartUIManager destroyed');
    }
}

// Create singleton instance
const chartUIManager = new ChartUIManager();

// Expose to window for debugging
if (typeof window !== 'undefined') {
    window.chartUIManager = chartUIManager;
}

// Export for ES6 modules
export default chartUIManager;