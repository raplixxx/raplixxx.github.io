// src/main.js
// OTAK PUSAT - Mengatur seluruh aplikasi

console.log('🚀 RaflyChat v2.0 starting...');
console.log('================================');

// ==========================================
// DARK MODE OTOMATIS
// ==========================================
function applyAutoTheme() {
    const hour = new Date().getHours();
    const isDarkTime = hour >= 18 || hour < 6;
    const savedTheme = localStorage.getItem('rc_theme');
    
    if (savedTheme === 'dark' || (!savedTheme && isDarkTime)) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
}

applyAutoTheme();

// Cek setiap 1 menit
setInterval(applyAutoTheme, 60000);

// ==========================================
// TOGGLE THEME MANUAL
// ==========================================
document.getElementById('themeToggle').addEventListener('click', function() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('rc_theme', 'light');
        this.querySelector('i').className = 'fas fa-moon';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('rc_theme', 'dark');
        this.querySelector('i').className = 'fas fa-sun';
    }
});

// Set icon awal
const themeIcon = document.querySelector('#themeToggle i');
if (themeIcon) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}

// ==========================================
// TAB NAVIGATION
// ==========================================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.style.color = 'var(--text-secondary)';
            b.style.borderBottomColor = 'transparent';
            b.style.fontWeight = '500';
        });
        this.style.color = 'var(--accent-color)';
        this.style.borderBottomColor = 'var(--accent-color)';
        this.style.fontWeight = '600';
        
        // Tampilkan konten
        const tab = this.dataset.tab;
        document.getElementById('chatList').style.display = tab === 'chats' ? 'block' : 'none';
        document.getElementById('groupList').style.display = tab === 'groups' ? 'block' : 'none';
        
        // Load data
        if (tab === 'groups') loadGroupList();
        if (tab === 'status') loadStatusList();
    });
});

// ==========================================
// CREATE GROUP BUTTON
// ==========================================
document.getElementById('createGroupBtn')?.addEventListener('click', () => {
    document.getElementById('createGroupModal').style.display = 'flex';
    document.getElementById('groupNameInput').focus();
});

// Close modal saat klik background
document.getElementById('createGroupModal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        this.style.display = 'none';
    }
});

// Close modal dengan Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.getElementById('createGroupModal').style.display = 'none';
        // Tutup modal lainnya
        document.querySelectorAll('.modal').forEach(m => {
            if (m.id !== 'loginScreen') m.remove();
        });
    }
});

// ==========================================
// FITUR LINK ACAK PER PENGGUNA
// ==========================================
const urlParams = new URLSearchParams(window.location.search);
const targetUID = urlParams.get('user');

if (targetUID) {
    console.log('🔗 Ditemukan parameter ?user=', targetUID);
    
    // Tunggu user login
    const checkAuthInterval = setInterval(() => {
        if (currentUser) {
            clearInterval(checkAuthInterval);
            
            if (targetUID !== currentUser.uid) {
                console.log('💬 Membuka chat private dengan:', targetUID);
                setTimeout(() => {
                    openPrivateChat(targetUID);
                }, 1500);
            } else {
                console.log('ℹ️ Ini adalah link chat diri sendiri');
                showNotif('Ini adalah link chat kamu sendiri', 'info');
            }
        }
    }, 500);
    
    // Stop setelah 30 detik
    setTimeout(() => clearInterval(checkAuthInterval), 30000);
}

// ==========================================
// COPY USER LINK
// ==========================================
document.getElementById('copyLinkBtn')?.addEventListener('click', function() {
    if (currentUser) {
        copyUserLink(currentUser.uid);
        
        // Animasi tombol
        this.style.transform = 'scale(1.2)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 200);
    } else {
        showNotif('Login dulu ya!', 'warning');
    }
});

// ==========================================
// AUTO RESIZE TEXTAREA
// ==========================================
document.getElementById('messageInput')?.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

// ==========================================
// EMOJI PICKER
// ==========================================
document.getElementById('emojiBtn')?.addEventListener('click', function() {
    const picker = document.getElementById('emojiPicker');
    if (picker) {
        picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
    }
});

// Isi emoji grid
const emojiGrid = document.querySelector('.emoji-grid');
if (emojiGrid) {
    const emojis = ['😀', '😂', '🤣', '😊', '😍', '🤗', '😎', '🤩', '👍', '❤️', '🔥', '💯', '🎉', '😢', '😡', '👏', '🙏', '💪', '🤝', '✨', '🌟', '💕', '🍕', '☕'];
    
    emojiGrid.innerHTML = emojis.map(emoji => `
        <button class="emoji-item" onclick="insertEmoji('${emoji}')">${emoji}</button>
    `).join('');
}

function insertEmoji(emoji) {
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

// ==========================================
// FORWARD MESSAGE (SHOW MODAL)
// ==========================================
async function showForwardModal(messageData) {
    if (!currentUser) return;
    
    // Ambil daftar grup user
    const snapshot = await db.collection('groups')
        .where('members', 'array-contains', currentUser.uid)
        .where('isActive', '==', true)
        .limit(10)
        .get();
    
    if (snapshot.empty) {
        showNotif('Kamu belum punya grup untuk meneruskan pesan', 'warning');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>↗ Teruskan Pesan</h3>
                <button class="icon-btn" onclick="this.closest('.modal
