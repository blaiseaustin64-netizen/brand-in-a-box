/**
 * Forge integration adapter.
 * Prepares a Forge-compatible payload from the Brand Package.
 * Does NOT invent endpoints or secrets.
 *
 * Configuration (future, server-injected only):
 *   import.meta.env.VITE_FORGE_HANDOFF_URL
 *
 * When unset → configured: false, payload still prepared for inspection/download.
 */

import type {
  BrandProfile,
  BrandAsset,
  ForgePayload,
  ForgeHandoffResult,
  BrandPackage,
} from '../../types/brand';
import { buildBrandPackage, validateBrandPackage } from '../export/brandPackage';

function isForgeConfigured(): boolean {
  try {
    const url = (import.meta as ImportMeta & { env?: Record<string, string> }).env
      ?.VITE_FORGE_HANDOFF_URL;
    return Boolean(url && url.length > 0 && !url.includes('undefined'));
  } catch {
    return false;
  }
}

export function buildForgePayload(
  brand: BrandProfile,
  assets: BrandAsset[]
): ForgePayload {
  const pkg = buildBrandPackage(brand, assets);
  return packageToForgePayload(pkg);
}

export function packageToForgePayload(pkg: BrandPackage): ForgePayload {
  const logoConcepts = pkg.visualIdentity?.logo?.concepts || [];
  const logos = logoConcepts.map((c) => ({
    role: c.role,
    svgMarkup: c.svgMarkup,
    format: 'svg' as const,
  }));

  const approvedAssets = pkg.assets
    .filter((a) => a.approved)
    .map((a) => {
      const ver =
        a.versions.find((v) => v.id === a.currentVersionId) || a.versions.at(-1);
      return {
        id: a.id,
        role: `assets.${a.category}.${a.type}`,
        type: a.type,
        category: a.category,
        width: a.width,
        height: a.height,
        format: a.format,
        svgMarkup: ver?.svgMarkup,
      };
    });

  return {
    schemaVersion: '1.0',
    source: 'brand-in-a-box',
    packageVersion: pkg.version,
    brandId: pkg.brand.id,
    brandName: pkg.brand.brandName,
    designTokens: pkg.designTokens,
    visualDirection: pkg.brand.visualDirection,
    visualDirectionDetail: pkg.visualIdentity?.visualDirectionDetail,
    colors: pkg.designTokens.colors,
    typography: pkg.designTokens.typography,
    logos,
    approvedAssets,
    voice: {
      tone: pkg.voice.tone,
      writingStyle: pkg.voice.writingStyle,
    },
    tagline: pkg.brand.tagline,
    exportedAt: pkg.metadata.exportedAt,
  };
}

/**
 * Attempt Forge handoff.
 * Real network call only when VITE_FORGE_HANDOFF_URL is configured.
 */
export async function sendToForge(
  brand: BrandProfile,
  assets: BrandAsset[]
): Promise<ForgeHandoffResult> {
  const validation = validateBrandPackage(brand, assets);
  if (!validation.canExport) {
    return {
      success: false,
      configured: isForgeConfigured(),
      error: validation.issues
        .filter((i) => i.level === 'error')
        .map((i) => i.message)
        .join(' '),
    };
  }

  const payload = buildForgePayload(brand, assets);
  const configured = isForgeConfigured();

  if (!configured) {
    return {
      success: false,
      configured: false,
      payload,
      message:
        'Forge connection is not configured in this environment. The payload is ready — download it or set VITE_FORGE_HANDOFF_URL via a secure server/build inject (never hard-code secrets).',
    };
  }

  const url = (import.meta as ImportMeta & { env?: Record<string, string> }).env!
    .VITE_FORGE_HANDOFF_URL;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return {
        success: false,
        configured: true,
        payload,
        error: `Forge handoff failed (${res.status}).`,
      };
    }
    return {
      success: true,
      configured: true,
      payload,
      message: 'Brand package sent to Forge.',
    };
  } catch (err) {
    return {
      success: false,
      configured: true,
      payload,
      error: err instanceof Error ? err.message : 'Network error contacting Forge.',
    };
  }
}
