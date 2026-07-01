// src/chat/group.js
// MANAJEMEN GRUP - Buat grup, invite link, batasan anggota

let currentGroupId = null;
const MAX_MEMBERS = 1000;

// ==========================================
// BUAT GRUP BARU
// ==========================================
document.getElementById('submitGroupBtn').addEventListener('click', async function() {
    const nameInput = document.getElementById('groupNameInput');
    const errorEl = document.getElementById('groupError');
    const groupName = nameInput.value.trim();
    
    // Validasi
    if (!groupName) {
        errorEl.textContent = 'Nama grup tidak boleh kosong';
        errorEl.style.display = 'block';
        return;
    }
    
    if (groupName.length < 3) {
        errorEl.textContent = 'Nama grup minimal 3 karakter';
        errorEl.style.display = 'block';
        return;
    }
    
    if (!currentUser) {
        errorEl.textContent = 'Anda harus login terlebih dahulu';
        errorEl.style.display = 'block';
        return;
    }
    
    // Disable button
    this.disabled = true;
    this.textContent = 'Membuat...';
    
    try {
        // Generate invite link unik
        const inviteLink = generateGroupInviteCode();
        
        // Simpan ke Firestore
        const docRef = await db.collection('groups').add({
            name: groupName,
            createdBy: currentUser.uid,
            creatorName: currentUser.displayName || 'Pengguna',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            inviteLink: inviteLink,
            members: [currentUser.uid],
            memberCount: 1,
            admins: [currentUser.uid],
            maxMembers: MAX_MEMBERS,
            isActive: true
        });
        
        console.log('✅ Grup berhasil dibuat:', docRef.id);
        showNotif('Grup berhasil dibuat! 🎉', 'success');
        
        // Tutup modal
        document.getElementById('createGroupModal').style.display = 'none';
        nameInput.value = '';
        errorEl.style.display = 'none';
        
        // Refresh daftar grup
        loadGroupList();
        
    } catch (error) {
        console.error('❌ Gagal buat grup:', error);
        errorEl.textContent = 'Gagal membuat grup. Coba lagi.';
        errorEl.style.display = 'block';
    } finally {
        this.disabled = false;
        this.textContent = 'Buat';
    }
});

// ==========================================
// GENERATE INVITE CODE
// ==========================================
function generateGroupInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 20; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// ==========================================
// LOAD DAFTAR GRUP
// ==========================================
function loadGroupList() {
    if (!currentUser) return;
    
    const groupListEl = document.getElementById('groupList');
    
    db.collection('groups')
        .where('members', 'array-contains', currentUser.uid)
        .where('isActive', '==', true)
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            let html = `
                <div style="padding: 16px;">
                    <button id="createGroupBtnSidebar" style="width: 100%; padding: 12px; background: var(--accent-color); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-family: inherit;">
                        <i class="fas fa-plus"></i> Buat Grup Baru
                    </button>
                </div>
            `;
            
            if (snapshot.empty) {
                html += `
                    <div style="padding: 40px; text-align: center; color: var(--text-secondary);">
                        <i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                        <p>Belum ada grup</p>
                    </div>
                `;
            } else {
                snapshot.forEach((doc) => {
                    const group = doc.data();
                    html += `
                        <div class="chat-item" onclick="openGroupChat('${doc.id}')" style="cursor: pointer;">
                            <div class="chat-item-avatar">
                                ${group.name.charAt(0).toUpperCase()}
                            </div>
                            <div class="chat-item-info">
                                <div class="chat-item-header">
                                    <span class="chat-item-name">${escapeHTML(group.name)}</span>
                                    <span class="chat-item-time">${group.memberCount}/${group.maxMembers}</span>
                                </div>
                                <div class="chat-item-preview">
                                    🔗 Kode: ${group.inviteLink.substring(0, 15)}...
                                </div>
                            </div>
                        </div>
                    `;
                });
            }
            
            groupListEl.innerHTML = html;
            
            // Event listener untuk tombol buat grup di sidebar
            document.getElementById('createGroupBtnSidebar')?.addEventListener('click', () => {
                document.getElementById('createGroupModal').style.display = 'flex';
            });
        });
}

// ==========================================
// BUKA GRUP CHAT
// ==========================================
function openGroupChat(groupId) {
    currentGroupId = groupId;
    
    db.collection('groups').doc(groupId).get().then((doc) => {
        if (doc.exists) {
            const group = doc.data();
            
            // Tampilkan chat area
            document.getElementById('blankChat').style.display = 'none';
            document.getElementById('activeChat').style.display = 'flex';
            
            // Update header
            document.getElementById('chatPartnerName').textContent = group.name;
            document.getElementById('chatPartnerAvatar').src = '';
            document.getElementById('chatPartnerStatus').textContent = `${group.memberCount} anggota`;
            
            // Load pesan grup
            loadGroupMessages(groupId);
        }
    });
}

