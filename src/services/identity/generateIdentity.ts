/**
 * Context-aware visual identity generators.
 * Used by MockAIProvider — no external image APIs.
 * Produces structured logo concepts (SVG), semantic color palettes,
 * typography systems, and visual direction from Brand Profile.
 */

import type {
  BrandProfile,
  BrandPersonality,
  VisualDirection,
  ColorSystem,
  ColorToken,
  TypographySystem,
  TypeScaleEntry,
  VisualDirectionDetail,
  LogoSystem,
  LogoConcept,
  LogoRole,
  VisualIdentity,
} from '../../types/brand';

function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const lin = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrastRatio(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getContrastLabel(fg: string, bg: string): string {
  const ratio = contrastRatio(fg, bg);
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA Large';
  return 'Low contrast';
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 100) / 100;
  l = clamp(l, 0, 100) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Personality + visual direction → base hue / saturation bias */
function paletteBias(
  personality: BrandPersonality[],
  visual: VisualDirection
): { hue: number; sat: number; light: number; darkBg: boolean } {
  const primary = personality[0] || 'Professional';
  const map: Record<string, { hue: number; sat: number; light: number }> = {
    Luxury: { hue: 40, sat: 35, light: 55 },
    Minimal: { hue: 210, sat: 8, light: 50 },
    Futuristic: { hue: 195, sat: 70, light: 55 },
    Playful: { hue: 320, sat: 65, light: 55 },
    Professional: { hue: 215, sat: 45, light: 48 },
    Technical: { hue: 180, sat: 55, light: 50 },
    Bold: { hue: 5, sat: 75, light: 50 },
    Modern: { hue: 250, sat: 50, light: 55 },
    Friendly: { hue: 25, sat: 60, light: 55 },
    Creative: { hue: 280, sat: 55, light: 55 },
  };
  const base = map[primary] || map.Professional;
  const darkBg =
    visual === 'Dark Tech' ||
    visual === 'Futuristic' ||
    visual === 'Minimal' ||
    visual === 'Luxury';
  if (visual === 'Organic') {
    base.hue = 140;
    base.sat = 40;
  }
  if (visual === 'Editorial') {
    base.hue = 15;
    base.sat = 25;
  }
  if (visual === 'Corporate') {
    base.hue = 210;
    base.sat = 40;
  }
  return { ...base, darkBg };
}

export function buildColorSystem(
  brand: BrandProfile,
  opts?: { darker?: boolean; lighter?: boolean; moreContrast?: boolean; lessSat?: boolean; premium?: boolean; energetic?: boolean }
): ColorSystem {
  const bias = paletteBias(brand.personality, brand.visualDirection);
  let { hue, sat, light } = bias;
  if (opts?.premium) {
    sat = Math.max(20, sat - 15);
    light = clamp(light - 5, 35, 60);
  }
  if (opts?.energetic) sat = clamp(sat + 20, 0, 90);
  if (opts?.lessSat) sat = clamp(sat - 25, 5, 100);
  if (opts?.darker) light = clamp(light - 12, 25, 70);
  if (opts?.lighter) light = clamp(light + 12, 30, 75);
  if (opts?.moreContrast) {
    /* widen later */
  }

  const primary = hslToHex(hue, sat, light);
  const secondary = hslToHex((hue + 40) % 360, clamp(sat - 10, 10, 80), clamp(light - 8, 30, 65));
  const accent = hslToHex((hue + 180) % 360, clamp(sat + 5, 20, 85), clamp(light + 5, 40, 70));

  const bg = bias.darkBg ? hslToHex(hue, 8, 6) : hslToHex(hue, 5, 98);
  const surface = bias.darkBg ? hslToHex(hue, 10, 10) : hslToHex(hue, 6, 96);
  const surfaceElevated = bias.darkBg ? hslToHex(hue, 12, 14) : '#ffffff';
  const text = bias.darkBg ? hslToHex(hue, 5, 95) : hslToHex(hue, 10, 12);
  const muted = bias.darkBg ? hslToHex(hue, 8, 60) : hslToHex(hue, 8, 45);
  const border = bias.darkBg ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';
  const overlay = bias.darkBg ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.4)';

  // solid border hex for contrast math
  const borderHex = bias.darkBg ? hslToHex(hue, 8, 22) : hslToHex(hue, 5, 88);

  const tokens: ColorToken[] = [
    { id: 'primary', name: 'Primary', role: 'primary', hex: primary, usage: 'Primary actions and key brand emphasis.', luminance: luminance(primary) },
    { id: 'secondary', name: 'Secondary', role: 'secondary', hex: secondary, usage: 'Secondary actions and supporting accents.', luminance: luminance(secondary) },
    { id: 'accent', name: 'Accent', role: 'accent', hex: accent, usage: 'Highlights, badges, and selective emphasis.', luminance: luminance(accent) },
    { id: 'background', name: 'Background', role: 'background', hex: bg, usage: 'Page and app background.', luminance: luminance(bg) },
    { id: 'surface', name: 'Surface', role: 'surface', hex: surface, usage: 'Cards, panels, and elevated regions.', luminance: luminance(surface) },
    { id: 'surfaceElevated', name: 'Surface Elevated', role: 'surfaceElevated', hex: surfaceElevated, usage: 'Modals, popovers, and top layers.', luminance: luminance(surfaceElevated) },
    { id: 'text', name: 'Text', role: 'text', hex: text, usage: 'Primary body and heading text.', luminance: luminance(text) },
    { id: 'muted', name: 'Muted', role: 'muted', hex: muted, usage: 'Secondary labels and captions.', luminance: luminance(muted) },
    { id: 'border', name: 'Border', role: 'border', hex: borderHex, usage: 'Dividers and subtle outlines.', luminance: luminance(borderHex) },
    { id: 'overlay', name: 'Overlay', role: 'overlay', hex: bias.darkBg ? '#000000' : '#000000', usage: 'Modal scrims and media overlays.' },
    { id: 'success', name: 'Success', role: 'success', hex: '#34D399', usage: 'Positive states and confirmations.' },
    { id: 'warning', name: 'Warning', role: 'warning', hex: '#FBBF24', usage: 'Caution and attention states.' },
    { id: 'error', name: 'Error', role: 'error', hex: '#F87171', usage: 'Errors and destructive actions.' },
    { id: 'primaryContrast', name: 'Primary Contrast', role: 'primaryContrast', hex: luminance(primary) > 0.4 ? '#0A0C10' : '#FFFFFF', usage: 'Text and icons on primary.' },
    { id: 'secondaryContrast', name: 'Secondary Contrast', role: 'secondaryContrast', hex: luminance(secondary) > 0.4 ? '#0A0C10' : '#FFFFFF', usage: 'Text and icons on secondary.' },
  ];

  // Apply more contrast by pushing text/bg further apart
  if (opts?.moreContrast) {
    const t = tokens.find((x) => x.role === 'text');
    const b = tokens.find((x) => x.role === 'background');
    if (t && b) {
      if (bias.darkBg) {
        t.hex = '#FFFFFF';
        b.hex = hslToHex(hue, 10, 4);
      } else {
        t.hex = '#0A0C10';
        b.hex = '#FFFFFF';
      }
    }
  }

  return {
    palette: tokens,
    approved: false,
    version: 1,
    notes: `Palette derived from ${brand.personality.join('/')} personality and ${brand.visualDirection} direction.`,
  };
}

