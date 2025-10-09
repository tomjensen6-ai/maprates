/**
 * Update Scheduler - Manages automatic updates for global team data
 */

export class GlobalDataUpdateScheduler {
    constructor(globalDataManager) {
        this.dataManager = globalDataManager;
        this.isRunning = false;
        this.updateQueue = [];
        this.config = {
            updateIntervals: {
                priority1: 24 * 60 * 60 * 1000,      // 1 day for major countries
                priority2: 7 * 24 * 60 * 60 * 1000,  // 1 week for medium countries
                priority3: 30 * 24 * 60 * 60 * 1000  // 1 month for small countries
            },
            batchSize: 5,                             // Process 5 countries at once
            batchDelay: 10000,                        // 10 seconds between batches
            maxRetries: 3
        };
        
        this.priorityCountries = this.definePriorityGroups();
        this.lastUpdateTimes = new Map();
        this.retryCount = new Map();
    }

    /**
     * Define country priority groups
     */
    definePriorityGroups() {
        return {
            priority1: [
                // Major football nations - update daily
                'BR', 'AR', 'DE', 'ES', 'IT', 'FR', 'GB', 'NL', 'PT', 'BE',
                'US', 'MX', 'NG', 'GH', 'EG', 'MA', 'ZA', 'JP', 'KR', 'AU',
                'RU', 'TR', 'PL', 'UA', 'CR', 'CO', 'CL', 'PE', 'UY', 'EC'
            ],
            priority2: [
                // Active football countries - update weekly
                'CA', 'JM', 'GT', 'HN', 'SV', 'PA', 'NI', 'CU', 'HT', 'DO',
                'TT', 'BB', 'GD', 'LC', 'VC', 'KN', 'AG', 'DM', 'BS', 'GY',
                'SR', 'BO', 'PY', 'VE', 'NO', 'SE', 'DK', 'FI', 'IS', 'IE',
                'CH', 'AT', 'CZ', 'SK', 'SI', 'HR', 'BA', 'RS', 'ME', 'MK',
                'AL', 'BG', 'RO', 'MD', 'BY', 'LT', 'LV', 'EE', 'GE', 'AM',
                'AZ', 'KZ', 'UZ', 'TJ', 'KG', 'TM', 'AF', 'PK', 'BD', 'LK',
                'MM', 'TH', 'VN', 'LA', 'KH', 'MY', 'SG', 'ID', 'PH', 'BN',
                'CN', 'HK', 'MO', 'TW', 'MN', 'KP', 'TN', 'DZ', 'LY', 'SD',
                'ET', 'KE', 'UG', 'TZ', 'RW', 'BI', 'DJ', 'SO', 'ER', 'SS',
                'CF', 'TD', 'CM', 'GQ', 'GA', 'CG', 'CD', 'AO', 'ZM', 'ZW',
                'BW', 'NA', 'SZ', 'LS', 'MW', 'MZ', 'MG', 'MU', 'SC', 'KM',
                'CV', 'ST', 'GW', 'GN', 'SL', 'LR', 'CI', 'GH', 'TG', 'BJ',
                'BF', 'NE', 'ML', 'SN', 'GM', 'MR', 'SA', 'AE', 'QA', 'OM',
                'YE', 'JO', 'SY', 'LB', 'IQ', 'IR', 'IL', 'PS', 'TR', 'CY'
            ],
            priority3: [
                // All remaining FIFA countries - update monthly
                'AD', 'SM', 'VA', 'LI', 'MC', 'MT', 'CY', 'LU', 'GI', 'IM',
                'JE', 'GG', 'FO', 'GL', 'SJ', 'AX', 'VI', 'PR', 'GU', 'AS',
                'MP', 'UM', 'FM', 'MH', 'PW', 'NR', 'TV', 'KI', 'TO', 'WS',
                'VU', 'FJ', 'SB', 'NC', 'PF', 'WF', 'NU', 'CK', 'PN', 'TK',
                'NF', 'CX', 'CC', 'HM', 'AQ', 'GS', 'BV', 'SH', 'TA', 'AC',
                'FK', 'IO', 'TF', 'EH', 'RE', 'YT', 'PM', 'BL', 'MF', 'GP',
                'MQ', 'GF', 'AW', 'CW', 'SX', 'BQ', 'AI', 'MS', 'KY', 'TC',
                'VG', 'BM', 'MV', 'NP', 'BT', 'LV', 'EE'
            ]
        };
    }

