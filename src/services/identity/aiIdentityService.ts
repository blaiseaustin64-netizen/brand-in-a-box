/**
 * AI-assisted visual identity generation.
 * - Logo symbols / moodboards: Cloudflare Workers AI Flux (raster)
 * - Palette / type / direction structure: OpenRouter via /api/brand-ai
 * - Always falls back to procedural generators; never fakes AI success.
 */

import type {
  BrandProfile,
  LogoConcept,
  LogoSystem,
  ColorSystem,
  ColorToken,
  TypographySystem,
  VisualDirectionDetail,
  VisualIdentity,
} from '../../types/brand';
import { AI_ENDPOINTS } from '../ai/config';
import {
  buildColorSystem,
  buildTypography,
  buildLogoSystem,
  buildVisualDirectionDetail,
  buildFullIdentity,
} from './generateIdentity';

function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

export function buildBrandContextBlock(brand: BrandProfile): string {
  const primary =
    brand.visualIdentity?.colors?.palette?.find((c) => c.role === 'primary')
      ?.hex || '';
  return [
    `Brand: ${brand.brandName}`,
    brand.tagline ? `Tagline: ${brand.tagline}` : '',
    `Industry: ${brand.industry}`,
    `Description: ${brand.description}`,
    `Audience: ${brand.targetAudience}`,
    `Personality: ${brand.personality.join(', ')}`,
    `Visual direction: ${brand.visualDirection}`,
    brand.strategy?.positioning
      ? `Positioning: ${brand.strategy.positioning}`
      : '',
    brand.voice?.tone ? `Tone: ${brand.voice.tone}` : '',
    brand.keywords?.length ? `Keywords: ${brand.keywords.join(', ')}` : '',
    primary ? `Existing primary color: ${primary}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function logoSymbolPrompt(brand: BrandProfile, variant: number): string {
  const styles = [
    'geometric monogram mark, abstract symbol only, no letters, no text, no watermark',
    'minimal icon mark, simple shapes, flat design, no text, no watermark',
    'premium abstract emblem, balanced negative space, no text, no watermark',
  ];
  const style = styles[variant % styles.length];
  return [
    `Professional logo symbol for "${brand.brandName}", a ${brand.industry} brand.`,
    `${brand.visualDirection} aesthetic, ${brand.personality.join('/')} personality.`,
    brand.strategy?.positioning || brand.description,
    style,
    'Centered on solid dark or neutral background, clean edges, high contrast, brandable mark.',
    'No typography, no brand name lettering, no fake logos of other companies.',
  ]
    .filter(Boolean)
    .join(' ')
    .slice(0, 1900);
}

function moodboardPrompt(brand: BrandProfile): string {
  return [
    `Brand moodboard visual for ${brand.brandName} (${brand.industry}).`,
    `${brand.visualDirection} art direction, ${brand.personality.join(' / ')} feel.`,
    brand.strategy?.positioning || brand.description,
    'Abstract professional composition, lighting and texture suggesting brand world, no readable text, no watermarks.',
  ]
    .join(' ')
    .slice(0, 1900);
}

async function callFlux(
  prompt: string,
  steps = 4
): Promise<{ ok: true; dataUri: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(AI_ENDPOINTS.generateImage, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, steps }),
    });
    const data = (await res.json()) as {
      success?: boolean;
      dataUri?: string;
      error?: string;
    };
    if (!res.ok || !data.success || !data.dataUri) {
      return {
        ok: false,
        error: data.error || `Image API failed (${res.status})`,
      };
    }
    if (!data.dataUri.startsWith('data:image/')) {
      return { ok: false, error: 'Image API returned non-image payload.' };
    }
    return { ok: true, dataUri: data.dataUri };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error calling image API',
    };
  }
}

async function callBrandAiJson(
  action: string,
  brand: BrandProfile,
  instruction: string
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; error: string }> {
  try {
    const res = await fetch(AI_ENDPOINTS.brandAi, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        brand,
        instruction,
      }),
    });
    const data = (await res.json()) as {
      success?: boolean;
      error?: string;
      profile?: Record<string, unknown>;
      identityPayload?: Record<string, unknown>;
      rawPreview?: string;
    };
    if (!res.ok || !data.success) {
      return { ok: false, error: data.error || `Brand AI failed (${res.status})` };
    }
    // Prefer dedicated identityPayload if server adds it; else try profile extensions
    if (data.identityPayload && typeof data.identityPayload === 'object') {
      return { ok: true, data: data.identityPayload };
    }
    return { ok: true, data: (data.profile || data) as Record<string, unknown> };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error calling brand AI',
    };
  }
}

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function normalizeHex(h: string): string | null {
  const t = h.trim();
  if (!HEX_RE.test(t)) return null;
  if (t.length === 4) {
    return `#${t[1]}${t[1]}${t[2]}${t[2]}${t[3]}${t[3]}`.toUpperCase();
  }
  return t.toUpperCase();
}

