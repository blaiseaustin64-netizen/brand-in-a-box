/**
 * POST /api/generate-image
 * Cloudflare Workers AI (binding: AI) — raster image generation.
 * Model: @cf/black-forest-labs/flux-1-schnell
 *
 * Official input schema (CF docs): prompt (required), steps (optional, max 8).
 * Do not send unsupported properties — they cause AiError 5006 (invalid input).
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
          'Workers AI binding (AI) is not available in this deployment. Check wrangler.toml [ai] binding and redeploy.',
        provider: 'workers-ai',
        configured: false,
        code: 'BINDING_MISSING',
      },
      503
    );
  }

  const body = await readJsonBody(context.request, 20_000);
  if (!body.ok) {
    return json(
      {
        success: false,
        error: body.error,
        provider: 'workers-ai',
        configured: true,
        code: 'BAD_REQUEST',
      },
      400
    );
  }

  const data = body.data as {
    prompt?: string;
    steps?: number;
  };

  const prompt = typeof data.prompt === 'string' ? data.prompt.trim() : '';
  if (!prompt || prompt.length < 1) {
    return json(
      {
        success: false,
        error: 'prompt is required (min 1 character).',
        provider: 'workers-ai',
        configured: true,
        code: 'BAD_REQUEST',
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
        configured: true,
        code: 'BAD_REQUEST',
      },
      400
    );
  }

  // Documented max for flux-1-schnell is 8; default 4
  const steps = clampInt(data.steps, 1, 8, 4);
  const model = DEFAULT_IMAGE_MODEL;

  // Minimal valid payload only — prompt + steps.
  // Sending seed/width/height has caused AiError 5006 (invalid input /
  // additional or unevaluated properties) on this model.
  const inferenceInput: { prompt: string; steps: number } = { prompt, steps };

  try {
    const result = await env.AI.run(model, inferenceInput);

    const imageBase64 = extractImageBase64(result);
    if (!imageBase64) {
      return json(
        {
          success: false,
          error:
            'Workers AI returned no usable image data. The model may have responded in an unexpected format.',
          provider: 'workers-ai',
          model,
          configured: true,
          code: 'EMPTY_IMAGE',
          // Safe diagnostic shape only (no secrets)
          resultKeys:
            result && typeof result === 'object'
              ? Object.keys(result as object).slice(0, 12)
              : typeof result,
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
      steps,
      configured: true,
    });
  } catch (err) {
    const { message, code } = sanitizeAiError(err);
    return json(
      {
        success: false,
        error: message,
        provider: 'workers-ai',
        model,
        configured: true,
        code: code || 'MODEL_INVOCATION_FAILED',
      },
      502
    );
  }
};

/** Normalize Workers AI image payloads. */
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
    // Some gateways nest under result
    if (r.result && typeof r.result === 'object') {
      const nested = (r.result as Record<string, unknown>).image;
      if (typeof nested === 'string' && nested.length > 32) {
        return nested.replace(/^data:image\/\w+;base64,/, '');
      }
    }
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

/**
 * Cloudflare Workers AI errors often look like:
 * "5006: Error: Additional or unevaluated properties..."
 * Keep useful text, strip stacks / internal host details.
 */
function sanitizeAiError(err: unknown): { message: string; code?: string } {
  if (!(err instanceof Error) && typeof err !== 'object') {
    return { message: 'Workers AI image generation failed.' };
  }
  const raw =
    err instanceof Error
      ? err.message
      : typeof (err as { message?: string }).message === 'string'
        ? (err as { message: string }).message
        : String(err);

  const codeMatch = raw.match(/\b(50\d{2}|30\d{2})\b/);
  const code = codeMatch ? codeMatch[1] : undefined;

  // Truncate safely for client
  let message = raw.replace(/\s+/g, ' ').trim().slice(0, 400);
  if (!message) message = 'Workers AI image generation failed.';

  // Prefix for clarity when we have a CF internal code
  if (code && !message.startsWith('Image generation failed')) {
    message = `Image generation failed (Workers AI ${code}): ${message}`;
  } else if (!message.toLowerCase().includes('fail')) {
    message = `Image generation failed: ${message}`;
  }

  return { message, code };
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
