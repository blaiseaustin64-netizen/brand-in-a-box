/**
 * Central AI configuration (client-safe — no secrets).
 * Server models are configured via Cloudflare env:
 *   OPENROUTER_API_KEY, OPENROUTER_MODEL, OPENROUTER_FALLBACK_MODEL, AI binding
 */

export const AI_ENDPOINTS = {
  health: '/api/health',
  brandAi: '/api/brand-ai',
  generateImage: '/api/generate-image',
} as const;

/** Documented defaults — actual server model may differ via OPENROUTER_MODEL env */
export const DOCUMENTED_DEFAULTS = {
  openRouterModel: 'nvidia/nemotron-3-super-120b-a12b:free',
  openRouterFallback: 'openrouter/free',
  imageModel: '@cf/black-forest-labs/flux-1-schnell',
} as const;

export interface AiHealthStatus {
  ok: boolean;
  openRouterConfigured: boolean;
  workersAiConfigured: boolean;
  openRouterModel?: string;
  imageModel?: string;
  error?: string;
}

let cachedHealth: { at: number; status: AiHealthStatus } | null = null;
const HEALTH_TTL_MS = 30_000;

export async function fetchAiHealth(force = false): Promise<AiHealthStatus> {
  if (!force && cachedHealth && Date.now() - cachedHealth.at < HEALTH_TTL_MS) {
    return cachedHealth.status;
  }
  try {
    const res = await fetch(AI_ENDPOINTS.health, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) {
      const status: AiHealthStatus = {
        ok: false,
        openRouterConfigured: false,
        workersAiConfigured: false,
        error: `Health check failed (${res.status}).`,
      };
      cachedHealth = { at: Date.now(), status };
      return status;
    }
    const data = (await res.json()) as AiHealthStatus & Record<string, unknown>;
    const status: AiHealthStatus = {
      ok: Boolean(data.ok),
      openRouterConfigured: Boolean(data.openRouterConfigured),
      workersAiConfigured: Boolean(data.workersAiConfigured),
      openRouterModel:
        typeof data.openRouterModel === 'string'
          ? data.openRouterModel
          : DOCUMENTED_DEFAULTS.openRouterModel,
      imageModel:
        typeof data.imageModel === 'string'
          ? data.imageModel
          : DOCUMENTED_DEFAULTS.imageModel,
    };
    cachedHealth = { at: Date.now(), status };
    return status;
  } catch {
    const status: AiHealthStatus = {
      ok: false,
      openRouterConfigured: false,
      workersAiConfigured: false,
      error:
        'API health endpoint unreachable (Pages Functions not available in this environment).',
    };
    cachedHealth = { at: Date.now(), status };
    return status;
  }
}

export function clearAiHealthCache(): void {
  cachedHealth = null;
}
