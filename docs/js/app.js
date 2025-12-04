/**
 * Main Application Controller
 * Integrates all modules and handles application lifecycle
 */

import { ModelManager } from './ai/modelManager.js';
import { PromptBuilder } from './ai/promptBuilder.js';
import { ConversationManager } from './storage/conversationManager.js';
import { LocalStorageManager } from './storage/localStorageManager.js';
import { FileHandler } from './utils/fileHandler.js';
import { ChatUI } from './ui/chatUI.js';
import { SettingsUI } from './ui/settingsUI.js';
import { LanguageUI } from './ui/languageUI.js';
import { SidebarUI } from './ui/sidebarUI.js';
import { translations } from './i18n/translations.js';

class GPT2ChatApp {
    constructor() {
        // Core modules
        this.modelManager = new ModelManager();
        this.promptBuilder = new PromptBuilder(512);
        this.conversationManager = new ConversationManager();

        // State
        this.currentConversation = null;
        this.isGenerating = false;
        this.settings = this.loadSettings();

        // UI modules (initialized after DOM ready)
        this.chatUI = null;
        this.settingsUI = null;
        this.languageUI = null;
        this.sidebarUI = null;

        // DOM elements (initialized after DOM ready)
        this.messageInput = null;
        this.sendBtn = null;
        this.uploadBtn = null;
        this.downloadJsonBtn = null;
        this.downloadTxtBtn = null;
        this.loadingProgress = null;
        this.loadingStatus = null;
        this.loadingBar = null;
    }

    /**
     * Initialize application
     */
    async init() {
        console.log('Initializing GPT-2 Chat App...');

        try {
            // Initialize DOM elements
            this.initDOMElements();

            // Initialize UI modules
            this.initUIModules();

            // Apply language
            this.languageUI.setLanguage(this.settings.language);

            // Load conversations and display sidebar
            this.loadConversations();

            // Set up event listeners
            this.setupEventListeners();

            // Load model
            await this.loadModel();

            // Restore or create conversation
            if (this.settings.currentConversationId) {
                const conversation = this.conversationManager.getConversation(this.settings.currentConversationId);
                if (conversation) {
                    this.loadConversation(conversation);
                } else {
                    this.createNewConversation();
                }
            } else {
                this.createNewConversation();
            }

            console.log('App initialized successfully');

        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError(this.languageUI.translate('error_model_load'));
        }
    }

    /**
     * Initialize DOM elements
     */
    initDOMElements() {
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.downloadJsonBtn = document.getElementById('downloadJsonBtn');
        this.downloadTxtBtn = document.getElementById('downloadTxtBtn');
        this.loadingProgress = document.getElementById('loadingProgress');
        this.loadingStatus = document.getElementById('loadingStatus');
        this.loadingBar = document.querySelector('.loading-bar');
    }

