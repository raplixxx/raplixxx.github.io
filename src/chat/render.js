// src/chat/render.js
// RENDER PESAN - Tampilan balon chat, search, reply, forward

// ==========================================
// RENDER PRIVATE MESSAGE
// ==========================================
function renderPrivateMessage(msg, isMe) {
    const time = msg.timestamp ? msg.timestamp.toDate().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '';
    const isAI = msg.senderUID === 'ai';
    
    let attachmentHTML = '';
    
    // Reply attachment
    if (msg.replyTo) {
        attachmentHTML = `
            <div class="reply-attachment">
                <div class="reply-sender">↩ ${escapeHTML(msg.replyTo.senderName || '')}</div>
                <div style="font-size: 12px; color: var(--text-secondary);">${escapeHTML((msg.replyTo.text || '').substring(0, 100))}</div>
            </div>
        `;
    }
    
    // Forward label
    if (msg.forwarded) {
        attachmentHTML += `
            <div class="forwarded-label">↗ Diteruskan</div>
        `;
    }
    
    // Voice note
    if (msg.type === 'voice') {
        return `
            <div class="message-wrapper ${isMe ? 'sent' : 'received'}">
                <div class="message-bubble">
                    <div class="voice-note" data-voice-id="${msg.voiceNoteId || ''}">
                        <button class="voice-play-btn" onclick="playVoiceNote('${msg.voiceNoteId}', this)">
                            <i class="fas fa-play"></i>
                        </button>
                        <div class="voice-waveform">
                            <div class="voice-progress" style="width: 0%"></div>
                        </div>
                        <span class="voice-duration">${formatDuration(msg.duration || 0)}</span>
                    </div>
                    <div class="message-meta">
                        <span class="message-time">${time}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="message-wrapper ${isMe ? 'sent' : 'received'} ${isAI ? 'ai-message' : ''}">
            <div class="message-bubble">
                ${attachmentHTML}
                <div class="message-text">${formatMessage(escapeHTML(msg.text || ''))}</div>
                <div class="message-meta">
                    <span class="message-time">${time}</span>
                    ${msg.edited ? '<span class="message-edited">(diedit)</span>' : ''}
                </div>
            </div>
            ${msg.reactions ? renderReactions(msg.reactions) : ''}
        </div>
    `;
}

// ==========================================
// FORMAT PESAN
// ==========================================
function formatMessage(text) {
    // URL jadi link
    text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color: var(--accent-color); text-decoration: underline;">$1</a>');
    // Newline jadi <br>
    text = text.replace(/\n/g, '<br>');
    return text;
}

// ==========================================
// RENDER REACTIONS
// ==========================================
function renderReactions(reactions) {
    if (!reactions || Object.keys(reactions).length === 0) return '';
    
    let html = '<div class="message-reactions">';
    for (const [emoji, count] of Object.entries(reactions)) {
        html += `<span class="reaction-badge">${emoji} ${count}</span>`;
    }
    html += '</div>';
    return html;
}

// ==========================================
// FORMAT DURATION
// ==========================================
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

// ==========================================
// PLAY VOICE NOTE
// ==========================================
function playVoiceNote(voiceNoteId, button) {
    if (!voiceNoteId) return;
    
    const voiceNote = getVoiceNote(voiceNoteId);
    if (!voiceNote) {
        showNotif('Voice note tidak ditemukan', 'error');
        return;
    }
    
    const audio = new Audio(voiceNote.data);
    const icon = button.querySelector('i');
    
    audio.onplay = () => { icon.className = 'fas fa-pause'; };
    audio.onpause = () => { icon.className = 'fas fa-play'; };
    audio.onended = () => { icon.className = 'fas fa-play'; };
    
    audio.play().catch(() => {
        showNotif('Gagal memutar voice note', 'error');
    });
}

// ==========================================
// SEARCH PESAN
// ==========================================
let searchMode = false;
let allMessagesCache = [];

document.getElementById('searchInput')?.addEventListener('input', function(e) {
    const query = e.target.value.trim().toLowerCase();
    
    if (!query) {
        searchMode = false;
        // Kembalikan tampilan normal
        return;
    }
    
    searchMode = true;
    // Filter pesan di UI
    document.querySelectorAll('.message-wrapper').forEach(el => {
        const text = el.textContent.toLowerCase();
        el.style.display = text.includes(query) ? 'flex' : 'none';
        if (text.includes(query)) {
            el.style.background = 'rgba(255, 255, 0, 0.2)';
        }
    });
});

// ==========================================
// REPLY PESAN
// ==========================================
let replyTarget = null;

function setReplyTarget(msg) {
    replyTarget = msg;
    document.getElementById('replyPreview').style.display = 'flex';
    document.getElementById('replyText').textContent = (msg.text || '').substring(0, 50);
    document.getElementById('messageInput').focus();
}

function cancelReply() {
    replyTarget = null;
    document.getElementById('replyPreview').style.display = 'none';
}

// ==========================================
// EDIT PESAN
// ==========================================
async function editMessage(chatId, messageId, oldText) {
    const newText = prompt('Edit pesan:', oldText);
    if (!newText || newText.trim() === '') return;
    
    try {
        await db.collection('chats').doc(chatId).collection('messages').doc(messageId).update({
            text: newText.trim(),
            edited: true,
            editedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showNotif('Pesan berhasil diedit ✅', 'success');
    } catch (error) {
        showNotif('Gagal edit pesan', 'error');
    }
}

// ==========================================
// FORWARD PESAN
// ==========================================
async function forwardMessage(msg, targetGroupId) {
    if (!currentUser || !targetGroupId) return;
    
    try {
        await db.collection('groups').doc(targetGroupId).collection('messages').add({
            text: msg.text,
            senderUID: currentUser.uid,
            senderName: currentUser.displayName || 'Pengguna',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            forwarded: true,
            forwardedFrom: msg.senderName || 'Unknown'
        });
        showNotif('Pesan berhasil diteruskan ✅', 'success');
    } catch (error) {
        showNotif('Gagal meneruskan pesan', 'error');
    }
}

// ==========================================
// REACTIONS
// ==========================================
const QUICK_REACTIONS = ['👍', '❤️', '😂', '🔥', '😮', '😢', '👏'];

async function addReaction(chatId, messageId, emoji) {
    if (!currentUser) return;
    
    try {
        const ref = db.collection('chats').doc(chatId).collection('messages').doc(messageId);
        await ref.update({
            [`reactions.${emoji}`]: firebase.firestore.FieldValue.increment(1)
        });
    } catch (error) {
        console.error('Gagal tambah reaksi:', error);
    }
}

function showReactionPicker(chatId, messageId, event) {
    const existing = document.querySelector('.reaction-picker');
    if (existing) existing.remove();
    
    const picker = document.createElement('div');
    picker.className = 'reaction-picker';
    picker.style.cssText = `
        position: fixed;
        background: var(--bg-secondary);
        border-radius: 24px;
        padding: 8px;
        box-shadow: var(--shadow-lg);
        display: flex;
        gap: 4px;
        z-index: 1000;
        top: ${event.clientY - 60}px;
        left: ${event.clientX - 40}px;
    `;
    
    QUICK_REACTIONS.forEach(emoji => {
        const btn = document.createElement('button');
        btn.textContent = emoji;
        btn.style.cssText = `
            width: 36px; height: 36px; border: none; background: transparent;
            font-size: 20px; cursor: pointer; border-radius: 50%; transition: transform 0.2s;
        `;
        btn.onmouseenter = () => btn.style.transform = 'scale(1.3)';
        btn.onmouseleave = () => btn.style.transform = 'scale(1)';
        btn.onclick = () => {
            addReaction(chatId, messageId, emoji);
            picker.remove();
        };
        picker.appendChild(btn);
    });
    
    document.body.appendChild(picker);
    
    setTimeout(() => {
        document.addEventListener('click', function removePicker() {
            picker.remove();
            document.removeEventListener('click', removePicker);
        });
    }, 100);
}

console.log('✅ Render module loaded');
