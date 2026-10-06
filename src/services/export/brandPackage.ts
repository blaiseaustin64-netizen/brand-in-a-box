/**
 * Brand Package builder + validation.
 * Source of truth: BrandProfile + assets list.
 */

import type {
  BrandProfile,
  BrandAsset,
  BrandPackage,
  PackageValidationResult,
  PackageValidationIssue,
  AssetRoleMap,
  BrandGuidelinesFoundation,
} from '../../types/brand';
import { buildDesignTokens } from './designTokens';

const PACKAGE_SCHEMA = '1.0';

function packageVersionFromState(brand: BrandProfile, assets: BrandAsset[]): string {
  // Deterministic-ish version from content fingerprint
  const approved = Object.keys(brand.approvedSections || {}).length;
  const assetApproved = assets.filter((a) => a.approved).length;
  const vi = brand.visualIdentity ? 1 : 0;
  const rev =
    1 +
    approved +
    assetApproved +
    vi +
    (brand.visualIdentity?.colors?.version || 0);
  return `1.${rev}`;
}

export function buildAssetRoles(
  brand: BrandProfile,
  assets: BrandAsset[]
): AssetRoleMap {
  const roles: AssetRoleMap = {};
  const logo = brand.visualIdentity?.logo;
  if (logo) {
    const approved =
      logo.concepts.find((c) => c.id === logo.approvedConceptId) ||
      logo.concepts.find((c) => c.id === logo.selectedConceptId);
    const byRole = (role: string) =>
      logo.concepts.find((c) => c.role === role) || approved;
    if (byRole('primary')) roles['logo.primary'] = byRole('primary')!.id;
    if (byRole('secondary')) roles['logo.secondary'] = byRole('secondary')!.id;
    if (byRole('mark')) roles['logo.icon'] = byRole('mark')!.id;
    if (byRole('monogram')) roles['logo.monogram'] = byRole('monogram')!.id;
    if (byRole('wordmark')) roles['logo.wordmark'] = byRole('wordmark')!.id;
    if (byRole('favicon')) roles['logo.favicon'] = byRole('favicon')!.id;
  }
  for (const a of assets.filter((x) => x.approved)) {
    const key = `assets.${a.category}.${a.type}` as `assets.${string}`;
    roles[key] = a.id;
  }
  return roles;
}

export function buildGuidelinesFoundation(
  brand: BrandProfile
): BrandGuidelinesFoundation {
  const vd = brand.visualIdentity?.visualDirectionDetail;
  return {
    logoUsage:
      'Use the approved primary logo on light and dark backgrounds. Prefer the monogram or mark in tight spaces. Maintain clear space equal to the cap height of the wordmark.',
    colorUsage: `Primary (${brand.visualIdentity?.colors?.palette.find((c) => c.role === 'primary')?.hex || '—'}) is reserved for key actions and emphasis. Do not introduce unapproved hues.`,
    typographyUsage: brand.visualIdentity?.typography
      ? `Display: ${brand.visualIdentity.typography.displayFont}. Body: ${brand.visualIdentity.typography.bodyFont}. Keep hierarchy consistent with the type scale.`
      : 'Typography system not generated yet.',
    spacingUsage:
      'Use the spacing scale (xs–section). Prefer consistent vertical rhythm; avoid arbitrary gaps.',
    visualDirection:
      vd?.summary ||
      `${brand.visualDirection} visual language for ${brand.brandName}.`,
    voiceUsage: brand.voice
      ? `Tone: ${brand.voice.tone}. ${brand.voice.writingStyle}`
      : 'Voice not defined.',
    imageryDirection:
      vd?.photographyDirection ||
      'Prefer imagery aligned with visual direction and brand personality.',
    assetUsage:
      'Prefer approved assets from the Asset Studio. Do not alter brand colors in marketing graphics without approval.',
  };
}

export function validateBrandPackage(
  brand: BrandProfile | null,
  assets: BrandAsset[]
): PackageValidationResult {
  const issues: PackageValidationIssue[] = [];
  if (!brand) {
    issues.push({
      level: 'error',
      code: 'NO_BRAND',
      message: 'No brand profile exists. Create a brand first.',
    });
    return { valid: false, canExport: false, issues };
  }
  if (!brand.brandName?.trim()) {
    issues.push({
      level: 'error',
      code: 'NO_NAME',
      message: 'Brand name is missing.',
    });
  }
  if (!brand.visualIdentity?.colors?.palette?.length) {
    issues.push({
      level: 'error',
      code: 'NO_IDENTITY',
      message: 'Visual identity (colors) is required for a complete package.',
    });
  }
  if (!brand.visualIdentity?.typography) {
    issues.push({
      level: 'warning',
      code: 'NO_TYPE',
      message: 'Typography is not generated; tokens will use system fallbacks.',
    });
  }
  if (!brand.visualIdentity?.logo?.concepts?.length) {
    issues.push({
      level: 'warning',
      code: 'NO_LOGO',
      message: 'No logo concepts found.',
    });
  }
  for (const a of assets) {
    const ver =
      a.versions.find((v) => v.id === a.currentVersionId) || a.versions.at(-1);
    if (!ver?.svgMarkup && !ver?.imageUrl) {
      issues.push({
        level: 'warning',
        code: 'BROKEN_ASSET',
        message: `Asset "${a.name}" has no downloadable content.`,
      });
    }
  }
  if (assets.filter((a) => a.approved).length === 0) {
    issues.push({
      level: 'warning',
      code: 'NO_APPROVED_ASSETS',
      message: 'No approved assets yet. Package will still export identity data.',
    });
  }

  const hasErrors = issues.some((i) => i.level === 'error');
  return {
    valid: !hasErrors,
    canExport: !hasErrors,
    issues,
  };
}

export function buildBrandPackage(
  brand: BrandProfile,
  assets: BrandAsset[]
): BrandPackage {
  const designTokens = buildDesignTokens(brand);
  const version = packageVersionFromState(brand, assets);
  const approvedAssets = assets.filter((a) => a.status !== 'archived');

  return {
    version,
    metadata: {
      packageVersion: version,
      brandId: brand.id,
      brandName: brand.brandName,
      exportedAt: new Date().toISOString(),
      source: 'brand-in-a-box',
      schemaVersion: PACKAGE_SCHEMA,
      hasVisualIdentity: Boolean(brand.visualIdentity?.colors?.palette?.length),
      approvedAssetCount: assets.filter((a) => a.approved).length,
      totalAssetCount: approvedAssets.length,
    },
    brand: {
      id: brand.id,
      brandName: brand.brandName,
      industry: brand.industry,
      description: brand.description,
      targetAudience: brand.targetAudience,
      personality: brand.personality,
      visualDirection: brand.visualDirection,
      keywords: brand.keywords,
      tagline: brand.tagline,
      summary: brand.summary,
      status: brand.status,
    },
    strategy: brand.strategy,
    voice: brand.voice,
    visualIdentity: brand.visualIdentity,
    designTokens,
    assets: approvedAssets,
    assetRoles: buildAssetRoles(brand, assets),
    guidelines: buildGuidelinesFoundation(brand),
    approvedSections: brand.approvedSections,
  };
}

export function downloadJson(filename: string, data: unknown): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadText(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
