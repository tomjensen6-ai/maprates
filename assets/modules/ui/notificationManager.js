/**
 * NotificationManager Module
 * Centralized notification, toast, and alert system
 * Handles all user feedback and status messages
 */

class NotificationManager {
    constructor() {
        this.activeNotifications = new Map();
        this.notificationQueue = [];
        this.isProcessing = false;
        this.defaultDuration = 5000;
        this.zIndex = 10000;
        
        // Notification types and their styles
        this.notificationStyles = {
            success: {
                background: 'linear-gradient(135deg, #34a853, #188038)',
                icon: '✅',
                color: 'white'
            },
            error: {
                background: 'linear-gradient(135deg, #ea4335, #d33b27)',
                icon: '❌',
                color: 'white'
            },
            warning: {
                background: 'linear-gradient(135deg, #fbbc04, #f9ab00)',
                icon: '⚠️',
                color: 'white'
            },
            info: {
                background: 'linear-gradient(135deg, #4285f4, #1a73e8)',
                icon: 'ℹ️',
                color: 'white'
            },
            processing: {
                background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
                icon: '⏳',
                color: 'white'
            }
        };
        
        // Initialize notification container
        this.initContainer();
        
        // Educational info cache
        this.educationalInfoShown = new Set();
    }
    
    initContainer() {
        // Create main notification container if it doesn't exist
        if (!document.getElementById('notificationContainer')) {
            const container = document.createElement('div');
            container.id = 'notificationContainer';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: ${this.zIndex};
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-width: 400px;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
    }
    
    /**
     * Show a notification toast
     * @param {string} message - The message to display
     * @param {string} type - Type of notification (success, error, warning, info, processing)
     * @param {number} duration - How long to show (ms), 0 for persistent
     * @param {string} id - Optional ID for updating/removing specific notifications
     * @returns {string} - Notification ID
     */
    showNotification(message, type = 'info', duration = this.defaultDuration, id = null) {
        const notificationId = id || `notification-${Date.now()}`;
        
        // Remove existing notification with same ID
        if (this.activeNotifications.has(notificationId)) {
            this.removeNotification(notificationId);
        }
        
        const container = document.getElementById('notificationContainer');
        const style = this.notificationStyles[type] || this.notificationStyles.info;
        
        const notification = document.createElement('div');
        notification.id = notificationId;
        notification.style.cssText = `
            background: ${style.background};
            color: ${style.color};
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            animation: slideIn 0.3s ease-out;
            pointer-events: all;
            cursor: pointer;
            transition: all 0.3s ease;
            min-width: 300px;
        `;
        
        notification.innerHTML = `
            <span style="font-size: 1.5rem;">${style.icon}</span>
            <div style="flex: 1;">
                <div style="font-weight: 600; font-size: 0.95rem;">${message}</div>
            </div>
            <button onclick="window.notificationManager.removeNotification('${notificationId}')" 
                style="
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                    transition: background 0.2s;
                "
                onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'"
                onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'"
            >×</button>
        `;
        
        // Add slide-in animation
        this.addAnimation();
        
        container.appendChild(notification);
        this.activeNotifications.set(notificationId, notification);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notificationId);
            }, duration);
        }
        
        return notificationId;
    }
    
    removeNotification(id) {
        const notification = this.activeNotifications.get(id);
        if (notification) {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                notification.remove();
                this.activeNotifications.delete(id);
            }, 300);
        }
    }
    
    addAnimation() {
        if (!document.getElementById('notificationAnimations')) {
            const style = document.createElement('style');
            style.id = 'notificationAnimations';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Specific notification methods
    showSuccess(message, duration = 3000) {
        return this.showNotification(message, 'success', duration);
    }
    
    showError(message, duration = 5000) {
        // Also update legacy error div if it exists
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
        
        console.error('Error:', message);
        return this.showNotification(message, 'error', duration);
    }
    
    hideError() {
        // Hide legacy error div
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }
    
    showWarning(message, duration = 4000) {
        return this.showNotification(message, 'warning', duration);
    }
    
    showInfo(message, duration = 3000) {
        return this.showNotification(message, 'info', duration);
    }
    
    showProcessing(message, id = 'processing', duration = 5000) {
        // Default to 5 seconds instead of persistent
        return this.showNotification(message, 'processing', duration, id);
    }
    
    hideProcessing(id = 'processing') {
        this.removeNotification(id);
    }
    
    // Chart-specific notifications
    showChartError(message) {
        // Update chart container if exists
        if (window.chartManager) {
            window.chartManager.showChartError(message);
        }
        return this.showError(`Chart Error: ${message}`);
    }
    
    showChartLoading() {
        if (window.chartManager) {
            window.chartManager.showChartLoading();
        }
        if (window.uiManager) {
            window.uiManager.showLoading('chartContainer');
        }
        // Don't show notification for chart loading - it's already shown in the chart
        // return this.showProcessing('Loading chart data...', 'chart-loading');
    }
    
    hideChartLoading() {
        this.hideProcessing('chart-loading');
    }
    
    // AI-specific notifications
        showAIProcessing() {
        const btn = document.querySelector('[data-indicator="ai"]');
        if (btn) {
            btn.innerHTML = '🤖 Processing...';
            btn.style.background = 'linear-gradient(45deg, #fbbc04, #f29900)';
        }
        // Show with auto-dismiss after 3 seconds
        return this.showNotification('Mathematical Analysis in progress...', 'processing', 3000, 'ai-processing');
    }
    
    hideAIProcessing() {
        this.hideProcessing('ai-processing');
        const btn = document.querySelector('[data-indicator="ai"]');
        if (btn) {
            btn.innerHTML = '📊 Trend Analysis';
            btn.style.background = 'linear-gradient(45deg, #4285f4, #34a853)';
        }
    }
    
    showAIError(message) {
        const btn = document.querySelector('[data-indicator="ai"]');
        if (btn) {
            btn.innerHTML = '🤖 Error';
            btn.style.background = 'linear-gradient(45deg, #ea4335, #d93025)';
            
            setTimeout(() => {
                btn.innerHTML = '📊 Trend Projection';
                btn.style.background = 'linear-gradient(45deg, #4285f4, #34a853)';
            }, 3000);
        }
        
        console.error('🤖 AI Error:', message);
        return this.showError(`AI Error: ${message}`, 3000);
    }
    
    // Status displays
    showAPIStatus() {
        const status = document.getElementById('apiStatus');
        if (!status) {
            const statusDiv = document.createElement('div');
            statusDiv.id = 'apiStatus';
            statusDiv.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #2d3748;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 0.75rem;
                z-index: 1000;
                opacity: 0.8;
            `;
            document.body.appendChild(statusDiv);
        }
        
        // Update with real data if available
        if (window.apiConfigManager) {
            const totalUsed = window.apiConfigManager.usage.exchangerate.used;
            const mode = totalUsed > 0 ? 'Live Data' : 'Sample Data';
            
            //document.getElementById('apiStatus').innerHTML = `
              //  📡 API: ${totalUsed}/1500 requests
              //  <br>📊 Overlays: ${window.activeOverlays ? window.activeOverlays.length : 0} active
              //  <br>🔄 Mode: ${mode}
            //`;
        }
    }
    
    showAlgorithmStatus() {
        const existingStatus = document.getElementById('algorithmStatus');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        const statusDiv = document.createElement('div');
        statusDiv.id = 'algorithmStatus';
        statusDiv.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #f8f9fa, #e8f0fe);
            border: 1px solid #dadce0;
            border-bottom: none;
            border-radius: 12px 12px 0 0;
            padding: 12px 24px;
            display: flex;
            gap: 20px;
            align-items: center;
            box-shadow: 0 -4px 12px rgba(60, 64, 67, 0.15);
            z-index: 1000;
            backdrop-filter: blur(8px);
            max-width: 90vw;
            overflow-x: auto;
        `;
        
        const aiStatus = window.aiPredictionsActive ? '🤖 Active' : '⚪ Idle';
        const overlayCount = window.activeOverlays ? window.activeOverlays.filter(o => o.visible).length : 0;
        const cacheStats = window.getCacheStatsForStatus ? window.getCacheStatsForStatus() : { hitRate: 'N/A', entries: 0 };
        
        statusDiv.innerHTML = `
            <div style="background: rgba(255,255,255,0.9); border: 1px solid #dadce0; border-radius: 8px; padding: 8px 12px; font-size: 0.75rem; color: #5f6368; white-space: nowrap;">
                <div style="color: #1a73e8; font-weight: 600; margin-bottom: 2px;">🏦 DETERMINISTIC AI</div>
                <div style="margin: 1px 0;">🔮 Algorithm: ${aiStatus}</div>
                <div style="margin: 1px 0;">📊 Overlays: ${overlayCount} tracked</div>
                <div style="margin: 1px 0;">⚡ Mode: Educational-grade</div>
            </div>
            
            <div style="background: rgba(255,255,255,0.9); border: 1px solid #dadce0; border-radius: 8px; padding: 8px 12px; font-size: 0.75rem; color: #5f6368; white-space: nowrap;">
                <div style="color: #1a73e8; font-weight: 600; margin-bottom: 2px;">📡 SYSTEM STATUS</div>
                <div style="margin: 1px 0;">🔌 API: ${window.apiConfigManager ? window.apiConfigManager.usage.exchangerate.used : 0}/1500 requests</div>
                <div style="margin: 1px 0;">💾 Cache: ${window.apiManager ? window.apiManager.cache.size : 0} live entries</div>
                <div style="margin: 1px 0;">⚡ Mode: Live Data Priority</div>
            </div>
            
            <div style="background: rgba(255,255,255,0.9); border: 1px solid #dadce0; border-radius: 8px; padding: 8px 12px; font-size: 0.75rem; color: #5f6368; white-space: nowrap;">
                <div style="color: #34a853; font-weight: 600; margin-bottom: 2px;">⚡ PERFORMANCE</div>
                <div style="margin: 1px 0;">💾 Hit Rate: ${cacheStats.hitRate}</div>
                <div style="margin: 1px 0;">📊 Cached Pairs: ${cacheStats.entries}</div>
                <div style="margin: 1px 0;">🚀 Status: Optimized</div>
            </div>
        `;
        
        document.body.appendChild(statusDiv);
        
        if (!document.body.style.paddingBottom) {
            document.body.style.paddingBottom = '80px';
        }
    }
    
    // Educational info display
    showIndicatorEducationalInfo() {
        // Check if already shown
        if (document.getElementById('indicatorEducationalInfo')) return;
        
        const chartInfo = document.querySelector('.chart-info');
        if (!chartInfo) return;
        
        const infoPanel = document.createElement('div');
        infoPanel.id = 'indicatorEducationalInfo';
        infoPanel.style.cssText = `
            background: linear-gradient(135deg, #f0f4f8, #e2e8f0);
            border: 1px solid #cbd5e0;
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
            font-size: 0.875rem;
        `;
        
        infoPanel.innerHTML = `
            <h4 style="color: #2d3748; margin-bottom: 12px;">📚 Understanding These Indicators (Educational Reference):</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px;">
                <div style="background: white; padding: 12px; border-radius: 6px; border-left: 3px solid #4285f4;">
                    <strong style="color: #4285f4;">📈 SMA (Simple Moving Average)</strong>
                    <p style="margin: 4px 0; color: #4a5568; font-size: 0.8rem;">
                        Shows average price over X days. When price is above SMA, it may indicate upward trend.
                        <br><em>Used by traders to identify trend direction.</em>
                    </p>
                </div>
                
                <div style="background: white; padding: 12px; border-radius: 6px; border-left: 3px solid #34a853;">
                    <strong style="color: #34a853;">📊 Bollinger Bands</strong>
                    <p style="margin: 4px 0; color: #4a5568; font-size: 0.8rem;">
                        Shows volatility range. Narrow bands = low volatility, Wide bands = high volatility.
                        <br><em>Helps identify overbought/oversold conditions.</em>
                    </p>
                </div>
                
                <div style="background: white; padding: 12px; border-radius: 6px; border-left: 3px solid #ea4335;">
                    <strong style="color: #ea4335;">⚡ RSI (Relative Strength Index)</strong>
                    <p style="margin: 4px 0; color: #4a5568; font-size: 0.8rem;">
                        Momentum indicator (0-100). Above 70 = potentially overbought, Below 30 = potentially oversold.
                        <br><em>Helps identify potential reversal points.</em>
                    </p>
                </div>
                
                <div style="background: white; padding: 12px; border-radius: 6px; border-left: 3px solid #fbbc04;">
                    <strong style="color: #fbbc04;">📉 Trend Projections</strong>
                    <p style="margin: 4px 0; color: #4a5568; font-size: 0.8rem;">
                        Mathematical extrapolation based on historical patterns. NOT predictions of future prices.
                        <br><em>For educational understanding only.</em>
                    </p>
                </div>
            </div>
            
            <div style="
                background: #fff5f5;
                border: 1px solid #feb2b2;
                border-radius: 6px;
                padding: 12px;
                margin-top: 12px;
                color: #c53030;
                font-size: 0.8rem;
            ">
                <strong>⚠️ Educational Notice:</strong> These indicators are for learning purposes only. 
                Real trading involves significant risk and requires professional knowledge, licenses, and consideration of many factors 
                not shown here. This tool does not provide investment advice.
            </div>
        `;
        
        chartInfo.appendChild(infoPanel);
    }
    
    // Clear all notifications
    clearAll() {
        this.activeNotifications.forEach((notification, id) => {
            this.removeNotification(id);
        });
    }
}

// Create singleton instance and export
const notificationManager = new NotificationManager();

// Make globally available
window.notificationManager = notificationManager;

export default notificationManager;