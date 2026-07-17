/**
 * Web Ahay - Chat Module
 * Handles AI chat, web search, image analysis, and session management
 * @version 1.0.0
 */

// Global Chat State
const ChatState = {
    currentSession: null,
    messageHistory: [],
    isProcessing: false,
    isStreaming: false,
    currentImageBase64: null,
    currentImageFile: null,
    abortController: null,
    sessions: [],
    isInitialized: false
};

// DOM Elements Cache
const ChatDOM = {};

/**
 * Initialize Chat DOM references
 */
function initChatDOM() {
    ChatDOM.messagesContainer = document.getElementById("messagesContainer");
    ChatDOM.welcomeScreen = document.getElementById("welcomeScreen");
    ChatDOM.messageInput = document.getElementById("messageInput");
    ChatDOM.sendMessageBtn = document.getElementById("sendMessageBtn");
    ChatDOM.attachImageBtn = document.getElementById("attachImageBtn");
    ChatDOM.imageInput = document.getElementById("imageInput");
    ChatDOM.imagePreviewContainer = document.getElementById("imagePreviewContainer");
    ChatDOM.imagePreview = document.getElementById("imagePreview");
    ChatDOM.imagePromptInput = document.getElementById("imagePrompt");
    ChatDOM.removeImageBtn = document.getElementById("removeImageBtn");
    ChatDOM.aiStatus = document.getElementById("aiStatus");
    ChatDOM.statusText = document.getElementById("statusText");
    ChatDOM.sessionsList = document.getElementById("sessionsList");
    ChatDOM.menuToggleBtn = document.getElementById("menuToggleBtn");
    ChatDOM.sidebar = document.getElementById("sidebar");
    ChatDOM.closeSidebarBtn = document.getElementById("closeSidebarBtn");
    ChatDOM.newSessionBtn = document.getElementById("newSessionBtn");
    ChatDOM.newChatSidebarBtn = document.getElementById("newChatSidebarBtn");
    ChatDOM.shareBtn = document.getElementById("shareBtn");
    ChatDOM.shareModal = document.getElementById("shareModal");
    ChatDOM.shareLinkInput = document.getElementById("shareLinkInput");
    ChatDOM.copyShareLinkBtn = document.getElementById("copyShareLinkBtn");
    ChatDOM.searchChatsInput = document.getElementById("searchChats");
    ChatDOM.toastContainer = document.getElementById("toastContainer");
}

/**
 * Helper Functions
 */
function getCurrentUser() {
    return window.getCurrentUser ? window.getCurrentUser() : null;
}

function getUserData() {
    return window.getUserData ? window.getUserData() : null;
}

function showToast(message, type) {
    if (window.showToast) {
        window.showToast(message, type);
    }
}

function showAIStatus(text) {
    if (ChatDOM.aiStatus && ChatDOM.statusText) {
        ChatDOM.aiStatus.style.display = "flex";
        ChatDOM.statusText.textContent = text;
    }
}

function hideAIStatus() {
    if (ChatDOM.aiStatus) {
        ChatDOM.aiStatus.style.display = "none";
    }
}

function scrollToBottom() {
    if (ChatDOM.messagesContainer) {
        ChatDOM.messagesContainer.scrollTop = ChatDOM.messagesContainer.scrollHeight;
    }
}

