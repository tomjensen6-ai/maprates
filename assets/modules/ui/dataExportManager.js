/**
 * DataExportManager Module
 * Professional data export and sharing functionality
 * Handles CSV, JSON, Excel exports and clipboard operations
 */

class DataExportManager {
    constructor() {
        this.exportFormats = {
            csv: { extension: 'csv', mimeType: 'text/csv' },
            json: { extension: 'json', mimeType: 'application/json' },
            excel: { extension: 'xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        };
        
        // Track export history for analytics
        this.exportHistory = [];
        this.maxHistorySize = 50;
        // Prevent multiple simultaneous share operations
        this.isSharing = false;
    }
    
    /**
     * Export chart data to specified format
     * @param {Object} data - Data to export
     * @param {string} format - Export format (csv, json, excel)
     * @param {string} filename - Optional filename
     */
    exportChartData(data, format = 'csv', filename = null) {
        try {
            if (!data || !data.labels || !data.datasets) {
                throw new Error('Invalid chart data structure');
            }
            
            const exportFilename = filename || this.generateFilename('chart', format);
            
            switch (format.toLowerCase()) {
                case 'csv':
                    return this.exportChartAsCSV(data, exportFilename);
                case 'json':
                    return this.exportChartAsJSON(data, exportFilename);
                case 'excel':
                    return this.exportChartAsExcel(data, exportFilename);
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }
        } catch (error) {
            console.error('Export error:', error);
            if (window.notificationManager) {
                window.notificationManager.showError(`Export failed: ${error.message}`);
            }
            return false;
        }
    }
    
    /**
     * Export chart data as CSV
     */
    exportChartAsCSV(data, filename) {
        const rows = [];
        
        // Header row
        const headers = ['Date'];
        data.datasets.forEach(dataset => {
            headers.push(dataset.label || 'Series');
        });
        rows.push(headers);
        
        // Data rows
        data.labels.forEach((label, index) => {
            const row = [label];
            data.datasets.forEach(dataset => {
                const value = dataset.data[index];
                row.push(value !== null && value !== undefined ? value : '');
            });
            rows.push(row);
        });
        
        // Convert to CSV string
        const csvContent = rows.map(row => 
            row.map(cell => {
                // Escape quotes and wrap in quotes if contains comma
                const cellStr = String(cell);
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return `"${cellStr.replace(/"/g, '""')}"`;
                }
                return cellStr;
            }).join(',')
        ).join('\n');
        
        return this.downloadFile(csvContent, filename, 'csv');
    }
    
    /**
     * Export chart data as JSON
     */
    exportChartAsJSON(data, filename) {
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                version: '1.0',
                source: 'MapRates Pro'
            },
            labels: data.labels,
            datasets: data.datasets.map(dataset => ({
                label: dataset.label,
                data: dataset.data,
                currency: dataset.currency || null,
                type: dataset.type || 'line'
            }))
        };
        
