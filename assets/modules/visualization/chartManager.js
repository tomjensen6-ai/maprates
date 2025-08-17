// assets/modules/chartManager.js
import { CURRENCY_SYMBOLS } from '../../config/constants.js';

class ChartManager {
    constructor() {
        this.currentChart = null;
        this.currentHistoricalData = null;
        this.activeOverlays = [];
        this.overlayCounter = 0;
        this.overlayColors = [
            '#ea4335', '#fbbc04', '#34a853', '#4285f4', '#9c27b0',
            '#ff6b35', '#00bcd4', '#795548', '#607d8b', '#e91e63'
        ];
        this.resizeTimeout = null; // Add timeout tracker for resize debouncing
    }

    // Get current chart instance
    getChart() {
        return this.currentChart;
    }

    // Get historical data
    getHistoricalData() {
        return this.currentHistoricalData;
    }

    // Set historical data
    setHistoricalData(data) {
        this.currentHistoricalData = data;
    }

    // Destroy current chart
    destroyChart() {
        if (this.currentChart) {
            this.currentChart.destroy();
            this.currentChart = null;
        }
    }

    // Hide chart container
    hideChart() {
        document.getElementById('chartContainer').style.display = 'none';
        this.destroyChart();
    }

    // Show chart loading
    showChartLoading() {
        const wrapper = document.querySelector('.chart-wrapper');
        if (wrapper) {
            wrapper.innerHTML = `
                <div class="chart-loading">
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 1.5rem; margin-bottom: 8px;">📊</div>
                        <div style="font-weight: 600; margin-bottom: 4px;">Loading Real Historical Data</div>
                        <div id="progressText" style="font-size: 0.875rem; color: #5f6368;">Preparing API requests...</div>
                    </div>
                    
                    <div style="width: 100%; max-width: 400px; margin: 0 auto;">
                        <div style="background: #e8eaed; border-radius: 8px; height: 8px; overflow: hidden; margin-bottom: 8px;">
                            <div id="progressBar" style="
                                background: linear-gradient(90deg, #1a73e8, #34a853);
                                height: 100%;
                                width: 0%;
                                transition: width 0.3s ease;
                                border-radius: 8px;
                            "></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #9aa0a6;">
                            <span id="progressStats">0% complete</span>
                            <span id="progressETA">Estimating time...</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // Hide chart loading
    hideChartLoading() {
        const wrapper = document.querySelector('.chart-wrapper');
        if (wrapper) {
            console.log('🔄 Ensuring chart canvas exists...');
            wrapper.innerHTML = '<canvas id="historicalChart"></canvas>';
            
            setTimeout(() => {
                const canvas = document.getElementById('historicalChart');
                console.log('✅ Canvas after hideChartLoading:', canvas ? 'Found' : 'Missing');
            }, 50);
        }
    }

    // Show chart error
    showChartError(message) {
        const wrapper = document.querySelector('.chart-wrapper');
        if (wrapper) {
            wrapper.innerHTML = `
                <div class="chart-loading" style="color: #d93025; text-align: center; padding: 60px 20px;">
                    <div style="font-size: 24px; margin-bottom: 12px;">❌</div>
                    <div style="font-weight: 600; margin-bottom: 8px;">Chart Error</div>
                    <div style="font-size: 0.875rem; opacity: 0.8;">${message}</div>
                    <button onclick="loadHistoricalData(7)" style="
                        margin-top: 16px; 
                        padding: 8px 16px; 
                        background: #1a73e8; 
                        color: white; 
                        border: none; 
                        border-radius: 4px; 
                        cursor: pointer;
                        font-size: 0.875rem;
                    ">Try Again</button>
                </div>
            `;
        }
    }

    // Create chart with data
    createChart(data, homeCurrency, destCurrency, days) {
        console.log('Creating chart with:', {
            dataLength: data?.length,
            homeCurrency: homeCurrency?.code,
            destCurrency: destCurrency?.code,
            days: days
        });
        
        if (!data || data.length === 0) {
            this.showChartError('No data available to display');
            return;
        }
        
        this.hideChartLoading();
        
        // Store historical data
        this.currentHistoricalData = data;
        
        // Ensure Chart.js is available
        if (typeof Chart === 'undefined') {
            this.showChartError('Chart.js library not loaded');
            return;
        }

        // Register zoom plugin if available
        if (typeof ChartZoom !== 'undefined' && Chart.register) {
            Chart.register(ChartZoom);
            console.log('✅ Chart zoom plugin registered');
        } else {
            console.log('⚠️ Chart zoom plugin not found - zoom features disabled');
        }

        setTimeout(() => {
            const ctx = document.getElementById('historicalChart');
            if (!ctx) {
                console.error('Chart canvas not found');
                this.showChartError('Chart canvas not found');
                return;
            }
            
            const context = ctx.getContext('2d');
            if (!context) {
                this.showChartError('Could not get chart context');
                return;
            }
            
            // =================== ADD THIS SECTION ===================
            // CRITICAL: Destroy existing chart instance before creating new one
            if (this.currentChart) {
                console.log('Destroying existing chart instance');
                this.currentChart.destroy();
                this.currentChart = null;
            }
            
            // Also destroy any orphaned Chart.js instances on this canvas
            const existingCharts = Object.values(Chart.instances).filter(
                chart => chart.canvas && chart.canvas.id === 'historicalChart'
            );
            if (existingCharts.length > 0) {
                console.log(`Found ${existingCharts.length} orphaned chart instances - destroying them`);
                existingCharts.forEach(chart => chart.destroy());
            }
            // =================== END OF NEW SECTION ===================
            
            const labels = data.map(item => {
                const date = new Date(item.date);
                if (days <= 7) {
                    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                } else if (days <= 90) {
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                } else {
                    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                }
            });
            
            const rates = data.map(item => item.rate);
            
            const highest = Math.max(...rates);
            const lowest = Math.min(...rates);
            const change = ((rates[rates.length - 1] - rates[0]) / rates[0] * 100);
            
            this.updateChartStats(highest, lowest, change, destCurrency);
            
            // Create the chart
            this.currentChart = new Chart(context, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: `${homeCurrency.code} to ${destCurrency.code}`,
                        data: rates,
                        borderColor: '#0066cc',
                        backgroundColor: (context) => {
                            if (!context.chart.ctx) return 'rgba(0, 102, 204, 0.1)';
                            const ctx = context.chart.ctx;
                            const gradient = ctx.createLinearGradient(0, 0, 0, context.chart.height);
                            gradient.addColorStop(0, 'rgba(66, 133, 244, 0.35)');
                            gradient.addColorStop(0.5, 'rgba(66, 133, 244, 0.15)');
                            gradient.addColorStop(0.8, 'rgba(66, 133, 244, 0.05)');
                            gradient.addColorStop(1, 'rgba(66, 133, 244, 0)');
                            return gradient;
                        },
                        borderWidth: 2,
                        fill: true,
                        tension: 0.2,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointHitRadius: 10,
                        pointBackgroundColor: '#1a73e8',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointHoverBackgroundColor: '#1a73e8',
                        pointHoverBorderColor: '#ffffff'
                    }]
                },
                options: this.getChartOptions(destCurrency, days)
                
            });

            
            
            console.log('Chart created successfully!');
            console.log('Chart instances after creation:', Object.values(Chart.instances).length);
            
            // Add reset zoom button
            this.addResetZoomButton();
            
            // Force canvas resize on mobile
            this.forceCanvasResize();
            
            // Enhanced orientation change handling for iOS
            const resizeHandler = () => {
                // Only resize if chart still exists
                if (this.currentChart && !this.currentChart._destroying) {
                    this.forceCanvasResize();
                }
            };
            
            // Remove any existing listeners first
            window.removeEventListener('resize', resizeHandler);
            window.removeEventListener('orientationchange', resizeHandler);
            
            // Add new listeners with iOS-specific handling
            window.addEventListener('resize', () => {
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(resizeHandler, 250);
            });
            
            // iOS Safari needs special handling for orientation changes
            window.addEventListener('orientationchange', () => {
                // Wait for orientation change to complete
                setTimeout(() => {
                    // Force a re-render of the chart
                    if (this.currentChart && !this.currentChart._destroying) {
                        const canvas = document.getElementById('historicalChart');
                        if (canvas) {
                            // Temporarily hide and show to force Safari to recalculate
                            canvas.style.display = 'none';
                            canvas.offsetHeight; // Force reflow
                            canvas.style.display = 'block';
                            
                            // Now resize
                            this.forceCanvasResize();
                        }
                    }
                }, 500); // iOS needs more time for orientation animation
            });
            
        }, 100);
    }
    
    // Get chart options configuration
    getChartOptions(destCurrency, days) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: window.innerWidth <= 768 ? 1.5 : 2, // Better ratio for mobile
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true,
                            speed: 0.1
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x',
                        drag: {
                            enabled: true,
                            backgroundColor: 'rgba(66, 133, 244, 0.1)'
                        },
                        onZoomComplete: function(context) {
                            // Show reset button when zoomed
                            const resetBtn = document.getElementById('resetZoomBtn');
                            if (resetBtn) {
                                resetBtn.style.display = 'block';
                            }
                        }
                    },
                    pan: {
                        enabled: true,
                        mode: 'x'
                    }
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(32, 33, 36, 0.95)',
                    titleColor: '#ffffff',
                    titleFont: {
                        size: 13,
                        weight: '600'
                    },
                    bodyColor: '#e8eaed',
                    bodyFont: {
                        size: 11
                    },
                    borderColor: '#5f6368',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true,
                    multiKeyBackground: '#fff',
                    callbacks: {
                        title: function(tooltipItems) {
                            if (!tooltipItems.length) return '';
                            return '📅 ' + tooltipItems[0].label;
                        },
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            
                            // Skip invalid values
                            if (!value || !isFinite(value)) return null;
                            
                            // Skip confidence bands
                            if (label.includes('Confidence')) {
                                return null;
                            }
                            
                            // Determine if this is the main pair or an overlay
                            const datasetIndex = context.datasetIndex;
                            const isMain = datasetIndex === 0;
                            const isAI = context.dataset.isAI === true;
                            
                            // Format based on type
                            if (isAI) {
                                const currency = label.match(/([A-Z]{3})/)?.[0] || '';
                                return `🤖 ${currency} Projection: ${value.toFixed(4)}`;
                            } else if (label.includes('(normalized)')) {
                                // Overlay currencies
                                const match = label.match(/([A-Z]{3}) to ([A-Z]{3})/);
                                if (match) {
                                    const [, from, to] = match;
                                    return `📊 ${from} → ${to}: ${value.toFixed(4)}`;
                                }
                                return `📊 ${label.replace('(normalized)', '').trim()}: ${value.toFixed(4)}`;
                            } else if (isMain) {
                                // Main currency pair
                                const match = label.match(/([A-Z]{3}) to ([A-Z]{3})/);
                                if (match) {
                                    const [, from, to] = match;
                                    return `💱 ${from} → ${to}: ${value.toFixed(4)}`;
                                }
                                return `💱 ${label}: ${value.toFixed(4)}`;
                            } else {
                                // Other data
                                return `${label}: ${value.toFixed(4)}`;
                            }
                        },
                        labelColor: function(context) {
                            return {
                                borderColor: context.dataset.borderColor,
                                backgroundColor: context.dataset.borderColor,
                                borderWidth: 2,
                                borderRadius: 2
                            };
                        },
                        footer: function(tooltipItems) {
                            if (!tooltipItems.length) return '';
                            
                            // Calculate daily change if we have previous data
                            const currentIndex = tooltipItems[0].dataIndex;
                            if (currentIndex > 0) {
                                const mainDataset = tooltipItems[0].chart.data.datasets[0];
                                const currentValue = mainDataset.data[currentIndex];
                                const previousValue = mainDataset.data[currentIndex - 1];
                                
                                if (currentValue && previousValue) {
                                    const dailyChange = ((currentValue / previousValue - 1) * 100).toFixed(2);
                                    const arrow = dailyChange >= 0 ? '📈' : '📉';
                                    return `\nDaily: ${arrow} ${Math.abs(dailyChange)}%`;
                                }
                            }
                            return '';
                        },
                        afterFooter: function(tooltipItems) {
                            if (!tooltipItems.length) return '';
                            
                            // Count different types
                            let mainCount = 0;
                            let overlayCount = 0;
                            let aiCount = 0;
                            
                            tooltipItems.forEach(item => {
                                const label = item.dataset.label || '';
                                if (item.dataset.isAI) {
                                    aiCount++;
                                } else if (label.includes('(normalized)')) {
                                    overlayCount++;
                                } else if (!label.includes('Confidence')) {
                                    mainCount++;
                                }
                            });
                            
                            // Add summary line
                            const parts = [];
                            if (mainCount > 0) parts.push(`${mainCount} main`);
                            if (overlayCount > 0) parts.push(`${overlayCount} overlay${overlayCount > 1 ? 's' : ''}`);
                            if (aiCount > 0) parts.push(`${aiCount} projection${aiCount > 1 ? 's' : ''}`);
                            
                            if (parts.length > 1) {
                                return `\n📊 Showing: ${parts.join(', ')}`;
                            }
                            return '';
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        color: 'rgba(95, 99, 104, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#5f6368',
                        font: { size: 12 },
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: days > 90 ? 12 : (days > 30 ? 10 : 7)
                    }
                },
                y: {
                    display: true,
                    grid: {
                        color: 'rgba(95, 99, 104, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#5f6368',
                        font: { size: 12 },
                        callback: function(value) {
                            return value.toFixed(4);
                        }
                    }
                }
            }
        };
    }
    // Force proper canvas sizing on mobile devices
    forceCanvasResize() {
        const canvas = document.getElementById('historicalChart');
        const container = document.getElementById('chartContainer');
        const wrapper = document.querySelector('.chart-wrapper');
        
        if (!canvas || !container || !this.currentChart) return;
        
        // Store chart visibility state
        const isChartActive = container.classList.contains('chart-active');
        if (!isChartActive) return; // Don't resize if chart isn't active
        
        // Use requestAnimationFrame for smooth resizing
        requestAnimationFrame(() => {
            // Get current orientation
            const isPortrait = window.innerHeight > window.innerWidth;
            
            // Calculate appropriate dimensions
            const containerWidth = container.offsetWidth;
            const targetHeight = isPortrait ? 400 : 350;
            
            // Set wrapper height first
            if (wrapper) {
                wrapper.style.height = `${targetHeight}px`;
                wrapper.style.minHeight = `${targetHeight}px`;
            }
            
            // Force canvas element dimensions
            canvas.style.width = '100%';
            canvas.style.height = `${targetHeight}px`;
            canvas.style.minHeight = `${targetHeight}px`;
            canvas.style.display = 'block';
            canvas.style.visibility = 'visible';
            canvas.style.position = 'relative';
            
            // Set actual canvas resolution for crisp rendering
            const dpr = window.devicePixelRatio || 1;
            canvas.width = containerWidth * dpr;
            canvas.height = targetHeight * dpr;
            
            // Scale back via CSS
            canvas.style.width = containerWidth + 'px';
            canvas.style.height = targetHeight + 'px';
            
            // Force Chart.js to recognize new size
            if (this.currentChart) {
                this.currentChart.resize();
                this.currentChart.render();
            }
        });
    }
    

    // Update chart statistics
    updateChartStats(highest, lowest, change, destCurrency) {
        document.getElementById('chartHighest').textContent = `${highest.toFixed(6)} ${destCurrency.code}`;
        document.getElementById('chartLowest').textContent = `${lowest.toFixed(6)} ${destCurrency.code}`;
        
        const changeEl = document.getElementById('chartChange');
        const changeText = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        changeEl.textContent = changeText;
        changeEl.style.color = change >= 0 ? '#137333' : '#d93025';
    }

    // Add reset zoom button
    addResetZoomButton() {
        const chartContainer = document.getElementById('chartContainer');
        if (!document.getElementById('resetZoomBtn')) {
            const resetButton = document.createElement('button');
            resetButton.id = 'resetZoomBtn';
            resetButton.innerHTML = '🔄 Reset Zoom';
            resetButton.style.cssText = `
                position: absolute;
                top: 10px;
                right: 60px;
                padding: 5px 10px;
                background: #1a73e8;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                display: none;
                font-size: 12px;
                z-index: 10;
            `;
            chartContainer.style.position = 'relative';
            chartContainer.appendChild(resetButton);
            
            resetButton.onclick = () => {
                if (this.currentChart && this.currentChart.resetZoom) {
                    this.currentChart.resetZoom();
                    resetButton.style.display = 'none';
                } else if (this.currentChart) {
                    // Fallback: reset by updating chart
                    this.currentChart.update('reset');
                    resetButton.style.display = 'none';
                }
            };
        }
    }

    // Add overlay to chart
    addOverlayToChart(overlayData, currency, color, homeCurrencyCode) {
        if (!this.currentChart || !overlayData || !this.currentHistoricalData) return;
        
        // Get the main chart's first value for normalization
        const mainFirstValue = this.currentHistoricalData[0].rate;
        const overlayFirstValue = overlayData[0].rate;
        
        // Calculate normalization factor
        const normalizationFactor = mainFirstValue / overlayFirstValue;
        
        // Normalize overlay data to start at the same point as main chart
        const normalizedData = overlayData.map(item => ({
            ...item,
            rate: item.rate * normalizationFactor
        }));
        
        this.currentChart.data.datasets.push({
            label: `${homeCurrencyCode} to ${currency} (normalized)`,
            data: normalizedData.map(item => item.rate),
            borderColor: color,
            backgroundColor: 'transparent',
            borderWidth: 2,
            fill: false,
            tension: 0.2,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: color,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointHoverBackgroundColor: color,
            isOverlay: true // Flag for tooltip handling
        });
        
        this.currentChart.update();
    }
}

// Create singleton instance
const chartManager = new ChartManager();

export { chartManager, ChartManager };
