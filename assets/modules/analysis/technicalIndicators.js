// assets/modules/technicalIndicators.js

class TechnicalIndicators {
    constructor() {
        this.activeIndicators = {
            sma: { active: false, period: 20, color: '#ff6b35' },
            bollinger: { active: false, period: 20, color: '#9c27b0' },
            rsi: { active: false, period: 14, color: '#ea4335' }
        };
    }

    // Calculate Simple Moving Average
    calculateSMA(data, period) {
        if (data.length < period) return Array(data.length).fill(null);
        
        const smaData = [];
        
        // Fill beginning with nulls
        for (let i = 0; i < period - 1; i++) {
            smaData.push(null);
        }
        
        // Calculate SMA for remaining points
        for (let i = period - 1; i < data.length; i++) {
            const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
            smaData.push(sum / period);
        }
        
        return smaData;
    }

    // Calculate Bollinger Bands
    calculateBollingerBands(data, period = 20, stdDev = 0.5) {
        if (data.length < period) {
            return { 
                upper: Array(data.length).fill(null), 
                middle: Array(data.length).fill(null), 
                lower: Array(data.length).fill(null) 
            };
        }
        
        const upper = [];
        const middle = [];
        const lower = [];
        
        // Fill beginning with nulls
        for (let i = 0; i < period - 1; i++) {
            upper.push(null);
            middle.push(null);
            lower.push(null);
        }
        
        // Calculate for remaining points
        for (let i = period - 1; i < data.length; i++) {
            const dataSlice = data.slice(i - period + 1, i + 1);
            const mean = dataSlice.reduce((acc, val) => acc + val, 0) / period;
            
            const squaredDiffs = dataSlice.map(val => Math.pow(val - mean, 2));
            const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / period;
            const standardDeviation = Math.sqrt(variance);
            
            upper.push(mean + (standardDeviation * stdDev));
            middle.push(mean);
            lower.push(mean - (standardDeviation * stdDev));
        }
        
        return { upper, middle, lower };
    }

    // Calculate RSI
    calculateRSI(data, period = 14) {
        if (data.length < period + 1) {
            return Array(data.length).fill(null);
        }
        
        const rsiData = [];
        
        // Fill beginning with nulls
        for (let i = 0; i < period; i++) {
            rsiData.push(null);
        }
        
        const gains = [];
        const losses = [];
        
        // Calculate price changes
        for (let i = 1; i < data.length; i++) {
            const change = data[i] - data[i - 1];
            gains.push(change > 0 ? change : 0);
            losses.push(change < 0 ? Math.abs(change) : 0);
        }
        
        // Calculate RSI for remaining points
        for (let i = period - 1; i < gains.length; i++) {
            const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
            const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
            
            if (avgLoss === 0) {
                rsiData.push(100);
            } else {
                const rs = avgGain / avgLoss;
                const rsi = 100 - (100 / (1 + rs));
                rsiData.push(rsi);
            }
        }
        
        return rsiData;
    }

    // Toggle indicator on/off
    toggleIndicator(indicatorType) {
        // Initialize if doesn't exist
        if (!this.activeIndicators[indicatorType]) {
            this.activeIndicators[indicatorType] = {
                active: false,
                period: this.getDefaultPeriod(indicatorType)
            };
        }
        
        // Toggle the state
        this.activeIndicators[indicatorType].active = !this.activeIndicators[indicatorType].active;
        
        console.log(`Indicator ${indicatorType} is now ${this.activeIndicators[indicatorType].active ? 'active' : 'inactive'}`);
        
        return this.activeIndicators[indicatorType].active;
    }

    getDefaultPeriod(indicatorType) {
        switch(indicatorType) {
            case 'sma': return 20;
            case 'rsi': return 14;
            case 'bollinger': return 20;
            default: return 20;
        }
    }

    // Get indicator state
    isIndicatorActive(indicatorType) {
        return this.activeIndicators[indicatorType]?.active || false;
    }

