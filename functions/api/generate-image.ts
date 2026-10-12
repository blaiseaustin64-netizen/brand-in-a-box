/**
 * POST /api/generate-image
 * Cloudflare Workers AI (binding: AI) — raster image generation.
 * Model: @cf/black-forest-labs/flux-1-schnell
 * Returns base64 JPEG data URI for the existing frontend asset pipeline.
 */

import {
  type Env,
  type AppPagesFunction,
  json,
  handleOptions,
  readJsonBody,
  DEFAULT_IMAGE_MODEL,
} from './_shared';

export const onRequestOptions: AppPagesFunction = async () => handleOptions();

export const onRequestPost: AppPagesFunction<Env> = async (context) => {
  const env = context.env;
  if (!env.AI || typeof env.AI.run !== 'function') {
    return json(
      {
        success: false,
        error:
          'Workers AI binding (AI) is not available in this deployment. Attach the AI binding in Cloudflare Pages → Settings → Functions → Bindings.',
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
      {
        success: false,
        error: 'prompt is required (min 3 characters).',
        provider: 'workers-ai',
      },
      400
    );
  }
  if (prompt.length > 2048) {
    return json(
      {
        success: false,
        error: 'prompt too long (max 2048 characters).',
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
    const result = await env.AI.run(model, {
      prompt,
      steps,
      seed,
    });

    const imageBase64 = extractImageBase64(result);
    if (!imageBase64) {
      return json(
        {
          success: false,
          error:
            'Workers AI returned no usable image data. Check Workers AI model access for this account.',
          provider: 'workers-ai',
          model,
        },
        502
      );
    }

    const dataUri = `data:image/jpeg;base64,${imageBase64}`;

    return json({
      success: true,
      provider: 'workers-ai',
      model,
      mimeType: 'image/jpeg',
      imageBase64,
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

/** Normalize Workers AI image payloads (string base64, or { image }, or binary-like). */
function extractImageBase64(result: unknown): string | null {
  if (!result) return null;
  if (typeof result === 'string' && result.length > 32) {
    return result.replace(/^data:image\/\w+;base64,/, '');
  }
  if (typeof result === 'object') {
    const r = result as Record<string, unknown>;
    if (typeof r.image === 'string' && r.image.length > 32) {
      return r.image.replace(/^data:image\/\w+;base64,/, '');
    }
    // Some runtimes return image as number[] / Uint8Array-like
    if (Array.isArray(r.image) && r.image.length > 0) {
      try {
        const bytes = Uint8Array.from(r.image as number[]);
        return bytesToBase64(bytes);
      } catch {
        return null;
      }
    }
  }
  return null;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function clampInt(
  v: unknown,
  min: number,
  max: number,
  fallback: number
): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(v)));
}