/** Flux raster logo marks + procedural SVG wordmarks/lockups (honest dual source). */
export async function generateAiLogoSystem(
  brand: BrandProfile
): Promise<{ logo: LogoSystem; note: string; fluxCount: number }> {
  const procedural = buildLogoSystem(
    brand,
    brand.visualIdentity?.colors
  );
  // Mark procedural sources
  procedural.concepts = procedural.concepts.map((c) => ({
    ...c,
    source: 'procedural_svg' as const,
    rationale:
      (c.rationale || '') +
      ' Procedural SVG — not a Flux raster.',
  }));

  const fluxConcepts: LogoConcept[] = [];
  const errors: string[] = [];
  for (let i = 0; i < 3; i++) {
    const prompt = logoSymbolPrompt(brand, i);
    const result = await callFlux(prompt, 4);
    if (result.ok) {
      fluxConcepts.push({
        id: uid('logo_flux'),
        label: `AI symbol ${i + 1} (Flux raster)`,
        role: 'mark',
        status: 'ready',
        imageUrl: result.dataUri,
        source: 'flux_raster',
        generationPrompt: prompt,
        rationale: `Flux-generated symbol for ${brand.brandName}. Raster artwork — not editable SVG. Compose with typography for wordmarks.`,
        createdAt: now(),
        isSelected: i === 0 && procedural.concepts.length === 0,
      });
    } else {
      errors.push(result.error);
    }
  }

  const approvedId = brand.visualIdentity?.logo?.approvedConceptId;
  let concepts = [...fluxConcepts, ...procedural.concepts];
  if (approvedId) {
    const approved = brand.visualIdentity?.logo?.concepts.find(
      (c) => c.id === approvedId
    );
    if (approved) {
      concepts = [
        approved,
        ...concepts.filter((c) => c.id !== approved.id),
      ];
    }
  }

  const selectedConceptId =
    approvedId ||
    fluxConcepts[0]?.id ||
    procedural.concepts[0]?.id;

  const note =
    fluxConcepts.length > 0
      ? `Generated ${fluxConcepts.length} Flux raster symbol(s) plus procedural SVG wordmarks/monograms. Raster is not editable vector.`
      : `Flux logo symbols unavailable (${errors[0] || 'unknown'}). Showing procedural SVG concepts only.`;

  return {
    logo: {
      concepts,
      selectedConceptId,
      approvedConceptId: approvedId,
      activeRole: 'primary',
      lastGeneratedAt: now(),
      generationNote: note,
    },
    note,
    fluxCount: fluxConcepts.length,
  };
}

