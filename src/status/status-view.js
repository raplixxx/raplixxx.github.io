// src/status/status-view.js
// Status View Module - View Status Photos with Captions

import storageLocal from '../utils/storage-local.js';
import { showNotification } from '../utils/notification.js';

class StatusView {
    constructor() {
        this.currentStatusIndex = 0;
        this.statuses = [];
        this.viewTimeout = null;
    }

    /**
     * View a specific status
     */
    viewStatus(statusId) {
        this.statuses = storageLocal.getStatusPhotos();
        
        if (this.statuses.length === 0) {
            showNotification('Tidak ada status', 'info');
            return;
        }

        // Find the index
        this.currentStatusIndex = this.statuses.findIndex(s => s.id === statusId);
        if (this.currentStatusIndex === -1) {
            this.currentStatusIndex = 0;
        }

        this.showStatusViewer();
        this.displayCurrentStatus();
    }

    /**
     * Show status viewer modal
     */
    showStatusViewer() {
        const modal = document.getElementById('statusViewerModal');
        const container = document.getElementById('statusViewerContainer');
        
        if (!modal || !container) return;

        modal.style.display = 'flex';
        
        // Clear previous timeout
        if (this.viewTimeout) {
            clearTimeout(this.viewTimeout);
        }

        // Auto advance to next status after 5 seconds
        this.viewTimeout = setTimeout(() => {
            this.nextStatus();
        }, 5000);
    }

    /**
     * Display current status
     */
    displayCurrentStatus() {
        const container = document.getElementById('statusViewerContainer');
        if (!container || this.statuses.length === 0) return;

        const status = this.statuses[this.currentStatusIndex];
        if (!status) return;

        container.innerHTML = `
            <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                <img src="${status.data}" alt="Status" class="status-viewer-image">
                ${status.caption ? `
                    <div class="status-viewer-caption">${this.escapeHtml(status.caption)}</div>
                ` : ''}
                
                <!-- Navigation -->
                <div style="position: absolute; top: 20px; left: 0; right: 0; display: flex; gap: 4px; padding: 0 20px;">
                    ${this.statuses.map((s, i) => `
                        <div style="flex: 1; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; overflow: hidden;">
                            <div style="height: 100%; background: white; width: ${i === this.currentStatusIndex ? '100%' : '0%'}; 
                                 transition: width 5s linear;"></div>
                        </div>
                    `).join('')}
                </div>

                <!-- Prev/Next buttons -->
                ${this.currentStatusIndex > 0 ? `
                    <button onclick="window.statusView.previousStatus()" 
                            style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
                                   background: rgba(255,255,255,0.2); border: none; color: white; 
                                   width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 20px;">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                ` : ''}
                
                ${this.currentStatusIndex < this.statuses.length - 1 ? `
                    <button onclick="window.statusView.nextStatus()" 
                            style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
                                   background: rgba(255,255,255,0.2); border: none; color: white; 
                                   width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 20px;">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                ` : ''}

                <!-- Progress indicator -->
                <div style="position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%); 
                     display: flex; gap: 4px;">
                    ${this.statuses.map((s, i) => `
                        <span style="width: 8px; height: 8px; border-radius: 50%; 
                               background: ${i === this.currentStatusIndex ? 'white' : 'rgba(255,255,255,0.5)'};"></span>
                    `).join('')}
                </div>
            </div>
        `;

        // Reset auto-advance timer
        if (this.viewTimeout) {
            clearTimeout(this.viewTimeout);
        }
        this.viewTimeout = setTimeout(() => {
            this.nextStatus();
        }, 5000);
    }

    /**
     * Next status
     */
    nextStatus() {
        if (this.currentStatusIndex < this.statuses.length - 1) {
            this.currentStatusIndex++;
            this.displayCurrentStatus();
        } else {
            this.closeViewer();
        }
    }

    /**
     * Previous status
     */
    previousStatus() {
        if (this.currentStatusIndex > 0) {
            this.currentStatusIndex--;
            this.displayCurrentStatus();
        }
    }

    /**
     * Close status viewer
     */
    closeViewer() {
        const modal = document.getElementById('statusViewerModal');
        if (modal) {
            modal.style.display = 'none';
        }

        if (this.viewTimeout) {
            clearTimeout(this.viewTimeout);
            this.viewTimeout = null;
        }
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
}

// Create singleton instance
const statusView = new StatusView();
window.statusView = statusView;

// Add close listener for status viewer
document.querySelector('.close-status-viewer')?.addEventListener('click', () => {
    statusView.closeViewer();
});

export default statusView;
