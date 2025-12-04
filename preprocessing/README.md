# KDPU RAG Pre-Processing Pipeline

This directory contains scripts to download, process, and generate embeddings for all 130+ regulatory documents from Kryvyi Rih State Pedagogical University.

## Overview

The pipeline performs the following steps:

1. **Download Documents** - Scrapes and downloads all documents from KDPU website
2. **Extract Text** - Extracts text from PDFs and DOCX files
3. **Chunk Text** - Splits text into 200-300 token chunks with overlap
4. **Generate Embeddings** - Creates 768-dimensional embeddings using multilingual-e5-base
5. **Generate Categories** - Creates category metadata for 12 document categories
6. **Copy to App** - Moves processed files to web application

## Setup

Install dependencies:

```bash
npm install
```

## Usage

### Run Complete Pipeline

Process all documents in one command:

```bash
npm run process-all
```

This will:
- Download all 130+ documents from https://kdpu.edu.ua
- Extract text from PDFs/DOCX
- Chunk into ~5000 pieces
- Generate embeddings (~5-8MB compressed)
- Copy files to the web app

**Estimated time:** 2-4 hours (depending on internet speed and computer)

### Run Individual Steps

Run steps separately if needed:

```bash
# 1. Download documents
npm run download

# 2. Extract text from PDFs/DOCX
npm run extract

# 3. Chunk text into pieces
npm run chunk

# 4. Generate embeddings (longest step)
npm run embed

# 5. Generate categories
npm run categories

# 6. Copy files to web app
npm run copy-to-app
```

## Output Files

### Generated Files

- `raw_documents/` - Downloaded PDFs and DOCX files (organized by category)
- `extracted_texts/` - Extracted plain text files
- `metadata/` - Metadata JSON files
  - `documents.json` - Document metadata
  - `extracted_documents.json` - Extraction metadata
  - `chunks.json` - All text chunks (~5000 chunks)
- `output/` - Final processed files
  - `embeddings.json` - Embeddings (~15-20MB uncompressed)
  - `embeddings.json.gz` - Compressed embeddings (~5-8MB)
  - `categories.json` - 12 document categories

### Copied to Web App

These files are automatically copied to `../docs/js/data/`:

- `embeddings.json.gz` - Vector database for RAG
- `documents.json` - Document metadata
- `categories.json` - Category definitions

## Script Details

### download_documents.js

- Scrapes https://kdpu.edu.ua/pro-nas/dokumenty-universytetu/normatyvna-baza.html
- Downloads all PDFs and DOCX files
- Organizes by 12 categories
- Handles Google Drive links (notes which need manual download)
- Rate-limited to avoid overwhelming server

### extract_text.js

- Uses `pdf.js` for PDF text extraction
- Uses `mammoth.js` for DOCX text extraction
- Cleans and normalizes text
- Preserves document structure
- Outputs plain text files

### chunk_text.js

- Target: 200-300 tokens per chunk
- Overlap: 50 tokens between chunks
- Respects sentence boundaries
- Generates unique chunk IDs
- Preserves metadata (document, category, language)

### generate_embeddings.js

- Model: `Xenova/multilingual-e5-base` (768 dimensions)
- Supports Ukrainian and English
- Batch processing (10 chunks at a time)
- Progress tracking
- Gzip compression for web deployment

### generate_categories.js

- 12 categories with Ukrainian/English names
- Icons for UI display
- Document counts per category
- Descriptions for each category

## Categories

The system organizes documents into 12 categories:

1. 📋 **Загальна діяльність** (General Operations)
2. 🛡️ **Антикорупційна діяльність** (Anti-Corruption)
3. 🎓 **Вчена рада** (Academic Council)
4. 🏛️ **Структурні підрозділи** (Structural Divisions)
5. 📚 **Освітній процес** (Educational Process)
6. 🔬 **Наукова робота** (Scientific Work)
7. 💰 **Фінансова діяльність** (Financial Activities)
8. 📱 **Інформаційна діяльність** (Information Activities)
9. 🤝 **Соціально-виховна діяльність** (Social-Civic)
10. 🏠 **Гуртожитки** (Dormitories)
11. 👥 **Кадрові питання** (Personnel Issues)
12. ⚠️ **Охорона праці** (Occupational Safety)

## Configuration

Edit script constants to customize:

- `TARGET_TOKENS` - Chunk size (default: 250)
- `OVERLAP_TOKENS` - Overlap between chunks (default: 50)
- `MODEL_NAME` - Embedding model (default: multilingual-e5-base)
- `BATCH_SIZE` - Embedding batch size (default: 10)

## Troubleshooting

### Google Drive Access

Some documents are hosted on Google Drive and require manual download:
1. The script will log which files need manual download
2. Download them manually and place in appropriate category folder
3. Re-run extraction step

### Memory Issues

If embedding generation runs out of memory:
- Reduce `BATCH_SIZE` in generate_embeddings.js
- Process documents in smaller batches
- Close other applications

### PDF Extraction Fails

Some PDFs may be scanned images without text:
- These will produce empty or garbled text
- May require OCR (Tesseract.js) - not currently implemented
- Can be manually reviewed and added

## Performance

Typical processing times on modern hardware:

- Download: 10-30 minutes (network dependent)
- Extract: 5-15 minutes
- Chunk: 1-2 minutes
- Embed: 1-3 hours (model download + inference)
- Categories: <1 minute
- Copy: <1 minute

**Total: 2-4 hours** (first run includes model download)

## Requirements

- Node.js 18+
- 4GB+ RAM
- 2GB+ disk space
- Internet connection for downloads and model

## Model Information

**Xenova/multilingual-e5-base**
- 768-dimensional embeddings
- Supports 100+ languages including Ukrainian and English
- ~1GB download size
- Cached in ~/.cache/transformers after first run
- Same vector space for both languages (semantic search works across languages)

## Next Steps

After running the pipeline:

1. Start the web server:
   ```bash
   cd ../docs
   python3 -m http.server 8000
   ```

2. Open http://localhost:8000

3. The RAG system will load embeddings and be ready to answer questions about university documents!

## License

Same as parent project.
