/**
 * Conversation Manager
 * Manages conversation CRUD operations and persistence
 */

import { LocalStorageManager } from './localStorageManager.js';
import { generateUUID } from '../utils/uuid.js';

export class ConversationManager {
    constructor() {
        this.storageKey = LocalStorageManager.KEYS.CONVERSATIONS;
    }

    /**
     * Get all conversations
     * @returns {Array} Array of conversation objects
     */
    getAllConversations() {
        const conversations = LocalStorageManager.get(this.storageKey) || [];
        // Sort by updated_at descending (most recent first)
        return conversations.sort((a, b) =>
            new Date(b.updated_at) - new Date(a.updated_at)
        );
    }

    /**
     * Get conversation by ID
     * @param {string} conversationId - Conversation UUID
     * @returns {Object|null} Conversation object or null
     */
    getConversation(conversationId) {
        const conversations = this.getAllConversations();
        return conversations.find(c => c.conversation_id === conversationId) || null;
    }

    /**
     * Create new conversation
     * @param {string} modelName - Model name to use
     * @returns {Object} New conversation object
     */
    createConversation(modelName = 'Xenova/distilgpt2') {
        const conversation = {
            conversation_id: generateUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            title: null, // Will be set from first message
            messages: [],
            metadata: {
                total_messages: 0,
                model_config: {
                    model_name: modelName,
                    temperature: 0.7,
                    max_length: 100,
                    top_k: 50,
                    top_p: 0.9,
                    repetition_penalty: 1.2
                }
            }
        };

        const conversations = this.getAllConversations();
        conversations.push(conversation);

        const result = LocalStorageManager.set(this.storageKey, conversations);
        if (!result.success) {
            throw new Error(result.message);
        }

        return conversation;
    }

    /**
     * Update conversation
     * @param {string} conversationId - Conversation UUID
     * @param {Object} updates - Fields to update
     * @returns {Object} Updated conversation
     */
    updateConversation(conversationId, updates) {
        const conversations = this.getAllConversations();
        const index = conversations.findIndex(c => c.conversation_id === conversationId);

        if (index === -1) {
            throw new Error(`Conversation ${conversationId} not found`);
        }

        conversations[index] = {
            ...conversations[index],
            ...updates,
            updated_at: new Date().toISOString()
        };

        const result = LocalStorageManager.set(this.storageKey, conversations);
        if (!result.success) {
            throw new Error(result.message);
        }

        return conversations[index];
    }

    /**
     * Delete conversation
     * @param {string} conversationId - Conversation UUID
     * @returns {boolean} True if deleted
     */
    deleteConversation(conversationId) {
        const conversations = this.getAllConversations();
        const filtered = conversations.filter(c => c.conversation_id !== conversationId);

        if (filtered.length === conversations.length) {
            return false; // Not found
        }

        const result = LocalStorageManager.set(this.storageKey, filtered);
        return result.success;
    }

    /**
     * Add message to conversation
     * @param {string} conversationId - Conversation UUID
     * @param {string} role - Message role (user or assistant)
     * @param {string} content - Message content
     * @param {Object} modelConfig - Optional model config for assistant messages
     * @returns {Object} Updated conversation
     */
    addMessage(conversationId, role, content, modelConfig = null) {
        const conversation = this.getConversation(conversationId);
        if (!conversation) {
            throw new Error(`Conversation ${conversationId} not found`);
        }

        const message = {
            role,
            content,
            timestamp: new Date().toISOString()
        };

        conversation.messages.push(message);
        conversation.metadata.total_messages = conversation.messages.length;

        if (modelConfig) {
            conversation.metadata.model_config = modelConfig;
        }

        // Set title from first user message
        if (!conversation.title && role === 'user') {
            conversation.title = this.generateTitle(content);
        }

        return this.updateConversation(conversationId, conversation);
    }

    /**
     * Get messages from conversation
     * @param {string} conversationId - Conversation UUID
     * @param {number} limit - Maximum number of messages (from end)
     * @returns {Array} Array of messages
     */
    getMessages(conversationId, limit = null) {
        const conversation = this.getConversation(conversationId);
        if (!conversation) {
            return [];
        }

        const messages = conversation.messages;
        if (limit && limit > 0) {
            return messages.slice(-limit);
        }

        return messages;
    }

    /**
     * Generate conversation title from first message
     * @param {string} firstMessage - First user message
     * @returns {string} Generated title
     */
    generateTitle(firstMessage) {
        const maxLength = 50;
        let title = firstMessage.trim();

        if (title.length > maxLength) {
            title = title.substring(0, maxLength) + '...';
        }

        return title;
    }

    /**
     * Search conversations
     * @param {string} query - Search query
     * @returns {Array} Matching conversations
     */
    searchConversations(query) {
        if (!query) return this.getAllConversations();

        const conversations = this.getAllConversations();
        const lowerQuery = query.toLowerCase();

        return conversations.filter(conv => {
            // Search in title
            if (conv.title && conv.title.toLowerCase().includes(lowerQuery)) {
                return true;
            }

            // Search in message content
            return conv.messages.some(msg =>
                msg.content.toLowerCase().includes(lowerQuery)
            );
        });
    }

    /**
     * Clean up old conversations (keep most recent N)
     * @param {number} keepCount - Number of conversations to keep
     * @returns {number} Number of deleted conversations
     */
    cleanup(keepCount = 20) {
        const conversations = this.getAllConversations();

        if (conversations.length <= keepCount) {
            return 0;
        }

        // Keep most recent conversations
        const toKeep = conversations.slice(0, keepCount);
        const deleted = conversations.length - toKeep.length;

        LocalStorageManager.set(this.storageKey, toKeep);
        return deleted;
    }

    /**
     * Export conversation to JSON
     * @param {string} conversationId - Conversation UUID
     * @returns {Object} Conversation data for export
     */
    exportConversation(conversationId) {
        const conversation = this.getConversation(conversationId);
        if (!conversation) {
            throw new Error(`Conversation ${conversationId} not found`);
        }

        return {
            version: '1.0',
            export_date: new Date().toISOString(),
            ...conversation
        };
    }

    /**
     * Import conversation from JSON
     * @param {Object} data - Conversation data
     * @returns {Object} Imported conversation
     */
    importConversation(data) {
        // Validate data
        if (!data.conversation_id || !data.messages || !Array.isArray(data.messages)) {
            throw new Error('Invalid conversation data');
        }

        // Check if conversation already exists
        const existing = this.getConversation(data.conversation_id);
        if (existing) {
            // Generate new ID to avoid conflicts
            data.conversation_id = generateUUID();
        }

        // Clean up export metadata
        const conversation = {
            conversation_id: data.conversation_id,
            created_at: data.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            title: data.title,
            messages: data.messages,
            metadata: data.metadata || {
                total_messages: data.messages.length,
                model_config: {
                    model_name: 'Xenova/distilgpt2',
                    temperature: 0.7,
                    max_length: 100,
                    top_k: 50,
                    top_p: 0.9,
                    repetition_penalty: 1.2
                }
            }
        };

        // Save conversation
        const conversations = this.getAllConversations();
        conversations.push(conversation);

        const result = LocalStorageManager.set(this.storageKey, conversations);
        if (!result.success) {
            throw new Error(result.message);
        }

        return conversation;
    }
}

export default ConversationManager;
