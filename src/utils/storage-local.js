// src/utils/storage-local.js
// STORAGE LOKAL - Simpan voice note & status foto di localStorage

const STORAGE_KEYS = {
    VOICE_NOTES: 'rc_voice_notes',
    STATUS_PHOTOS: 'rc_status_photos',
    SETTINGS: 'rc_settings'
};

// ==========================================
// VOICE NOTE STORAGE
// ==========================================
function saveVoiceNoteLocally(voiceData) {
    const voiceNotes = getAllVoiceNotes();
    voiceNotes.push({
        ...voiceData,
        savedAt: Date.now()
    });
    localStorage.setItem(STORAGE_KEYS.VOICE_NOTES, JSON.stringify(voiceNotes));
    console.log('💾 Voice note saved:', voiceData.id);
}

function getVoiceNote(voiceNoteId) {
    const voiceNotes = getAllVoiceNotes();
    return voiceNotes.find(vn => vn.id === voiceNoteId) || null;
}

function getAllVoiceNotes() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.VOICE_NOTES) || '[]');
    } catch {
        return [];
    }
}

function deleteVoiceNote(voiceNoteId) {
    const voiceNotes = getAllVoiceNotes().filter(vn => vn.id !== voiceNoteId);
    localStorage.setItem(STORAGE_KEYS.VOICE_NOTES, JSON.stringify(voiceNotes));
}

// ==========================================
// STATUS PHOTO STORAGE (24 JAM)
// ==========================================
function saveStatusPhoto(photoData) {
    const statuses = getActiveStatuses();
    statuses.push({
        ...photoData,
        id: 'status_' + Date.now(),
        createdAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 jam
    });
    localStorage.setItem(STORAGE_KEYS.STATUS_PHOTOS, JSON.stringify(statuses));
    console.log('📸 Status saved');
}

function getActiveStatuses() {
    try {
        const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.STATUS_PHOTOS) || '[]');
        const now = Date.now();
        const active = all.filter(s => s.expiresAt > now);
        
        // Hapus yang expired
        if (active.length !== all.length) {
            localStorage.setItem(STORAGE_KEYS.STATUS_PHOTOS, JSON.stringify(active));
        }
        
        return active;
    } catch {
        return [];
    }
}

function deleteStatus(statusId) {
    const statuses = getActiveStatuses().filter(s => s.id !== statusId);
    localStorage.setItem(STORAGE_KEYS.STATUS_PHOTOS, JSON.stringify(statuses));
}

// ==========================================
// COMPRESS IMAGE TO BASE64
// ==========================================
function compressImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ==========================================
// STORAGE STATS
// ==========================================
function getStorageStats() {
    let totalSize = 0;
    
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key) && key.startsWith('rc_')) {
            totalSize += new Blob([localStorage.getItem(key)]).size;
        }
    }
    
    return {
        totalSizeBytes: totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        usagePercent: ((totalSize / (5 * 1024 * 1024)) * 100).toFixed(1)
    };
}

// ==========================================
// CLEANUP OLD DATA
// ==========================================
function cleanupOldData() {
    // Hapus voice notes lebih dari 7 hari
    const voiceNotes = getAllVoiceNotes();
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const fresh = voiceNotes.filter(vn => vn.savedAt > weekAgo);
    if (fresh.length !== voiceNotes.length) {
        localStorage.setItem(STORAGE_KEYS.VOICE_NOTES, JSON.stringify(fresh));
        console.log('🧹 Cleaned old voice notes');
    }
    
    // Status expired sudah otomatis terfilter di getActiveStatuses()
    getActiveStatuses();
}

// Run cleanup saat startup
cleanupOldData();

console.log('✅ Storage module loaded');
