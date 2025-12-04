# GPT-2 Chatbot - GitHub Pages Edition

A client-side GPT-2 chatbot that runs entirely in your browser using Transformers.js. No backend required!

## Features

- ✅ **Pure Client-Side**: Runs entirely in your browser using Transformers.js
- ✅ **Multiple Models**: Choose between GPT-2 (124M) and DistilGPT-2 (82M)
- ✅ **Bilingual UI**: Ukrainian and English with language toggle
- ✅ **Multiple Conversations**: Manage and switch between different chats
- ✅ **Export/Import**: Download conversations in JSON or TXT format, upload to continue
- ✅ **Copy Messages**: Copy any message with one click
- ✅ **Auto-Save**: Conversations persist across browser sessions
- ✅ **Responsive**: Works on desktop, tablet, and mobile devices

## Quick Start

### Option 1: GitHub Pages (Recommended)

Visit the hosted version at: `https://[your-username].github.io/gpt2chat/`

### Option 2: Local Development

1. Clone the repository
2. Navigate to the `docs` directory
3. Start a local server:
   ```bash
   # Using Python 3
   cd docs
   python3 -m http.server 8000
   ```
4. Open `http://localhost:8000` in your browser

### Option 3: Live Server (VS Code)

1. Install the "Live Server" extension in VS Code
2. Right-click on `docs/index.html`
3. Select "Open with Live Server"

## Usage

### First Time Setup

1. **Model Loading**: On first load, the model will download (~150-250MB depending on your selection)
2. **Wait**: First load takes 10-30 seconds. Subsequent loads are instant (cached)
3. **Start Chatting**: Type your message and press Enter or click Send

### Creating Conversations

- Click **"New Chat"** button in the sidebar to create a new conversation
- Each conversation auto-saves and has a unique title based on the first message

### Switching Conversations

- Click on any conversation in the sidebar to switch to it
- Active conversation is highlighted
- All conversations are sorted by last update time

### Deleting Conversations

- Click the trash icon next to any conversation
- Confirm the deletion in the popup dialog

### Exporting Conversations

- **JSON Export**: Click the "JSON" button to download in JSON format (for re-importing)
- **TXT Export**: Click the "TXT" button to download human-readable plain text

### Importing Conversations

1. Click the **"Upload"** button in the header
2. Select a previously exported JSON file
3. The conversation will be imported and loaded

### Language Toggle

- Click the language button in the header to switch between Ukrainian (🇺🇦) and English (🇬🇧)
- All UI text updates instantly

### Model Settings

Adjust these parameters to control generation:

- **Model**: Switch between GPT-2 (larger, better quality) and DistilGPT-2 (smaller, faster)
- **Temperature** (0.1-1.0): Higher = more creative, lower = more focused
- **Max Length** (20-200): Maximum tokens to generate
- **Top K** (1-100): Limits vocabulary to top K tokens
- **Top P** (0.1-1.0): Nucleus sampling threshold
- **Repetition Penalty** (1.0-2.0): Penalizes repeated words

## Technical Details

### Architecture

```
docs/
├── index.html              # Main entry point
├── css/
│   ├── main.css           # Core styles
│   ├── sidebar.css        # Sidebar styles
│   └── mobile.css         # Responsive styles
├── js/
│   ├── app.js             # Main application controller
│   ├── ai/
│   │   ├── modelManager.js    # Transformers.js integration
│   │   └── promptBuilder.js   # Prompt formatting
│   ├── storage/
│   │   ├── localStorageManager.js    # Storage operations
│   │   └── conversationManager.js    # Conversation CRUD
│   ├── ui/
│   │   ├── chatUI.js          # Message rendering
│   │   ├── settingsUI.js      # Settings controls
│   │   ├── languageUI.js      # Language management
│   │   └── sidebarUI.js       # Sidebar management
│   ├── utils/
│   │   ├── fileHandler.js     # Export/import
│   │   ├── clipboard.js       # Copy functionality
│   │   └── uuid.js            # UUID generation
│   └── i18n/
│       └── translations.js    # All UI text
└── assets/
    └── icons/                 # SVG icons
```

### Storage

