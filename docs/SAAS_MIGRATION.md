# DocuForge Cloud SaaS Migration

## Completed

- [x] **Premium Longform only** — `template_premium_longform`
- [x] **Phase 0** — `packages/convex`, `packages/shared`, `apps/saas-web`
- [x] **Phase 1** — User profiles; `project.json` → Convex
- [x] **Phase 2** — R2 presigned uploads + asset records
- [x] **Phase 3** — Editor ported to `apps/saas-web`

### Phase 3 details

- Full editor UI under `apps/saas-web/src/editor/` (layout, timeline, panels, workflow)
- **Convex** — project state sync (`useConvexProjectSync`), realtime updates
- **Express bridge** — `POST /api/projects/sync` + `legacyProjectId` for render pipeline
- **Next.js** — API rewrites to Express (`NEXT_PUBLIC_API_URL`)
- Dashboard link in toolbar; SaaS projects panel (no local FS list)

## Next steps

1. **Phase 5** — Puter TTS (replace Chatterbox/ElevenLabs in pipeline)
2. **Phase 6** — Cloud render workers + `renderJobs.claimNext`

## Dev commands

```bash
npm install
npm run dev:convex          # from repo root (uses root convex.json + .env.local)
npm run dev -w @docuforge/api
npm run dev:saas            # Convex + Next.js
```

Use `npm run dev:convex` (not bare `npx convex dev` before `npm install` at root).

Copy `.env.local.example` → `.env.local` at repo root; set `NEXT_PUBLIC_CONVEX_URL` in `apps/saas-web/.env.local`.

Or legacy editor only: `npm run dev:web`

### Convex URLs (two hosts)

| URL | Env var | Used for |
|-----|---------|----------|
| `https://….convex.cloud` | `CONVEX_URL` / `NEXT_PUBLIC_CONVEX_URL` | Browser client: queries, mutations, subscriptions |
| `https://….convex.site` | `CONVEX_SITE_URL` | HTTP actions (if used) |

**Custom domains** (dashboard → deployment → Custom Domains) need a **Pro** plan. For dev, keep the default `*.convex.cloud` and `*.convex.site` URLs. Production custom domains go on the **prod** deployment; then update env vars if you use dashboard “Override Environment Variables”.

## Environment

| File | Purpose |
|------|---------|
| `.env` | Express API only (media, TTS, script LLM, render) |
| `apps/saas-web/.env.local` | `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_API_URL` |
| `.env.local` (repo root) | `CONVEX_DEPLOYMENT`, `CONVEX_URL`, `CONVEX_SITE_URL` |
| Convex dashboard | R2, `WORKER_SECRET` (auth disabled — single shared `anonymous` user) |

## Editor routes

- `/dashboard` — projects
- `/editor/[projectId]` — full documentary editor (Convex id)
