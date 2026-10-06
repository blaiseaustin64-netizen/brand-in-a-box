/**
 * Asset library service — persistence + orchestration.
 * Uses same localStorage family as brand profile.
 */

import type {
  BrandProfile,
  BrandAsset,
  AssetPreset,
  AssetGenerateResponse,
  AssetGenerateRequest,
  AssetStatus,
} from '../../types/brand';
import { getAIProvider } from '../ai';
import { buildAssetGenerationContext, summarizeContext } from './contextBuilder';
import { createAssetFromTemplate } from './templateGenerator';
import { getPreset } from './presets';
import type { AssetCapableProvider } from '../../types/brand';

const ASSETS_KEY = 'vexdyn_brand_in_a_box_assets';

export function loadAssets(brandId: string): BrandAsset[] {
  try {
    const raw = localStorage.getItem(ASSETS_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as BrandAsset[];
    return all.filter((a) => a.brandId === brandId);
  } catch {
    return [];
  }
}

function saveAll(assets: BrandAsset[]): void {
  try {
    // Merge with other brands' assets
    const raw = localStorage.getItem(ASSETS_KEY);
    const existing = raw ? (JSON.parse(raw) as BrandAsset[]) : [];
    const ids = new Set(assets.map((a) => a.id));
    const brandIds = new Set(assets.map((a) => a.brandId));
    const others = existing.filter(
      (a) => !brandIds.has(a.brandId) || !ids.has(a.id)
    );
    // For this brand, replace with full list passed in
    const thisBrandId = assets[0]?.brandId;
    const keptOthers = existing.filter((a) => a.brandId !== thisBrandId);
    localStorage.setItem(
      ASSETS_KEY,
      JSON.stringify([...keptOthers, ...assets])
    );
  } catch {
    // non-fatal
  }
}

export function persistAssets(brandId: string, assets: BrandAsset[]): void {
  try {
    const raw = localStorage.getItem(ASSETS_KEY);
    const existing = raw ? (JSON.parse(raw) as BrandAsset[]) : [];
    const others = existing.filter((a) => a.brandId !== brandId);
    localStorage.setItem(ASSETS_KEY, JSON.stringify([...others, ...assets]));
  } catch {
    /* ignore */
  }
}

export async function generateAsset(
  brand: BrandProfile,
  assets: BrandAsset[],
  presetId: string,
  instruction?: string
): Promise<AssetGenerateResponse> {
  const preset = getPreset(presetId);
  if (!preset) {
    return {
      success: false,
      error: 'Unknown asset preset.',
      provider: 'none',
    };
  }

  const context = buildAssetGenerationContext(brand, assets);
  const provider = getAIProvider() as AssetCapableProvider;

  // Prefer provider.generateAsset when implemented
  if (typeof provider.generateAsset === 'function') {
    await delay(400 + Math.random() * 600);
    return provider.generateAsset({
      action: 'generate_asset',
      context,
      preset,
      instruction,
    });
  }

  // Fallback path — same template engine
  await delay(500 + Math.random() * 700);
  const asset = createAssetFromTemplate(context, preset, { instruction });
  asset.generationContextSummary = summarizeContext(context);
  return {
    success: true,
    asset,
    version: asset.versions[0],
    provider: provider.name,
    usedTemplate: true,
  };
}

export async function refineAsset(
  brand: BrandProfile,
  assets: BrandAsset[],
  asset: BrandAsset,
  refineAction?: string,
  instruction?: string
): Promise<AssetGenerateResponse> {
  const preset = getPreset(asset.presetId);
  if (!preset) {
    return { success: false, error: 'Preset missing.', provider: 'none' };
  }
  const context = buildAssetGenerationContext(brand, assets);
  const provider = getAIProvider() as AssetCapableProvider;

  if (typeof provider.generateAsset === 'function') {
    await delay(400 + Math.random() * 500);
    return provider.generateAsset({
      action: 'refine_asset',
      context,
      preset,
      asset,
      instruction,
      refineAction: refineAction as AssetGenerateRequest['refineAction'],
    });
  }

  await delay(400 + Math.random() * 500);
  const next = createAssetFromTemplate(context, preset, {
    instruction,
    refine: refineAction || instruction,
    existing: asset,
  });
  return {
    success: true,
    asset: next,
    version: next.versions[next.versions.length - 1],
    provider: provider.name,
    usedTemplate: true,
  };
}

export function approveAsset(asset: BrandAsset): BrandAsset {
  const now = new Date().toISOString();
  return {
    ...asset,
    approved: true,
    approvedVersionId: asset.currentVersionId,
    status: 'approved',
    updatedAt: now,
    versions: asset.versions.map((v) =>
      v.id === asset.currentVersionId ? { ...v, status: 'approved' as AssetStatus } : v
    ),
  };
}

export function restoreVersion(asset: BrandAsset, versionId: string): BrandAsset {
  const ver = asset.versions.find((v) => v.id === versionId);
  if (!ver) return asset;
  return {
    ...asset,
    currentVersionId: versionId,
    thumbnailSvg: ver.svgMarkup,
    format: ver.format,
    width: ver.width,
    height: ver.height,
    updatedAt: new Date().toISOString(),
  };
}

export function archiveAsset(asset: BrandAsset): BrandAsset {
  return {
    ...asset,
    status: 'archived',
    updatedAt: new Date().toISOString(),
  };
}

export function deleteAsset(
  assets: BrandAsset[],
  assetId: string
): BrandAsset[] {
  return assets.filter((a) => a.id !== assetId);
}

export function downloadAssetVersion(asset: BrandAsset, versionId?: string): void {
  const ver =
    asset.versions.find((v) => v.id === (versionId || asset.currentVersionId)) ||
    asset.versions[asset.versions.length - 1];
  if (!ver?.svgMarkup) {
    throw new Error('No downloadable content for this version.');
  }
  const blob = new Blob([ver.svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${asset.name.replace(/\s+/g, '-').toLowerCase()}-v${ver.version}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
