// src/main.js
// OTAK PUSAT APLIKASI

console.log('🚀 RaflyChat starting...');

// Dark mode otomatis
function applyTheme() {
    const hour = new Date().getHours();
    if (hour >= 18 || hour < 6) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}
applyTheme();

// Toggle theme
document.getElementById('themeToggle').addEventListener('click', function() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
});

// Tab navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.style.color = 'var(--text-secondary)';
            b.style.borderBottom = '2px solid transparent';
        });
        this.style.color = 'var(--accent-color)';
        this.style.borderBottom = '2px solid var(--accent-color)';
        
        const tab = this.dataset.tab;
        document.getElementById('chatList').style.display = tab === 'chats' ? 'block' : 'none';
        document.getElementById('groupList').style.display = tab === 'groups' ? 'block' : 'none';
    });
});

// ==========================================
// FITUR UTAMA: Link Acak Per Pengguna
// ==========================================
const targetUID = getTargetUIDFromURL();

if (targetUID) {
    console.log('🔗 Ditemukan parameter ?user=', targetUID);
    
    // Tunggu user login dulu
    const checkInterval = setInterval(() => {
        if (currentUser) {
            clearInterval(checkInterval);
            
            if (targetUID !== currentUser.uid) {
                // Buka chat dengan target
                console.log('💬 Membuka chat dengan:', targetUID);
                setTimeout(() => {
                    openPrivateChat(targetUID);
                }, 1000);
            } else {
                console.log('ℹ️ Ini link diri sendiri');
            }
        }
    }, 500);
}

// ==========================================
// NOTIFIKASI SEDERHANA
// ==========================================
function showNotif(message, type = 'info') {
    const container = document.getElementById('notifications');
    const colors = { success: '#4caf50', error: '#ef5350', info: '#2196f3' };
    
    const el = document.createElement('div');
    el.style.cssText = `padding: 12px 20px; background: ${colors[type]}; color: white; border-radius: 8px; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); animation: slideIn 0.3s ease;`;
    el.textContent = message;
    container.appendChild(el);
    
    setTimeout(() => {
        el.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

// AI Handler
async function handleAIMessage(text, chatId) {
    const question = text.replace(/^@bot\s*/i, '');
    
    // Tampilkan "mengetik..."
    const typingId = 'typing_' + Date.now();
    db.collection('chats').doc(chatId).collection('messages').add({
        text: '🤔 AI sedang berpikir...',
        senderUID: 'ai',
        senderName: 'Aetheris AI',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(async (docRef) => {
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
            
            // Hapus "mengetik..." dan kirim jawaban
            docRef.delete();
            db.collection('chats').doc(chatId).collection('messages').add({
                text: answer,
                senderUID: 'ai',
                senderName: '🤖 Aetheris AI',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch {
            docRef.delete();
            db.collection('chats').doc(chatId).collection('messages').add({
                text: 'Maaf, AI sedang tidak tersedia 🙏',
                senderUID: 'ai',
                senderName: '🤖 Aetheris AI',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    });
}

console.log('✅ RaflyChat siap!');
