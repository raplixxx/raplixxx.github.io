// src/utils/ai-assistant.js
// AI Assistant using Sumopod API (GPT-4o-mini)

class AIAssistant {
    constructor() {
        this.apiConfig = {
            baseURL: 'https://ai.sumopod.com/v1/chat/completions',
            apiKey: 'sk-f-cGux8U_fsibMTbLa1utw',
            model: 'gpt-4o-mini',
            maxTokens: 150,
            temperature: 0.7
        };
        
        this.contextMessages = [
            {
                role: 'system',
                content: `Kamu adalah Aetheris AI, asisten pintar di aplikasi chatting RaflyChat. 
                Kamu ramah, helpful, dan bisa menjawab berbagai pertanyaan dengan bahasa Indonesia yang natural.
                Jawablah dengan singkat, jelas, dan tambahkan emoji yang sesuai.
                Jika ada pertanyaan yang tidak bisa kamu jawab, katakan dengan sopan.
                Jangan memberikan informasi yang berbahaya, ilegal, atau tidak etis.
                Maksimal jawaban adalah 2-3 kalimat.`
            }
        ];
    }

    /**
     * Check if message is AI command (starts with @bot)
     */
    isAICommand(message) {
        return message.trim().toLowerCase().startsWith('@bot');
    }

    /**
     * Extract question from AI command
     */
    extractQuestion(message) {
        return message.replace(/^@bot\s*/i, '').trim();
    }

    /**
     * Send message to AI and get response
     */
    async getAIResponse(userMessage, userName = 'Pengguna') {
        try {
            const question = this.extractQuestion(userMessage);
            
            if (!question) {
                return 'Halo! Ada yang bisa saya bantu? Ketik @bot diikuti pertanyaanmu ya! 😊';
            }

            // Add user message to context
            const messages = [
                ...this.contextMessages,
                {
                    role: 'user',
                    content: question
                }
            ];

            const response = await fetch(this.apiConfig.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: this.apiConfig.model,
                    messages: messages,
                    max_tokens: this.apiConfig.maxTokens,
                    temperature: this.apiConfig.temperature
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.choices && data.choices.length > 0) {
                const aiMessage = data.choices[0].message.content.trim();
                return aiMessage;
            } else {
                throw new Error('No response from AI');
            }

        } catch (error) {
            console.error('AI Assistant Error:', error);
            
            // Fallback responses for common queries
            return this.getFallbackResponse(userMessage);
        }
    }

    /**
     * Fallback responses when API is unavailable
     */
    getFallbackResponse(message) {
        const question = this.extractQuestion(message).toLowerCase();
        
        const responses = {
            'halo': 'Halo juga! 👋 Ada yang bisa saya bantu?',
            'hai': 'Hai! Senang bertemu denganmu! 😊',
            'apa kabar': 'Kabar baik nih! Bagaimana denganmu? ✨',
            'terima kasih': 'Sama-sama! Senang bisa membantu! 🤗',
            'help': 'Ketik @bot diikuti pertanyaanmu. Contoh: @bot apa itu coding? 💡',
            'waktu': `Sekarang pukul ${new Date().toLocaleTimeString('id-ID')} ⏰`,
            'tanggal': `Hari ini ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} 📅`,
        };

        for (const [key, response] of Object.entries(responses)) {
            if (question.includes(key)) {
                return response;
            }
        }

        return 'Maaf, saya sedang mengalami kendala teknis. Silakan coba lagi nanti ya! 🙏';
    }

    /**
     * Get typing indicator delay
     */
    getTypingDelay(messageLength) {
        // Simulate typing time based on message length
        const baseDelay = 1000; // 1 second minimum
        const charDelay = 50; // 50ms per character
        return Math.min(baseDelay + (messageLength * charDelay), 3000);
    }

    /**
     * Sanitize AI response
     */
    sanitizeResponse(response) {
        // Remove any potentially harmful content
        let sanitized = response
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '');
        
        // Limit length
        if (sanitized.length > 500) {
            sanitized = sanitized.substring(0, 497) + '...';
        }
        
        return sanitized.trim();
    }

    /**
     * Add context for group chat
     */
    addGroupContext(groupName, memberCount) {
        this.contextMessages.push({
            role: 'system',
            content: `Kamu sedang dalam grup "${groupName}" dengan ${memberCount} anggota. 
            Bersikaplah ramah dan inklusif kepada semua anggota grup.`
        });
    }

    /**
     * Clear context
     */
    clearContext() {
        this.contextMessages = [this.contextMessages[0]]; // Keep only system prompt
    }
}

const aiAssistant = new AIAssistant();
export default aiAssistant;
