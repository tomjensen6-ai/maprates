/**
 * ModalManager Module
 * Centralized modal, popup, and overlay panel management
 * Handles all modal interactions and states
 */

class ModalManager {
    constructor() {
        this.activeModals = new Map();
        this.modalStack = [];
        this.zIndex = 10000;
        this.escapeKeyListener = null;
        
        // Initialize escape key handling
        this.initEscapeKey();
        
        // Modal templates - just store method names
        this.modalTemplates = {
            premium: 'getPremiumModalTemplate',
            currencySelector: 'getCurrencySelectorTemplate',
            overlayPanel: 'getOverlayPanelTemplate',
            apiConfig: 'getAPIConfigTemplate'
        };
    }
// ********** DEBUG what methods exist ******************
debugMethods() {
    console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this)));
    console.log('getCurrencySelectorTemplate exists?', typeof this.getCurrencySelectorTemplate);
    console.log('getPremiumModalTemplate exists?', typeof this.getPremiumModalTemplate);
}
        
    initEscapeKey() {
        this.escapeKeyListener = (e) => {
            if (e.key === 'Escape' && this.modalStack.length > 0) {
                const topModal = this.modalStack[this.modalStack.length - 1];
                this.closeModal(topModal);
            }
        };
        document.addEventListener('keydown', this.escapeKeyListener);
    }
    
    /**
     * Create and show a modal
     * @param {string} id - Unique identifier for the modal
     * @param {string} content - HTML content or template name
     * @param {Object} options - Modal options
     * @returns {HTMLElement} - The modal element
     */
    showModal(id, content, options = {}) {
        // Close existing modal with same ID
        if (this.activeModals.has(id)) {
            this.closeModal(id);
        }
        
        const modalConfig = {
            closable: options.closable !== false,
            closeOnBackdrop: options.closeOnBackdrop !== false,
            closeOnEscape: options.closeOnEscape !== false,
            width: options.width || 'auto',
            maxWidth: options.maxWidth || '500px',
            className: options.className || '',
            onClose: options.onClose || null,
            animate: options.animate !== false
        };
        
        // Create modal container
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = `modal-container ${modalConfig.className}`;
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
            z-index: ${this.zIndex + this.modalStack.length};
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        // Create modal content wrapper
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: ${modalConfig.maxWidth};
            width: ${modalConfig.width};
            max-height: 80vh;
            overflow-y: auto;
            margin: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            transform: scale(0.9);
            transition: transform 0.3s ease;
        `;
        
        // Check if content is a template name
        if (this.modalTemplates[content]) {
            const methodName = this.modalTemplates[content];
            modalContent.innerHTML = this[methodName](options.data || {});
        } else {
            modalContent.innerHTML = content;
        }
        
        // Add close button if closable
        if (modalConfig.closable) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'modal-close';
            closeBtn.style.cssText = `
                position: absolute;
                top: 12px;
                right: 12px;
                background: transparent;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #5f6368;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.2s;
            `;
            closeBtn.innerHTML = '✕';
            closeBtn.onmouseover = () => closeBtn.style.background = '#f1f3f4';
            closeBtn.onmouseout = () => closeBtn.style.background = 'transparent';
            closeBtn.onclick = () => this.closeModal(id);
            modalContent.style.position = 'relative';
            modalContent.appendChild(closeBtn);
        }
        
        // Add backdrop click handler
        if (modalConfig.closeOnBackdrop) {
            modal.onclick = (e) => {
                if (e.target === modal) {
                    this.closeModal(id);
                }
            };
        }
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Store modal reference
        this.activeModals.set(id, { element: modal, config: modalConfig });
        this.modalStack.push(id);
        
        // Animate in
        if (modalConfig.animate) {
            requestAnimationFrame(() => {
                modal.style.opacity = '1';
                modalContent.style.transform = 'scale(1)';
            });
        } else {
            modal.style.opacity = '1';
            modalContent.style.transform = 'scale(1)';
        }
        
        // Prevent body scroll
        if (this.modalStack.length === 1) {
            document.body.style.overflow = 'hidden';
        }
                
        return modal;
    }
    
    closeModal(id) {
        const modalData = this.activeModals.get(id);
        if (!modalData) return;
        
        const { element: modal, config } = modalData;
        
        // Animate out
        if (config.animate) {
            modal.style.opacity = '0';
            modal.querySelector('.modal-content').style.transform = 'scale(0.9)';
            
            setTimeout(() => {
                this.removeModal(id);
            }, 300);
        } else {
            this.removeModal(id);
        }
        
        // Call onClose callback if provided
        if (config.onClose) {
            config.onClose();
        }
    }
    
    removeModal(id) {
        const modalData = this.activeModals.get(id);
        if (!modalData) return;
        
        modalData.element.remove();
        this.activeModals.delete(id);
        
        // Remove ALL occurrences from stack (in case of duplicates)
        this.modalStack = this.modalStack.filter(modalId => modalId !== id);
        
        // Restore body scroll if no modals
        if (this.modalStack.length === 0) {
            document.body.style.overflow = '';
        }
    }
    
    closeAllModals() {
        [...this.modalStack].forEach(id => this.closeModal(id));
    }
    
    // Premium Modal Template
    getPremiumModalTemplate(data) {
        const feature = data.feature || 'This feature';
        return `
            <div style="text-align: center;">
                <div style="font-size: 4rem; margin-bottom: 20px;">⭐</div>
                <h2 style="margin: 0 0 16px 0; color: #1a73e8; font-size: 1.5rem;">
                    Unlock Premium Features
                </h2>
                <p style="color: #5f6368; margin-bottom: 24px; font-size: 1rem; line-height: 1.5;">
                    <strong>${feature}</strong> requires a Premium subscription.<br>
                    Get instant access to all professional tools and features!
                </p>
                
                <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0;">
                    <h3 style="margin: 0 0 16px 0; color: #202124; font-size: 1.1rem;">
                        ✨ What You'll Get:
                    </h3>
                    <ul style="text-align: left; color: #5f6368; margin: 0; padding-left: 20px; list-style: none;">
                        <li style="margin: 8px 0; display: flex; align-items: center;">
                            <span style="color: #34a853; margin-right: 8px;">✓</span>
                            Track unlimited destinations simultaneously
                        </li>
                        <li style="margin: 8px 0; display: flex; align-items: center;">
                            <span style="color: #34a853; margin-right: 8px;">✓</span>
                            Real-time & historical exchange rate charts
                        </li>
                        <li style="margin: 8px 0; display: flex; align-items: center;">
                            <span style="color: #34a853; margin-right: 8px;">✓</span>
                            Professional indicators (SMA, RSI, Bollinger Bands)
                        </li>
                        <li style="margin: 8px 0; display: flex; align-items: center;">
                            <span style="color: #34a853; margin-right: 8px;">✓</span>
                            Mathematical trend analysis & projections
                        </li>
                        <li style="margin: 8px 0; display: flex; align-items: center;">
                            <span style="color: #34a853; margin-right: 8px;">✓</span>
                            Compare multiple currencies on one chart
                        </li>
                        <li style="margin: 8px 0; display: flex; align-items: center;">
                            <span style="color: #34a853; margin-right: 8px;">✓</span>
                            Export data to CSV/Excel
                        </li>
                        <li style="margin: 8px 0; display: flex; align-items: center;">
                            <span style="color: #34a853; margin-right: 8px;">✓</span>
                            Priority customer support
                        </li>
                    </ul>
                </div>
                
                <div style="
                    background: #e8f5e9;
                    border: 1px solid #34a853;
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 20px;
                    font-size: 0.875rem;
                    color: #1b5e20;
                ">
                    🎉 <strong>Limited Time:</strong> Get 50% off your first month!
                </div>
                
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button onclick="window.modalManager.closeModal('premiumModal')" style="
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
                    <button onclick="window.modalManager.upgradeToPremium()" style="
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
                        🚀 Upgrade Now - 50% OFF
                    </button>
                </div>
            </div>
        `;
    }
    
    // Currency Selector Template
    getCurrencySelectorTemplate(data) {
        // Get all available currencies directly from CURRENCY_SYMBOLS
        const allCurrencies = window.CURRENCY_SYMBOLS || {};
        
        // Get active overlays to disable them
        const activeOverlays = window.overlayManager?.getActiveOverlays() || [];
        const activeCurrencyCodes = activeOverlays.map(o => o.currency);
        
        // Define currency groupings - COMPLETE with all currencies properly assigned
        const currencyGroups = {
            'Most Popular': {
                icon: '⭐',
                codes: ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'INR']
            },
            'Americas': {
                icon: '🌎',
                codes: ['BRL', 'MXN', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'PYG', 'BOB', 'VES', 'GTQ', 'CRC', 'PAB', 'DOP', 'CUP', 'JMD', 'TTD', 'BBD', 'BSD', 'BZD', 'HTG', 'SRD', 'GYD', 'HNL', 'NIO', 'XCD']
            },
            'Europe': {
                icon: '🇪🇺',
                codes: ['EUR', 'GBP', 'CHF', 'NOK', 'SEK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'ISK', 'RUB', 'TRY', 'UAH', 'GEL', 'AMD', 'AZN', 'BAM', 'MKD', 'RSD', 'ALL', 'MDL', 'BYN']
            },
            'Asia-Pacific': {
                icon: '🏯',
                codes: ['JPY', 'CNY', 'INR', 'SGD', 'HKD', 'KRW', 'TWD', 'THB', 'MYR', 'IDR', 'PHP', 'VND', 'PKR', 'BDT', 'LKR', 'NPR', 'MMK', 'KHR', 'LAK', 'MNT', 'KZT', 'UZS', 'KGS', 'TJS', 'TMT', 'AFN', 'FJD', 'PGK', 'NZD', 'BND', 'MVR', 'BTN', 'WST', 'VUV', 'SBD', 'TOP', 'KPW']
            },
            'Middle East': {
                icon: '🕌',
                codes: ['AED', 'SAR', 'ILS', 'JOD', 'LBP', 'SYP', 'IQD', 'KWD', 'BHD', 'QAR', 'OMR', 'YER', 'IRR']
            },
            'Africa': {
                icon: '🌍',
                codes: ['ZAR', 'NGN', 'EGP', 'KES', 'MAD', 'ETB', 'GHS', 'TZS', 'UGX', 'DZD', 'SDG', 'SSP', 'TND', 'LYD', 'SLL', 'ZMW', 'ZWL', 'RWF', 'SOS', 'DJF', 'ERN', 'GMD', 'GNF', 'LRD', 'MRU', 'BWP', 'NAD', 'SZL', 'LSL', 'MUR', 'SCR', 'AOA', 'MZN', 'MGA', 'XOF', 'XAF', 'CVE', 'KMF', 'CDF', 'BIF', 'MWK']
            }
        };
        
        // Build dropdown options
        let optionsHTML = '<option value="">Select currency to add...</option>';
        
        Object.entries(currencyGroups).forEach(([groupName, groupData]) => {
            // Filter to only include currencies that exist in CURRENCY_SYMBOLS
            const availableCurrencies = groupData.codes.filter(code => allCurrencies[code]);
            
            if (availableCurrencies.length === 0) return; // Skip empty groups
            
            optionsHTML += `<optgroup label="${groupData.icon} ${groupName}">`;
            
            // Sort alphabetically and create options
            availableCurrencies.sort().forEach(code => {
                const currencyData = allCurrencies[code];
                const isActive = activeCurrencyCodes.includes(code);
                const isDisabled = isActive ? 'disabled' : '';
                const activeText = isActive ? ' (Active)' : '';
                
                optionsHTML += `
                    <option value="${code}" ${isDisabled}>
                        ${currencyData.symbol} ${code} - ${currencyData.name}${activeText}
                    </option>
                `;
            });
            
            optionsHTML += '</optgroup>';
        });
        
        // Move search functionality to a separate function to avoid inline quote issues
        return `
            <h3 style="margin: 0 0 16px 0; color: #1a73e8;">Add Currency Overlay</h3>
            
            <!-- Search input with helper text -->
            <input type="text" id="overlaySearchInput" placeholder="🔍 Search currencies..." style="
                width: 100%;
                padding: 10px 12px;
                border: 2px solid #dadce0;
                border-radius: 8px;
                margin-bottom: 4px;
                font-size: 14px;
            " oninput="window.filterOverlayCurrencies(this.value)">
            
            <!-- Search helper text -->
            <div id="searchHelper" style="
                display: none;
                font-size: 0.75rem;
                color: #34a853;
                margin-bottom: 8px;
                padding-left: 2px;
            "></div>
            
            <select id="overlayCurrency" style="
                width: 100%;
                padding: 12px;
                border: 2px solid #dadce0;
                border-radius: 8px;
                margin-bottom: 20px;
                font-size: 16px;
                max-height: 300px;
                overflow-y: auto;
            ">
                ${optionsHTML}
            </select>
            
            <!-- Active overlay indicator -->
            <div style="
                background: #f8f9fa;
                border: 1px solid #dadce0;
                border-radius: 6px;
                padding: 8px 12px;
                margin-bottom: 16px;
                font-size: 0.875rem;
                color: #5f6368;
            ">
                📊 Active Overlays: ${activeOverlays.filter(o => o.visible).length}/3
            </div>
            
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button onclick="window.confirmAddOverlay()" style="
                    background: #1a73e8;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    padding: 12px 20px;
                    cursor: pointer;
                    font-weight: 600;
                ">Add Overlay</button>
                <button onclick="window.modalManager.closeModal('currencySelector')" style="
                    background: #f8f9fa;
                    color: #5f6368;
                    border: 1px solid #dadce0;
                    border-radius: 8px;
                    padding: 12px 20px;
                    cursor: pointer;
                ">Cancel</button>
            </div>
        `;
    }

    // Overlay Management Panel Template
    getOverlayPanelTemplate(data) {
        return `
            <h3 style="margin: 0 0 16px 0; color: #1a73e8;">🎯 Manage Chart Overlays</h3>
            <p style="margin-bottom: 20px; color: #5f6368; font-size: 0.875rem;">
                Toggle overlays on/off. Maximum 3 active for optimal performance.
            </p>
            
            <div style="margin-bottom: 20px;">
                <h4 style="margin-bottom: 12px; font-size: 0.875rem; color: #1a73e8;">From Your Selected Destinations:</h4>
                <div id="destinationOverlayList"></div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="margin-bottom: 12px; font-size: 0.875rem; color: #1a73e8;">Other Overlays:</h4>
                <div id="otherOverlayList"></div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <button onclick="window.showCurrencySelector()" style="
                    background: #1a73e8;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 8px 16px;
                    cursor: pointer;
                    font-weight: 500;
                    font-size: 0.875rem;
                ">+ Add New Overlay</button>
            </div>
            
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button onclick="window.modalManager.closeModal('overlayPanel')" style="
                    background: #f8f9fa;
                    color: #5f6368;
                    border: 1px solid #dadce0;
                    border-radius: 8px;
                    padding: 12px 20px;
                    cursor: pointer;
                    font-weight: 500;
                ">Done</button>
            </div>
        `;
    }
    
    // API Configuration Template
    getAPIConfigTemplate(data) {
        return `
            <div id="apiConfigContent">
                <!-- This will be populated by the existing API config logic -->
            </div>
        `;
    }
    
    // Specific modal methods for backward compatibility
    showPremiumModal(feature) {
        return this.showModal('premiumModal', 'premium', {
            data: { feature },
            maxWidth: '480px'
        });
    }
    
    showCurrencySelector() {
        return this.showModal('currencySelector', 'currencySelector', {
            maxWidth: '400px'
        });
    }
    
    showOverlayPanel() {
        const modal = this.showModal('overlayPanel', 'overlayPanel', {
            maxWidth: '500px'
        });
        
        // Populate the lists after modal is created
        setTimeout(() => {
            if (window.populateOverlayLists) {
                window.populateOverlayLists();
            }
        }, 100);
        
        return modal;
    }
    
    // Premium upgrade handler
    upgradeToPremium() {
        if (window.premiumFeaturesManager) {
            window.premiumFeaturesManager.upgradeToPremium();
        }
        this.closeModal('premiumModal');
        
        // Show success notification
        if (window.notificationManager) {
            window.notificationManager.showSuccess('🎉 Premium features unlocked!', 3000);
        }
    }
    
    // Check if a modal is open
    isModalOpen(id) {
        return this.activeModals.has(id);
    }
    
    // Get active modal count
    getActiveModalCount() {
        return this.modalStack.length;
    }
}

// Filter function for overlay currency search
window.filterOverlayCurrencies = function(searchTerm) {
    const search = searchTerm.toLowerCase();
    const select = document.getElementById('overlayCurrency');
    const helper = document.getElementById('searchHelper');
    
    if (!select) return;
    
    const optgroups = select.querySelectorAll('optgroup');
    let totalMatches = 0;
    
    optgroups.forEach(group => {
        let hasVisible = false;
        group.querySelectorAll('option').forEach(opt => {
            const match = opt.textContent.toLowerCase().includes(search) || opt.value.toLowerCase().includes(search);
            opt.style.display = match ? '' : 'none';
            if (match && opt.value) {
                hasVisible = true;
                totalMatches++;
            }
        });
        group.style.display = hasVisible ? '' : 'none';
    });
    
    // Update helper text
    if (helper) {
        if (search) {
            helper.style.display = 'block';
            helper.textContent = totalMatches > 0 
                ? `✓ Found ${totalMatches} currencies - click dropdown to select` 
                : '✗ No currencies found';
            helper.style.color = totalMatches > 0 ? '#34a853' : '#ea4335';
        } else {
            helper.style.display = 'none';
        }
    }
    
    // Show/hide default option
    const defaultOpt = select.querySelector('option[value=""]');
    if (defaultOpt) {
        defaultOpt.style.display = search ? 'none' : '';
    }
};

// Create singleton instance
const modalManager = new ModalManager();

// Make globally available
window.modalManager = modalManager;

export default modalManager;