// public/js/share.js
// Public Shared Chat Viewer

if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
}

const db = firebase.firestore();

// DOM Elements
const sharedMessagesContainer = document.getElementById('sharedMessagesContainer');

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
        showError('Link share tidak valid');
        return;
    }
    
    try {
        const shareDoc = await db.collection('shared_chats').doc(shareId).get();
        
        if (!shareDoc.exists) {
            showError('Chat tidak ditemukan atau sudah dihapus');
            return;
        }
        
        const shareData = shareDoc.data();
        
        // Update header info
        document.title = `Shared Chat - ${shareData.username || 'Web Ahay'}`;
        
        displaySharedMessages(shareData.messages);
        
    } catch (error) {
        console.error('Error loading shared chat:', error);
        showError('Gagal memuat chat yang dibagikan');
    }
}

// Display shared messages
function displaySharedMessages(messages) {
    sharedMessagesContainer.innerHTML = '';
    
    if (!messages || messages.length === 0) {
        showError('Tidak ada pesan dalam chat ini');
        return;
    }
    
    messages.forEach(message => {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `message-wrapper ${message.role === 'user' ? 'user' : 'ai'}`;
        
        if (message.role === 'user') {
            messageWrapper.innerHTML = `
                <div class="message user-message">
                    ${message.imageUrl ? `
                        <div class="message-image">
                            <img src="${message.imageUrl}" alt="Shared image">
                        </div>
                    ` : ''}
                    <div class="message-content">
                        <p>${escapeHtml(message.content)}</p>
                    </div>
                    <span class="message-time">${formatTime(message.timestamp)}</span>
                </div>
            `;
        } else {
            messageWrapper.innerHTML = `
                <div class="message ai-message">
                    <div class="ai-avatar">
                        <img src="vestlog.jpg" alt="AI">
                    </div>
                    <div class="message-body">
                        <div class="message-content">
                            ${formatMessage(message.content)}
                        </div>
                        ${message.sources?.length ? `
                            <div class="message-sources">
                                <div class="sources-header">
                                    <i class="fas fa-globe"></i>
                                    <span>Sumber:</span>
                                </div>
                                <div class="sources-list">
                                    ${message.sources.map((source, idx) => `
                                        <a href="${source.url}" target="_blank" rel="noopener" class="source-item">
                                            <span class="source-number">${idx + 1}</span>
                                            <span class="source-title">${source.title || 'Link'}</span>
                                            <i class="fas fa-external-link-alt"></i>
                                        </a>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        <span class="message-time">${formatTime(message.timestamp)}</span>
                    </div>
                </div>
            `;
        }
        
        sharedMessagesContainer.appendChild(messageWrapper);
    });
}

// Show error
function showError(message) {
    sharedMessagesContainer.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #f5576c; margin-bottom: 20px;"></i>
            <p style="color: #b0b0d0;">${message}</p>
        </div>
    `;
}

// Helper functions
function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatMessage(content) {
    if (!content) return '';
    content = content.replace(
        /(https?:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank" rel="noopener">$1</a>'
    );
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\n/g, '<br>');
    return content;
}

// Load on page ready
document.addEventListener('DOMContentLoaded', loadSharedChat);
