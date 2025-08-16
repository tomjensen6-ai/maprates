// chartTooltip.js - Professional chart tooltip formatter
export class ChartTooltipManager {
    static formatMultiCurrencyTooltip(context) {
        const tooltipItems = context.chart.tooltip.dataPoints;
        if (!tooltipItems || tooltipItems.length === 0) return '';
        
        // Get date from the first item
        const date = context.chart.data.labels[tooltipItems[0].dataIndex];
        
        // Build professional tooltip
        const lines = [];
        
        // Header with date
        lines.push(`📅 ${date}`);
        lines.push('━━━━━━━━━━━━━━━');
        
        // Group items by type
        const currencyPairs = [];
        const forecasts = [];
        const indicators = [];
        const confidenceBands = [];
        
        tooltipItems.forEach(item => {
            const label = item.dataset.label || '';
            const value = item.parsed.y;
            
            if (!value || isNaN(value)) return;
            
            if (label.includes('Forecast')) {
                forecasts.push({ label, value, color: item.dataset.borderColor });
            } else if (label.includes('Confidence')) {
                confidenceBands.push({ label, value });
            } else if (label.includes('SMA') || label.includes('Bollinger') || label.includes('RSI')) {
                indicators.push({ label, value, color: item.dataset.borderColor });
            } else {
                currencyPairs.push({ label, value, color: item.dataset.borderColor });
            }
        });
        
        // Add currency pairs
        if (currencyPairs.length > 0) {
            currencyPairs.forEach(item => {
                const formattedValue = item.value.toFixed(4);
                const change = ((item.value / currencyPairs[0].value - 1) * 100).toFixed(2);
                const arrow = change >= 0 ? '↑' : '↓';
                const color = change >= 0 ? '#34a853' : '#ea4335';
                
                lines.push(`● ${item.label}`);
                lines.push(`  Rate: ${formattedValue}`);
                lines.push(`  Change: ${arrow} ${Math.abs(change)}%`);
            });
        }
        
        // Add forecasts (without infinity values)
        if (forecasts.length > 0) {
            lines.push('━━━━━━━━━━━━━━━');
            lines.push('🤖 AI Forecasts:');
            forecasts.forEach(item => {
                if (isFinite(item.value)) {
                    const currency = item.label.match(/([A-Z]{3})/)?.[1] || 'Currency';
                    const accuracy = item.label.match(/\((\d+)%\)/)?.[1] || 'N/A';
                    lines.push(`  ${currency}: ${item.value.toFixed(4)}`);
                    lines.push(`  Accuracy: ${accuracy}%`);
                }
            });
        }
        
        // Add indicators
        if (indicators.length > 0) {
            lines.push('━━━━━━━━━━━━━━━');
            lines.push('📊 Indicators:');
            indicators.forEach(item => {
                const name = item.label.split('(')[0].trim();
                lines.push(`  ${name}: ${item.value.toFixed(4)}`);
            });
        }
        
        return lines.join('\n');
    }
    
    static getTooltipOptions() {
        return {
            enabled: true,
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(32, 33, 36, 0.95)',
            titleColor: '#ffffff',
            titleFont: {
                size: 12,
                weight: '600'
            },
            bodyColor: '#e8eaed',
            bodyFont: {
                size: 11,
                family: 'monospace'
            },
            borderColor: '#5f6368',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
                label: function(context) {
                    return ChartTooltipManager.formatMultiCurrencyTooltip({ 
                        chart: context.chart 
                    });
                }
            }
        };
    }
}

// Make available globally
window.ChartTooltipManager = ChartTooltipManager;