/**
 * RAG Pipeline
 * Orchestrates the complete Retrieval-Augmented Generation workflow
 * Handles query embedding, document retrieval, context building, and answer generation
 */

export class RAGPipeline {
    constructor(embeddingManager, vectorStore, documentManager, modelManager, promptBuilder) {
        this.embeddingManager = embeddingManager;
        this.vectorStore = vectorStore;
        this.documentManager = documentManager;
        this.modelManager = modelManager;
        this.promptBuilder = promptBuilder;
    }

    /**
     * Execute complete RAG query
     * @param {string} userQuery - User's question
     * @param {Object} options - Query options
     * @returns {Promise<Object>} RAG response with answer, chunks, and sources
     */
    async query(userQuery, options = {}) {
        const {
            topK = 5,
            filters = {},
            generationConfig = {},
            includeMetadata = true
        } = options;

        try {
            console.log(`RAG Query: "${userQuery}"`);

            // Step 1: Embed query
            const startEmbed = performance.now();
            const queryEmbedding = await this.embeddingManager.embedText(userQuery);
            const embedTime = performance.now() - startEmbed;

            // Step 2: Retrieve relevant chunks
            const startRetrieval = performance.now();
            const retrievedChunks = this.vectorStore.search(queryEmbedding, topK, filters);
            const retrievalTime = performance.now() - startRetrieval;

            if (retrievedChunks.length === 0) {
                return {
                    mode: 'no_results',
                    answer: 'Не знайдено релевантних документів. / No relevant documents found.',
                    retrievedChunks: [],
                    sources: [],
                    metadata: {
                        queryTime: embedTime + retrievalTime,
                        retrievedCount: 0
                    }
                };
            }

            // Step 3: Build context from retrieved chunks
            const context = this.buildContext(retrievedChunks);

            // Step 4: Build RAG-augmented prompt
            const ragPrompt = this.promptBuilder.buildRAGPrompt(userQuery, context);

            // Step 5: Generate answer with language model
            const startGeneration = performance.now();
            const generatedAnswer = await this.modelManager.generateResponse(ragPrompt, generationConfig);
            const generationTime = performance.now() - startGeneration;

            // Step 6: Clean and extract response
            const cleanAnswer = this.promptBuilder.extractResponse(generatedAnswer);

            // Step 7: Extract source documents
            const sources = this.extractSources(retrievedChunks);

            // Build response
            const response = {
                mode: 'rag',
                answer: cleanAnswer,
                retrievedChunks: retrievedChunks.map(chunk => ({
                    chunk_id: chunk.chunk_id,
                    text: chunk.text,
                    document_id: chunk.document_id,
                    similarity_score: chunk.similarity_score,
                    category: chunk.category,
                    language: chunk.language
                })),
                sources
            };

            if (includeMetadata) {
                response.metadata = {
                    queryTime: embedTime + retrievalTime + generationTime,
                    embeddingTime: embedTime,
                    retrievalTime,
                    generationTime,
                    retrievedCount: retrievedChunks.length,
                    sourceCount: sources.length,
                    avgSimilarity: this.calculateAvgSimilarity(retrievedChunks)
                };
            }

            console.log(`RAG query completed in ${response.metadata.queryTime.toFixed(0)}ms`);

            return response;

        } catch (error) {
            console.error('RAG pipeline error:', error);

            return {
                mode: 'error',
                answer: 'Виникла помилка при обробці запиту. / An error occurred while processing your request.',
                error: error.message,
                retrievedChunks: [],
                sources: []
            };
        }
    }

    /**
     * Build context string from retrieved chunks
     * @param {Array} chunks - Retrieved chunks
     * @returns {string} Formatted context
     */
    buildContext(chunks) {
        return chunks.map((chunk, idx) => {
            return `[Джерело ${idx + 1} / Source ${idx + 1}]:\n${chunk.text}`;
        }).join('\n\n');
    }

