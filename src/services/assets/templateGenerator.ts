/**
 * Procedural branded SVG templates.
 * Uses AssetGenerationContext colors/type/voice — not random art.
 * Honest alternative when image generation is unavailable.
 */

import type {
  AssetGenerationContext,
  AssetPreset,
  AssetVersion,
  BrandAsset,
} from '../../types/brand';

function uid(p = 'asset'): string {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fitText(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1) + '…';
}

type LayoutVariant = 'centered' | 'left' | 'split' | 'minimal' | 'bold';

function pickLayout(instruction?: string, refine?: string): LayoutVariant {
  const s = `${instruction || ''} ${refine || ''}`.toLowerCase();
  if (s.includes('minimal')) return 'minimal';
  if (s.includes('bold')) return 'bold';
  if (s.includes('split') || s.includes('layout')) return 'split';
  if (s.includes('left')) return 'left';
  return 'centered';
}

function darken(hex: string, amount = 0.15): string {
  const h = hex.replace('#', '');
  if (h.length < 6) return hex;
  const n = parseInt(h, 16);
  const r = Math.max(0, ((n >> 16) & 255) * (1 - amount));
  const g = Math.max(0, ((n >> 8) & 255) * (1 - amount));
  const b = Math.max(0, (n & 255) * (1 - amount));
  return `#${[r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('')}`;
}

export function generateTemplateSvg(
  ctx: AssetGenerationContext,
  preset: AssetPreset,
  opts?: { instruction?: string; refine?: string; variation?: number }
): string {
  const { width: w, height: h } = preset;
  const c = ctx.colors;
  const layout = pickLayout(opts?.instruction, opts?.refine);
  const variation = opts?.variation || 0;
  const name = esc(fitText(ctx.brandName, 28));
  const tagline = esc(fitText(ctx.tagline || ctx.positioning, 60));
  const letter = esc((ctx.brandName[0] || 'B').toUpperCase());

  const moreMinimal = (opts?.refine || opts?.instruction || '').toLowerCase().includes('minimal');
  const morePremium = (opts?.refine || opts?.instruction || '').toLowerCase().includes('premium');
  const moreBold = (opts?.refine || opts?.instruction || '').toLowerCase().includes('bold');
  const moreFuturistic = (opts?.refine || opts?.instruction || '').includes('futur');

  const bg = moreMinimal ? c.background : variation % 2 === 0 ? c.background : c.surface;
  const accent = morePremium ? c.accent : moreFuturistic ? c.primary : moreBold ? c.secondary : c.primary;
  const text = c.text;
  const muted = c.muted;

  // Pattern / texture / abstract
  if (preset.type === 'pattern') {
    const s = 40;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="${bg}"/>
  <defs><pattern id="p" width="${s}" height="${s}" patternUnits="userSpaceOnUse">
    <circle cx="${s / 2}" cy="${s / 2}" r="3" fill="${accent}" opacity="0.35"/>
    <rect x="0" y="0" width="${s}" height="1" fill="${accent}" opacity="0.12"/>
  </pattern></defs>
  <rect width="${w}" height="${h}" fill="url(#p)"/>
</svg>`;
  }

  if (preset.type === 'texture' || preset.type === 'abstract_background' || preset.type === 'section_background') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="50%" stop-color="${darken(c.surface, -0.05)}"/>
      <stop offset="100%" stop-color="${bg}"/>
    </linearGradient>
    <radialGradient id="r" cx="70%" cy="30%" r="50%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect width="${w}" height="${h}" fill="url(#r)"/>
  <circle cx="${w * 0.15}" cy="${h * 0.8}" r="${Math.min(w, h) * 0.2}" fill="${c.secondary}" opacity="0.08"/>
</svg>`;
  }

  if (preset.type === 'decorative_shape') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="${bg}"/>
  <circle cx="${w / 2}" cy="${h / 2}" r="${w * 0.32}" fill="none" stroke="${accent}" stroke-width="8"/>
  <circle cx="${w / 2}" cy="${h / 2}" r="${w * 0.18}" fill="${accent}" opacity="0.2"/>
  <text x="${w / 2}" y="${h / 2 + 16}" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="48" fill="${text}">${letter}</text>
</svg>`;
  }

  if (preset.type === 'icon_set') {
    const icons = [
      { x: 40, y: 40, d: 'M40 20 L60 50 L20 50 Z' },
      { x: 280, y: 40, d: 'M20 20 H60 V60 H20 Z' },
      { x: 40, y: 280, d: 'M40 20 A20 20 0 1 1 39.9 20' },
      { x: 280, y: 280, d: 'M20 40 H60 M40 20 V60' },
    ];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="${bg}"/>
  ${icons
    .map(
      (ic, i) => `<g transform="translate(${ic.x},${ic.y})">
    <rect width="192" height="192" rx="24" fill="${c.surface}" stroke="${accent}" stroke-width="2" opacity="0.9"/>
    <path d="${ic.d}" transform="translate(56,56)" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
    <text x="96" y="170" text-anchor="middle" font-size="12" fill="${muted}" font-family="system-ui">Icon ${i + 1}</text>
  </g>`
    )
    .join('')}
</svg>`;
  }

  if (preset.type === 'favicon') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="96" fill="${c.surface}"/>
  <rect x="24" y="24" width="464" height="464" rx="80" fill="none" stroke="${accent}" stroke-width="8" opacity="0.4"/>
  <text x="256" y="300" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="220" fill="${accent}">${letter}</text>
