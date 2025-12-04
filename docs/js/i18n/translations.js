/**
 * Translations for the GPT-2 chatbot UI
 * Supports Ukrainian (uk) and English (en)
 */

export const translations = {
    uk: {
        // App title and header
        app_title: "GPT-2 Чат-бот",
        conversations: "Розмови",
        new_chat: "Новий чат",
        settings: "Налаштування моделі",

        // Status indicators
        status_loading: "Завантаження моделі...",
        status_ready: "Готово",
        status_generating: "Генерація відповіді...",
        status_error: "Помилка",
        status_connecting: "Підключення...",

        // Welcome message
        welcome_title: "Вітаємо в GPT-2 чат-боті!",
        welcome_message: "Почніть розмову нижче. Модель працює повністю у вашому браузері.",
        welcome_note: "Перше завантаження моделі може зайняти 10-30 секунд. Наступні запуски будуть миттєвими.",

        // Input and buttons
        message_placeholder: "Введіть ваше повідомлення...",
        send: "Відправити",
        copy: "Копіювати",
        copied: "Скопійовано!",
        upload: "Завантажити",

        // Download buttons
        download_json: "Завантажити JSON",
        download_txt: "Завантажити TXT",

        // Tooltips
        upload_conversation: "Завантажити розмову з файлу",

        // Model settings
        model: "Модель",
        temperature: "Temperature",
        max_length: "Max Length",

        // Conversation list
        empty_conversations: "Поки що немає розмов",
        start_first_chat: "Почніть свій перший чат!",
        delete_conversation: "Видалити розмову",
        confirm_delete: "Ви впевнені, що хочете видалити цю розмову?",

        // Time formats
        just_now: "Щойно",
        minutes_ago: "хв тому",
        hours_ago: "год тому",
        days_ago: "дн тому",

        // Messages
        message_count: "повідомлень",
        user_label: "Користувач",
        assistant_label: "Асистент",
        copy_message: "Копіювати повідомлення",

        // Time formats (alternative keys for formatTimestamp)
        time_just_now: "Щойно",
        time_minutes_ago: "{n} хв тому",
        time_hours_ago: "{n} год тому",
        time_days_ago: "{n} дн тому",

        // Loading messages
        loading_model: "Завантаження моделі...",
        loading_progress: "Завантажено",
        model_loaded: "Модель завантажено успішно!",
        switching_model: "Перемикання моделі...",

        // Errors
        error_model_load: "Помилка завантаження моделі. Перевірте інтернет-з'єднання.",
        error_generation: "Помилка генерації відповіді",
        error_out_of_memory: "Недостатньо пам'яті. Спробуйте коротший контекст або меншу модель.",
        error_network: "Помилка мережі. Перевірте з'єднання.",
        error_storage: "Помилка збереження даних",
        storage_quota_exceeded: "Сховище переповнене. Видаліть старі розмови.",
        storage_disabled: "Сховище браузера вимкнено",
        error_invalid_json: "Некоректний JSON файл",
        error_file_read: "Помилка читання файлу",

        // Suggestions
        try_shorter_context: "Спробуйте видалити деякі старі повідомлення",
        try_smaller_model: "Спробуйте меншу модель (DistilGPT-2)",
        retry: "Спробувати знову",

        // Export/Import
        export_success: "Розмову експортовано успішно!",
        import_success: "Розмову імпортовано успішно!",
        conversation_export: "Експорт розмови GPT-2",

        // Info messages
        auto_save_enabled: "Автозбереження увімкнено",
        conversation_restored: "Розмову відновлено",
        conversation_created: "Створено нову розмову",

        // Character count
        characters: "символів"
    },

    en: {
        // App title and header
        app_title: "GPT-2 Chatbot",
        conversations: "Conversations",
        new_chat: "New Chat",
        settings: "Model Settings",

        // Status indicators
        status_loading: "Loading model...",
        status_ready: "Ready",
        status_generating: "Generating response...",
        status_error: "Error",
        status_connecting: "Connecting...",

        // Welcome message
        welcome_title: "Welcome to GPT-2 Chatbot!",
        welcome_message: "Start a conversation below. The model runs entirely in your browser.",
        welcome_note: "First model load may take 10-30 seconds. Subsequent loads will be instant.",

        // Input and buttons
        message_placeholder: "Type your message...",
        send: "Send",
        copy: "Copy",
        copied: "Copied!",
        upload: "Upload",

        // Download buttons
        download_json: "Download JSON",
        download_txt: "Download TXT",

        // Tooltips
        upload_conversation: "Upload conversation from file",

        // Model settings
        model: "Model",
        temperature: "Temperature",
        max_length: "Max Length",

        // Conversation list
        empty_conversations: "No conversations yet",
        start_first_chat: "Start your first chat!",
        delete_conversation: "Delete conversation",
        confirm_delete: "Are you sure you want to delete this conversation?",

        // Time formats
        just_now: "Just now",
        minutes_ago: "min ago",
        hours_ago: "hr ago",
        days_ago: "days ago",

        // Messages
        message_count: "messages",
        user_label: "User",
        assistant_label: "Assistant",
        copy_message: "Copy message",

        // Time formats (alternative keys for formatTimestamp)
        time_just_now: "Just now",
        time_minutes_ago: "{n} min ago",
        time_hours_ago: "{n} hr ago",
        time_days_ago: "{n} days ago",

        // Loading messages
        loading_model: "Loading model...",
        loading_progress: "Loaded",
        model_loaded: "Model loaded successfully!",
        switching_model: "Switching model...",

        // Errors
        error_model_load: "Failed to load model. Check your internet connection.",
        error_generation: "Error generating response",
        error_out_of_memory: "Out of memory. Try shorter context or smaller model.",
        error_network: "Network error. Check your connection.",
        error_storage: "Storage error",
        storage_quota_exceeded: "Storage quota exceeded. Delete old conversations.",
        storage_disabled: "Browser storage is disabled",
        error_invalid_json: "Invalid JSON file",
        error_file_read: "Error reading file",

        // Suggestions
        try_shorter_context: "Try deleting some old messages",
        try_smaller_model: "Try smaller model (DistilGPT-2)",
        retry: "Retry",

        // Export/Import
        export_success: "Conversation exported successfully!",
        import_success: "Conversation imported successfully!",
        conversation_export: "GPT-2 Conversation Export",

        // Info messages
        auto_save_enabled: "Auto-save enabled",
        conversation_restored: "Conversation restored",
        conversation_created: "New conversation created",

        // Character count
        characters: "characters"
    }
};

/**
 * Get translation by key
 * @param {string} key - Translation key
 * @param {string} lang - Language code (uk or en)
 * @returns {string} Translated text
 */
export function t(key, lang = 'uk') {
    return translations[lang]?.[key] || key;
}

/**
 * Get current language from settings
 * @returns {string} Current language code
 */
export function getCurrentLanguage() {
    try {
        const settings = JSON.parse(localStorage.getItem('gpt2chat_settings') || '{}');
        return settings.language || 'uk';
    } catch {
        return 'uk';
    }
}

export default translations;
