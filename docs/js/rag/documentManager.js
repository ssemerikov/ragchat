/**
 * Document Manager
 * Manages document metadata, categories, and document operations
 * Handles 130+ university regulatory documents across 12 categories
 */

export class DocumentManager {
    constructor() {
        this.documents = [];
        this.categories = [];
        this.documentsById = new Map();
        this.documentsByCategory = new Map();
        this.isLoaded = false;
    }

    /**
     * Load document and category metadata
     * @param {Object} documentsData - Documents metadata
     * @param {Object} categoriesData - Categories metadata
     * @returns {Promise<void>}
     */
    async loadMetadata(documentsData, categoriesData) {
        if (!documentsData || !documentsData.documents) {
            throw new Error('Invalid documents data format');
        }

        if (!categoriesData || !categoriesData.categories) {
            throw new Error('Invalid categories data format');
        }

        try {
            this.documents = documentsData.documents;
            this.categories = categoriesData.categories;

            // Build index by ID
            this.documentsById.clear();
            this.documents.forEach(doc => {
                this.documentsById.set(doc.id, doc);
            });

            // Build index by category
            this.documentsByCategory.clear();
            this.documents.forEach(doc => {
                if (!this.documentsByCategory.has(doc.category)) {
                    this.documentsByCategory.set(doc.category, []);
                }
                this.documentsByCategory.get(doc.category).push(doc);
            });

            this.isLoaded = true;
            console.log(`Loaded ${this.documents.length} documents across ${this.categories.length} categories`);

        } catch (error) {
            console.error('Failed to load metadata:', error);
            throw error;
        }
    }

    /**
     * Get document by ID
     * @param {string} id - Document ID
     * @returns {Object|null} Document object or null
     */
    getDocumentById(id) {
        return this.documentsById.get(id) || null;
    }

    /**
     * Get all documents in a category
     * @param {string} categoryId - Category ID
     * @returns {Array} Array of documents
     */
    getDocumentsByCategory(categoryId) {
        return this.documentsByCategory.get(categoryId) || [];
    }

    /**
     * Get all categories
     * @returns {Array} Array of category objects
     */
    getAllCategories() {
        return this.categories;
    }

    /**
     * Get category by ID
     * @param {string} categoryId - Category ID
     * @returns {Object|null} Category object or null
     */
    getCategoryById(categoryId) {
        return this.categories.find(cat => cat.id === categoryId) || null;
    }

    /**
     * Get all documents
     * @param {Object} filters - Optional filters
     * @returns {Array} Array of documents
     */
    getAllDocuments(filters = {}) {
        let docs = [...this.documents];

        if (filters.category) {
            docs = docs.filter(doc => doc.category === filters.category);
        }

        if (filters.language) {
            docs = docs.filter(doc => doc.language === filters.language);
        }

        return docs;
    }

    /**
     * Search documents by title or filename
     * @param {string} query - Search query
     * @param {string} language - Optional language filter ('uk' or 'en')
     * @returns {Array} Matching documents
     */
    searchDocuments(query, language = null) {
        if (!query) return this.getAllDocuments();

        const lowerQuery = query.toLowerCase().trim();

        return this.documents.filter(doc => {
            // Language filter
            if (language && doc.language !== language) return false;

            // Search in title and filename
            return (doc.title && doc.title.toLowerCase().includes(lowerQuery)) ||
                   (doc.filename && doc.filename.toLowerCase().includes(lowerQuery));
        });
    }

    /**
     * Get document metadata for display
     * @param {string} documentId - Document ID
     * @returns {Object|null} Document metadata
     */
    getDocumentMetadata(documentId) {
        const doc = this.documentsById.get(documentId);
        if (!doc) return null;

        const category = this.getCategoryById(doc.category);

        return {
            id: doc.id,
            title: doc.title,
            filename: doc.filename,
            category: doc.category,
            categoryName: category ? category.name_uk : doc.category,
            source_url: doc.source_url,
            language: doc.language,
            chunk_count: doc.chunk_count || 0,
            word_count: doc.word_count || 0,
            last_updated: doc.last_updated
        };
    }

    /**
     * Get documents by language
     * @param {string} language - Language code ('uk' or 'en')
     * @returns {Array} Array of documents
     */
    getDocumentsByLanguage(language) {
        return this.documents.filter(doc => doc.language === language);
    }

    /**
     * Get random documents (for suggestions/featured)
     * @param {number} count - Number of random documents
     * @returns {Array} Random documents
     */
    getRandomDocuments(count = 5) {
        const shuffled = [...this.documents].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    /**
     * Get recently updated documents
     * @param {number} count - Number of documents to return
     * @returns {Array} Recently updated documents
     */
    getRecentlyUpdated(count = 10) {
        return [...this.documents]
            .sort((a, b) => {
                const dateA = new Date(a.last_updated || 0);
                const dateB = new Date(b.last_updated || 0);
                return dateB - dateA;
            })
            .slice(0, count);
    }

    /**
     * Get statistics about the document collection
     * @returns {Object} Statistics
     */
    getStats() {
        if (!this.isLoaded) {
            return {
                loaded: false,
                totalDocuments: 0,
                totalCategories: 0
            };
        }

        const languages = new Set(this.documents.map(d => d.language));
        const ukrainianDocs = this.documents.filter(d => d.language === 'uk').length;
        const englishDocs = this.documents.filter(d => d.language === 'en').length;

        const categoryCounts = {};
        this.categories.forEach(category => {
            categoryCounts[category.id] = this.getDocumentsByCategory(category.id).length;
        });

        return {
            loaded: true,
            totalDocuments: this.documents.length,
            totalCategories: this.categories.length,
            languages: Array.from(languages),
            ukrainianDocuments: ukrainianDocs,
            englishDocuments: englishDocs,
            documentsByCategory: categoryCounts
        };
    }

    /**
     * Validate document structure
     * @param {Object} doc - Document object to validate
     * @returns {boolean} True if valid
     */
    validateDocument(doc) {
        const requiredFields = ['id', 'title', 'category', 'language'];
        return requiredFields.every(field => doc && doc[field]);
    }

    /**
     * Get category name (localized)
     * @param {string} categoryId - Category ID
     * @param {string} language - Language code ('uk' or 'en')
     * @returns {string} Category name
     */
    getCategoryName(categoryId, language = 'uk') {
        const category = this.getCategoryById(categoryId);
        if (!category) return categoryId;

        return language === 'en' ? category.name_en : category.name_uk;
    }

    /**
     * Check if document manager is loaded
     * @returns {boolean}
     */
    isManagerLoaded() {
        return this.isLoaded;
    }

    /**
     * Clear all data
     */
    clear() {
        this.documents = [];
        this.categories = [];
        this.documentsById.clear();
        this.documentsByCategory.clear();
        this.isLoaded = false;
        console.log('Document manager cleared');
    }
}

export default DocumentManager;
