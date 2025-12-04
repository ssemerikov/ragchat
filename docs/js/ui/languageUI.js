/**
 * Language UI
 * Handles language toggle and applying translations to UI elements
 */

import { translations } from '../i18n/translations.js';

export class LanguageUI {
    constructor(currentLanguage = 'uk', onLanguageChange = null) {
        this.currentLanguage = currentLanguage;
        this.onLanguageChange = onLanguageChange;
        this.toggleButton = document.getElementById('languageToggle');

        // Map of element IDs/selectors to translation keys
        this.translationMap = {
            // Header
            'appTitle': 'app_title',

            // Buttons
            'newChatBtn': 'new_chat',
            'uploadBtn': 'upload',
            'downloadJsonBtn': 'download_json',
            'downloadTxtBtn': 'download_txt',
            'sendBtn': 'send',

            // Placeholders (data-i18n-placeholder attribute)
            'messageInput': 'message_placeholder',

            // Settings section
            '.settings-title': 'settings',
            'label[for="modelSelector"]': 'model',
            'label[for="temperature"]': 'temperature',
            'label[for="maxLength"]': 'max_length',

            // Sidebar
            '.sidebar-header h3': 'conversations',

            // Tooltips (title attributes, data-i18n-title)
            '[data-i18n-title="upload_conversation"]': 'upload_conversation',
            '[data-i18n-title="copy_message"]': 'copy_message',
            '[data-i18n-title="delete_conversation"]': 'delete_conversation'
        };

        this.init();
    }

    /**
     * Initialize language UI
     */
    init() {
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', () => this.toggleLanguage());
            this.updateToggleButton();
        }

        // Apply current language
        this.applyTranslations();
    }

    /**
     * Toggle between Ukrainian and English
     */
    toggleLanguage() {
        const newLanguage = this.currentLanguage === 'uk' ? 'en' : 'uk';
        this.setLanguage(newLanguage);
    }

    /**
     * Set specific language
     * @param {string} language - Language code ('uk' or 'en')
     */
    setLanguage(language) {
        if (language !== 'uk' && language !== 'en') {
            console.warn(`Invalid language: ${language}, defaulting to 'uk'`);
            language = 'uk';
        }

        this.currentLanguage = language;
        this.applyTranslations();
        this.updateToggleButton();

        // Call callback if provided
        if (this.onLanguageChange) {
            this.onLanguageChange(language);
        }
    }

    /**
     * Apply translations to all UI elements
     */
    applyTranslations() {
        const t = translations[this.currentLanguage];

        // Apply translations based on the translation map
        for (const [selector, key] of Object.entries(this.translationMap)) {
            const elements = selector.startsWith('#') || selector.startsWith('.')
                ? document.querySelectorAll(selector)
                : [document.getElementById(selector)];

            elements.forEach(element => {
                if (!element) return;

                // Handle placeholders
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = t[key] || key;
                }
                // Handle title attributes
                else if (element.hasAttribute('data-i18n-title')) {
                    element.title = t[key] || key;
                }
                // Handle text content
                else {
                    element.textContent = t[key] || key;
                }
            });
        }

        // Apply HTML lang attribute
        document.documentElement.lang = this.currentLanguage === 'uk' ? 'uk-UA' : 'en-US';
    }

    /**
     * Update language toggle button appearance
     */
    updateToggleButton() {
        if (!this.toggleButton) return;

        // Update button text to show current language
        const flag = this.currentLanguage === 'uk' ? '🇺🇦' : '🇬🇧';
        const label = this.currentLanguage === 'uk' ? 'УК' : 'EN';

        this.toggleButton.innerHTML = `${flag} ${label}`;
        this.toggleButton.title = this.currentLanguage === 'uk'
            ? 'Switch to English'
            : 'Перемкнути на українську';
    }

    /**
     * Get translation by key
     * @param {string} key - Translation key
     * @returns {string} Translated text
     */
    translate(key) {
        return translations[this.currentLanguage]?.[key] || key;
    }

    /**
     * Get current language
     * @returns {string} Current language code
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Translate element by key
     * @param {HTMLElement} element - Element to translate
     * @param {string} key - Translation key
     * @param {string} type - Translation type ('text', 'placeholder', 'title')
     */
    translateElement(element, key, type = 'text') {
        if (!element) return;

        const translation = this.translate(key);

        switch (type) {
            case 'placeholder':
                element.placeholder = translation;
                break;
            case 'title':
                element.title = translation;
                break;
            case 'html':
                element.innerHTML = translation;
                break;
            default:
                element.textContent = translation;
        }
    }

    /**
     * Get translations object for current language
     * @returns {Object} Translations for current language
     */
    getTranslations() {
        return translations[this.currentLanguage];
    }

    /**
     * Update translations for dynamically created elements
     * Useful for sidebar items, messages, etc.
     */
    refreshTranslations() {
        this.applyTranslations();
    }
}

export default LanguageUI;
