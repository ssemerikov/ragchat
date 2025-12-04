/**
 * Document Downloader
 * Scrapes and downloads all 130+ documents from KDPU university website
 * Source: https://kdpu.edu.ua/pro-nas/dokumenty-universytetu/normatyvna-baza.html
 */

import { promises as fs } from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

// Configuration
const BASE_URL = 'https://kdpu.edu.ua/pro-nas/dokumenty-universytetu/normatyvna-baza.html';
const OUTPUT_DIR = './raw_documents';
const METADATA_FILE = './metadata/documents.json';

// Category mapping (12 categories based on website structure)
const CATEGORIES = [
    { id: 'general_operations', name_uk: 'Загальна діяльність', name_en: 'General Operations' },
    { id: 'anti_corruption', name_uk: 'Антикорупційна діяльність', name_en: 'Anti-Corruption Activities' },
    { id: 'academic_council', name_uk: 'Вчена рада', name_en: 'Academic Council' },
    { id: 'structural_divisions', name_uk: 'Структурні підрозділи', name_en: 'Structural Divisions' },
    { id: 'educational_process', name_uk: 'Освітній процес', name_en: 'Educational Process' },
    { id: 'scientific_work', name_uk: 'Наукова робота', name_en: 'Scientific Work' },
    { id: 'financial_activities', name_uk: 'Фінансова діяльність', name_en: 'Financial Activities' },
    { id: 'information_activities', name_uk: 'Інформаційна діяльність', name_en: 'Information Activities' },
    { id: 'social_civic', name_uk: 'Соціально-виховна діяльність', name_en: 'Social-Civic Activities' },
    { id: 'dormitories', name_uk: 'Гуртожитки', name_en: 'Dormitories' },
    { id: 'hr_management', name_uk: 'Кадрові питання', name_en: 'Personnel Issues' },
    { id: 'safety', name_uk: 'Охорона праці', name_en: 'Occupational Safety' }
];

class DocumentDownloader {
    constructor() {
        this.documents = [];
        this.downloadedCount = 0;
        this.failedCount = 0;
    }

    /**
     * Main download function
     */
    async download() {
        console.log('Starting document download from KDPU website...');
        console.log(`Source: ${BASE_URL}`);

        try {
            // Create output directories
            await this.createDirectories();

            // Fetch and parse webpage
            console.log('\n1. Fetching webpage...');
            const html = await this.fetchPage(BASE_URL);

            // Parse document links
            console.log('\n2. Parsing document links...');
            const documentLinks = await this.parseDocumentLinks(html);
            console.log(`Found ${documentLinks.length} documents`);

            // Download each document
            console.log('\n3. Downloading documents...');
            for (const [index, docLink] of documentLinks.entries()) {
                console.log(`\nProcessing ${index + 1}/${documentLinks.length}: ${docLink.title}`);

                try {
                    await this.downloadDocument(docLink);
                    this.downloadedCount++;
                } catch (error) {
                    console.error(`Failed to download: ${error.message}`);
                    this.failedCount++;
                }

                // Rate limiting
                await this.sleep(1000);
            }

            // Save metadata
            console.log('\n4. Saving metadata...');
            await this.saveMetadata();

            // Summary
            console.log('\n=== Download Complete ===');
            console.log(`Total documents: ${documentLinks.length}`);
            console.log(`Successfully downloaded: ${this.downloadedCount}`);
            console.log(`Failed: ${this.failedCount}`);

        } catch (error) {
            console.error('Download failed:', error);
            throw error;
        }
    }

    /**
     * Create output directories
     */
    async createDirectories() {
        await fs.mkdir(OUTPUT_DIR, { recursive: true });
        await fs.mkdir('./metadata', { recursive: true });

        for (const category of CATEGORIES) {
            const categoryDir = path.join(OUTPUT_DIR, category.id);
            await fs.mkdir(categoryDir, { recursive: true });
        }

        // Also create uncategorized folder as fallback
        await fs.mkdir(path.join(OUTPUT_DIR, 'uncategorized'), { recursive: true });
    }

    /**
     * Fetch webpage content
     */
    async fetchPage(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    }

    /**
     * Parse document links from HTML
     */
    async parseDocumentLinks(html) {
        const dom = new JSDOM(html);
        const document = dom.window.document;

        const documentLinks = [];
        let currentCategory = null;
        let categoryIndex = 0;

        // Find all links that look like documents
        const allLinks = document.querySelectorAll('a');

        for (const link of allLinks) {
            const href = link.getAttribute('href');
            const text = link.textContent.trim();

            if (!href || !text) continue;

            // Check if this is a category header
            const parent = link.parentElement;
            if (parent && (parent.tagName === 'H2' || parent.tagName === 'H3')) {
                // This might be a new category
                if (categoryIndex < CATEGORIES.length) {
                    currentCategory = CATEGORIES[categoryIndex];
                    categoryIndex++;
                }
                continue;
            }

            // Check if link is a document (Google Drive, PDF, DOC, etc.)
            if (this.isDocumentLink(href)) {
                const lang = this.detectLanguage(text);

                documentLinks.push({
                    title: text,
                    url: this.normalizeUrl(href),
                    category: currentCategory?.id || 'uncategorized',
                    language: lang,
                    type: this.getFileType(href)
                });
            }
        }

        return documentLinks;
    }

