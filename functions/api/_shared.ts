/** Shared helpers for Cloudflare Pages Functions */

export interface Env {
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
  OPENROUTER_FALLBACK_MODEL?: string;
  AI?: {
    run: (model: string, input: Record<string, unknown>) => Promise<unknown>;
  };
}

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function handleOptions(): Response {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function readJsonBody(
  request: Request,
  maxBytes = 120_000
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > maxBytes) {
    return { ok: false, error: `Request body too large (max ${maxBytes} bytes).` };
  }
  try {
    const text = await request.text();
    if (text.length > maxBytes) {
      return { ok: false, error: `Request body too large (max ${maxBytes} bytes).` };
    }
    if (!text.trim()) return { ok: false, error: 'Empty request body.' };
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return { ok: false, error: 'Invalid JSON body.' };
  }
}

/** Default free-tier OpenRouter model (change via OPENROUTER_MODEL env). */
export const DEFAULT_OPENROUTER_MODEL = 'google/gemma-4-26b-a4b-it:free';
export const FALLBACK_OPENROUTER_MODEL = 'openrouter/free';

export const DEFAULT_IMAGE_MODEL = '@cf/black-forest-labs/flux-1-schnell';