    /**
     * Initialize UI modules
     */
    initUIModules() {
        // Language UI
        this.languageUI = new LanguageUI(
            this.settings.language,
            (lang) => this.handleLanguageChange(lang)
        );

        // Chat UI
        this.chatUI = new ChatUI(
            'messagesContainer',
            translations,
            this.settings.language
        );

        // Settings UI
        this.settingsUI = new SettingsUI(
            this.settings.modelConfig,
            (setting, value, config) => this.handleSettingsChange(setting, value, config)
        );

        // Sidebar UI
        this.sidebarUI = new SidebarUI(
            translations,
            this.settings.language,
            (conversation) => this.loadConversation(conversation),
            (conversation) => this.deleteConversation(conversation),
            () => this.createNewConversation()
        );
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Send message
        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => this.sendMessage());
        }

        // Enter key to send
        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // Upload conversation
        if (this.uploadBtn) {
            this.uploadBtn.addEventListener('click', () => this.handleUpload());
        }

        // Download JSON
        if (this.downloadJsonBtn) {
            this.downloadJsonBtn.addEventListener('click', () => this.handleDownloadJSON());
        }

        // Download TXT
        if (this.downloadTxtBtn) {
            this.downloadTxtBtn.addEventListener('click', () => this.handleDownloadTXT());
        }

        // Save on page unload
        window.addEventListener('beforeunload', () => {
            this.saveSettings();
        });
    }

    /**
     * Load model with progress tracking
     */
    async loadModel() {
        const modelName = this.settings.modelConfig.model_name;

        console.log(`Loading model: ${modelName}`);

        // Show loading progress
        if (this.loadingProgress) {
            this.loadingProgress.style.display = 'block';
        }

        try {
            await this.modelManager.loadModel(modelName, (progress) => {
                this.updateLoadingProgress(progress);
            });

            // Hide loading progress
            if (this.loadingProgress) {
                this.loadingProgress.style.display = 'none';
            }

            this.chatUI.showSystemMessage(
                this.languageUI.translate('model_loaded'),
                'info'
            );

        } catch (error) {
            console.error('Model loading failed:', error);

            // Hide loading progress
            if (this.loadingProgress) {
                this.loadingProgress.style.display = 'none';
            }

            this.showError(this.languageUI.translate('error_model_load'));
            throw error;
        }
    }

    /**
     * Update loading progress display
     * @param {Object} progress - Progress object
     */
    updateLoadingProgress(progress) {
        if (progress.status === 'progress') {
            const percentage = Math.round(progress.progress);

            if (this.loadingStatus) {
                this.loadingStatus.textContent = progress.message || `${this.languageUI.translate('loading_model')} ${percentage}%`;
            }

            if (this.loadingBar) {
                this.loadingBar.style.width = `${percentage}%`;
            }
        } else if (progress.status === 'done') {
            if (this.loadingStatus) {
                this.loadingStatus.textContent = this.languageUI.translate('model_loaded');
            }

            if (this.loadingBar) {
                this.loadingBar.style.width = '100%';
            }
        } else if (progress.status === 'error') {
            if (this.loadingStatus) {
                this.loadingStatus.textContent = progress.message || this.languageUI.translate('error_model_load');
            }
        }
    }

    /**
     * Send user message and get AI response
     */
    async sendMessage() {
        if (!this.messageInput || this.isGenerating) return;

        const userMessage = this.messageInput.value.trim();
        if (!userMessage) return;

        // Validate message
        const validation = this.promptBuilder.validateMessage(userMessage);
        if (!validation.valid) {
            this.showError(validation.error);
            return;
        }

        // Disable input
        this.setInputEnabled(false);
        this.isGenerating = true;

        try {
            // Add user message
            this.conversationManager.addMessage(
                this.currentConversation.conversation_id,
                'user',
                userMessage
            );

            // Render user message
            this.chatUI.renderMessage({
                role: 'user',
                content: userMessage,
                timestamp: new Date().toISOString()
            }, true);

            // Clear input
            this.messageInput.value = '';

            // Show typing indicator
            this.chatUI.showTypingIndicator();

            // Get conversation history
            const messages = this.conversationManager.getMessages(
                this.currentConversation.conversation_id
            );

            // Build prompt
            const prompt = this.promptBuilder.buildPrompt(
                messages.slice(0, -1), // Exclude the just-added user message
                userMessage,
                (text) => this.modelManager.countTokens(text)
            );

            // Generate response
            const config = this.settingsUI.getGenerationParams();
            const generatedText = await this.modelManager.generateResponse(prompt, config);

            // Extract clean response
            const response = this.promptBuilder.extractResponse(generatedText);

            // Hide typing indicator
            this.chatUI.hideTypingIndicator();

            // Add assistant message
            this.conversationManager.addMessage(
                this.currentConversation.conversation_id,
                'assistant',
                response,
                this.settingsUI.getConfig()
            );

            // Render assistant message
            this.chatUI.renderMessage({
                role: 'assistant',
                content: response,
                timestamp: new Date().toISOString()
            }, true);

            // Update current conversation reference
            this.currentConversation = this.conversationManager.getConversation(
                this.currentConversation.conversation_id
            );

            // Update sidebar
            this.sidebarUI.updateConversation(this.currentConversation);

            // Save settings
            this.saveSettings();

        } catch (error) {
            console.error('Error generating response:', error);

            // Hide typing indicator
            this.chatUI.hideTypingIndicator();

            // Show error
            let errorMsg = this.languageUI.translate('error_generation');
            if (error.message && error.message.includes('memory')) {
                errorMsg = this.languageUI.translate('error_out_of_memory');
            }
            this.showError(errorMsg);

        } finally {
            // Re-enable input
            this.setInputEnabled(true);
            this.isGenerating = false;
        }
    }

    /**
     * Load conversations into sidebar
     */
    loadConversations() {
        const conversations = this.conversationManager.getAllConversations();
        this.sidebarUI.renderConversations(
            conversations,
            this.currentConversation?.conversation_id
        );
    }

    /**
     * Create new conversation
     */
    createNewConversation() {
        const modelName = this.settingsUI.getModelName();
        const newConversation = this.conversationManager.createConversation(modelName);

        this.loadConversation(newConversation);
        this.sidebarUI.addConversation(newConversation);

        // Update settings
        this.settings.currentConversationId = newConversation.conversation_id;
        this.saveSettings();
    }

    /**
     * Load conversation into chat
     * @param {Object} conversation - Conversation object
     */
    loadConversation(conversation) {
        this.currentConversation = conversation;

        // Clear and render messages
        this.chatUI.renderMessages(conversation.messages, true);

        // Update sidebar active state
        this.sidebarUI.setActiveConversation(conversation.conversation_id);

        // Update settings config if available
        if (conversation.metadata?.model_config) {
            this.settingsUI.setConfig(conversation.metadata.model_config);
        }

        // Update settings
        this.settings.currentConversationId = conversation.conversation_id;
        this.saveSettings();
    }

    /**
     * Delete conversation
     * @param {Object} conversation - Conversation to delete
     */
    deleteConversation(conversation) {
        const deleted = this.conversationManager.deleteConversation(conversation.conversation_id);

        if (deleted) {
            this.sidebarUI.removeConversation(conversation.conversation_id);

            // If deleted conversation was active, create new one
            if (this.currentConversation?.conversation_id === conversation.conversation_id) {
                const allConversations = this.conversationManager.getAllConversations();

                if (allConversations.length > 0) {
                    this.loadConversation(allConversations[0]);
                } else {
                    this.createNewConversation();
                }
            }
        }
    }

    /**
     * Handle file upload
     */
    async handleUpload() {
        try {
            const file = await FileHandler.selectFile();
            const data = await FileHandler.importJSON(file);

            // Import conversation
            const imported = this.conversationManager.importConversation(data);

            // Load the imported conversation
            this.loadConversation(imported);

            // Update sidebar
            this.loadConversations();

            // Show success message
            this.chatUI.showSystemMessage(
                this.languageUI.translate('import_success'),
                'info'
            );

        } catch (error) {
            console.error('Import failed:', error);
            this.showError(this.languageUI.translate('error_invalid_json'));
        }
    }

    /**
     * Handle JSON export
     */
    handleDownloadJSON() {
        if (!this.currentConversation) return;

        try {
            FileHandler.exportJSON(this.currentConversation);

            this.chatUI.showSystemMessage(
                this.languageUI.translate('export_success'),
                'info'
            );
        } catch (error) {
            console.error('Export failed:', error);
            this.showError(this.languageUI.translate('error_file_read'));
        }
    }

    /**
     * Handle plain text export
     */
    handleDownloadTXT() {
        if (!this.currentConversation) return;

        try {
            FileHandler.exportPlainText(this.currentConversation);

            this.chatUI.showSystemMessage(
                this.languageUI.translate('export_success'),
                'info'
            );
        } catch (error) {
            console.error('Export failed:', error);
            this.showError(this.languageUI.translate('error_file_read'));
        }
    }

    /**
     * Handle language change
     * @param {string} language - New language code
     */
    handleLanguageChange(language) {
        this.settings.language = language;
        this.saveSettings();

        // Update UI modules
        this.chatUI.setLanguage(language);
        this.sidebarUI.setLanguage(language);

        // Reload conversations to update dates
        this.loadConversations();
    }

    /**
     * Handle settings change
     * @param {string} setting - Setting name
     * @param {*} value - New value
     * @param {Object} config - Full config
     */
    async handleSettingsChange(setting, value, config) {
        this.settings.modelConfig = config;
        this.saveSettings();

        // If model changed, reload it
        if (setting === 'model') {
            this.settingsUI.disable();

            this.chatUI.showSystemMessage(
                this.languageUI.translate('switching_model'),
                'info'
            );

            try {
                await this.modelManager.switchModel(value, (progress) => {
                    this.updateLoadingProgress(progress);
                });

                this.chatUI.showSystemMessage(
                    this.languageUI.translate('model_loaded'),
                    'info'
                );

            } catch (error) {
                console.error('Model switch failed:', error);
                this.showError(this.languageUI.translate('error_model_load'));
            } finally {
                this.settingsUI.enable();
            }
        }
    }

    /**
     * Load settings from localStorage
     * @returns {Object} Settings object
     */
    loadSettings() {
        const defaultSettings = {
            language: 'uk',
            currentConversationId: null,
            modelConfig: {
                model_name: 'Xenova/distilgpt2',
                temperature: 0.7,
                max_length: 100,
                top_k: 50,
                top_p: 0.9,
                repetition_penalty: 1.2
            }
        };

        const saved = LocalStorageManager.get(LocalStorageManager.KEYS.SETTINGS);
        return { ...defaultSettings, ...saved };
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        LocalStorageManager.set(LocalStorageManager.KEYS.SETTINGS, this.settings);
    }

    /**
     * Enable/disable input controls
     * @param {boolean} enabled - Whether to enable
     */
    setInputEnabled(enabled) {
        if (this.messageInput) {
            this.messageInput.disabled = !enabled;
        }

        if (this.sendBtn) {
            this.sendBtn.disabled = !enabled;
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.chatUI.showSystemMessage(message, 'error');
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new GPT2ChatApp();
        app.init();
    });
} else {
    const app = new GPT2ChatApp();
    app.init();
}

export default GPT2ChatApp;
