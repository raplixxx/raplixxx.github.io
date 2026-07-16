// public/js/chat.js
// Chat functionality with SumoPod AI and Tavily Search

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Current user state
let currentUser = null;
let userData = null;
let currentUniqueLinkId = null;
let currentChatSession = [];
let isProcessing = false;

// DOM Elements
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const messagesContainer = document.getElementById('messagesContainer');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const typingIndicator = document.getElementById('typingIndicator');
const chatHistoryList = document.getElementById('chatHistoryList');
const newChatBtn = document.getElementById('newChatBtn');
const shareChatBtn = document.getElementById('shareChatBtn');
const shareModal = document.getElementById('shareModal');
const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');

// Extract uniqueLinkId from URL
function getUniqueLinkIdFromURL() {
    const path = window.location.pathname;
    const match = path.match(/\/chat\/(ahay-[a-z0-9]+)/);
    return match ? match[1] : null;
}

// Initialize chat
async function initChat() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    userData = userDoc.data();
                    const urlUniqueLinkId = getUniqueLinkIdFromURL();
                    
                    if (urlUniqueLinkId && urlUniqueLinkId === userData.uniqueLinkId) {
                        currentUniqueLinkId = urlUniqueLinkId;
                        loadChatHistory();
                    } else {
                        window.location.href = '/index.html';
                    }
                }
            } catch (error) {
                console.error('Error loading user data:', error);
                window.location.href = '/index.html';
            }
        } else {
            window.location.href = '/index.html';
        }
    });
}

// Load chat history from Firestore
async function loadChatHistory() {
    if (!currentUniqueLinkId) return;
    
    try {
        const messagesSnapshot = await db.collection('chats')
            .doc(currentUniqueLinkId)
            .collection('messages')
            .orderBy('timestamp', 'asc')
            .get();
        
        currentChatSession = [];
        messagesContainer.innerHTML = '';
        
        if (messagesSnapshot.empty) {
            showWelcomeMessage();
        } else {
            messagesSnapshot.forEach(doc => {
                const messageData = doc.data();
                currentChatSession.push(messageData);
                displayMessage(messageData);
            });
        }
        
        loadChatHistoryList();
    } catch (error) {
        console.error('Error loading chat history:', error);
        showToast('Gagal memuat riwayat chat', 'error');
    }
}

// Display welcome message
function showWelcomeMessage() {
    messagesContainer.innerHTML = `
        <div class="welcome-message-chat">
            <div class="ai-avatar">
                <img src="vestlog.jpg" alt="AI" class="avatar-img">
            </div>
            <div class="ai-message">
                <p>Halo! Saya asisten AI dari vesta.ai. Ada yang bisa saya bantu?</p>
            </div>
        </div>
    `;
}

