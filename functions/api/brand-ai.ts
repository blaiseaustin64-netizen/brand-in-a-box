/**
 * POST /api/brand-ai
 * Server-side OpenRouter brand intelligence.
 * Primary model: nvidia/nemotron-3-super-120b-a12b:free (overridable via OPENROUTER_MODEL)
 * Never returns the API key. Never invents success without a validated model response.
 */

import {
  type Env,
  type AppPagesFunction,
  json,
  handleOptions,
  readJsonBody,
  DEFAULT_OPENROUTER_MODEL,
  FALLBACK_OPENROUTER_MODEL,
  OPENROUTER_TIMEOUT_MS,
  OPENROUTER_MAX_RETRIES,
} from './_shared';

interface BrandAIRequest {
  action: string;
  input?: Record<string, unknown>;
  brand?: Record<string, unknown>;
  section?: string;
  instruction?: string;
  alternativesCount?: number;
}

export const onRequestOptions: AppPagesFunction = async () => handleOptions();

export const onRequestPost: AppPagesFunction<Env> = async (context) => {
  const env = context.env;
  if (!env.OPENROUTER_API_KEY) {
    return json(
      {
        success: false,
        error:
          'OpenRouter is not configured on the server (OPENROUTER_API_KEY missing). Brand text AI is unavailable.',
        provider: 'openrouter',
        configured: false,
      },
      503
    );
  }

  const body = await readJsonBody(context.request);
  if (!body.ok) {
    return json({ success: false, error: body.error, provider: 'openrouter' }, 400);
  }

  const req = body.data as BrandAIRequest;
  if (!req || typeof req.action !== 'string') {
    return json(
      { success: false, error: 'Missing action.', provider: 'openrouter' },
      400
    );
  }

  const model =
    (typeof env.OPENROUTER_MODEL === 'string' && env.OPENROUTER_MODEL.trim()) ||
    DEFAULT_OPENROUTER_MODEL;
  const fallback =
    (typeof env.OPENROUTER_FALLBACK_MODEL === 'string' &&
      env.OPENROUTER_FALLBACK_MODEL.trim()) ||
    FALLBACK_OPENROUTER_MODEL;

  try {
    const messages = buildMessages(req);
    let result = await callOpenRouter(env.OPENROUTER_API_KEY, model, messages, {
      preferJsonObject: true,
    });
    let usedModel = model;
    let usedFallback = false;

    // Only switch model when primary is unavailable (not on parse/timeout of content)
    if (
      !result.ok &&
      model !== fallback &&
      isModelUnavailableError(result.error)
    ) {
      result = await callOpenRouter(env.OPENROUTER_API_KEY, fallback, messages, {
        preferJsonObject: true,
      });
      usedModel = fallback;
      usedFallback = true;
    }

    if (!result.ok) {
      return json(
        {
          success: false,
          error: result.error,
          provider: 'openrouter',
          model: usedModel,
          usedFallback,
        },
        502
      );
    }

    let parsed = parseBrandPayload(result.content, req);

    // One controlled repair attempt when JSON is malformed
    if (!parsed.ok) {
      const repairMessages = [
        ...messages,
        {
          role: 'assistant' as const,
          content: result.content.slice(0, 6000),
        },
        {
          role: 'user' as const,
          content:
            'Your previous reply was not valid JSON for the required schema. Reply with ONLY a single valid JSON object matching the schema. No markdown fences, no commentary.',
        },
      ];
      const repaired = await callOpenRouter(
        env.OPENROUTER_API_KEY,
        usedModel,
        repairMessages,
        { preferJsonObject: true }
      );
      if (repaired.ok) {
        parsed = parseBrandPayload(repaired.content, req);
        if (parsed.ok) {
          result = repaired;
        }
      }
    }

    if (!parsed.ok) {
      return json(
        {
          success: false,
          error: parsed.error,
          provider: 'openrouter',
          model: usedModel,
          usedFallback,
          rawPreview: result.content.slice(0, 400),
        },
        502
      );
    }

    return json({
      success: true,
      provider: 'openrouter',
      model: usedModel,
      usedFallback,
      profile: parsed.profile,
      explanation: parsed.explanation,
      alternatives: parsed.alternatives,
    });
  } catch (err) {
    return json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : 'Unexpected OpenRouter failure.',
        provider: 'openrouter',
      },
      500
    );
  }
};

