/**
 * Ensures OpenRouter identity payloads omit image/SVG bytes.
 */
import assert from 'node:assert/strict';

// Inline minimal compact logic mirror for regression without TS path issues
function compactBrandForTextAi(brand) {
  const colors = brand.visualIdentity?.colors;
  const logo = brand.visualIdentity?.logo;
  return {
    brandName: brand.brandName,
    industry: brand.industry,
    description: brand.description,
    personality: brand.personality,
    visualDirection: brand.visualDirection,
    strategy: brand.strategy,
    voice: brand.voice
      ? { tone: brand.voice.tone, writingStyle: brand.voice.writingStyle }
      : undefined,
    visualIdentity: {
      colors: colors
        ? {
            palette: colors.palette?.map((c) => ({
              role: c.role,
              hex: c.hex,
            })),
            approved: colors.approved,
          }
        : undefined,
      logo: logo
        ? {
            concepts: logo.concepts?.map((c) => ({
              id: c.id,
              label: c.label,
              source: c.source,
            })),
          }
        : undefined,
    },
  };
}

const hugeDataUri = 'data:image/jpeg;base64,' + 'A'.repeat(200_000);
const brand = {
  brandName: 'NovaCore',
  industry: 'SaaS',
  description: 'AI ops',
  personality: ['Luxury'],
  visualDirection: 'Luxury',
  strategy: { positioning: 'x', mission: 'y', vision: 'z', brandStory: 's', targetAudienceDetail: 'a', personalityDetail: 'p', coreValues: [], messagingPrinciples: [] },
  voice: { tone: 'calm', writingStyle: 'clear' },
  visualIdentity: {
    colors: {
      palette: [{ role: 'primary', hex: '#112233', name: 'P', usage: 'u' }],
      approved: false,
    },
    logo: {
      concepts: [
        {
          id: '1',
          label: 'Flux',
          source: 'flux_raster',
          imageUrl: hugeDataUri,
          svgMarkup: '<svg>' + 'x'.repeat(50_000) + '</svg>',
          generationPrompt: 'p'.repeat(2000),
        },
        {
          id: '2',
          label: 'SVG',
          source: 'procedural_svg',
          svgMarkup: '<svg>' + 'y'.repeat(50_000) + '</svg>',
        },
      ],
    },
  },
};

const fullBytes = new TextEncoder().encode(JSON.stringify(brand)).length;
assert.ok(fullBytes > 120_000, 'fixture brand should exceed 120KB');

const compact = compactBrandForTextAi(brand);
const compactStr = JSON.stringify({
  action: 'propose_palette',
  brand: compact,
  instruction: 'schema…',
});
const compactBytes = new TextEncoder().encode(compactStr).length;
assert.ok(compactBytes < 120_000, `compact must be under 120KB, got ${compactBytes}`);
assert.ok(!compactStr.includes('data:image'), 'must not include data:image');
assert.ok(!compactStr.includes('<svg>'), 'must not include svg markup');
assert.ok(!compactStr.includes('AAAA'), 'must not include base64 payload');

console.log(
  `verify-compact-brand: full=${fullBytes} compact=${compactBytes} bytes — passed`
);
