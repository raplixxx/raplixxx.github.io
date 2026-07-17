// public/js/chat.js
// Advanced Chat System with AI, Web Search, Image Analysis, and Memory

// Global State
let currentSession = null;
let messageHistory = [];
let isProcessing = false;
let currentImageFile = null;
let currentImageBase64 = null;

// DOM Elements
const messagesContainer = document.getElementById('messagesContainer');
const welcomeScreen = document.getElementById('welcomeScreen');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const attachImageBtn = document.getElementById('attachImageBtn');
const imageInput = document.getElementById('imageInput');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const imagePreview = document.getElementById('imagePreview');
const imagePrompt = document.getElementById('imagePrompt');
const removeImageBtn = document.getElementById('removeImageBtn');
const aiStatus = document.getElementById('aiStatus');
const statusText = document.getElementById('statusText');
const sessionsList = document.getElementById('sessionsList');
const menuToggleBtn = document.getElementById('menuToggleBtn');
const sidebar = document.getElementById('sidebar');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const newSessionBtn = document.getElementById('newSessionBtn');
const newChatSidebarBtn = document.getElementById('newChatSidebarBtn');
const shareBtn = document.getElementById('shareBtn');
const shareModal = document.getElementById('shareModal');
const shareLinkInput = document.getElementById('shareLinkInput');
const copyShareLinkBtn = document.getElementById('copyShareLinkBtn');

// Initialize Chat
async function initChat() {
    setupEventListeners();
    await loadSessions();
    await loadLatestSession();
}

// Setup Event Listeners
function setupEventListeners() {
    // Send message
    sendMessageBtn.addEventListener('click', handleSendMessage);
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    
    // Auto-resize textarea
    messageInput.addEventListener('input', autoResizeTextarea);
    
    // Image upload
    attachImageBtn.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleImageUpload);
    removeImageBtn.addEventListener('click', removeImage);
    
    // Sidebar
    menuToggleBtn.addEventListener('click', toggleSidebar);
    closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('active'));
    newSessionBtn.addEventListener('click', createNewSession);
    newChatSidebarBtn.addEventListener('click', createNewSession);
    
    // Share
    shareBtn.addEventListener('click', handleShare);
    copyShareLinkBtn.addEventListener('click', copyShareLink);
}

// Handle Send Message
async function handleSendMessage() {
    const message = messageInput.value.trim();
    if (!message && !currentImageFile) return;
    if (isProcessing) return;
    
    isProcessing = true;
    sendMessageBtn.disabled = true;
    
    try {
        // Create session if none exists
        if (!currentSession) {
            await createNewSession();
        }
        
        // Display user message
        const userMessage = {
            role: 'user',
            content: message || '📷 Analisis gambar ini',
            timestamp: new Date().toISOString()
        };
        
        if (currentImageBase64) {
            userMessage.imageUrl = currentImageBase64;
            userMessage.imagePrompt = imagePrompt.value.trim();
        }
        
        displayMessage(userMessage);
        messageHistory.push(userMessage);
        
        // Clear inputs
        messageInput.value = '';
        removeImage();
        
        // Hide welcome screen
        if (welcomeScreen) welcomeScreen.style.display = 'none';
        
        // Show AI status
        showAIStatus('vesta.ai Thinking...');
        
        // Save user message to Firebase
        await saveMessage(userMessage);
        
        // Get AI response
        const aiResponse = await getAIResponse(messageHistory);
        
        // Display AI response
        displayMessage(aiResponse);
        messageHistory.push(aiResponse);
        
        // Save AI message
        await saveMessage(aiResponse);
        
        // Trim history to last 20 messages
        if (messageHistory.length > 20) {
            messageHistory = messageHistory.slice(-20);
        }
        
        // Update session in Firebase
        await updateSession();
        
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('Gagal mengirim pesan', 'error');
    } finally {
        isProcessing = false;
        sendMessageBtn.disabled = false;
        hideAIStatus();
        messageInput.focus();
    }
}

