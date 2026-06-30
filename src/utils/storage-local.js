// src/utils/storage-local.js
// Local Storage Utility - Handles Voice Notes & Status Photos Storage

class StorageLocal {
    constructor() {
        this.STORAGE_KEYS = {
            VOICE_NOTES: 'raflychat_voice_notes',
            STATUS_PHOTOS: 'raflychat_status_photos',
            USER_INVITE_LINKS: 'raflychat_user_invites'
        };
    }

    /**
     * Save voice note to localStorage as base64
     */
    async saveVoiceNote(blob) {
        try {
            const base64 = await this.blobToBase64(blob);
            const voiceNotes = this.getVoiceNotes();
            const id = this.generateId();
            
            voiceNotes.push({
                id,
                data: base64,
                timestamp: Date.now(),
                duration: blob.duration || 0
            });

            localStorage.setItem(this.STORAGE_KEYS.VOICE_NOTES, JSON.stringify(voiceNotes));
            return id;
        } catch (error) {
            console.error('Error saving voice note:', error);
            throw new Error('Gagal menyimpan voice note');
        }
    }

    /**
     * Get voice note by ID
     */
    getVoiceNote(id) {
        const voiceNotes = this.getVoiceNotes();
        return voiceNotes.find(note => note.id === id) || null;
    }

    /**
     * Get all voice notes
     */
    getVoiceNotes() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.VOICE_NOTES);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting voice notes:', error);
            return [];
        }
    }

    /**
     * Delete voice note
     */
    deleteVoiceNote(id) {
        const voiceNotes = this.getVoiceNotes();
        const filtered = voiceNotes.filter(note => note.id !== id);
        localStorage.setItem(this.STORAGE_KEYS.VOICE_NOTES, JSON.stringify(filtered));
    }

    /**
     * Save status photo to localStorage
     */
    async saveStatusPhoto(imageFile, caption = '') {
        try {
            const base64 = await this.blobToBase64(imageFile);
            const statusPhotos = this.getStatusPhotos();
            const id = this.generateId();
            
            statusPhotos.push({
                id,
                data: base64,
                caption,
                timestamp: Date.now(),
                expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            });

            // Clean expired statuses
            const activeStatuses = statusPhotos.filter(s => s.expiresAt > Date.now());
            localStorage.setItem(this.STORAGE_KEYS.STATUS_PHOTOS, JSON.stringify(activeStatuses));
            
            return id;
        } catch (error) {
            console.error('Error saving status photo:', error);
            throw new Error('Gagal menyimpan status');
        }
    }

    /**
     * Get active status photos
     */
    getStatusPhotos() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.STATUS_PHOTOS);
            const statuses = data ? JSON.parse(data) : [];
            
            // Filter expired statuses
            const active = statuses.filter(s => s.expiresAt > Date.now());
            
            // Update storage if some expired
            if (active.length !== statuses.length) {
                localStorage.setItem(this.STORAGE_KEYS.STATUS_PHOTOS, JSON.stringify(active));
            }
            
            return active;
        } catch (error) {
            console.error('Error getting status photos:', error);
            return [];
        }
    }

    /**
     * Delete status photo
     */
    deleteStatusPhoto(id) {
        const statuses = this.getStatusPhotos();
        const filtered = statuses.filter(s => s.id !== id);
        localStorage.setItem(this.STORAGE_KEYS.STATUS_PHOTOS, JSON.stringify(filtered));
    }

    /**
     * Generate unique invite link for user
     */
    generateUserInviteLink(uid) {
        const randomString = this.generateRandomString(16);
        const inviteLink = `${uid}_${randomString}`;
        
        // Save to localStorage
        const invites = this.getUserInviteLinks();
        invites[uid] = inviteLink;
        localStorage.setItem(this.STORAGE_KEYS.USER_INVITE_LINKS, JSON.stringify(invites));
        
        return inviteLink;
    }

    /**
     * Get user invite link
     */
    getUserInviteLink(uid) {
        const invites = this.getUserInviteLinks();
        return invites[uid] || null;
    }

    /**
     * Get all user invite links
     */
    getUserInviteLinks() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.USER_INVITE_LINKS);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error getting invite links:', error);
            return {};
        }
    }

    /**
     * Convert blob to base64
     */
    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Convert base64 to blob
     */
    base64ToBlob(base64, type = 'audio/webm') {
        const byteString = atob(base64.split(',')[1]);
        const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        
        return new Blob([ab], { type: mimeString || type });
    }

    /**
     * Get storage usage stats
     */
    getStorageStats() {
        let totalSize = 0;
        const items = [];
        
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key) && key.startsWith('raflychat_')) {
                const value = localStorage.getItem(key);
                const size = new Blob([value]).size;
                totalSize += size;
                items.push({ key, size });
            }
        }
        
        return {
            totalSize,
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
            items,
            quota: 5 * 1024 * 1024, // 5MB typical localStorage limit
            usagePercent: ((totalSize / (5 * 1024 * 1024)) * 100).toFixed(2)
        };
    }

    /**
     * Clear all RaflyChat storage
     */
    clearAllStorage() {
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key) && key.startsWith('raflychat_')) {
                localStorage.removeItem(key);
            }
        }
    }

    /**
     * Generate random ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Generate random string
     */
    generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}

const storageLocal = new StorageLocal();
export default storageLocal;
export { StorageLocal };