const FONT_MAP: Record<string, { display: string; heading: string; body: string; ui: string; mono: string; q: string }> = {
  Luxury: {
    display: 'Playfair Display',
    heading: 'Playfair Display',
    body: 'Lora',
    ui: 'Inter',
    mono: 'JetBrains Mono',
    q: 'Playfair+Display:wght@500;600;700|Lora:wght@400;500|Inter:wght@400;500;600|JetBrains+Mono:wght@400',
  },
  Minimal: {
    display: 'Inter',
    heading: 'Inter',
    body: 'Inter',
    ui: 'Inter',
    mono: 'JetBrains Mono',
    q: 'Inter:wght@400;500;600;700|JetBrains+Mono:wght@400',
  },
  Futuristic: {
    display: 'Space Grotesk',
    heading: 'Space Grotesk',
    body: 'Inter',
    ui: 'Inter',
    mono: 'JetBrains Mono',
    q: 'Space+Grotesk:wght@500;600;700|Inter:wght@400;500;600|JetBrains+Mono:wght@400',
  },
  Technical: {
    display: 'IBM Plex Sans',
    heading: 'IBM Plex Sans',
    body: 'IBM Plex Sans',
    ui: 'IBM Plex Sans',
    mono: 'IBM Plex Mono',
    q: 'IBM+Plex+Sans:wght@400;500;600;700|IBM+Plex+Mono:wght@400',
  },
  Playful: {
    display: 'Outfit',
    heading: 'Outfit',
    body: 'Nunito',
    ui: 'Nunito',
    mono: 'JetBrains Mono',
    q: 'Outfit:wght@500;600;700|Nunito:wght@400;600|JetBrains+Mono:wght@400',
  },
  Editorial: {
    display: 'Libre Baskerville',
    heading: 'Libre Baskerville',
    body: 'Source Serif 4',
    ui: 'Inter',
    mono: 'JetBrains Mono',
    q: 'Libre+Baskerville:wght@400;700|Source+Serif+4:wght@400;600|Inter:wght@400;500;600|JetBrains+Mono:wght@400',
  },
  Corporate: {
    display: 'DM Sans',
    heading: 'DM Sans',
    body: 'DM Sans',
    ui: 'DM Sans',
    mono: 'IBM Plex Mono',
    q: 'DM+Sans:wght@400;500;600;700|IBM+Plex+Mono:wght@400',
  },
  Professional: {
    display: 'Inter',
    heading: 'Inter',
    body: 'Inter',
    ui: 'Inter',
    mono: 'JetBrains Mono',
    q: 'Inter:wght@400;500;600;700|JetBrains+Mono:wght@400',
  },
  Bold: {
    display: 'Space Grotesk',
    heading: 'Space Grotesk',
    body: 'Inter',
    ui: 'Inter',
    mono: 'JetBrains Mono',
    q: 'Space+Grotesk:wght@600;700|Inter:wght@400;500;600|JetBrains+Mono:wght@400',
  },
  Modern: {
    display: 'Outfit',
    heading: 'Outfit',
    body: 'Inter',
    ui: 'Inter',
    mono: 'JetBrains Mono',
    q: 'Outfit:wght@500;600;700|Inter:wght@400;500;600|JetBrains+Mono:wght@400',
  },
  Friendly: {
    display: 'Nunito',
    heading: 'Nunito',
    body: 'Nunito',
    ui: 'Nunito',
    mono: 'JetBrains Mono',
    q: 'Nunito:wght@400;600;700|JetBrains+Mono:wght@400',
  },
  Creative: {
    display: 'Outfit',
    heading: 'Outfit',
    body: 'Inter',
    ui: 'Inter',
    mono: 'JetBrains Mono',
    q: 'Outfit:wght@500;600;700|Inter:wght@400;500;600|JetBrains+Mono:wght@400',
  },
  Organic: {
    display: 'Lora',
    heading: 'Lora',
    body: 'Source Serif 4',
    ui: 'Inter',
    mono: 'JetBrains Mono',
    q: 'Lora:wght@500;600;700|Source+Serif+4:wght@400;600|Inter:wght@400;500|JetBrains+Mono:wght@400',
  },
  'Dark Tech': {
    display: 'Space Grotesk',
    heading: 'Space Grotesk',
    body: 'Inter',
    ui: 'Inter',
    mono: 'JetBrains Mono',
    q: 'Space+Grotesk:wght@500;600;700|Inter:wght@400;500;600|JetBrains+Mono:wght@400',
  },
};

