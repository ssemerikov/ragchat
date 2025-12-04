/**
 * Text Extraction Script
 * Extracts text from PDF and DOCX files
 * Uses pdf.js for PDFs and mammoth.js for DOCX
 */

import { promises as fs } from 'fs';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import mammoth from 'mammoth';

// Configuration
const INPUT_DIR = './raw_documents';
const OUTPUT_DIR = './extracted_texts';
const METADATA_INPUT = './metadata/documents.json';
const METADATA_OUTPUT = './metadata/extracted_documents.json';

class TextExtractor {
    constructor() {
        this.extractedCount = 0;
        this.failedCount = 0;
        this.extractedDocs = [];
    }

    /**
     * Main extraction function
     */
    async extract() {
        console.log('Starting text extraction from documents...');

        try {
            // Create output directory
            await fs.mkdir(OUTPUT_DIR, { recursive: true });

            // Load metadata
            console.log('\n1. Loading document metadata...');
            const metadata = await this.loadMetadata();
            console.log(`Found ${metadata.documents.length} documents to process`);

            // Filter only successfully downloaded documents
            const downloadedDocs = metadata.documents.filter(doc => doc.downloaded);
            console.log(`Processing ${downloadedDocs.length} downloaded documents`);

            // Extract text from each document
            console.log('\n2. Extracting text from documents...');
            for (const [index, doc] of downloadedDocs.entries()) {
                console.log(`\nProcessing ${index + 1}/${downloadedDocs.length}: ${doc.filename}`);

                try {
                    const text = await this.extractDocument(doc);
                    this.extractedCount++;

                    // Save extracted text
                    await this.saveExtractedText(doc, text);
                } catch (error) {
                    console.error(`Extraction failed: ${error.message}`);
                    this.failedCount++;
                }
            }

            // Save metadata
            console.log('\n3. Saving extraction metadata...');
            await this.saveMetadata();

            // Summary
            console.log('\n=== Extraction Complete ===');
            console.log(`Total processed: ${downloadedDocs.length}`);
            console.log(`Successfully extracted: ${this.extractedCount}`);
            console.log(`Failed: ${this.failedCount}`);

        } catch (error) {
            console.error('Extraction failed:', error);
            throw error;
        }
    }

    /**
     * Load metadata from documents.json
     */
    async loadMetadata() {
        const content = await fs.readFile(METADATA_INPUT, 'utf8');
        return JSON.parse(content);
    }

    /**
     * Extract text from a document
     */
    async extractDocument(doc) {
        const filepath = doc.filepath;

        // Check file exists
        try {
            await fs.access(filepath);
        } catch {
            throw new Error(`File not found: ${filepath}`);
        }

        // Extract based on file type
        const extension = path.extname(filepath).toLowerCase();

        if (extension === '.pdf') {
            return await this.extractPDF(filepath);
        } else if (extension === '.docx') {
            return await this.extractDOCX(filepath);
        } else if (extension === '.doc') {
            // Legacy DOC format - harder to extract, try mammoth anyway
            return await this.extractDOCX(filepath);
        } else {
            throw new Error(`Unsupported file type: ${extension}`);
        }
    }

    /**
     * Extract text from PDF using pdf.js
     */
    async extractPDF(filepath) {
        try {
            const dataBuffer = await fs.readFile(filepath);

            // Load PDF
            const loadingTask = pdfjsLib.getDocument({
                data: dataBuffer,
                verbosity: 0
            });

            const pdf = await loadingTask.promise;
            const numPages = pdf.numPages;

            console.log(`  PDF has ${numPages} pages`);

            let fullText = '';

            // Extract text from each page
            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();

                // Combine text items
                const pageText = textContent.items
                    .map(item => item.str)
                    .join(' ');

                fullText += pageText + '\n\n';
            }

            // Clean text
            const cleanedText = this.cleanText(fullText);

            console.log(`  Extracted ${cleanedText.length} characters`);

            return cleanedText;

        } catch (error) {
            throw new Error(`PDF extraction error: ${error.message}`);
        }
    }

    /**
     * Extract text from DOCX using mammoth.js
     */
    async extractDOCX(filepath) {
        try {
            const result = await mammoth.extractRawText({ path: filepath });

            if (result.messages && result.messages.length > 0) {
                console.log(`  Mammoth messages: ${result.messages.length}`);
            }

            const text = result.value;
            const cleanedText = this.cleanText(text);

            console.log(`  Extracted ${cleanedText.length} characters`);

            return cleanedText;

        } catch (error) {
            throw new Error(`DOCX extraction error: ${error.message}`);
        }
    }

    /**
     * Clean extracted text
     */
    cleanText(text) {
        return text
            // Normalize whitespace
            .replace(/\s+/g, ' ')
            // Remove excess newlines (max 2)
            .replace(/\n{3,}/g, '\n\n')
            // Trim
            .trim();
    }

    /**
     * Save extracted text to file
     */
    async saveExtractedText(doc, text) {
        // Create category directory
        const categoryDir = path.join(OUTPUT_DIR, doc.category);
        await fs.mkdir(categoryDir, { recursive: true });

        // Generate output filename
        const baseName = path.basename(doc.filename, path.extname(doc.filename));
        const outputPath = path.join(categoryDir, `${baseName}.txt`);

        // Save text
        await fs.writeFile(outputPath, text, 'utf8');

        console.log(`  Saved: ${outputPath}`);

        // Add to extracted docs
        this.extractedDocs.push({
            ...doc,
            extracted_text_path: outputPath,
            text_length: text.length,
            word_count: text.split(/\s+/).length,
            extraction_date: new Date().toISOString(),
            extracted: true
        });
    }

    /**
     * Save extraction metadata
     */
    async saveMetadata() {
        const metadata = {
            version: '1.0',
            generated_at: new Date().toISOString(),
            total_processed: this.extractedCount + this.failedCount,
            successfully_extracted: this.extractedCount,
            failed: this.failedCount,
            documents: this.extractedDocs
        };

        await fs.writeFile(
            METADATA_OUTPUT,
            JSON.stringify(metadata, null, 2),
            'utf8'
        );

        console.log(`Metadata saved: ${METADATA_OUTPUT}`);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const extractor = new TextExtractor();
    extractor.extract()
        .then(() => {
            console.log('\nText extraction completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\nText extraction failed:', error);
            process.exit(1);
        });
}

export default TextExtractor;
