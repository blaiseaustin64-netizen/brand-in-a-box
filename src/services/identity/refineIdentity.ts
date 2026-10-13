/**
 * Visual identity refinement — deterministic, brand-grounded updates.
 * Used by the procedural identity engine for Director quick actions.
 * Never claims OpenRouter/Workers AI authorship.
 */

import type {
  BrandProfile,
  BrandPersonality,
  VisualDirection,
  BrandDirectorAction,
} from '../../types/brand';
import {
  buildColorSystem,
  buildTypography,
  buildLogoSystem,
  buildVisualDirectionDetail,
  ensureIdentity,
} from './generateIdentity';

const PERSONALITY_FOR_ACTION: Partial<
  Record<BrandDirectorAction, BrandPersonality[]>
> = {
  make_premium: ['Luxury', 'Minimal'],
  make_futuristic: ['Futuristic', 'Technical'],
  make_playful: ['Playful', 'Friendly'],
  make_professional: ['Professional'],
  make_minimal: ['Minimal', 'Professional'],
};

const DIRECTION_FOR_ACTION: Partial<
  Record<BrandDirectorAction, VisualDirection>
> = {
  make_premium: 'Luxury',
  make_futuristic: 'Futuristic',
  make_playful: 'Playful',
  make_professional: 'Corporate',
  make_minimal: 'Minimal',
};

function now(): string {
  return new Date().toISOString();
}

/**
 * Apply a Director identity action to the brand profile.
 * Preserves approved identity parts when possible.
 * Returns a new profile object (does not mutate input).
 */
