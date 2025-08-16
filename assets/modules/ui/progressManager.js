// ProgressManager - Handles progress bars and loading states
class ProgressManager {
    constructor() {
        this.activeProgressBars = new Map();
        this.progressCounter = 0;
    }

    createProgressBar(containerId, message = 'Loading...') {
        const progressId = `progress-${++this.progressCounter}`;
        
        // Remove any existing progress bar in this container
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container ${containerId} not found`);
            return progressId;
        }
        
        // Remove existing progress bars in this container
        const existingProgress = container.querySelector('.progress-container');
        if (existingProgress) {
            existingProgress.remove();
        }
        
        // Create progress bar HTML
        const progressHTML = `
            <div class="progress-container" id="${progressId}" style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
                color: white;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            ">
                <div class="progress-message" style="
                    font-size: 0.875rem;
                    margin-bottom: 12px;
                    font-weight: 500;
                ">${message}</div>
                <div class="progress-bar-container" style="
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    height: 8px;
                    overflow: hidden;
                    position: relative;
                ">
                    <div class="progress-bar" id="${progressId}-bar" style="
                        background: white;
                        height: 100%;
                        width: 0%;
                        border-radius: 8px;
                        transition: width 0.3s ease;
                    "></div>
                </div>
                <div class="progress-stats" style="
                    margin-top: 8px;
                    font-size: 0.75rem;
                    opacity: 0.9;
                    display: flex;
                    justify-content: space-between;
                ">
                    <span id="${progressId}-percent">0%</span>
                    <span id="${progressId}-eta"></span>
                </div>
            </div>
        `;
        
        // Insert at the beginning of container
        container.insertAdjacentHTML('afterbegin', progressHTML);
        
        // Store reference
        this.activeProgressBars.set(progressId, {
            containerId,
            startTime: Date.now(),
            message
        });
        
        return progressId;
    }

    updateProgress(progressId, percentage, message = null) {
        if (!this.activeProgressBars.has(progressId)) {
            console.warn(`Progress bar ${progressId} not found`);
            return;
        }
        
        const progressBar = document.getElementById(`${progressId}-bar`);
        const progressPercent = document.getElementById(`${progressId}-percent`);
        const progressMessage = document.querySelector(`#${progressId} .progress-message`);
        
        if (progressBar) {
            progressBar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        }
        
        if (progressPercent) {
            progressPercent.textContent = `${Math.round(percentage)}%`;
        }
        
        if (message && progressMessage) {
            progressMessage.textContent = message;
        }
        
        // Calculate ETA
        const progressData = this.activeProgressBars.get(progressId);
        if (progressData && percentage > 0 && percentage < 100) {
            const elapsed = Date.now() - progressData.startTime;
            const estimated = (elapsed / percentage) * 100;
            const remaining = Math.max(0, estimated - elapsed);
            const seconds = Math.round(remaining / 1000);
            
            const etaElement = document.getElementById(`${progressId}-eta`);
            if (etaElement) {
                etaElement.textContent = `~${seconds}s remaining`;
            }
        }
    }

    completeProgress(progressId, successMessage = 'Complete!') {
        if (!this.activeProgressBars.has(progressId)) {
            return;
        }
        
        // Update to 100%
        this.updateProgress(progressId, 100, successMessage);
        
        // Remove after a delay
        setTimeout(() => {
            const element = document.getElementById(progressId);
            if (element) {
                element.style.transition = 'opacity 0.3s';
                element.style.opacity = '0';
                setTimeout(() => element.remove(), 300);
            }
            this.activeProgressBars.delete(progressId);
        }, 500);
    }

    removeProgress(progressId) {
        const element = document.getElementById(progressId);
        if (element) {
            element.remove();
        }
        this.activeProgressBars.delete(progressId);
    }

    // Show simple loading spinner
    showLoading(elementId, message = 'Loading...') {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.classList.add('loading');
        
        // Add loading overlay if it doesn't exist
        if (!element.querySelector('.loading-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="spinner"></div>
                <div class="loading-message">${message}</div>
            `;
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.9);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            `;
            element.appendChild(overlay);
        }
    }

    hideLoading(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.classList.remove('loading');
        const overlay = element.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
}

// Create and export singleton instance
const progressManager = new ProgressManager();
export { progressManager };