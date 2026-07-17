/**
 * Web Ahay - Share Module
 * Public shared chat viewer (read-only)
 * @version 1.0.0
 */

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
    try {
        firebase.initializeApp(FIREBASE_CONFIG);
    } catch (error) {
        console.error("Firebase initialization error:", error);
    }
}

const db = firebase.firestore();

// DOM Elements
const sharedMessagesContainer = document.getElementById("sharedMessagesContainer");

// State
let sharedChatData = null;

/**
 * Extract share ID from URL
 */
function getShareIdFromURL() {
    const path = window.location.pathname;
    const match = path.match(/\/share\/(share-[a-z0-9]+)/);
    return match ? match[1] : null;
}

/**
 * Format timestamp
 */
function formatShareTime(timestamp) {
    if (!timestamp) return "";
    
    let date;
    if (timestamp && typeof timestamp.toDate === "function") {
        date = timestamp.toDate();
    } else {
        date = new Date(timestamp);
    }
    
    if (isNaN(date.getTime())) return "";
    
    return date.toLocaleString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format message content
 */
function formatShareMessage(content) {
    if (!content) return "";
    
    // Convert URLs to clickable links
    content = content.replace(
        /(https?:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
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
            return `<pre class="code-block"><div class="code-header">${lang || "code"}<button class="copy-code-btn" onclick="copySharedCode(this)"><i class="fas fa-copy"></i></button></div><code>${escapeHtml(code.trim())}</code></pre>`;
        }
    );
    
    // Line breaks
    content = content.replace(/\n/g, "<br>");
    
    return content;
}

/**
 * Build user message HTML
 */
function buildSharedUserMessage(message) {
    const imageHtml = message.imageUrl ? `
        <div class="message-image">
            <img src="${message.imageUrl}" alt="Shared image" loading="lazy">
        </div>
    ` : "";
    
    return `
        <div class="message-wrapper user">
            <div class="message user-message">
                ${imageHtml}
                <div class="message-content">
                    <p>${escapeHtml(message.content || "")}</p>
                </div>
                <span class="message-time">${formatShareTime(message.timestamp)}</span>
            </div>
        </div>
    `;
}

/**
 * Build AI message HTML
 */
function buildSharedAIMessage(message) {
    const sourcesHtml = message.sources && message.sources.length ? `
        <div class="message-sources">
            <div class="sources-header">
                <i class="fas fa-globe"></i>
                <span>Sumber:</span>
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
    
    return `
        <div class="message-wrapper ai">
            <div class="message ai-message">
                <div class="ai-avatar">
                    <img src="vestlog.jpg" alt="vesta.ai" loading="lazy">
                </div>
                <div class="message-body">
                    ${searchBadge}
                    <div class="message-content">
                        ${formatShareMessage(message.content || "")}
                    </div>
                    ${sourcesHtml}
                    <span class="message-time">${formatShareTime(message.timestamp)}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Copy code block content
 */
window.copySharedCode = function(button) {
    const codeBlock = button.closest(".code-block");
    const code = codeBlock.querySelector("code").textContent;
    
    navigator.clipboard.writeText(code).then(() => {
        const originalHtml = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            button.innerHTML = originalHtml;
        }, 2000);
    }).catch(() => {
        console.error("Failed to copy code");
    });
};

/**
 * Show error state
 */
function showErrorState(message) {
    if (!sharedMessagesContainer) return;
    
    sharedMessagesContainer.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-circle"></i>
            <h3>Oops!</h3>
            <p>${escapeHtml(message)}</p>
            <button onclick="window.location.href='/'" class="btn-primary-gradient" style="margin-top: 20px; max-width: 300px; display: inline-flex;">
                <i class="fas fa-home"></i> Kembali ke Web Ahay
            </button>
        </div>
    `;
}

/**
 * Show loading state
 */
function showLoadingState() {
    if (!sharedMessagesContainer) return;
    
    sharedMessagesContainer.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Memuat chat yang dibagikan...</p>
        </div>
    `;
}