    /**
     * Extract unique source documents from chunks
     * @param {Array} chunks - Retrieved chunks
     * @returns {Array} Array of source documents
     */
    extractSources(chunks) {
        const uniqueDocs = new Set();
        const sources = [];

        for (const chunk of chunks) {
            if (!uniqueDocs.has(chunk.document_id)) {
                uniqueDocs.add(chunk.document_id);

                const doc = this.documentManager.getDocumentById(chunk.document_id);
                if (doc) {
                    const categoryName = this.documentManager.getCategoryName(doc.category, chunk.language);

                    sources.push({
                        document_id: doc.id,
                        title: doc.title,
                        category: doc.category,
                        categoryName,
                        source_url: doc.source_url,
                        language: doc.language,
                        filename: doc.filename
                    });
                }
            }
        }

        return sources;
    }

    /**
     * Calculate average similarity score
     * @param {Array} chunks - Retrieved chunks
     * @returns {number} Average similarity
     */
    calculateAvgSimilarity(chunks) {
        if (chunks.length === 0) return 0;

        const sum = chunks.reduce((acc, chunk) => acc + chunk.similarity_score, 0);
        return parseFloat((sum / chunks.length).toFixed(3));
    }

    /**
     * Perform semantic search across documents
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Object>} Search results
     */
    async semanticSearch(query, options = {}) {
        const {
            topK = 10,
            filters = {},
            includeContext = false
        } = options;

        try {
            // Embed query
            const queryEmbedding = await this.embeddingManager.embedText(query);

            // Search
            const results = this.vectorStore.search(queryEmbedding, topK, filters);

            // Format results
            const formattedResults = results.map(chunk => {
                const doc = this.documentManager.getDocumentById(chunk.document_id);

                return {
                    chunk_id: chunk.chunk_id,
                    text: chunk.text,
                    similarity_score: chunk.similarity_score,
                    document: doc ? {
                        id: doc.id,
                        title: doc.title,
                        category: doc.category,
                        language: doc.language
                    } : null
                };
            });

            return {
                query,
                results: formattedResults,
                totalResults: results.length,
                avgSimilarity: this.calculateAvgSimilarity(results)
            };

        } catch (error) {
            console.error('Semantic search error:', error);
            return {
                query,
                results: [],
                error: error.message
            };
        }
    }

    /**
     * Get related chunks for a document
     * @param {string} documentId - Document ID
     * @param {number} limit - Maximum chunks to return
     * @returns {Array} Document chunks
     */
    getDocumentChunks(documentId, limit = null) {
        const chunks = this.vectorStore.getChunksByDocument(documentId);

        if (limit && limit > 0) {
            return chunks.slice(0, limit);
        }

        return chunks;
    }

    /**
     * Find similar documents to a given document
     * @param {string} documentId - Document ID
     * @param {number} topK - Number of similar documents
     * @returns {Promise<Array>} Similar documents
     */
    async findSimilarDocuments(documentId, topK = 5) {
        try {
            // Get chunks from the document
            const documentChunks = this.getDocumentChunks(documentId, 3);

            if (documentChunks.length === 0) {
                return [];
            }

            // Use first chunk as query
            const queryEmbedding = new Float32Array(documentChunks[0].embedding);

            // Search for similar chunks (excluding same document)
            const results = this.vectorStore.search(queryEmbedding, topK * 3);

            // Extract unique documents
            const similarDocs = [];
            const seenDocs = new Set([documentId]);

            for (const chunk of results) {
                if (!seenDocs.has(chunk.document_id)) {
                    seenDocs.add(chunk.document_id);

                    const doc = this.documentManager.getDocumentById(chunk.document_id);
                    if (doc) {
                        similarDocs.push({
                            ...doc,
                            similarity_score: chunk.similarity_score
                        });
                    }

                    if (similarDocs.length >= topK) break;
                }
            }

            return similarDocs;

        } catch (error) {
            console.error('Error finding similar documents:', error);
            return [];
        }
    }

    /**
     * Get pipeline statistics
     * @returns {Object} Statistics
     */
    getStats() {
        return {
            embeddingManager: this.embeddingManager.getModelInfo(),
            vectorStore: this.vectorStore.getStats(),
            documentManager: this.documentManager.getStats()
        };
    }

    /**
     * Check if pipeline is ready
     * @returns {boolean} True if all components are loaded
     */
    isReady() {
        return this.embeddingManager.isModelLoaded() &&
               this.vectorStore.isStoreLoaded() &&
               this.documentManager.isManagerLoaded();
    }
}

export default RAGPipeline;
