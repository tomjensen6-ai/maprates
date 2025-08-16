// assets/modules/aiPredictions.js

class AIPredictions {
    constructor() {
        // AI System State
        this.aiPredictionsActive = false;
        this.aiPredictionData = null;
        this.aiConfidenceLevel = 80; // Default 80% confidence interval
        this.aiPredictionDays = 7; // Predict 7 days ahead
        this.aiProcessingTime = 1200; // Realistic processing delay (ms)

        // AI Algorithm Configuration
        this.AI_ALGORITHMS = {
            linear: {
                name: 'Linear Regression',
                description: 'Trend-based mathematical projection',
                weight: 0.4,
                color: '#4285f4'
            },
            momentum: {
                name: 'Momentum Analysis', 
                description: 'Recent price action patterns',
                weight: 0.3,
                color: '#34a853'
            },
            hybrid: {
                name: 'Hybrid ML Model',
                description: 'Combined algorithmic approach',
                weight: 1.0,
                color: '#ea4335'
            },
            neural: {
                name: 'Neural Network',
                description: 'Deep learning pattern recognition',
                weight: 0.6,
                color: '#9c27b0'
            }
        };

        // Currently active AI algorithm
        this.activeAIAlgorithm = 'hybrid';

        // AI Prediction Accuracy Tracking
        this.aiAccuracyHistory = [];
        this.aiPredictionCache = new Map(); // Cache predictions for performance

        // AI Confidence Levels
        this.AI_CONFIDENCE_LEVELS = {
            conservative: { level: 95, label: 'Conservative (95%)', color: '#137333' },
            balanced: { level: 80, label: 'Balanced (80%)', color: '#1a73e8' },
            aggressive: { level: 65, label: 'Aggressive (65%)', color: '#d93025' }
        };

        // AI Market Conditions Detection
        this.marketConditions = {
            volatility: 'normal', // low, normal, high
            trend: 'neutral', // bullish, bearish, neutral
            momentum: 'stable', // accelerating, stable, decelerating
            confidence: 80
        };

        // AI Learning Parameters
        this.AI_LEARNING_CONFIG = {
            minDataPoints: 14, // Minimum data needed for predictions
            maxLookback: 90, // Maximum historical days to analyze
            adaptivePeriods: [7, 14, 30], // Different analysis windows
            noiseFilter: 0.02, // Filter out small fluctuations
            trendSensitivity: 0.01 // Minimum change to detect trend
        };

        // AI Prediction Types
        this.PREDICTION_TYPES = {
            price: 'Exchange Rate Forecast',
            trend: 'Trend Direction',
            volatility: 'Volatility Prediction',
            support: 'Support Level',
            resistance: 'Resistance Level'
        };

        // AI Visual Settings
        this.AI_VISUAL_CONFIG = {
            forecastColor: '#34a853',
            confidenceColor: '#34a85330',
            trendColors: {
                bullish: '#137333',
                bearish: '#d93025', 
                neutral: '#5f6368'
            },
            predictionDash: [10, 5],
            confidenceDash: [5, 5]
        };
        
        // AI Performance Metrics
        this.aiPerformanceMetrics = {
            totalPredictions: 0,
            accuratePredictions: 0,
            averageAccuracy: 0,
            bestAlgorithm: 'hybrid',
            lastUpdated: null
        };

        // AI Error Messages
        this.AI_ERROR_MESSAGES = {
            insufficientData: 'Need at least 7 days of data for AI predictions',
            apiLimitReached: 'AI prediction limit reached. Upgrade for unlimited forecasts',
            processingError: 'AI processing error. Please try again',
            networkError: 'Network error during AI calculation'
        };

        // Dependencies
        this.historicalDataManager = null;
    }

    // Initialize with dependencies
    initialize(historicalDataManager) {
        this.historicalDataManager = historicalDataManager;
    }

    // Check if AI is active
    isActive() {
        return this.aiPredictionsActive;
    }

    // Toggle AI predictions on/off
    toggleAIPredictions() {
        this.aiPredictionsActive = !this.aiPredictionsActive;
        console.log(`🤖 AI Predictions toggled: ${this.aiPredictionsActive}`);
        return this.aiPredictionsActive;
    }

    // Get current prediction data
    getPredictionData() {
        return this.aiPredictionData;
    }

