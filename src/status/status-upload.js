// src/status/status-upload.js
// Status Upload Module - Upload Photos with Captions (24h expiry)

import storageLocal from '../utils/storage-local.js';
import { showNotification } from '../utils/notification.js';
import authManager from '../auth/login.js';

class StatusUpload {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Add status button
        document.getElementById('addStatusBtn')?.addEventListener('click', () => {
            this.showStatusUploadModal();
        });

        // Load statuses periodically
        setInterval(() => {
            this.loadStatuses();
        }, 60000); // Check every minute for expired statuses

        // Initial load
        this.loadStatuses();
    }

    /**
     * Show status upload modal
     */
    showStatusUploadModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = 'display: flex;';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Buat Status Baru</h3>
                    <button class="close-modal icon-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div id="uploadArea" style="border: 2px dashed var(--border-color); border-radius: 12px; 
                         padding: 40px; text-align: center; cursor: pointer; transition: all 0.3s;">
                        <i class="fas fa-cloud-upload-alt" style="font-size: 48px; color: var(--accent-color); margin-bottom: 16px;"></i>
                        <p style="color: var(--text-primary); font-weight: 500;">Klik untuk pilih foto</p>
                        <p style="color: var(--text-secondary); font-size: 12px; margin-top: 8px;">Status akan terhapus otomatis setelah 24 jam</p>
                        <input type="file" id="statusPhotoInput" accept="image/*" style="display: none;" 
                               onchange="window.statusUpload.handlePhotoSelect(event)">
                    </div>
                    
                    <div id="photoPreview" style="display: none; margin-top: 16px;">
                        <img id="previewImage" src="" alt="Preview" 
                             style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px;">
                        <div class="form-group" style="margin-top: 16px;">
                            <label for="statusCaption">Caption (opsional)</label>
                            <textarea id="statusCaption" placeholder="Tulis caption..." rows="2" maxlength="200"></textarea>
                        </div>
                        <button class="primary-btn full-width" onclick="window.statusUpload.uploadStatus()">
                            <i class="fas fa-paper-plane"></i> Bagikan Status
                        </button>
                    </div>
                    
                    <div id="statusError" class="error-message" style="display: none; margin-top: 16px;"></div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        // Click to upload
        const uploadArea = modal.querySelector('#uploadArea');
        uploadArea.addEventListener('click', () => {
            document.getElementById('statusPhotoInput').click();
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--accent-color)';
            uploadArea.style.background = 'rgba(0, 168, 132, 0.05)';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = 'var(--border-color)';
            uploadArea.style.background = 'transparent';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--border-color)';
            uploadArea.style.background = 'transparent';
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.previewPhoto(file);
            }
        });
    }

    /**
     * Handle photo selection
     */
    handlePhotoSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.previewPhoto(file);
        }
    }

    /**
     * Preview selected photo
     */
    previewPhoto(file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showError('Harap pilih file gambar');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showError('Ukuran foto maksimal 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('previewImage').src = e.target.result;
            document.getElementById('uploadArea').style.display = 'none';
            document.getElementById('photoPreview').style.display = 'block';
            document.getElementById('statusError').style.display = 'none';
        };
        reader.readAsDataURL(file);

        // Store file for upload
        this.selectedFile = file;
    }

    /**
     * Upload status
     */
    async uploadStatus() {
        if (!this.selectedFile) {
            this.showError('Pilih foto terlebih dahulu');
            return;
        }

        const caption = document.getElementById('statusCaption')?.value.trim() || '';
        const uploadBtn = document.querySelector('#photoPreview .primary-btn');

        try {
            // Disable button
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengunggah...';

            // Save to localStorage
            const statusId = await storageLocal.saveStatusPhoto(this.selectedFile, caption);

            // Close modal
            document.querySelector('.modal').remove();

            // Refresh status list
            this.loadStatuses();

            showNotification('Status berhasil dibagikan! 📸', 'success');

        } catch (error) {
            console.error('Error uploading status:', error);
            this.showError('Gagal mengunggah status. Silakan coba lagi.');
        } finally {
            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Bagikan Status';
            }
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorDiv = document.getElementById('statusError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    /**
     * Load statuses
     */
    loadStatuses() {
        const statusList = document.getElementById('statusList');
        if (!statusList) return;

        const user = authManager.getCurrentUser();
        if (!user) return;

        const statuses = storageLocal.getStatusPhotos();

        if (statuses.length === 0) {
            statusList.innerHTML = `
                <div style="padding: 40px 20px; text-align: center;">
                    <i class="fas fa-circle" style="font-size: 48px; color: var(--text-secondary); margin-bottom: 16px; opacity: 0.5;"></i>
                    <p style="color: var(--text-secondary);">Belum ada status</p>
                    <p style="color: var(--text-secondary); font-size: 12px; margin-top: 8px;">Bagikan momenmu sekarang</p>
                </div>
            `;
            return;
        }

        statusList.innerHTML = `
            <div class="status-item" onclick="window.statusUpload.showMyStatus()">
                <img src="${user.photoURL || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22%3E%3Crect width=%2248%22 height=%2248%22 fill=%22%23667eea%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2220%22%3E${(user.displayName || 'U').charAt(0)}%3C/text%3E%3C/svg%3E'}" 
                     alt="My Status" class="status-avatar">
                <div class="status-info">
                    <h4>Status Saya</h4>
                    <p>${statuses.length} status • ${this.getTimeAgo(statuses[statuses.length - 1].timestamp)}</p>
                </div>
            </div>
            ${statuses.slice().reverse().map(status => `
                <div class="status-item" onclick="window.statusView.viewStatus('${status.id}')">
                    <img src="${status.data}" alt="Status" class="status-avatar" 
                         style="width: 40px; height: 40px; object-fit: cover;">
                    <div class="status-info">
                        <h4>${this.escapeHtml(status.caption || 'Tanpa caption')}</h4>
                        <p>${this.getTimeAgo(status.timestamp)} • Kedaluwarsa ${this.getTimeUntil(status.expiresAt)}</p>
                    </div>
                </div>
            `).join('')}
        `;
    }

    /**
     * Show my statuses
     */
    showMyStatus() {
        const statuses = storageLocal.getStatusPhotos();
        if (statuses.length > 0) {
            // Show the latest status
            if (window.statusView) {
                window.statusView.viewStatus(statuses[statuses.length - 1].id);
            }
        }
    }

    /**
     * Get time ago string
     */
    getTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        
        if (seconds < 60) return 'Baru saja';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} menit`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam`;
        return `${Math.floor(seconds / 86400)} hari`;
    }

    /**
     * Get time until expiry
     */
    getTimeUntil(expiresAt) {
        const seconds = Math.floor((expiresAt - Date.now()) / 1000);
        
        if (seconds < 0) return 'kedaluwarsa';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lagi`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lagi`;
        return `${Math.floor(seconds / 86400)} hari lagi`;
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
const statusUpload = new StatusUpload();
window.statusUpload = statusUpload;

export default statusUpload;
