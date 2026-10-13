/**
 * Identity refinement routing + outcome tests (no TS path resolution issues).
 * Run: node scripts/verify-identity-refine.mjs
 */
import assert from 'node:assert/strict';
import { isProceduralIdentityAction } from '../src/services/ai/capabilityStatus.ts';

// Director identity buttons must be treated as procedural identity actions
for (const action of [
  'generate_identity',
  'make_premium',
  'make_futuristic',
  'make_playful',
  'make_minimal',
  'increase_contrast',
  'make_typography_stronger',
]) {
  assert.equal(
    isProceduralIdentityAction(action),
    true,
    `${action} must route to procedural identity engine`
  );
}

// Text-only actions must NOT be procedural identity
for (const action of ['create_brand', 'explain_why', 'regenerate_section']) {
  assert.equal(
    isProceduralIdentityAction(action),
    false,
    `${action} must not be classified as procedural identity`
  );
}

// Premium must not be mislabeled as OpenRouter-only text
assert.notEqual(isProceduralIdentityAction('make_premium'), false);

console.log('verify-identity-refine: routing assertions passed');
console.log(
  'Note: full refineVisualIdentity behavior is covered by TypeScript build + manual UI; import of generateIdentity.ts requires bundler resolution.'
);