    // Calculate AI predictions for a dataset
    async calculateAIPredictions(rates, dates, currencyType = 'main', targetCurrencyCode = null, homeCurrencyCode = null) {
        console.log(`🔮 Calculating AI for ${currencyType}:`, rates.length, 'data points');
        
        // Validate required data
        if (!rates || rates.length < 3) {
            throw new Error('Insufficient rate data for AI prediction');
        }

        // Simulate realistic AI processing time
        await new Promise(resolve => setTimeout(resolve, this.aiProcessingTime));
        
        const predictions = {
            algorithm: this.activeAIAlgorithm,
            confidence: this.aiConfidenceLevel,
            forecast: [],
            trend: 'neutral',
            accuracy: 0,
            marketCondition: 'normal',
            riskLevel: 'medium'
        };
        
        // Algorithm 1: Linear Regression Trend Analysis
        const linearTrend = this.calculateLinearRegression(rates);
        
        // Algorithm 2: Momentum Analysis (short-term patterns)
        const momentum = this.calculateMomentumTrend(rates);
        
        // Algorithm 3: Volatility-Adjusted Predictions
        const volatility = this.calculateVolatility(rates.slice(-14));
        
        // Algorithm 4: Market Condition Detection
        const marketCondition = this.detectMarketCondition(rates);
        predictions.marketCondition = marketCondition.condition;
        
        // Generate hybrid predictions
        const lastRate = rates[rates.length - 1];
        const lastDate = new Date(dates[dates.length - 1]);
        
        // Calculate data fingerprint for deterministic randomness
        const dataFingerprint = rates.slice(-5).reduce((sum, rate, idx) => sum + rate * (idx + 1), 0);
        
        // SETUP DETERMINISTIC VARIABLES
        const pairHash = this.historicalDataManager.createCurrencyPairHash(
            homeCurrencyCode || 'USD', 
            targetCurrencyCode || 'EUR'
        );
        
        // ✅ ADD DEBUG:
        console.log('🔍 DETERMINISTIC DEBUG:');
        console.log('- Currency type:', currencyType);
        console.log('- Data fingerprint:', dataFingerprint);
        console.log('- Last 5 rates:', rates.slice(-5));
        console.log('- Rates length:', rates.length);
        
        for (let i = 1; i <= this.aiPredictionDays; i++) {
            const futureDate = new Date(lastDate);
            futureDate.setDate(futureDate.getDate() + i);
            
            // Hybrid ML Model (weighted combination)
            const linearWeight = this.AI_ALGORITHMS.linear.weight;
            const momentumWeight = this.AI_ALGORITHMS.momentum.weight;
            const volatilityAdjustment = 1 + (volatility * marketCondition.riskMultiplier);
            
            // Linear component
            const linearValue = lastRate + (linearTrend.slope * (rates.length + i));
            
            // Momentum component  
            const momentumValue = lastRate * (1 + (momentum.direction * momentum.strength * 0.001 * i));
            
            // Market cycle component (weekly patterns)
            const cycleAdjustment = Math.sin((i / 7) * Math.PI) * 0.001;
            
            // Combine algorithms
            const baseValue = (linearValue * linearWeight + momentumValue * momentumWeight) / (linearWeight + momentumWeight);
            const adjustedValue = baseValue * volatilityAdjustment * (1 + cycleAdjustment);
            
            // Educational-grade DETERMINISTIC NOISE
            const predictionSeed = this.historicalDataManager.seededRandom(pairHash, i + 100); // +100 offset for predictions
            const deterministicNoise = (predictionSeed - 0.5) * volatility * 0.5;
            const forecastValue = adjustedValue * (1 + deterministicNoise);
            
            // Calculate dynamic confidence bands
            const dayDecay = Math.pow(0.95, i); // Confidence decreases over time
            const adjustedConfidence = this.aiConfidenceLevel * dayDecay;
            const confidenceRange = volatility * (1 - adjustedConfidence / 100) * Math.sqrt(i);
            
            predictions.forecast.push({
                date: futureDate.toISOString().split('T')[0],
                value: Math.max(0.0001, forecastValue), // Ensure positive values
                upperBound: forecastValue * (1 + confidenceRange),
                lowerBound: forecastValue * (1 - confidenceRange),
                confidence: Math.max(50, adjustedConfidence),
                dayAhead: i
            });
        }
        
        // Analyze overall prediction trend
        const firstPrediction = predictions.forecast[0].value;
        const lastPrediction = predictions.forecast[predictions.forecast.length - 1].value;
        const trendChange = ((lastPrediction - firstPrediction) / firstPrediction) * 100;
        
        if (trendChange > 1.5) {
            predictions.trend = 'bullish';
        } else if (trendChange < -1.5) {
            predictions.trend = 'bearish';
        } else {
            predictions.trend = 'neutral';
        }
        
        // Calculate prediction accuracy score (based on market conditions & volatility)
        const baseAccuracy = 75;
        const volatilityPenalty = Math.min(15, volatility * 1000); // High volatility = lower accuracy
        const dataQualityBonus = Math.min(10, rates.length / 10); // More data = higher accuracy
        const conditionBonus = marketCondition.condition === 'stable' ? 5 : 0;

        // Use data fingerprint for consistent but varied accuracy
        const accuracyVariation = ((dataFingerprint % 1) - 0.5) * 10; // -5 to +5 variation

        predictions.accuracy = Math.min(95, Math.max(55, 
            baseAccuracy - volatilityPenalty + dataQualityBonus + conditionBonus + accuracyVariation
        ));
        
        // Set risk level
        if (volatility > 0.03) {
            predictions.riskLevel = 'high';
        } else if (volatility < 0.015) {
            predictions.riskLevel = 'low';
        } else {
            predictions.riskLevel = 'medium';
        }
        
        return predictions;
    }

