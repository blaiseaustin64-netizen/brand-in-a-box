/**
 * Shared helpers for Cloudflare Pages Functions (Workers runtime).
 * No Node.js-only APIs. No secrets in responses.
 */

export interface Env {
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
  OPENROUTER_FALLBACK_MODEL?: string;
  /** Workers AI binding configured in Pages dashboard as "AI" */
  AI?: {
    run: (
      model: string,
      input: Record<string, unknown>
    ) => Promise<unknown>;
  };
}

/** Minimal context shape used by our handlers (avoids ambient PagesFunction). */
export interface FunctionContext<E = Env> {
  request: Request;
  env: E;
  params: Record<string, string>;
  waitUntil: (promise: Promise<unknown>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  data: Record<string, unknown>;
}

export type AppPagesFunction<E = Env> = (
  context: FunctionContext<E>
) => Response | Promise<Response>;

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

/**
 * Primary text model (OpenRouter free route).
 * Override with OPENROUTER_MODEL in Pages env if needed.
 */
export const DEFAULT_OPENROUTER_MODEL =
  'nvidia/nemotron-3-super-120b-a12b:free';

/**
 * Optional secondary model — used only when primary is unavailable
 * (404 / model not found), never as a silent success path.
 * Override with OPENROUTER_FALLBACK_MODEL.
 */
export const FALLBACK_OPENROUTER_MODEL = 'openrouter/free';

/** Cloudflare Workers AI text-to-image model */
export const DEFAULT_IMAGE_MODEL = '@cf/black-forest-labs/flux-1-schnell';

/** OpenRouter request timeout (ms) — large models need headroom */
export const OPENROUTER_TIMEOUT_MS = 90_000;

/** Max transient retries (429 / 5xx / network) per model attempt */
export const OPENROUTER_MAX_RETRIES = 2;
