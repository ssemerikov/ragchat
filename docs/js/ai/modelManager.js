/**
 * Model Manager
 * Handles GPT-2 model loading and inference using Transformers.js
 */

export class ModelManager {
    constructor() {
        this.pipeline = null;
        this.tokenizer = null;
        this.currentModel = null;
        this.isLoaded = false;
        this.loadingProgress = 0;
        this.progressCallback = null;
    }

    /**
     * Load model
     * @param {string} modelName - Model name (e.g., 'Xenova/gpt2')
     * @param {Function} progressCallback - Progress callback function
     * @returns {Promise<Object>} Result object
     */
    async loadModel(modelName, progressCallback = null) {
        this.progressCallback = progressCallback;
        this.loadingProgress = 0;
        this.isLoaded = false;

        try {
            // Import Transformers.js dynamically (using latest version for best model compatibility)
            const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@latest');

            // Force use of remote models from HuggingFace CDN ONLY
            env.allowRemoteModels = true;
            env.allowLocalModels = false;
            env.remoteHost = 'https://huggingface.co/';
            env.remotePathTemplate = '{model}/resolve/{revision}/';

            // Ensure models are always loaded from HuggingFace
            env.backends.onnx.wasm.numThreads = 1; // Single thread for stability

            // Determine model-specific options
            const pipelineOptions = {
                progress_callback: (progress) => {
                    this.handleProgress(progress);
                }
            };

            // Special handling for different model types
            if (modelName.includes('onnx-community')) {
                // onnx-community models are pre-quantized, don't override
                // Let Transformers.js auto-detect the best configuration
            } else if (modelName.includes('Xenova')) {
                // Xenova models: use default quantization
                pipelineOptions.quantized = true;
            }

            // WebGPU-specific models
            if (modelName.includes('onnx-web') || modelName.includes('webgpu')) {
                pipelineOptions.dtype = 'q4f16';
                pipelineOptions.device = 'webgpu';
            }

            // Create text-generation pipeline with progress tracking
            this.pipeline = await pipeline('text-generation', modelName, pipelineOptions);

            this.currentModel = modelName;
            this.isLoaded = true;

            if (this.progressCallback) {
                this.progressCallback({
                    status: 'done',
                    progress: 100,
                    message: 'Model loaded successfully'
                });
            }

            return { success: true, model: modelName };

        } catch (error) {
            console.error('Error loading model:', error);
            this.isLoaded = false;

            // Provide user-friendly error messages
            let errorMessage = error.message;
            if (error.message.includes('Could not locate file')) {
                errorMessage = `Model "${modelName}" not found. This model may not be available in ONNX format or the path may be incorrect.`;
            } else if (error.message.includes('out of memory') || error.message.includes('OOM')) {
                errorMessage = `Not enough memory to load "${modelName}". Try a smaller model or close other browser tabs.`;
            } else if (error.message.includes('WebGPU')) {
                errorMessage = `WebGPU not available. This model requires WebGPU support. Try a different model or enable WebGPU in your browser.`;
            }

            if (this.progressCallback) {
                this.progressCallback({
                    status: 'error',
                    progress: 0,
                    message: errorMessage
                });
            }

            return {
                success: false,
                error: errorMessage,
                originalError: error.message
            };
        }
    }

    /**
     * Handle progress updates from Transformers.js
     * @param {Object} progress - Progress object from Transformers.js
     */
    handleProgress(progress) {
        if (progress.status === 'progress' && progress.total) {
            const percentage = (progress.loaded / progress.total) * 100;
            this.loadingProgress = percentage;

            if (this.progressCallback) {
                this.progressCallback({
                    status: 'progress',
                    progress: percentage,
                    loaded: progress.loaded,
                    total: progress.total,
                    file: progress.file || 'model',
                    message: `Loading ${progress.file || 'model'}: ${percentage.toFixed(0)}%`
                });
            }
        } else if (progress.status === 'done') {
            if (this.progressCallback) {
                this.progressCallback({
                    status: 'done',
                    progress: 100,
                    message: 'Model loaded'
                });
            }
        }
    }

    /**
     * Generate response
     * @param {string} prompt - Input prompt
     * @param {Object} config - Generation config
     * @returns {Promise<string>} Generated text
     */
    async generateResponse(prompt, config = {}) {
        if (!this.isLoaded || !this.pipeline) {
            throw new Error('Model not loaded. Call loadModel() first.');
        }

        try {
            const output = await this.pipeline(prompt, {
                max_new_tokens: config.max_length || 100,
                temperature: config.temperature || 0.7,
                top_k: config.top_k || 50,
                top_p: config.top_p || 0.9,
                repetition_penalty: config.repetition_penalty || 1.2,
                do_sample: true,
                return_full_text: false // Only return generated text
            });

            // Extract generated text
            const generated = output[0].generated_text;
            return generated;

        } catch (error) {
            console.error('Error generating response:', error);
            throw error;
        }
    }

    /**
     * Switch to different model
     * @param {string} newModelName - New model name
     * @param {Function} progressCallback - Progress callback
     * @returns {Promise<Object>} Result object
     */
    async switchModel(newModelName, progressCallback = null) {
        // Unload current model
        this.unloadModel();

        // Load new model
        return await this.loadModel(newModelName, progressCallback);
    }

    /**
     * Unload current model (free memory)
     */
    unloadModel() {
        this.pipeline = null;
        this.tokenizer = null;
        this.isLoaded = false;
        this.currentModel = null;

        // Try to trigger garbage collection if available
        if (typeof window !== 'undefined' && window.gc) {
            window.gc();
        }
    }

    /**
     * Count tokens in text (approximate)
     * Note: This is an approximation. Actual tokenization requires the tokenizer.
     * @param {string} text - Text to count
     * @returns {number} Approximate token count
     */
    countTokens(text) {
        // Rough approximation: ~4 chars per token for English
        // GPT-2 tokenizer is more complex, but this is close enough
        return Math.ceil(text.length / 4);
    }

    /**
     * Get model info
     * @returns {Object} Model information
     */
    getModelInfo() {
        return {
            modelName: this.currentModel,
            isLoaded: this.isLoaded,
            loadingProgress: this.loadingProgress
        };
    }

    /**
     * Check if model is loaded
     * @returns {boolean} True if loaded
     */
    isModelLoaded() {
        return this.isLoaded;
    }

    /**
     * Get current model name
     * @returns {string|null} Model name or null
     */
    getCurrentModel() {
        return this.currentModel;
    }
}

export default ModelManager;
