/**
 * Text Chunking Script
 * Splits extracted text into 200-300 token chunks with 50-token overlap
 * Preserves sentence boundaries when possible
 */

import { promises as fs } from 'fs';
import path from 'path';

// Configuration
const INPUT_DIR = './extracted_texts';
const METADATA_INPUT = './metadata/extracted_documents.json';
const OUTPUT_FILE = './metadata/chunks.json';
const TARGET_TOKENS = 250;
const OVERLAP_TOKENS = 50;
const MIN_CHUNK_TOKENS = 100;

class TextChunker {
    constructor() {
        this.chunks = [];
        this.totalChunks = 0;
    }

    /**
     * Main chunking function
     */
    async chunk() {
        console.log('Starting text chunking...');
        console.log(`Target: ${TARGET_TOKENS} tokens per chunk with ${OVERLAP_TOKENS} token overlap`);

        try {
            // Load metadata
            console.log('\n1. Loading extracted documents metadata...');
            const metadata = await this.loadMetadata();
            console.log(`Found ${metadata.documents.length} documents to chunk`);

            // Chunk each document
            console.log('\n2. Chunking documents...');
            for (const [index, doc] of metadata.documents.entries()) {
                console.log(`\nProcessing ${index + 1}/${metadata.documents.length}: ${doc.filename}`);

                try {
                    await this.chunkDocument(doc);
                } catch (error) {
                    console.error(`Chunking failed: ${error.message}`);
                }
            }

            // Save chunks
            console.log('\n3. Saving chunks...');
            await this.saveChunks();

            // Summary
            console.log('\n=== Chunking Complete ===');
            console.log(`Total chunks created: ${this.totalChunks}`);
            console.log(`Average chunks per document: ${(this.totalChunks / metadata.documents.length).toFixed(1)}`);

        } catch (error) {
            console.error('Chunking failed:', error);
            throw error;
        }
    }

    /**
     * Load metadata
     */
    async loadMetadata() {
        const content = await fs.readFile(METADATA_INPUT, 'utf8');
        return JSON.parse(content);
    }

    /**
     * Chunk a single document
     */
    async chunkDocument(doc) {
        // Read extracted text
        const text = await fs.readFile(doc.extracted_text_path, 'utf8');

        if (!text || text.trim().length === 0) {
            console.log('  Skipping empty document');
            return;
        }

        // Split into sentences
        const sentences = this.splitIntoSentences(text);
        console.log(`  Found ${sentences.length} sentences`);

        // Create chunks
        const docChunks = this.createChunks(sentences, doc);
        console.log(`  Created ${docChunks.length} chunks`);

        // Add to global chunks array
        this.chunks.push(...docChunks);
        this.totalChunks += docChunks.length;
    }

    /**
     * Split text into sentences
     */
    splitIntoSentences(text) {
        // Simple sentence splitting (improved regex for Ukrainian and English)
        const sentences = text
            .split(/(?<=[.!?])\s+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        return sentences;
    }

    /**
     * Create chunks from sentences
     */
    createChunks(sentences, doc) {
        const chunks = [];
        let currentChunk = '';
        let currentTokens = 0;
        let chunkIndex = 0;

        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i];
            const sentenceTokens = this.estimateTokens(sentence);

            // Check if adding this sentence would exceed target
            if (currentTokens + sentenceTokens > TARGET_TOKENS && currentChunk) {
                // Save current chunk
                chunks.push(this.createChunkObject(
                    currentChunk.trim(),
                    doc,
                    chunkIndex,
                    currentTokens
                ));

                // Start new chunk with overlap
                const overlapText = this.getOverlapText(currentChunk, OVERLAP_TOKENS);
                currentChunk = overlapText ? overlapText + ' ' + sentence : sentence;
                currentTokens = this.estimateTokens(currentChunk);
                chunkIndex++;
            } else {
                // Add sentence to current chunk
                currentChunk += (currentChunk ? ' ' : '') + sentence;
                currentTokens += sentenceTokens;
            }
        }

        // Save last chunk if it meets minimum size
        if (currentChunk && currentTokens >= MIN_CHUNK_TOKENS) {
            chunks.push(this.createChunkObject(
                currentChunk.trim(),
                doc,
                chunkIndex,
                currentTokens
            ));
        }

        return chunks;
    }

    /**
     * Create chunk object
     */
    createChunkObject(text, doc, chunkIndex, tokens) {
        return {
            chunk_id: `${doc.id}_chunk_${chunkIndex}`,
            document_id: doc.id,
            text,
            tokens,
            chunk_index: chunkIndex,
            category: doc.category,
            language: doc.language,
            metadata: {
                document_title: doc.title,
                document_filename: doc.filename,
                source_url: doc.source_url
            }
        };
    }

    /**
     * Estimate token count (approximate)
     * Ukrainian: ~3 chars per token, English: ~4 chars per token
     */
    estimateTokens(text) {
        return Math.ceil(text.length / 3.5);
    }

    /**
     * Get overlap text (last N tokens worth of text)
     */
    getOverlapText(text, tokens) {
        const words = text.split(/\s+/);
        const overlapWords = Math.min(tokens, words.length);

        if (overlapWords <= 0) return '';

        return words.slice(-overlapWords).join(' ');
    }

    /**
     * Save chunks to JSON file
     */
    async saveChunks() {
        const output = {
            version: '1.0',
            generated_at: new Date().toISOString(),
            config: {
                target_tokens: TARGET_TOKENS,
                overlap_tokens: OVERLAP_TOKENS,
                min_chunk_tokens: MIN_CHUNK_TOKENS
            },
            total_chunks: this.totalChunks,
            chunks: this.chunks
        };

        await fs.writeFile(
            OUTPUT_FILE,
            JSON.stringify(output, null, 2),
            'utf8'
        );

        console.log(`Chunks saved: ${OUTPUT_FILE}`);
        console.log(`File size: ${(JSON.stringify(output).length / 1024 / 1024).toFixed(2)} MB`);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const chunker = new TextChunker();
    chunker.chunk()
        .then(() => {
            console.log('\nChunking completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\nChunking failed:', error);
            process.exit(1);
        });
}

export default TextChunker;
