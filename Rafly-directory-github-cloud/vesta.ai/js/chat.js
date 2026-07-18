// vesta.ai - Web Ahay Chat Engine
// Full-featured: sessions, AI, web search, image & document analysis, sharing,
// emoji picker, text-to-speech, export, shortcuts, and more.

// ==================== STATE ====================
let currentSession = null;
let messageHistory = []; // trimmed to APP_CONFIG.maxHistory
let isProcessing = false;
let currentImageBase64 = null;
let currentDocumentText = null;
let currentDocumentName = null;
let abortController = null; // for stop generation
let speechSynth = window.speechSynthesis;
let speaking = false;

// ==================== DOM ELEMENTS ====================
const chatMessages = document.getElementById('chatMessages');
const welcomeScreen = document.getElementById('welcomeScreen');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const attachBtn = document.getElementById('attachBtn');
const docAttachBtn = document.getElementById('docAttachBtn');
const emojiBtn = document.getElementById('emojiBtn');
const emojiPicker = document.getElementById('emojiPicker');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const imagePreview = document.getElementById('imagePreview');
const removeImageBtn = document.getElementById('removeImageBtn');
const aiStatus = document.getElementById('aiStatus');
const sidebarSessionList = document.getElementById('sessionList');
const newChatBtn = document.getElementById('newChatBtn');
const shareBtn = document.getElementById('shareBtn');
const searchSessionsInput = document.getElementById('searchSessions');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
const stopBtn = document.getElementById('stopBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const ttsBtn = document.getElementById('ttsBtn');
const exportBtn = document.getElementById('exportBtn');
const quickActionsEl = document.getElementById('quickActions');

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  // Ensure Firebase is ready before attaching listeners
  const checkFirebaseReady = setInterval(() => {
    if (typeof auth !== 'undefined' && typeof db !== 'undefined') {
      clearInterval(checkFirebaseReady);
      initChatApp();
    }
  }, 100);
});

function initChatApp() {
  // Send message events
  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    // Keyboard shortcuts
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      wrapSelection('**');
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      wrapSelection('*');
    }
  });
  
  // Image attachment
  attachBtn.addEventListener('click', () => document.getElementById('imageInput').click());
  document.getElementById('imageInput').addEventListener('change', handleImageUpload);
  
  // Document attachment
  docAttachBtn.addEventListener('click', () => document.getElementById('docInput').click());
  document.getElementById('docInput').addEventListener('change', handleDocumentUpload);
  
  // Remove image preview
  removeImageBtn.addEventListener('click', clearAttachment);
  
  // Emoji picker
  emojiBtn.addEventListener('click', toggleEmojiPicker);
  buildEmojiPicker();
  
  // New chat
  newChatBtn.addEventListener('click', createNewSession);
  
  // Share
  shareBtn.addEventListener('click', shareCurrentChat);
  
  // Stop generation
  stopBtn.addEventListener('click', stopGeneration);
  
  // Regenerate last AI response
  regenerateBtn.addEventListener('click', regenerateResponse);
  
  // Text-to-speech for last AI message
  ttsBtn.addEventListener('click', speakLastAI);
  
  // Export chat
  exportBtn.addEventListener('click', exportChat);
  
  // Sidebar toggle
  if (toggleSidebarBtn) toggleSidebarBtn.addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('active');
  });
  if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', () => {
    document.querySelector('.sidebar').classList.remove('active');
  });
  
  // Search sessions debounce
  searchSessionsInput.addEventListener('input', debounce(() => {
    loadSessions(searchSessionsInput.value.trim());
  }, 300));
  
  // Load sessions
  loadSessions('');
}

// ==================== HELPERS ====================
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function showAIStatus(text = 'AI sedang berpikir...') {
  aiStatus.querySelector('.ai-status-text').textContent = text;
  aiStatus.style.display = 'flex';
}

function hideAIStatus() {
  aiStatus.style.display = 'none';
}

function scrollBottom() {
  if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
}

