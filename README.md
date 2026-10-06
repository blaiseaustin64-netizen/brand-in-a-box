# VEXDYN Brand-in-a-Box

**Phase 1 — Foundation + AI Brand Director**

Turn a business idea into a complete, consistent brand identity using AI.

## Stack

- React 19 + Vite + TypeScript
- CSS (design tokens, no heavy UI library)
- Local development AI provider (mock) with clean abstraction for future NYVEN

## Quick start

```bash
cd brand-in-a-box
npm install
npm run dev
```

Open the URL shown by Vite (typically http://localhost:5173).

## What works in Phase 1

- Create-brand onboarding (essentials → personality → visual direction)
- Brand Profile as central source of truth (typed, serializable)
- AI Brand Director panel (context-aware actions)
- Brand Overview, Strategy, Brand Voice sections
- Section regenerate / approve / inline edit
- Persistence via localStorage
- Responsive desktop + mobile layout
- Premium dark visual system (VEXDYN tokens)

## AI / API configuration

No API keys required for local development.

The app uses `MockAIProvider` (`src/services/ai/mockProvider.ts`), which generates coherent brand content from the user brief.

To plug in a real provider later:

1. Implement the `AIProvider` interface (`src/types/brand.ts` / `src/services/ai/provider.ts`)
2. Call `setAIProvider(yourProvider)` at bootstrap, or extend `getAIProvider()` to detect env config
3. Prefer a server proxy so keys never ship to the client

Future NYVEN path:

```
BrandDirector → AIProvider → NYVEN
```

No UI rewrite required.

## Brand Profile structure

See `src/types/brand.ts`:

- Foundation: brandName, industry, description, targetAudience, personality[], visualDirection, keywords
- Generated: tagline, summary, strategy{}, voice{}
- Meta: status, approvedSections, id, timestamps
- Stubs for Phase 2+: visualIdentity

## Project layout

```
src/
  types/brand.ts              # BrandProfile + AI contracts
  services/
    ai/                       # Provider abstraction + mock
    brandService.ts           # Persistence + orchestration
  store/BrandContext.tsx      # App state
  components/
    layout/                   # Sidebar, Director, Workspace
    create/                   # Onboarding flow
    overview/ strategy/ voice/
    shared/SectionCard.tsx
  styles/                     # Tokens + global
```

## Testing

1. `npm run dev`
2. Create a brand with name + description (minimum)
3. Walk Overview → Strategy → Voice
4. Regenerate a section; approve it; confirm regenerate is blocked
5. Use Director quick actions (More premium, Explain why, …)
6. Refresh the page — brand should restore from localStorage
7. Resize to mobile — use top bar for nav / Director

## Not in this phase

- Logo / image generation
- Color & typography systems (Phase 2)
- Forge / X-Ray / NYVEN connections
- Export / brand book PDF

## License

Proprietary — VEXDYN