    // Get all active indicators
    getActiveIndicators() {
        return this.activeIndicators;
    }

    // Update indicator settings
    updateIndicatorSettings(indicatorType, settings) {
        if (this.activeIndicators[indicatorType]) {
            Object.assign(this.activeIndicators[indicatorType], settings);
        }
    }

    // Add indicators to chart
    addIndicatorsToChart(chart, historicalData) {
        if (!chart || !historicalData) {
            console.error('❌ Missing chart or data for indicators');
            return;
        }
        
        const data = historicalData.map(item => item.rate);
        const dataLength = data.length;
        
        console.log('📊 Processing indicators for', dataLength, 'data points');
        
        // Remove existing indicator datasets
        const originalDatasets = chart.data.datasets.filter(dataset => !dataset.isIndicator);
        chart.data.datasets = [...originalDatasets];
        
        // Add SMA if active
        if (this.activeIndicators.sma.active) {
            const period = Math.min(5, Math.floor(dataLength / 2));
            const smaData = this.calculateSMA(data, period);
            
            chart.data.datasets.push({
                label: `SMA (${period}) - ${period-1} day warmup`,
                data: smaData,
                borderColor: this.activeIndicators.sma.color,
                backgroundColor: 'transparent',
                borderWidth: 3,
                fill: false,
                tension: 0.2,
                pointRadius: 0,
                isIndicator: true,
                borderDash: [5, 5],
                spanGaps: true
            });
            
            console.log('📈 SMA added:', smaData.filter(x => x !== null).length, 'calculated points');
        }
        
        // Add Bollinger Bands if active
        if (this.activeIndicators.bollinger.active) {
            const period = Math.min(this.activeIndicators.bollinger.period, Math.floor(dataLength / 2));
            const bands = this.calculateBollingerBands(data, period);
            
            chart.data.datasets.push(
                {
                    label: `Bollinger Upper (${period}) - ${period-1} day warmup`,
                    data: bands.upper,
                    borderColor: this.activeIndicators.bollinger.color,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0,
                    isIndicator: true,
                    borderDash: [3, 3],
                    spanGaps: true
                },
                {
                    label: `Bollinger Lower (${period}) - ${period-1} day warmup`,
                    data: bands.lower,
                    borderColor: this.activeIndicators.bollinger.color,
                    backgroundColor: '#9c27b020',
                    borderWidth: 2,
                    fill: '-1',
                    pointRadius: 0,
                    isIndicator: true,
                    borderDash: [3, 3],
                    spanGaps: true
                }
            );
            
            console.log('📊 Bollinger added:', bands.upper.filter(x => x !== null).length, 'calculated points');
        }
        
        // Add RSI if active
        if (this.activeIndicators.rsi.active) {
            const period = Math.min(this.activeIndicators.rsi.period, Math.floor(dataLength / 3));
            const rsiData = this.calculateRSI(data, period);
            
            // Ensure RSI scale exists
            chart.options.scales.y2 = {
                type: 'linear',
                display: true,
                position: 'right',
                min: 0,
                max: 100,
                grid: { drawOnChartArea: false },
                ticks: {
                    color: '#5f6368',
                    font: { size: 10 },
                    callback: function(value) { return value.toFixed(0); }
                }
            };
            
            chart.data.datasets.push({
                label: `RSI (${period}) - ${period} day warmup`,
                data: rsiData,
                borderColor: this.activeIndicators.rsi.color,
                backgroundColor: 'transparent',
                borderWidth: 3,
                fill: false,
                tension: 0.2,
                pointRadius: 0,
                isIndicator: true,
                yAxisID: 'y2',
                spanGaps: true
            });
            
            console.log('⚡ RSI added:', rsiData.filter(x => x !== null).length, 'calculated points');
        }
        
        chart.update('none');
        console.log('✅ Chart updated with', chart.data.datasets.length, 'total datasets');
    }
}

// Create singleton instance
const technicalIndicators = new TechnicalIndicators();

export { technicalIndicators, TechnicalIndicators };