// Display message in chat
function displayMessage(messageData) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${messageData.role === 'user' ? 'user-message' : 'ai-message-wrapper'}`;
    
    if (messageData.role === 'user') {
        messageDiv.innerHTML = `
            <div class="message-bubble user-bubble">
                <p>${escapeHtml(messageData.content)}</p>
                <span class="message-time">${formatTime(messageData.timestamp)}</span>
            </div>
        `;
    } else {
        const sourcesHtml = messageData.sources ? `
            <div class="sources-section">
                <h4><i class="fas fa-link"></i> Sources:</h4>
                <ul class="sources-list">
                    ${messageData.sources.map(source => `
                        <li><a href="${source.url}" target="_blank" rel="noopener">${source.title}</a></li>
                    `).join('')}
                </ul>
            </div>
        ` : '';
        
        messageDiv.innerHTML = `
            <div class="ai-avatar-small">
                <img src="vestlog.jpg" alt="AI">
            </div>
            <div class="message-bubble ai-bubble">
                <div class="ai-message-content">${formatMessage(messageData.content)}</div>
                ${sourcesHtml}
                <div class="message-actions">
                    <button class="action-btn copy-btn" onclick="copyMessage(this)" title="Copy">
                        <i class="fas fa-copy"></i>
                    </button>
                    <span class="message-time">${formatTime(messageData.timestamp)}</span>
                </div>
            </div>
        `;
    }
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// Format message with markdown-like styling
function formatMessage(content) {
    // Convert URLs to clickable links
    content = content.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener">$1</a>'
    );
    
    // Convert **bold** text
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert line breaks
    content = content.replace(/\n/g, '<br>');
    
    return content;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format timestamp
function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

// Scroll to bottom of messages
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Send message to AI
async function sendMessage(userMessage) {
    if (isProcessing) return;
    isProcessing = true;
    
    // Add user message to chat
    const userMessageData = {
        role: 'user',
        content: userMessage,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    currentChatSession.push(userMessageData);
    displayMessage({...userMessageData, timestamp: new Date()});
    
    // Save to Firestore
    try {
        await db.collection('chats')
            .doc(currentUniqueLinkId)
            .collection('messages')
            .add(userMessageData);
    } catch (error) {
        console.error('Error saving message:', error);
    }
    
    // Show typing indicator
    typingIndicator.style.display = 'flex';
    messageInput.value = '';
    
    try {
        // Prepare messages for API
        const apiMessages = currentChatSession.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
        
        // Call SumoPod API
        const response = await fetch(`${SUMOPOD_CONFIG.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUMOPOD_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: SUMOPOD_CONFIG.model,
                messages: [
                    {
                        role: 'system',
                        content: 'Anda adalah asisten AI yang membantu dari vesta.ai. Gunakan alat pencarian web jika perlu untuk informasi terkini.'
                    },
                    ...apiMessages
                ],
                tools: [
                    {
                        type: 'function',
                        function: {
                            name: 'browsingWeb',
                            description: 'Cari informasi terkini di web menggunakan Tavily Search API',
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
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        const aiMessage = data.choices[0].message;
        
        // Handle function calling
        if (aiMessage.tool_calls) {
            await handleToolCalls(aiMessage.tool_calls, apiMessages);
        } else {
            // Display AI response
            const aiMessageData = {
                role: 'assistant',
                content: aiMessage.content,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            currentChatSession.push(aiMessageData);
            displayMessage({...aiMessageData, timestamp: new Date()});
            
            // Save to Firestore
            await db.collection('chats')
                .doc(currentUniqueLinkId)
                .collection('messages')
                .add(aiMessageData);
        }
    } catch (error) {
        console.error('Error calling AI:', error);
        showToast('Gagal mendapatkan respons dari AI', 'error');
        
        const errorMessageData = {
            role: 'assistant',
            content: 'Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        currentChatSession.push(errorMessageData);
        displayMessage({...errorMessageData, timestamp: new Date()});
        
        await db.collection('chats')
            .doc(currentUniqueLinkId)
            .collection('messages')
            .add(errorMessageData);
    } finally {
        typingIndicator.style.display = 'none';
        isProcessing = false;
    }
}

// Handle tool calls from AI
async function handleToolCalls(toolCalls, apiMessages) {
    const toolResults = [];
    
    for (const toolCall of toolCalls) {
        if (toolCall.function.name === 'browsingWeb') {
            try {
                const args = JSON.parse(toolCall.function.arguments);
                const searchResult = await performTavilySearch(args.query);
                
                toolResults.push({
                    tool_call_id: toolCall.id,
                    role: 'tool',
                    name: 'browsingWeb',
                    content: JSON.stringify(searchResult)
                });
            } catch (error) {
                console.error('Error performing search:', error);
            }
        }
    }
    
    // Send updated messages with tool results back to AI
    try {
        const finalMessages = [
            ...apiMessages,
            {
                role: 'assistant',
                tool_calls: toolCalls
            },
            ...toolResults
        ];
        
        const response = await fetch(`${SUMOPOD_CONFIG.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUMOPOD_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: SUMOPOD_CONFIG.model,
                messages: finalMessages
            })
        });
        
        const data = await response.json();
        const finalMessage = data.choices[0].message;
        
        // Extract sources if available
        let sources = [];
        if (toolResults.length > 0) {
            try {
                const searchData = JSON.parse(toolResults[0].content);
                sources = searchData.results.slice(0, 3).map(result => ({
                    title: result.title,
                    url: result.url
                }));
            } catch (e) {
                console.error('Error parsing sources:', e);
            }
        }
        
        const aiMessageData = {
            role: 'assistant',
            content: finalMessage.content,
            sources: sources,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        currentChatSession.push(aiMessageData);
        displayMessage({...aiMessageData, timestamp: new Date()});
        
        await db.collection('chats')
            .doc(currentUniqueLinkId)
            .collection('messages')
            .add(aiMessageData);
    } catch (error) {
        console.error('Error getting final response:', error);
    }
}

// Perform Tavily search
async function performTavilySearch(query) {
    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: TAVILY_CONFIG.apiKey,
                query: query,
                search_depth: 'basic',
                include_answer: true,
                max_results: 3
            })
        });
        
        const data = await response.json();
        return {
            query: query,
            answer: data.answer || '',
            results: data.results || []
        };
    } catch (error) {
        console.error('Tavily search error:', error);
        return {
            query: query,
            answer: '',
            results: []
        };
    }
}

// Copy message content
window.copyMessage = function(button) {
    const messageContent = button.closest('.ai-bubble').querySelector('.ai-message-content').textContent;
    navigator.clipboard.writeText(messageContent).then(() => {
        showToast('Pesan berhasil disalin!', 'success');
    }).catch(() => {
        showToast('Gagal menyalin pesan', 'error');
    });
};

// Share chat publicly
async function shareChat() {
    if (currentChatSession.length === 0) {
        showToast('Tidak ada chat untuk dibagikan', 'error');
        return;
    }
    
    try {
        const shareId = 'share-' + generateRandomId();
        const shareData = {
            messages: currentChatSession.map(msg => ({
                ...msg,
                timestamp: msg.timestamp instanceof firebase.firestore.Timestamp 
                    ? msg.timestamp.toDate().toISOString() 
                    : new Date().toISOString()
            })),
            createdBy: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            username: userData.username
        };
        
        await db.collection('shared_chats').doc(shareId).set(shareData);
        
        const shareUrl = `https://raflymusyaf.web.id/share/${shareId}`;
        document.getElementById('shareLinkInput').value = shareUrl;
        shareModal.style.display = 'flex';
        
        // Copy button functionality
        document.getElementById('copyShareLinkBtn').onclick = () => {
            navigator.clipboard.writeText(shareUrl).then(() => {
                showToast('Link berhasil disalin!', 'success');
            });
        };
    } catch (error) {
        console.error('Error sharing chat:', error);
        showToast('Gagal membagikan chat', 'error');
    }
}

// Generate random ID
function generateRandomId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Load chat history list in sidebar
async function loadChatHistoryList() {
    if (!currentUniqueLinkId) return;
    
    try {
        const messagesSnapshot = await db.collection('chats')
            .doc(currentUniqueLinkId)
            .collection('messages')
            .orderBy('timestamp', 'asc')
            .limit(1)
            .get();
        
        if (!messagesSnapshot.empty) {
            const firstMessage = messagesSnapshot.docs[0].data();
            const firstMessagePreview = firstMessage.content.substring(0, 50) + '...';
            
            chatHistoryList.innerHTML = `
                <div class="chat-history-item active">
                    <i class="fas fa-comment"></i>
                    <div class="chat-history-content">
                        <p class="chat-history-preview">${firstMessagePreview}</p>
                        <span class="chat-history-time">${formatTime(firstMessage.timestamp)}</span>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading chat history list:', error);
    }
}

// New chat
function startNewChat() {
    if (currentChatSession.length > 0) {
        currentChatSession = [];
        messagesContainer.innerHTML = '';
        showWelcomeMessage();
        showToast('Chat baru dimulai', 'success');
    }
}

// Event listeners
if (messageForm) {
    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (message) {
            await sendMessage(message);
        }
    });
}

if (messageInput) {
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            messageForm.dispatchEvent(new Event('submit'));
        }
    });
    
    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
}

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
}

if (closeSidebarBtn) {
    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('active');
    });
}

if (newChatBtn) {
    newChatBtn.addEventListener('click', startNewChat);
}

if (shareChatBtn) {
    shareChatBtn.addEventListener('click', shareChat);
}

if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener('click', async () => {
        await auth.signOut();
        window.location.href = '/index.html';
    });
}

// Close modal
document.querySelector('.modal-close-btn')?.addEventListener('click', () => {
    shareModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === shareModal) {
        shareModal.style.display = 'none';
    }
});

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `toast toast-${type} show`;
        setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    }
}

// Initialize chat on page load
document.addEventListener('DOMContentLoaded', initChat);
