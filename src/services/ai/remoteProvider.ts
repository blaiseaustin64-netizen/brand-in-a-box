/**
 * Remote AI provider — calls Cloudflare Pages Functions.
 * Text intelligence: OpenRouter (server-side key).
 * Identity (logo/colors/type): local procedural (never claimed as OpenRouter).
 * Images: separate /api/generate-image endpoint.
 */

import type {
  AIProvider,
  AIGenerateRequest,
  AIGenerateResponse,
  BrandProfile,
  AssetGenerateRequest,
  AssetGenerateResponse,
  AssetCapableProvider,
} from '../../types/brand';
import { AI_ENDPOINTS } from './config';
import { MockAIProvider } from './mockProvider';
import { createAssetFromTemplate } from '../assets/templateGenerator';
import { summarizeContext } from '../assets/contextBuilder';

const IDENTITY_ACTIONS = new Set([
  'generate_identity',
  'generate_logo_concepts',
  'generate_colors',
  'generate_typography',
  'generate_visual_direction',
  'make_premium',
  'make_futuristic',
  'make_playful',
  'make_professional',
  'make_minimal',
  'increase_contrast',
  'make_darker',
  'make_lighter',
  'reduce_saturation',
  'make_typography_stronger',
]);

export class RemoteAIProvider implements AIProvider, AssetCapableProvider {
  readonly name = 'openrouter+workers-ai';
  readonly isConfigured = true;
  /** Updated after health probe; default optimistic for production */
  supportsImageGeneration = true;

  private mock = new MockAIProvider();

  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    // Procedural identity / SVG logos — local only
    if (IDENTITY_ACTIONS.has(request.action)) {
      return this.handleIdentityLocally(request);
    }

    try {
      const res = await fetch(AI_ENDPOINTS.brandAi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: request.action,
          input: request.input,
          brand: request.brand,
          section: request.section,
          instruction: request.instruction,
          alternativesCount: request.alternativesCount,
        }),
      });

      const data = (await res.json()) as AIGenerateResponse & {
        configured?: boolean;
        model?: string;
        clientSide?: boolean;
      };

      if (!res.ok || !data.success) {
        // Explicit failure — do not silently return mock strategy as "AI"
        return {
          success: false,
          error:
            data.error ||
            `Brand AI request failed (${res.status}).`,
          provider: data.provider || this.name,
        };
      }

      // Client-side enforcement of approved sections
      if (data.profile && request.brand?.approvedSections) {
        data.profile = preserveApprovals(request.brand, data.profile);
      }
      // Preserve visual identity always on text-only updates
      if (data.profile && request.brand?.visualIdentity) {
        data.profile = {
          ...data.profile,
          visualIdentity: request.brand.visualIdentity,
        };
      }

      return {
        success: true,
        profile: data.profile,
        explanation: data.explanation,
        alternatives: data.alternatives,
        provider: data.provider || this.name,
        model: data.model,
        usedFallback: (data as { usedFallback?: boolean }).usedFallback,
      };
    } catch (err) {
      return {
        success: false,
        error:
          err instanceof Error
            ? `Brand AI network error: ${err.message}`
            : 'Brand AI network error.',
        provider: this.name,
      };
    }
  }

  async generateAsset(
    request: AssetGenerateRequest
  ): Promise<AssetGenerateResponse> {
    const { preset, context, instruction } = request;

    // Business / template-first assets stay SVG
    if (!preset.prefersImageGeneration || !this.supportsImageGeneration) {
      const asset = createAssetFromTemplate(context, preset, {
        instruction,
        refine: request.refineAction || instruction,
        existing: request.asset,
        notes: !this.supportsImageGeneration
          ? 'SVG template: image generation capability is off for this session.'
          : 'Branded SVG template (this preset is template-first, not raster AI).',
      });
      asset.generationContextSummary = summarizeContext(context);
      return {
        success: true,
        asset,
        version: asset.versions[asset.versions.length - 1],
        provider: this.name,
        usedTemplate: true,
      };
    }

    // Raster path via Workers AI
    const prompt = buildImagePrompt(context, preset, instruction);
    try {
      const res = await fetch(AI_ENDPOINTS.generateImage, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, steps: 4 }),
      });
      const data = (await res.json()) as {
        success: boolean;
        error?: string;
        dataUri?: string;
        imageBase64?: string;
        mimeType?: string;
        model?: string;
        configured?: boolean;
        code?: string;
      };

      if (!res.ok || !data.success || !data.dataUri) {
        // Binding missing vs model failure — never claim "not configured" when binding exists
        const bindingMissing = data.configured === false || data.code === 'BINDING_MISSING';
        const errDetail = (data.error || `HTTP ${res.status}`).slice(0, 280);
        const notes = bindingMissing
          ? 'SVG template fallback: Workers AI binding is not available on this deployment.'
          : `SVG template fallback: raster generation failed. ${errDetail}`;
        const asset = createAssetFromTemplate(context, preset, {
          instruction: instruction || '',
          existing: request.asset,
          notes,
        });
        asset.generationContextSummary =
          summarizeContext(context) + ` | Raster failed: ${errDetail}`;
        asset.source = 'template';
        return {
          success: true,
          asset,
          version: asset.versions[asset.versions.length - 1],
          provider: this.name,
          usedTemplate: true,
          error: bindingMissing
            ? `Workers AI not available. Showing SVG template (not an AI image).`
            : `Raster generation failed: ${errDetail}. Showing SVG template fallback (not an AI image).`,
        };
      }

      const now = new Date().toISOString();
      const versionId = `ver_${Date.now().toString(36)}`;
      const existing = request.asset;
      const versionNum = existing
        ? (existing.versions.at(-1)?.version || 0) + 1
        : 1;

      const version = {
        id: versionId,
        version: versionNum,
        createdAt: now,
        prompt,
        instruction,
        imageUrl: data.dataUri,
        format: 'jpg' as const,
        width: preset.width,
        height: preset.height,
        status: 'generated' as const,
        notes: `Workers AI ${data.model || 'flux-1-schnell'}`,
      };

      const asset = existing
        ? {
            ...existing,
            updatedAt: now,
            currentVersionId: versionId,
            format: 'jpg' as const,
            source: 'image_provider' as const,
            status: 'generated' as const,
            prompt,
            versions: [...existing.versions, version],
            generationContextSummary: summarizeContext(context),
          }
        : {
            id: `asset_${Date.now().toString(36)}`,
            brandId: context.brandId,
            name: preset.name,
            type: preset.type,
            category: preset.category,
            presetId: preset.id,
            prompt,
            generationContextSummary: summarizeContext(context),
            width: preset.width,
            height: preset.height,
            format: 'jpg' as const,
            source: 'image_provider' as const,
            status: 'generated' as const,
            approved: false,
            currentVersionId: versionId,
            versions: [version],
            createdAt: now,
            updatedAt: now,
          };

      return {
        success: true,
        asset,
        version,
        provider: this.name,
        usedTemplate: false,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'network error';
      const asset = createAssetFromTemplate(context, preset, {
        instruction,
        existing: request.asset,
        notes: `SVG template fallback: network error calling image API (${msg.slice(0, 160)}). Not an AI-generated image.`,
      });
      return {
        success: true,
        asset,
        version: asset.versions[asset.versions.length - 1],
        provider: this.name,
        usedTemplate: true,
        error: `Image network error (${msg}). Showing SVG template fallback (not an AI image).`,
      };
    }
  }

  private async handleIdentityLocally(
    request: AIGenerateRequest
  ): Promise<AIGenerateResponse> {
    // Procedural SVG / rules — never report as OpenRouter or product-wide mock-dev
    const response = await this.mock.generate(request);
    return {
      ...response,
      provider: 'procedural-identity',
      model: undefined,
    };
  }
}

