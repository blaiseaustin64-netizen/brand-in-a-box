/**
 * NYVEN integration contract — interfaces only.
 * NO network calls. NO endpoints. Architectural readiness for future wiring.
 *
 * Intended future flow:
 *   NYVEN → Brand Intelligence → Brand Profile → Brand-in-a-Box
 *         → Brand Package → Forge / X-Ray / Agents
 */

import type {
  BrandProfile,
  BrandAsset,
  BrandStrategy,
  BrandVoice,
  VisualIdentity,
  DesignTokens,
  BrandPackage,
  AssetGenerationContext,
} from '../../types/brand';
import { buildDesignTokens } from '../export/designTokens';
import { buildBrandPackage } from '../export/brandPackage';
import { buildAssetGenerationContext } from '../assets/contextBuilder';

/** What a future NYVEN (or any host) can read from Brand-in-a-Box */
export interface BrandIntelligenceReader {
  getBrandProfile(): BrandProfile | null;
  getBrandStrategy(): BrandStrategy | null;
  getBrandVoice(): BrandVoice | null;
  getVisualIdentity(): VisualIdentity | null;
  getApprovedAssets(): BrandAsset[];
  getDesignTokens(): DesignTokens | null;
  getBrandPackage(): BrandPackage | null;
  getAssetGenerationContext(): AssetGenerationContext | null;
}

/** What Brand-in-a-Box could accept from future Brand Intelligence */
export interface BrandIntelligenceWriter {
  /**
   * Apply structured brand intelligence without wiping local approvals.
   * Implementation is reserved for a future NYVEN provider.
   */
  applyBrandIntelligence?(partial: Partial<BrandProfile>): void;
}

/**
 * Local implementation of the reader contract over in-memory brand + assets.
 * Safe to use today; swap backing store later without changing consumers.
 */
export function createBrandIntelligenceReader(
  getBrand: () => BrandProfile | null,
  getAssets: () => BrandAsset[]
): BrandIntelligenceReader {
  return {
    getBrandProfile: () => getBrand(),
    getBrandStrategy: () => getBrand()?.strategy ?? null,
    getBrandVoice: () => getBrand()?.voice ?? null,
    getVisualIdentity: () => getBrand()?.visualIdentity ?? null,
    getApprovedAssets: () => getAssets().filter((a) => a.approved),
    getDesignTokens: () => {
      const b = getBrand();
      if (!b?.visualIdentity?.colors?.palette?.length) return null;
      return buildDesignTokens(b);
    },
    getBrandPackage: () => {
      const b = getBrand();
      if (!b) return null;
      try {
        return buildBrandPackage(b, getAssets());
      } catch {
        return null;
      }
    },
    getAssetGenerationContext: () => {
      const b = getBrand();
      if (!b) return null;
      return buildAssetGenerationContext(b, getAssets());
    },
  };
}

/** Documented payload shape NYVEN would eventually consume or produce */
export const NYVEN_BRAND_CONTRACT_DOC = {
  schemaVersion: '1.0',
  description:
    'Serializable brand intelligence contract for future NYVEN ↔ Brand-in-a-Box integration.',
  reads: [
    'BrandProfile',
    'BrandStrategy',
    'BrandVoice',
    'VisualIdentity',
    'BrandAsset[] (approved)',
    'DesignTokens',
    'BrandPackage',
    'AssetGenerationContext',
  ],
  writes:
    'Optional partial BrandProfile patches that must respect approvedSections and approved identity parts.',
  constraints: [
    'No direct NYVEN API calls from the browser in this product phase.',
    'No secrets in client code.',
    'Provider abstraction remains the integration point for AI.',
  ],
} as const;