    /**
     * Start the automatic update system
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️ Update scheduler already running');
            return;
        }

        this.isRunning = true;
        console.log('🚀 Starting global data update scheduler');

        // Initial update for priority 1 countries
        this.scheduleImmediateUpdates();

        // Set up recurring updates
        this.setupRecurringUpdates();

        // Start the update processor
        this.processUpdateQueue();
    }

    /**
     * Stop the update scheduler
     */
    stop() {
        this.isRunning = false;
        this.updateQueue = [];
        console.log('🛑 Global data update scheduler stopped');
    }

    /**
     * Schedule immediate updates for stale data
     */
    scheduleImmediateUpdates() {
        const now = Date.now();
        
        // Check all priority groups for stale data
        Object.entries(this.priorityCountries).forEach(([priority, countries]) => {
            const maxAge = this.config.updateIntervals[priority];
            
            countries.forEach(countryCode => {
                const lastUpdate = this.lastUpdateTimes.get(countryCode) || 0;
                const age = now - lastUpdate;
                
                if (age > maxAge) {
                    this.addToQueue(countryCode, priority, 'stale_data');
                }
            });
        });

        console.log(`📋 Scheduled ${this.updateQueue.length} countries for immediate update`);
    }

    /**
     * Setup recurring update intervals
     */
    setupRecurringUpdates() {
        // Priority 1: Daily updates
        setInterval(() => {
            this.priorityCountries.priority1.forEach(countryCode => {
                this.addToQueue(countryCode, 'priority1', 'scheduled_daily');
            });
        }, this.config.updateIntervals.priority1);

        // Priority 2: Weekly updates  
        setInterval(() => {
            this.priorityCountries.priority2.forEach(countryCode => {
                this.addToQueue(countryCode, 'priority2', 'scheduled_weekly');
            });
        }, this.config.updateIntervals.priority2);

        // Priority 3: Monthly updates
        setInterval(() => {
            this.priorityCountries.priority3.forEach(countryCode => {
                this.addToQueue(countryCode, 'priority3', 'scheduled_monthly');
            });
        }, this.config.updateIntervals.priority3);

        console.log('⏰ Recurring update intervals configured');
    }