function preserveApprovals(
  previous: BrandProfile,
  next: BrandProfile
): BrandProfile {
  const ap = previous.approvedSections || {};
  const strategy = { ...next.strategy };
  const voice = { ...next.voice };

  if (ap.positioning) strategy.positioning = previous.strategy.positioning;
  if (ap.mission) strategy.mission = previous.strategy.mission;
  if (ap.vision) strategy.vision = previous.strategy.vision;
  if (ap.brandStory) strategy.brandStory = previous.strategy.brandStory;
  if (ap.targetAudience)
    strategy.targetAudienceDetail = previous.strategy.targetAudienceDetail;
  if (ap.personality)
    strategy.personalityDetail = previous.strategy.personalityDetail;
  if (ap.coreValues) strategy.coreValues = previous.strategy.coreValues;
  if (ap.messagingPrinciples) {
    strategy.messagingPrinciples = previous.strategy.messagingPrinciples;
    voice.messagingPrinciples = previous.voice.messagingPrinciples;
  }
  if (ap.tagline) next.tagline = previous.tagline;
  if (ap.summary) next.summary = previous.summary;
  if (ap.toneOfVoice) voice.tone = previous.voice.tone;
  if (ap.writingStyle) voice.writingStyle = previous.voice.writingStyle;
  if (ap.wordsToUse) voice.wordsToUse = previous.voice.wordsToUse;
  if (ap.wordsToAvoid) voice.wordsToAvoid = previous.voice.wordsToAvoid;
  if (ap.exampleVoice) voice.exampleVoice = previous.voice.exampleVoice;
  if (ap.shortBio) voice.shortBio = previous.voice.shortBio;
  if (ap.longDescription) voice.longDescription = previous.voice.longDescription;
  if (ap.socialBio) voice.socialBio = previous.voice.socialBio;

  return {
    ...next,
    strategy,
    voice,
    visualIdentity: previous.visualIdentity ?? next.visualIdentity,
    approvedSections: previous.approvedSections,
  };
}

function buildImagePrompt(
  context: AssetGenerateRequest['context'],
  preset: AssetGenerateRequest['preset'],
  instruction?: string
): string {
  const parts = [
    `Brand visual for ${context.brandName}`,
    context.tagline ? `tagline concept: ${context.tagline}` : '',
    `${context.visualDirection} aesthetic`,
    `personality: ${context.personality.join(', ')}`,
    `industry: ${context.industry}`,
    `color mood: primary ${context.colors.primary}, secondary ${context.colors.secondary}, accent ${context.colors.accent}`,
    `format: ${preset.name} (${preset.aspectLabel})`,
    'professional marketing visual, no text overlays unless essential, high quality composition',
    instruction || '',
  ];
  return parts.filter(Boolean).join('. ').slice(0, 1900);
}