- Uses browser `localStorage` for persistence (5-10MB quota)
- Conversations stored as JSON objects
- Auto-cleanup keeps 20 most recent conversations
- Settings stored separately

### Available Models

All models load from HuggingFace CDN and are cached in IndexedDB for instant subsequent loads.

**GPT-2 Models (Classic):**
- **DistilGPT-2** (82M, ~150MB) - Fastest, good for quick responses
- **GPT-2** (124M, ~250MB) - Balanced performance and quality
- **GPT-2 Medium** (355M, ~700MB) - Better quality, slower

**Small Instruct Models (Recommended for chat):**
- **Qwen2.5 0.5B** (~300MB) - Very fast, good quality, instruction-tuned
- **Qwen2.5 1.5B** (~900MB) - High quality responses, still fast
- **TinyLlama 1.1B** (~650MB) - Optimized for chat, good balance

**Advanced Models (Require 8GB+ RAM):**
- **Phi-3 Mini 4K** (3.8B, ~2.3GB) - Microsoft's high-quality small model
- **SmolLM 360M** (~200MB) - Extremely efficient, good for low-end devices
- **StableLM 1.6B** (~1GB) - Good quality-to-size ratio
- **Llama 3.2 1B** (~650MB) - Latest Meta technology

**Why not larger models?**
Browser-based AI is limited by:
- RAM availability (most browsers cap at 2-4GB per tab)
- Download size (models > 2GB are impractical)
- Inference speed (larger models = slower responses)

Large models like 120B parameters (~240GB) require server-side deployment and cannot run in browsers.

### Browser Compatibility

- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

**Requirements:**
- ES6 modules support
- IndexedDB for model caching
- localStorage for conversation storage

## Troubleshooting

### Model won't load

- **Check internet connection**: First load requires downloading the model
- **Try smaller model**: Switch to DistilGPT-2 if memory is limited
- **Clear browser cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Out of memory error

- **Delete old messages**: Remove some messages from the current conversation
- **Switch to DistilGPT-2**: Smaller model uses less memory
- **Close other tabs**: Free up browser memory

### Storage quota exceeded

- **Delete old conversations**: Click trash icon on conversations you don't need
- **Export important chats**: Download as JSON before deleting
- **Clear localStorage**: Open DevTools → Application → Storage → Clear Site Data

### Conversations not saving

- **Check localStorage**: Make sure it's enabled in browser settings
- **Check quota**: Storage might be full
- **Try incognito mode**: Test if extensions are interfering

### Slow generation

- **Lower max_length**: Reduce tokens to generate
- **Use DistilGPT-2**: Faster inference
- **Close other tabs**: Free up CPU resources

## Development

### Adding New Features

1. **New UI Component**: Add to `js/ui/` directory
2. **New Translation Keys**: Update `js/i18n/translations.js`
3. **New Styles**: Add to appropriate CSS file
4. **Integrate in app.js**: Import and initialize in main controller

### Code Structure

- **ES6 modules**: All files use import/export
- **No build step**: Direct browser loading
- **CDN dependencies**: Transformers.js loaded from jsdelivr

### Testing

1. Start local server in `docs/` directory
2. Open browser DevTools (F12)
3. Check Console for errors
4. Test all features manually
5. Test on different screen sizes (responsive mode)

## Performance Tips

### For Users

- First load is slow (downloading model) - be patient
- Subsequent loads are instant (model cached)
- Shorter conversations = faster responses
- Lower max_length = faster generation

### For Developers

- Models cached in IndexedDB (no re-download)
- localStorage auto-save is debounced
- Messages rendered with virtual scrolling
- CSS animations use GPU acceleration

## Privacy

- **100% Client-Side**: No data sent to any server
- **Local Storage Only**: All conversations stored in your browser
- **No Tracking**: No analytics or telemetry
- **No Cookies**: Only localStorage for functionality

## License

Same as the main project. See parent directory LICENSE file.

## Credits

- Built with [Transformers.js](https://huggingface.co/docs/transformers.js)
- Models from [HuggingFace](https://huggingface.co/)
- Original Flask version in parent directory

## Support

For issues and feature requests, please open an issue on the GitHub repository.
