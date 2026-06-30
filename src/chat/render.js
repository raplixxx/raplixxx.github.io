// src/chat/render.js
// Render Messages Module - Display Chat Messages, Search, Reply Display

import {
    db,
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    getDoc,
    serverTimestamp
} from '../database/firebase-config.js';

import authManager from '../auth/login.js';
import storageLocal from '../utils/storage-local.js';
import { notifyNewMessage } from '../utils/notification.js';

class ChatRenderer {
    constructor() {
        this.messagesListener = null;
        this.allMessages = [];
        this.searchResults = [];
        this.isSearching = false;
        this.currentGroupId = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Search messages
        document.getElementById('searchMessagesBtn')?.addEventListener('click', () => {
            this.toggleSearchBar();
        });

        // Search input
        const searchInput = document.getElementById('searchChat');
        searchInput?.addEventListener('input', (e) => {
            this.searchMessages(e.target.value);
        });

        // Close chat
        document.getElementById('closeChatBtn')?.addEventListener('click', () => {
            this.closeChat();
        });

        // Back to sidebar (mobile)
        document.getElementById('backToSidebar')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('hidden');
        });

        // Scroll to bottom button
        document.getElementById('scrollToBottom')?.addEventListener('click', () => {
            this.scrollToBottom(true);
        });

        // Monitor scroll position
        const messageContainer = document.getElementById('messageContainer');
        messageContainer?.addEventListener('scroll', () => {
            this.handleScroll();
        });
    }

    /**
     * Load messages for a group
     */
    loadMessages(groupId) {
        // Unsubscribe from previous listener
        if (this.messagesListener) {
            this.messagesListener();
        }

        this.currentGroupId = groupId;
        const messagesRef = collection(db, 'groups', groupId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        this.messagesListener = onSnapshot(q, (snapshot) => {
            const messages = [];
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const messageData = {
                        id: change.doc.id,
                        ...change.doc.data()
                    };
                    messages.push(messageData);

                    // Notify for new messages from others
                    const user = authManager.getCurrentUser();
                    if (user && messageData.senderId !== user.uid && !messageData.isAI) {
                        notifyNewMessage(
                            messageData.senderName,
                            messageData.text?.substring(0, 50) || '[Voice Note]',
                            groupId
                        );
                    }
                }
            });

            this.allMessages = messages;
            
            if (!this.isSearching) {
                this.renderMessages(messages);
                this.scrollToBottom();
            }
        }, (error) => {
            console.error('Error loading messages:', error);
            this.showEmptyChat('Gagal memuat pesan. Silakan coba lagi.');
        });
    }

    /**
     * Render messages to the chat area
     */
    renderMessages(messages) {
        const messagesList = document.getElementById('messagesList');
        if (!messagesList) return;

        if (messages.length === 0) {
            this.showEmptyChat('Belum ada pesan. Kirim pesan pertama!');
            return;
        }

        const user = authManager.getCurrentUser();
        
        messagesList.innerHTML = messages.map(msg => {
            const isSent = msg.senderId === user?.uid;
            const isAI = msg.isAI || msg.senderId === 'ai-bot';
            
            return this.createMessageElement(msg, isSent, isAI);
        }).join('');
    }

    /**
     * Create message element
     */
    createMessageElement(msg, isSent, isAI) {
        const time = msg.timestamp?.toDate?.() || new Date();
        const timeStr = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        
        let messageContent = '';
        
        // Different message types
        switch (msg.type) {
            case 'voice':
                messageContent = this.createVoiceNoteElement(msg);
                break;
            case 'ai':
                messageContent = this.createAIElement(msg);
                break;
            default:
                messageContent = this.createTextElement(msg);
        }

        const replyHTML = msg.replyTo ? `
            <div class="reply-attachment">
                <div class="reply-sender">↩ ${this.escapeHtml(msg.replyTo.senderName)}</div>
                <div class="reply-content">${this.escapeHtml(msg.replyTo.text?.substring(0, 100) || '')}</div>
            </div>
        ` : '';

        const forwardedHTML = msg.forwarded ? `
            <div class="forwarded-label">↗ Diteruskan dari ${this.escapeHtml(msg.forwardedFrom)}</div>
        ` : '';

        const editedHTML = msg.edited ? `
            <span class="message-edited">(diedit)</span>
        ` : '';

        const reactionsHTML = msg.reactions ? `
            <div class="message-reactions">
                ${Object.entries(msg.reactions).map(([emoji, count]) => `
                    <span class="reaction-badge ${msg.userReactions?.includes(emoji) ? 'active' : ''}" 
                          onclick="window.chatActions.addReaction('${msg.id}', '${emoji}')">
                        ${emoji} ${count}
                    </span>
                `).join('')}
            </div>
        ` : '';

        return `
            <div class="message-wrapper ${isSent ? 'sent' : 'received'} ${isAI ? 'ai-message' : ''}" 
                 id="msg-${msg.id}">
                ${isAI ? '<div style="font-size: 12px; color: var(--accent-color); margin-bottom: 4px;">🤖 Aetheris AI</div>' : ''}
                <div class="message-bubble">
                    ${replyHTML}
                    ${forwardedHTML}
                    ${messageContent}
                    <div class="message-meta">
                        <span class="message-time">${timeStr}</span>
                        ${editedHTML}
                    </div>
                </div>
                ${reactionsHTML}
                ${!isAI ? this.createMessageActions(msg, isSent) : ''}
            </div>
        `;
    }

    /**
     * Create text message element
     */
    createTextElement(msg) {
        return `
            <div class="message-text">${this.formatMessageText(this.escapeHtml(msg.text || ''))}</div>
        `;
    }

    /**
     * Create voice note element
     */
    createVoiceNoteElement(msg) {
        const voiceNote = storageLocal.getVoiceNote(msg.voiceNoteId);
        const duration = msg.duration || 0;
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        const durationStr = `${minutes}:${String(seconds).padStart(2, '0')}`;

        return `
            <div class="voice-note" data-voice-id="${msg.voiceNoteId}">
                <button class="voice-play-btn" onclick="window.chatRenderer.playVoiceNote('${msg.voiceNoteId}', this)">
                    <i class="fas fa-play"></i>
                </button>
                <div class="voice-waveform">
                    <div class="voice-progress" style="width: 0%"></div>
                </div>
                <span class="voice-duration">${durationStr}</span>
            </div>
            ${!voiceNote ? '<div style="font-size: 11px; color: var(--danger-color); margin-top: 4px;">Voice note tidak tersedia</div>' : ''}
        `;
    }

    /**
     * Create AI message element
     */
    createAIElement(msg) {
        return `
            <div class="message-text" style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); 
                 padding: 8px; border-radius: 8px; border-left: 3px solid var(--accent-color);">
                ${this.formatMessageText(this.escapeHtml(msg.text || ''))}
            </div>
        `;
    }

    /**
     * Create message action buttons
     */
    createMessageActions(msg, isSent) {
        return `
            <div style="display: flex; gap: 4px; margin-top: 4px; opacity: 0; transition: opacity 0.2s;" 
                 class="message-actions" 
                 onmouseenter="this.style.opacity='1'" 
                 onmouseleave="this.style.opacity='0'">
                <button class="icon-btn small" onclick="window.chatActions.showReactionPicker('${msg.id}')" title="Reaksi">
                    <i class="fas fa-smile"></i>
                </button>
                <button class="icon-btn small" onclick="window.sendMessage.setReply(${JSON.stringify({
                    id: msg.id,
                    senderName: msg.senderName,
                    text: msg.text
                }).replace(/"/g, '&quot;')})" title="Balas">
                    <i class="fas fa-reply"></i>
                </button>
                <button class="icon-btn small" onclick="window.chatRenderer.showForwardModal('${msg.id}')" title="Teruskan">
                    <i class="fas fa-share"></i>
                </button>
                ${isSent ? `
                    <button class="icon-btn small" onclick="window.chatActions.editMessage('${msg.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                ` : ''}
            </div>
        `;
    }

    /**
     * Format message text (links, mentions, etc.)
     */
    formatMessageText(text) {
        // Convert URLs to links
        text = text.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" style="color: var(--accent-color);">$1</a>'
        );
        
        // Convert newlines to <br>
        text = text.replace(/\n/g, '<br>');
        
        return text;
    }

    /**
     * Play voice note
     */
    async playVoiceNote(voiceNoteId, button) {
        try {
            const voiceNote = storageLocal.getVoiceNote(voiceNoteId);
            if (!voiceNote) {
                showNotification('Voice note tidak ditemukan', 'error');
                return;
            }

            const audio = new Audio(voiceNote.data);
            const icon = button.querySelector('i');
            
            audio.onplay = () => {
                icon.className = 'fas fa-pause';
            };
            
            audio.onpause = () => {
                icon.className = 'fas fa-play';
            };
            
            audio.onended = () => {
                icon.className = 'fas fa-play';
            };
            
            await audio.play();
            
        } catch (error) {
            console.error('Error playing voice note:', error);
            showNotification('Gagal memutar voice note', 'error');
        }
    }

    /**
     * Search messages
     */
    searchMessages(query) {
        if (!query.trim()) {
            this.isSearching = false;
            this.renderMessages(this.allMessages);
            return;
        }

        this.isSearching = true;
        const searchTerm = query.toLowerCase();
        
        this.searchResults = this.allMessages.filter(msg => 
            msg.text?.toLowerCase().includes(searchTerm) ||
            msg.senderName?.toLowerCase().includes(searchTerm)
        );

        this.renderMessages(this.searchResults);

        // Highlight search results
        if (this.searchResults.length > 0) {
            showNotification(`Ditemukan ${this.searchResults.length} pesan`, 'info', 2000);
        }
    }

    /**
     * Toggle search bar
     */
    toggleSearchBar() {
        const searchContainer = document.querySelector('.search-container');
        const searchInput = document.getElementById('searchChat');
        
        if (searchContainer.style.display === 'none') {
            searchContainer.style.display = 'block';
            searchInput.focus();
        } else {
            searchContainer.style.display = 'none';
            searchInput.value = '';
            this.isSearching = false;
            this.renderMessages(this.allMessages);
        }
    }

    /**
     * Scroll to bottom
     */
    scrollToBottom(smooth = false) {
        const container = document.getElementById('messageContainer');
        if (container) {
            setTimeout(() => {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: smooth ? 'smooth' : 'instant'
                });
            }, 100);
        }
    }

    /**
     * Handle scroll position
     */
    handleScroll() {
        const container = document.getElementById('messageContainer');
        const scrollBtn = document.getElementById('scrollToBottom');
        
        if (container && scrollBtn) {
            const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
            scrollBtn.style.display = isAtBottom ? 'none' : 'flex';
        }
    }

    /**
     * Close chat
     */
    closeChat() {
        document.getElementById('chatArea').style.display = 'none';
        document.getElementById('welcomeScreen').style.display = 'flex';
        document.getElementById('groupInfoBtn').style.display = 'none';
        
        // Unsubscribe from messages
        if (this.messagesListener) {
            this.messagesListener();
            this.messagesListener = null;
        }

        this.currentGroupId = null;
        this.allMessages = [];

        // Show sidebar on mobile
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('hidden');
        }
    }

    /**
     * Show empty chat message
     */
    showEmptyChat(message) {
        const messagesList = document.getElementById('messagesList');
        if (messagesList) {
            messagesList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-comments" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <p>${message}</p>
                </div>
            `;
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
const chatRenderer = new ChatRenderer();
window.chatRenderer = chatRenderer;

export default chatRenderer;
