// src/chat/send.js
// Send Message Module - Text Messages, Voice Notes, Forward Messages

import {
    db,
    collection,
    addDoc,
    serverTimestamp,
    doc,
    getDoc
} from '../database/firebase-config.js';

import { showNotification } from '../utils/notification.js';
import authManager from '../auth/login.js';
import storageLocal from '../utils/storage-local.js';
import aiAssistant from '../utils/ai-assistant.js';

class SendMessage {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.recordingStartTime = null;
        this.recordingTimer = null;
        this.replyTo = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Send message button
        document.getElementById('sendMessageBtn')?.addEventListener('click', () => {
            this.sendTextMessage();
        });

        // Enter key to send
        document.getElementById('messageInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendTextMessage();
            }
        });

        // Voice note button
        document.getElementById('voiceNoteBtn')?.addEventListener('click', () => {
            if (this.isRecording) {
                this.stopRecording();
            } else {
                this.startRecording();
            }
        });

        // Cancel reply
        document.getElementById('cancelReply')?.addEventListener('click', () => {
            this.cancelReply();
        });

        // Auto-resize textarea
        const textarea = document.getElementById('messageInput');
        textarea?.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        });
    }

    /**
     * Send text message
     */
    async sendTextMessage() {
        const input = document.getElementById('messageInput');
        const messageText = input.value.trim();
        
        if (!messageText) return;

        const groupId = window.groupManager?.currentGroupId;
        if (!groupId) {
            showNotification('Pilih grup terlebih dahulu', 'warning');
            return;
        }

        const user = authManager.getCurrentUser();
        if (!user) {
            showNotification('Anda harus login', 'error');
            return;
        }

        // Check if it's an AI command
        if (aiAssistant.isAICommand(messageText)) {
            await this.handleAICommand(messageText, groupId, user);
            input.value = '';
            input.style.height = 'auto';
            return;
        }

        try {
            const messageData = {
                text: messageText,
                senderId: user.uid,
                senderName: user.displayName || 'Pengguna',
                senderEmail: user.email,
                timestamp: serverTimestamp(),
                type: 'text',
                edited: false
            };

            // Add reply info if replying
            if (this.replyTo) {
                messageData.replyTo = {
                    messageId: this.replyTo.id,
                    senderName: this.replyTo.senderName,
                    text: this.replyTo.text
                };
                this.cancelReply();
            }

            await addDoc(collection(db, 'groups', groupId, 'messages'), messageData);
            
            // Clear input
            input.value = '';
            input.style.height = 'auto';

        } catch (error) {
            console.error('Error sending message:', error);
            showNotification('Gagal mengirim pesan', 'error');
        }
    }

    /**
     * Handle AI command
     */
    async handleAICommand(messageText, groupId, user) {
        try {
            // Show typing indicator
            const typingMessage = {
                text: '🤔 AI sedang berpikir...',
                senderId: 'ai-bot',
                senderName: 'Aetheris AI',
                timestamp: serverTimestamp(),
                type: 'text',
                isAI: true
            };

            const tempDoc = await addDoc(collection(db, 'groups', groupId, 'messages'), typingMessage);

            // Get AI response
            const groupDoc = await getDoc(doc(db, 'groups', groupId));
            const groupName = groupDoc.exists() ? groupDoc.data().name : 'Grup';
            
            const aiResponse = await aiAssistant.getAIResponse(messageText, user.displayName);
            const sanitizedResponse = aiAssistant.sanitizeResponse(aiResponse);

            // Remove typing message
            await tempDoc.delete();

            // Send AI response
            await addDoc(collection(db, 'groups', groupId, 'messages'), {
                text: sanitizedResponse,
                senderId: 'ai-bot',
                senderName: 'Aetheris AI 🤖',
                timestamp: serverTimestamp(),
                type: 'ai',
                isAI: true
            });

        } catch (error) {
            console.error('Error handling AI command:', error);
            
            // Send error message
            await addDoc(collection(db, 'groups', groupId, 'messages'), {
                text: 'Maaf, AI sedang sibuk. Silakan coba lagi nanti! 🙏',
                senderId: 'ai-bot',
                senderName: 'Aetheris AI 🤖',
                timestamp: serverTimestamp(),
                type: 'ai',
                isAI: true
            });
        }
    }

    /**
     * Forward message to another group
     */
    async forwardMessage(messageData, targetGroupId) {
        try {
            const user = authManager.getCurrentUser();
            if (!user) throw new Error('Anda harus login');

            const forwardData = {
                text: messageData.text,
                senderId: user.uid,
                senderName: user.displayName || 'Pengguna',
                timestamp: serverTimestamp(),
                type: 'text',
                forwarded: true,
                forwardedFrom: messageData.senderName || 'Unknown'
            };

            await addDoc(collection(db, 'groups', targetGroupId, 'messages'), forwardData);
            showNotification('Pesan berhasil diteruskan! ✅', 'success');

        } catch (error) {
            console.error('Error forwarding message:', error);
            showNotification('Gagal meneruskan pesan', 'error');
        }
    }

    /**
     * Start voice recording
     */
    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
            });
            
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = async () => {
                await this.saveVoiceNote();
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.recordingStartTime = Date.now();

            // Update UI
            const voiceBtn = document.getElementById('voiceNoteBtn');
            voiceBtn.style.color = 'var(--danger-color)';
            voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';

            // Show recording indicator
            this.showRecordingIndicator();
            
            // Start timer
            this.startRecordingTimer();

        } catch (error) {
            console.error('Error starting recording:', error);
            showNotification('Gagal memulai rekaman. Pastikan mikrofon diizinkan.', 'error');
        }
    }

    /**
     * Stop voice recording
     */
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            // Reset UI
            const voiceBtn = document.getElementById('voiceNoteBtn');
            voiceBtn.style.color = '';
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            
            // Hide recording indicator
            this.hideRecordingIndicator();
            
            // Stop timer
            this.stopRecordingTimer();
        }
    }

    /**
     * Save voice note
     */
    async saveVoiceNote() {
        try {
            const audioBlob = new Blob(this.audioChunks, { 
                type: this.mediaRecorder.mimeType 
            });
            
            // Calculate duration
            const duration = Math.round((Date.now() - this.recordingStartTime) / 1000);

            // Save to localStorage
            const voiceNoteId = await storageLocal.saveVoiceNote(audioBlob);

            // Send voice note message
            const groupId = window.groupManager?.currentGroupId;
            if (groupId) {
                const user = authManager.getCurrentUser();
                if (user) {
                    await addDoc(collection(db, 'groups', groupId, 'messages'), {
                        text: '',
                        senderId: user.uid,
                        senderName: user.displayName || 'Pengguna',
                        timestamp: serverTimestamp(),
                        type: 'voice',
                        voiceNoteId: voiceNoteId,
                        duration: duration
                    });
                }
            }

            showNotification(`Voice note tersimpan (${duration} detik) 🎙️`, 'success');

        } catch (error) {
            console.error('Error saving voice note:', error);
            showNotification('Gagal menyimpan voice note', 'error');
        }
    }

    /**
     * Show recording indicator
     */
    showRecordingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'recordingIndicator';
        indicator.className = 'recording-indicator';
        indicator.innerHTML = `
            <i class="fas fa-microphone"></i>
            <div class="recording-time" id="recordingTime">00:00</div>
            <p style="color: var(--text-secondary); margin-top: 8px;">Merekam...</p>
        `;
        document.body.appendChild(indicator);
    }

    /**
     * Hide recording indicator
     */
    hideRecordingIndicator() {
        const indicator = document.getElementById('recordingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * Start recording timer
     */
    startRecordingTimer() {
        this.recordingTimer = setInterval(() => {
            const elapsed = Math.round((Date.now() - this.recordingStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            
            const timeDisplay = document.getElementById('recordingTime');
            if (timeDisplay) {
                timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }

            // Auto stop after 5 minutes
            if (elapsed >= 300) {
                this.stopRecording();
            }
        }, 1000);
    }

    /**
     * Stop recording timer
     */
    stopRecordingTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    }

    /**
     * Set reply target
     */
    setReply(messageData) {
        this.replyTo = messageData;
        
        document.getElementById('replyText').textContent = 
            messageData.text.substring(0, 50) + (messageData.text.length > 50 ? '...' : '');
        document.getElementById('replyPreview').style.display = 'flex';
        
        // Focus on input
        document.getElementById('messageInput').focus();
    }

    /**
     * Cancel reply
     */
    cancelReply() {
        this.replyTo = null;
        document.getElementById('replyPreview').style.display = 'none';
    }
}

// Create singleton instance
const sendMessage = new SendMessage();
window.sendMessage = sendMessage;

export default sendMessage;