function formatTime(timestamp) {
    if (!timestamp) return "";
    
    let date;
    if (timestamp && typeof timestamp.toDate === "function") {
        date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else {
        date = new Date(timestamp);
    }
    
    if (isNaN(date.getTime())) return "";
    
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return "Baru saja";
    if (diff < 3600000) return Math.floor(diff / 60000) + " menit lalu";
    if (diff < 86400000) {
        return date.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit"
        });
    }
    if (diff < 604800000) {
        return date.toLocaleDateString("id-ID", {
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit"
        });
    }
    return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function formatMessage(content) {
    if (!content) return "";
    
    // Convert URLs to clickable links
    content = content.replace(
        /(https?:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="message-link">$1</a>'
    );
    
    // Bold text
    content = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    
    // Italic text
    content = content.replace(/\*(.*?)\*/g, "<em>$1</em>");
    
    // Inline code
    content = content.replace(/`([^`]+)`/g, "<code class=\"inline-code\">$1</code>");
    
    // Code blocks
    content = content.replace(
        /```(\w+)?\n([\s\S]*?)```/g,
        (match, lang, code) => {
            return `<pre class="code-block"><div class="code-header">${lang || "code"}<button class="copy-code-btn" onclick="copyCodeBlock(this)"><i class="fas fa-copy"></i></button></div><code>${escapeHtml(code.trim())}</code></pre>`;
        }
    );
    
    // Line breaks
    content = content.replace(/\n/g, "<br>");
    
    return content;
}

function generateId(prefix, length) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = prefix || "";
    const array = new Uint32Array(length || 10);
    if (window.crypto && window.crypto.getRandomValues) {
        crypto.getRandomValues(array);
    } else {
        for (let i = 0; i < (length || 10); i++) {
            array[i] = Math.floor(Math.random() * chars.length);
        }
    }
    for (let i = 0; i < (length || 10); i++) {
        result += chars.charAt(array[i] % chars.length);
    }
    return result;
}

/**
 * Message Display Functions
 */
function displayMessage(message) {
    if (!ChatDOM.messagesContainer) return;
    
    const wrapper = document.createElement("div");
    wrapper.className = `message-wrapper ${message.role === "user" ? "user" : "ai"}`;
    
    if (message.role === "user") {
        wrapper.innerHTML = buildUserMessage(message);
    } else {
        wrapper.innerHTML = buildAIMessage(message);
    }
    
    ChatDOM.messagesContainer.appendChild(wrapper);
    
    // Scroll to bottom with smooth behavior
    requestAnimationFrame(() => {
        scrollToBottom();
    });
}

function buildUserMessage(message) {
    const imageHtml = message.imageUrl ? `
        <div class="message-image">
            <img src="${message.imageUrl}" alt="Uploaded image" loading="lazy">
        </div>
    ` : "";
    
    return `
        <div class="message user-message">
            ${imageHtml}
            <div class="message-content">
                <p>${escapeHtml(message.content || "")}</p>
            </div>
            <span class="message-time">${formatTime(message.timestamp)}</span>
        </div>
    `;
}

function buildAIMessage(message) {
    const sourcesHtml = message.sources && message.sources.length ? `
        <div class="message-sources">
            <div class="sources-header">
                <i class="fas fa-globe"></i>
                <span>Sumber Pencarian Web:</span>
            </div>
            <div class="sources-list">
                ${message.sources.map((source, index) => `
                    <a href="${source.url || "#"}" target="_blank" rel="noopener noreferrer" class="source-item">
                        <span class="source-number">${index + 1}</span>
                        <span class="source-title">${escapeHtml(source.title || "Link")}</span>
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                `).join("")}
            </div>
        </div>
    ` : "";
    
    const searchBadge = message.searchedWeb ? `
        <div class="searched-badge">
            <i class="fas fa-search"></i>
            <span>Telah menelusuri web</span>
        </div>
    ` : "";
    
    const errorBadge = message.error ? `
        <div class="error-badge">
            <i class="fas fa-exclamation-triangle"></i>
            <span>Terjadi kesalahan</span>
        </div>
    ` : "";
    
    return `
        <div class="message ai-message">
            <div class="ai-avatar">
                <img src="vestlog.jpg" alt="vesta.ai" loading="lazy">
            </div>
            <div class="message-body">
                ${searchBadge}
                ${errorBadge}
                <div class="message-content">
                    ${formatMessage(message.content || "")}
                </div>
                ${sourcesHtml}
                <div class="message-actions">
                    <button class="btn-action copy-message-btn" onclick="copyMessageContent(this)" title="Salin pesan">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn-action regenerate-btn" onclick="regenerateMessage(this)" title="Regenerasi respons">
                        <i class="fas fa-redo"></i>
                    </button>
                    <span class="message-time">${formatTime(message.timestamp)}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Copy message content to clipboard
 */
window.copyMessageContent = function(button) {
    const messageBody = button.closest(".message-body");
    const content = messageBody.querySelector(".message-content").textContent;
    
    navigator.clipboard.writeText(content).then(() => {
        const originalHtml = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.style.color = "var(--accent-green)";
        
        setTimeout(() => {
            button.innerHTML = originalHtml;
            button.style.color = "";
        }, 2000);
        
        showToast("Pesan berhasil disalin! 📋", "success");
    }).catch(() => {
        showToast("Gagal menyalin pesan", "error");
    });
};

/**
 * Copy code block content
 */
window.copyCodeBlock = function(button) {
    const codeBlock = button.closest(".code-block");
    const code = codeBlock.querySelector("code").textContent;
    
    navigator.clipboard.writeText(code).then(() => {
        const originalHtml = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        
        setTimeout(() => {
            button.innerHTML = originalHtml;
        }, 2000);
        
        showToast("Kode berhasil disalin! 📋", "success");
    });
};

/**
 * Regenerate AI message
 */
window.regenerateMessage = async function(button) {
    if (ChatState.isProcessing) return;
    
    // Remove the AI message and the user message before it
    const messageWrapper = button.closest(".message-wrapper");
    const previousWrapper = messageWrapper.previousElementSibling;
    
    if (previousWrapper && previousWrapper.classList.contains("user")) {
        // Get user message content
        const userContent = previousWrapper.querySelector(".message-content").textContent;
        
        // Remove both messages from DOM
        messageWrapper.remove();
        previousWrapper.remove();
        
        // Remove from history
        ChatState.messageHistory = ChatState.messageHistory.slice(0, -2);
        
        // Re-send the user message
        ChatDOM.messageInput.value = userContent;
        await handleSendMessage();
    }
};

/**
 * Firebase Operations
 */
async function saveMessageToFirebase(message) {
    const userData = getUserData();
    if (!ChatState.currentSession || !userData) return null;
    
    try {
        const docRef = await db.collection("chats")
            .doc(userData.uniqueLinkId)
            .collection("sessions")
            .doc(ChatState.currentSession.id)
            .collection("messages")
            .add({
                ...message,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        
        return docRef.id;
    } catch (error) {
        console.error("Error saving message:", error);
        return null;
    }
}

async function updateSessionInFirebase() {
    const userData = getUserData();
    if (!ChatState.currentSession || !userData) return;
    
    try {
        const firstUserMsg = ChatState.messageHistory.find(m => m.role === "user");
        const title = firstUserMsg 
            ? firstUserMsg.content.substring(0, APP_CONFIG.maxSessionTitleLength) 
            : "Chat Baru";
        
        await db.collection("chats")
            .doc(userData.uniqueLinkId)
            .collection("sessions")
            .doc(ChatState.currentSession.id)
            .update({
                messageCount: ChatState.messageHistory.length,
                title: title,
                lastMessage: ChatState.messageHistory[ChatState.messageHistory.length - 1]?.content?.substring(0, 100) || "",
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
    } catch (error) {
        console.error("Error updating session:", error);
    }
}

async function loadSessionsFromFirebase() {
    const userData = getUserData();
    if (!userData || !ChatDOM.sessionsList) return;
    
    try {
        const snapshot = await db.collection("chats")
            .doc(userData.uniqueLinkId)
            .collection("sessions")
            .orderBy("updatedAt", "desc")
            .orderBy("createdAt", "desc")
            .limit(50)
            .get();
        
        ChatState.sessions = [];
        ChatDOM.sessionsList.innerHTML = "";
        
        if (snapshot.empty) {
            ChatDOM.sessionsList.innerHTML = `
                <div class="empty-sessions">
                    <i class="fas fa-comments"></i>
                    <p>Belum ada riwayat chat</p>
                    <span>Mulai chat baru untuk memulai</span>
                </div>
            `;
            return;
        }
        
        snapshot.forEach(doc => {
            const session = { id: doc.id, ...doc.data() };
            ChatState.sessions.push(session);
            renderSessionItem(session);
        });
        
    } catch (error) {
        console.error("Error loading sessions:", error);
    }
}

function renderSessionItem(session) {
    if (!ChatDOM.sessionsList) return;
    
    const div = document.createElement("div");
    div.className = `session-item ${ChatState.currentSession && ChatState.currentSession.id === session.id ? "active" : ""}`;
    div.setAttribute("data-session-id", session.id);
    
    div.innerHTML = `
        <i class="fas fa-comment session-icon"></i>
        <div class="session-info">
            <p class="session-title">${escapeHtml(session.title || "Chat Baru")}</p>
            <span class="session-time">${formatTime(session.updatedAt || session.createdAt)}</span>
        </div>
        <span class="session-count">${session.messageCount || 0}</span>
        <button class="session-delete-btn" onclick="event.stopPropagation(); deleteSession('${session.id}')" title="Hapus sesi">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    div.addEventListener("click", () => loadSession(session.id));
    ChatDOM.sessionsList.appendChild(div);
}

async function loadSession(sessionId) {
    const userData = getUserData();
    if (!userData) return;
    
    try {
        showAIStatus("Memuat sesi...");
        
        const snapshot = await db.collection("chats")
            .doc(userData.uniqueLinkId)
            .collection("sessions")
            .doc(sessionId)
            .collection("messages")
            .orderBy("timestamp", "asc")
            .get();
        
        ChatState.currentSession = { id: sessionId };
        ChatState.messageHistory = [];
        
        // Clear messages
        if (ChatDOM.messagesContainer) {
            ChatDOM.messagesContainer.innerHTML = "";
        }
        
        // Hide welcome screen
        if (ChatDOM.welcomeScreen) {
            ChatDOM.welcomeScreen.style.display = "none";
        }
        
        // Display messages
        snapshot.forEach(doc => {
            const msg = doc.data();
            ChatState.messageHistory.push(msg);
            displayMessage(msg);
        });
        
        // Refresh sessions list
        await loadSessionsFromFirebase();
        
        // Close sidebar on mobile
        if (ChatDOM.sidebar && window.innerWidth < UI_CONFIG.mobileBreakpoint) {
            ChatDOM.sidebar.classList.remove("active");
        }
        
        hideAIStatus();
        showToast("Sesi berhasil dimuat", "success");
        
    } catch (error) {
        console.error("Error loading session:", error);
        hideAIStatus();
        showToast("Gagal memuat sesi", "error");
    }
}

async function deleteSession(sessionId) {
    const userData = getUserData();
    if (!userData) return;
    
    if (!confirm("Apakah Anda yakin ingin menghapus sesi ini?")) return;
    
    try {
        // Delete all messages in the session
        const messagesSnapshot = await db.collection("chats")
            .doc(userData.uniqueLinkId)
            .collection("sessions")
            .doc(sessionId)
            .collection("messages")
            .get();
        
        const batch = db.batch();
        messagesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // Delete the session document
        batch.delete(db.collection("chats")
            .doc(userData.uniqueLinkId)
            .collection("sessions")
            .doc(sessionId));
        
        await batch.commit();
        
        // If current session is deleted, create new one
        if (ChatState.currentSession && ChatState.currentSession.id === sessionId) {
            await createNewSession();
        }
        
        await loadSessionsFromFirebase();
        showToast("Sesi berhasil dihapus", "success");
        
    } catch (error) {
        console.error("Error deleting session:", error);
        showToast("Gagal menghapus sesi", "error");
    }
}

async function createNewSession() {
    const userData = getUserData();
    if (!userData) return;
    
    ChatState.currentSession = {
        id: generateId(APP_CONFIG.sessionIdPrefix, 13)
    };
    ChatState.messageHistory = [];
    
    // Clear messages
    if (ChatDOM.messagesContainer) {
        ChatDOM.messagesContainer.innerHTML = "";
    }
    
    // Show welcome screen
    if (ChatDOM.welcomeScreen) {
        ChatDOM.welcomeScreen.style.display = "flex";
    }
    
    // Save to Firebase
    try {
        await db.collection("chats")
            .doc(userData.uniqueLinkId)
            .collection("sessions")
            .doc(ChatState.currentSession.id)
            .set({
                title: "Chat Baru",
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                messageCount: 0
            });
    } catch (error) {
        console.error("Error creating session:", error);
    }
    
    await loadSessionsFromFirebase();
    
    // Close sidebar
    if (ChatDOM.sidebar) {
        ChatDOM.sidebar.classList.remove("active");
    }
    
    // Focus input
    if (ChatDOM.messageInput) {
        ChatDOM.messageInput.focus();
    }
    
    showToast("Chat baru dimulai! 🎉", "success");
}

/**
 * Web Search with Tavily API
 */
async function performWebSearch(query) {
    try {
        const response = await fetch(TAVILY_CONFIG.baseUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                api_key: TAVILY_CONFIG.apiKey,
                query: query,
                search_depth: TAVILY_CONFIG.searchDepth,
                include_answer: TAVILY_CONFIG.includeAnswer,
                max_results: TAVILY_CONFIG.maxResults
            })
        });
        
        if (!response.ok) {
            throw new Error(`Search failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        return {
            query: query,
            answer: data.answer || "",
            results: (data.results || []).map(r => ({
                title: r.title,
                url: r.url,
                content: r.content?.substring(0, 200) || ""
            }))
        };
        
    } catch (error) {
        console.error("Web search error:", error);
        return {
            query: query,
            answer: "",
            results: [],
            error: error.message
        };
    }
}

/**
 * AI Response Handler
 */
async function getAIResponse(messages) {
    try {
        // Prepare messages for API
        const apiMessages = [
            {
                role: "system",
                content: `Anda adalah asisten AI cerdas dari vesta.ai bernama Web Ahay. 
Anda adalah asisten yang ramah, informatif, dan membantu dalam bahasa Indonesia.

Kemampuan Anda:
1. Menjawab pertanyaan dengan akurat dan mendetail
2. Mencari informasi terkini di web menggunakan tool webSearch
3. Menganalisis gambar yang dikirim pengguna
4. Mengingat konteks percakapan (${APP_CONFIG.maxHistoryMessages} pesan terakhir)
5. Memberikan respons yang natural dan mudah dipahami

Panduan:
- Gunakan bahasa Indonesia yang baik dan benar
- Jika mencari informasi terkini, gunakan tool webSearch
- Jika menganalisis gambar, berikan deskripsi detail
- Jika tidak tahu, akui dengan jujur
- Berikan jawaban yang terstruktur dan mudah dibaca
- Gunakan format markdown untuk mempercantik tampilan`
            },
            ...messages.map(m => ({
                role: m.role,
                content: m.content
            }))
        ];
        
        // Handle image in the last message
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.imageUrl) {
            apiMessages[apiMessages.length - 1].content = [
                {
                    type: "text",
                    text: lastMsg.imagePrompt || "Jelaskan gambar ini secara detail dalam bahasa Indonesia."
                },
                {
                    type: "image_url",
                    image_url: {
                        url: lastMsg.imageUrl,
                        detail: "auto"
                    }
                }
            ];
        }
        
        // Create abort controller for cancellation
        ChatState.abortController = new AbortController();
        
        // Call SumoPod API
        const response = await fetch(`${SUMOPOD_CONFIG.baseURL}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${SUMOPOD_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: SUMOPOD_CONFIG.model,
                messages: apiMessages,
                max_tokens: SUMOPOD_CONFIG.maxTokens,
                temperature: SUMOPOD_CONFIG.temperature,
                top_p: SUMOPOD_CONFIG.topP,
                frequency_penalty: SUMOPOD_CONFIG.frequencyPenalty,
                presence_penalty: SUMOPOD_CONFIG.presencePenalty,
                tools: [
                    {
                        type: "function",
                        function: {
                            name: "webSearch",
                            description: "Cari informasi terkini di web menggunakan Tavily Search API. Gunakan ini ketika pengguna meminta informasi terbaru, berita, atau data real-time.",
                            parameters: {
                                type: "object",
                                properties: {
                                    query: {
                                        type: "string",
                                        description: "Kata kunci pencarian dalam bahasa Indonesia atau Inggris"
                                    }
                                },
                                required: ["query"]
                            }
                        }
                    }
                ],
                tool_choice: "auto"
            }),
            signal: ChatState.abortController.signal
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const aiMessage = data.choices[0].message;
        
        // Handle tool calls (web search)
        if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
            showAIStatus("🔍 Menelusuri web...");
            
            const toolResults = [];
            
            for (const toolCall of aiMessage.tool_calls) {
                if (toolCall.function.name === "webSearch") {
                    const args = JSON.parse(toolCall.function.arguments);
                    const searchResult = await performWebSearch(args.query);
                    
                    toolResults.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        name: "webSearch",
                        content: JSON.stringify(searchResult)
                    });
                }
            }
            
            showAIStatus("📝 Menyusun jawaban...");
            
            // Get final response with search results
            const finalMessages = [
                ...apiMessages,
                aiMessage,
                ...toolResults
            ];
            
            const finalResponse = await fetch(`${SUMOPOD_CONFIG.baseURL}/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${SUMOPOD_CONFIG.apiKey}`
                },
                body: JSON.stringify({
                    model: SUMOPOD_CONFIG.model,
                    messages: finalMessages,
                    max_tokens: SUMOPOD_CONFIG.maxTokens,
                    temperature: SUMOPOD_CONFIG.temperature
                }),
                signal: ChatState.abortController.signal
            });
            
            if (!finalResponse.ok) {
                throw new Error("Final response failed");
            }
            
            const finalData = await finalResponse.json();
            const finalContent = finalData.choices[0].message.content;
            
            // Extract sources
            let sources = [];
            try {
                const searchData = JSON.parse(toolResults[0].content);
                sources = (searchData.results || []).slice(0, 3).map(r => ({
                    title: r.title,
                    url: r.url
                }));
            } catch (e) {
                console.error("Error parsing sources:", e);
            }
            
            return {
                role: "assistant",
                content: finalContent,
                timestamp: new Date().toISOString(),
                sources: sources,
                searchedWeb: true
            };
        }
        
        // Regular response (no tool calls)
        return {
            role: "assistant",
            content: aiMessage.content,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        if (error.name === "AbortError") {
            return {
                role: "assistant",
                content: "⏹️ Respons dibatalkan.",
                timestamp: new Date().toISOString(),
                error: true
            };
        }
        
        console.error("AI Response error:", error);
        return {
            role: "assistant",
            content: "Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi nanti. 😔",
            timestamp: new Date().toISOString(),
            error: true
        };
    }
}

/**
 * Send Message Handler
 */
async function handleSendMessage() {
    if (ChatState.isProcessing) return;
    
    const message = ChatDOM.messageInput?.value.trim();
    if (!message && !ChatState.currentImageBase64) return;
    
    // Disable send button
    ChatState.isProcessing = true;
    if (ChatDOM.sendMessageBtn) {
        ChatDOM.sendMessageBtn.disabled = true;
    }
    
    try {
        // Create session if none exists
        if (!ChatState.currentSession) {
            await createNewSession();
        }
        
        // Build user message
        const userMsg = {
            role: "user",
            content: message || "📷 Tolong analisis gambar ini",
            timestamp: new Date().toISOString()
        };
        
        if (ChatState.currentImageBase64) {
            userMsg.imageUrl = ChatState.currentImageBase64;
            userMsg.imagePrompt = ChatDOM.imagePromptInput?.value.trim() || "";
        }
        
        // Display user message
        displayMessage(userMsg);
        ChatState.messageHistory.push(userMsg);
        
        // Clear inputs
        if (ChatDOM.messageInput) ChatDOM.messageInput.value = "";
        if (ChatDOM.messageInput) {
            ChatDOM.messageInput.style.height = "auto";
        }
        removeImage();
        
        // Hide welcome screen
        if (ChatDOM.welcomeScreen) {
            ChatDOM.welcomeScreen.style.display = "none";
        }
        
        // Save user message
        await saveMessageToFirebase(userMsg);
        
        // Show AI status
        showAIStatus("🧠 vesta.ai Thinking...");
        
        // Get AI response
        const aiMsg = await getAIResponse(ChatState.messageHistory);
        
        // Hide AI status
        hideAIStatus();
        
        // Display AI response
        displayMessage(aiMsg);
        ChatState.messageHistory.push(aiMsg);
        
        // Save AI message
        await saveMessageToFirebase(aiMsg);
        
        // Trim history to max messages
        if (ChatState.messageHistory.length > APP_CONFIG.maxHistoryMessages) {
            ChatState.messageHistory = ChatState.messageHistory.slice(-APP_CONFIG.maxHistoryMessages);
        }
        
        // Update session
        await updateSessionInFirebase();
        await loadSessionsFromFirebase();
        
    } catch (error) {
        console.error("Error sending message:", error);
        hideAIStatus();
        showToast(ERROR_MESSAGES.chat.sendFailed, "error");
    } finally {
        ChatState.isProcessing = false;
        if (ChatDOM.sendMessageBtn) {
            ChatDOM.sendMessageBtn.disabled = false;
        }
        if (ChatDOM.messageInput) {
            ChatDOM.messageInput.focus();
        }
    }
}

/**
 * Image Handling
 */
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!APP_CONFIG.supportedImageTypes.includes(file.type)) {
        showToast(ERROR_MESSAGES.chat.invalidImageType, "error");
        event.target.value = "";
        return;
    }
    
    // Validate file size
    if (file.size > APP_CONFIG.maxImageSize) {
        showToast(ERROR_MESSAGES.chat.imageTooLarge, "error");
        event.target.value = "";
        return;
    }
    
    ChatState.currentImageFile = file;
    
    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
        ChatState.currentImageBase64 = e.target.result;
        
        if (ChatDOM.imagePreview) {
            ChatDOM.imagePreview.src = e.target.result;
        }
        if (ChatDOM.imagePreviewContainer) {
            ChatDOM.imagePreviewContainer.style.display = "flex";
        }
        
        // Focus prompt input
        if (ChatDOM.imagePromptInput) {
            ChatDOM.imagePromptInput.focus();
        }
    };
    reader.onerror = () => {
        showToast("Gagal membaca file gambar", "error");
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    ChatState.currentImageFile = null;
    ChatState.currentImageBase64 = null;
    
    if (ChatDOM.imagePreview) {
        ChatDOM.imagePreview.src = "";
    }
    if (ChatDOM.imagePromptInput) {
        ChatDOM.imagePromptInput.value = "";
    }
    if (ChatDOM.imagePreviewContainer) {
        ChatDOM.imagePreviewContainer.style.display = "none";
    }
    if (ChatDOM.imageInput) {
        ChatDOM.imageInput.value = "";
    }
}

/**
 * Share Chat Handler
 */
async function handleShareChat() {
    if (!ChatState.currentSession || ChatState.messageHistory.length === 0) {
        showToast("Tidak ada chat untuk dibagikan", "warning");
        return;
    }
    
    try {
        showAIStatus("📤 Membuat link share...");
        
        const shareId = generateId(APP_CONFIG.shareIdPrefix, APP_CONFIG.shareRandomLength);
        const userData = getUserData();
        
        await db.collection("shared_chats").doc(shareId).set({
            messages: ChatState.messageHistory.map(m => ({
                ...m,
                timestamp: m.timestamp || new Date().toISOString()
            })),
            createdBy: getCurrentUser()?.uid,
            username: userData?.username || "Anonymous",
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            messageCount: ChatState.messageHistory.length,
            title: ChatState.messageHistory.find(m => m.role === "user")?.content?.substring(0, 100) || "Shared Chat"
        });
        
        const shareUrl = `https://${APP_CONFIG.domain}/share/${shareId}`;
        
        if (ChatDOM.shareLinkInput) {
            ChatDOM.shareLinkInput.value = shareUrl;
        }
        if (ChatDOM.shareModal) {
            ChatDOM.shareModal.style.display = "flex";
        }
        
        hideAIStatus();
        showToast("Link share berhasil dibuat! 🎉", "success");
        
    } catch (error) {
        console.error("Error sharing chat:", error);
        hideAIStatus();
        showToast(ERROR_MESSAGES.chat.shareFailed, "error");
    }
}

function copyShareLink() {
    if (!ChatDOM.shareLinkInput) return;
    
    navigator.clipboard.writeText(ChatDOM.shareLinkInput.value).then(() => {
        showToast("Link berhasil disalin! 📋", "success");
        
        if (ChatDOM.copyShareLinkBtn) {
            const originalHtml = ChatDOM.copyShareLinkBtn.innerHTML;
            ChatDOM.copyShareLinkBtn.innerHTML = '<i class="fas fa-check"></i> Tersalin!';
            setTimeout(() => {
                ChatDOM.copyShareLinkBtn.innerHTML = originalHtml;
            }, 2000);
        }
    }).catch(() => {
        showToast("Gagal menyalin link", "error");
    });
}

function closeShareModal() {
    if (ChatDOM.shareModal) {
        ChatDOM.shareModal.style.display = "none";
    }
}

/**
 * Quick Actions
 */
window.sendQuickMessage = function(message) {
    if (ChatDOM.messageInput) {
        ChatDOM.messageInput.value = message;
        handleSendMessage();
    }
};

/**
 * Event Listeners Setup
 */
function setupEventListeners() {
    // Send message
    if (ChatDOM.sendMessageBtn) {
        ChatDOM.sendMessageBtn.addEventListener("click", handleSendMessage);
    }
    
    // Enter to send (Shift+Enter for new line)
    if (ChatDOM.messageInput) {
        ChatDOM.messageInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
        
        // Auto-resize textarea
        ChatDOM.messageInput.addEventListener("input", function() {
            this.style.height = "auto";
            this.style.height = Math.min(this.scrollHeight, UI_CONFIG.maxTextareaHeight) + "px";
        });
    }
    
    // Image upload
    if (ChatDOM.attachImageBtn && ChatDOM.imageInput) {
        ChatDOM.attachImageBtn.addEventListener("click", () => {
            ChatDOM.imageInput.click();
        });
        ChatDOM.imageInput.addEventListener("change", handleImageUpload);
    }
    
    // Remove image
    if (ChatDOM.removeImageBtn) {
        ChatDOM.removeImageBtn.addEventListener("click", removeImage);
    }
    
    // Sidebar toggle
    if (ChatDOM.menuToggleBtn && ChatDOM.sidebar) {
        ChatDOM.menuToggleBtn.addEventListener("click", () => {
            ChatDOM.sidebar.classList.toggle("active");
        });
    }
    
    // Close sidebar
    if (ChatDOM.closeSidebarBtn && ChatDOM.sidebar) {
        ChatDOM.closeSidebarBtn.addEventListener("click", () => {
            ChatDOM.sidebar.classList.remove("active");
        });
    }
    
    // Click outside sidebar to close
    document.addEventListener("click", (e) => {
        if (ChatDOM.sidebar && ChatDOM.sidebar.classList.contains("active")) {
            if (!ChatDOM.sidebar.contains(e.target) && 
                e.target !== ChatDOM.menuToggleBtn &&
                !ChatDOM.menuToggleBtn?.contains(e.target)) {
                ChatDOM.sidebar.classList.remove("active");
            }
        }
    });
    
    // New session
    if (ChatDOM.newSessionBtn) {
        ChatDOM.newSessionBtn.addEventListener("click", createNewSession);
    }
    if (ChatDOM.newChatSidebarBtn) {
        ChatDOM.newChatSidebarBtn.addEventListener("click", createNewSession);
    }
    
    // Share
    if (ChatDOM.shareBtn) {
        ChatDOM.shareBtn.addEventListener("click", handleShareChat);
    }
    if (ChatDOM.copyShareLinkBtn) {
        ChatDOM.copyShareLinkBtn.addEventListener("click", copyShareLink);
    }
    
    // Close share modal
    if (ChatDOM.shareModal) {
        ChatDOM.shareModal.addEventListener("click", (e) => {
            if (e.target === ChatDOM.shareModal) {
                closeShareModal();
            }
        });
    }
    
    // Search sessions
    if (ChatDOM.searchChatsInput && ChatDOM.sessionsList) {
        ChatDOM.searchChatsInput.addEventListener("input", (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const sessionItems = ChatDOM.sessionsList.querySelectorAll(".session-item");
            
            sessionItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    item.style.display = "flex";
                } else {
                    item.style.display = "none";
                }
            });
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
        // Ctrl+K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
            e.preventDefault();
            if (ChatDOM.searchChatsInput) {
                ChatDOM.searchChatsInput.focus();
            }
        }
        
        // Escape to close modals
        if (e.key === "Escape") {
            if (ChatDOM.shareModal && ChatDOM.shareModal.style.display === "flex") {
                closeShareModal();
            }
            if (ChatDOM.sidebar && ChatDOM.sidebar.classList.contains("active")) {
                ChatDOM.sidebar.classList.remove("active");
            }
        }
    });
    
    // Handle window resize
    let resizeTimeout;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            scrollToBottom();
        }, 250);
    });
}

