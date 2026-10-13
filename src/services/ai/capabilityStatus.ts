/**
 * Capability status helpers — Phase 1 honesty layer.
 * Separates Text AI (OpenRouter), Visual Identity engine (procedural),
 * and Image generation (Workers AI) so one label cannot overwrite another.
 */

/** Actions handled by the procedural identity engine (not OpenRouter). */
export const PROCEDURAL_IDENTITY_ACTIONS = new Set([
  'generate_identity',
  'generate_logo_concepts',
  'generate_colors',
  'generate_typography',
  'generate_visual_direction',
  // Visual-direction refinements (must update visualIdentity, not only strategy text)
  'make_premium',
  'make_futuristic',
  'make_playful',
  'make_professional',
  'make_minimal',
  'increase_contrast',
  'make_darker',
  'make_lighter',
  'reduce_saturation',
  'make_typography_stronger',
]);

export const IDENTITY_ENGINE_ID = 'procedural-identity';
export const IDENTITY_ENGINE_LABEL = 'Procedural identity engine';

export type OperationKind = 'text' | 'identity' | 'image' | null;

export type ImageSourceKind = 'image_provider' | 'template' | null;

export interface CapabilitySnapshot {
  /** Last successful OpenRouter text operation (never identity). */
  lastTextProvider: string | null;
  lastTextModel: string | null;
  lastTextSuccess: boolean | null;
  /** Always the procedural engine id for identity ops. */
  identityEngine: typeof IDENTITY_ENGINE_ID;
  lastIdentitySuccess: boolean | null;
  /** Last image attempt outcome (not configuration). */
  lastImageSource: ImageSourceKind;
  lastImageSuccess: boolean | null;
  lastOperation: OperationKind;
}

export const initialCapabilitySnapshot = (): CapabilitySnapshot => ({
  lastTextProvider: null,
  lastTextModel: null,
  lastTextSuccess: null,
  identityEngine: IDENTITY_ENGINE_ID,
  lastIdentitySuccess: null,
  lastImageSource: null,
  lastImageSuccess: null,
  lastOperation: null,
});

export function isProceduralIdentityAction(action: string): boolean {
  return PROCEDURAL_IDENTITY_ACTIONS.has(action);
}

/**
 * Normalize provider strings from responses so mock-dev identity
 * never surfaces as the product-wide AI provider.
 */
export function normalizeProviderForAction(
  action: string | undefined,
  provider: string | undefined
): { kind: OperationKind; provider: string; isProcedural: boolean } {
  if (action && isProceduralIdentityAction(action)) {
    return {
      kind: 'identity',
      provider: IDENTITY_ENGINE_ID,
      isProcedural: true,
    };
  }
  if (
    provider === 'mock-dev' ||
    provider === IDENTITY_ENGINE_ID ||
    provider === 'procedural'
  ) {
    // Without action, treat mock-dev as identity engine (legacy responses)
    if (provider === 'mock-dev' || provider === IDENTITY_ENGINE_ID) {
      return {
        kind: 'identity',
        provider: IDENTITY_ENGINE_ID,
        isProcedural: true,
      };
    }
  }
  return {
    kind: 'text',
    provider: provider || 'openrouter',
    isProcedural: false,
  };
}

export function applyTextResult(
  prev: CapabilitySnapshot,
  result: {
    success: boolean;
    provider?: string;
    model?: string;
  }
): CapabilitySnapshot {
  if (result.success) {
    return {
      ...prev,
      lastTextProvider: result.provider || 'openrouter',
      lastTextModel: result.model || prev.lastTextModel,
      lastTextSuccess: true,
      lastOperation: 'text',
    };
  }
  return {
    ...prev,
    lastTextSuccess: false,
    lastOperation: 'text',
  };
}

export function applyIdentityResult(
  prev: CapabilitySnapshot,
  success: boolean
): CapabilitySnapshot {
  return {
    ...prev,
    identityEngine: IDENTITY_ENGINE_ID,
    lastIdentitySuccess: success,
    lastOperation: 'identity',
  };
}

export function applyImageResult(
  prev: CapabilitySnapshot,
  result: { success: boolean; source: ImageSourceKind }
): CapabilitySnapshot {
  return {
    ...prev,
    lastImageSource: result.source,
    lastImageSuccess: result.success,
    lastOperation: 'image',
  };
}

/** Display helpers — configuration vs last operation must stay distinct. */

export function formatTextConfiguredLine(opts: {
  configured: boolean;
  model?: string;
}): string {
  if (!opts.configured) return 'Text AI: not configured';
  const model = opts.model ? ` · ${opts.model}` : '';
  return `Text AI: OpenRouter${model} (configured)`;
}

export function formatTextLastLine(snap: CapabilitySnapshot): string | null {
  if (snap.lastTextSuccess === null && !snap.lastTextProvider) return null;
  if (snap.lastTextSuccess === false) {
    return 'Last text op: failed';
  }
  if (snap.lastTextSuccess && snap.lastTextProvider) {
    const model = snap.lastTextModel ? ` · ${snap.lastTextModel}` : '';
    return `Last text op: ${snap.lastTextProvider}${model}`;
  }
  return null;
}

export function formatIdentityLine(snap: CapabilitySnapshot): string {
  const base = `Identity: ${IDENTITY_ENGINE_LABEL}`;
  if (snap.lastIdentitySuccess === true) return `${base} · last run ok`;
  if (snap.lastIdentitySuccess === false) return `${base} · last run failed`;
  return base;
}

export function formatImageConfiguredLine(opts: {
  configured: boolean;
  model?: string;
}): string {
  if (!opts.configured) {
    return 'Images: unavailable (AI binding not detected)';
  }
  const model = opts.model ? ` · ${opts.model}` : '';
  return `Images: Workers AI${model} (configured)`;
}

export function formatImageLastLine(snap: CapabilitySnapshot): string | null {
  if (snap.lastImageSuccess === null) return null;
  if (snap.lastImageSuccess === false) {
    return 'Last image op: failed';
  }
  if (snap.lastImageSource === 'template') {
    return 'Last image op: SVG template (not model-generated)';
  }
  if (snap.lastImageSource === 'image_provider') {
    return 'Last image op: Workers AI image';
  }
  return 'Last image op: ok';
}
