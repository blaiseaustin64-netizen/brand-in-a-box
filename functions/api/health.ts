import {
  type Env,
  type AppPagesFunction,
  json,
  handleOptions,
  DEFAULT_OPENROUTER_MODEL,
  DEFAULT_IMAGE_MODEL,
} from './_shared';

/** GET /api/health — public capability probe (no secrets). */
export const onRequestGet: AppPagesFunction<Env> = async (context) => {
  const env = context.env;
  return json({
    ok: true,
    service: 'brand-in-a-box-api',
    openRouterConfigured: Boolean(env.OPENROUTER_API_KEY),
    workersAiConfigured: Boolean(env.AI),
    openRouterModel: env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL,
    imageModel: DEFAULT_IMAGE_MODEL,
    timestamp: new Date().toISOString(),
  });
};

export const onRequestOptions: AppPagesFunction = async () => handleOptions();