    /**
     * Add country to update queue
     */
    addToQueue(countryCode, priority, reason) {
        // Avoid duplicates
        if (this.updateQueue.find(item => item.countryCode === countryCode)) {
            return;
        }

        this.updateQueue.push({
            countryCode,
            priority,
            reason,
            addedAt: Date.now(),
            retryCount: this.retryCount.get(countryCode) || 0
        });

        // Sort queue by priority
        this.updateQueue.sort((a, b) => {
            const priorityOrder = { priority1: 3, priority2: 2, priority3: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    /**
     * Process the update queue
     */
    async processUpdateQueue() {
        while (this.isRunning) {
            if (this.updateQueue.length === 0) {
                // Wait before checking queue again
                await this.sleep(60000); // 1 minute
                continue;
            }

            // Process batch
            const batch = this.updateQueue.splice(0, this.config.batchSize);
            console.log(`🔄 Processing batch of ${batch.length} countries: ${batch.map(b => b.countryCode).join(', ')}`);

            // Process batch in parallel
            const results = await Promise.allSettled(
                batch.map(item => this.updateCountry(item))
            );

            // Handle results
            results.forEach((result, index) => {
                const item = batch[index];
                
                if (result.status === 'fulfilled') {
                    console.log(`✅ Updated ${item.countryCode} (${item.reason})`);
                    this.lastUpdateTimes.set(item.countryCode, Date.now());
                    this.retryCount.delete(item.countryCode);
                } else {
                    console.error(`❌ Failed to update ${item.countryCode}:`, result.reason);
                    
                    // Retry logic
                    const retries = this.retryCount.get(item.countryCode) || 0;
                    if (retries < this.config.maxRetries) {
                        this.retryCount.set(item.countryCode, retries + 1);
                        // Re-add to queue with delay
                        setTimeout(() => {
                            this.addToQueue(item.countryCode, item.priority, 'retry');
                        }, 300000); // 5 minutes
                    } else {
                        console.error(`❌ Max retries exceeded for ${item.countryCode}`);
                    }
                }
            });

            // Wait between batches to avoid overwhelming APIs
            await this.sleep(this.config.batchDelay);
        }
    }

    /**
     * Update a single country
     */
    async updateCountry(item) {
        try {
            const startTime = Date.now();
            
            console.log(`🔄 Updating ${item.countryCode}...`);
            
            // Get updated data using the main method
            const teamData = await this.dataManager.getCountryTeams(item.countryCode);
            
            // More detailed validation
            if (!teamData) {
                console.warn(`⚠️ No data object returned for ${item.countryCode}`);
                throw new Error(`No data object returned for ${item.countryCode}`);
            }
            
            if (!teamData.hasOwnProperty('teams')) {
                console.warn(`⚠️ Data missing 'teams' property for ${item.countryCode}:`, teamData);
                throw new Error(`Data missing 'teams' property for ${item.countryCode}`);
            }
            
            if (!Array.isArray(teamData.teams)) {
                console.warn(`⚠️ 'teams' is not an array for ${item.countryCode}:`, teamData.teams);
                throw new Error(`'teams' is not an array for ${item.countryCode}`);
            }
            
            if (teamData.teams.length === 0) {
                console.warn(`⚠️ Empty teams array for ${item.countryCode}`);
                
                // For premium countries (GB, DE, etc.), this might be expected if using footballDataManager
                const isPremiumCountry = this.dataManager.footballDataCountries.includes(item.countryCode);
                if (isPremiumCountry) {
                    console.log(`ℹ️ ${item.countryCode} is premium country - may have different data structure`);
                    // Still consider it successful, just log it
                    const duration = Date.now() - startTime;
                    console.log(`✅ Updated premium country ${item.countryCode} in ${duration}ms (premium data structure)`);
                    return { isPremium: true, country: item.countryCode };
                } else {
                    throw new Error(`No team data returned for ${item.countryCode}`);
                }
            }

            const duration = Date.now() - startTime;
            console.log(`⚡ Updated ${item.countryCode} in ${duration}ms (${teamData.teams.length} teams)`);

            // Update statistics
            this.updateStats(item.countryCode, teamData.teams.length, duration);

            return teamData;

        } catch (error) {
            console.error(`❌ Error updating ${item.countryCode}:`, error);
            
            // Log the actual data we got for debugging
            try {
                const debugData = await this.dataManager.getCountryTeams(item.countryCode);
                console.log(`🔍 Debug data for ${item.countryCode}:`, debugData);
            } catch (debugError) {
                console.log(`🔍 Debug fetch failed for ${item.countryCode}:`, debugError.message);
            }
            
            throw error;
        }
    }

    /**
     * Update statistics
     */
    updateStats(countryCode, teamCount, duration) {
        if (!this.stats) {
            this.stats = {
                totalUpdates: 0,
                totalTeams: 0,
                totalDuration: 0,
                countriesUpdated: new Set(),
                averageDuration: 0,
                averageTeamsPerCountry: 0
            };
        }

        this.stats.totalUpdates++;
        this.stats.totalTeams += teamCount;
        this.stats.totalDuration += duration;
        this.stats.countriesUpdated.add(countryCode);
        this.stats.averageDuration = Math.round(this.stats.totalDuration / this.stats.totalUpdates);
        this.stats.averageTeamsPerCountry = Math.round(this.stats.totalTeams / this.stats.totalUpdates);
    }

    /**
     * Get update statistics
     */
    getStats() {
        return {
            isRunning: this.isRunning,
            queueLength: this.updateQueue.length,
            lastUpdateTimes: Object.fromEntries(this.lastUpdateTimes),
            retryCount: Object.fromEntries(this.retryCount),
            stats: this.stats || null,
            config: this.config
        };
    }

    /**
     * Force update specific countries
     */
    forceUpdate(countryCodes, reason = 'manual') {
        if (!Array.isArray(countryCodes)) {
            countryCodes = [countryCodes];
        }

        countryCodes.forEach(countryCode => {
            // Determine priority
            let priority = 'priority3';
            if (this.priorityCountries.priority1.includes(countryCode)) {
                priority = 'priority1';
            } else if (this.priorityCountries.priority2.includes(countryCode)) {
                priority = 'priority2';
            }

            this.addToQueue(countryCode, priority, reason);
        });

        console.log(`🚀 Force update queued for: ${countryCodes.join(', ')}`);
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Pause updates temporarily
     */
    pause(duration = 60000) {
        const wasRunning = this.isRunning;
        this.isRunning = false;
        
        setTimeout(() => {
            this.isRunning = wasRunning;
            console.log('▶️ Update scheduler resumed');
        }, duration);
        
        console.log(`⏸️ Update scheduler paused for ${Math.round(duration / 1000)}s`);
    }

    /**
     * Clear update queue
     */
    clearQueue() {
        const cleared = this.updateQueue.length;
        this.updateQueue = [];
        console.log(`🗑️ Cleared ${cleared} items from update queue`);
    }
}