/**
 * Load shared chat from Firestore
 */
async function loadSharedChat() {
    const shareId = getShareIdFromURL();
    
    if (!shareId) {
        showErrorState("Link share tidak valid. Pastikan URL yang Anda masukkan benar.");
        return;
    }
    
    showLoadingState();
    
    try {
        const shareDoc = await db.collection("shared_chats").doc(shareId).get();
        
        if (!shareDoc.exists) {
            showErrorState("Chat yang Anda cari tidak ditemukan atau sudah dihapus.");
            return;
        }
        
        sharedChatData = shareDoc.data();
        
        // Update page title
        if (sharedChatData.username) {
            document.title = `Shared Chat by ${sharedChatData.username} | Web Ahay`;
        } else {
            document.title = "Shared Chat | Web Ahay";
        }
        
        // Update meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && sharedChatData.title) {
            metaDesc.setAttribute("content", sharedChatData.title);
        }
        
        // Display messages
        displaySharedMessages(sharedChatData.messages || []);
        
        // Show share info
        showShareInfo(sharedChatData);
        
    } catch (error) {
        console.error("Error loading shared chat:", error);
        
        if (error.code === "permission-denied") {
            showErrorState("Anda tidak memiliki akses ke chat ini.");
        } else if (error.code === "unavailable") {
            showErrorState("Layanan sedang tidak tersedia. Silakan coba lagi nanti.");
        } else {
            showErrorState("Gagal memuat chat. Silakan coba lagi.");
        }
    }
}

/**
 * Display shared messages
 */
function displaySharedMessages(messages) {
    if (!sharedMessagesContainer) return;
    
    if (!messages || messages.length === 0) {
        showErrorState("Tidak ada pesan dalam chat ini.");
        return;
    }
    
    sharedMessagesContainer.innerHTML = "";
    
    messages.forEach((message, index) => {
        const messageHtml = message.role === "user" 
            ? buildSharedUserMessage(message) 
            : buildSharedAIMessage(message);
        
        sharedMessagesContainer.insertAdjacentHTML("beforeend", messageHtml);
    });
    
    // Scroll to top after loading
    setTimeout(() => {
        sharedMessagesContainer.scrollTop = 0;
    }, 100);
}

/**
 * Show share information bar
 */
function showShareInfo(data) {
    // Create info bar if it doesn't exist
    let infoBar = document.querySelector(".share-info-bar");
    
    if (!infoBar) {
        infoBar = document.createElement("div");
        infoBar.className = "share-info-bar";
        
        const header = document.querySelector(".chat-header-modern");
        if (header) {
            header.insertAdjacentElement("afterend", infoBar);
        }
    }
    
    const messageCount = data.messageCount || (data.messages ? data.messages.length : 0);
    const createdAt = data.createdAt ? formatShareTime(data.createdAt) : "";
    
    infoBar.innerHTML = `
        <div class="share-info-content">
            <div class="share-info-item">
                <i class="fas fa-user"></i>
                <span>Dibagikan oleh: <strong>${escapeHtml(data.username || "Anonymous")}</strong></span>
            </div>
            <div class="share-info-item">
                <i class="fas fa-comments"></i>
                <span>${messageCount} pesan</span>
            </div>
            ${createdAt ? `
                <div class="share-info-item">
                    <i class="fas fa-calendar"></i>
                    <span>${createdAt}</span>
                </div>
            ` : ""}
            <div class="share-info-item">
                <span class="readonly-badge">
                    <i class="fas fa-lock"></i> Read Only
                </span>
            </div>
        </div>
    `;
}

/**
 * Initialize share page
 */
function initSharePage() {
    loadSharedChat();
    
    // Add keyboard shortcut to go home
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            window.location.href = "/";
        }
    });
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", initSharePage);

// Handle Firebase errors gracefully
window.addEventListener("unhandledrejection", (event) => {
    if (event.reason && event.reason.code === "permission-denied") {
        showErrorState("Tidak dapat mengakses data. Silakan coba lagi.");
        event.preventDefault();
    }
});
