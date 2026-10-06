/**
 * Brand consistency engine — builds AssetGenerationContext
 * from Brand Profile + Visual Identity + approved assets.
 * Reusable for future Forge / NYVEN without coupling.
 */

import type {
  BrandProfile,
  BrandAsset,
  AssetGenerationContext,
} from '../../types/brand';

function color(brand: BrandProfile, role: string, fallback: string): string {
  return (
    brand.visualIdentity?.colors?.palette.find((c) => c.role === role)?.hex ||
    fallback
  );
}

export function buildAssetGenerationContext(
  brand: BrandProfile,
  assets: BrandAsset[] = []
): AssetGenerationContext {
  const approved = assets.filter((a) => a.approved);
  const logoConcept =
    brand.visualIdentity?.logo?.concepts.find(
      (c) =>
        c.id === brand.visualIdentity?.logo?.approvedConceptId ||
        c.id === brand.visualIdentity?.logo?.selectedConceptId
    ) || brand.visualIdentity?.logo?.concepts[0];

  return {
    brandId: brand.id,
    brandName: brand.brandName,
    tagline: brand.tagline,
    industry: brand.industry,
    description: brand.description,
    targetAudience: brand.targetAudience,
    personality: brand.personality,
    visualDirection: brand.visualDirection,
    keywords: brand.keywords,
    positioning: brand.strategy?.positioning || '',
    tone: brand.voice?.tone || '',
    colors: {
      primary: color(brand, 'primary', '#62E6FF'),
      secondary: color(brand, 'secondary', '#8B5CF6'),
      accent: color(brand, 'accent', '#F5C542'),
      background: color(brand, 'background', '#08090B'),
      surface: color(brand, 'surface', '#111318'),
      text: color(brand, 'text', '#F2F4F7'),
      muted: color(brand, 'muted', '#9AA5B1'),
    },
    typography: {
      display: brand.visualIdentity?.typography?.displayFont || 'Inter',
      heading: brand.visualIdentity?.typography?.headingFont || 'Inter',
      body: brand.visualIdentity?.typography?.bodyFont || 'Inter',
    },
    visualDirectionSummary:
      brand.visualIdentity?.visualDirectionDetail?.summary ||
      `${brand.visualDirection} visual language`,
    logoSvg: logoConcept?.svgMarkup,
    approvedAssetHints: approved.slice(0, 5).map((a) => `${a.category}/${a.type}: ${a.name}`),
  };
}

/** Human-readable one-liner for library metadata */
export function summarizeContext(ctx: AssetGenerationContext): string {
  return `${ctx.brandName} · ${ctx.personality.join('/')} · ${ctx.visualDirection} · ${ctx.colors.primary}`;
}
