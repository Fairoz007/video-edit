# DocuForge

Automatic documentary video generator — **no AI APIs** for scripting. Uses rule-based templates, offline TTS, media APIs, and a hybrid **FFmpeg + Remotion + MoviePy** render stack.

## Stack

| Layer | Technology |
|-------|------------|
| Desktop | Electron, React, TailwindCSS, Framer Motion |
| Backend | Node.js, Express |
| Render | FFmpeg, Remotion, MoviePy (Python) |
| NLP | compromise.js, keyword-extractor |
| Media | Pexels, Pixabay, Unsplash APIs |

## Monorepo layout

```
├── apps/
│   ├── web/           # Vite + React UI
│   ├── api/           # Express backend, TTS, scrapers, pipelines
│   └── desktop/       # Electron shell
├── packages/
│   ├── remotion/      # Remotion compositions
│   └── config/        # Shared monorepo utilities
├── projects/          # Per-project assets
├── cache/             # Downloaded media
├── exports/           # Final MP4/MOV
└── scripts/           # Dev & maintenance scripts
```

## Prerequisites

- **Node.js** 18+
- **FFmpeg** on PATH (`brew install ffmpeg`)
- **Python 3** + MoviePy (`pip install -r apps/api/moviepy/requirements.txt`)
- API keys in `.env` (copy from `.env.example`)

## Quick start

```bash
cp .env.example .env
# Add PEXELS_API_KEY, PIXABAY_API_KEY, UNSPLASH_ACCESS_KEY

npm install
python3 -m pip install -r apps/api/moviepy/requirements.txt

# Full stack (API + Vite + Electron)
npm run dev

# Web only (API + Vite, no Electron)
npm run dev:web
```

If you see **port already in use**, run:

```bash
npm run kill:ports
```

Then start again. Do **not** paste shell comments (`# Terminal 1`) on the same line as commands.

## Workspace scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | API + web + Electron |
| `npm run dev:web` | API + web |
| `npm run dev -w @docuforge/api` | Backend only |
| `npm run dev -w @docuforge/web` | Vite only |
| `npm run remotion:studio` | Remotion Studio |
| `npm run clean:workspace` | Clear projects/cache/exports |

## Pipeline

1. **Topic / URL** → rule-based script + Wikipedia facts  
2. **Keywords** → Pexels / Pixabay / Unsplash download  
3. **Offline TTS** → narration MP3  
4. **SRT** subtitles  
5. **MoviePy** → clip sequence + audio sync  
6. **Remotion** (fallback/enhance) → motion graphics  
7. **FFmpeg** → effects, mix, burn subs, encode  

## Export presets

- 1080p, 4K, YouTube, Shorts, Reels  
- MP4 (H.264) or MOV (ProRes)  

## Future AI (disabled)

See `apps/api/services/aiPlaceholder.js` for OpenAI, Ollama, Whisper, ElevenLabs hooks.
