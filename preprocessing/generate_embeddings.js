/**
 * Embedding Generation Script
 * Generates 768-dimensional embeddings for all chunks using multilingual-e5-base
 * Supports Ukrainian and English text
 */

import { promises as fs } from 'fs';
import { pipeline } from '@xenova/transformers';
import pako from 'pako';

// Configuration
const INPUT_FILE = './metadata/chunks.json';
const OUTPUT_FILE = './output/embeddings.json';
const OUTPUT_FILE_GZ = './output/embeddings.json.gz';
const MODEL_NAME = 'Xenova/multilingual-e5-base';
const BATCH_SIZE = 10; // Process 10 chunks at a time to avoid memory issues

class EmbeddingGenerator {
    constructor() {
        this.extractor = null;
        this.processedCount = 0;
        this.totalChunks = 0;
        this.embeddings = [];
    }

    /**
     * Main generation function
     */
    async generate() {
        console.log('Starting embedding generation...');
        console.log(`Model: ${MODEL_NAME}`);

        try {
            // Create output directory
            await fs.mkdir('./output', { recursive: true });

            // Load model
            console.log('\n1. Loading embedding model...');
            await this.loadModel();

            // Load chunks
            console.log('\n2. Loading chunks...');
            const chunksData = await this.loadChunks();
            this.totalChunks = chunksData.chunks.length;
            console.log(`Found ${this.totalChunks} chunks to process`);

            // Generate embeddings in batches
            console.log('\n3. Generating embeddings...');
            await this.generateEmbeddings(chunksData.chunks);

            // Save embeddings
            console.log('\n4. Saving embeddings...');
            await this.saveEmbeddings(chunksData);

            // Compress
            console.log('\n5. Compressing embeddings...');
            await this.compressEmbeddings();

            // Summary
            console.log('\n=== Embedding Generation Complete ===');
            console.log(`Total chunks processed: ${this.processedCount}`);
            console.log(`Output: ${OUTPUT_FILE}`);
            console.log(`Compressed: ${OUTPUT_FILE_GZ}`);

            // Display file sizes
            const uncompressedSize = (await fs.stat(OUTPUT_FILE)).size;
            const compressedSize = (await fs.stat(OUTPUT_FILE_GZ)).size;
            console.log(`Uncompressed size: ${(uncompressedSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`Compressed size: ${(compressedSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`Compression ratio: ${((1 - compressedSize / uncompressedSize) * 100).toFixed(1)}%`);

        } catch (error) {
            console.error('Embedding generation failed:', error);
            throw error;
        }
    }

    /**
     * Load embedding model
     */
    async loadModel() {
        this.extractor = await pipeline('feature-extraction', MODEL_NAME, {
            progress_callback: (progress) => {
                if (progress.status === 'progress' && progress.total) {
                    const percentage = (progress.loaded / progress.total * 100).toFixed(1);
                    process.stdout.write(`\r  Loading ${progress.file}: ${percentage}%`);
                } else if (progress.status === 'done') {
                    process.stdout.write('\n');
                }
            }
        });

        console.log('Model loaded successfully!');
    }

    /**
     * Load chunks from JSON
     */
    async loadChunks() {
        const content = await fs.readFile(INPUT_FILE, 'utf8');
        return JSON.parse(content);
    }

    /**
     * Generate embeddings for all chunks
     */
    async generateEmbeddings(chunks) {
        const batches = this.createBatches(chunks, BATCH_SIZE);

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const batchNum = i + 1;

            console.log(`\nProcessing batch ${batchNum}/${batches.length} (${batch.length} chunks)`);

            for (const chunk of batch) {
                try {
                    const embedding = await this.generateEmbedding(chunk.text);

                    // Add embedding to chunk
                    this.embeddings.push({
                        ...chunk,
                        embedding: Array.from(embedding) // Convert Float32Array to regular array for JSON
                    });

                    this.processedCount++;

                    // Progress indicator
                    if (this.processedCount % 10 === 0) {
                        const progress = (this.processedCount / this.totalChunks * 100).toFixed(1);
                        console.log(`  Progress: ${this.processedCount}/${this.totalChunks} (${progress}%)`);
                    }

                } catch (error) {
                    console.error(`Failed to generate embedding for chunk ${chunk.chunk_id}: ${error.message}`);
                }
            }

            // Small delay between batches to avoid memory issues
            await this.sleep(1000);
        }
    }

    /**
     * Generate embedding for a single text
     */
    async generateEmbedding(text) {
        const output = await this.extractor(text, {
            pooling: 'mean',
            normalize: true
        });

        return output.data; // Float32Array of 768 dimensions
    }

    /**
     * Create batches from array
     */
    createBatches(array, batchSize) {
        const batches = [];
        for (let i = 0; i < array.length; i += batchSize) {
            batches.push(array.slice(i, i + batchSize));
        }
        return batches;
    }

    /**
     * Save embeddings to JSON file
     */
    async saveEmbeddings(chunksData) {
        const output = {
            version: '1.0',
            generated_at: new Date().toISOString(),
            model: MODEL_NAME,
            embedding_dim: 768,
            total_chunks: this.embeddings.length,
            config: chunksData.config,
            chunks: this.embeddings
        };

        await fs.writeFile(
            OUTPUT_FILE,
            JSON.stringify(output, null, 2),
            'utf8'
        );

        console.log(`Embeddings saved: ${OUTPUT_FILE}`);
    }

    /**
     * Compress embeddings using gzip
     */
    async compressEmbeddings() {
        const content = await fs.readFile(OUTPUT_FILE, 'utf8');
        const compressed = pako.gzip(content);

        await fs.writeFile(OUTPUT_FILE_GZ, compressed);

        console.log(`Compressed embeddings saved: ${OUTPUT_FILE_GZ}`);
    }

    /**
     * Sleep function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const generator = new EmbeddingGenerator();
    generator.generate()
        .then(() => {
            console.log('\nEmbedding generation completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\nEmbedding generation failed:', error);
            process.exit(1);
        });
}

export default EmbeddingGenerator;