function stack(name: string, fallback: string): string {
  return `"${name}", ${fallback}`;
}

export function buildTypography(brand: BrandProfile, stronger?: boolean): TypographySystem {
  const primary = brand.personality[0] || 'Professional';
  const visual = brand.visualDirection;
  const key =
    FONT_MAP[visual] ? visual : FONT_MAP[primary] ? primary : 'Professional';
  const fonts = FONT_MAP[key] || FONT_MAP.Professional;

  const scale: TypeScaleEntry[] = [
    { name: 'Display', size: stronger ? '3rem' : '2.5rem', weight: stronger ? 700 : 650, lineHeight: '1.1', letterSpacing: '-0.03em' },
    { name: 'Heading', size: stronger ? '1.75rem' : '1.5rem', weight: 600, lineHeight: '1.25', letterSpacing: '-0.02em' },
    { name: 'Title', size: '1.25rem', weight: 600, lineHeight: '1.35' },
    { name: 'Body', size: '1rem', weight: 400, lineHeight: '1.6' },
    { name: 'UI', size: '0.875rem', weight: 500, lineHeight: '1.4' },
    { name: 'Caption', size: '0.75rem', weight: 500, lineHeight: '1.4', letterSpacing: '0.02em' },
    { name: 'Code', size: '0.8125rem', weight: 400, lineHeight: '1.5' },
  ];

  return {
    displayFont: fonts.display,
    headingFont: fonts.heading,
    bodyFont: fonts.body,
    uiFont: fonts.ui,
    monoFont: fonts.mono,
    weights: [400, 500, 600, 700],
    scale,
    displayStack: stack(fonts.display, 'Georgia, serif'),
    headingStack: stack(fonts.heading, 'system-ui, sans-serif'),
    bodyStack: stack(fonts.body, 'system-ui, sans-serif'),
    uiStack: stack(fonts.ui, 'system-ui, sans-serif'),
    monoStack: stack(fonts.mono, 'ui-monospace, monospace'),
    approved: false,
    googleFontsQuery: fonts.q,
    notes: `Typography matched to ${primary} / ${visual}.`,
  };
}