/**
 * Initialize Chat Module
 */
async function initChat() {
    initChatDOM();
    setupEventListeners();
    
    // Wait for auth to be ready
    const waitForAuth = () => {
        return new Promise((resolve) => {
            const check = setInterval(() => {
                if (window.AppState && window.AppState.authReady) {
                    clearInterval(check);
                    resolve();
                }
                if (getCurrentUser() && getUserData()) {
                    clearInterval(check);
                    resolve();
                }
            }, 100);
        });
    };
    
    await waitForAuth();
    
    // Load sessions
    await loadSessionsFromFirebase();
    
    // Focus input
    if (ChatDOM.messageInput) {
        ChatDOM.messageInput.focus();
    }
    
    ChatState.isInitialized = true;
    
    if (FEATURE_FLAGS && FEATURE_FLAGS.enableDebugMode) {
        console.log("💬 Chat module initialized");
    }
}

// Listen for auth state changes
window.addEventListener("authStateChanged", async (event) => {
    if (event.detail.isAuthenticated && event.detail.isUsernameSet) {
        if (!ChatState.isInitialized) {
            await initChat();
        } else {
            await loadSessionsFromFirebase();
        }
    }
});

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    // Wait a bit for auth to initialize first
    setTimeout(async () => {
        const user = getCurrentUser();
        const userData = getUserData();
        
        if (user && userData && userData.username) {
            await initChat();
        }
    }, 500);
});

// Export functions for external use
window.ChatState = ChatState;
window.createNewSession = createNewSession;
window.loadSession = loadSession;
window.deleteSession = deleteSession;