</svg>`;
  }

  if (preset.type === 'business_card') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" rx="12" fill="${c.surface}"/>
  <rect x="0" y="0" width="12" height="${h}" fill="${accent}"/>
  <text x="48" y="${h * 0.38}" font-family="system-ui,sans-serif" font-weight="700" font-size="42" fill="${text}">${name}</text>
  <text x="48" y="${h * 0.5}" font-family="system-ui,sans-serif" font-size="22" fill="${muted}">${tagline}</text>
  <text x="48" y="${h * 0.78}" font-family="system-ui,sans-serif" font-size="18" fill="${muted}">${esc(fitText(ctx.industry || 'Brand', 40))}</text>
  <circle cx="${w - 80}" cy="${h / 2}" r="36" fill="${accent}" opacity="0.9"/>
  <text x="${w - 80}" y="${h / 2 + 12}" text-anchor="middle" font-family="system-ui" font-weight="700" font-size="28" fill="${c.background}">${letter}</text>
</svg>`;
  }

  if (preset.type === 'letterhead' || preset.type === 'proposal_cover') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="${c.background === '#08090B' ? '#FFFFFF' : c.background}"/>
  <rect x="0" y="0" width="${w}" height="8" fill="${accent}"/>
  <text x="48" y="64" font-family="system-ui,sans-serif" font-weight="700" font-size="28" fill="${c.text === '#F2F4F7' ? '#111318' : c.text}">${name}</text>
  <text x="48" y="92" font-family="system-ui,sans-serif" font-size="14" fill="${muted}">${tagline}</text>
  <line x1="48" y1="120" x2="${w - 48}" y2="120" stroke="${accent}" stroke-opacity="0.3" stroke-width="1"/>
  ${
    preset.type === 'proposal_cover'
      ? `<text x="48" y="${h / 2}" font-family="system-ui,sans-serif" font-weight="600" font-size="36" fill="${c.text === '#F2F4F7' ? '#111318' : c.text}">Proposal</text>
  <text x="48" y="${h / 2 + 40}" font-family="system-ui,sans-serif" font-size="18" fill="${muted}">${esc(fitText(ctx.positioning, 50))}</text>`
      : `<text x="48" y="180" font-family="system-ui,sans-serif" font-size="14" fill="${muted}">Document body starts here…</text>`
  }
  <text x="48" y="${h - 40}" font-family="system-ui,sans-serif" font-size="12" fill="${muted}">${name}</text>