function fmtTime(date) {
  const d = new Date(date);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function fmtMsg(text) {
  let escaped = escHtml(text);
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
  escaped = escaped.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
  escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return escaped;
}

function wrapSelection(wrapper) {
  const textarea = messageInput;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selected = text.substring(start, end);
  const newText = text.substring(0, start) + wrapper + selected + wrapper + text.substring(end);
  textarea.value = newText;
  textarea.focus();
  textarea.setSelectionRange(start + wrapper.length, end + wrapper.length);
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ==================== DISPLAY MESSAGE ====================
function displayMessage(msg, animate = true) {
  const isUser = msg.role === 'user';
  const div = document.createElement('div');
  div.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
  if (animate) div.style.opacity = '0';
  
  let contentHtml = '';
  if (isUser) {
    if (msg.imageUrl) contentHtml += `<div class="message-image"><img src="${msg.imageUrl}" alt="gambar"></div>`;
    if (msg.docName) contentHtml += `<div class="message-document"><span class="doc-icon">📄</span> ${escHtml(msg.docName)}</div>`;
    if (msg.content) contentHtml += `<div class="message-text">${fmtMsg(msg.content)}</div>`;
  } else {
    contentHtml += `<div class="message-text">${fmtMsg(msg.content)}</div>`;
    if (msg.searchedWeb) {
      contentHtml += `<div class="badge web-badge">🔍 Telah menelusuri web</div>`;
      if (msg.sources?.length) {
        contentHtml += '<div class="sources"><strong>Sumber:</strong><ul>';
        msg.sources.forEach(src => contentHtml += `<li><a href="${escHtml(src.url)}" target="_blank" rel="noopener">${escHtml(src.title || src.url)}</a></li>`);
        contentHtml += '</ul></div>';
      }
    }
    // Copy button
    contentHtml += `<button class="copy-msg-btn" onclick="copyMsg(this)" title="Salin pesan">📋</button>`;
    // TTS button
    contentHtml += `<button class="tts-msg-btn" onclick="speakText('${escHtml(msg.content).replace(/'/g, "\\'")}')">🔊</button>`;
  }
  
  div.innerHTML = `
    <div class="message-avatar ${isUser ? 'user-avatar' : 'ai-avatar'}">
      ${isUser 
        ? (userData?.photoURL ? `<img src="${userData.photoURL}" alt="You">` : '<span>K</span>') 
        : '<img src="logo.png" alt="AI">'}
    </div>
    <div class="message-body">
      <div class="message-header">
        <span class="message-sender">${isUser ? 'Anda' : 'Web Ahay'}</span>
        <span class="message-time">${fmtTime(msg.timestamp)}</span>
      </div>
      <div class="message-content">${contentHtml}</div>
    </div>
  `;
  
  chatMessages.appendChild(div);
  scrollBottom();
  if (animate) {
    requestAnimationFrame(() => {
      div.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      div.style.opacity = '1';
      div.style.transform = 'translateY(0)';
    });
  }
}

window.copyMsg = function(btn) {
  const msgDiv = btn.closest('.message');
  const text = msgDiv.querySelector('.message-text')?.innerText || '';
  navigator.clipboard.writeText(text).then(() => showToast('Disalin!', 'success')).catch(() => showToast('Gagal menyalin', 'error'));
};

// ==================== SESSION MANAGEMENT ====================
async function createNewSession() {
  currentSession = {
    id: generateId(),
    title: 'Chat Baru',
    messages: [],
    createdAt: new Date().toISOString()
  };
  messageHistory = [];
  clearChatUI();
  welcomeScreen.style.display = 'flex';
  quickActionsEl.style.display = 'grid';
  chatMessages.innerHTML = '';
  clearAttachment();
  messageInput.value = '';
  hideAIStatus();
  document.querySelectorAll('.session-item').forEach(el => el.classList.remove('active'));
  showToast('Sesi baru dimulai', 'info');
}

function clearChatUI() {
  chatMessages.innerHTML = '';
  welcomeScreen.style.display = 'none';
  if (quickActionsEl) quickActionsEl.style.display = 'none';
}

async function saveMsg(sessionId, msg) {
  if (!currentUser || !userData?.uniqueLinkId) return;
  const messagesRef = db.collection('chats').doc(userData.uniqueLinkId)
    .collection('sessions').doc(sessionId).collection('messages');
  
  await messagesRef.add({
    role: msg.role,
    content: msg.content || '',
    imageUrl: msg.imageUrl || null,
    docName: msg.docName || null,
    searchedWeb: msg.searchedWeb || false,
    sources: msg.sources || [],
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
  
  const sessionRef = db.collection('chats').doc(userData.uniqueLinkId)
    .collection('sessions').doc(sessionId);
  
  const sessionDoc = await sessionRef.get();
  if (sessionDoc.exists) {
    const data = sessionDoc.data();
    if (!data.title || data.title === 'Chat Baru') {
      if (msg.role === 'user' && msg.content) {
        const newTitle = msg.content.substring(0, 30) + (msg.content.length > 30 ? '...' : '');
        await sessionRef.update({ title: newTitle });
      }
    }
    await sessionRef.update({ lastUpdated: firebase.firestore.FieldValue.serverTimestamp() });
  } else {
    await sessionRef.set({
      title: msg.role === 'user' ? msg.content.substring(0, 30) : 'Chat Baru',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
      messageCount: 0
    });
  }
}

async function updateSession(sessionId, updates) {
  if (!currentUser || !userData?.uniqueLinkId) return;
  await db.collection('chats').doc(userData.uniqueLinkId)
    .collection('sessions').doc(sessionId).update(updates);
}

async function loadSessions(searchTerm = '') {
  if (!currentUser || !userData?.uniqueLinkId) return;
  const sessionsRef = db.collection('chats').doc(userData.uniqueLinkId)
    .collection('sessions').orderBy('lastUpdated', 'desc');
  
  const snapshot = await sessionsRef.get();
  const sessions = [];
  snapshot.forEach(doc => {
    sessions.push({ id: doc.id, ...doc.data() });
  });
  
  const filtered = searchTerm
    ? sessions.filter(s => (s.title || '').toLowerCase().includes(searchTerm.toLowerCase()))
    : sessions;
  
  renderSidebarSessions(filtered);
}

function renderSidebarSessions(sessions) {
  sidebarSessionList.innerHTML = '';
  if (sessions.length === 0) {
    sidebarSessionList.innerHTML = '<div class="no-sessions">Belum ada percakapan</div>';
    return;
  }
  
  sessions.forEach(session => {
    const item = document.createElement('div');
    item.className = 'session-item';
    if (currentSession && currentSession.id === session.id) item.classList.add('active');
    item.innerHTML = `
      <div class="session-icon">💬</div>
      <div class="session-info">
        <div class="session-title">${escHtml(session.title || 'Chat Baru')}</div>
        <div class="session-date">${session.lastUpdated?.toDate ? fmtTime(session.lastUpdated.toDate()) : ''}</div>
      </div>
      <button class="session-delete" data-id="${session.id}" title="Hapus sesi">×</button>
    `;
    item.addEventListener('click', (e) => {
      if (!e.target.classList.contains('session-delete')) loadSession(session.id);
    });
    item.querySelector('.session-delete').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('Hapus percakapan ini?')) {
        try {
          await db.collection('chats').doc(userData.uniqueLinkId)
            .collection('sessions').doc(session.id).delete();
          // Delete messages subcollection (batch)
          const msgSnap = await db.collection('chats').doc(userData.uniqueLinkId)
            .collection('sessions').doc(session.id).collection('messages').get();
          const batch = db.batch();
          msgSnap.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
          showToast('Percakapan dihapus', 'info');
          if (currentSession?.id === session.id) createNewSession();
          loadSessions(searchSessionsInput.value.trim());
        } catch (error) {
          console.error('Delete error:', error);
          showToast('Gagal menghapus', 'error');
        }
      }
    });
    sidebarSessionList.appendChild(item);
  });
}

async function loadSession(sessionId) {
  if (!currentUser || !userData?.uniqueLinkId) return;
  showAIStatus('Memuat percakapan...');
  try {
    const sessionRef = db.collection('chats').doc(userData.uniqueLinkId).collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();
    if (!sessionDoc.exists) {
      showToast('Sesi tidak ditemukan', 'error');
      hideAIStatus();
      return;
    }
    
    const data = sessionDoc.data();
    currentSession = { id: sessionId, title: data.title, createdAt: data.createdAt?.toDate().toISOString() };
    
    const msgsSnap = await db.collection('chats').doc(userData.uniqueLinkId)
      .collection('sessions').doc(sessionId).collection('messages').orderBy('timestamp', 'asc').get();
    
    clearChatUI();
    chatMessages.innerHTML = '';
    messageHistory = [];
    let msgs = [];
    msgsSnap.forEach(doc => {
      const d = doc.data();
      msgs.push({
        role: d.role,
        content: d.content || '',
        imageUrl: d.imageUrl,
        docName: d.docName,
        searchedWeb: d.searchedWeb,
        sources: d.sources,
        timestamp: d.timestamp?.toDate().toISOString() || new Date().toISOString()
      });
    });
    
    msgs.forEach(msg => {
      displayMessage(msg, false);
      if (msg.role === 'user' || msg.role === 'assistant') messageHistory.push({ role: msg.role, content: msg.content });
    });
    if (messageHistory.length > APP_CONFIG.maxHistory) messageHistory = messageHistory.slice(-APP_CONFIG.maxHistory);
    
    hideAIStatus();
    document.querySelectorAll('.session-item').forEach(el => el.classList.remove('active'));
    // highlight sidebar item
    const items = document.querySelectorAll('.session-item');
    items.forEach(el => {
      if (el.querySelector('.session-title')?.textContent === (data.title || 'Chat Baru')) el.classList.add('active');
    });
    document.querySelector('.sidebar').classList.remove('active');
  } catch (error) {
    console.error('Load session error:', error);
    showToast('Gagal memuat sesi', 'error');
    hideAIStatus();
  }
}

// ==================== AI & WEB SEARCH ====================
async function performWebSearch(query) {
  try {
    const res = await fetch(TAVILY_CONFIG.baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: TAVILY_CONFIG.apiKey, query, search_depth: "basic", max_results: 5 })
    });
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json();
    return data.results?.map(r => ({ title: r.title, url: r.url, content: r.content })) || [];
  } catch (e) {
    console.error('Web search error:', e);
    return [];
  }
}