function isModelUnavailableError(error: string): boolean {
  const e = error.toLowerCase();
  return (
    e.includes('not found') ||
    e.includes('no endpoints') ||
    e.includes('model') && e.includes('unavailable') ||
    e.includes('(404)') ||
    e.includes('invalid model')
  );
}

function buildMessages(req: BrandAIRequest): { role: string; content: string }[] {
  const system = `You are a senior brand strategist for VEXDYN Brand-in-a-Box.
Return ONLY valid JSON (no markdown fences, no prose outside JSON) matching the schema requested.
Be specific to the brand inputs. Avoid generic filler.
Do not invent facts not implied by the brief.
Keep tone professional and premium.`;

  const schema = `{
  "tagline": "string",
  "summary": "string (2-3 sentences)",
  "strategy": {
    "positioning": "string",
    "mission": "string",
    "vision": "string",
    "brandStory": "string",
    "targetAudienceDetail": "string",
    "personalityDetail": "string",
    "coreValues": ["string"],
    "messagingPrinciples": ["string"]
  },
  "voice": {
    "tone": "string",
    "writingStyle": "string",
    "wordsToUse": ["string"],
    "wordsToAvoid": ["string"],
    "messagingPrinciples": ["string"],
    "exampleVoice": "string (short sample paragraph)",
    "shortBio": "string",
    "longDescription": "string",
    "socialBio": "string (max 160 chars)"
  },
  "explanation": "string (optional, why these choices)"
}`;

  let user = `Action: ${req.action}\nJSON schema:\n${schema}\n\n`;

  if (req.input) {
    user += `Brand brief:\n${JSON.stringify(req.input, null, 2)}\n\n`;
  }
  if (req.brand) {
    const b = req.brand as Record<string, unknown>;
    const slim = {
      brandName: b.brandName,
      industry: b.industry,
      description: b.description,
      targetAudience: b.targetAudience,
      personality: b.personality,
      visualDirection: b.visualDirection,
      keywords: b.keywords,
      tagline: b.tagline,
      strategy: b.strategy,
      voice: b.voice,
      approvedSections: b.approvedSections,
    };
    user += `Current brand profile (respect approvedSections — do not change approved fields if you return a full profile; the client will merge):\n${JSON.stringify(slim, null, 2)}\n\n`;
  }
  if (req.section) {
    user += `Focus section: ${req.section}\nStill return the full schema, but put the highest quality work in that section.\n`;
  }
  if (req.instruction) {
    user += `User instruction: ${req.instruction}\n`;
  }
  if (req.action.startsWith('make_')) {
    user += `Adjust personality/tone toward: ${req.action.replace('make_', '')}. Rewrite strategy and voice accordingly while staying coherent.\n`;
  }
  if (req.action === 'explain_why') {
    user += `Primarily fill "explanation" with a clear rationale for the current brand choices. Still include strategy/voice consistent with the brand.\n`;
  }
  if (req.action === 'generate_alternatives') {
    user += `Also include "alternatives": an array of 2 objects each with tagline + strategy.positioning + voice.tone variations.\n`;
  }

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

type CallOpts = { preferJsonObject: boolean };

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  opts: CallOpts
): Promise<{ ok: true; content: string } | { ok: false; error: string }> {
  let lastError = 'OpenRouter request failed.';
  let useJsonObject = opts.preferJsonObject;

  for (let attempt = 0; attempt <= OPENROUTER_MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const backoff = Math.min(8000, 1000 * 2 ** (attempt - 1));
      await sleep(backoff);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

    try {
      const body: Record<string, unknown> = {
        model,
        messages,
        temperature: 0.65,
        max_tokens: 4096,
      };
      if (useJsonObject) {
        body.response_format = { type: 'json_object' };
      }

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://brand-in-a-box.pages.dev',
          'X-Title': 'VEXDYN Brand-in-a-Box',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (res.status === 401 || res.status === 403) {
        return {
          ok: false,
          error: `OpenRouter authentication failed (${res.status}). Check OPENROUTER_API_KEY.`,
        };
      }

      if (res.status === 429) {
        lastError = 'OpenRouter rate limit reached. Wait a moment and retry.';
        const retryAfter = res.headers.get('Retry-After');
        const waitSec = retryAfter ? Number(retryAfter) : 0;
        if (waitSec > 0 && waitSec < 30) {
          await sleep(waitSec * 1000);
        }
        continue; // retryable
      }

      if (res.status >= 500) {
        lastError = `OpenRouter server error (${res.status}).`;
        continue; // retryable
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        // Some models reject response_format — retry once without it
        if (
          useJsonObject &&
          (res.status === 400 || res.status === 422) &&
          /response_format|json_object|unsupported/i.test(errText)
        ) {
          useJsonObject = false;
          lastError = `OpenRouter rejected json_object format; retrying without it.`;
          continue;
        }
        return {
          ok: false,
          error: `OpenRouter error (${res.status}): ${errText.slice(0, 300) || res.statusText}`,
        };
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
        error?: { message?: string };
      };
      if (data.error?.message) {
        const msg = data.error.message;
        if (/response_format|json_object/i.test(msg) && useJsonObject) {
          useJsonObject = false;
          lastError = msg;
          continue;
        }
        return { ok: false, error: msg };
      }
      const content = data.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string' || !content.trim()) {
        lastError = 'OpenRouter returned an empty response.';
        continue;
      }
      return { ok: true, content };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        lastError = `OpenRouter request timed out after ${OPENROUTER_TIMEOUT_MS / 1000}s.`;
        continue; // retry once more on timeout
      }
      lastError =
        err instanceof Error ? err.message : 'Network error calling OpenRouter.';
      continue;
    } finally {
      clearTimeout(timer);
    }
  }

  return { ok: false, error: lastError };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Strip fences and extract the outermost JSON object when the model adds prose. */