// Get AI Response (Streaming)
async function getAIResponse(messages) {
    try {
        // Prepare messages for API
        const apiMessages = [
            {
                role: 'system',
                content: `Anda adalah asisten AI dari vesta.ai yang bernama Web Ahay. 
Anda dapat:
1. Menjawab pertanyaan dengan akurat
2. Mencari informasi terkini di web
3. Menganalisis gambar yang dikirim pengguna
4. Mengingat 20 pesan terakhir dalam percakapan

Gunakan bahasa Indonesia yang ramah dan natural.`
            },
            ...messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }))
        ];
        
        // Check if last message contains image
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.imageUrl) {
            // Handle image analysis
            const imageContent = [
                { type: 'text', text: lastMessage.imagePrompt || 'Apa yang ada di gambar ini? Jelaskan secara detail.' },
                { type: 'image_url', image_url: { url: lastMessage.imageUrl } }
            ];
            
            apiMessages[apiMessages.length - 1].content = imageContent;
        }
        
        // Call SumoPod API with streaming
        const response = await fetch(`${SUMOPOD_CONFIG.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUMOPOD_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: SUMOPOD_CONFIG.model,
                messages: apiMessages,
                max_tokens: SUMOPOD_CONFIG.maxTokens,
                temperature: SUMOPOD_CONFIG.temperature,
                stream: false,
                tools: [
                    {
                        type: 'function',
                        function: {
                            name: 'webSearch',
                            description: 'Cari informasi terkini di web',
                            parameters: {
                                type: 'object',
                                properties: {
                                    query: {
                                        type: 'string',
                                        description: 'Kata kunci pencarian'
                                    }
                                },
                                required: ['query']
                            }
                        }
                    }
                ],
                tool_choice: 'auto'
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check for tool calls (web search)
        if (data.choices[0].message.tool_calls) {
            showAIStatus('🔍 Menelusuri web...');
            
            const toolCalls = data.choices[0].message.tool_calls;
            const searchResults = [];
            
            for (const toolCall of toolCalls) {
                if (toolCall.function.name === 'webSearch') {
                    const args = JSON.parse(toolCall.function.arguments);
                    const results = await performWebSearch(args.query);
                    searchResults.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        content: JSON.stringify(results)
                    });
                }
            }
            
            showAIStatus('vesta.ai Thinking...');
            
            // Get final response with search results
            const finalResponse = await fetch(`${SUMOPOD_CONFIG.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUMOPOD_CONFIG.apiKey}`
                },
                body: JSON.stringify({
                    model: SUMOPOD_CONFIG.model,
                    messages: [
                        ...apiMessages,
                        data.choices[0].message,
                        ...searchResults
                    ],
                    max_tokens: SUMOPOD_CONFIG.maxTokens,
                    temperature: SUMOPOD_CONFIG.temperature,
                    stream: false
                })
            });
            
            const finalData = await finalResponse.json();
            const aiContent = finalData.choices[0].message.content;
            
            // Extract sources
            let sources = [];
            if (searchResults.length > 0) {
                try {
                    const searchData = JSON.parse(searchResults[0].content);
                    sources = searchData.results?.slice(0, 3) || [];
                } catch (e) {}
            }
            
            return {
                role: 'assistant',
                content: aiContent,
                timestamp: new Date().toISOString(),
                sources: sources,
                searchedWeb: true
            };
        }
        
        // Regular response
        return {
            role: 'assistant',
            content: data.choices[0].message.content,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('AI Response error:', error);
        return {
            role: 'assistant',
            content: 'Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.',
            timestamp: new Date().toISOString(),
            error: true
        };
    }
}

// Perform Web Search with Tavily
async function performWebSearch(query) {
    try {
        const response = await fetch(TAVILY_CONFIG.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: TAVILY_CONFIG.apiKey,
                query: query,
                search_depth: 'basic',
                include_answer: true,
                max_results: 5
            })
        });
        
        const data = await response.json();
        return {
            query: query,
            answer: data.answer || '',
            results: data.results || []
        };
    } catch (error) {
        console.error('Web search error:', error);
        return { query, answer: '', results: [] };
    }
}

// Display Message
function displayMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-wrapper ${message.role === 'user' ? 'user' : 'ai'}`;
    
    if (message.role === 'user') {
        messageDiv.innerHTML = `
            <div class="message user-message">
                ${message.imageUrl ? `
                    <div class="message-image">
                        <img src="${message.imageUrl}" alt="Uploaded image">
                    </div>
                ` : ''}
                <div class="message-content">
                    <p>${escapeHtml(message.content)}</p>
                </div>
                <span class="message-time">${formatTime(message.timestamp)}</span>
            </div>
        `;
    } else {
        const sourcesHtml = message.sources?.length ? `
            <div class="message-sources">
                <div class="sources-header">
                    <i class="fas fa-globe"></i>
                    <span>Sumber Pencarian Web:</span>
                </div>
                <div class="sources-list">
                    ${message.sources.map((source, idx) => `
                        <a href="${source.url}" target="_blank" rel="noopener" class="source-item">
                            <span class="source-number">${idx + 1}</span>
                            <span class="source-title">${source.title || 'Link'}</span>
                            <i class="fas fa-external-link-alt"></i>
                        </a>
                    `).join('')}
                </div>
            </div>
        ` : '';
        
        const searchedBadge = message.searchedWeb ? `
            <div class="searched-badge">
                <i class="fas fa-search"></i> Telah menelusuri web
            </div>
        ` : '';
        
        messageDiv.innerHTML = `
            <div class="message ai-message">
                <div class="ai-avatar">
                    <img src="vestlog.jpg" alt="AI">
                </div>
                <div class="message-body">
                    ${searchedBadge}
                    <div class="message-content">
                        ${formatMessage(message.content)}
                    </div>
                    ${sourcesHtml}
                    <div class="message-actions">
                        <button class="btn-action" onclick="copyMessageContent(this)" title="Salin">
                            <i class="fas fa-copy"></i>
                        </button>
                        <span class="message-time">${formatTime(message.timestamp)}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// Save Message to Firebase
async function saveMessage(message) {
    if (!currentSession || !currentUser) return;
    
    try {
        await db.collection('chats')
            .doc(userData.uniqueLinkId)
            .collection('sessions')
            .doc(currentSession.id)
            .collection('messages')
            .add({
                ...message,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
    } catch (error) {
        console.error('Error saving message:', error);
    }
}

// Create New Session
async function createNewSession() {
    if (!currentUser || !userData) return;
    
    currentSession = {
        id: 'session-' + Date.now(),
        title: 'Chat Baru',
        createdAt: new Date().toISOString(),
        messageCount: 0
    };
    
    messageHistory = [];
    messagesContainer.innerHTML = '';
    
    // Show welcome screen
    if (welcomeScreen) welcomeScreen.style.display = 'flex';
    
    // Save session to Firebase
    try {
        await db.collection('chats')
            .doc(userData.uniqueLinkId)
            .collection('sessions')
            .doc(currentSession.id)
            .set({
                title: currentSession.title,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                messageCount: 0
            });
    } catch (error) {
        console.error('Error creating session:', error);
    }
    
    await loadSessions();
    sidebar.classList.remove('active');
}

// Load Sessions from Firebase
async function loadSessions() {
    if (!currentUser || !userData) return;
    
    try {
        const sessionsSnapshot = await db.collection('chats')
            .doc(userData.uniqueLinkId)
            .collection('sessions')
            .orderBy('createdAt', 'desc')
            .get();
        
        sessionsList.innerHTML = '';
        
        if (sessionsSnapshot.empty) {
            sessionsList.innerHTML = `
                <div class="empty-sessions">
                    <i class="fas fa-comments"></i>
                    <p>Belum ada riwayat chat</p>
                </div>
            `;
            return;
        }
        
        sessionsSnapshot.forEach(doc => {
            const session = doc.data();
            const sessionDiv = document.createElement('div');
            sessionDiv.className = `session-item ${currentSession?.id === doc.id ? 'active' : ''}`;
            sessionDiv.innerHTML = `
                <i class="fas fa-comment"></i>
                <div class="session-info">
                    <p class="session-title">${session.title || 'Chat'}</p>
                    <span class="session-time">${formatTime(session.createdAt)}</span>
                </div>
                <span class="session-count">${session.messageCount || 0}</span>
            `;
            sessionDiv.addEventListener('click', () => loadSession(doc.id));
            sessionsList.appendChild(sessionDiv);
        });
    } catch (error) {
        console.error('Error loading sessions:', error);
    }
}

// Load Specific Session
async function loadSession(sessionId) {
    if (!currentUser || !userData) return;
    
    try {
        const messagesSnapshot = await db.collection('chats')
            .doc(userData.uniqueLinkId)
            .collection('sessions')
            .doc(sessionId)
            .collection('messages')
            .orderBy('timestamp', 'asc')
            .get();
        
        currentSession = { id: sessionId };
        messageHistory = [];
        messagesContainer.innerHTML = '';
        
        if (welcomeScreen) welcomeScreen.style.display = 'none';
        
        messagesSnapshot.forEach(doc => {
            const msg = doc.data();
            messageHistory.push(msg);
            displayMessage(msg);
        });
        
        await loadSessions();
        sidebar.classList.remove('active');
        
    } catch (error) {
        console.error('Error loading session:', error);
        showToast('Gagal memuat sesi chat', 'error');
    }
}

// Handle Image Upload
async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!APP_CONFIG.supportedImageTypes.includes(file.type)) {
        showToast('Format gambar tidak didukung', 'error');
        return;
    }
    
    // Validate file size
    if (file.size > APP_CONFIG.maxImageSize) {
        showToast('Ukuran gambar maksimal 10MB', 'error');
        return;
    }
    
    currentImageFile = file;
    
    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
        currentImageBase64 = e.target.result;
        imagePreview.src = e.target.result;
        imagePreviewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Remove Image
function removeImage() {
    currentImageFile = null;
    currentImageBase64 = null;
    imagePreview.src = '';
    imagePrompt.value = '';
    imagePreviewContainer.style.display = 'none';
    imageInput.value = '';
}

// Share Chat
async function handleShare() {
    if (!currentSession || messageHistory.length === 0) {
        showToast('Tidak ada chat untuk dibagikan', 'warning');
        return;
    }
    
    try {
        showAIStatus('Membuat link share...');
        
        const shareId = 'share-' + generateRandomString(10);
        
        await db.collection('shared_chats').doc(shareId).set({
            messages: messageHistory,
            createdBy: currentUser.uid,
            username: userData.username,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            messageCount: messageHistory.length
        });
        
        const shareUrl = `https://raflymusyaf.web.id/share/${shareId}`;
        shareLinkInput.value = shareUrl;
        shareModal.style.display = 'flex';
        
        hideAIStatus();
        showToast('Link share berhasil dibuat! 📋', 'success');
        
    } catch (error) {
        console.error('Error sharing chat:', error);
        showToast('Gagal membuat link share', 'error');
        hideAIStatus();
    }
}

