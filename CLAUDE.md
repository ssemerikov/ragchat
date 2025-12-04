# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a client-side GPT-2 chatbot that runs entirely in the browser using Transformers.js. It's a pure JavaScript application with no backend, designed to be hosted on GitHub Pages.

**Key Characteristics:**
- 100% client-side execution (no server required)
- ES6 modules with no build step
- Direct browser loading of dependencies from CDN
- localStorage for conversation persistence
- IndexedDB for model caching (managed by Transformers.js)

## Development Commands

### Running Locally

Start a local HTTP server in the `docs/` directory:

```bash
cd docs
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

**Note:** You MUST use an HTTP server - opening `index.html` directly will fail due to ES6 module CORS restrictions.

### Testing

There are no automated tests. All testing is manual:

1. Start local server
2. Open browser DevTools (F12)
3. Check Console for errors
4. Test features manually
5. Test responsive design using DevTools device emulation

### Testing Models

Use the test HTML files to verify model compatibility:
- `test_single_model.html` - Test one specific model
- `test_all_models.html` - Batch test multiple models
- `test_models.html` - Interactive model testing

## Architecture

### Module Structure

The application follows a modular ES6 architecture with clear separation of concerns:

```
docs/js/
├── app.js                    # Main controller - orchestrates all modules
├── ai/
│   ├── modelManager.js       # Transformers.js integration & model lifecycle
│   └── promptBuilder.js      # Conversation formatting & prompt construction
├── storage/
│   ├── localStorageManager.js    # Low-level storage operations
│   └── conversationManager.js    # Conversation CRUD & persistence
├── ui/
│   ├── chatUI.js            # Message rendering & display
│   ├── settingsUI.js        # Model parameter controls
│   ├── languageUI.js        # i18n management
│   └── sidebarUI.js         # Conversation list management
├── utils/
│   ├── fileHandler.js       # Import/export functionality
│   ├── clipboard.js         # Copy to clipboard
│   └── uuid.js              # UUID generation
└── i18n/
    └── translations.js       # Bilingual text (Ukrainian/English)
```

### Key Design Patterns

**1. Main Controller Pattern (app.js)**
- `GPT2ChatApp` class orchestrates all modules
- Initializes UI components and wires event handlers
- Manages application state (currentConversation, settings)
- Coordinates between AI, storage, and UI layers

**2. Model Management (modelManager.js)**
- Single responsibility: Load, unload, and run inference with Transformers.js models
- Progressive loading with callbacks for UI updates
- Handles model switching and memory cleanup
- Force loads from HuggingFace CDN (no local models)

**3. Prompt Construction (promptBuilder.js)**
- Formats conversation history as "User: ... Assistant: ..." pattern
- Manages context window (default 512 tokens)
- Truncates old messages when context limit exceeded
- Extracts clean responses from model output

**4. Storage Layer**
- `LocalStorageManager`: Low-level key-value operations with quota handling
- `ConversationManager`: High-level conversation CRUD, auto-generates titles from first message
- Conversations auto-save on every message
- Keeps 20 most recent conversations (cleanup method)

**5. UI Components**
- Each UI module is self-contained with its own DOM management
- Language switching updates all i18n elements via data attributes
- Message rendering includes timestamps, role labels, and copy buttons
- Typing indicators for AI response generation

### Data Flow

**Sending a Message:**
1. User types message → `app.js` validates via `PromptBuilder`
2. Message added to conversation via `ConversationManager`
3. `ChatUI` renders user message
4. `PromptBuilder` constructs prompt from conversation history
5. `ModelManager` generates response using Transformers.js
6. Response extracted and added to conversation
7. `ChatUI` renders assistant message
8. Conversation auto-saved to localStorage

**Model Loading:**
1. `ModelManager.loadModel()` dynamically imports Transformers.js from CDN
2. Creates text-generation pipeline with progress callbacks
3. Progress updates flow: Transformers.js → ModelManager → app.js → UI
4. Model cached in IndexedDB automatically by Transformers.js
5. Subsequent loads are instant (no re-download)

### Context Window Management

The application manages limited context windows (512 tokens default):

- `PromptBuilder` truncates oldest messages when context limit exceeded
- Always keeps at least 1 message (most recent)
- Reserves ~100 tokens for prompt formatting
- Token counting is approximate (4 chars/token heuristic)

This prevents "out of memory" errors with long conversations.

## Important Implementation Details

### Model Configuration

All models must:
- Be available in ONNX format on HuggingFace
- Support text-generation pipeline
- Work with browser-based ONNX runtime

When adding new models to the dropdown:
1. Verify the model exists at `https://huggingface.co/{model_name}`
2. Confirm it has ONNX weights (`onnx/` directory)
3. Test with `test_single_model.html` first
4. Add to appropriate `<optgroup>` in `index.html`

