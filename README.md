# VEXDYN Brand-in-a-Box

AI-assisted brand workspace: strategy, voice, visual identity, assets, guidelines, and export.

**Live:** https://brand-in-a-box.pages.dev

## Stack

- React 19 + Vite + TypeScript
- CSS design tokens (no heavy UI library)
- Cloudflare Pages (static) + **Pages Functions** (`/api/*`)
- OpenRouter (server-side) for brand text intelligence
- Cloudflare Workers AI binding (`AI`) for raster images
- Procedural SVG logos and template business assets (client-side)

## Quick start (local UI only)

```bash
npm install
npm run dev
```

Local Vite does **not** run Pages Functions unless you use:

```bash
npx wrangler pages dev dist
```

(or point `VITE_API_PROXY` at a deployed preview URL).

Without Functions, brand-text AI and Workers AI image calls return clear errors (no silent fake AI).

## Production AI

| Capability | Provider | Where |
|------------|----------|--------|
| Strategy, voice, taglines, messaging | OpenRouter | `POST /api/brand-ai` |
| Campaign / social raster images | Workers AI Flux | `POST /api/generate-image` |
| Logo concepts | Procedural SVG | Client `generateIdentity.ts` |
| Business cards / stationery | SVG templates | Client `templateGenerator.ts` |

### Cloudflare configuration

**Secrets / env (Pages → Settings → Environment variables):**

| Name | Required | Purpose |
|------|----------|---------|
| `OPENROUTER_API_KEY` | Yes for text AI | Server-only OpenRouter key |
| `OPENROUTER_MODEL` | Optional | Default `google/gemma-4-26b-a4b-it:free` |
| `OPENROUTER_FALLBACK_MODEL` | Optional | Default `openrouter/free` |

**Bindings:**

| Binding | Type | Purpose |
|---------|------|---------|
| `AI` | Workers AI | Image generation |

Never put `OPENROUTER_API_KEY` in `VITE_*` vars or frontend code.

### Models

- **Text:** `google/gemma-4-26b-a4b-it:free` (free-tier OpenRouter; change via env). Free models are rate-limited and may rotate.
- **Image:** `@cf/black-forest-labs/flux-1-schnell` (Workers AI; response is base64 JPEG).

## Architecture

```
UI → RemoteAIProvider → /api/brand-ai → OpenRouter
                     → /api/generate-image → env.AI.run(flux)
                     → local procedural identity (logos/colors/type)
MockAIProvider remains for offline/demo injection via setAIProvider().
```

## Persistence

Brand profile + assets: browser `localStorage`.  
Raster images may be stored as data URLs in asset versions — **large**; not durable multi-device storage.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```


## Cloudflare Pages notes

- **No SPA catch-all redirect.** This app uses React view state, not URL routes. A `/* → /index.html 200` rule caused Cloudflare infinite-loop warnings and can interfere with Functions.
- **`public/_routes.json`** limits the Worker to `/api/*` so static assets are served without invoking Functions.
- **`wrangler.toml`** sets `compatibility_date` and `pages_build_output_dir = "dist"`.
- Secrets/bindings stay in the Pages dashboard: `OPENROUTER_API_KEY`, Workers AI binding `AI`.
