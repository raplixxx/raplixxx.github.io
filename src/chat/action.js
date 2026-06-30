// src/chat/action.js
// Message Actions Module - Edit Messages, Reactions, Forward Modal

import {
    db,
    doc,
    updateDoc,
    getDoc,
    arrayUnion,
    increment,
    serverTimestamp
} from '../database/firebase-config.js';

import { showNotification } from '../utils/notification.js';
import authManager from '../auth/login.js';

class ChatActions {
    constructor() {
        this.reactionEmojis = ['👍', '❤️', '😂', '🔥', '😮', '😢', '👏', '🎉'];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Emoji button
        document.getElementById('emojiBtn')?.addEventListener('click', () => {
            this.toggleEmojiPicker();
        });

        // Close emoji picker when clicking outside
        document.addEventListener('click', (e) => {
            const emojiPicker = document.getElementById('emojiPicker');
            const emojiBtn = document.getElementById('emojiBtn');
            
            if (emojiPicker && emojiBtn) {
                if (!emojiPicker.contains(e.target) && !emojiBtn.contains(e.target)) {
                    emojiPicker.style.display = 'none';
                }
            }
        });

        // Render emoji grid
        this.renderEmojiGrid();
    }

    /**
     * Edit a message
     */
    async editMessage(messageId) {
        try {
            const user = authManager.getCurrentUser();
            if (!user) throw new Error('Anda harus login');

            const groupId = window.chatRenderer?.currentGroupId;
            if (!groupId) throw new Error('Grup tidak dipilih');

            // Get current message
            const messageRef = doc(db, 'groups', groupId, 'messages', messageId);
            const messageDoc = await getDoc(messageRef);

            if (!messageDoc.exists()) throw new Error('Pesan tidak ditemukan');

            const messageData = messageDoc.data();

            // Check ownership
            if (messageData.senderId !== user.uid) {
                throw new Error('Anda hanya bisa mengedit pesan sendiri');
            }

            // Prompt for new text
            const newText = prompt('Edit pesan:', messageData.text);
            
            if (newText === null) return; // Cancelled
            if (newText.trim() === '') {
                showNotification('Pesan tidak boleh kosong', 'warning');
                return;
            }

            // Update message
            await updateDoc(messageRef, {
                text: newText.trim(),
                edited: true,
                editedAt: serverTimestamp()
            });

            showNotification('Pesan berhasil diedit ✅', 'success');

        } catch (error) {
            console.error('Error editing message:', error);
            showNotification(error.message || 'Gagal mengedit pesan', 'error');
        }
    }

    /**
     * Add reaction to message
     */
    async addReaction(messageId, emoji) {
        try {
            const user = authManager.getCurrentUser();
            if (!user) throw new Error('Anda harus login');

            const groupId = window.chatRenderer?.currentGroupId;
            if (!groupId) throw new Error('Grup tidak dipilih');

            const messageRef = doc(db, 'groups', groupId, 'messages', messageId);
            
            // Update reaction count
            await updateDoc(messageRef, {
                [`reactions.${emoji}`]: increment(1),
                [`userReactions`]: arrayUnion(`${user.uid}_${emoji}`)
            });

        } catch (error) {
            console.error('Error adding reaction:', error);
            showNotification('Gagal menambahkan reaksi', 'error');
        }
    }

    /**
     * Remove reaction from message
     */
    async removeReaction(messageId, emoji) {
        try {
            const user = authManager.getCurrentUser();
            if (!user) throw new Error('Anda harus login');

            const groupId = window.chatRenderer?.currentGroupId;
            if (!groupId) throw new Error('Grup tidak dipilih');

            const messageRef = doc(db, 'groups', groupId, 'messages', messageId);
            
            await updateDoc(messageRef, {
                [`reactions.${emoji}`]: increment(-1)
            });

        } catch (error) {
            console.error('Error removing reaction:', error);
        }
    }

    /**
     * Show reaction picker for a message
     */
    showReactionPicker(messageId) {
        const reactionPicker = document.createElement('div');
        reactionPicker.className = 'reaction-picker';
        reactionPicker.style.cssText = `
            position: absolute;
            background: var(--bg-secondary);
            border-radius: 24px;
            padding: 8px;
            box-shadow: var(--shadow-lg);
            display: flex;
            gap: 4px;
            z-index: 100;
            animation: slideUp 0.2s ease;
        `;

        this.reactionEmojis.forEach(emoji => {
            const emojiBtn = document.createElement('button');
            emojiBtn.textContent = emoji;
            emojiBtn.style.cssText = `
                width: 36px;
                height: 36px;
                border: none;
                background: transparent;
                font-size: 20px;
                cursor: pointer;
                border-radius: 50%;
                transition: transform 0.2s;
            `;
            emojiBtn.onmouseenter = () => emojiBtn.style.transform = 'scale(1.3)';
            emojiBtn.onmouseleave = () => emojiBtn.style.transform = 'scale(1)';
            emojiBtn.onclick = () => {
                this.addReaction(messageId, emoji);
                reactionPicker.remove();
            };
            reactionPicker.appendChild(emojiBtn);
        });

        // Position near the message
        const messageElement = document.getElementById(`msg-${messageId}`);
        if (messageElement) {
            const rect = messageElement.getBoundingClientRect();
            reactionPicker.style.position = 'fixed';
            reactionPicker.style.top = `${rect.top - 50}px`;
            reactionPicker.style.left = `${rect.left}px`;
            document.body.appendChild(reactionPicker);

            // Remove when clicking outside
            const removePicker = (e) => {
                if (!reactionPicker.contains(e.target)) {
                    reactionPicker.remove();
                    document.removeEventListener('click', removePicker);
                }
            };
            setTimeout(() => document.addEventListener('click', removePicker), 100);
        }
    }