</svg>`;
  }

  // Generic social / marketing / hero layout
  const isTall = h > w * 1.2;
  const isWide = w > h * 1.5;
  const titleSize = isTall ? 56 : isWide ? 42 : 48;
  const pad = Math.round(Math.min(w, h) * 0.08);

  let content = '';
  if (layout === 'minimal') {
    content = `
  <text x="${w / 2}" y="${h / 2 - 10}" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="600" font-size="${titleSize * 0.7}" fill="${text}">${name}</text>
  <text x="${w / 2}" y="${h / 2 + 30}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" fill="${muted}">${tagline}</text>`;
  } else if (layout === 'left' || layout === 'split') {
    content = `
  <rect x="0" y="0" width="${layout === 'split' ? w * 0.42 : 8}" height="${h}" fill="${accent}" opacity="${layout === 'split' ? 0.15 : 1}"/>
  <text x="${pad + (layout === 'split' ? w * 0.42 : 0)}" y="${h * 0.42}" font-family="system-ui,sans-serif" font-weight="700" font-size="${titleSize}" fill="${text}">${name}</text>
  <text x="${pad + (layout === 'split' ? w * 0.42 : 0)}" y="${h * 0.42 + 40}" font-family="system-ui,sans-serif" font-size="20" fill="${muted}">${tagline}</text>`;
  } else if (layout === 'bold') {
    content = `
  <rect x="${pad}" y="${h * 0.35}" width="${w - pad * 2}" height="${h * 0.3}" rx="16" fill="${accent}" opacity="0.15"/>
  <text x="${w / 2}" y="${h * 0.48}" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="${titleSize}" fill="${text}">${name}</text>
  <text x="${w / 2}" y="${h * 0.48 + 44}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="22" fill="${accent}">${tagline}</text>`;
  } else {
    content = `
  <circle cx="${w - pad * 1.5}" cy="${pad * 1.5}" r="${pad * 0.9}" fill="${accent}" opacity="0.2"/>
  <text x="${w / 2}" y="${h * 0.45}" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="${titleSize}" fill="${text}">${name}</text>
  <text x="${w / 2}" y="${h * 0.45 + 40}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="20" fill="${muted}">${tagline}</text>
  <rect x="${w / 2 - 40}" y="${h * 0.45 + 60}" width="80" height="3" fill="${accent}"/>`;
  }

  const instructionLine = opts?.instruction
    ? `<text x="${pad}" y="${h - pad * 0.6}" font-family="system-ui,sans-serif" font-size="14" fill="${muted}" opacity="0.7">${esc(fitText(opts.instruction, 50))}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="${bg}"/>
  <rect x="0" y="0" width="${w}" height="4" fill="${accent}" opacity="0.8"/>
  ${content}
  ${instructionLine}
  <text x="${w - pad}" y="${h - pad * 0.5}" text-anchor="end" font-family="system-ui,sans-serif" font-size="12" fill="${muted}" opacity="0.5">${esc(preset.name)}</text>
</svg>`;
}

export function createAssetFromTemplate(
  ctx: AssetGenerationContext,
  preset: AssetPreset,
  opts?: { instruction?: string; refine?: string; existing?: BrandAsset }
): BrandAsset {
  const now = new Date().toISOString();
  const svg = generateTemplateSvg(ctx, preset, {
    instruction: opts?.instruction,
    refine: opts?.refine,
    variation: opts?.existing ? opts.existing.versions.length : 0,
  });
  const versionId = uid('ver');
  const version: AssetVersion = {
    id: versionId,
    version: opts?.existing ? opts.existing.versions.length + 1 : 1,
    createdAt: now,
    prompt: opts?.instruction,
    instruction: opts?.refine || opts?.instruction,
    svgMarkup: svg,
    format: 'svg',
    width: preset.width,
    height: preset.height,
    status: 'generated',
    notes: 'Branded template from Brand Profile + Visual Identity. Raster image generation is not configured.',
  };

  if (opts?.existing) {
    return {
      ...opts.existing,
      currentVersionId: versionId,
      versions: [...opts.existing.versions, version],
      status: 'generated',
      updatedAt: now,
      thumbnailSvg: svg,
      format: 'svg',
    };
  }

  return {
    id: uid('ba'),
    brandId: ctx.brandId,
    name: `${preset.name} — ${ctx.brandName}`,
    type: preset.type,
    category: preset.category,
    presetId: preset.id,
    prompt: opts?.instruction || `${preset.name} for ${ctx.brandName}`,
    generationContextSummary: `${ctx.brandName} · ${ctx.visualDirection} · ${ctx.colors.primary}`,
    width: preset.width,
    height: preset.height,
    format: 'svg',
    source: 'template',
    status: 'generated',
    approved: false,
    currentVersionId: versionId,
    versions: [version],
    createdAt: now,
    updatedAt: now,
    thumbnailSvg: svg,
  };
}
