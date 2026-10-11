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

/** Documented defaults — actual server model may differ via env */
export const DOCUMENTED_DEFAULTS = {
  openRouterModel: 'google/gemma-4-26b-a4b-it:free',
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
const HEALTH_TTL_MS = 60_000;

export async function fetchAiHealth(force = false): Promise<AiHealthStatus> {
  if (!force && cachedHealth && Date.now() - cachedHealth.at < HEALTH_TTL_MS) {
    return cachedHealth.status;
  }
  try {
    const res = await fetch(AI_ENDPOINTS.health, { method: 'GET' });
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
    const data = (await res.json()) as AiHealthStatus;
    const status: AiHealthStatus = {
      ok: true,
      openRouterConfigured: Boolean(data.openRouterConfigured),
      workersAiConfigured: Boolean(data.workersAiConfigured),
      openRouterModel: data.openRouterModel,
      imageModel: data.imageModel,
    };
    cachedHealth = { at: Date.now(), status };
    return status;
  } catch {
    const status: AiHealthStatus = {
      ok: false,
      openRouterConfigured: false,
      workersAiConfigured: false,
      error: 'API health endpoint unreachable (local dev without Pages Functions?).',
    };
    cachedHealth = { at: Date.now(), status };
    return status;
  }
}
