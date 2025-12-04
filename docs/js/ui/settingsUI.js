/**
 * Settings UI
 * Handles model selector and generation parameter controls
 */

export class SettingsUI {
    constructor(defaultConfig = {}, onSettingsChange = null) {
        this.config = {
            model_name: defaultConfig.model_name || 'Xenova/distilgpt2',
            temperature: defaultConfig.temperature || 0.7,
            max_length: defaultConfig.max_length || 100,
            top_k: defaultConfig.top_k || 50,
            top_p: defaultConfig.top_p || 0.9,
            repetition_penalty: defaultConfig.repetition_penalty || 1.2
        };

        this.onSettingsChange = onSettingsChange;

        // Get DOM elements
        this.modelSelector = document.getElementById('modelSelector');
        this.temperatureSlider = document.getElementById('temperature');
        this.temperatureValue = document.getElementById('temperatureValue');
        this.maxLengthSlider = document.getElementById('maxLength');
        this.maxLengthValue = document.getElementById('maxLengthValue');
        this.topKSlider = document.getElementById('topK');
        this.topKValue = document.getElementById('topKValue');
        this.topPSlider = document.getElementById('topP');
        this.topPValue = document.getElementById('topPValue');
        this.repetitionPenaltySlider = document.getElementById('repetitionPenalty');
        this.repetitionPenaltyValue = document.getElementById('repetitionPenaltyValue');

        this.init();
    }

    /**
     * Initialize settings UI
     */
    init() {
        // Set initial values
        this.updateUI();

        // Add event listeners
        if (this.modelSelector) {
            this.modelSelector.addEventListener('change', (e) => {
                this.config.model_name = e.target.value;
                this.notifyChange('model', e.target.value);
            });
        }

        if (this.temperatureSlider) {
            this.temperatureSlider.addEventListener('input', (e) => {
                this.config.temperature = parseFloat(e.target.value);
                this.updateValueDisplay(this.temperatureValue, this.config.temperature);
                this.notifyChange('temperature', this.config.temperature);
            });
        }

        if (this.maxLengthSlider) {
            this.maxLengthSlider.addEventListener('input', (e) => {
                this.config.max_length = parseInt(e.target.value);
                this.updateValueDisplay(this.maxLengthValue, this.config.max_length);
                this.notifyChange('max_length', this.config.max_length);
            });
        }

        if (this.topKSlider) {
            this.topKSlider.addEventListener('input', (e) => {
                this.config.top_k = parseInt(e.target.value);
                this.updateValueDisplay(this.topKValue, this.config.top_k);
                this.notifyChange('top_k', this.config.top_k);
            });
        }

        if (this.topPSlider) {
            this.topPSlider.addEventListener('input', (e) => {
                this.config.top_p = parseFloat(e.target.value);
                this.updateValueDisplay(this.topPValue, this.config.top_p);
                this.notifyChange('top_p', this.config.top_p);
            });
        }

        if (this.repetitionPenaltySlider) {
            this.repetitionPenaltySlider.addEventListener('input', (e) => {
                this.config.repetition_penalty = parseFloat(e.target.value);
                this.updateValueDisplay(this.repetitionPenaltyValue, this.config.repetition_penalty);
                this.notifyChange('repetition_penalty', this.config.repetition_penalty);
            });
        }
    }

    /**
     * Update UI with current config values
     */
    updateUI() {
        if (this.modelSelector) {
            this.modelSelector.value = this.config.model_name;
        }

        if (this.temperatureSlider) {
            this.temperatureSlider.value = this.config.temperature;
            this.updateValueDisplay(this.temperatureValue, this.config.temperature);
        }

        if (this.maxLengthSlider) {
            this.maxLengthSlider.value = this.config.max_length;
            this.updateValueDisplay(this.maxLengthValue, this.config.max_length);
        }

        if (this.topKSlider) {
            this.topKSlider.value = this.config.top_k;
            this.updateValueDisplay(this.topKValue, this.config.top_k);
        }

        if (this.topPSlider) {
            this.topPSlider.value = this.config.top_p;
            this.updateValueDisplay(this.topPValue, this.config.top_p);
        }

        if (this.repetitionPenaltySlider) {
            this.repetitionPenaltySlider.value = this.config.repetition_penalty;
            this.updateValueDisplay(this.repetitionPenaltyValue, this.config.repetition_penalty);
        }
    }

    /**
     * Update value display next to slider
     * @param {HTMLElement} element - Display element
     * @param {number} value - Value to display
     */
    updateValueDisplay(element, value) {
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * Notify about settings change
     * @param {string} setting - Setting name
     * @param {*} value - New value
     */
    notifyChange(setting, value) {
        if (this.onSettingsChange) {
            this.onSettingsChange(setting, value, this.getConfig());
        }
    }

    /**
     * Get current configuration
     * @returns {Object} Current config
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Update configuration
     * @param {Object} newConfig - New configuration object
     */
    setConfig(newConfig) {
        this.config = {
            ...this.config,
            ...newConfig
        };
        this.updateUI();
    }

    /**
     * Reset to default configuration
     */
    resetToDefaults() {
        this.config = {
            model_name: 'Xenova/distilgpt2',
            temperature: 0.7,
            max_length: 100,
            top_k: 50,
            top_p: 0.9,
            repetition_penalty: 1.2
        };
        this.updateUI();
        this.notifyChange('reset', null);
    }

    /**
     * Get model name
     * @returns {string} Current model name
     */
    getModelName() {
        return this.config.model_name;
    }

    /**
     * Set model name
     * @param {string} modelName - Model name
     */
    setModelName(modelName) {
        this.config.model_name = modelName;
        if (this.modelSelector) {
            this.modelSelector.value = modelName;
        }
    }

    /**
     * Disable all controls (during model loading or generation)
     */
    disable() {
        const elements = [
            this.modelSelector,
            this.temperatureSlider,
            this.maxLengthSlider,
            this.topKSlider,
            this.topPSlider,
            this.repetitionPenaltySlider
        ];

        elements.forEach(element => {
            if (element) element.disabled = true;
        });
    }

    /**
     * Enable all controls
     */
    enable() {
        const elements = [
            this.modelSelector,
            this.temperatureSlider,
            this.maxLengthSlider,
            this.topKSlider,
            this.topPSlider,
            this.repetitionPenaltySlider
        ];

        elements.forEach(element => {
            if (element) element.disabled = false;
        });
    }

    /**
     * Get generation parameters (excluding model name)
     * @returns {Object} Generation parameters
     */
    getGenerationParams() {
        return {
            temperature: this.config.temperature,
            max_length: this.config.max_length,
            top_k: this.config.top_k,
            top_p: this.config.top_p,
            repetition_penalty: this.config.repetition_penalty
        };
    }

    /**
     * Validate configuration
     * @returns {Object} Validation result {valid: boolean, errors: string[]}
     */
    validateConfig() {
        const errors = [];

        if (this.config.temperature < 0.1 || this.config.temperature > 2.0) {
            errors.push('Temperature must be between 0.1 and 2.0');
        }

        if (this.config.max_length < 10 || this.config.max_length > 500) {
            errors.push('Max length must be between 10 and 500');
        }

        if (this.config.top_k < 1 || this.config.top_k > 100) {
            errors.push('Top K must be between 1 and 100');
        }

        if (this.config.top_p < 0.1 || this.config.top_p > 1.0) {
            errors.push('Top P must be between 0.1 and 1.0');
        }

        if (this.config.repetition_penalty < 1.0 || this.config.repetition_penalty > 2.0) {
            errors.push('Repetition penalty must be between 1.0 and 2.0');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

export default SettingsUI;