export function buildVisualDirectionDetail(brand: BrandProfile): VisualDirectionDetail {
  const v = brand.visualDirection;
  const p = brand.personality[0] || 'Professional';

  const templates: Record<string, Partial<VisualDirectionDetail>> = {
    Minimal: {
      designLanguage: 'Restrained, high clarity, generous negative space.',
      shapeLanguage: 'Soft rectangles, thin lines, minimal ornament.',
      photographyDirection: 'Clean product shots, neutral backgrounds, soft daylight.',
      illustrationDirection: 'Line-based, sparse, single accent color.',
      iconStyle: 'Outlined, 1.5px stroke, rounded joins.',
      texture: 'None or subtle paper grain at very low opacity.',
      lighting: 'Even, diffuse, low drama.',
      composition: 'Asymmetric grids with strong alignment.',
      spacingPersonality: 'Generous — prefer more space over density.',
      uiStyle: 'Flat surfaces, soft borders, quiet motion.',
    },
    'Dark Tech': {
      designLanguage: 'Dark interfaces, precise geometry, tech-forward.',
      shapeLanguage: 'Sharp corners with selective radius, modular blocks.',
      photographyDirection: 'Low-key lighting, reflective surfaces, night scenes.',
      illustrationDirection: 'Isometric or schematic, cyan/violet accents.',
      iconStyle: 'Duotone or mono, geometric.',
      texture: 'Subtle noise, grid overlays.',
      lighting: 'Rim light, cool highlights.',
      composition: 'Dense but ordered — dashboard-like hierarchy.',
      spacingPersonality: 'Tight and systematic.',
      uiStyle: 'Glass sparingly, glow on interactive focus.',
    },
    Luxury: {
      designLanguage: 'Quiet confidence, craft, understatement.',
      shapeLanguage: 'Elegant curves, refined proportions.',
      photographyDirection: 'Editorial, shallow depth, rich materials.',
      illustrationDirection: 'Engraving-inspired or minimal line art.',
      iconStyle: 'Thin stroke, classical proportions.',
      texture: 'Soft grain, linen, subtle foil.',
      lighting: 'Warm, directional, cinematic.',
      composition: 'Centered or golden-ratio placements.',
      spacingPersonality: 'Breathing room — never crowded.',
      uiStyle: 'Muted surfaces, gold/cream accents, slow transitions.',
    },
    Futuristic: {
      designLanguage: 'Forward-looking, adaptive, intelligent.',
      shapeLanguage: 'Angular with soft edges, modular systems.',
      photographyDirection: 'Abstract tech, motion, light trails.',
      illustrationDirection: '3D-adjacent, gradient meshes.',
      iconStyle: 'Solid geometric with slight bevel suggestion.',
      texture: 'Gradient meshes, soft glow.',
      lighting: 'Cool, neon-adjacent, high contrast.',
      composition: 'Dynamic diagonals, layered depth.',
      spacingPersonality: 'Balanced density with clear hierarchy.',
      uiStyle: 'Gradient accents, responsive motion, system fonts optional.',
    },
    Playful: {
      designLanguage: 'Warm, energetic, approachable.',
      shapeLanguage: 'Rounded, blob-friendly, friendly geometry.',
      photographyDirection: 'Bright, candid, human moments.',
      illustrationDirection: 'Characterful, bold shapes, limited palette.',
      iconStyle: 'Filled, rounded, slightly oversized.',
      texture: 'Soft gradients, light patterns.',
      lighting: 'Bright and even.',
      composition: 'Asymmetric, lively, occasional overlap.',
      spacingPersonality: 'Comfortable — not sparse, not cramped.',
      uiStyle: 'Rounded buttons, soft shadows, bouncy micro-interactions.',
    },
    Corporate: {
      designLanguage: 'Clear, credible, structured.',
      shapeLanguage: 'Rectangles, consistent radius, grid-aligned.',
      photographyDirection: 'Professional environments, diverse teams.',
      illustrationDirection: 'Clean diagrams, flat illustration.',
      iconStyle: 'Consistent stroke, square grid.',
      texture: 'Minimal.',
      lighting: 'Natural office light.',
      composition: 'Strict grid, left-aligned hierarchy.',
      spacingPersonality: 'Predictable, modular.',
      uiStyle: 'Standard controls, high legibility, restrained color.',
    },
    Editorial: {
      designLanguage: 'Expressive typography, magazine-like rhythm.',
      shapeLanguage: 'Mixed — strong type blocks, occasional rule lines.',
      photographyDirection: 'Documentary, high contrast, crop-forward.',
      illustrationDirection: 'Collage, ink, or high-contrast figures.',
      iconStyle: 'Simple, typographic companions.',
      texture: 'Paper, ink bleed, halftone sparingly.',
      lighting: 'Dramatic, story-driven.',
      composition: 'Column grids, oversized headlines.',
      spacingPersonality: 'Editorial — tight leading, intentional breaks.',
      uiStyle: 'Type-led, minimal chrome.',
    },
    Organic: {
      designLanguage: 'Natural, soft, human.',
      shapeLanguage: 'Curves, imperfect circles, soft edges.',
      photographyDirection: 'Nature, materials, hands at work.',
      illustrationDirection: 'Hand-drawn feel, botanical accents.',
      iconStyle: 'Rounded, slightly irregular.',
      texture: 'Paper, fiber, soft grain.',
      lighting: 'Warm daylight.',
      composition: 'Flowing, less rigid grid.',
      spacingPersonality: 'Relaxed.',
      uiStyle: 'Soft surfaces, earth tones, calm motion.',
    },
  };

  const t = templates[v] || templates.Minimal;
  return {
    designLanguage: t.designLanguage || '',
    shapeLanguage: t.shapeLanguage || '',
    photographyDirection: t.photographyDirection || '',
    illustrationDirection: t.illustrationDirection || '',
    iconStyle: t.iconStyle || '',
    texture: t.texture || '',
    lighting: t.lighting || '',
    composition: t.composition || '',
    spacingPersonality: t.spacingPersonality || '',
    uiStyle: t.uiStyle || '',
    summary: `${brand.brandName} follows a ${v.toLowerCase()} visual language with a ${p.toLowerCase()} personality — coherent across product, marketing, and UI.`,
    approved: false,
  };
}

