/**
 * Brand Profile — central source of truth for Brand-in-a-Box.
 * Designed to be serializable for future NYVEN Agents / Forge consumption.
 * Extend freely; optional fields keep backward compatibility.
 */

export type BrandPersonality =
  | 'Modern'
  | 'Bold'
  | 'Minimal'
  | 'Luxury'
  | 'Playful'
  | 'Professional'
  | 'Futuristic'
  | 'Friendly'
  | 'Technical'
  | 'Creative';

export type VisualDirection =
  | 'Minimal'
  | 'Dark Tech'
  | 'Luxury'
  | 'Editorial'
  | 'Corporate'
  | 'Futuristic'
  | 'Organic'
  | 'Playful';

export type BrandSectionKey =
  | 'positioning'
  | 'mission'
  | 'vision'
  | 'brandStory'
  | 'targetAudience'
  | 'personality'
  | 'coreValues'
  | 'messagingPrinciples'
  | 'toneOfVoice'
  | 'writingStyle'
  | 'wordsToUse'
  | 'wordsToAvoid'
  | 'exampleVoice'
  | 'shortBio'
  | 'longDescription'
  | 'socialBio'
  | 'tagline'
  | 'summary'
  // Phase 2 — Visual Identity
  | 'logo'
  | 'colors'
  | 'typography'
  | 'visualDirectionDetail'
  | 'identity';

export type BrandStatus =
  | 'draft'
  | 'generating'
  | 'strategy_ready'
  | 'voice_ready'
  | 'identity_pending'
  | 'identity_ready'
  | 'complete';

export interface BrandInput {
  brandName: string;
  description: string;
  industry: string;
  targetAudience: string;
  personality: BrandPersonality[];
  visualDirection: VisualDirection;
  keywords: string[];
  additionalNotes?: string;
}

/** Core brand strategy fields */
export interface BrandStrategy {
  positioning: string;
  mission: string;
  vision: string;
  brandStory: string;
  targetAudienceDetail: string;
  personalityDetail: string;
  coreValues: string[];
  messagingPrinciples: string[];
}

/** Brand voice fields */
export interface BrandVoice {
  tone: string;
  writingStyle: string;
  wordsToUse: string[];
  wordsToAvoid: string[];
  messagingPrinciples: string[];
  exampleVoice: string;
  shortBio: string;
  longDescription: string;
  socialBio: string;
}

/* ─── Phase 2: Visual Identity ─────────────────────────────────────────── */

export type LogoRole =
  | 'primary'
  | 'secondary'
  | 'mark'
  | 'monogram'
  | 'wordmark'
  | 'favicon';

export type LogoAssetStatus = 'empty' | 'generating' | 'processing' | 'ready' | 'failed';

/**
 * Logo asset metadata. Image generation is optional.
 * When no image provider is configured, concepts use structured
 * SVG descriptors (monogram/wordmark) — never fake AI images.
 */
export interface LogoConcept {
  id: string;
  label: string;
  role: LogoRole;
  status: LogoAssetStatus;
  /** Optional remote/generated image URL */
  imageUrl?: string;
  /** SVG markup for procedural monogram / wordmark previews */
  svgMarkup?: string;
  /** Short design rationale from the AI Director */
  rationale?: string;
  createdAt: string;
  isSelected?: boolean;
  isApproved?: boolean;
}

export interface LogoSystem {
  concepts: LogoConcept[];
  selectedConceptId?: string;
  approvedConceptId?: string;
  /** Active role being edited in the studio */
  activeRole: LogoRole;
  lastGeneratedAt?: string;
  generationNote?: string;
}

export interface ColorToken {
  id: string;
  name: string;
  role:
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'background'
    | 'surface'
    | 'surfaceElevated'
    | 'text'
    | 'muted'
    | 'border'
    | 'overlay'
    | 'success'
    | 'warning'
    | 'error'
    | 'primaryContrast'
    | 'secondaryContrast';
  hex: string;
  usage: string;
  /** Relative luminance 0–1 for contrast helpers */
  luminance?: number;
}

export interface ColorSystem {
  palette: ColorToken[];
  approved: boolean;
  version: number;
  notes?: string;
}

export interface TypeScaleEntry {
  name: string;
  size: string;
  weight: number;
  lineHeight: string;
  letterSpacing?: string;
}

export interface TypographySystem {
  displayFont: string;
  headingFont: string;
  bodyFont: string;
  uiFont: string;
  monoFont: string;
  weights: number[];
  scale: TypeScaleEntry[];
  /** CSS stack strings for previews */
  displayStack: string;
  headingStack: string;
  bodyStack: string;
  uiStack: string;
  monoStack: string;
  approved: boolean;
  googleFontsQuery?: string;
  notes?: string;
}

