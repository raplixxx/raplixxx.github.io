// src/chat/send.js
// KIRIM PESAN

let activeChatId = null;
let activeChatPartnerUID = null;

document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('messageInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text || !currentUser || !activeChatId) return;
    
    // Cek apakah pesan untuk AI
    if (text.toLowerCase().startsWith('@bot')) {
        handleAIMessage(text, activeChatId);
        input.value = '';
        return;
    }
    
    // Kirim ke Firestore
    db.collection('chats').doc(activeChatId).collection('messages').add({
        text: text,
        senderUID: currentUser.uid,
        senderName: currentUser.displayName || 'Pengguna',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        console.log('✅ Pesan terkirim');
    }).catch((err) => {
        console.error('❌ Gagal kirim:', err);
        showNotif('Gagal mengirim pesan', 'error');
    });
    
    input.value = '';
    input.style.height = 'auto';
}

function openPrivateChat(partnerUID) {
    if (!currentUser) return;
    
    activeChatPartnerUID = partnerUID;
    
    // Buat ID chat unik (gabungan 2 UID, diurutkan)
    const uids = [currentUser.uid, partnerUID].sort();
    activeChatId = 'private_' + uids[0] + '_' + uids[1];
    
    // Tampilkan area chat
    document.getElementById('blankChat').style.display = 'none';
    document.getElementById('activeChat').style.display = 'flex';
    
    // Ambil data partner
    db.collection('users').doc(partnerUID).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('chatPartnerName').textContent = data.displayName || 'Pengguna';
            document.getElementById('chatPartnerAvatar').src = data.photoURL || '';
            document.getElementById('chatPartnerStatus').textContent = data.status === 'online' ? 'Online' : 'Offline';
        }
    });
    
    // Mulai listener pesan
    loadMessages(activeChatId);
}

function loadMessages(chatId) {
    db.collection('chats').doc(chatId).collection('messages')
        .orderBy('timestamp', 'asc')
        .onSnapshot((snapshot) => {
            const list = document.getElementById('messagesList');
            list.innerHTML = '';
            
            snapshot.forEach((doc) => {
                const msg = doc.data();
                const isMe = msg.senderUID === currentUser.uid;
                const time = msg.timestamp ? msg.timestamp.toDate().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '';
                
                list.innerHTML += `
                    <div style="display: flex; flex-direction: column; align-items: ${isMe ? 'flex-end' : 'flex-start'}; margin-bottom: 4px;">
                        <div style="max-width: 70%; padding: 8px 12px; border-radius: 8px; 
                             background: ${isMe ? 'var(--bg-message-sent)' : 'var(--bg-message-received)'};
                             color: var(--text-message); font-size: 14px; word-wrap: break-word;">
                            ${msg.text}
                        </div>
                        <span style="font-size: 10px; color: var(--text-secondary); margin-top: 2px;">${time}</span>
                    </div>
                `;
            });
            
            // Scroll ke bawah
            const container = document.getElementById('messagesContainer');
            container.scrollTop = container.scrollHeight;
        });
}

document.getElementById('closeChatBtn').addEventListener('click', function() {
    document.getElementById('activeChat').style.display = 'none';
    document.getElementById('blankChat').style.display = 'flex';
    activeChatId = null;
    activeChatPartnerUID = null;
});