// Copy Share Link
function copyShareLink() {
    navigator.clipboard.writeText(shareLinkInput.value).then(() => {
        showToast('Link disalin! 📋', 'success');
        copyShareLinkBtn.innerHTML = '<i class="fas fa-check"></i> Tersalin!';
        setTimeout(() => {
            copyShareLinkBtn.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
    });
}

// Close Share Modal
function closeShareModal() {
    shareModal.style.display = 'none';
}

// Copy Message Content
window.copyMessageContent = function(button) {
    const content = button.closest('.message-body').querySelector('.message-content').textContent;
    navigator.clipboard.writeText(content).then(() => {
        const originalHtml = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            button.innerHTML = originalHtml;
        }, 2000);
        showToast('Pesan disalin!', 'success');
    });
};

// Send Quick Message
window.sendQuickMessage = function(message) {
    messageInput.value = message;
    handleSendMessage();
};

// Update Session in Firebase
async function updateSession() {
    if (!currentSession || !currentUser || !userData) return;
    
    try {
        await db.collection('chats')
            .doc(userData.uniqueLinkId)
            .collection('sessions')
            .doc(currentSession.id)
            .update({
                messageCount: messageHistory.length,
                title: messageHistory[0]?.content?.substring(0, 50) || 'Chat',
                lastMessage: messageHistory[messageHistory.length - 1]?.content?.substring(0, 100) || '',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
    } catch (error) {
        console.error('Error updating session:', error);
    }
}

// UI Helpers
function showAIStatus(text) {
    aiStatus.style.display = 'flex';
    statusText.textContent = text;
}

function hideAIStatus() {
    aiStatus.style.display = 'none';
}

function toggleSidebar() {
    sidebar.classList.toggle('active');
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Baru saja';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
    if (diff < 86400000) return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatMessage(content) {
    if (!content) return '';
    
    // Convert URLs to links
    content = content.replace(
        /(https?:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank" rel="noopener" class="message-link">$1</a>'
    );
    
    // Bold text
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Line breaks
    content = content.replace(/\n/g, '<br>');
    
    // Code blocks
    content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre class="code-block"><code>${escapeHtml(code.trim())}</code></pre>`;
    });
    
    return content;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth to be ready
    const checkAuth = setInterval(() => {
        if (window.getCurrentUser && window.getCurrentUser()) {
            currentUser = window.getCurrentUser();
            userData = window.getUserData();
            clearInterval(checkAuth);
            initChat();
        }
    }, 100);
});
