/**
 * File Handler
 * Handles conversation import/export in JSON and TXT formats
 */

export class FileHandler {
    /**
     * Export conversation as JSON
     * @param {Object} conversation - Conversation object
     * @param {string} filename - Optional filename
     */
    static exportJSON(conversation, filename = null) {
        const data = {
            version: '1.0',
            export_date: new Date().toISOString(),
            ...conversation
        };

        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });

        const defaultFilename = `gpt2-chat-${conversation.conversation_id.slice(0, 8)}-${Date.now()}.json`;
        this.downloadFile(blob, filename || defaultFilename);
    }

    /**
     * Export conversation as plain text
     * @param {Object} conversation - Conversation object
     * @param {string} filename - Optional filename
     */
    static exportPlainText(conversation, filename = null) {
        const textContent = this.createTextExport(conversation);
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });

        const defaultFilename = `gpt2-chat-${conversation.conversation_id.slice(0, 8)}-${Date.now()}.txt`;
        this.downloadFile(blob, filename || defaultFilename);
    }

    /**
     * Create plain text representation of conversation
     * @param {Object} conversation - Conversation object
     * @returns {string} Formatted text
     */
    static createTextExport(conversation) {
        const lines = [];

        // Header
        lines.push('GPT-2 Chatbot Conversation');
        lines.push('==========================');
        lines.push('');
        lines.push(`Title: ${conversation.title || 'Untitled'}`);
        lines.push(`Date: ${new Date(conversation.created_at).toLocaleString()}`);
        lines.push(`Model: ${conversation.metadata?.model_config?.model_name || 'Unknown'}`);
        lines.push(`Total Messages: ${conversation.metadata?.total_messages || conversation.messages.length}`);
        lines.push('');
        lines.push('---');
        lines.push('');

        // Messages
        conversation.messages.forEach((msg, index) => {
            const timestamp = new Date(msg.timestamp).toLocaleString();
            const role = msg.role === 'user' ? 'User' : 'Assistant';

            lines.push(`[${timestamp}] ${role}:`);
            lines.push(msg.content);
            lines.push('');
        });

        // Footer with settings
        lines.push('---');
        lines.push('Settings used:');
        if (conversation.metadata?.model_config) {
            const config = conversation.metadata.model_config;
            lines.push(`Temperature: ${config.temperature || 'N/A'}`);
            lines.push(`Max Length: ${config.max_length || 'N/A'}`);
            lines.push(`Top K: ${config.top_k || 'N/A'}`);
            lines.push(`Top P: ${config.top_p || 'N/A'}`);
            lines.push(`Repetition Penalty: ${config.repetition_penalty || 'N/A'}`);
        }

        return lines.join('\n');
    }

    /**
     * Import conversation from JSON file
     * @param {File} file - File object
     * @returns {Promise<Object>} Parsed conversation data
     */
    static async importJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    const validation = this.validateImportedJSON(data);

                    if (!validation.valid) {
                        reject(new Error(validation.error));
                        return;
                    }

                    resolve(data);
                } catch (error) {
                    reject(new Error('Invalid JSON file: ' + error.message));
                }
            };

            reader.onerror = () => {
                reject(new Error('Error reading file'));
            };

            reader.readAsText(file);
        });
    }

    /**
     * Validate imported JSON data
     * @param {Object} data - Parsed JSON data
     * @returns {Object} Validation result
     */
    static validateImportedJSON(data) {
        if (!data || typeof data !== 'object') {
            return { valid: false, error: 'Invalid data format' };
        }

        if (!data.conversation_id) {
            return { valid: false, error: 'Missing conversation_id' };
        }

        if (!data.messages || !Array.isArray(data.messages)) {
            return { valid: false, error: 'Invalid or missing messages array' };
        }

        // Validate message structure
        for (const msg of data.messages) {
            if (!msg.role || !msg.content) {
                return { valid: false, error: 'Invalid message structure' };
            }

            if (msg.role !== 'user' && msg.role !== 'assistant') {
                return { valid: false, error: 'Invalid message role' };
            }
        }

        return { valid: true };
    }

    /**
     * Trigger file download
     * @param {Blob} blob - File content as Blob
     * @param {string} filename - File name
     */
    static downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Show file picker for import
     * @returns {Promise<File>} Selected file
     */
    static async selectFile() {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';

            input.onchange = (event) => {
                const file = event.target.files[0];
                if (file) {
                    resolve(file);
                } else {
                    reject(new Error('No file selected'));
                }
            };

            input.click();
        });
    }
}

export default FileHandler;