// ==========================================
// LOAD PESAN GRUP
// ==========================================
function loadGroupMessages(groupId) {
    db.collection('groups').doc(groupId).collection('messages')
        .orderBy('timestamp', 'asc')
        .onSnapshot((snapshot) => {
            const messagesList = document.getElementById('messagesList');
            messagesList.innerHTML = '';
            
            snapshot.forEach((doc) => {
                const msg = doc.data();
                const isMe = msg.senderUID === currentUser?.uid;
                const isAI = msg.senderUID === 'ai';
                const time = msg.timestamp ? msg.timestamp.toDate().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '';
                
                messagesList.innerHTML += `
                    <div class="message-wrapper ${isMe ? 'sent' : 'received'} ${isAI ? 'ai-message' : ''}">
                        ${!isMe ? `<div style="font-size: 11px; color: var(--accent-color); margin-bottom: 2px; padding-left: 8px;">${escapeHTML(msg.senderName || '')}</div>` : ''}
                        <div class="message-bubble">
                            <div class="message-text">${escapeHTML(msg.text || '')}</div>
                            <div class="message-meta">
                                <span class="message-time">${time}</span>
                                ${msg.edited ? '<span class="message-edited">(diedit)</span>' : ''}
                            </div>
                        </div>
                    </div>
                `;
            });
            
            // Scroll ke bawah
            const container = document.getElementById('messagesContainer');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        });
}

// ==========================================
// KIRIM PESAN GRUP
// ==========================================
function sendGroupMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text || !currentUser || !currentGroupId) return;
    
    // Cek AI command
    if (text.toLowerCase().startsWith('@bot')) {
        handleAIGroupMessage(text, currentGroupId);
        input.value = '';
        return;
    }
    
    db.collection('groups').doc(currentGroupId).collection('messages').add({
        text: text,
        senderUID: currentUser.uid,
        senderName: currentUser.displayName || 'Pengguna',
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        edited: false
    }).then(() => {
        console.log('✅ Pesan grup terkirim');
    }).catch((err) => {
        console.error('❌ Gagal kirim:', err);
        showNotif('Gagal mengirim pesan', 'error');
    });
    
    input.value = '';
}

// ==========================================
// JOIN GRUP VIA LINK
// ==========================================
async function joinGroupViaLink(inviteLink) {
    if (!currentUser) {
        showNotif('Login dulu ya!', 'warning');
        return;
    }
    
    try {
        const snapshot = await db.collection('groups')
            .where('inviteLink', '==', inviteLink)
            .where('isActive', '==', true)
            .limit(1)
            .get();
        
        if (snapshot.empty) {
            showNotif('Link undangan tidak valid', 'error');
            return;
        }
        
        const doc = snapshot.docs[0];
        const group = doc.data();
        
        // Cek batas anggota
        if (group.memberCount >= group.maxMembers) {
            showNotif('Grup sudah penuh (maks 1.000 anggota)', 'error');
            return;
        }
        
        // Cek sudah jadi anggota
        if (group.members.includes(currentUser.uid)) {
            showNotif('Kamu sudah jadi anggota grup ini', 'info');
            openGroupChat(doc.id);
            return;
        }
        
        // Tambah anggota
        await db.collection('groups').doc(doc.id).update({
            members: firebase.firestore.FieldValue.arrayUnion(currentUser.uid),
            memberCount: firebase.firestore.FieldValue.increment(1)
        });
        
        showNotif(`Berhasil gabung ke "${group.name}"! 🎉`, 'success');
        openGroupChat(doc.id);
        
    } catch (error) {
        console.error('❌ Gagal join:', error);
        showNotif('Gagal bergabung ke grup', 'error');
    }
}

// ==========================================
// HANDLE AI DI GRUP
// ==========================================
async function handleAIGroupMessage(text, groupId) {
    const question = text.replace(/^@bot\s*/i, '');
    
    // Kirim placeholder
    const placeholderRef = await db.collection('groups').doc(groupId).collection('messages').add({
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
        
        // Hapus placeholder & kirim jawaban
        await placeholderRef.delete();
        await db.collection('groups').doc(groupId).collection('messages').add({
            text: answer,
            senderUID: 'ai',
            senderName: '🤖 Aetheris AI',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
    } catch {
        await placeholderRef.delete();
        await db.collection('groups').doc(groupId).collection('messages').add({
            text: 'Maaf, AI sedang tidak tersedia 🙏',
            senderUID: 'ai',
            senderName: '🤖 Aetheris AI',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
}

// ==========================================
// HELPER
// ==========================================
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

// Update send button untuk grup
document.getElementById('sendBtn').addEventListener('click', function() {
    if (currentGroupId) {
        sendGroupMessage();
    } else {
        // Private chat (fungsi dari send.js)
        sendPrivateMessage();
    }
});

// Load grup saat tab grup diklik
document.querySelector('[data-tab="groups"]')?.addEventListener('click', loadGroupList);

console.log('✅ Group module loaded');