export interface VisualDirectionDetail {
  designLanguage: string;
  shapeLanguage: string;
  photographyDirection: string;
  illustrationDirection: string;
  iconStyle: string;
  texture: string;
  lighting: string;
  composition: string;
  spacingPersonality: string;
  uiStyle: string;
  summary: string;
  approved: boolean;
}

export interface VisualIdentity {
  logo: LogoSystem;
  colors: ColorSystem;
  typography: TypographySystem;
  visualDirectionDetail: VisualDirectionDetail;
  /** ISO timestamp of last identity generation */
  generatedAt?: string;
}

export interface BrandProfile {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: BrandStatus;

  // Input / foundation
  brandName: string;
  industry: string;
  description: string;
  targetAudience: string;
  personality: BrandPersonality[];
  visualDirection: VisualDirection;
  keywords: string[];
  additionalNotes?: string;

  // Generated strategy
  tagline: string;
  summary: string;
  strategy: BrandStrategy;

  // Generated voice
  voice: BrandVoice;

  // Phase 2 — Visual Identity
  visualIdentity?: VisualIdentity;

  // Approval tracking — approved sections are preserved on regeneration
  approvedSections: Partial<Record<BrandSectionKey, boolean>>;

  // Lightweight version history for undo
  history?: BrandProfileSnapshot[];
}

export interface BrandProfileSnapshot {
  at: string;
  label: string;
  profile: Omit<BrandProfile, 'history'>;
}

/** Actions the AI Brand Director can perform */
export type BrandDirectorAction =
  | 'create_brand'
  | 'improve_brand'
  | 'rewrite'
  | 'make_professional'
  | 'make_premium'
  | 'make_futuristic'
  | 'make_playful'
  | 'generate_alternatives'
  | 'explain_why'
  | 'regenerate_section'
  | 'refine_section'
  | 'keep_version'
  | 'undo'
  // Phase 2 identity actions
  | 'generate_identity'
  | 'generate_logo_concepts'
  | 'generate_colors'
  | 'generate_typography'
  | 'generate_visual_direction'
  | 'make_minimal'
  | 'increase_contrast'
  | 'make_darker'
  | 'make_lighter'
  | 'reduce_saturation'
  | 'make_typography_stronger';

export interface AIGenerateRequest {
  action: BrandDirectorAction;
  brand?: BrandProfile;
  input?: BrandInput;
  section?: BrandSectionKey;
  instruction?: string;
  alternativesCount?: number;
}

export interface AIGenerateResponse {
  success: boolean;
  profile?: BrandProfile;
  alternatives?: BrandProfile[];
  explanation?: string;
  error?: string;
  provider: string;
}

export interface AIProvider {
  readonly name: string;
  readonly isConfigured: boolean;
  /** Optional: true when provider can return image assets */
  readonly supportsImageGeneration?: boolean;
  generate(request: AIGenerateRequest): Promise<AIGenerateResponse>;
}

/* ─── Phase 3: AI Asset Studio ─────────────────────────────────────────── */

export type AssetCategory =
  | 'social'
  | 'business'
  | 'website'
  | 'marketing'
  | 'graphics'
  | 'backgrounds'
  | 'icons'
  | 'patterns'
  | 'other';

export type AssetStatus = 'draft' | 'generating' | 'generated' | 'approved' | 'failed' | 'archived';

export type AssetFormat = 'svg' | 'png' | 'jpg' | 'webp' | 'pdf';

export interface AssetPreset {
  id: string;
  name: string;
  category: AssetCategory;
  type: string;
  width: number;
  height: number;
  aspectLabel: string;
  description: string;
  /** Whether this preset can be satisfied with procedural SVG templates */
  supportsTemplate: boolean;
  /** Whether this preset ideally needs raster image generation */
  prefersImageGeneration: boolean;
}

export interface AssetVersion {
  id: string;
  version: number;
  createdAt: string;
  prompt?: string;
  instruction?: string;
  /** SVG markup when template-based */
  svgMarkup?: string;
  /** Data URL or remote URL when image-based */
  imageUrl?: string;
  format: AssetFormat;
  width: number;
  height: number;
  status: AssetStatus;
  notes?: string;
}

export interface BrandAsset {
  id: string;
  brandId: string;
  name: string;
  type: string;
  category: AssetCategory;
  presetId: string;
  prompt: string;
  generationContextSummary: string;
  width: number;
  height: number;
  format: AssetFormat;
  source: 'template' | 'image_provider' | 'upload';
  status: AssetStatus;
  approved: boolean;
  approvedVersionId?: string;
  currentVersionId: string;
  versions: AssetVersion[];
  createdAt: string;
  updatedAt: string;
  thumbnailSvg?: string;
}

