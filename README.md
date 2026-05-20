# DocuForge

Automatic documentary video generator — **no AI APIs** for scripting. Uses rule-based templates, offline TTS, media APIs, and a hybrid **FFmpeg + Remotion + MoviePy** render stack.

## Stack

| Layer | Technology |
|-------|------------|
| Desktop | Electron, React, TailwindCSS, Framer Motion |
| Backend | Node.js, Express |
| Render | FFmpeg, Remotion, MoviePy (Python) |
| NLP | compromise.js, keyword-extractor |
| Media | Pexels & Pixabay stock video APIs |

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
- **Python 3.11+** (for Chatterbox TTS + MoviePy)
- **FFmpeg** on PATH (`brew install ffmpeg`)

## Quick start (after clone)

```bash
git clone <repo-url> docuforge && cd docuforge
npm install
```

`npm install` runs **automatic setup**:

1. Creates `.env` from `.env.example` (if missing)
2. `pip install` for Chatterbox + MoviePy
3. Downloads Chatterbox-Turbo model weights (Hugging Face)
4. Installs Playwright Chromium

Then add API keys to `.env` (Pexels, Pixabay, Groq, etc.) and start:

```bash
npm run dev          # API + web + Electron
npm run dev:web      # API + web only
```

**Skip auto-setup** (CI / no Python): `DOCUFORGE_SKIP_SETUP=1 npm install`  
**Re-download models**: `npm run setup` or `DOCUFORGE_FORCE_SETUP=1 npm run setup`  
**Also prefetch multilingual model**: `CHATTERBOX_SETUP_MODELS=turbo,mtl npm run setup`

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
| `npm run setup` | Re-run Python deps + Chatterbox model download |
| `npm run chatterbox:health` | Check TTS / device |
| `npm run clean:workspace` | Clear projects/cache/exports |

## Pipeline

1. **Topic / URL** → rule-based script + Wikipedia facts  
2. **Keywords** → Pexels / Pixabay stock video download  
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




