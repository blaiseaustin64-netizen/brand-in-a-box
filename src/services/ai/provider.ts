/**
 * AI Provider abstraction.
 * Current implementation uses a development fallback.
 * Future: swap implementation for NYVEN without touching UI.
 *
 * BrandDirector → AIProvider → Current / NYVEN
 */

import type { AIProvider, AIGenerateRequest, AIGenerateResponse } from '../../types/brand';
import { MockAIProvider } from './mockProvider';

let activeProvider: AIProvider | null = null;

/**
 * Resolve the active AI provider.
 * Checks for configuration; falls back to mock for local development.
 * Never exposes API keys in client code.
 */
export function getAIProvider(): AIProvider {
  if (activeProvider) return activeProvider;

  // Future: detect real provider config (env injected at build / server proxy)
  // const apiKey = import.meta.env.VITE_AI_API_KEY; // never hard-code
  // if (apiKey) activeProvider = new RealProvider(...);

  activeProvider = new MockAIProvider();
  return activeProvider;
}

/** Allow tests or future bootstrap to inject a provider */
export function setAIProvider(provider: AIProvider): void {
  activeProvider = provider;
}

export type { AIProvider, AIGenerateRequest, AIGenerateResponse };