/** OpenRouter structured palette with procedural fallback. */
export async function generateAiColorSystem(
  brand: BrandProfile
): Promise<{ colors: ColorSystem; note: string; usedAi: boolean }> {
  const instruction = `Return ONLY JSON for a brand color palette (not strategy).
Schema:
{
  "palette": [
    {"role":"primary","name":"Primary","hex":"#RRGGBB","usage":"..."},
    {"role":"secondary","name":"Secondary","hex":"#RRGGBB","usage":"..."},
    {"role":"accent","name":"Accent","hex":"#RRGGBB","usage":"..."},
    {"role":"background","name":"Background","hex":"#RRGGBB","usage":"..."},
    {"role":"surface","name":"Surface","hex":"#RRGGBB","usage":"..."},
    {"role":"text","name":"Text","hex":"#RRGGBB","usage":"..."},
    {"role":"muted","name":"Muted","hex":"#RRGGBB","usage":"..."}
  ],
  "notes": "short rationale"
}
Brand context:
${buildBrandContextBlock(brand)}
HEX must be valid 6-digit. Coherent with ${brand.visualDirection} / ${brand.personality.join(',')}.`;

  const ai = await callBrandAiJson('propose_palette', brand, instruction);
  if (ai.ok) {
    const rawPalette = (ai.data.palette ||
      (ai.data as { strategy?: unknown }).strategy) as unknown;
    // Sometimes model nests wrongly — try identityPayload.palette
    let list: unknown[] = Array.isArray(rawPalette) ? rawPalette : [];
    if (!list.length && Array.isArray((ai.data as { colors?: { palette?: unknown[] } }).colors?.palette)) {
      list = (ai.data as { colors: { palette: unknown[] } }).colors.palette;
    }
    const tokens: ColorToken[] = [];
    for (const item of list) {
      if (!item || typeof item !== 'object') continue;
      const o = item as Record<string, unknown>;
      const hex = typeof o.hex === 'string' ? normalizeHex(o.hex) : null;
      const role = typeof o.role === 'string' ? o.role : '';
      if (!hex || !role) continue;
      tokens.push({
        id: role,
        name: typeof o.name === 'string' ? o.name : role,
        role: role as ColorToken['role'],
        hex,
        usage: typeof o.usage === 'string' ? o.usage : `${role} color`,
      });
    }
    const required = ['primary', 'secondary', 'background', 'text'];
    if (required.every((r) => tokens.some((t) => t.role === r))) {
      // Fill missing surface/muted from procedural if needed
      const procedural = buildColorSystem(brand);
      for (const p of procedural.palette) {
        if (!tokens.some((t) => t.role === p.role)) tokens.push(p);
      }
      return {
        colors: {
          palette: tokens,
          approved: false,
          version: (brand.visualIdentity?.colors?.version || 0) + 1,
          notes:
            typeof ai.data.notes === 'string'
              ? ai.data.notes
              : 'Palette proposed by OpenRouter from brand strategy.',
        },
        note: 'Palette from OpenRouter (structured HEX).',
        usedAi: true,
      };
    }
  }

  const colors = buildColorSystem(brand);
  colors.version = (brand.visualIdentity?.colors?.version || 0) + 1;
  colors.notes =
    'Procedural palette fallback (OpenRouter palette unavailable or invalid).';
  return {
    colors,
    note: `Procedural palette used. ${ai.ok ? 'AI response lacked valid HEX roles.' : ai.error}`,
    usedAi: false,
  };
}

const FONT_WHITELIST = [
  'Inter',
  'DM Sans',
  'Space Grotesk',
  'Outfit',
  'Playfair Display',
  'Lora',
  'Source Serif 4',
  'IBM Plex Sans',
  'Nunito',
  'Libre Baskerville',
];

export async function generateAiTypography(
  brand: BrandProfile
): Promise<{ typography: TypographySystem; note: string; usedAi: boolean }> {
  const instruction = `Recommend typography for this brand. Return ONLY JSON:
{
  "displayFont": "one of: ${FONT_WHITELIST.join(', ')}",
  "headingFont": "...",
  "bodyFont": "...",
  "notes": "why these fonts"
}
Brand context:
${buildBrandContextBlock(brand)}`;

  const ai = await callBrandAiJson('propose_typography', brand, instruction);
  if (ai.ok) {
    const display =
      typeof ai.data.displayFont === 'string' ? ai.data.displayFont : '';
    const heading =
      typeof ai.data.headingFont === 'string' ? ai.data.headingFont : display;
    const body =
      typeof ai.data.bodyFont === 'string' ? ai.data.bodyFont : 'Inter';
    if (FONT_WHITELIST.includes(display) && FONT_WHITELIST.includes(body)) {
      // Build stacks via procedural helper by temporarily overriding personality map
      const base = buildTypography(brand);
      const qParts = new Set<string>();
      const addQ = (name: string) => {
        qParts.add(`${name.replace(/ /g, '+')}:wght@400;500;600;700`);
      };
      addQ(display);
      addQ(heading);
      addQ(body);
      const typography: TypographySystem = {
        ...base,
        displayFont: display,
        headingFont: heading,
        bodyFont: body,
        uiFont: body,
        displayStack: `"${display}", system-ui, sans-serif`,
        headingStack: `"${heading}", system-ui, sans-serif`,
        bodyStack: `"${body}", system-ui, sans-serif`,
        uiStack: `"${body}", system-ui, sans-serif`,
        googleFontsQuery: [...qParts].join('|'),
        approved: false,
        notes:
          typeof ai.data.notes === 'string'
            ? ai.data.notes
            : 'Typography recommended by OpenRouter from whitelist.',
      };
      return {
        typography,
        note: 'Typography from OpenRouter (whitelisted Google fonts).',
        usedAi: true,
      };
    }
  }

  const typography = buildTypography(brand);
  return {
    typography,
    note: `Procedural typography used. ${ai.ok ? 'AI fonts not in whitelist.' : ai.error}`,
    usedAi: false,
  };
}

