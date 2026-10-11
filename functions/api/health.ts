import {
  type Env,
  corsHeaders,
  json,
  handleOptions,
  DEFAULT_OPENROUTER_MODEL,
  DEFAULT_IMAGE_MODEL,
} from './_shared';

/**
 * GET /api/health — public capability probe (no secrets).
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const env = context.env;
  return json({
    ok: true,
    service: 'brand-in-a-box-api',
    openRouterConfigured: Boolean(env.OPENROUTER_API_KEY),
    workersAiConfigured: Boolean(env.AI),
    openRouterModel:
      env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL,
    imageModel: DEFAULT_IMAGE_MODEL,
    timestamp: new Date().toISOString(),
  });
};

export const onRequestOptions: PagesFunction = async () => handleOptions();