### Storage Limits

Browser localStorage typically has 5-10MB quota:
- Each conversation ~1-5KB depending on message count
- Settings stored separately
- Auto-cleanup keeps 20 most recent conversations
- Export/import allows archiving old conversations

### Progressive Loading

First load experience:
1. Model downloads from CDN (150-800MB depending on selection)
2. Progress bar shows download status
3. Model caches in IndexedDB
4. Subsequent loads are instant (cache hit)

Always show progress callbacks to prevent user confusion during initial load.

### ES6 Module Loading

Critical considerations:
- All JS files use ES6 `import`/`export` syntax
- No transpilation or bundling
- Must be served via HTTP (not `file://`)
- CDN imports use explicit versions or `@latest`
- Cache busting via query params (e.g., `app.js?v=timestamp`)

### Bilingual Support

The app supports Ukrainian (default) and English:
- All UI text in `translations.js`
- Elements use `data-i18n` attributes for automatic updates
- Language preference saved in settings
- Dynamic content (timestamps, titles) formatted per locale

When adding new UI text:
1. Add keys to both `uk` and `en` objects in `translations.js`
2. Use `data-i18n` attribute on static elements
3. Use `languageUI.translate(key)` for dynamic text

## Common Tasks

### Adding a New Model

1. Find model on HuggingFace with ONNX support
2. Test using `test_single_model.html`
3. Add `<option>` to `index.html` model selector under appropriate `<optgroup>`
4. Format: `<option value="namespace/model-name">Display Name (~size)</option>`

### Adding a New UI Feature

1. Create module in appropriate directory (ui/, utils/, etc.)
2. Import in `app.js`
3. Initialize in `initUIModules()` or `setupEventListeners()`
4. Add any new text to `translations.js`
5. Add styles to appropriate CSS file

### Modifying Prompt Format

Edit `promptBuilder.js`:
- `formatConversationHistory()` - Change role formatting
- `createPrompt()` - Modify prompt structure
- `extractResponse()` - Update response parsing

Always test with multiple models as different models may be sensitive to prompt format.

### Changing Context Window

Modify `PromptBuilder` constructor:
```javascript
this.promptBuilder = new PromptBuilder(512); // Change this value
```

Larger values = more context but slower generation and higher memory usage.

## File Loading and Dependencies

**External Dependencies (loaded from CDN):**
- Transformers.js: `https://cdn.jsdelivr.net/npm/@xenova/transformers@latest`
  - Handles model loading, tokenization, and inference
  - Automatically manages IndexedDB cache
  - Provides ONNX runtime for browser

**No npm packages required** - all dependencies loaded dynamically at runtime.

## Browser Compatibility

Requires modern browser with:
- ES6 modules support
- IndexedDB (for model caching)
- localStorage (for conversations)
- WASM support (for ONNX runtime)

Minimum versions: Chrome 90+, Firefox 90+, Safari 14+, Edge 90+

## Debugging Tips

**Model Loading Issues:**
- Check browser console for CORS errors
- Verify model exists on HuggingFace
- Check available RAM (large models need 2-4GB)
- Clear IndexedDB if cache corrupted

**Storage Issues:**
- Check localStorage quota in DevTools → Application → Storage
- Use `conversationManager.cleanup()` to free space
- Export important conversations before clearing

**Generation Issues:**
- Lower max_length if getting memory errors
- Check prompt construction in console
- Verify model is loaded (`modelManager.isLoaded`)
- Some models are instruction-tuned, others are not (affects quality)

## Deployment

This is a GitHub Pages site. The `docs/` directory is the webroot.

To deploy:
1. Push changes to `docs/` directory
2. GitHub automatically serves from `docs/`
3. No build process required
4. Changes are live immediately

**Important:** All files must be in `docs/` directory for GitHub Pages to serve them.
