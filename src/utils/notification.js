// src/utils/notification.js
// Notification System - Browser Notifications & In-App Notifications

class NotificationManager {
    constructor() {
        this.notificationPermission = 'default';
        this.notificationSound = document.getElementById('notificationSound');
        this.init();
    }

    async init() {
        // Request notification permission
        if ('Notification' in window) {
            this.notificationPermission = Notification.permission;
            
            if (this.notificationPermission === 'default') {
                try {
                    const permission = await Notification.requestPermission();
                    this.notificationPermission = permission;
                } catch (error) {
                    console.warn('Notification permission denied:', error);
                }
            }
        }
    }

    /**
     * Show browser notification
     */
    showBrowserNotification(title, body, icon = null) {
        if (!('Notification' in window)) {
            console.warn('Browser tidak mendukung notifikasi');
            return;
        }

        if (this.notificationPermission === 'granted') {
            // Play notification sound
            this.playNotificationSound();

            const options = {
                body: body,
                icon: icon || 'data:image/svg+xml,' + encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
                        <circle cx="96" cy="96" r="96" fill="#00a884"/>
                        <path d="M60 80 L96 116 L132 80" stroke="white" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                `),
                badge: icon,
                tag: 'raflychat-message',
                requireInteraction: false,
                silent: false
            };

            try {
                const notification = new Notification(title, options);
                
                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };

                // Auto close after 5 seconds
                setTimeout(() => notification.close(), 5000);
            } catch (error) {
                console.error('Error showing notification:', error);
            }
        }
    }

    /**
     * Show in-app notification
     */
    showInAppNotification(message, type = 'info', duration = 4000) {
        const container = document.getElementById('notificationsContainer');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        notification.innerHTML = `
            <span style="margin-right: 8px;">${icons[type] || icons.info}</span>
            ${message}
        `;

        container.appendChild(notification);

        // Auto remove after duration
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, duration);

        // Click to dismiss
        notification.addEventListener('click', () => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        });
    }

    /**
     * Show success notification
     */
    success(message, duration) {
        this.showInAppNotification(message, 'success', duration);
    }

    /**
     * Show error notification
     */
    error(message, duration = 5000) {
        this.showInAppNotification(message, 'error', duration);
    }

    /**
     * Show warning notification
     */
    warning(message, duration) {
        this.showInAppNotification(message, 'warning', duration);
    }

    /**
     * Show info notification
     */
    info(message, duration) {
        this.showInAppNotification(message, 'info', duration);
    }

    /**
     * Notify new message
     */
    notifyNewMessage(senderName, messagePreview, chatId) {
        // Browser notification
        this.showBrowserNotification(
            senderName,
            messagePreview
        );

        // In-app notification
        this.showInAppNotification(
            `Pesan baru dari ${senderName}`,
            'info',
            3000
        );
    }

    /**
     * Play notification sound
     */
    playNotificationSound() {
        try {
            if (this.notificationSound) {
                this.notificationSound.currentTime = 0;
                this.notificationSound.volume = 0.5;
                
                const playPromise = this.notificationSound.play();
                
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.warn('Gagal memutar suara notifikasi:', error);
                    });
                }
            }
        } catch (error) {
            console.warn('Error playing notification sound:', error);
        }
    }

    /**
     * Generate notification sound programmatically
     */
    generateTone(frequency = 800, duration = 200, type = 'sine') {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
            
            // Clean up
            setTimeout(() => {
                oscillator.disconnect();
                gainNode.disconnect();
                audioContext.close();
            }, duration + 100);
        } catch (error) {
            console.warn('Error generating tone:', error);
        }
    }
}

// Create singleton instance
const notificationManager = new NotificationManager();

// Export convenience functions
export const showNotification = (message, type, duration) => {
    notificationManager.showInAppNotification(message, type, duration);
};

export const notifyNewMessage = (senderName, messagePreview, chatId) => {
    notificationManager.notifyNewMessage(senderName, messagePreview, chatId);
};

export default notificationManager;