        const jsonContent = JSON.stringify(exportData, null, 2);
        return this.downloadFile(jsonContent, filename, 'json');
    }
    
    /**
     * Export chart data as Excel (using SheetJS if available)
     */
    exportChartAsExcel(data, filename) {
        // Check if SheetJS is available
        if (typeof XLSX === 'undefined') {
            // Fallback to CSV if Excel library not available
            console.warn('Excel export not available, falling back to CSV');
            if (window.notificationManager) {
                window.notificationManager.showWarning('Excel export unavailable, downloading as CSV instead');
            }
            return this.exportChartAsCSV(data, filename.replace('.xlsx', '.csv'));
        }
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // Prepare data for sheet
        const wsData = [];
        
        // Header row
        const headers = ['Date'];
        data.datasets.forEach(dataset => {
            headers.push(dataset.label || 'Series');
        });
        wsData.push(headers);
        
        // Data rows
        data.labels.forEach((label, index) => {
            const row = [label];
            data.datasets.forEach(dataset => {
                row.push(dataset.data[index] || '');
            });
            wsData.push(row);
        });
        
        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Exchange Rates');
        
        // Write file
        XLSX.writeFile(wb, filename);
        
        this.trackExport('excel', filename);
        return true;
    }
    
    /**
     * Export exchange rate data
     */
    exportExchangeRates(rates, format = 'csv', filename = null) {
        const exportFilename = filename || this.generateFilename('exchange-rates', format);
        
        if (format === 'csv') {
            const rows = [
                ['From Currency', 'To Currency', 'Rate', 'Date'],
                ...rates.map(rate => [
                    rate.fromCurrency,
                    rate.toCurrency,
                    rate.rate,
                    rate.date || new Date().toISOString()
                ])
            ];
            
            const csvContent = rows.map(row => row.join(',')).join('\n');
            return this.downloadFile(csvContent, exportFilename, 'csv');
        } else if (format === 'json') {
            const jsonContent = JSON.stringify(rates, null, 2);
            return this.downloadFile(jsonContent, exportFilename, 'json');
        }
    }
    
    /**
     * Export current conversions
     */
    exportConversions(conversions, homeCurrency, amount, format = 'csv') {
        const filename = this.generateFilename('conversions', format);
        
        if (format === 'csv') {
            const rows = [
                ['Currency Conversions'],
                [`Base: ${amount} ${homeCurrency.code}`],
                [`Date: ${new Date().toLocaleString()}`],
                [''],
                ['Country', 'Currency', 'Code', 'Rate', 'Amount']
            ];
            
            conversions.forEach(conv => {
                rows.push([
                    conv.country,
                    conv.currency.name,
                    conv.currency.code,
                    conv.rate.toFixed(6),
                    (amount * conv.rate).toFixed(2)
                ]);
            });
            
            const csvContent = rows.map(row => row.join(',')).join('\n');
            return this.downloadFile(csvContent, filename, 'csv');
        } else if (format === 'json') {
            const exportData = {
                base: {
                    amount: amount,
                    currency: homeCurrency.code
                },
                date: new Date().toISOString(),
                conversions: conversions
            };
            
            const jsonContent = JSON.stringify(exportData, null, 2);
            return this.downloadFile(jsonContent, filename, 'json');
        }
    }
    
    /**
     * Copy data to clipboard
     */
    async copyToClipboard(data, format = 'text') {
        try {
            let textToCopy = '';
            
            if (format === 'text') {
                textToCopy = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
            } else if (format === 'table') {
                // Format as table for pasting into Excel/Sheets
                if (Array.isArray(data)) {
                    textToCopy = data.map(row => 
                        Array.isArray(row) ? row.join('\t') : row
                    ).join('\n');
                }
            }
            
            await navigator.clipboard.writeText(textToCopy);
            
            if (window.notificationManager) {
                window.notificationManager.showSuccess('Copied to clipboard!', 2000);
            }
            return true;
        } catch (error) {
            console.error('Clipboard error:', error);
            if (window.notificationManager) {
                window.notificationManager.showError('Failed to copy to clipboard');
            }
            return false;
        }
    }
    
    /**
     * Share data using Web Share API
     */
    /**
 * Share data using Web Share API
 */
    async shareData(title, text, url = null) {
        // Prevent multiple simultaneous share operations
        if (this.isSharing) {
            console.log('Share already in progress, ignoring duplicate request');
            return false;
        }
        
        if (!navigator.share) {
            // Fallback to copying link
            const shareText = `${title}\n${text}${url ? '\n' + url : ''}`;
            return this.copyToClipboard(shareText);
        }
        
        try {
            // Set sharing flag
            this.isSharing = true;
            
            await navigator.share({
                title: title,
                text: text,
                url: url || window.location.href
            });
            
            this.trackExport('share', title);
            return true;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.warn('Share cancelled or failed:', error.message);
                // Fallback to copy
                return this.copyToClipboard(`${title}\n${text}`);
            }
            return false;
        } finally {
            // Always clear the sharing flag after a delay
            setTimeout(() => {
                this.isSharing = false;
            }, 500);
        }
    }
    
    /**
     * Generate filename with timestamp
     */
    generateFilename(prefix, format) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        return `${prefix}_${timestamp}.${this.exportFormats[format]?.extension || format}`;
    }
    
    /**
     * Download file to user's device
     */
    downloadFile(content, filename, format) {
        try {
            const blob = new Blob([content], { 
                type: this.exportFormats[format]?.mimeType || 'text/plain' 
            });
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            // Track export
            this.trackExport(format, filename);
            
            // Show success notification
            if (window.notificationManager) {
                window.notificationManager.showSuccess(`Exported as ${filename}`, 3000);
            }
            
            return true;
        } catch (error) {
            console.error('Download error:', error);
            if (window.notificationManager) {
                window.notificationManager.showError(`Download failed: ${error.message}`);
            }
            return false;
        }
    }
    
    /**
     * Track export for analytics
     */
    trackExport(format, filename) {
        const exportRecord = {
            format: format,
            filename: filename,
            timestamp: new Date().toISOString(),
            success: true
        };
        
        this.exportHistory.push(exportRecord);
        
        // Limit history size
        if (this.exportHistory.length > this.maxHistorySize) {
            this.exportHistory.shift();
        }
        
        // Log for analytics
        console.log('📊 Export tracked:', exportRecord);
    }
    
    /**
     * Get export statistics
     */
    getExportStats() {
        const stats = {
            total: this.exportHistory.length,
            byFormat: {},
            lastExport: this.exportHistory[this.exportHistory.length - 1] || null
        };
        
        this.exportHistory.forEach(record => {
            stats.byFormat[record.format] = (stats.byFormat[record.format] || 0) + 1;
        });
        
        return stats;
    }
    
    /**
     * Create export button for UI
     */
    createExportButton(container, data, options = {}) {
        const button = document.createElement('button');
        button.className = options.className || 'export-button';
        button.innerHTML = options.label || '📥 Export';
        button.style.cssText = options.style || `
            background: white;
            color: #5f6368;
            border: 1px solid #dadce0;
            border-radius: 8px;
            padding: 8px 16px;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
        `;
        
        // Add hover effect
        button.onmouseover = () => {
            button.style.background = '#f8f9fa';
            button.style.borderColor = '#1a73e8';
        };
        button.onmouseout = () => {
            button.style.background = 'white';
            button.style.borderColor = '#dadce0';
        };
        
        // Add click handler
        button.onclick = () => {
            this.showExportMenu(data, options);
        };
        
        if (container) {
            container.appendChild(button);
        }
        
        return button;
    }
    
    /**
     * Show export format menu
     */
    showExportMenu(data, options = {}) {
        // Create menu using ModalManager if available
        if (window.modalManager) {
            const menuContent = `
                <h3 style="margin: 0 0 16px 0; color: #1a73e8;">Export Data</h3>
                <p style="color: #5f6368; margin-bottom: 20px;">Choose export format:</p>
                
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button onclick="window.dataExportManager.exportChartData(${JSON.stringify(data).replace(/"/g, '&quot;')}, 'csv')" style="
                        background: white;
                        border: 1px solid #dadce0;
                        border-radius: 8px;
                        padding: 12px;
                        text-align: left;
                        cursor: pointer;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">
                        <strong>📄 CSV</strong><br>
                        <small style="color: #5f6368;">Compatible with Excel, Google Sheets</small>
                    </button>
                    
                    <button onclick="window.dataExportManager.exportChartData(${JSON.stringify(data).replace(/"/g, '&quot;')}, 'json')" style="
                        background: white;
                        border: 1px solid #dadce0;
                        border-radius: 8px;
                        padding: 12px;
                        text-align: left;
                        cursor: pointer;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">
                        <strong>📋 JSON</strong><br>
                        <small style="color: #5f6368;">For developers and API integration</small>
                    </button>
                    
                    <button onclick="window.dataExportManager.shareResults()" style="
                        background: white;
                        border: 1px solid #dadce0;
                        border-radius: 8px;
                        padding: 12px;
                        text-align: left;
                        cursor: pointer;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">
                        <strong>📤 Share</strong><br>
                        <small style="color: #5f6368;">Copy link or share via apps</small>
                    </button>
                </div>
                
                <div style="margin-top: 20px; text-align: center;">
                    <button onclick="window.modalManager.closeModal('exportMenu')" style="
                        background: #f8f9fa;
                        color: #5f6368;
                        border: 1px solid #dadce0;
                        border-radius: 8px;
                        padding: 8px 20px;
                        cursor: pointer;
                    ">Cancel</button>
                </div>
            `;
            
            window.modalManager.showModal('exportMenu', menuContent, {
                maxWidth: '360px'
            });
        } else {
            // Fallback to simple format selection
            const format = prompt('Export format (csv/json):', 'csv');
            if (format) {
                this.exportChartData(data, format);
            }
        }
    }
    
    /**
     * Share results helper
     */
    async shareResults() {
        const title = 'MapRates Pro - Currency Exchange Rates';
        const text = 'Check out my currency exchange analysis!';
        await this.shareData(title, text);
        
        if (window.modalManager) {
            window.modalManager.closeModal('exportMenu');
        }
    }
}

// Create singleton instance
const dataExportManager = new DataExportManager();

// Make globally available
window.dataExportManager = dataExportManager;

export default dataExportManager;