async function getAIResponse(messages, imageBase64 = null, docText = null, signal = null) {
  const systemMsg = { role: 'system', content: `Kamu adalah Web Ahay (vesta.ai), asisten AI berbahasa Indonesia yang ramah, cerdas, dan selalu mengingat konteks percakapan. Gunakan web search untuk informasi terkini jika diperlukan. Jangan memberikan jawaban ngawur.` };
  
  let apiMessages = [systemMsg, ...messages];
  
  if (imageBase64) {
    const lastUser = [...apiMessages].reverse().find(m => m.role === 'user');
    if (lastUser) {
      lastUser.content = [
        { type: 'text', text: lastUser.content },
        { type: 'image_url', image_url: { url: imageBase64 } }
      ];
    }
  }
  if (docText) {
    const lastUser = [...apiMessages].reverse().find(m => m.role === 'user');
    if (lastUser) {
      lastUser.content = `[Dokumen: ${escHtml(currentDocumentName)}]\n\n${docText}\n\nPertanyaan: ${lastUser.content}`;
    }
  }
  
  const requestBody = {
    model: SUMOPOD_CONFIG.model,
    messages: apiMessages,
    max_tokens: SUMOPOD_CONFIG.maxTokens,
    temperature: SUMOPOD_CONFIG.temperature,
    tools: [{
      type: "function",
      function: {
        name: "web_search",
        description: "Cari informasi di web",
        parameters: {
          type: "object",
          properties: { query: { type: "string" } },
          required: ["query"]
        }
      }
    }],
    tool_choice: "auto"
  };
  
  try {
    const response = await fetch(`${SUMOPOD_CONFIG.baseURL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUMOPOD_CONFIG.apiKey}` },
      body: JSON.stringify(requestBody),
      signal
    });
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    const choice = data.choices[0];
    const assistantMsg = choice.message;
    let finalContent = assistantMsg.content || '';
    let searchedWeb = false;
    let sources = [];
    
    if (assistantMsg.tool_calls?.length > 0) {
      const toolCall = assistantMsg.tool_calls[0];
      if (toolCall.function.name === 'web_search') {
        const args = JSON.parse(toolCall.function.arguments);
        const results = await performWebSearch(args.query);
        if (results.length > 0) {
          searchedWeb = true;
          sources = results;
          apiMessages.push({ role: 'tool', tool_call_id: toolCall.id, content: results.map(r => `${r.title}: ${r.content}`).join('\n') });
          // Follow-up
          const followRes = await fetch(`${SUMOPOD_CONFIG.baseURL}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUMOPOD_CONFIG.apiKey}` },
            body: JSON.stringify({ model: SUMOPOD_CONFIG.model, messages: apiMessages, max_tokens: SUMOPOD_CONFIG.maxTokens, temperature: SUMOPOD_CONFIG.temperature }),
            signal
          });
          if (followRes.ok) {
            const followData = await followRes.json();
            finalContent = followData.choices[0]?.message?.content || finalContent;
          }
        }
      }
    }
    return { content: finalContent, searchedWeb, sources };
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Dibatalkan');
    console.error('AI error:', error);
    throw error;
  }
}