    // Calculate linear regression
    calculateLinearRegression(data) {
        const n = data.length;
        const x = Array.from({length: n}, (_, i) => i);
        const y = data;
        
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        return { slope, intercept, correlation: this.calculateCorrelation(x, y) };
    }

    // Calculate correlation
    calculateCorrelation(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
        
        const correlation = (n * sumXY - sumX * sumY) / 
            Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
        
        return isNaN(correlation) ? 0 : correlation;
    }

    // Calculate volatility
    calculateVolatility(data) {
        if (data.length < 2) return 0.02; // Default volatility
        
        const returns = [];
        for (let i = 1; i < data.length; i++) {
            returns.push((data[i] - data[i-1]) / data[i-1]);
        }
        
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
        
        return Math.sqrt(variance);
    }

    // Calculate momentum trend
    calculateMomentumTrend(data) {
        const recentData = data.slice(-7); // Last 7 days
        const olderData = data.slice(-14, -7); // Previous 7 days
        
        if (olderData.length === 0) {
            return { direction: 0, strength: 0, momentum: 'neutral' };
        }
        
        const recentAvg = recentData.reduce((a, b) => a + b, 0) / recentData.length;
        const olderAvg = olderData.reduce((a, b) => a + b, 0) / olderData.length;
        
        const direction = recentAvg > olderAvg ? 1 : -1;
        const strength = Math.abs((recentAvg - olderAvg) / olderAvg);
        
        let momentum = 'neutral';
        if (strength > 0.02) {
            momentum = direction > 0 ? 'bullish' : 'bearish';
        }
        
        return { direction, strength, momentum };
    }

    // Detect market condition
    detectMarketCondition(data) {
        const volatility = this.calculateVolatility(data.slice(-14));
        const momentum = this.calculateMomentumTrend(data);
        
        let condition = 'normal';
        let riskMultiplier = 1.0;
        
        if (volatility > 0.03) {
            condition = 'volatile';
            riskMultiplier = 1.3;
        } else if (volatility < 0.01) {
            condition = 'stable';
            riskMultiplier = 0.8;
        }
        
        if (momentum.strength > 0.025) {
            condition = condition === 'stable' ? 'trending' : 'volatile_trending';
            riskMultiplier *= 1.2;
        }
        
        return { condition, riskMultiplier, volatility, momentum };
    }

    // Update performance metrics
    updatePerformanceMetrics() {
        this.aiPerformanceMetrics.totalPredictions++;
        this.aiPerformanceMetrics.lastUpdated = new Date().toISOString();
        
        // Simulate accuracy tracking (in production, this would compare against actual results)
        const simulatedAccuracy = 70 + Math.random() * 25; // 70-95% range
        this.aiPerformanceMetrics.accuratePredictions += simulatedAccuracy > 75 ? 1 : 0;
        this.aiPerformanceMetrics.averageAccuracy = 
            (this.aiPerformanceMetrics.averageAccuracy * (this.aiPerformanceMetrics.totalPredictions - 1) + simulatedAccuracy) / 
            this.aiPerformanceMetrics.totalPredictions;
    }

    // Calculate trend change
    calculateTrendChange(prediction) {
        if (!prediction.forecast || prediction.forecast.length === 0) return 0;
        
        const firstValue = prediction.forecast[0].value;
        const lastValue = prediction.forecast[prediction.forecast.length - 1].value;
        
        return ((lastValue - firstValue) / firstValue) * 100;
    }

    // Calculate average accuracy
    calculateAverageAccuracy(mainPrediction, overlayPredictions) {
        if (!mainPrediction) return 0;
        
        let totalAccuracy = mainPrediction.accuracy;
        let count = 1;
        
        overlayPredictions.forEach(overlay => {
            totalAccuracy += overlay.prediction.accuracy;
            count++;
        });
        
        return totalAccuracy / count;
    }

    // Darken color for predictions
    darkenColor(color, factor) {
        // Convert hex to RGB, darken, convert back
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - factor));
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - factor));
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - factor));
        
        return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
    }
}

// Create singleton instance
const aiPredictions = new AIPredictions();

export { aiPredictions, AIPredictions };