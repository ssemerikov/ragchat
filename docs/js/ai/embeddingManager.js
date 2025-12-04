/**
 * Embedding Manager
 * Handles embedding generation for user queries using multilingual model
 * Supports Ukrainian and English text
 */

export class EmbeddingManager {
    constructor() {
        this.pipeline = null;
        this.modelName = 'Xenova/multilingual-e5-base';
        this.isLoaded = false;
        this.embeddingDim = 768;
        this.loadingProgress = 0;
        this.progressCallback = null;
    }

    /**
     * Load embedding model
     * @param {Function} progressCallback - Progress callback function
     * @returns {Promise<boolean>} True if loaded successfully
     */
    async loadModel(progressCallback = null) {
        if (this.isLoaded) {
            console.log('Embedding model already loaded');
            return true;
        }

        this.progressCallback = progressCallback;

        try {
            // Dynamically import transformers.js
            const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@latest');

            // Configure environment
            env.allowRemoteModels = true;
            env.allowLocalModels = false;

            if (this.progressCallback) {
                this.progressCallback({
                    status: 'progress',
                    progress: 0,
                    message: 'Loading embedding model...'
                });
            }

            // Load feature-extraction pipeline
            this.pipeline = await pipeline('feature-extraction', this.modelName, {
                progress_callback: (progress) => {
                    this.handleProgress(progress);
                }
            });

            this.isLoaded = true;

            if (this.progressCallback) {
                this.progressCallback({
                    status: 'done',
                    progress: 100,
                    message: 'Embedding model loaded successfully'
                });
            }

            console.log(`Embedding model loaded: ${this.modelName}`);
            return true;

        } catch (error) {
            console.error('Failed to load embedding model:', error);
            this.isLoaded = false;

            if (this.progressCallback) {
                this.progressCallback({
                    status: 'error',
                    progress: 0,
                    message: `Failed to load embedding model: ${error.message}`
                });
            }

            return false;
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
                    file: progress.file || 'embedding model',
                    message: `Loading ${progress.file || 'embedding model'}: ${percentage.toFixed(0)}%`
                });
            }
        }
    }

    /**
     * Generate embedding for a single text
     * @param {string} text - Text to embed
     * @returns {Promise<Float32Array>} 768-dimensional embedding vector
     */
    async embedText(text) {
        if (!this.isLoaded || !this.pipeline) {
            throw new Error('Embedding model not loaded. Call loadModel() first.');
        }

        if (!text || typeof text !== 'string') {
            throw new Error('Text must be a non-empty string');
        }

        try {
            // Generate embedding with mean pooling and normalization
            const output = await this.pipeline(text, {
                pooling: 'mean',
                normalize: true
            });

            // Return Float32Array (768 dimensions)
            return output.data;

        } catch (error) {
            console.error('Error generating embedding:', error);
            throw error;
        }
    }

    /**
     * Generate embeddings for multiple texts (batch)
     * @param {string[]} texts - Array of texts to embed
     * @returns {Promise<Float32Array[]>} Array of embedding vectors
     */
    async embedBatch(texts) {
        if (!Array.isArray(texts)) {
            throw new Error('Texts must be an array');
        }

        if (texts.length === 0) {
            return [];
        }

        // Process sequentially to avoid memory issues
        const embeddings = [];
        for (const text of texts) {
            const embedding = await this.embedText(text);
            embeddings.push(embedding);
        }

        return embeddings;
    }

    /**
     * Get model information
     * @returns {Object} Model details
     */
    getModelInfo() {
        return {
            modelName: this.modelName,
            isLoaded: this.isLoaded,
            embeddingDim: this.embeddingDim,
            loadingProgress: this.loadingProgress
        };
    }

    /**
     * Check if model is loaded
     * @returns {boolean} True if model is ready
     */
    isModelLoaded() {
        return this.isLoaded;
    }

    /**
     * Unload model (free memory)
     */
    unloadModel() {
        this.pipeline = null;
        this.isLoaded = false;
        this.loadingProgress = 0;

        // Try to trigger garbage collection
        if (typeof window !== 'undefined' && window.gc) {
            window.gc();
        }

        console.log('Embedding model unloaded');
    }
}

export default EmbeddingManager;
