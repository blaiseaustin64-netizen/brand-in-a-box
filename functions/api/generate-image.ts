/**
 * POST /api/generate-image
 * Cloudflare Workers AI (binding: AI) — raster image generation.
 * Returns base64 JPEG. Does not store images server-side.
 */

import {
  type Env,
  json,
  handleOptions,
  readJsonBody,
  DEFAULT_IMAGE_MODEL,
} from './_shared';

export const onRequestOptions: PagesFunction = async () => handleOptions();

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const env = context.env;
  if (!env.AI) {
    return json(
      {
        success: false,
        error:
          'Workers AI binding (AI) is not available in this deployment. Raster image generation is unavailable.',
        provider: 'workers-ai',
        configured: false,
      },
      503
    );
  }

  const body = await readJsonBody(context.request, 20_000);
  if (!body.ok) {
    return json({ success: false, error: body.error, provider: 'workers-ai' }, 400);
  }

  const data = body.data as {
    prompt?: string;
    steps?: number;
    seed?: number;
  };

  const prompt = typeof data.prompt === 'string' ? data.prompt.trim() : '';
  if (!prompt || prompt.length < 3) {
    return json(
      { success: false, error: 'prompt is required (min 3 characters).', provider: 'workers-ai' },
      400
    );
  }
  if (prompt.length > 2000) {
    return json(
      {
        success: false,
        error: 'prompt too long (max 2000 characters).',
        provider: 'workers-ai',
      },
      400
    );
  }

  const steps = clampInt(data.steps, 1, 8, 4);
  const seed =
    typeof data.seed === 'number' && Number.isFinite(data.seed)
      ? Math.floor(data.seed)
      : Math.floor(Math.random() * 1_000_000);

  const model = DEFAULT_IMAGE_MODEL;

  try {
    const result = (await env.AI.run(model, {
      prompt,
      steps,
      seed,
    })) as { image?: string };

    if (!result?.image || typeof result.image !== 'string') {
      return json(
        {
          success: false,
          error: 'Workers AI returned no image data.',
          provider: 'workers-ai',
          model,
        },
        502
      );
    }

    // Official docs: response.image is base64 (JPEG)
    const dataUri = `data:image/jpeg;base64,${result.image}`;

    return json({
      success: true,
      provider: 'workers-ai',
      model,
      mimeType: 'image/jpeg',
      imageBase64: result.image,
      dataUri,
      seed,
      steps,
    });
  } catch (err) {
    return json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : 'Workers AI image generation failed.',
        provider: 'workers-ai',
        model,
      },
      502
    );
  }
};

function clampInt(
  v: unknown,
  min: number,
  max: number,
  fallback: number
): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(v)));
}
