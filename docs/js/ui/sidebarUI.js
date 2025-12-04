/**
 * Sidebar UI
 * Handles conversation list display and interaction
 */

export class SidebarUI {
    constructor(translations, currentLanguage = 'uk', onConversationSelect = null, onConversationDelete = null, onNewConversation = null) {
        this.translations = translations;
        this.currentLanguage = currentLanguage;
        this.onConversationSelect = onConversationSelect;
        this.onConversationDelete = onConversationDelete;
        this.onNewConversation = onNewConversation;

        // Get DOM elements
        this.sidebar = document.getElementById('sidebar');
        this.conversationList = document.getElementById('conversationList');
        this.newChatBtn = document.getElementById('newChatBtn');
        this.sidebarToggle = document.getElementById('sidebarToggle');

        this.activeConversationId = null;

        this.init();
    }

    /**
     * Initialize sidebar UI
     */
    init() {
        // New chat button
        if (this.newChatBtn) {
            this.newChatBtn.addEventListener('click', () => {
                if (this.onNewConversation) {
                    this.onNewConversation();
                }
            });
        }

        // Sidebar toggle for mobile
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (this.sidebar && !this.sidebar.contains(e.target) && !this.sidebarToggle?.contains(e.target)) {
                    this.closeSidebar();
                }
            }
        });
    }

    /**
     * Render conversation list
     * @param {Array} conversations - Array of conversation objects
     * @param {string} activeId - ID of active conversation
     */
    renderConversations(conversations, activeId = null) {
        if (!this.conversationList) return;

        this.activeConversationId = activeId;
        this.conversationList.innerHTML = '';

        if (conversations.length === 0) {
            this.renderEmptyState();
            return;
        }

        conversations.forEach(conversation => {
            const item = this.createConversationItem(conversation);
            this.conversationList.appendChild(item);
        });
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'conversation-list-empty';
        emptyDiv.innerHTML = `
            <p>${this.translations[this.currentLanguage].empty_conversations}</p>
            <p class="empty-hint">${this.translations[this.currentLanguage].start_first_chat}</p>
        `;
        this.conversationList.appendChild(emptyDiv);
    }

    /**
     * Create conversation list item
     * @param {Object} conversation - Conversation object
     * @returns {HTMLElement} Conversation item element
     */
    createConversationItem(conversation) {
        const item = document.createElement('div');
        item.className = 'conversation-item';
        item.dataset.conversationId = conversation.conversation_id;

        if (conversation.conversation_id === this.activeConversationId) {
            item.classList.add('active');
        }

        // Conversation title
        const titleDiv = document.createElement('div');
        titleDiv.className = 'conversation-title';
        titleDiv.textContent = conversation.title || this.translations[this.currentLanguage].new_chat;
        titleDiv.title = conversation.title || '';

        // Conversation meta (date, message count)
        const metaDiv = document.createElement('div');
        metaDiv.className = 'conversation-meta';

        const messageCount = conversation.messages?.length || 0;
        const date = new Date(conversation.updated_at);
        const dateStr = this.formatDate(date);

        metaDiv.innerHTML = `
            <span class="conversation-date">${dateStr}</span>
            <span class="conversation-count">${messageCount} ${this.translations[this.currentLanguage].message_count}</span>
        `;

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'conversation-delete-btn';
        deleteBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 4h10M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M6 7v4M10 7v4M4 4l.5 8a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1L12 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
        `;
        deleteBtn.title = this.translations[this.currentLanguage].delete_conversation;
        deleteBtn.setAttribute('aria-label', this.translations[this.currentLanguage].delete_conversation);

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleDelete(conversation);
        });

        // Assemble item
        const contentDiv = document.createElement('div');
        contentDiv.className = 'conversation-content';
        contentDiv.appendChild(titleDiv);
        contentDiv.appendChild(metaDiv);

        contentDiv.addEventListener('click', () => {
            this.handleSelect(conversation);
        });

        item.appendChild(contentDiv);
        item.appendChild(deleteBtn);

        return item;
    }

    /**
     * Handle conversation selection
     * @param {Object} conversation - Conversation object
     */
    handleSelect(conversation) {
        // Update active state
        this.setActiveConversation(conversation.conversation_id);

        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            this.closeSidebar();
        }

        // Call callback
        if (this.onConversationSelect) {
            this.onConversationSelect(conversation);
        }
    }

    /**
     * Handle conversation deletion
     * @param {Object} conversation - Conversation object
     */
    handleDelete(conversation) {
        const confirmMsg = this.translations[this.currentLanguage].confirm_delete;
        if (confirm(confirmMsg)) {
            if (this.onConversationDelete) {
                this.onConversationDelete(conversation);
            }
        }
    }

    /**
     * Set active conversation
     * @param {string} conversationId - Conversation ID
     */
    setActiveConversation(conversationId) {
        this.activeConversationId = conversationId;

        // Update UI
        const items = this.conversationList?.querySelectorAll('.conversation-item');
        items?.forEach(item => {
            if (item.dataset.conversationId === conversationId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    /**
     * Format date for display
     * @param {Date} date - Date object
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / 86400000);

        // Today
        if (diffDays === 0) {
            return date.toLocaleTimeString(this.currentLanguage === 'uk' ? 'uk-UA' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // Yesterday
        if (diffDays === 1) {
            return this.currentLanguage === 'uk' ? 'Вчора' : 'Yesterday';
        }

        // This week
        if (diffDays < 7) {
            return date.toLocaleDateString(this.currentLanguage === 'uk' ? 'uk-UA' : 'en-US', {
                weekday: 'short'
            });
        }

        // Older
        return date.toLocaleDateString(this.currentLanguage === 'uk' ? 'uk-UA' : 'en-US', {
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Toggle sidebar visibility (mobile)
     */
    toggleSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.toggle('open');
        }
    }

    /**
     * Open sidebar
     */
    openSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.add('open');
        }
    }

    /**
     * Close sidebar
     */
    closeSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.remove('open');
        }
    }

    /**
     * Update language
     * @param {string} language - Language code
     */
    setLanguage(language) {
        this.currentLanguage = language;
    }

    /**
     * Refresh conversation list
     * @param {Array} conversations - Updated conversation list
     */
    refresh(conversations) {
        this.renderConversations(conversations, this.activeConversationId);
    }

    /**
     * Add new conversation to list
     * @param {Object} conversation - New conversation
     */
    addConversation(conversation) {
        if (!this.conversationList) return;

        // Remove empty state if present
        const emptyState = this.conversationList.querySelector('.conversation-list-empty');
        if (emptyState) {
            emptyState.remove();
        }

        // Add new item at the top
        const item = this.createConversationItem(conversation);
        this.conversationList.insertBefore(item, this.conversationList.firstChild);
    }

    /**
     * Remove conversation from list
     * @param {string} conversationId - Conversation ID
     */
    removeConversation(conversationId) {
        const item = this.conversationList?.querySelector(`[data-conversation-id="${conversationId}"]`);
        if (item) {
            item.remove();
        }

        // Show empty state if no conversations left
        if (this.conversationList?.children.length === 0) {
            this.renderEmptyState();
        }
    }

    /**
     * Update conversation in list
     * @param {Object} conversation - Updated conversation
     */
    updateConversation(conversation) {
        const item = this.conversationList?.querySelector(`[data-conversation-id="${conversation.conversation_id}"]`);
        if (item) {
            // Replace with new item
            const newItem = this.createConversationItem(conversation);
            item.replaceWith(newItem);
        }
    }
}

export default SidebarUI;