/** Procedural SVG monogram / wordmark — not AI image generation */
function monogramSvg(name: string, primaryHex: string, bgHex: string): string {
  const letter = (name.trim()[0] || 'B').toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <rect width="120" height="120" rx="28" fill="${bgHex}"/>
  <text x="60" y="72" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="56" fill="${primaryHex}">${letter}</text>
</svg>`;
}

function wordmarkSvg(name: string, primaryHex: string): string {
  const safe = name.replace(/[<>&]/g, '').slice(0, 24);
  const w = Math.max(160, safe.length * 14);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} 48" width="${w}" height="48">
  <text x="0" y="34" font-family="system-ui,sans-serif" font-weight="650" font-size="28" fill="${primaryHex}" letter-spacing="-0.5">${safe}</text>
</svg>`;
}

function markSvg(name: string, primaryHex: string, secondaryHex: string): string {
  const letter = (name.trim()[0] || 'B').toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80">
  <circle cx="40" cy="40" r="36" fill="none" stroke="${primaryHex}" stroke-width="3"/>
  <text x="40" y="48" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="32" fill="${secondaryHex}">${letter}</text>
</svg>`;
}

export function buildLogoSystem(brand: BrandProfile, colors?: ColorSystem): LogoSystem {
  const primary = colors?.palette.find((c) => c.role === 'primary')?.hex || '#62E6FF';
  const secondary = colors?.palette.find((c) => c.role === 'secondary')?.hex || '#8B5CF6';
  const bg = colors?.palette.find((c) => c.role === 'surface')?.hex || '#111318';
  const name = brand.brandName || 'Brand';

  const concepts: LogoConcept[] = [
    {
      id: uid('logo'),
      label: 'Concept 01 — Monogram',
      role: 'monogram',
      status: 'ready',
      svgMarkup: monogramSvg(name, primary, bg),
      rationale: `Monogram built from the first letter of ${name}, using the brand primary on surface.`,
      createdAt: now(),
      isSelected: true,
    },
    {
      id: uid('logo'),
      label: 'Concept 02 — Wordmark',
      role: 'wordmark',
      status: 'ready',
      svgMarkup: wordmarkSvg(name, primary),
      rationale: `Clean wordmark emphasizing the full name with primary color.`,
      createdAt: now(),
    },
    {
      id: uid('logo'),
      label: 'Concept 03 — Mark',
      role: 'mark',
      status: 'ready',
      svgMarkup: markSvg(name, primary, secondary),
      rationale: `Circular mark for app icons and tight spaces.`,
      createdAt: now(),
    },
    {
      id: uid('logo'),
      label: 'Concept 04 — Primary lockup',
      role: 'primary',
      status: 'ready',
      svgMarkup: `${monogramSvg(name, primary, bg).replace('</svg>', '')}<g transform="translate(130,36)">${wordmarkSvg(name, primary).replace(/<svg[^>]*>/, '').replace('</svg>', '')}</g></svg>`.replace(
        'viewBox="0 0 120 120"',
        'viewBox="0 0 320 120"'
      ),
      rationale: `Primary lockup combining monogram and wordmark for headers and decks.`,
      createdAt: now(),
    },
  ];

  return {
    concepts,
    selectedConceptId: concepts[0].id,
    activeRole: 'primary',
    lastGeneratedAt: now(),
    generationNote:
      'Procedural logo concepts from brand name and palette. Image generation is not configured — concepts use structured SVG, not fake AI images.',
  };
}

export function buildFullIdentity(brand: BrandProfile): VisualIdentity {
  const colors = buildColorSystem(brand);
  const typography = buildTypography(brand);
  const visualDirectionDetail = buildVisualDirectionDetail(brand);
  const logo = buildLogoSystem(brand, colors);
  return {
    logo,
    colors,
    typography,
    visualDirectionDetail,
    generatedAt: now(),
  };
}

export function ensureIdentity(brand: BrandProfile): BrandProfile {
  if (brand.visualIdentity?.colors?.palette?.length) {
    return brand;
  }
  return {
    ...brand,
    visualIdentity: buildFullIdentity(brand),
    status: brand.status === 'strategy_ready' || brand.status === 'voice_ready' ? 'identity_ready' : brand.status,
    updatedAt: now(),
  };
}