export function refineVisualIdentity(
  brand: BrandProfile,
  action: BrandDirectorAction | string
): { profile: BrandProfile; summary: string } {
  let base = ensureIdentity(structuredClone(brand));
  const vi = base.visualIdentity!;
  const colorsApproved = Boolean(
    base.approvedSections?.colors || vi.colors?.approved
  );
  const typeApproved = Boolean(
    base.approvedSections?.typography || vi.typography?.approved
  );
  const logoApproved = Boolean(vi.logo?.approvedConceptId);
  const directionApproved = Boolean(
    base.approvedSections?.visualDirectionDetail || vi.visualDirectionDetail?.approved
  );

  let summary = '';

  switch (action) {
    case 'generate_identity': {
      // Full rebuild from current brand strategy inputs
      const colors = buildColorSystem(base);
      const typography = buildTypography(base);
      const visualDirectionDetail = buildVisualDirectionDetail(base);
      const logo = buildLogoSystem(base, colors);
      if (logoApproved && vi.logo?.approvedConceptId) {
        const approved = vi.logo.concepts.find(
          (c) => c.id === vi.logo!.approvedConceptId
        );
        if (approved) {
          logo.concepts = [
            approved,
            ...logo.concepts.filter((c) => c.id !== approved.id),
          ];
          logo.approvedConceptId = approved.id;
          logo.selectedConceptId = approved.id;
        }
      }
      base = {
        ...base,
        visualIdentity: {
          logo: logoApproved ? logo : logo,
          colors: colorsApproved ? vi.colors : colors,
          typography: typeApproved ? vi.typography : typography,
          visualDirectionDetail: directionApproved
            ? vi.visualDirectionDetail
            : visualDirectionDetail,
          generatedAt: now(),
        },
        status: 'identity_ready',
        updatedAt: now(),
      };
      summary =
        'Generated a coherent visual identity from brand name, industry, personality, and visual direction (procedural engine).';
      break;
    }

    case 'make_premium':
    case 'make_futuristic':
    case 'make_playful':
    case 'make_professional':
    case 'make_minimal': {
      const personalities = PERSONALITY_FOR_ACTION[action as BrandDirectorAction];
      const direction = DIRECTION_FOR_ACTION[action as BrandDirectorAction];
      if (personalities) base.personality = personalities;
      if (direction) base.visualDirection = direction;

      const colorOpts =
        action === 'make_premium' || action === 'make_minimal'
          ? { premium: true, lessSat: action === 'make_minimal' }
          : action === 'make_playful'
            ? { energetic: true }
            : action === 'make_futuristic'
              ? { darker: true }
              : {};

      const colors = colorsApproved
        ? vi.colors
        : buildColorSystem(base, colorOpts);
      if (!colorsApproved) {
        colors.version = (vi.colors?.version || 0) + 1;
      }
      const typography = typeApproved
        ? vi.typography
        : buildTypography(base, action === 'make_premium');
      const visualDirectionDetail = directionApproved
        ? vi.visualDirectionDetail
        : buildVisualDirectionDetail(base);
      let logo = buildLogoSystem(base, colors);
      if (logoApproved && vi.logo?.approvedConceptId) {
        const approved = vi.logo.concepts.find(
          (c) => c.id === vi.logo!.approvedConceptId
        );
        if (approved) {
          logo.concepts = [
            approved,
            ...logo.concepts.filter((c) => c.id !== approved.id),
          ];
          logo.approvedConceptId = approved.id;
          logo.selectedConceptId = approved.id;
        }
      } else if (!colorsApproved) {
        // new palette → refresh logo fills
        logo = buildLogoSystem(base, colors);
      }

      base = {
        ...base,
        visualIdentity: {
          logo,
          colors,
          typography,
          visualDirectionDetail,
          generatedAt: now(),
        },
        status: 'identity_ready',
        updatedAt: now(),
      };
      summary = `Refined identity toward ${String(action).replace('make_', '')}: updated ${[
        !colorsApproved && 'colors',
        !typeApproved && 'typography',
        !directionApproved && 'direction',
        !logoApproved && 'logo concepts',
      ]
        .filter(Boolean)
        .join(', ') || 'personality/direction tags'}.`;
      break;
    }

    case 'increase_contrast':
    case 'make_darker':
    case 'make_lighter':
    case 'reduce_saturation': {
      if (colorsApproved) {
        summary = 'Colors are approved and were preserved.';
        break;
      }
      const colors = buildColorSystem(base, {
        moreContrast: action === 'increase_contrast',
        darker: action === 'make_darker',
        lighter: action === 'make_lighter',
        lessSat: action === 'reduce_saturation',
      });
      colors.version = (vi.colors?.version || 0) + 1;
      let logo = buildLogoSystem(base, colors);
      if (logoApproved && vi.logo?.approvedConceptId) {
        logo.approvedConceptId = vi.logo.approvedConceptId;
        logo.selectedConceptId = vi.logo.selectedConceptId;
      }
      base = {
        ...base,
        visualIdentity: { ...vi, colors, logo },
        updatedAt: now(),
      };
      summary = `Adjusted palette (${action.replace(/_/g, ' ')}). Logos refreshed to match.`;
      break;
    }

    case 'make_typography_stronger': {
      if (typeApproved) {
        summary = 'Typography is approved and was preserved.';
        break;
      }
      const typography = buildTypography(base, true);
      base = {
        ...base,
        visualIdentity: { ...vi, typography },
        updatedAt: now(),
      };
      summary = 'Strengthened type hierarchy (weights and display size).';
      break;
    }

    case 'generate_logo_concepts': {
      const colors = vi.colors;
      let logo = buildLogoSystem(base, colors);
      if (logoApproved && vi.logo?.approvedConceptId) {
        const approved = vi.logo.concepts.find(
          (c) => c.id === vi.logo!.approvedConceptId
        );
        if (approved) {
          logo.concepts = [
            approved,
            ...logo.concepts.filter((c) => c.id !== approved.id),
          ];
          logo.approvedConceptId = approved.id;
          logo.selectedConceptId = approved.id;
        }
      }
      base = {
        ...base,
        visualIdentity: { ...vi, logo },
        updatedAt: now(),
      };
      summary =
        'Generated new procedural SVG logo concepts from brand name and palette (not AI raster art).';
      break;
    }

    case 'generate_colors': {
      if (colorsApproved) {
        summary = 'Colors are approved and were preserved.';
        break;
      }
      const colors = buildColorSystem(base);
      colors.version = (vi.colors?.version || 0) + 1;
      const logo = logoApproved
        ? vi.logo
        : buildLogoSystem(base, colors);
      base = {
        ...base,
        visualIdentity: { ...vi, colors, logo: logo! },
        updatedAt: now(),
      };
      summary = 'Rebuilt color system from personality and visual direction.';
      break;
    }

    case 'generate_typography': {
      if (typeApproved) {
        summary = 'Typography is approved and was preserved.';
        break;
      }
      const typography = buildTypography(base);
      base = {
        ...base,
        visualIdentity: { ...vi, typography },
        updatedAt: now(),
      };
      summary = 'Selected type pairing from personality/visual direction map.';
      break;
    }

    case 'generate_visual_direction': {
      if (directionApproved) {
        summary = 'Visual direction is approved and was preserved.';
        break;
      }
      const visualDirectionDetail = buildVisualDirectionDetail(base);
      base = {
        ...base,
        visualIdentity: { ...vi, visualDirectionDetail },
        updatedAt: now(),
      };
      summary = 'Refreshed visual direction detail from brand inputs.';
      break;
    }

    default:
      summary = `No identity refinement mapped for action "${action}".`;
  }

  return { profile: base, summary };
}

/** Local explanation of current identity (no network). */
export function explainVisualIdentity(brand: BrandProfile): string {
  const vi = brand.visualIdentity;
  const primary =
    vi?.colors?.palette?.find((c) => c.role === 'primary')?.hex || '—';
  const fonts = vi?.typography
    ? `${vi.typography.displayFont} / ${vi.typography.bodyFont}`
    : '—';
  const dir =
    vi?.visualDirectionDetail?.summary ||
    brand.visualDirection ||
    'undefined direction';
  return [
    `${brand.brandName} uses a ${brand.personality.join('/')} personality with a ${dir} visual language.`,
    `Primary color ${primary} and type pairing ${fonts} were derived from those inputs via the procedural identity engine.`,
    vi?.visualDirectionDetail?.summary ||
      'Generate or refine identity to expand this rationale.',
    'Logo concepts are structured SVG (monogram/wordmark/mark/lockup), not model-generated raster artwork.',
  ].join(' ');
}
