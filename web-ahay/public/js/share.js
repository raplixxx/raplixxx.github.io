// public/js/share.js
// Public shared chat viewer

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
}
const db = firebase.firestore();

// DOM Elements
const sharedMessagesContainer = document.getElementById('sharedMessagesContainer');
const toast = document.getElementById('toast');

// Extract share ID from URL
function getShareIdFromURL() {
    const path = window.location.pathname;
    const match = path.match(/\/share\/(share-[a-z0-9]+)/);
    return match ? match[1] : null;
}

// Load shared chat
async function loadSharedChat() {
    const shareId = getShareIdFromURL();
    
    if (!shareId) {
        showError('Invalid share link');
        return;
    }
    
    try {
        const shareDoc = await db.collection('shared_chats').doc(shareId).get();
        
        if (!shareDoc.exists) {
            showError('Shared chat not found');
            return;
        }
        
        const shareData = shareDoc.data();
        displaySharedMessages(shareData.messages);
        
    } catch (error) {
        console.error('Error loading shared chat:', error);
        showError('Failed to load shared chat');
    }
}

// Display shared messages
function displaySharedMessages(messages) {
    sharedMessagesContainer.innerHTML = '';
    
    if (!messages || messages.length === 0) {
        showError('No messages in this chat');
        return;
    }
    
    messages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role === 'user' ? 'user-message' : 'ai-message-wrapper'}`;
        
        if (message.role === 'user') {
            messageDiv.innerHTML = `
                <div class="message-bubble user-bubble">
                    <p>${escapeHtml(message.content)}</p>
                    <span class="message-time">${formatTime(message.timestamp)}</span>
                </div>
            `;
        } else {
            const sourcesHtml = message.sources && message.sources.length > 0 ? `
                <div class="sources-section">
                    <h4><i class="fas fa-link"></i> Sources:</h4>
                    <ul class="sources-list">
                        ${message.sources.map(source => `
                            <li><a href="${source.url}" target="_blank" rel="noopener">${source.title}</a></li>
                        `).join('')}
                    </ul>
                </div>
            ` : '';
            
            messageDiv.innerHTML = `
                <div class="ai-avatar-small">
                    <img src="vestlog.jpg" alt="AI">
                </div>
                <div class="message-bubble ai-bubble">
                    <div class="ai-message-content">${formatMessage(message.content)}</div>
                    ${sourcesHtml}
                    <div class="message-actions">
                        <button class="action-btn copy-btn" onclick="copySharedMessage(this)" title="Copy">
                            <i class="fas fa-copy"></i>
                        </button>
                        <span class="message-time">${formatTime(message.timestamp)}</span>
                    </div>
                </div>
            `;
        }
        
        sharedMessagesContainer.appendChild(messageDiv);
    });
    
    sharedMessagesContainer.scrollTop = sharedMessagesContainer.scrollHeight;
}

// Copy message content
window.copySharedMessage = function(button) {
    const messageContent = button.closest('.ai-bubble').querySelector('.ai-message-content').textContent;
    navigator.clipboard.writeText(messageContent).then(() => {
        showToast('Message copied!', 'success');
    }).catch(() => {
        showToast('Failed to copy message', 'error');
    });
};

// Format message with markdown-like styling
function formatMessage(content) {
    content = content.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener">$1</a>'
    );
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\n/g, '<br>');
    return content;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format timestamp
function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

// Show error message
function showError(message) {
    sharedMessagesContainer.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        </div>
    `;
}

// Show toast
function showToast(message, type = 'info') {
    if (toast) {
        toast.textContent = message;
        toast.className = `toast toast-${type} show`;
        setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    }
}

// Load on page ready
document.addEventListener('DOMContentLoaded', loadSharedChat);
