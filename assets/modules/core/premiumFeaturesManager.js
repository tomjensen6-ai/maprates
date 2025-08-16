/**
 * PremiumFeaturesManager - Manages premium features and subscription status
 * Handles feature gating, premium checks, and upgrade prompts
 */
class PremiumFeaturesManager {
    constructor() {
        this.isInitialized = false;
        
        // Premium subscription status
        this.isPremiumUser = true; // Set to true for testing premium features
        
        // Premium feature flags
        this.features = {
            historicalCharts: false,
            multipleOverlays: false,
            exportCharts: false,
            aiPredictions: false,
            technicalIndicators: false,
            maxDestinations: 2 // Free users limited to 2 destinations
        };
        
        // Premium plan details
        this.plans = {
            free: {
                name: 'Free',
                price: 0,
                features: {
                    historicalCharts: false,
                    multipleOverlays: false,
                    exportCharts: false,
                    aiPredictions: false,
                    technicalIndicators: false,
                    maxDestinations: 2
                }
            },
            premium: {
                name: 'Premium',
                price: 9.99,
                features: {
                    historicalCharts: true,
                    multipleOverlays: true,
                    exportCharts: true,
                    aiPredictions: true,
                    technicalIndicators: true,
                    maxDestinations: 5
                }
            }
        };
        
        // Track feature usage for analytics
        this.featureUsageAttempts = {};
        
        // Dependencies
        this.stateManager = null;
    }

    /**
     * Initialize the premium features manager
     */
    init(dependencies = {}) {
        if (this.isInitialized) return;
        
        // Set dependencies
        this.stateManager = dependencies.stateManager || window.stateManager;
        
        // Load saved subscription status
        this.loadSubscriptionStatus();
        
        // Update features based on subscription
        this.updateFeatures();
        
        // Sync with state manager
        if (this.stateManager) {
            this.stateManager.setState({
                isPremiumUser: this.isPremiumUser,
                premiumFeatures: this.features
            });
        }
        
        this.isInitialized = true;
        console.log('✅ PremiumFeaturesManager initialized');
        console.log(`📊 User status: ${this.isPremiumUser ? 'Premium' : 'Free'}`);
    }

    /**
     * Check if user is premium
     */
    isPremium() {
        return this.isPremiumUser;
    }

    /**
     * Check if user can access a specific feature
     */
    canAccessFeature(featureName) {
        return this.isPremiumUser || this.features[featureName];
    }

    /**
     * Get maximum destinations allowed
     */
    getMaxDestinations() {
        return this.isPremiumUser ? 5 : 2;
    }

    /**
     * Update features based on subscription status
     */
    updateFeatures() {
        if (this.isPremiumUser) {
            this.features = { ...this.plans.premium.features };
        } else {
            this.features = { ...this.plans.free.features };
        }
        
        // Update state manager
        if (this.stateManager) {
            this.stateManager.setState({
                premiumFeatures: this.features,
                maxDestinations: this.features.maxDestinations
            });
        }
    }

    /**
     * Gate a premium feature
     */
    requiresPremium(featureName, callback) {
        // Track attempt
        this.trackFeatureAttempt(featureName);
        
        if (this.canAccessFeature(featureName)) {
            // User has access, execute callback
            if (callback && typeof callback === 'function') {
                callback();
            }
            return true;
        } else {
            // Show premium modal
            this.showPremiumModal(featureName);
            return false;
        }
    }

