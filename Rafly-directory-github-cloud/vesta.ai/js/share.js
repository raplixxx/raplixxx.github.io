// vesta.ai - Web Ahay Shared Chat Viewer
// Read-only display with animations

let db;

document.addEventListener('DOMContentLoaded', () => {
  firebase.initializeApp(FIREBASE_CONFIG);
  db = firebase.firestore();
  
  const urlParams = new URLSearchParams(window.location.search);
  const shareId = urlParams.get('share');
  if (!shareId) {
    displayError('Tidak ada ID berbagi yang valid.');
    return;
  }
  loadSharedChat(shareId);
});

async function loadSharedChat(shareId) {
  const container = document.getElementById('sharedMessagesContainer');
  const infoEl = document.getElementById('shareInfo');
  try {
    const docSnap = await db.collection('shared_chats').doc(shareId).get();
    if (!docSnap.exists) {
      displayError('Percakapan tidak ditemukan atau sudah dihapus.');
      return;
    }
    const data = docSnap.data();
    const date = data.createdAt?.toDate().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });
    infoEl.innerHTML = `
      <div class="share-details">
        <div><strong>Dibagikan oleh:</strong> ${escHtml(data.username || 'Anonim')}</div>
        <div><strong>Judul:</strong> ${escHtml(data.title || 'Percakapan')}</div>
        <div><strong>Pesan:</strong> ${data.messages.length} pesan</div>
        <div><strong>Tanggal:</strong> ${date}</div>
      </div>
    `;
    
    if (data.messages?.length) {
      data.messages.forEach((msg, index) => {
        const div = document.createElement('div');
        div.className = `shared-message ${msg.role === 'user' ? 'user-msg' : 'ai-msg'}`;
        div.style.animationDelay = `${index * 0.05}s`;
        let content = '';
        if (msg.imageUrl) content += `<div class="msg-image"><img src="${msg.imageUrl}" alt="gambar"></div>`;
        if (msg.docName) content += `<div class="msg-doc">📄 ${escHtml(msg.docName)}</div>`;
        if (msg.content) {
          let formatted = msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/`([^`]+)`/g, '<code>$1</code>');
          content += `<div class="msg-text">${formatted}</div>`;
        }
        if (msg.searchedWeb) {
          content += `<div class="badge web-badge">🔍 Telah menelusuri web</div>`;
          if (msg.sources?.length) {
            content += '<div class="sources"><ul>';
            msg.sources.forEach(src => content += `<li><a href="${escHtml(src.url)}" target="_blank">${escHtml(src.title || src.url)}</a></li>`);
            content += '</ul></div>';
          }
        }
        div.innerHTML = `
          <div class="shared-msg-avatar ${msg.role === 'user' ? 'user' : 'ai'}">
            ${msg.role === 'user' ? '<span>👤</span>' : '<img src="logo.png" alt="AI">'}
          </div>
          <div class="shared-msg-body">
            <div class="shared-msg-header">
              <span class="sender">${msg.role === 'user' ? data.username || 'Pengguna' : 'Web Ahay'}</span>
              <span class="time">${msg.timestamp?.toDate ? fmtTime(msg.timestamp.toDate()) : ''}</span>
            </div>
            <div class="shared-msg-content">${content}</div>
          </div>
        `;
        container.appendChild(div);
      });
    } else {
      container.innerHTML = '<div class="empty-chat">Tidak ada pesan.</div>';
    }
  } catch (error) {
    console.error(error);
    displayError('Gagal memuat percakapan.');
  }
}

function displayError(msg) {
  document.getElementById('shareInfo').innerHTML = '';
  document.getElementById('sharedMessagesContainer').innerHTML = `<div class="error-message">${msg}</div>`;
}

function escHtml(unsafe) { return unsafe.replace(/[&<"'>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]); }
function fmtTime(date) { return new Date(date).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}); }