/** Serializable context passed to asset generation — reusable for Forge / NYVEN later */
export interface AssetGenerationContext {
  brandId: string;
  brandName: string;
  tagline: string;
  industry: string;
  description: string;
  targetAudience: string;
  personality: BrandPersonality[];
  visualDirection: VisualDirection;
  keywords: string[];
  positioning: string;
  tone: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
  };
  typography: {
    display: string;
    heading: string;
    body: string;
  };
  visualDirectionSummary: string;
  logoSvg?: string;
  approvedAssetHints: string[];
}

export interface AssetGenerateRequest {
  action:
    | 'generate_asset'
    | 'regenerate_asset'
    | 'refine_asset'
    | 'vary_asset';
  context: AssetGenerationContext;
  preset: AssetPreset;
  asset?: BrandAsset;
  instruction?: string;
  refineAction?:
    | 'more_minimal'
    | 'more_premium'
    | 'more_futuristic'
    | 'more_professional'
    | 'more_bold'
    | 'improve_composition'
    | 'improve_contrast'
    | 'change_background'
    | 'change_layout';
}

export interface AssetGenerateResponse {
  success: boolean;
  asset?: BrandAsset;
  version?: AssetVersion;
  error?: string;
  provider: string;
  /** True when the provider could only produce a template, not a raster image */
  usedTemplate?: boolean;
}

/** Extended provider capability for Phase 3 assets */
export interface AssetCapableProvider extends AIProvider {
  generateAsset?(request: AssetGenerateRequest): Promise<AssetGenerateResponse>;
}

/* ─── Phase 4: Export + Forge ──────────────────────────────────────────── */

export interface DesignTokens {
  colors: Record<string, string>;
  typography: {
    fonts: Record<string, string>;
    weights: number[];
    scale: Array<{
      name: string;
      size: string;
      weight: number;
      lineHeight: string;
      letterSpacing?: string;
    }>;
  };
  spacing: Record<string, string>;
  radius: Record<string, string>;
  effects: {
    shadows: Record<string, string>;
    borders: Record<string, string>;
    blur?: Record<string, string>;
    gradients?: Record<string, string>;
  };
  components?: {
    button: Record<string, string>;
    card: Record<string, string>;
    input: Record<string, string>;
  };
}

/** Stable asset role map for Forge / external consumers */
export interface AssetRoleMap {
  'logo.primary'?: string;
  'logo.secondary'?: string;
  'logo.icon'?: string;
  'logo.monogram'?: string;
  'logo.wordmark'?: string;
  'logo.favicon'?: string;
  [key: `assets.${string}`]: string | undefined;
}

export interface BrandGuidelinesFoundation {
  logoUsage: string;
  colorUsage: string;
  typographyUsage: string;
  spacingUsage: string;
  visualDirection: string;
  voiceUsage: string;
  imageryDirection: string;
  assetUsage: string;
}

export interface BrandPackageMetadata {
  packageVersion: string;
  brandId: string;
  brandName: string;
  exportedAt: string;
  source: 'brand-in-a-box';
  schemaVersion: '1.0';
  hasVisualIdentity: boolean;
  approvedAssetCount: number;
  totalAssetCount: number;
}

export interface BrandPackage {
  version: string;
  metadata: BrandPackageMetadata;
  brand: {
    id: string;
    brandName: string;
    industry: string;
    description: string;
    targetAudience: string;
    personality: BrandPersonality[];
    visualDirection: VisualDirection;
    keywords: string[];
    tagline: string;
    summary: string;
    status: BrandStatus;
  };
  strategy: BrandStrategy;
  voice: BrandVoice;
  visualIdentity?: VisualIdentity;
  designTokens: DesignTokens;
  assets: BrandAsset[];
  assetRoles: AssetRoleMap;
  guidelines: BrandGuidelinesFoundation;
  approvedSections: Partial<Record<BrandSectionKey, boolean>>;
}

export interface PackageValidationIssue {
  level: 'error' | 'warning';
  code: string;
  message: string;
}

export interface PackageValidationResult {
  valid: boolean;
  canExport: boolean;
  issues: PackageValidationIssue[];
}

export interface ForgePayload {
  schemaVersion: '1.0';
  source: 'brand-in-a-box';
  packageVersion: string;
  brandId: string;
  brandName: string;
  designTokens: DesignTokens;
  visualDirection: VisualDirection;
  visualDirectionDetail?: VisualDirectionDetail;
  colors: Record<string, string>;
  typography: DesignTokens['typography'];
  logos: Array<{ role: string; svgMarkup?: string; format: string }>;
  approvedAssets: Array<{
    id: string;
    role: string;
    type: string;
    category: string;
    width: number;
    height: number;
    format: string;
    svgMarkup?: string;
  }>;
  voice: { tone: string; writingStyle: string };
  tagline: string;
  exportedAt: string;
}

export interface ForgeHandoffResult {
  success: boolean;
  configured: boolean;
  payload?: ForgePayload;
  error?: string;
  message?: string;
}
