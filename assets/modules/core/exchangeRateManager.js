// Exchange Rate Manager Module
// Handles all exchange rate fetching, calculations, and conversions

export class ExchangeRateManager {
    constructor() {
        this.currentExchangeRates = null;
        this.currentExchangeRate = null;
        this.apiEndpoint = 'https://api.exchangerate-api.com/v4/latest/';
    }

    async fetchExchangeRates(homeCurrency) {
        if (!homeCurrency || !homeCurrency.code) {
            throw new Error('Valid home currency required');
        }

        try {
            console.log(`Fetching exchange rates for ${homeCurrency.code}...`);
            
            const response = await fetch(`${this.apiEndpoint}${homeCurrency.code}`);
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.error || !data.rates) {
                console.error('❌ API problem:', data);
                throw new Error(`API Error: ${data.error || 'No rates in response'}`);
            }

            this.currentExchangeRates = data.rates;
            
            // Also update window global for compatibility
            window.currentExchangeRates = data.rates;
            
            console.log('✅ Exchange rates loaded:', Object.keys(data.rates).length, 'currencies');
            
            return data.rates;
            
        } catch (error) {
            console.error('Exchange rate fetch error:', error);
            throw error;
        }
    }

    calculateConversions(destinationCountries, homeCurrency, getCurrencyForCountry) {
        const conversions = [];
        
        if (!this.currentExchangeRates) {
            console.warn('No exchange rates available');
            return conversions;
        }

        destinationCountries.forEach(dest => {
            const destCurrency = getCurrencyForCountry(dest.name);
            if (destCurrency) {
                let rate;
                
                if (homeCurrency.code === destCurrency.code) {
                    rate = 1; // Same currency
                } else {
                    rate = this.currentExchangeRates[destCurrency.code];
                    
                    if (!rate) {
                        console.warn(`⚠️ No rate found for ${destCurrency.code}`);
                    }
                }
                
                if (rate && !isNaN(rate)) {
                    conversions.push({
                        country: dest.name,
                        currency: destCurrency,
                        rate: rate
                    });
                } else {
                    console.error(`❌ Invalid rate for ${dest.name} (${destCurrency.code}):`, rate);
                }
            }
        });
        
        return conversions;
    }

    convertAmount(amount, rate) {
        return (amount * rate).toFixed(2);
    }

    setCurrentRate(rate) {
        this.currentExchangeRate = rate;
        window.currentExchangeRate = rate; // Keep window global in sync
    }

    getCurrentRates() {
        return this.currentExchangeRates;
    }

    getCurrentRate() {
        return this.currentExchangeRate;
    }
}

// Create singleton instance
export const exchangeRateManager = new ExchangeRateManager();