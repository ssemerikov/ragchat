/**
 * LocalStorage Manager
 * Handles all localStorage operations with error handling and validation
 */

export class LocalStorageManager {
    static KEYS = {
        CONVERSATIONS: 'gpt2chat_conversations',
        SETTINGS: 'gpt2chat_settings',
        MODEL_CACHE: 'gpt2chat_model_cache'
    };

    /**
     * Get item from localStorage
     * @param {string} key - Storage key
     * @returns {any} Parsed value or null
     */
    static get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`Error reading from localStorage (${key}):`, error);
            return null;
        }
    }

    /**
     * Set item in localStorage
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     * @returns {Object} Result with success status
     */
    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return { success: true };
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                return {
                    success: false,
                    error: 'quota_exceeded',
                    message: 'Storage quota exceeded'
                };
            }
            console.error(`Error writing to localStorage (${key}):`, error);
            return {
                success: false,
                error: error.name,
                message: error.message
            };
        }
    }

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     */
    static remove(key) {
        try {
            localStorage.removeItem(key);
            return { success: true };
        } catch (error) {
            console.error(`Error removing from localStorage (${key}):`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Clear all app data from localStorage
     */
    static clear() {
        try {
            Object.values(this.KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return { success: true };
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get approximate storage size used (in bytes)
     * @returns {number} Approximate size in bytes
     */
    static getStorageSize() {
        let total = 0;
        try {
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length + key.length;
                }
            }
        } catch (error) {
            console.error('Error calculating storage size:', error);
        }
        return total * 2; // Approximate (UTF-16)
    }

    /**
     * Check if localStorage is available and working
     * @returns {boolean} True if localStorage is available
     */
    static isAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check if storage quota is exceeded
     * @returns {boolean} True if quota is exceeded
     */
    static isQuotaExceeded() {
        const size = this.getStorageSize();
        const estimatedLimit = 5 * 1024 * 1024; // 5MB estimate
        return size > estimatedLimit * 0.9; // 90% threshold
    }

    /**
     * Get storage usage percentage (estimated)
     * @returns {number} Percentage (0-100)
     */
    static getStorageUsagePercent() {
        const size = this.getStorageSize();
        const estimatedLimit = 5 * 1024 * 1024; // 5MB estimate
        return Math.min(100, (size / estimatedLimit) * 100);
    }
}

export default LocalStorageManager;
