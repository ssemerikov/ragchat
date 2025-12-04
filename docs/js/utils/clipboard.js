/**
 * Clipboard Utility
 * Handles copying text to clipboard with fallback for older browsers
 */

export class ClipboardUtil {
    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} Success status
     */
    static async copyText(text) {
        try {
            // Try modern Clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }

            // Fallback for older browsers
            return this.fallbackCopy(text);

        } catch (error) {
            console.error('Copy failed:', error);
            return this.fallbackCopy(text);
        }
    }

    /**
     * Fallback copy method for older browsers
     * @param {string} text - Text to copy
     * @returns {boolean} Success status
     */
    static fallbackCopy(text) {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.top = '0';
            textarea.style.left = '0';
            textarea.style.width = '2em';
            textarea.style.height = '2em';
            textarea.style.padding = '0';
            textarea.style.border = 'none';
            textarea.style.outline = 'none';
            textarea.style.boxShadow = 'none';
            textarea.style.background = 'transparent';

            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textarea);

            return successful;
        } catch (error) {
            console.error('Fallback copy failed:', error);
            return false;
        }
    }

    /**
     * Show visual feedback for copy action
     * @param {HTMLElement} element - Element to show feedback on
     * @param {number} duration - Duration in ms
     */
    static showCopyFeedback(element, duration = 2000) {
        const originalContent = element.innerHTML;
        const originalClass = element.className;

        element.classList.add('copied');
        element.innerHTML = '✓ Copied!';

        setTimeout(() => {
            element.className = originalClass;
            element.innerHTML = originalContent;
        }, duration);
    }
}

export default ClipboardUtil;