    /**
     * Toggle emoji picker for message input
     */
    toggleEmojiPicker() {
        const emojiPicker = document.getElementById('emojiPicker');
        if (emojiPicker) {
            emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
        }
    }

    /**
     * Insert emoji to message input
     */
    insertEmoji(emoji) {
        const input = document.getElementById('messageInput');
        if (input) {
            const start = input.selectionStart;
            const end = input.selectionEnd;
            const text = input.value;
            
            input.value = text.substring(0, start) + emoji + text.substring(end);
            input.selectionStart = input.selectionEnd = start + emoji.length;
            input.focus();
        }
    }

    /**
     * Render emoji grid
     */
    renderEmojiGrid() {
        const emojiGrid = document.querySelector('.emoji-grid');
        if (!emojiGrid) return;

        const commonEmojis = [
            '😀', '😂', '🤣', '😊', '😍', '🤗', '😎', '🤩',
            '👍', '👎', '👏', '🙌', '💪', '🤝', '✌️', '🤞',
            '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
            '🎉', '🎊', '🎈', '🎁', '🏆', '⭐', '🔥', '💯',
            '😢', '😭', '😤', '😡', '🤬', '😱', '😨', '😰',
            '🍕', '🍔', '🌮', '🍩', '☕', '🍺', '🎂', '🍪'
        ];

        emojiGrid.innerHTML = commonEmojis.map(emoji => `
            <button class="emoji-item" onclick="window.chatActions.insertEmoji('${emoji}')">
                ${emoji}
            </button>
        `).join('');
    }

    /**
     * Show forward modal
     */
    async showForwardModal(messageId) {
        try {
            const user = authManager.getCurrentUser();
            if (!user) throw new Error('Anda harus login');

            // Get user's groups
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) throw new Error('User tidak ditemukan');

            const userGroups = userDoc.data().groups || [];
            
            if (userGroups.length === 0) {
                showNotification('Anda belum memiliki grup lain', 'warning');
                return;
            }

            // Get group details
            const groupPromises = userGroups.map(async (groupId) => {
                if (groupId === window.chatRenderer?.currentGroupId) return null;
                const groupDoc = await getDoc(doc(db, 'groups', groupId));
                return groupDoc.exists() ? { id: groupId, ...groupDoc.data() } : null;
            });

            const groups = (await Promise.all(groupPromises)).filter(g => g !== null && g.isActive);

            if (groups.length === 0) {
                showNotification('Tidak ada grup lain untuk meneruskan pesan', 'warning');
                return;
            }

            // Create forward modal
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.cssText = 'display: flex;';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Teruskan Pesan</h3>
                        <button class="close-modal icon-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p style="margin-bottom: 16px; color: var(--text-secondary);">Pilih grup tujuan:</p>
                        <div style="max-height: 300px; overflow-y: auto;">
                            ${groups.map(group => `
                                <div class="chat-item" style="cursor: pointer;" 
                                     onclick="window.sendMessage.forwardMessage(
                                         window.chatRenderer.allMessages.find(m => m.id === '${messageId}'),
                                         '${group.id}'
                                     ); this.closest('.modal').remove();">
                                    <div style="width: 40px; height: 40px; border-radius: 50%; 
                                         background: linear-gradient(135deg, #667eea, #764ba2);
                                         display: flex; align-items: center; justify-content: center;
                                         color: white; font-weight: 600;">
                                        ${group.name.charAt(0)}
                                    </div>
                                    <div class="chat-item-info">
                                        <div class="chat-item-name">${this.escapeHtml(group.name)}</div>
                                        <div class="chat-item-preview">${group.memberCount} anggota</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Close button
            modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
            
            // Close on background click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });

        } catch (error) {
            console.error('Error showing forward modal:', error);
            showNotification('Gagal memuat grup', 'error');
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
const chatActions = new ChatActions();
window.chatActions = chatActions;

export default chatActions;
