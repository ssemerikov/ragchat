/**
 * Vector Store
 * Handles vector similarity search using client-side algorithms
 * Supports efficient semantic search across document chunks
 */

export class VectorStore {
    constructor() {
        this.chunks = [];
        this.embeddings = [];
        this.isLoaded = false;
        this.embeddingDim = 768;
    }

    /**
     * Load embeddings from pre-processed data
     * @param {Object} embeddingsData - Pre-processed embeddings data
     * @returns {Promise<void>}
     */
    async loadEmbeddings(embeddingsData) {
        if (!embeddingsData || !embeddingsData.chunks) {
            throw new Error('Invalid embeddings data format');
        }

        try {
            this.chunks = embeddingsData.chunks;
            this.embeddingDim = embeddingsData.embedding_dim || 768;

            // Convert embeddings to Float32Array for efficient computation
            this.embeddings = this.chunks.map(chunk => {
                if (Array.isArray(chunk.embedding)) {
                    return new Float32Array(chunk.embedding);
                } else if (chunk.embedding instanceof Float32Array) {
                    return chunk.embedding;
                } else {
                    throw new Error(`Invalid embedding format for chunk ${chunk.chunk_id}`);
                }
            });

            this.isLoaded = true;
            console.log(`Loaded ${this.chunks.length} chunks into vector store`);

        } catch (error) {
            console.error('Failed to load embeddings:', error);
            throw error;
        }
    }

    /**
     * Calculate dot product similarity (for normalized vectors)
     * @param {Float32Array} vec1 - First vector
     * @param {Float32Array} vec2 - Second vector
     * @returns {number} Dot product similarity score
     */
    dotProduct(vec1, vec2) {
        if (vec1.length !== vec2.length) {
            throw new Error('Vectors must have same length');
        }

        let sum = 0;
        for (let i = 0; i < vec1.length; i++) {
            sum += vec1[i] * vec2[i];
        }
        return sum;
    }

    /**
     * Calculate cosine similarity
     * @param {Float32Array} vec1 - First vector
     * @param {Float32Array} vec2 - Second vector
     * @returns {number} Cosine similarity score
     */
    cosineSimilarity(vec1, vec2) {
        if (vec1.length !== vec2.length) {
            throw new Error('Vectors must have same length');
        }

        let dotProduct = 0;
        let mag1 = 0;
        let mag2 = 0;

        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            mag1 += vec1[i] * vec1[i];
            mag2 += vec2[i] * vec2[i];
        }

        const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
        if (magnitude === 0) return 0;

        return dotProduct / magnitude;
    }

    /**
     * Search for most similar chunks
     * @param {Float32Array} queryEmbedding - Query embedding vector
     * @param {number} topK - Number of top results to return
     * @param {Object} filters - Optional filters (category, language, document_id)
     * @param {boolean} useCosineSim - Use cosine similarity instead of dot product
     * @returns {Array} Top-K similar chunks with scores
     */
    search(queryEmbedding, topK = 10, filters = {}, useCosineSim = false) {
        if (!this.isLoaded) {
            throw new Error('Vector store not loaded. Call loadEmbeddings() first.');
        }

        if (!(queryEmbedding instanceof Float32Array)) {
            queryEmbedding = new Float32Array(queryEmbedding);
        }

        if (queryEmbedding.length !== this.embeddingDim) {
            throw new Error(`Query embedding dimension mismatch. Expected ${this.embeddingDim}, got ${queryEmbedding.length}`);
        }

        // Calculate similarities for all chunks
        const similarities = [];

        for (let i = 0; i < this.embeddings.length; i++) {
            const chunk = this.chunks[i];

            // Apply filters
            if (filters.category && chunk.category !== filters.category) continue;
            if (filters.language && chunk.language !== filters.language) continue;
            if (filters.document_id && chunk.document_id !== filters.document_id) continue;

            // Calculate similarity
            const score = useCosineSim
                ? this.cosineSimilarity(queryEmbedding, this.embeddings[i])
                : this.dotProduct(queryEmbedding, this.embeddings[i]);

            similarities.push({
                index: i,
                score
            });
        }

        // Sort by score (descending)
        similarities.sort((a, b) => b.score - a.score);

        // Get top-K results
        const topResults = similarities.slice(0, topK);

        // Map to full chunk data
        return topResults.map(result => ({
            ...this.chunks[result.index],
            similarity_score: result.score
        }));
    }

    /**
     * Get chunk by ID
     * @param {string} chunkId - Chunk identifier
     * @returns {Object|null} Chunk object or null if not found
     */
    getChunkById(chunkId) {
        return this.chunks.find(chunk => chunk.chunk_id === chunkId) || null;
    }

    /**
     * Get all chunks for a specific document
     * @param {string} documentId - Document identifier
     * @returns {Array} Array of chunks
     */
    getChunksByDocument(documentId) {
        return this.chunks.filter(chunk => chunk.document_id === documentId);
    }

    /**
     * Get chunks by category
     * @param {string} category - Category identifier
     * @returns {Array} Array of chunks
     */
    getChunksByCategory(category) {
        return this.chunks.filter(chunk => chunk.category === category);
    }

    /**
     * Get chunks by language
     * @param {string} language - Language code ('uk' or 'en')
     * @returns {Array} Array of chunks
     */
    getChunksByLanguage(language) {
        return this.chunks.filter(chunk => chunk.language === language);
    }

    /**
     * Get statistics about the vector store
     * @returns {Object} Statistics
     */
    getStats() {
        if (!this.isLoaded) {
            return {
                loaded: false,
                totalChunks: 0
            };
        }

        const categories = new Set(this.chunks.map(c => c.category));
        const documents = new Set(this.chunks.map(c => c.document_id));
        const languages = new Set(this.chunks.map(c => c.language));

        return {
            loaded: true,
            totalChunks: this.chunks.length,
            embeddingDim: this.embeddingDim,
            uniqueDocuments: documents.size,
            uniqueCategories: categories.size,
            languages: Array.from(languages),
            memorySize: this.estimateMemorySize()
        };
    }

    /**
     * Estimate memory usage (in MB)
     * @returns {number} Estimated memory in MB
     */
    estimateMemorySize() {
        if (!this.isLoaded) return 0;

        // Each float32 is 4 bytes
        const embeddingsSize = this.chunks.length * this.embeddingDim * 4;

        // Estimate chunk text size (average 250 chars per chunk)
        const textSize = this.chunks.reduce((sum, chunk) =>
            sum + (chunk.text ? chunk.text.length * 2 : 500), 0
        );

        return ((embeddingsSize + textSize) / 1024 / 1024).toFixed(2);
    }

    /**
     * Clear vector store (free memory)
     */
    clear() {
        this.chunks = [];
        this.embeddings = [];
        this.isLoaded = false;
        console.log('Vector store cleared');
    }

    /**
     * Check if vector store is loaded
     * @returns {boolean}
     */
    isStoreLoaded() {
        return this.isLoaded;
    }
}

export default VectorStore;