export async function generateAiVisualDirection(
  brand: BrandProfile,
  withMoodboard = true
): Promise<{
  detail: VisualDirectionDetail;
  moodboardDataUri?: string;
  note: string;
  usedAi: boolean;
}> {
  const procedural = buildVisualDirectionDetail(brand);
  const instruction = `Expand visual direction for this brand. Return ONLY JSON:
{
  "designLanguage": "...",
  "shapeLanguage": "...",
  "photographyDirection": "...",
  "illustrationDirection": "...",
  "iconStyle": "...",
  "texture": "...",
  "lighting": "...",
  "composition": "...",
  "spacingPersonality": "...",
  "uiStyle": "...",
  "summary": "2-3 sentences"
}
Brand context:
${buildBrandContextBlock(brand)}`;

  const ai = await callBrandAiJson('propose_visual_direction', brand, instruction);
  let detail = procedural;
  let usedAi = false;
  if (ai.ok) {
    const pickStr = (k: Exclude<keyof VisualDirectionDetail, 'approved'>): string => {
      const v = ai.data[k];
      if (typeof v === 'string' && v.trim()) return v;
      const fallback = procedural[k];
      return typeof fallback === 'string' ? fallback : '';
    };
    detail = {
      designLanguage: pickStr('designLanguage'),
      shapeLanguage: pickStr('shapeLanguage'),
      photographyDirection: pickStr('photographyDirection'),
      illustrationDirection: pickStr('illustrationDirection'),
      iconStyle: pickStr('iconStyle'),
      texture: pickStr('texture'),
      lighting: pickStr('lighting'),
      composition: pickStr('composition'),
      spacingPersonality: pickStr('spacingPersonality'),
      uiStyle: pickStr('uiStyle'),
      summary: pickStr('summary'),
      approved: false,
    };
    usedAi = true;
  }

  let moodboardDataUri: string | undefined;
  if (withMoodboard) {
    const flux = await callFlux(moodboardPrompt(brand), 4);
    if (flux.ok) moodboardDataUri = flux.dataUri;
  }

  return {
    detail,
    moodboardDataUri,
    note: usedAi
      ? `Visual direction from OpenRouter.${moodboardDataUri ? ' Flux moodboard attached.' : ''}`
      : `Procedural visual direction. ${ai.ok ? '' : ai.error}`,
    usedAi,
  };
}

export async function generateFullAiIdentity(brand: BrandProfile): Promise<{
  visualIdentity: VisualIdentity;
  note: string;
}> {
  const [colorsResult, typeResult, directionResult, logoResult] =
    await Promise.all([
      generateAiColorSystem(brand),
      generateAiTypography(brand),
      generateAiVisualDirection(brand, true),
      generateAiLogoSystem(brand),
    ]);

  // Rebuild logos once more with AI colors if flux already ran with old colors — logos use color for SVG only
  let logo = logoResult.logo;
  if (colorsResult.usedAi) {
    const svgPart = buildLogoSystem(
      { ...brand, visualIdentity: { ...brand.visualIdentity!, colors: colorsResult.colors } as VisualIdentity },
      colorsResult.colors
    );
    const fluxOnly = logo.concepts.filter((c) => c.source === 'flux_raster');
    const svgConcepts = svgPart.concepts.map((c) => ({
      ...c,
      source: 'procedural_svg' as const,
    }));
    logo = {
      ...logo,
      concepts: [...fluxOnly, ...svgConcepts],
      generationNote: logoResult.note,
    };
  }

  const visualIdentity: VisualIdentity = {
    logo,
    colors: colorsResult.colors,
    typography: typeResult.typography,
    visualDirectionDetail: directionResult.detail,
    generatedAt: now(),
  };

  // Stash moodboard as optional — store on direction notes field via summary append
  if (directionResult.moodboardDataUri) {
    visualIdentity.visualDirectionDetail = {
      ...visualIdentity.visualDirectionDetail,
      summary:
        visualIdentity.visualDirectionDetail.summary +
        ' [Moodboard raster available in generation session — use Assets for durable campaign images.]',
    };
  }

  const note = [
    colorsResult.note,
    typeResult.note,
    directionResult.note,
    logoResult.note,
  ].join(' ');

  return { visualIdentity, note };
}

export { buildFullIdentity };
