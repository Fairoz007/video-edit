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
npm run dev:convex          # Terminal 1
npm run dev -w @docuforge/api   # Terminal 2 — render + script API
npm run dev:saas            # Terminal 3 — http://localhost:3000
```

Or legacy editor only: `npm run dev:web`

## Environment

| App | Variable |
|-----|----------|
| saas-web | `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_API_URL` (optional) |
| Convex | R2 + OAuth vars (see Phase 2) |

## Editor routes

- `/dashboard` — projects
- `/editor/[projectId]` — full documentary editor (Convex id)
