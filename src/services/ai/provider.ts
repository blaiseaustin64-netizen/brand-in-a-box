/**
 * AI Provider abstraction.
 * Production: RemoteAIProvider → Cloudflare Pages Functions
 *   - OpenRouter (OPENROUTER_API_KEY) for brand text
 *   - Workers AI binding (AI) for raster images
 * Local/dev without functions: MockAIProvider fallback
 *
 * Keys never live in the browser.
 */

import type { AIProvider, AIGenerateRequest, AIGenerateResponse } from '../../types/brand';
import { MockAIProvider } from './mockProvider';
import { RemoteAIProvider } from './remoteProvider';
import { fetchAiHealth } from './config';

let activeProvider: AIProvider | null = null;
let resolved = false;

/**
 * Resolve the active AI provider.
 * Prefer remote (Pages Functions). Fall back to mock only when
 * health endpoint is unreachable OR openRouter is not configured
 * AND we are clearly in a local static context.
 */
export function getAIProvider(): AIProvider {
  if (activeProvider) return activeProvider;

  // Default to remote — production Pages deploy
  const remote = new RemoteAIProvider();
  activeProvider = remote;

  // Async health probe updates image support + may swap to mock for text if needed
  void probeAndAdjust(remote);

  return activeProvider;
}

async function probeAndAdjust(remote: RemoteAIProvider): Promise<void> {
  if (resolved) return;
  resolved = true;
  try {
    const health = await fetchAiHealth();
    remote.supportsImageGeneration = health.workersAiConfigured;
    // If health unreachable (pure local vite without functions proxy),
    // keep remote for attempts but mock is available via setAIProvider.
    // We do NOT auto-swap to mock for successful API with missing key —
    // generate() already returns explicit errors.
    if (!health.ok && import.meta.env.DEV) {
      // Local vite: no Pages Functions unless proxied
      console.info(
        '[Brand-in-a-Box] API health unreachable in dev. Brand AI requires Cloudflare Pages Functions. Using remote provider; requests will fail with clear errors unless functions are proxied. Mock remains available via setAIProvider.'
      );
    }
  } catch {
    /* ignore */
  }
}

/** Allow tests or bootstrap to inject a provider */
export function setAIProvider(provider: AIProvider): void {
  activeProvider = provider;
}

/** Force mock (local offline demo) */
export function useMockAIProvider(): void {
  activeProvider = new MockAIProvider();
}

export type { AIProvider, AIGenerateRequest, AIGenerateResponse };
