/**
 * Chat UI
 * Handles message rendering, copy buttons, typing indicators, and auto-scroll
 */

import { ClipboardUtil } from '../utils/clipboard.js';

export class ChatUI {
    constructor(messagesContainerId, translations, currentLanguage = 'uk') {
        this.container = document.getElementById(messagesContainerId);
        this.translations = translations;
        this.currentLanguage = currentLanguage;
        this.typingIndicator = null;
    }

    /**
     * Update language for UI elements
     * @param {string} language - Language code ('uk' or 'en')
     */
    setLanguage(language) {
        this.currentLanguage = language;
    }

    /**
     * Render a single message
     * @param {Object} message - Message object {role, content, timestamp}
     * @param {boolean} animate - Whether to animate message entry
     */
    renderMessage(message, animate = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role}-message`;

        if (animate) {
            messageDiv.classList.add('slideIn');
        }

        // Message header with role and timestamp
        const headerDiv = document.createElement('div');
        headerDiv.className = 'message-header';

        const roleSpan = document.createElement('span');
        roleSpan.className = 'message-role';
        roleSpan.textContent = message.role === 'user'
            ? this.translations[this.currentLanguage].user_label
            : this.translations[this.currentLanguage].assistant_label;

        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = this.formatTimestamp(message.timestamp);

        headerDiv.appendChild(roleSpan);
        headerDiv.appendChild(timeSpan);

        // Message content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = message.content;

        // Message actions (copy button)
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 2h8a2 2 0 0 1 2 2v8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <rect x="2" y="6" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
            </svg>
        `;
        copyBtn.title = this.translations[this.currentLanguage].copy_message;
        copyBtn.setAttribute('aria-label', this.translations[this.currentLanguage].copy_message);
        copyBtn.onclick = () => this.handleCopyMessage(message.content, copyBtn);

        actionsDiv.appendChild(copyBtn);

        // Assemble message
        messageDiv.appendChild(headerDiv);
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(actionsDiv);

        this.container.appendChild(messageDiv);

        // Auto-scroll to bottom
        this.scrollToBottom();

        return messageDiv;
    }

    /**
     * Render multiple messages
     * @param {Array} messages - Array of message objects
     * @param {boolean} clearFirst - Whether to clear existing messages
     */
    renderMessages(messages, clearFirst = false) {
        if (clearFirst) {
            this.clear();
        }

        messages.forEach(message => {
            this.renderMessage(message, false);
        });

        this.scrollToBottom();
    }

    /**
     * Handle copy message to clipboard
     * @param {string} content - Message content to copy
     * @param {HTMLElement} button - Copy button element
     */
    async handleCopyMessage(content, button) {
        const success = await ClipboardUtil.copyText(content);

        if (success) {
            // Show feedback
            const originalHTML = button.innerHTML;
            button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            `;
            button.classList.add('copied');

            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.classList.remove('copied');
            }, 2000);
        } else {
            // Show error feedback
            button.classList.add('copy-error');
            setTimeout(() => {
                button.classList.remove('copy-error');
            }, 2000);
        }
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        // Remove existing indicator if present
        this.hideTypingIndicator();

        this.typingIndicator = document.createElement('div');
        this.typingIndicator.className = 'message assistant-message typing-indicator';
        this.typingIndicator.innerHTML = `
            <div class="message-header">
                <span class="message-role">${this.translations[this.currentLanguage].assistant_label}</span>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;

        this.container.appendChild(this.typingIndicator);
        this.scrollToBottom();
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.remove();
            this.typingIndicator = null;
        }
    }

    /**
     * Show system message (errors, warnings, info)
     * @param {string} message - Message text
     * @param {string} type - Message type ('error', 'warning', 'info')
     */
    showSystemMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message system-message system-${type}`;
        messageDiv.innerHTML = `
            <div class="message-content">${message}</div>
        `;

        this.container.appendChild(messageDiv);
        this.scrollToBottom();

        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageDiv.classList.add('fade-out');
            setTimeout(() => messageDiv.remove(), 300);
        }, 5000);
    }

    /**
     * Clear all messages
     */
    clear() {
        this.container.innerHTML = '';
        this.typingIndicator = null;
    }

    /**
     * Scroll to bottom of messages container
     * @param {boolean} smooth - Whether to use smooth scrolling
     */
    scrollToBottom(smooth = true) {
        if (smooth) {
            this.container.scrollTo({
                top: this.container.scrollHeight,
                behavior: 'smooth'
            });
        } else {
            this.container.scrollTop = this.container.scrollHeight;
        }
    }

    /**
     * Format timestamp for display
     * @param {string} timestamp - ISO 8601 timestamp
     * @returns {string} Formatted time string
     */
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        // Just now (< 1 min)
        if (diffMins < 1) {
            return this.translations[this.currentLanguage].time_just_now || 'Just now';
        }

        // Minutes ago
        if (diffMins < 60) {
            return this.translations[this.currentLanguage].time_minutes_ago?.replace('{n}', diffMins)
                || `${diffMins}m ago`;
        }

        // Hours ago
        if (diffHours < 24) {
            return this.translations[this.currentLanguage].time_hours_ago?.replace('{n}', diffHours)
                || `${diffHours}h ago`;
        }

        // Days ago
        if (diffDays < 7) {
            return this.translations[this.currentLanguage].time_days_ago?.replace('{n}', diffDays)
                || `${diffDays}d ago`;
        }

        // Full date for older messages
        return date.toLocaleDateString(this.currentLanguage === 'uk' ? 'uk-UA' : 'en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }

    /**
     * Get all rendered messages
     * @returns {NodeList} All message elements
     */
    getAllMessageElements() {
        return this.container.querySelectorAll('.message:not(.typing-indicator):not(.system-message)');
    }

    /**
     * Remove last message
     * @returns {boolean} True if message was removed
     */
    removeLastMessage() {
        const messages = this.getAllMessageElements();
        if (messages.length > 0) {
            messages[messages.length - 1].remove();
            return true;
        }
        return false;
    }

    /**
     * Update message content (for streaming responses in future)
     * @param {HTMLElement} messageElement - Message element to update
     * @param {string} content - New content
     */
    updateMessageContent(messageElement, content) {
        const contentDiv = messageElement.querySelector('.message-content');
        if (contentDiv) {
            contentDiv.textContent = content;
            this.scrollToBottom();
        }
    }
}

export default ChatUI;