// ==================== SEND MESSAGE ====================
async function sendMessage() {
  if (isProcessing) return;
  const text = messageInput.value.trim();
  if (!text && !currentImageBase64 && !currentDocumentText) {
    showToast('Tulis pesan atau lampirkan file', 'warning');
    return;
  }
  
  isProcessing = true;
  sendBtn.disabled = true;
  messageInput.disabled = true;
  stopBtn.style.display = 'inline-flex';
  showAIStatus();
  
  if (!currentSession) {
    currentSession = {
      id: generateId(),
      title: text ? text.substring(0, 30) : 'Chat Baru',
      createdAt: new Date().toISOString()
    };
  }
  
  welcomeScreen.style.display = 'none';
  if (quickActionsEl) quickActionsEl.style.display = 'none';
  
  const userMsg = {
    role: 'user',
    content: text,
    imageUrl: currentImageBase64,
    docName: currentDocumentName,
    timestamp: new Date().toISOString()
  };
  
  displayMessage(userMsg);
  await saveMsg(currentSession.id, userMsg);
  messageHistory.push({ role: 'user', content: text });
  if (messageHistory.length > APP_CONFIG.maxHistory) messageHistory = messageHistory.slice(-APP_CONFIG.maxHistory);
  
  clearAttachment();
  messageInput.value = '';
  messageInput.style.height = 'auto';
  
  // AbortController for stop
  abortController = new AbortController();
  
  try {
    const aiResponse = await getAIResponse(messageHistory, currentImageBase64, currentDocumentText, abortController.signal);
    
    const aiMsg = {
      role: 'assistant',
      content: aiResponse.content,
      searchedWeb: aiResponse.searchedWeb,
      sources: aiResponse.sources,
      timestamp: new Date().toISOString()
    };
    
    displayMessage(aiMsg);
    await saveMsg(currentSession.id, aiMsg);
    messageHistory.push({ role: 'assistant', content: aiResponse.content });
    if (messageHistory.length > APP_CONFIG.maxHistory) messageHistory = messageHistory.slice(-APP_CONFIG.maxHistory);
    
    if (currentSession.title === 'Chat Baru') {
      currentSession.title = text.substring(0, 30) + (text.length > 30 ? '...' : '');
      await updateSession(currentSession.id, { title: currentSession.title });
    }
    
    loadSessions(searchSessionsInput.value.trim());
  } catch (error) {
    if (error.message === 'Dibatalkan') {
      showToast('Generasi dihentikan', 'info');
    } else {
      showToast('Gagal mendapatkan respons AI.', 'error');
    }
  } finally {
    isProcessing = false;
    sendBtn.disabled = false;
    messageInput.disabled = false;
    stopBtn.style.display = 'none';
    hideAIStatus();
    abortController = null;
    messageInput.focus();
  }
}

