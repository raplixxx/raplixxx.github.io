// src/chat/send.js (UPDATE)
// KIRIM PESAN PRIVAT + GRUP

let activeChatId = null;
let activeChatPartnerUID = null;

// ==========================================
// KIRIM PESAN (Gabungan Private & Grup)
// ==========================================
document.getElementById('sendBtn').addEventListener('click', function() {
    if (currentGroupId) {
        sendGroupMessage();
    } else if (activeChatId) {
        sendPrivateMessage();
    }
});

document.getElementById('messageInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('sendBtn').click();
    }
});

// ==========================================
// KIRIM PESAN PRIVAT
// ==========================================
function sendPrivateMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text || !currentUser || !activeChatId) return;
    
    // Cek AI command
    if (text.toLowerCase().startsWith('@bot')) {
        handleAIPrivateMessage(text);
        input.value = '';
        input.style.height = 'auto';
        return;
    }
    
    const messageData = {
        text: text,
        senderUID: currentUser.uid,
        senderName: currentUser.displayName || 'Pengguna',
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        type: 'text',
        edited: false
    };
    
    // Tambah reply jika ada
    if (replyTarget) {
        messageData.replyTo = {
            messageId: replyTarget.id,
            senderName: replyTarget.senderName,
            text: replyTarget.text
        };
        cancelReply();
    }
    
    db.collection('chats').doc(activeChatId).collection('messages').add(messageData)
        .then(() => console.log('✅ Pesan terkirim'))
        .catch((err) => {
            console.error('❌ Gagal kirim:', err);
            showNotif('Gagal mengirim pesan', 'error');
        });
    
    input.value = '';
    input.style.height = 'auto';
}

// ==========================================
// BUKA CHAT PRIVAT
// ==========================================
function openPrivateChat(partnerUID) {
    if (!currentUser || !partnerUID) return;
    
    activeChatPartnerUID = partnerUID;
    currentGroupId = null;
    
    // Buat ID chat unik
    const uids = [currentUser.uid, partnerUID].sort();
    activeChatId = 'private_' + uids[0] + '_' + uids[1];
    
    // Tampilkan chat area
    document.getElementById('blankChat').style.display = 'none';
    document.getElementById('activeChat').style.display = 'flex';
    
    // Ambil data partner
    db.collection('users').doc(partnerUID).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('chatPartnerName').textContent = data.displayName || 'Pengguna';
            document.getElementById('chatPartnerAvatar').src = data.photoURL || '';
            document.getElementById('chatPartnerStatus').textContent = data.status === 'online' ? 'Online' : 'Offline';
            document.getElementById('chatPartnerStatus').style.color = data.status === 'online' ? '#4caf50' : 'var(--text-secondary)';
        }
    });
    
    // Load pesan
    loadPrivateMessages(activeChatId);
}

// ==========================================
// LOAD PESAN PRIVAT
// ==========================================
function loadPrivateMessages(chatId) {
    db.collection('chats').doc(chatId).collection('messages')
        .orderBy('timestamp', 'asc')
        .onSnapshot((snapshot) => {
            const messagesList = document.getElementById('messagesList');
            messagesList.innerHTML = '';
            
            snapshot.forEach((doc) => {
                const msg = doc.data();
                msg.id = doc.id;
                const isMe = msg.senderUID === currentUser?.uid;
                messagesList.innerHTML += renderPrivateMessage(msg, isMe);
            });
            
            // Scroll ke bawah
            const container = document.getElementById('messagesContainer');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }, (error) => {
            console.error('Error loading messages:', error);
        });
}

// ==========================================
// AI PRIVATE MESSAGE
// ==========================================
async function handleAIPrivateMessage(text) {
    const question = text.replace(/^@bot\s*/i, '');
    
    const placeholderRef = await db.collection('chats').doc(activeChatId).collection('messages').add({
        text: '🤔 AI sedang berpikir...',
        senderUID: 'ai',
        senderName: 'Aetheris AI',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    try {
        const response = await fetch('https://ai.sumopod.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer sk-f-cGux8U_fsibMTbLa1utw'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: question }],
                max_tokens: 150
            })
        });
        
        const data = await response.json();
        const answer = data.choices?.[0]?.message?.content || 'Maaf, AI sedang sibuk 🙏';
        
        await placeholderRef.delete();
        await db.collection('chats').doc(activeChatId).collection('messages').add({
            text: answer,
            senderUID: 'ai',
            senderName: '🤖 Aetheris AI',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch {
        await placeholderRef.delete();
        await db.collection('chats').doc(activeChatId).collection('messages').add({
            text: 'Maaf, AI sedang tidak tersedia 🙏',
            senderUID: 'ai',
            senderName: '🤖 Aetheris AI',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
}

// ==========================================
// TUTUP CHAT
// ==========================================
document.getElementById('closeChatBtn')?.addEventListener('click', function() {
    document.getElementById('activeChat').style.display = 'none';
    document.getElementById('blankChat').style.display = 'flex';
    activeChatId = null;
    activeChatPartnerUID = null;
    currentGroupId = null;
    cancelReply();
});

// ==========================================
// RECORD VOICE NOTE
// ==========================================
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recordingStartTime = null;

document.getElementById('voiceNoteBtn')?.addEventListener('click', async function() {
    if (isRecording) {
        stopRecording();
    } else {
        await startRecording();
    }
});

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const duration = Math.round((Date.now() - recordingStartTime) / 1000);
            await saveVoiceNote(audioBlob, duration);
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        isRecording = true;
        recordingStartTime = Date.now();
        
        // Update UI
        const btn = document.getElementById('voiceNoteBtn');
        btn.innerHTML = '<i class="fas fa-stop" style="color: #ef5350;"></i>';
        
        showNotif('Merekam... 🎙️', 'info');
        
        // Auto-stop after 5 minutes
        setTimeout(() => {
            if (isRecording) stopRecording();
        }, 300000);
        
    } catch (error) {
        console.error('Gagal merekam:', error);
        showNotif('Gagal mengakses mikrofon', 'error');
    }
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        
        const btn = document.getElementById('voiceNoteBtn');
        btn.innerHTML = '<i class="fas fa-microphone"></i>';
        
        showNotif('Rekaman selesai ✅', 'success');
    }
}

async function saveVoiceNote(audioBlob, duration) {
    const base64 = await blobToBase64(audioBlob);
    const voiceNoteId = 'vn_' + Date.now();
    
    // Simpan ke localStorage
    const voiceNotes = JSON.parse(localStorage.getItem('rc_voice_notes') || '[]');
    voiceNotes.push({ id: voiceNoteId, data: base64, timestamp: Date.now(), duration });
    localStorage.setItem('rc_voice_notes', JSON.stringify(voiceNotes));
    
    // Kirim sebagai pesan
    const chatId = currentGroupId ? 
        ['groups', currentGroupId, 'messages'].join('/') :
        ['chats', activeChatId, 'messages'].join('/');
    
    const parts = chatId.split('/');
    const collectionRef = parts[0] === 'groups' ?
        db.collection('groups').doc(parts[1]).collection('messages') :
        db.collection('chats').doc(parts[1]).collection('messages');
    
    await collectionRef.add({
        text: '',
        senderUID: currentUser.uid,
        senderName: currentUser.displayName || 'Pengguna',
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        type: 'voice',
        voiceNoteId: voiceNoteId,
        duration: duration
    });
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function getVoiceNote(id) {
    const voiceNotes = JSON.parse(localStorage.getItem('rc_voice_notes') || '[]');
    return voiceNotes.find(vn => vn.id === id) || null;
}

console.log('✅ Send module loaded');
