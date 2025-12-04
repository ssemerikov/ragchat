/**
 * Prompt Builder
 * Formats conversation history into prompts for GPT-2
 * Matches the backend implementation in services/chat_service.py
 */

export class PromptBuilder {
    constructor(maxContextTokens = 512) {
        this.maxContextTokens = maxContextTokens;
    }

    /**
     * Format conversation history
     * @param {Array} messages - Array of message objects
     * @param {number} maxTokens - Maximum tokens for context
     * @param {Function} tokenCounter - Function to count tokens
     * @returns {string} Formatted conversation history
     */
    formatConversationHistory(messages, maxTokens, tokenCounter) {
        if (!messages || messages.length === 0) {
            return '';
        }

        // Format as "User: ... Assistant: ..."
        const formatted = messages.map(msg => {
            const role = msg.role === 'user' ? 'User' : 'Assistant';
            return `${role}: ${msg.content}`;
        });

        let fullText = formatted.join('\n');
        let tokenCount = tokenCounter(fullText);

        // Truncate oldest messages if exceeds limit
        // Keep at least 1 message (the most recent)
        while (tokenCount > maxTokens && formatted.length > 1) {
            formatted.shift(); // Remove oldest
            fullText = formatted.join('\n');
            tokenCount = tokenCounter(fullText);
        }

        return fullText;
    }

    /**
     * Create prompt for model
     * @param {string} conversationHistory - Formatted conversation history
     * @param {string} newMessage - New user message
     * @returns {string} Complete prompt
     */
    createPrompt(conversationHistory, newMessage) {
        if (conversationHistory) {
            return `${conversationHistory}\nUser: ${newMessage}\nAssistant:`;
        }
        return `User: ${newMessage}\nAssistant:`;
    }

    /**
     * Extract and clean response from generated text
     * @param {string} generatedText - Raw generated text
     * @returns {string} Cleaned response
     */
    extractResponse(generatedText) {
        let response = generatedText.trim();

        // Stop at next turn markers
        if (response.includes('\nUser:')) {
            response = response.split('\nUser:')[0].trim();
        }

        if (response.includes('\nAssistant:')) {
            response = response.split('\nAssistant:')[0].trim();
        }

        // Remove role prefixes if model generated them
        const prefixes = ['Assistant:', 'Bot:', 'AI:', 'GPT:'];
        for (const prefix of prefixes) {
            if (response.startsWith(prefix)) {
                response = response.slice(prefix.length).trim();
            }
        }

        return response;
    }

    /**
     * Build complete prompt from conversation
     * @param {Array} messages - Message history
     * @param {string} newMessage - New user message
     * @param {Function} tokenCounter - Token counting function
     * @returns {string} Complete prompt ready for model
     */
    buildPrompt(messages, newMessage, tokenCounter) {
        // Reserve some tokens for the new message and prompt formatting
        const historyTokenLimit = this.maxContextTokens - 100;

        // Format history
        const history = this.formatConversationHistory(
            messages,
            historyTokenLimit,
            tokenCounter
        );

        // Create full prompt
        return this.createPrompt(history, newMessage);
    }

    /**
     * Validate message content
     * @param {string} content - Message content
     * @returns {Object} Validation result
     */
    validateMessage(content) {
        if (!content || typeof content !== 'string') {
            return {
                valid: false,
                error: 'Message content is required'
            };
        }

        const trimmed = content.trim();
        if (trimmed.length === 0) {
            return {
                valid: false,
                error: 'Message cannot be empty'
            };
        }

        if (trimmed.length > 2000) {
            return {
                valid: false,
                error: 'Message is too long (max 2000 characters)'
            };
        }

        return { valid: true };
    }

    /**
     * Calculate prompt tokens
     * @param {Array} messages - Message history
     * @param {string} newMessage - New user message
     * @param {Function} tokenCounter - Token counting function
     * @returns {number} Total prompt tokens
     */
    calculatePromptTokens(messages, newMessage, tokenCounter) {
        const prompt = this.buildPrompt(messages, newMessage, tokenCounter);
        return tokenCounter(prompt);
    }
}

export default PromptBuilder;
