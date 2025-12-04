/**
 * Complete Pre-Processing Pipeline Runner
 * Executes all preprocessing steps in order:
 * 1. Download documents from KDPU website
 * 2. Extract text from PDFs/DOCX
 * 3. Chunk text into 200-300 token pieces
 * 4. Generate embeddings using multilingual-e5-base
 * 5. Generate categories metadata
 * 6. Copy files to web app directory
 */

import DocumentDownloader from './download_documents.js';
import TextExtractor from './extract_text.js';
import TextChunker from './chunk_text.js';
import EmbeddingGenerator from './generate_embeddings.js';
import CategoryGenerator from './generate_categories.js';
import { promises as fs } from 'fs';
import path from 'path';

class PipelineRunner {
    constructor() {
        this.startTime = null;
        this.stepTimes = {};
    }

    /**
     * Run complete pipeline
     */
    async run() {
        console.log('╔═══════════════════════════════════════════════════════════╗');
        console.log('║   KDPU RAG System - Complete Pre-Processing Pipeline    ║');
        console.log('║   Processes all 130+ university regulatory documents      ║');
        console.log('╚═══════════════════════════════════════════════════════════╝\n');

        this.startTime = Date.now();

        try {
            // Step 1: Download documents
            await this.runStep('STEP 1: DOWNLOAD DOCUMENTS', async () => {
                const downloader = new DocumentDownloader();
                await downloader.download();
            });

            // Step 2: Extract text
            await this.runStep('STEP 2: EXTRACT TEXT', async () => {
                const extractor = new TextExtractor();
                await extractor.extract();
            });

            // Step 3: Chunk text
            await this.runStep('STEP 3: CHUNK TEXT', async () => {
                const chunker = new TextChunker();
                await chunker.chunk();
            });

            // Step 4: Generate embeddings
            await this.runStep('STEP 4: GENERATE EMBEDDINGS', async () => {
                const generator = new EmbeddingGenerator();
                await generator.generate();
            });

            // Step 5: Generate categories
            await this.runStep('STEP 5: GENERATE CATEGORIES', async () => {
                const catGenerator = new CategoryGenerator();
                await catGenerator.generate();
            });

            // Step 6: Copy to web app
            await this.runStep('STEP 6: COPY TO WEB APP', async () => {
                await this.copyToWebApp();
            });

            // Summary
            this.printSummary();

        } catch (error) {
            console.error('\n❌ Pipeline failed:', error);
            process.exit(1);
        }
    }

    /**
     * Run a single pipeline step with timing
     */
    async runStep(stepName, stepFunction) {
        console.log('\n' + '='.repeat(60));
        console.log(`  ${stepName}`);
        console.log('='.repeat(60) + '\n');

        const startTime = Date.now();

        try {
            await stepFunction();
            const duration = Date.now() - startTime;
            this.stepTimes[stepName] = duration;

            console.log(`\n✓ ${stepName} completed in ${this.formatDuration(duration)}`);

        } catch (error) {
            console.error(`\n✗ ${stepName} failed:`, error.message);
            throw error;
        }
    }

    /**
     * Copy generated files to web app directory
     */
    async copyToWebApp() {
        const appDataDir = '../docs/js/data';

        // Ensure directory exists
        await fs.mkdir(appDataDir, { recursive: true });

        console.log('Copying files to web app...');

        // Copy embeddings (gzipped)
        await this.copyFile(
            './output/embeddings.json.gz',
            path.join(appDataDir, 'embeddings.json.gz')
        );

        // Copy documents metadata
        await this.copyFile(
            './metadata/extracted_documents.json',
            path.join(appDataDir, 'documents.json')
        );

        // Copy categories
        await this.copyFile(
            './output/categories.json',
            path.join(appDataDir, 'categories.json')
        );

        console.log('All files copied successfully!');
    }

    /**
     * Copy a single file
     */
    async copyFile(source, destination) {
        try {
            await fs.copyFile(source, destination);
            const stats = await fs.stat(destination);
            console.log(`  ✓ ${path.basename(destination)} (${this.formatBytes(stats.size)})`);
        } catch (error) {
            console.error(`  ✗ Failed to copy ${path.basename(destination)}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Print final summary
     */
    printSummary() {
        const totalDuration = Date.now() - this.startTime;

        console.log('\n' + '═'.repeat(60));
        console.log('  PIPELINE COMPLETE ✓');
        console.log('═'.repeat(60));

        console.log('\nStep Durations:');
        Object.entries(this.stepTimes).forEach(([step, duration]) => {
            console.log(`  ${step}: ${this.formatDuration(duration)}`);
        });

        console.log(`\nTotal time: ${this.formatDuration(totalDuration)}`);

        console.log('\nGenerated Files:');
        console.log('  - embeddings.json.gz (RAG vector database)');
        console.log('  - documents.json (document metadata)');
        console.log('  - categories.json (12 document categories)');

        console.log('\nNext Steps:');
        console.log('  1. Start the web server: cd ../docs && python3 -m http.server 8000');
        console.log('  2. Open http://localhost:8000 in your browser');
        console.log('  3. Try querying documents in Ukrainian or English!');

        console.log('\n' + '═'.repeat(60) + '\n');
    }

    /**
     * Format duration in human-readable format
     */
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        return `${seconds}s`;
    }

    /**
     * Format bytes in human-readable format
     */
    formatBytes(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    }
}

// Run pipeline
const runner = new PipelineRunner();
runner.run()
    .then(() => {
        console.log('Pipeline execution completed successfully!');
        process.exit(0);
    })
    .catch(error => {
        console.error('Pipeline execution failed:', error);
        process.exit(1);
    });

export default PipelineRunner;