    /**
     * Show premium upgrade modal
     */
    showPremiumModal(featureName) {
        if (window.modalManager) {
            // Use the new ModalManager
            window.modalManager.showPremiumModal(featureName);
        } else {
            // Fallback to old implementation if ModalManager not available
            // Remove existing modal if present
            const existingModal = document.getElementById('premiumModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Create the modal using old method
            const modal = document.createElement('div');
            modal.id = 'premiumModal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;
            
            modal.innerHTML = `
                <div style="
                    background: white;
                    border-radius: 12px;
                    padding: 32px;
                    max-width: 480px;
                    margin: 20px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                    text-align: center;
                ">
                    <div style="font-size: 4rem; margin-bottom: 20px;">⭐</div>
                    <h2 style="margin: 0 0 16px 0; color: #1a73e8; font-size: 1.5rem;">
                        Upgrade to Premium
                    </h2>
                    <p style="color: #5f6368; margin-bottom: 24px; font-size: 1rem; line-height: 1.5;">
                        ${featureName} is only available for premium users.
                        Unlock all professional features and unlimited access!
                    </p>
                    
                    <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0;">
                        <h3 style="margin: 0 0 16px 0; color: #202124; font-size: 1.1rem;">
                            Premium Features Include:
                        </h3>
                        <ul style="text-align: left; color: #5f6368; margin: 0; padding-left: 20px; list-style: none;">
                            ${this.premiumFeatures.map(feature => `
                                <li style="margin: 8px 0; display: flex; align-items: center;">
                                    <span style="color: #34a853; margin-right: 8px;">✓</span>
                                    ${feature}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    
                    <div style="display: flex; gap: 12px; justify-content: center;">
                        <button onclick="window.premiumFeaturesManager.closePremiumModal()" style="
                            background: #f8f9fa;
                            color: #5f6368;
                            border: 1px solid #dadce0;
                            border-radius: 8px;
                            padding: 12px 24px;
                            font-size: 0.95rem;
                            font-weight: 500;
                            cursor: pointer;
                            transition: all 0.2s;
                        " onmouseover="this.style.background='#e8eaed'" onmouseout="this.style.background='#f8f9fa'">
                            Maybe Later
                        </button>
                        <button onclick="window.premiumFeaturesManager.upgradeToPremium()" style="
                            background: linear-gradient(45deg, #4285f4, #1a73e8);
                            color: white;
                            border: none;
                            border-radius: 8px;
                            padding: 12px 32px;
                            font-size: 0.95rem;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                            box-shadow: 0 2px 8px rgba(66, 133, 244, 0.3);
                        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(66, 133, 244, 0.4)'" 
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(66, 133, 244, 0.3)'">
                            🚀 Upgrade Now
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close on backdrop click
            modal.onclick = (e) => {
                if (e.target === modal) {
                    this.closePremiumModal();
                }
            };
        }
    }

    /**
     * Close premium modal
     */
    closePremiumModal() {
        if (window.modalManager && window.modalManager.isModalOpen('premiumModal')) {
            window.modalManager.closeModal('premiumModal');
        } else {
            // Fallback to old implementation
            const modal = document.getElementById('premiumModal');
            if (modal) {
                modal.remove();
            }
        }
    }

    /**
     * Upgrade to premium
     */
    upgradeToPremium() {
        // For testing, just enable premium features
        this.isPremiumUser = true;
        this.updateFeatures();
        this.saveSubscriptionStatus();
        this.closePremiumModal();
        
        // Show success message
        this.showUpgradeSuccess();
        
        // Update UI elements that depend on premium status
        if (window.updateAddDestinationButton) {
            window.updateAddDestinationButton();
        }
        
        // In production, this would redirect to payment processor
        // window.location.href = 'https://checkout.stripe.com/...';
    }

    /**
     * Show upgrade success message
     */
    showUpgradeSuccess() {
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #34a853, #0f9d58);
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(52,168,83,0.3);
            z-index: 10001;
            animation: slideInRight 0.3s ease;
            display: flex;
            align-items: center;
            gap: 12px;
        `;
        
        successDiv.innerHTML = `
            <span style="font-size: 24px;">🎉</span>
            <div>
                <strong>Welcome to Premium!</strong><br>
                <span style="font-size: 0.875rem; opacity: 0.9;">All features are now unlocked</span>
            </div>
        `;
        
        document.body.appendChild(successDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            successDiv.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => successDiv.remove(), 300);
        }, 5000);
    }

    /**
     * Track feature usage attempts
     */
    trackFeatureAttempt(featureName) {
        if (!this.featureUsageAttempts[featureName]) {
            this.featureUsageAttempts[featureName] = 0;
        }
        this.featureUsageAttempts[featureName]++;
        
        // Save analytics
        this.saveAnalytics();
    }

    // Track layer usage for premium analytics
    trackLayerUsage(layerName) {
        if (!this.layerUsage) {
            this.layerUsage = {};
        }
        
        if (!this.layerUsage[layerName]) {
            this.layerUsage[layerName] = {
                count: 0,
                firstUsed: Date.now(),
                lastUsed: null
            };
        }
        
        this.layerUsage[layerName].count++;
        this.layerUsage[layerName].lastUsed = Date.now();
        
        // Save to localStorage for persistence
        localStorage.setItem('maprates_layer_usage', JSON.stringify(this.layerUsage));
    }

    // Premium layer features
    getLayerFeatures(layerName) {
        const features = {
            financial: {
                free: ['basic_rates', 'daily_update'],
                premium: ['historical_data', 'predictions', 'alerts', 'api_access']
            },
            affiliate: {
                free: ['conversion_rates', 'top_countries'],
                premium: ['niche_analysis', 'seasonal_trends', 'competitor_data', 'export']
            },
            publishing: {
                free: ['market_scores', 'top_genres'],
                premium: ['platform_analysis', 'pricing_optimizer', 'translation_roi', 'trends']
            }
        };
        
        return this.isPremium() ? 
            [...features[layerName].free, ...features[layerName].premium] : 
            features[layerName].free;
    }

    /**
     * Get feature usage analytics
     */
    getFeatureAnalytics() {
        return {
            attempts: this.featureUsageAttempts,
            mostRequested: Object.entries(this.featureUsageAttempts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([feature]) => feature)
        };
    }

    /**
     * Save subscription status
     */
    saveSubscriptionStatus() {
        localStorage.setItem('premiumStatus', JSON.stringify({
            isPremium: this.isPremiumUser,
            features: this.features,
            timestamp: new Date().toISOString()
        }));
    }

    /**
     * Load subscription status
     */
    loadSubscriptionStatus() {
        const saved = localStorage.getItem('premiumStatus');
        if (saved) {
            try {
                const status = JSON.parse(saved);
                this.isPremiumUser = status.isPremium;
                
                // For testing, keep premium enabled
                this.isPremiumUser = true;
            } catch (error) {
                console.error('Error loading subscription status:', error);
            }
        }
    }

    /**
     * Save analytics
     */
    saveAnalytics() {
        localStorage.setItem('premiumAnalytics', JSON.stringify({
            attempts: this.featureUsageAttempts,
            timestamp: new Date().toISOString()
        }));
    }

    /**
     * Reset to free tier
     */
    resetToFree() {
        this.isPremiumUser = false;
        this.updateFeatures();
        this.saveSubscriptionStatus();
        
        if (window.updateAddDestinationButton) {
            window.updateAddDestinationButton();
        }
    }

    /**
     * Get subscription status
     */
    getSubscriptionStatus() {
        return {
            isPremium: this.isPremiumUser,
            plan: this.isPremiumUser ? 'Premium' : 'Free',
            features: this.features,
            maxDestinations: this.features.maxDestinations
        };
    }
}

// Create and export instance
const premiumFeaturesManager = new PremiumFeaturesManager();

// Expose to window for debugging and onclick handlers
window.premiumFeaturesManager = premiumFeaturesManager;

export default premiumFeaturesManager;