function stopGeneration() {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
}

async function regenerateResponse() {
  if (isProcessing || messageHistory.length < 2) return;
  // Remove last AI message from history and UI
  messageHistory.pop();
  const lastAIMsg = chatMessages.querySelector('.ai-message:last-child');
  if (lastAIMsg) lastAIMsg.remove();
  
  // Re-send last user message
  const lastUserMsg = [...messageHistory].reverse().find(m => m.role === 'user');
  if (lastUserMsg) {
    messageInput.value = lastUserMsg.content;
    sendMessage();
  }
}

// ==================== IMAGE & DOCUMENT HANDLING ====================
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!APP_CONFIG.supportedImageTypes.includes(file.type)) {
    showToast('Format gambar tidak didukung', 'error');
    event.target.value = '';
    return;
  }
  if (file.size > APP_CONFIG.maxImageSize) {
    showToast('Ukuran maksimal 10MB', 'error');
    event.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    currentImageBase64 = e.target.result;
    imagePreview.src = currentImageBase64;
    imagePreviewContainer.style.display = 'flex';
    currentDocumentText = null; currentDocumentName = null;
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}

function handleDocumentUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const validExts = APP_CONFIG.supportedDocTypes;
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!validExts.includes(ext) && !validExts.includes(file.type)) {
    showToast('Format dokumen tidak didukung', 'error');
    event.target.value = '';
    return;
  }
  if (file.size > APP_CONFIG.maxImageSize) {
    showToast('Ukuran maksimal 10MB', 'error');
    event.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    currentDocumentText = e.target.result;
    currentDocumentName = file.name;
    imagePreviewContainer.style.display = 'none';
    currentImageBase64 = null;
    showToast(`Dokumen ${file.name} dilampirkan`, 'info');
  };
  reader.onerror = () => showToast('Gagal membaca dokumen', 'error');
  reader.readAsText(file, 'UTF-8');
  event.target.value = '';
}

