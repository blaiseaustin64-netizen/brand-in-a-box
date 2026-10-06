/**
 * Development AI provider.
 * Produces coherent, context-aware brand content without calling external APIs.
 * Not presented as production AI — clearly a local fallback.
 */

import type {
  AIProvider,
  AIGenerateRequest,
  AIGenerateResponse,
  BrandProfile,
  BrandInput,
  BrandPersonality,
  BrandSectionKey,
  BrandStrategy,
  BrandVoice,
} from '../../types/brand';
import {
  buildFullIdentity,
  buildColorSystem,
  buildTypography,
  buildVisualDirectionDetail,
  buildLogoSystem,
  ensureIdentity,
} from '../identity/generateIdentity';
import { createAssetFromTemplate } from '../assets/templateGenerator';
import type { AssetGenerateRequest, AssetGenerateResponse } from '../../types/brand';

function uid(): string {
  return `brand_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function now(): string {
  return new Date().toISOString();
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function joinPersonality(p: BrandPersonality[]): string {
  if (p.length === 0) return 'Professional';
  if (p.length === 1) return p[0];
  return `${p.slice(0, -1).join(', ')} and ${p[p.length - 1]}`;
}

/** Deterministic-ish but varied generation based on brand context */
function buildStrategy(input: BrandInput): BrandStrategy {
  const name = input.brandName;
  const industry = input.industry || 'technology';
  const audience = input.targetAudience || 'forward-thinking professionals';
  const personality = joinPersonality(input.personality);
  const visual = input.visualDirection;
  const keywords = input.keywords.length ? input.keywords.join(', ') : 'innovation, clarity, trust';

  const positioningOptions = [
    `${name} is the ${personality.toLowerCase()} choice for ${audience} who demand excellence in ${industry}.`,
    `In ${industry}, ${name} stands for ${personality.toLowerCase()} thinking and results that matter to ${audience}.`,
    `${name} redefines ${industry} through a ${personality.toLowerCase()} lens — built for ${audience}.`,
  ];

  const missionOptions = [
    `To empower ${audience} with tools and experiences that feel ${personality.toLowerCase()} and deliver real impact in ${industry}.`,
    `We exist to make ${industry} clearer, stronger, and more ${personality.toLowerCase()} for every ${audience.split(' ')[0] || 'customer'} we serve.`,
    `Help ${audience} succeed by bringing ${personality.toLowerCase()} solutions to the hardest problems in ${industry}.`,
  ];

  const visionOptions = [
    `A world where every ${industry} decision is informed, confident, and shaped by ${personality.toLowerCase()} design.`,
    `To become the defining ${personality.toLowerCase()} brand in ${industry} — trusted by ${audience} worldwide.`,
    `Lead the next era of ${industry} by making ${personality.toLowerCase()} experiences the standard, not the exception.`,
  ];

  const storyOptions = [
    `${name} began with a simple observation: ${audience} deserved better in ${industry}. What started as a focused idea grew into a brand defined by ${personality.toLowerCase()} values and a clear visual language of ${visual.toLowerCase()}. Today we build with intention — every word, color, and interaction reflects who we are.`,
    `The idea behind ${name} was never just another ${industry} product. It was a commitment to ${personality.toLowerCase()} craft and respect for ${audience}. Our story is still being written, guided by keywords that matter to us: ${keywords}.`,
  ];

  const valuesByPersonality: Record<string, string[]> = {
    Luxury: ['Excellence', 'Refinement', 'Discretion', 'Craft'],
    Minimal: ['Clarity', 'Focus', 'Restraint', 'Purpose'],
    Futuristic: ['Innovation', 'Progress', 'Curiosity', 'Boldness'],
    Playful: ['Joy', 'Creativity', 'Openness', 'Surprise'],
    Professional: ['Integrity', 'Reliability', 'Expertise', 'Respect'],
    Technical: ['Precision', 'Rigor', 'Transparency', 'Mastery'],
    default: ['Clarity', 'Integrity', 'Impact', 'Craft'],
  };

  const primaryPersonality = input.personality[0] || 'Professional';
  const coreValues =
    valuesByPersonality[primaryPersonality] || valuesByPersonality.default;

  return {
    positioning: pick(positioningOptions),
    mission: pick(missionOptions),
    vision: pick(visionOptions),
    brandStory: pick(storyOptions),
    targetAudienceDetail: `${audience}. They value ${personality.toLowerCase()} experiences and seek partners who understand ${industry} at a deep level.`,
    personalityDetail: `${name} embodies a ${personality.toLowerCase()} spirit. The brand feels ${visual.toLowerCase()}, speaks with confidence, and never sacrifices substance for style.`,
    coreValues,
    messagingPrinciples: [
      `Lead with clarity — every message should be immediately understandable.`,
      `Reflect the ${personality.toLowerCase()} character of the brand without overstatement.`,
      `Speak to ${audience} as peers, not as a faceless market segment.`,
      `Keep the visual direction (${visual}) consistent across every touchpoint.`,
    ],
  };
}

function buildVoice(input: BrandInput, strategy: BrandStrategy): BrandVoice {
  const name = input.brandName;
  const personality = joinPersonality(input.personality);
  const primary = input.personality[0] || 'Professional';

  const toneMap: Record<string, string> = {
    Luxury: 'Refined, confident, understated',
    Minimal: 'Clean, precise, calm',
    Futuristic: 'Forward-looking, assured, innovative',
    Playful: 'Warm, energetic, approachable',
    Professional: 'Clear, credible, respectful',
    Technical: 'Exact, knowledgeable, direct',
    Bold: 'Decisive, strong, energetic',
    Modern: 'Contemporary, fluid, confident',
    Friendly: 'Warm, human, supportive',
    Creative: 'Expressive, imaginative, open',
  };

  const styleMap: Record<string, string> = {
    Luxury: 'Short, elegant sentences. Prefer implication over explanation.',
    Minimal: 'Sparse language. Every word earns its place.',
    Futuristic: 'Present tense, progressive. Focus on what becomes possible.',
    Playful: 'Conversational rhythm. Occasional light humor when appropriate.',
    Professional: 'Structured, complete thoughts. Avoid jargon unless necessary.',
    Technical: 'Accurate terminology. Prefer specificity over generality.',
  };

  const useWords: Record<string, string[]> = {
    Luxury: ['refined', 'crafted', 'considered', 'exceptional', 'quiet'],
    Minimal: ['clear', 'essential', 'focused', 'simple', 'intentional'],
    Futuristic: ['next', 'intelligent', 'adaptive', 'emerging', 'possible'],
    Playful: ['delight', 'explore', 'together', 'spark', 'fresh'],
    Professional: ['reliable', 'proven', 'partner', 'result', 'trust'],
    Technical: ['precise', 'system', 'architecture', 'optimize', 'measure'],
  };

  const avoidWords: Record<string, string[]> = {
    Luxury: ['cheap', 'basic', 'hack', 'disrupt', 'crush'],
    Minimal: ['feature-rich', 'ultimate', 'revolutionary', 'synergy'],
    Futuristic: ['legacy', 'traditional', 'old-school', 'outdated'],
    Playful: ['enterprise-grade', 'synergize', 'leverage', 'disrupt'],
    Professional: ['awesome', 'epic', 'hack', 'crush it'],
    Technical: ['magic', 'simply', 'just', 'easy'],
  };

  const tone = toneMap[primary] || 'Clear, confident, human';
  const writingStyle = styleMap[primary] || 'Direct and readable. Prefer active voice.';
  const wordsToUse = useWords[primary] || ['clear', 'strong', 'thoughtful', 'reliable'];
  const wordsToAvoid = avoidWords[primary] || ['synergy', 'disrupt', 'leverage', 'awesome'];

  return {
    tone,
    writingStyle,
    wordsToUse,
    wordsToAvoid,
    messagingPrinciples: strategy.messagingPrinciples,
    exampleVoice: `At ${name}, we believe ${strategy.mission.split('.')[0].toLowerCase()}. Our approach is ${personality.toLowerCase()} — we listen first, then build what actually matters.`,
    shortBio: `${name} — ${personality.toLowerCase()} ${input.industry || 'brand'} for ${input.targetAudience || 'modern teams'}.`,
    longDescription: `${name} is a ${personality.toLowerCase()} brand operating in ${input.industry || 'its category'}. ${strategy.positioning} We design every interaction to feel coherent with our visual direction (${input.visualDirection}) and our core values: ${strategy.coreValues.join(', ')}.`,
    socialBio: `${name} · ${personality} ${input.industry || 'brand'} · Building with intention.`.slice(0, 160),
  };
}

function buildTagline(input: BrandInput): string {
  const name = input.brandName;
  const primary = input.personality[0] || 'Professional';
  const options: Record<string, string[]> = {
    Luxury: [`The quiet standard.`, `Crafted for those who know.`, `Less noise. More presence.`],
    Minimal: [`Only what matters.`, `Clarity, designed.`, `Essential by design.`],
    Futuristic: [`Build what comes next.`, `Intelligence, applied.`, `Tomorrow, started today.`],
    Playful: [`Make it matter — and make it fun.`, `Serious results. Lighter touch.`, `Ideas that move.`],
    Professional: [`Clarity that performs.`, `Built for the work that matters.`, `Trust, delivered.`],
    Technical: [`Precision at scale.`, `Systems that think.`, `Engineered for clarity.`],
    Bold: [`Own the outcome.`, `No half measures.`, `Decide. Build. Lead.`],
    Modern: [`Designed for now.`, `Fluid. Focused. Forward.`, `The contemporary standard.`],
    Friendly: [`Human by design.`, `Here for the real work.`, `Together, clearer.`],
    Creative: [`Imagination, structured.`, `Ideas with edges.`, `Create with conviction.`],
  };
  const list = options[primary] || [`${name}. Built with intention.`];
  return pick(list);
}

function buildSummary(input: BrandInput, strategy: BrandStrategy, tagline: string): string {
  return `${input.brandName} is a ${joinPersonality(input.personality).toLowerCase()} brand in ${input.industry || 'its space'}. ${tagline} ${strategy.positioning}`;
}

function createProfileFromInput(input: BrandInput): BrandProfile {
  const strategy = buildStrategy(input);
  const tagline = buildTagline(input);
  const voice = buildVoice(input, { ...strategy, tagline } as BrandStrategy & { tagline: string });
  // Fix social bio with real tagline
  voice.socialBio = `${input.brandName} · ${joinPersonality(input.personality)} ${input.industry || 'brand'} · ${tagline}`.slice(0, 160);
  const summary = buildSummary(input, strategy, tagline);

  return {
    id: uid(),
    createdAt: now(),
    updatedAt: now(),
    status: 'strategy_ready',
    brandName: input.brandName.trim(),
    industry: input.industry.trim(),
    description: input.description.trim(),
    targetAudience: input.targetAudience.trim(),
    personality: input.personality,
    visualDirection: input.visualDirection,
    keywords: input.keywords,
    additionalNotes: input.additionalNotes,
    tagline,
    summary,
    strategy,
    voice,
    approvedSections: {},
    history: [],
  };
}

function regenerateSection(
  profile: BrandProfile,
  section: BrandSectionKey,
  instruction?: string
): BrandProfile {
  if (profile.approvedSections[section]) {
    // Respect approved sections
    return { ...profile, updatedAt: now() };
  }

  const input: BrandInput = {
    brandName: profile.brandName,
    description: profile.description,
    industry: profile.industry,
    targetAudience: profile.targetAudience,
    personality: profile.personality,
    visualDirection: profile.visualDirection,
    keywords: profile.keywords,
    additionalNotes: instruction || profile.additionalNotes,
  };

  const next = { ...profile, updatedAt: now() };
  const strategy = { ...profile.strategy };
  const voice = { ...profile.voice };

  switch (section) {
    case 'positioning':
      strategy.positioning = buildStrategy(input).positioning;
      break;
    case 'mission':
      strategy.mission = buildStrategy(input).mission;
      break;
    case 'vision':
      strategy.vision = buildStrategy(input).vision;
      break;
    case 'brandStory':
      strategy.brandStory = buildStrategy(input).brandStory;
      break;
    case 'targetAudience':
      strategy.targetAudienceDetail = buildStrategy(input).targetAudienceDetail;
      break;
    case 'personality':
      strategy.personalityDetail = buildStrategy(input).personalityDetail;
      break;
    case 'coreValues':
      strategy.coreValues = buildStrategy(input).coreValues;
      break;
    case 'messagingPrinciples':
      strategy.messagingPrinciples = buildStrategy(input).messagingPrinciples;
      voice.messagingPrinciples = strategy.messagingPrinciples;
      break;
    case 'tagline':
      next.tagline = buildTagline(input);
      next.summary = buildSummary(input, strategy, next.tagline);
      break;
    case 'toneOfVoice':
      voice.tone = buildVoice(input, strategy).tone;
      break;
    case 'writingStyle':
      voice.writingStyle = buildVoice(input, strategy).writingStyle;
      break;
    case 'wordsToUse':
      voice.wordsToUse = buildVoice(input, strategy).wordsToUse;
      break;
    case 'wordsToAvoid':
      voice.wordsToAvoid = buildVoice(input, strategy).wordsToAvoid;
      break;
    case 'exampleVoice':
      voice.exampleVoice = buildVoice(input, strategy).exampleVoice;
      break;
    case 'shortBio':
      voice.shortBio = buildVoice(input, strategy).shortBio;
      break;
    case 'longDescription':
      voice.longDescription = buildVoice(input, strategy).longDescription;
      break;
    case 'socialBio':
      voice.socialBio = buildVoice(input, strategy).socialBio;
      break;
    case 'summary':
      next.summary = buildSummary(input, strategy, next.tagline);
      break;
    default:
      break;
  }

  next.strategy = strategy;
  next.voice = voice;
  return next;
}

function applyToneAction(
  profile: BrandProfile,
  action: string
): BrandProfile {
  const next = { ...profile, updatedAt: now() };
  const map: Record<string, BrandPersonality[]> = {
    make_professional: ['Professional'],
    make_premium: ['Luxury', 'Minimal'],
    make_futuristic: ['Futuristic', 'Technical'],
    make_playful: ['Playful', 'Friendly'],
  };
  const newPersonality = map[action];
  if (newPersonality) {
    next.personality = newPersonality;
    const input: BrandInput = {
      brandName: next.brandName,
      description: next.description,
      industry: next.industry,
      targetAudience: next.targetAudience,
      personality: next.personality,
      visualDirection: next.visualDirection,
      keywords: next.keywords,
    };
    const freshStrategy = buildStrategy(input);
    const freshTagline = buildTagline(input);
    const freshVoice = buildVoice(input, freshStrategy);
    // Preserve approved strategy / voice fields and never wipe visual identity
    const s = { ...profile.strategy };
    const v = { ...profile.voice };
    const ap = profile.approvedSections || {};
    if (!ap.positioning) s.positioning = freshStrategy.positioning;
    if (!ap.mission) s.mission = freshStrategy.mission;
    if (!ap.vision) s.vision = freshStrategy.vision;
    if (!ap.brandStory) s.brandStory = freshStrategy.brandStory;
    if (!ap.targetAudience) s.targetAudienceDetail = freshStrategy.targetAudienceDetail;
    if (!ap.personality) s.personalityDetail = freshStrategy.personalityDetail;
    if (!ap.coreValues) s.coreValues = freshStrategy.coreValues;
    if (!ap.messagingPrinciples) {
      s.messagingPrinciples = freshStrategy.messagingPrinciples;
      v.messagingPrinciples = freshStrategy.messagingPrinciples;
    }
    if (!ap.tagline) next.tagline = freshTagline;
    if (!ap.toneOfVoice) v.tone = freshVoice.tone;
    if (!ap.writingStyle) v.writingStyle = freshVoice.writingStyle;
    if (!ap.wordsToUse) v.wordsToUse = freshVoice.wordsToUse;
    if (!ap.wordsToAvoid) v.wordsToAvoid = freshVoice.wordsToAvoid;
    if (!ap.exampleVoice) v.exampleVoice = freshVoice.exampleVoice;
    if (!ap.shortBio) v.shortBio = freshVoice.shortBio;
    if (!ap.longDescription) v.longDescription = freshVoice.longDescription;
    if (!ap.socialBio) v.socialBio = freshVoice.socialBio;
    next.strategy = s;
    next.voice = v;
    next.summary = buildSummary(input, s, next.tagline);
    // visualIdentity intentionally unchanged — identity refinements use dedicated actions
  }
  return next;
}

export class MockAIProvider implements AIProvider {
  readonly name = 'mock-dev';
  readonly isConfigured = true; // always available for local development
  readonly supportsImageGeneration = false; // no image vendor configured

  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    // Simulate realistic latency
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 900));

    try {
      switch (request.action) {
        case 'create_brand': {
          if (!request.input?.brandName?.trim()) {
            return {
              success: false,
              error: 'Brand name is required.',
              provider: this.name,
            };
          }
          const profile = createProfileFromInput(request.input);
          return { success: true, profile, provider: this.name };
        }

        case 'regenerate_section':
        case 'refine_section': {
          if (!request.brand || !request.section) {
            return {
              success: false,
              error: 'Brand profile and section are required.',
              provider: this.name,
            };
          }
          const profile = regenerateSection(
            request.brand,
            request.section,
            request.instruction
          );
          return { success: true, profile, provider: this.name };
        }

        case 'make_professional':
        case 'make_premium':
        case 'make_futuristic':
        case 'make_playful':
        case 'improve_brand':
        case 'rewrite': {
          if (!request.brand) {
            return {
              success: false,
              error: 'Brand profile is required.',
              provider: this.name,
            };
          }
          const profile = applyToneAction(request.brand, request.action);
          return { success: true, profile, provider: this.name };
        }

        case 'generate_alternatives': {
          if (!request.brand && !request.input) {
            return {
              success: false,
              error: 'Brand or input required.',
              provider: this.name,
            };
          }
          const baseInput: BrandInput = request.input || {
            brandName: request.brand!.brandName,
            description: request.brand!.description,
            industry: request.brand!.industry,
            targetAudience: request.brand!.targetAudience,
            personality: request.brand!.personality,
            visualDirection: request.brand!.visualDirection,
            keywords: request.brand!.keywords,
          };
          const count = request.alternativesCount ?? 3;
          const alternatives: BrandProfile[] = [];
          for (let i = 0; i < count; i++) {
            alternatives.push(createProfileFromInput(baseInput));
          }
          return {
            success: true,
            profile: alternatives[0],
            alternatives,
            provider: this.name,
          };
        }

        case 'explain_why': {
          if (!request.brand) {
            return {
              success: false,
              error: 'Brand profile is required.',
              provider: this.name,
            };
          }
          const p = request.brand;
          const explanation = `This brand was shaped around a ${joinPersonality(p.personality).toLowerCase()} personality and a ${p.visualDirection.toLowerCase()} visual direction. Positioning, mission, and voice all reinforce the same core idea so the brand stays coherent as it grows. Approved sections are preserved so intentional decisions are not overwritten.`;
          return {
            success: true,
            profile: p,
            explanation,
            provider: this.name,
          };
        }


        case 'generate_identity': {
          if (!request.brand) {
            return { success: false, error: 'Brand profile is required.', provider: this.name };
          }
          const profile: BrandProfile = {
            ...request.brand,
            visualIdentity: buildFullIdentity(request.brand),
            status: 'identity_ready',
            updatedAt: now(),
          };
          return { success: true, profile, provider: this.name };
        }

        case 'generate_logo_concepts': {
          if (!request.brand) {
            return { success: false, error: 'Brand profile is required.', provider: this.name };
          }
          let base = ensureIdentity(request.brand);
          const colors = base.visualIdentity!.colors;
          const logo = buildLogoSystem(base, colors);
          // Preserve approved concept if any
          if (base.visualIdentity?.logo?.approvedConceptId) {
            const approved = base.visualIdentity.logo.concepts.find(
              (c) => c.id === base.visualIdentity!.logo.approvedConceptId
            );
            if (approved) {
              logo.concepts = [approved, ...logo.concepts.filter((c) => c.id !== approved.id)];
              logo.approvedConceptId = approved.id;
              logo.selectedConceptId = approved.id;
            }
          }
          const profile: BrandProfile = {
            ...base,
            visualIdentity: { ...base.visualIdentity!, logo },
            updatedAt: now(),
          };
          return { success: true, profile, provider: this.name };
        }

        case 'generate_colors': {
          if (!request.brand) {
            return { success: false, error: 'Brand profile is required.', provider: this.name };
          }
          let base = ensureIdentity(request.brand);
          if (base.approvedSections.colors || base.visualIdentity?.colors?.approved) {
            return {
              success: true,
              profile: base,
              explanation: 'Colors are approved and were preserved.',
              provider: this.name,
            };
          }
          const instruction = (request.instruction || '').toLowerCase();
          const colors = buildColorSystem(base, {
            premium: instruction.includes('premium'),
            energetic: instruction.includes('energetic'),
            darker: instruction.includes('dark'),
            lighter: instruction.includes('light'),
            moreContrast: instruction.includes('contrast'),
            lessSat: instruction.includes('saturation') || instruction.includes('minimal'),
          });
          colors.version = (base.visualIdentity?.colors?.version || 0) + 1;
          const profile: BrandProfile = {
            ...base,
            visualIdentity: { ...base.visualIdentity!, colors },
            updatedAt: now(),
          };
          return { success: true, profile, provider: this.name };
        }

        case 'generate_typography': {
          if (!request.brand) {
            return { success: false, error: 'Brand profile is required.', provider: this.name };
          }
          let base = ensureIdentity(request.brand);
          if (base.approvedSections.typography || base.visualIdentity?.typography?.approved) {
            return {
              success: true,
              profile: base,
              explanation: 'Typography is approved and was preserved.',
              provider: this.name,
            };
          }
          const stronger = (request.instruction || '').toLowerCase().includes('strong');
          const typography = buildTypography(base, stronger);
          const profile: BrandProfile = {
            ...base,
            visualIdentity: { ...base.visualIdentity!, typography },
            updatedAt: now(),
          };
          return { success: true, profile, provider: this.name };
        }

        case 'generate_visual_direction': {
          if (!request.brand) {
            return { success: false, error: 'Brand profile is required.', provider: this.name };
          }
          let base = ensureIdentity(request.brand);
          if (base.approvedSections.visualDirectionDetail || base.visualIdentity?.visualDirectionDetail?.approved) {
            return {
              success: true,
              profile: base,
              explanation: 'Visual direction is approved and was preserved.',
              provider: this.name,
            };
          }
          const visualDirectionDetail = buildVisualDirectionDetail(base);
          const profile: BrandProfile = {
            ...base,
            visualIdentity: { ...base.visualIdentity!, visualDirectionDetail },
            updatedAt: now(),
          };
          return { success: true, profile, provider: this.name };
        }

        case 'make_minimal':
        case 'increase_contrast':
        case 'make_darker':
        case 'make_lighter':
        case 'reduce_saturation':
        case 'make_typography_stronger': {
          if (!request.brand) {
            return { success: false, error: 'Brand profile is required.', provider: this.name };
          }
          let base = ensureIdentity(request.brand);
          const action = request.action;
          if (action === 'make_typography_stronger') {
            if (!base.approvedSections.typography && !base.visualIdentity?.typography?.approved) {
              base = {
                ...base,
                visualIdentity: {
                  ...base.visualIdentity!,
                  typography: buildTypography(base, true),
                },
                updatedAt: now(),
              };
            }
          } else if (!base.approvedSections.colors && !base.visualIdentity?.colors?.approved) {
            const colors = buildColorSystem(base, {
              premium: action === 'make_minimal',
              lessSat: action === 'make_minimal' || action === 'reduce_saturation',
              moreContrast: action === 'increase_contrast',
              darker: action === 'make_darker',
              lighter: action === 'make_lighter',
            });
            colors.version = (base.visualIdentity?.colors?.version || 0) + 1;
            // regenerate logo SVG to match new palette
            const logo = buildLogoSystem(base, colors);
            if (base.visualIdentity?.logo?.approvedConceptId) {
              logo.approvedConceptId = base.visualIdentity.logo.approvedConceptId;
            }
            base = {
              ...base,
              visualIdentity: { ...base.visualIdentity!, colors, logo },
              updatedAt: now(),
            };
          }
          return { success: true, profile: base, provider: this.name };
        }


        default:
          return {
            success: false,
            error: `Action "${request.action}" is not implemented in the development provider.`,
            provider: this.name,
          };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown generation error',
        provider: this.name,
      };
    }
  }

  async generateAsset(request: AssetGenerateRequest): Promise<AssetGenerateResponse> {
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 600));
    try {
      const asset = createAssetFromTemplate(request.context, request.preset, {
        instruction: request.instruction,
        refine: request.refineAction || request.instruction,
        existing: request.asset,
      });
      return {
        success: true,
        asset,
        version: asset.versions[asset.versions.length - 1],
        provider: this.name,
        usedTemplate: true,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Asset generation failed',
        provider: this.name,
      };
    }
  }
}