    /**
     * Check if URL is a document link
     */
    isDocumentLink(url) {
        return url.includes('drive.google.com') ||
               url.includes('docs.google.com') ||
               url.endsWith('.pdf') ||
               url.endsWith('.doc') ||
               url.endsWith('.docx') ||
               url.includes('/files/') ||
               url.includes('/documents/');
    }

    /**
     * Normalize URL (handle relative URLs)
     */
    normalizeUrl(url) {
        if (url.startsWith('http')) {
            return url;
        }
        if (url.startsWith('/')) {
            return `https://kdpu.edu.ua${url}`;
        }
        return `https://kdpu.edu.ua/${url}`;
    }

    /**
     * Detect language from title
     */
    detectLanguage(text) {
        // Check for Cyrillic characters
        const hasCyrillic = /[\u0400-\u04FF]/.test(text);
        return hasCyrillic ? 'uk' : 'en';
    }

    /**
     * Get file type from URL
     */
    getFileType(url) {
        if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
            return 'google_drive';
        }
        if (url.endsWith('.pdf')) return 'pdf';
        if (url.endsWith('.doc')) return 'doc';
        if (url.endsWith('.docx')) return 'docx';
        return 'unknown';
    }

    /**
     * Download a single document
     */
    async downloadDocument(docLink) {
        const { title, url, category, language, type } = docLink;

        // Generate safe filename
        const safeTitle = this.sanitizeFilename(title);
        const extension = this.getExtension(type);
        const filename = `${safeTitle}.${extension}`;
        const filepath = path.join(OUTPUT_DIR, category, filename);

        // Check if already downloaded
        try {
            await fs.access(filepath);
            console.log(`Already exists: ${filename}`);
            this.addToMetadata(docLink, filename, filepath);
            return;
        } catch {}

        // Handle Google Drive links specially
        if (type === 'google_drive') {
            try {
                const downloadUrl = this.getGoogleDriveDirectLink(url);
                console.log(`Downloading from Google Drive: ${downloadUrl}`);

                const response = await fetch(downloadUrl, {
                    redirect: 'follow',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                await fs.writeFile(filepath, buffer);

                console.log(`Saved: ${filename} (${(buffer.length / 1024).toFixed(2)} KB)`);
                this.addToMetadata(docLink, filename, filepath, true);
                return;
            } catch (error) {
                console.error(`Google Drive download failed: ${error.message}`);
                this.addToMetadata(docLink, filename, filepath, false, error.message);
                throw error;
            }
        }

        // Download file
        try {
            console.log(`Downloading: ${url}`);
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            await fs.writeFile(filepath, buffer);

            console.log(`Saved: ${filename} (${(buffer.length / 1024).toFixed(2)} KB)`);
            this.addToMetadata(docLink, filename, filepath, true);

        } catch (error) {
            console.error(`Download error: ${error.message}`);
            this.addToMetadata(docLink, filename, filepath, false, error.message);
            throw error;
        }
    }

    /**
     * Extract Google Drive file ID and return direct download link
     */
    getGoogleDriveDirectLink(url) {
        // Extract file ID from various Google Drive URL formats
        let fileId = null;

        // Format: https://drive.google.com/file/d/{FILE_ID}/view
        let match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (match) {
            fileId = match[1];
        }

        // Format: https://drive.google.com/open?id={FILE_ID}
        if (!fileId) {
            match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (match) {
                fileId = match[1];
            }
        }

        // Format: https://docs.google.com/forms/...
        if (!fileId) {
            match = url.match(/\/forms\/d\/([a-zA-Z0-9_-]+)/);
            if (match) {
                fileId = match[1];
            }
        }

        if (!fileId) {
            throw new Error(`Could not extract file ID from URL: ${url}`);
        }

        // Return direct download link
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }

    /**
     * Sanitize filename (remove special characters)
     */
    sanitizeFilename(name) {
        return name
            .replace(/[<>:"/\\|?*]/g, '_')
            .replace(/\s+/g, '_')
            .substring(0, 200); // Limit length
    }

    /**
     * Get file extension
     */
    getExtension(type) {
        switch (type) {
            case 'pdf': return 'pdf';
            case 'doc': return 'doc';
            case 'docx': return 'docx';
            case 'google_drive': return 'pdf'; // Assume PDF for Google Drive
            default: return 'pdf';
        }
    }

    /**
     * Add document to metadata
     */
    addToMetadata(docLink, filename, filepath, downloaded = true, error = null) {
        this.documents.push({
            id: `doc_${this.documents.length + 1}`,
            title: docLink.title,
            filename,
            filepath,
            source_url: docLink.url,
            category: docLink.category,
            language: docLink.language,
            type: docLink.type,
            downloaded,
            download_error: error,
            download_date: new Date().toISOString()
        });
    }

    /**
     * Save metadata to JSON file
     */
    async saveMetadata() {
        const metadata = {
            version: '1.0',
            generated_at: new Date().toISOString(),
            source_url: BASE_URL,
            total_documents: this.documents.length,
            downloaded: this.downloadedCount,
            failed: this.failedCount,
            categories: CATEGORIES,
            documents: this.documents
        };

        await fs.writeFile(
            METADATA_FILE,
            JSON.stringify(metadata, null, 2),
            'utf8'
        );

        console.log(`Metadata saved: ${METADATA_FILE}`);
    }

    /**
     * Sleep function for rate limiting
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const downloader = new DocumentDownloader();
    downloader.download()
        .then(() => {
            console.log('\nDownload script completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\nDownload script failed:', error);
            process.exit(1);
        });
}

export default DocumentDownloader;