function clearAttachment() {
  currentImageBase64 = null;
  currentDocumentText = null;
  currentDocumentName = null;
  imagePreviewContainer.style.display = 'none';
  imagePreview.src = '';
}

// ==================== EMOJI PICKER ====================
function buildEmojiPicker() {
  emojiPicker.innerHTML = '';
  APP_CONFIG.emojiSet.forEach(emoji => {
    const span = document.createElement('span');
    span.className = 'emoji-item';
    span.textContent = emoji;
    span.addEventListener('click', () => {
      insertAtCursor(messageInput, emoji);
      emojiPicker.classList.remove('show');
    });
    emojiPicker.appendChild(span);
  });
}

function toggleEmojiPicker() {
  emojiPicker.classList.toggle('show');
}

function insertAtCursor(textarea, text) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const content = textarea.value;
  textarea.value = content.substring(0, start) + text + content.substring(end);
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = start + text.length;
}

// ==================== TTS ====================
function speakText(text) {
  if (speaking) {
    speechSynth.cancel();
    speaking = false;
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'id-ID';
  utterance.onend = () => { speaking = false; };
  speaking = true;
  speechSynth.speak(utterance);
}

function speakLastAI() {
  const lastAI = [...chatMessages.querySelectorAll('.ai-message')].pop();
  if (lastAI) {
    const text = lastAI.querySelector('.message-text')?.innerText || '';
    speakText(text);
  }
}

// ==================== EXPORT CHAT ====================
function exportChat() {
  const messages = [];
  chatMessages.querySelectorAll('.message').forEach(msg => {
    const sender = msg.classList.contains('user-message') ? 'Anda' : 'Web Ahay';
    const text = msg.querySelector('.message-text')?.innerText || '';
    const time = msg.querySelector('.message-time')?.innerText || '';
    messages.push(`[${time}] ${sender}: ${text}`);
  });
  const blob = new Blob([messages.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chat-${currentSession?.title || 'webahay'}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Percakapan diekspor', 'success');
}

// ==================== SHARE ====================
async function shareCurrentChat() {
  if (!currentSession) { showToast('Tidak ada percakapan', 'error'); return; }
  showAIStatus('Membuat tautan...');
  try {
    const msgsSnap = await db.collection('chats').doc(userData.uniqueLinkId)
      .collection('sessions').doc(currentSession.id).collection('messages').orderBy('timestamp', 'asc').get();
    const msgs = [];
    msgsSnap.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
    
    const shareId = 'share-' + generateId();
    await db.collection('shared_chats').doc(shareId).set({
      sessionId: currentSession.id,
      userId: currentUser.uid,
      username: userData.username,
      title: currentSession.title,
      messages: msgs,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    const shareUrl = `${window.location.origin}/vesta.ai/share.html?share=${shareId}`;
    document.getElementById('shareUrl').value = shareUrl;
    showModal('shareModal');
    document.getElementById('copyShareBtn').onclick = () => {
      navigator.clipboard.writeText(shareUrl).then(() => showToast('Tautan disalin!', 'success'));
    };
  } catch (e) {
    console.error(e);
    showToast('Gagal membagikan', 'error');
  } finally {
    hideAIStatus();
  }
}

document.getElementById('closeShareModal')?.addEventListener('click', () => hideModal('shareModal'));

// ==================== QUICK ACTIONS ====================
document.getElementById('actionExplain')?.addEventListener('click', () => {
  messageInput.value = 'Jelaskan tentang kecerdasan buatan secara singkat';
  sendMessage();
});
document.getElementById('actionSearch')?.addEventListener('click', () => {
  messageInput.value = 'Berita terbaru hari ini';
  sendMessage();
});
document.getElementById('actionImage')?.addEventListener('click', () => document.getElementById('imageInput').click());
document.getElementById('actionDoc')?.addEventListener('click', () => document.getElementById('docInput').click());
