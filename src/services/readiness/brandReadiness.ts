/**
 * Brand completion / readiness score — derived from real state only.
 */

import type { BrandProfile, BrandAsset } from '../../types/brand';

export interface ReadinessItem {
  id: string;
  label: string;
  complete: boolean;
  weight: number;
  detail: string;
}

export interface BrandReadiness {
  score: number;
  items: ReadinessItem[];
  missing: string[];
  complete: string[];
}

export function computeBrandReadiness(
  brand: BrandProfile | null,
  assets: BrandAsset[] = []
): BrandReadiness {
  if (!brand) {
    return {
      score: 0,
      items: [],
      missing: ['Create a brand to begin.'],
      complete: [],
    };
  }

  const vi = brand.visualIdentity;
  const hasColors = Boolean(vi?.colors?.palette?.length);
  const colorsApproved = Boolean(vi?.colors?.approved || brand.approvedSections.colors);
  const hasType = Boolean(vi?.typography);
  const typeApproved = Boolean(vi?.typography?.approved || brand.approvedSections.typography);
  const hasLogo = Boolean(vi?.logo?.concepts?.length);
  const logoApproved = Boolean(vi?.logo?.approvedConceptId || brand.approvedSections.logo);
  const hasDirection = Boolean(vi?.visualDirectionDetail);
  const directionApproved = Boolean(
    vi?.visualDirectionDetail?.approved || brand.approvedSections.visualDirectionDetail
  );
  const approvedAssets = assets.filter((a) => a.approved && a.status !== 'archived');
  const hasStrategy = Boolean(brand.strategy?.positioning && brand.strategy?.mission);
  const hasVoice = Boolean(brand.voice?.tone && brand.voice?.writingStyle);
  const strategyApproved =
    Boolean(brand.approvedSections.positioning) ||
    Boolean(brand.approvedSections.mission);

  const items: ReadinessItem[] = [
    {
      id: 'profile',
      label: 'Brand Profile',
      complete: Boolean(brand.brandName && brand.description),
      weight: 10,
      detail: brand.brandName
        ? 'Brand profile is set.'
        : 'Brand name and description are required.',
    },
    {
      id: 'strategy',
      label: 'Strategy',
      complete: hasStrategy,
      weight: 12,
      detail: hasStrategy
        ? strategyApproved
          ? 'Strategy is present (sections approved).'
          : 'Strategy is present. Approve key sections when ready.'
        : 'Generate strategy (positioning, mission, vision).',
    },
    {
      id: 'voice',
      label: 'Brand Voice',
      complete: hasVoice,
      weight: 10,
      detail: hasVoice
        ? 'Voice guidelines are defined.'
        : 'Define tone and writing style.',
    },
    {
      id: 'logo',
      label: 'Logo',
      complete: hasLogo && logoApproved,
      weight: 14,
      detail: !hasLogo
        ? 'Generate logo concepts in Visual Identity.'
        : !logoApproved
          ? 'Primary logo has not been approved.'
          : 'Logo is approved.',
    },
    {
      id: 'colors',
      label: 'Colors',
      complete: hasColors && colorsApproved,
      weight: 14,
      detail: !hasColors
        ? 'Generate a color system.'
        : !colorsApproved
          ? 'Color palette is not approved yet.'
          : 'Color system is complete.',
    },
    {
      id: 'typography',
      label: 'Typography',
      complete: hasType && typeApproved,
      weight: 12,
      detail: !hasType
        ? 'Generate typography.'
        : !typeApproved
          ? 'Typography is not approved yet.'
          : 'Typography is complete.',
    },
    {
      id: 'direction',
      label: 'Visual Direction',
      complete: hasDirection && directionApproved,
      weight: 8,
      detail: !hasDirection
        ? 'Generate visual direction detail.'
        : !directionApproved
          ? 'Visual direction is not approved yet.'
          : 'Visual direction is complete.',
    },
    {
      id: 'assets',
      label: 'Assets',
      complete: approvedAssets.length >= 1,
      weight: 12,
      detail:
        approvedAssets.length === 0
          ? 'Approve at least one asset in Asset Studio.'
          : approvedAssets.length < 3
            ? `${approvedAssets.length} approved asset(s). Consider expanding the kit.`
            : `${approvedAssets.length} approved assets.`,
    },
    {
      id: 'tokens',
      label: 'Design Tokens',
      complete: hasColors && hasType,
      weight: 8,
      detail:
        hasColors && hasType
          ? 'Design tokens can be derived for Forge/export.'
          : 'Colors and typography are required for design tokens.',
    },
  ];

  const totalWeight = items.reduce((s, i) => s + i.weight, 0);
  const earned = items.reduce((s, i) => s + (i.complete ? i.weight : 0), 0);
  const score = Math.round((earned / totalWeight) * 100);

  return {
    score,
    items,
    missing: items.filter((i) => !i.complete).map((i) => i.detail),
    complete: items.filter((i) => i.complete).map((i) => i.detail),
  };
}