function extractJsonObject(text: string): string {
  let t = text.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  }
  t = t.trim();
  if (t.startsWith('{') && t.endsWith('}')) return t;

  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return t.slice(start, end + 1);
  }
  return t;
}

function parseBrandPayload(
  content: string,
  req: BrandAIRequest
):
  | {
      ok: true;
      profile: Record<string, unknown>;
      explanation?: string;
      alternatives?: unknown[];
    }
  | { ok: false; error: string } {
  try {
    const extracted = extractJsonObject(content);
    const raw = JSON.parse(extracted) as Record<string, unknown>;
    const base = (req.brand || {}) as Record<string, unknown>;
    const input = (req.input || {}) as Record<string, unknown>;

    const strategyIn = (raw.strategy || {}) as Record<string, unknown>;
    const voiceIn = (raw.voice || {}) as Record<string, unknown>;
    const prevStrategy = (base.strategy || {}) as Record<string, unknown>;
    const prevVoice = (base.voice || {}) as Record<string, unknown>;

    // Require at least one meaningful strategy field from the model
    const hasSignal =
      Boolean(str(strategyIn.positioning, '')) ||
      Boolean(str(raw.tagline, '')) ||
      Boolean(str(strategyIn.mission, '')) ||
      Boolean(str(voiceIn.tone, ''));

    if (!hasSignal) {
      return {
        ok: false,
        error:
          'Model JSON parsed but lacked required brand fields (tagline/positioning/mission/tone).',
      };
    }

    const now = new Date().toISOString();
    const profile: Record<string, unknown> = {
      id: base.id || `brand_${Date.now().toString(36)}`,
      createdAt: base.createdAt || now,
      updatedAt: now,
      status: 'strategy_ready',
      brandName:
        (input.brandName as string) ||
        (base.brandName as string) ||
        'Untitled Brand',
      industry: (input.industry as string) || (base.industry as string) || '',
      description:
        (input.description as string) || (base.description as string) || '',
      targetAudience:
        (input.targetAudience as string) ||
        (base.targetAudience as string) ||
        '',
      personality:
        (input.personality as string[]) ||
        (base.personality as string[]) ||
        [],
      visualDirection:
        (input.visualDirection as string) ||
        (base.visualDirection as string) ||
        'Minimal',
      keywords: (input.keywords as string[]) || (base.keywords as string[]) || [],
      additionalNotes:
        (input.additionalNotes as string) ||
        (base.additionalNotes as string) ||
        undefined,
      tagline: str(raw.tagline, base.tagline),
      summary: str(raw.summary, base.summary),
      strategy: {
        positioning: str(strategyIn.positioning, prevStrategy.positioning),
        mission: str(strategyIn.mission, prevStrategy.mission),
        vision: str(strategyIn.vision, prevStrategy.vision),
        brandStory: str(strategyIn.brandStory, prevStrategy.brandStory),
        targetAudienceDetail: str(
          strategyIn.targetAudienceDetail,
          prevStrategy.targetAudienceDetail
        ),
        personalityDetail: str(
          strategyIn.personalityDetail,
          prevStrategy.personalityDetail
        ),
        coreValues: arr(strategyIn.coreValues, prevStrategy.coreValues),
        messagingPrinciples: arr(
          strategyIn.messagingPrinciples,
          prevStrategy.messagingPrinciples
        ),
      },
      voice: {
        tone: str(voiceIn.tone, prevVoice.tone),
        writingStyle: str(voiceIn.writingStyle, prevVoice.writingStyle),
        wordsToUse: arr(voiceIn.wordsToUse, prevVoice.wordsToUse),
        wordsToAvoid: arr(voiceIn.wordsToAvoid, prevVoice.wordsToAvoid),
        messagingPrinciples: arr(
          voiceIn.messagingPrinciples,
          prevVoice.messagingPrinciples || prevStrategy.messagingPrinciples
        ),
        exampleVoice: str(voiceIn.exampleVoice, prevVoice.exampleVoice),
        shortBio: str(voiceIn.shortBio, prevVoice.shortBio),
        longDescription: str(voiceIn.longDescription, prevVoice.longDescription),
        socialBio: str(voiceIn.socialBio, prevVoice.socialBio).slice(0, 160),
      },
      approvedSections: base.approvedSections || {},
      visualIdentity: base.visualIdentity || undefined,
      history: base.history || [],
    };

    return {
      ok: true,
      profile,
      explanation:
        typeof raw.explanation === 'string' ? raw.explanation : undefined,
      alternatives: Array.isArray(raw.alternatives)
        ? raw.alternatives
        : undefined,
    };
  } catch {
    return {
      ok: false,
      error: 'Failed to parse structured JSON from the model response.',
    };
  }
}

function str(v: unknown, fallback: unknown): string {
  if (typeof v === 'string' && v.trim()) return v.trim();
  if (typeof fallback === 'string') return fallback;
  return '';
}

function arr(v: unknown, fallback: unknown): string[] {
  if (Array.isArray(v)) {
    return v.filter((x): x is string => typeof x === 'string' && x.trim()).map((x) => x.trim());
  }
  if (Array.isArray(fallback)) {
    return (fallback as unknown[]).filter(
      (x): x is string => typeof x === 'string'
    );
  }
  return [];
}
