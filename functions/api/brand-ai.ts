/**
 * POST /api/brand-ai
 * Server-side OpenRouter brand intelligence.
 * Never returns the API key. Never invents success without a model response.
 */

import {
  type Env,
  type AppPagesFunction,
  json,
  handleOptions,
  readJsonBody,
  DEFAULT_OPENROUTER_MODEL,
  FALLBACK_OPENROUTER_MODEL,
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

  // Identity / logo / pure visual actions stay client-side procedural
  const clientSideActions = new Set([
    'generate_identity',
    'generate_logo_concepts',
    'generate_colors',
    'generate_typography',
    'generate_visual_direction',
    'make_minimal',
    'increase_contrast',
    'make_darker',
    'make_lighter',
    'reduce_saturation',
    'make_typography_stronger',
  ]);
  if (clientSideActions.has(req.action)) {
    return json(
      {
        success: false,
        error:
          'This action is handled client-side (procedural identity / SVG logos). Call the local identity generators instead.',
        provider: 'openrouter',
        clientSide: true,
      },
      400
    );
  }

  const model =
    env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL;
  const fallback =
    env.OPENROUTER_FALLBACK_MODEL?.trim() || FALLBACK_OPENROUTER_MODEL;

  try {
    const messages = buildMessages(req);
    let result = await callOpenRouter(env.OPENROUTER_API_KEY, model, messages);
    let usedModel = model;

    if (!result.ok && model !== fallback) {
      result = await callOpenRouter(env.OPENROUTER_API_KEY, fallback, messages);
      usedModel = fallback;
    }

    if (!result.ok) {
      return json(
        {
          success: false,
          error: result.error,
          provider: 'openrouter',
          model: usedModel,
        },
        502
      );
    }

    const parsed = parseBrandPayload(result.content, req);
    if (!parsed.ok) {
      return json(
        {
          success: false,
          error: parsed.error,
          provider: 'openrouter',
          model: usedModel,
          rawPreview: result.content.slice(0, 400),
        },
        502
      );
    }

    return json({
      success: true,
      provider: 'openrouter',
      model: usedModel,
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

function buildMessages(req: BrandAIRequest): { role: string; content: string }[] {
  const system = `You are a senior brand strategist for VEXDYN Brand-in-a-Box.
Return ONLY valid JSON (no markdown fences) matching the schema requested.
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

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[]
): Promise<{ ok: true; content: string } | { ok: false; error: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55_000);
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://brand-in-a-box.pages.dev',
        'X-Title': 'VEXDYN Brand-in-a-Box',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    if (res.status === 429) {
      return {
        ok: false,
        error: 'OpenRouter rate limit reached. Wait a moment and retry.',
      };
    }
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
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
      return { ok: false, error: data.error.message };
    }
    const content = data.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      return { ok: false, error: 'OpenRouter returned an empty response.' };
    }
    return { ok: true, content };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false, error: 'OpenRouter request timed out.' };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error calling OpenRouter.',
    };
  } finally {
    clearTimeout(timer);
  }
}

function stripFences(text: string): string {
  let t = text.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  return t.trim();
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
    const raw = JSON.parse(stripFences(content)) as Record<string, unknown>;
    const base = (req.brand || {}) as Record<string, unknown>;
    const input = (req.input || {}) as Record<string, unknown>;

    const strategyIn = (raw.strategy || {}) as Record<string, unknown>;
    const voiceIn = (raw.voice || {}) as Record<string, unknown>;
    const prevStrategy = (base.strategy || {}) as Record<string, unknown>;
    const prevVoice = (base.voice || {}) as Record<string, unknown>;

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
      tagline:
        (raw.tagline as string) ||
        (base.tagline as string) ||
        '',
      summary:
        (raw.summary as string) ||
        (base.summary as string) ||
        '',
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
          prevVoice.messagingPrinciples
        ),
        exampleVoice: str(voiceIn.exampleVoice, prevVoice.exampleVoice),
        shortBio: str(voiceIn.shortBio, prevVoice.shortBio),
        longDescription: str(voiceIn.longDescription, prevVoice.longDescription),
        socialBio: str(voiceIn.socialBio, prevVoice.socialBio),
      },
      visualIdentity: base.visualIdentity,
      approvedSections: base.approvedSections || {},
      history: base.history,
    };

    // Client will also enforce approvedSections; do a server-side soft respect
    const approved = (base.approvedSections || {}) as Record<string, boolean>;
    if (req.brand && Object.keys(approved).length) {
      profile.strategy = mergeApprovedStrategy(
        prevStrategy,
        profile.strategy as Record<string, unknown>,
        approved
      );
      profile.voice = mergeApprovedVoice(
        prevVoice,
        profile.voice as Record<string, unknown>,
        approved
      );
      if (approved.tagline && base.tagline) profile.tagline = base.tagline;
      if (approved.summary && base.summary) profile.summary = base.summary;
    }

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
  if (Array.isArray(v) && v.every((x) => typeof x === 'string')) {
    return v as string[];
  }
  if (Array.isArray(fallback)) return fallback as string[];
  return [];
}

function mergeApprovedStrategy(
  prev: Record<string, unknown>,
  next: Record<string, unknown>,
  approved: Record<string, boolean>
): Record<string, unknown> {
  const map: Record<string, string> = {
    positioning: 'positioning',
    mission: 'mission',
    vision: 'vision',
    brandStory: 'brandStory',
    targetAudience: 'targetAudienceDetail',
    personality: 'personalityDetail',
    coreValues: 'coreValues',
    messagingPrinciples: 'messagingPrinciples',
  };
  const out = { ...next };
  for (const [section, field] of Object.entries(map)) {
    if (approved[section] && prev[field] !== undefined) {
      out[field] = prev[field];
    }
  }
  return out;
}

function mergeApprovedVoice(
  prev: Record<string, unknown>,
  next: Record<string, unknown>,
  approved: Record<string, boolean>
): Record<string, unknown> {
  const map: Record<string, string> = {
    toneOfVoice: 'tone',
    writingStyle: 'writingStyle',
    wordsToUse: 'wordsToUse',
    wordsToAvoid: 'wordsToAvoid',
    exampleVoice: 'exampleVoice',
    shortBio: 'shortBio',
    longDescription: 'longDescription',
    socialBio: 'socialBio',
    messagingPrinciples: 'messagingPrinciples',
  };
  const out = { ...next };
  for (const [section, field] of Object.entries(map)) {
    if (approved[section] && prev[field] !== undefined) {
      out[field] = prev[field];
    }
  }
  return out;
}
