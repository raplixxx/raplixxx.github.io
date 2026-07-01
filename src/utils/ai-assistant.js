// src/utils/ai-assistant.js
// AI ASSISTANT - Koneksi ke API Sumopod (GPT-4o-mini)

const AI_CONFIG = {
    baseURL: 'https://ai.sumopod.com/v1/chat/completions',
    apiKey: 'sk-f-cGux8U_fsibMTbLa1utw',
    model: 'gpt-4o-mini',
    maxTokens: 200,
    temperature: 0.7
};

// ==========================================
// CEK APAKAH PESAN ADALAH AI COMMAND
// ==========================================
function isAICommand(text) {
    return text.trim().toLowerCase().startsWith('@bot');
}

// ==========================================
// EKSTRAK PERTANYAAN
// ==========================================
function extractQuestion(text) {
    return text.replace(/^@bot\s*/i, '').trim();
}

// ==========================================
// DAPATKAN RESPON DARI AI
// ==========================================
async function getAIResponse(question, context = '') {
    if (!question) {
        return 'Halo! Ada yang bisa saya bantu? 😊';
    }
    
    try {
        const messages = [
            {
                role: 'system',
                content: `Kamu adalah Aetheris AI, asisten pintar di RaflyChat. 
                Jawab pertanyaan dengan singkat, jelas, dan ramah dalam bahasa Indonesia.
                Tambahkan emoji yang sesuai. Maksimal 3 kalimat.
                Jangan berikan informasi berbahaya atau ilegal.`
            }
        ];
        
        if (context) {
            messages.push({
                role: 'system',
                content: `Konteks: ${context}`
            });
        }
        
        messages.push({
            role: 'user',
            content: question
        });
        
        const response = await fetch(AI_CONFIG.baseURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: AI_CONFIG.model,
                messages: messages,
                max_tokens: AI_CONFIG.maxTokens,
                temperature: AI_CONFIG.temperature
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content.trim();
        }
        
        throw new Error('No response from AI');
        
    } catch (error) {
        console.error('🤖 AI Error:', error);
        return getFallbackResponse(question);
    }
}

// ==========================================
// FALLBACK RESPONSES (Saat API offline)
// ==========================================
function getFallbackResponse(question) {
    const q = question.toLowerCase();
    
    const responses = {
        'halo': 'Halo juga! 👋 Senang bertemu denganmu!',
        'hai': 'Hai! Ada yang bisa saya bantu? 😊',
        'apa kabar': 'Kabar baik nih! Bagaimana denganmu? ✨',
        'siapa kamu': 'Aku Aetheris AI, asisten pintar di RaflyChat! 🤖',
        'terima kasih': 'Sama-sama! Senang bisa membantu! 🤗',
        'help': 'Ketik @bot diikuti pertanyaanmu. Contoh: @bot apa itu coding?',
        'waktu': `Sekarang pukul ${new Date().toLocaleTimeString('id-ID')} ⏰`,
        'tanggal': `Hari ini ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} 📅`,
        'cuaca': 'Maaf, aku belum bisa cek cuaca. Coba cek di aplikasi cuaca ya! 🌤️',
    };
    
    for (const [key, response] of Object.entries(responses)) {
        if (q.includes(key)) {
            return response;
        }
    }
    
    const fallbacks = [
        'Wah, pertanyaan yang bagus! Tapi sepertinya aku perlu waktu untuk memikirkannya 🤔',
        'Maaf, aku belum tahu jawabannya. Coba tanyakan hal lain ya! 🙏',
        'Hmm, aku kurang paham. Bisa dijelaskan lebih detail? 💭',
        'Saat ini AI sedang dalam mode hemat. Coba lagi nanti ya! 😴'
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// ==========================================
// SANITIZE RESPONSE
// ==========================================
function sanitizeAIResponse(text) {
    // Hapus tag HTML
    text = text.replace(/<[^>]*>/g, '');
    // Hapus script
    text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    // Batasi panjang
    if (text.length > 500) {
        text = text.substring(0, 497) + '...';
    }
    return text.trim();
}

// ==========================================
// GET TYPING DELAY (Simulasi mengetik)
// ==========================================
function getTypingDelay(text) {
    const baseDelay = 800;
    const charDelay = 30;
    return Math.min(baseDelay + (text.length * charDelay), 3000);
}

console.log('✅ AI Assistant module loaded');
