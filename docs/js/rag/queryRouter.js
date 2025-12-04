/**
 * Query Router
 * Intelligently routes queries between RAG mode (document-related) and general chat mode
 * Uses semantic similarity to detect document-related queries
 */

export class QueryRouter {
    constructor(embeddingManager, vectorStore) {
        this.embeddingManager = embeddingManager;
        this.vectorStore = vectorStore;
        this.thresholdSimilarity = 0.6; // Similarity threshold for RAG mode (tunable)
        this.minimumConfidence = 0.4; // Minimum confidence to consider RAG
    }

    /**
     * Route a query to appropriate mode (RAG or general chat)
     * @param {string} userQuery - User's query text
     * @param {Object} options - Routing options
     * @returns {Promise<Object>} Routing decision
     */
    async routeQuery(userQuery, options = {}) {
        if (!userQuery || typeof userQuery !== 'string') {
            throw new Error('User query must be a non-empty string');
        }

        const {
            forceMode = null, // 'rag', 'general', or null for auto
            topK = 1 // Number of chunks to consider for routing decision
        } = options;

        // If mode is forced, return immediately
        if (forceMode === 'rag') {
            return {
                mode: 'rag',
                confidence: 1.0,
                reason: 'Forced RAG mode',
                relevantChunks: []
            };
        }

        if (forceMode === 'general') {
            return {
                mode: 'general',
                confidence: 1.0,
                reason: 'Forced general chat mode',
                relevantChunks: []
            };
        }

        // Auto-routing: Check if query is document-related
        try {
            // Embed the query
            const queryEmbedding = await this.embeddingManager.embedText(userQuery);

            // Search for most similar chunks
            const results = this.vectorStore.search(queryEmbedding, topK);

            if (results.length === 0) {
                return {
                    mode: 'general',
                    confidence: 1.0,
                    reason: 'No documents found in vector store',
                    relevantChunks: []
                };
            }

            // Get highest similarity score
            const topScore = results[0].similarity_score;

            // Decide based on similarity threshold
            if (topScore >= this.thresholdSimilarity) {
                return {
                    mode: 'rag',
                    confidence: topScore,
                    reason: `High similarity (${(topScore * 100).toFixed(1)}%) to document content`,
                    relevantChunks: results
                };
            } else if (topScore >= this.minimumConfidence) {
                return {
                    mode: 'general',
                    confidence: 1 - topScore,
                    reason: `Low similarity (${(topScore * 100).toFixed(1)}%) to documents - using general chat`,
                    relevantChunks: results
                };
            } else {
                return {
                    mode: 'general',
                    confidence: 1.0,
                    reason: 'Query not document-related',
                    relevantChunks: []
                };
            }

        } catch (error) {
            console.error('Error routing query:', error);

            // Fallback to general chat on error
            return {
                mode: 'general',
                confidence: 0.5,
                reason: `Error during routing: ${error.message}`,
                relevantChunks: [],
                error: error.message
            };
        }
    }

    /**
     * Set similarity threshold
     * @param {number} threshold - New threshold (0-1)
     */
    setSimilarityThreshold(threshold) {
        if (threshold < 0 || threshold > 1) {
            throw new Error('Threshold must be between 0 and 1');
        }
        this.thresholdSimilarity = threshold;
        console.log(`Similarity threshold set to ${threshold}`);
    }

    /**
     * Get current similarity threshold
     * @returns {number} Current threshold
     */
    getSimilarityThreshold() {
        return this.thresholdSimilarity;
    }

    /**
     * Set minimum confidence threshold
     * @param {number} threshold - New minimum confidence (0-1)
     */
    setMinimumConfidence(threshold) {
        if (threshold < 0 || threshold > 1) {
            throw new Error('Threshold must be between 0 and 1');
        }
        this.minimumConfidence = threshold;
        console.log(`Minimum confidence set to ${threshold}`);
    }

    /**
     * Analyze query characteristics (for debugging/tuning)
     * @param {string} userQuery - User's query
     * @returns {Promise<Object>} Query analysis
     */
    async analyzeQuery(userQuery) {
        try {
            const queryEmbedding = await this.embeddingManager.embedText(userQuery);
            const topResults = this.vectorStore.search(queryEmbedding, 10);

            return {
                query: userQuery,
                queryLength: userQuery.length,
                topResults: topResults.map(r => ({
                    document_id: r.document_id,
                    category: r.category,
                    language: r.language,
                    similarity: r.similarity_score,
                    text_preview: r.text.substring(0, 100) + '...'
                })),
                maxSimilarity: topResults.length > 0 ? topResults[0].similarity_score : 0,
                recommendedMode: topResults.length > 0 && topResults[0].similarity_score >= this.thresholdSimilarity ? 'rag' : 'general'
            };
        } catch (error) {
            return {
                error: error.message,
                query: userQuery
            };
        }
    }

    /**
     * Batch route multiple queries (for testing/analysis)
     * @param {string[]} queries - Array of queries
     * @returns {Promise<Array>} Routing decisions
     */
    async batchRoute(queries) {
        const results = [];

        for (const query of queries) {
            const routing = await this.routeQuery(query);
            results.push({
                query,
                ...routing
            });
        }

        return results;
    }

    /**
     * Get routing statistics (for monitoring)
     * @param {Array} routingHistory - Array of routing decisions
     * @returns {Object} Statistics
     */
    getRoutingStats(routingHistory) {
        if (!Array.isArray(routingHistory) || routingHistory.length === 0) {
            return {
                total: 0,
                ragCount: 0,
                generalCount: 0,
                ragPercentage: 0,
                averageConfidence: 0
            };
        }

        const ragCount = routingHistory.filter(r => r.mode === 'rag').length;
        const generalCount = routingHistory.filter(r => r.mode === 'general').length;
        const totalConfidence = routingHistory.reduce((sum, r) => sum + (r.confidence || 0), 0);

        return {
            total: routingHistory.length,
            ragCount,
            generalCount,
            ragPercentage: ((ragCount / routingHistory.length) * 100).toFixed(1),
            generalPercentage: ((generalCount / routingHistory.length) * 100).toFixed(1),
            averageConfidence: (totalConfidence / routingHistory.length).toFixed(3)
        };
    }
}

export default QueryRouter;
