// src/utils/notification.js
// NOTIFIKASI - Browser notification + suara + in-app

// ==========================================
// MINTA IZIN NOTIFIKASI
// ==========================================
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
        console.log('🔔 Notifikasi:', permission);
    });
}

// ==========================================
// TAMPILKAN NOTIFIKASI IN-APP
// ==========================================
function showNotif(message, type = 'info', duration = 4000) {
    const container = document.getElementById('notifications');
    if (!container) return;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    const el = document.createElement('div');
    el.className = `notification ${type}`;
    el.innerHTML = `${icons[type] || ''} ${message}`;
    el.style.cursor = 'pointer';
    el.onclick = () => {
        el.classList.add('fade-out');
        setTimeout(() => el.remove(), 300);
    };
    
    container.appendChild(el);
    
    // Auto remove
    setTimeout(() => {
        if (el.parentNode) {
            el.classList.add('fade-out');
            setTimeout(() => el.remove(), 300);
        }
    }, duration);
}

// ==========================================
// BROWSER NOTIFICATION
// ==========================================
function showBrowserNotification(title, body, icon = null) {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
        // Play sound
        playNotificationSound();
        
        const options = {
            body: body,
            icon: icon || 'https://www.google.com/favicon.ico',
            badge: icon || 'https://www.google.com/favicon.ico',
            tag: 'raflychat-msg',
            requireInteraction: false
        };
        
        try {
            const notification = new Notification(title, options);
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
            setTimeout(() => notification.close(), 5000);
        } catch (error) {
            console.warn('Gagal tampil notifikasi browser:', error);
        }
    }
}

// ==========================================
// NOTIFIKASI PESAN BARU
// ==========================================
function notifyNewMessage(senderName, messagePreview) {
    // In-app notification
    showNotif(`💬 ${senderName}: ${messagePreview.substring(0, 50)}`, 'info', 3000);
    
    // Browser notification
    showBrowserNotification(
        senderName,
        messagePreview.substring(0, 100)
    );
}

// ==========================================
// SUARA NOTIFIKASI (BIP DIGITAL)
// ==========================================
function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Bip 1
        const oscillator1 = audioContext.createOscillator();
        const gainNode1 = audioContext.createGain();
        oscillator1.connect(gainNode1);
        gainNode1.connect(audioContext.destination);
        oscillator1.frequency.value = 880;
        oscillator1.type = 'sine';
        gainNode1.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator1.start(audioContext.currentTime);
        oscillator1.stop(audioContext.currentTime + 0.15);
        
        // Bip 2 (setelah delay kecil)
        setTimeout(() => {
            const oscillator2 = audioContext.createOscillator();
            const gainNode2 = audioContext.createGain();
            oscillator2.connect(gainNode2);
            gainNode2.connect(audioContext.destination);
            oscillator2.frequency.value = 1100;
            oscillator2.type = 'sine';
            gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator2.start(audioContext.currentTime);
            oscillator2.stop(audioContext.currentTime + 0.15);
            
            // Cleanup
            setTimeout(() => {
                oscillator1.disconnect();
                oscillator2.disconnect();
                gainNode1.disconnect();
                gainNode2.disconnect();
                audioContext.close();
            }, 300);
        }, 150);
        
    } catch (error) {
        console.warn('Gagal putar suara:', error);
    }
}

// ==========================================
// DETEKSI ONLINE/OFFLINE
// ==========================================
window.addEventListener('online', () => {
    showNotif('📶 Koneksi pulih', 'success', 2000);
    if (currentUser) {
        db.collection('users').doc(currentUser.uid).update({
            status: 'online',
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(() => {});
    }
});

window.addEventListener('offline', () => {
    showNotif('📵 Koneksi terputus', 'warning', 3000);
    if (currentUser) {
        db.collection('users').doc(currentUser.uid).update({
            status: 'offline',
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(() => {});
    }
});

// Update status sebelum tab ditutup
window.addEventListener('beforeunload', () => {
    if (currentUser) {
        db.collection('users').doc(currentUser.uid).update({
            status: 'offline',
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(() => {});
    }
});

console.log('✅ Notification module loaded');
