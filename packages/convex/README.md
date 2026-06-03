# @docuforge/convex

## First-time setup

```bash
cd packages/convex
npx convex dev
```

1. Log in and create/link a Convex project
2. Set OAuth env vars in the Convex dashboard (Google/GitHub)
3. Copy the deployment URL to `apps/saas-web/.env.local` as `NEXT_PUBLIC_CONVEX_URL`

`convex dev` regenerates `convex/_generated/` (replacing stubs).

## Phase 1 API

| Function | Description |
|----------|-------------|
| `userProfiles.me` | Current user + profile |
| `userProfiles.ensure` | Create profile if missing |
| `projects.list` | User's projects (by `updatedAt`) |
| `projects.getDocument` | Legacy-shaped project for editor |
| `projects.importFromLegacyBatch` | Import `migration-bundle.json` |
| `r2.generateUploadUrl` | Presigned PUT URL for R2 |
| `assets.completeUpload` | Register file after upload |
| `assets.listByProject` | List R2 assets for a project |

## R2 environment (Convex dashboard)

`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`

See `infra/r2-cors.json` for browser CORS.
