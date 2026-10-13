/**
 * Phase 1 capability status tests (no extra deps).
 * Run: npm test   OR   node scripts/verify-capability-status.mjs
 */
import assert from 'node:assert/strict';
import {
  initialCapabilitySnapshot,
  applyTextResult,
  applyIdentityResult,
  applyImageResult,
  normalizeProviderForAction,
  isProceduralIdentityAction,
  formatTextConfiguredLine,
  formatTextLastLine,
  formatIdentityLine,
  formatImageConfiguredLine,
  formatImageLastLine,
  IDENTITY_ENGINE_ID,
} from '../src/services/ai/capabilityStatus.ts';

// --- Scenario: Text AI succeeds, then identity is generated ---
let snap = initialCapabilitySnapshot();
snap = applyTextResult(snap, {
  success: true,
  provider: 'openrouter',
  model: 'nvidia/nemotron-3-super-120b-a12b:free',
});
assert.equal(snap.lastTextSuccess, true);
assert.equal(snap.lastTextProvider, 'openrouter');
assert.equal(snap.lastTextModel, 'nvidia/nemotron-3-super-120b-a12b:free');
assert.equal(snap.lastOperation, 'text');
assert.equal(snap.lastIdentitySuccess, null);

snap = applyIdentityResult(snap, true);
assert.equal(snap.lastIdentitySuccess, true);
assert.equal(snap.lastOperation, 'identity');
// Text status must NOT be wiped or replaced with mock-dev
assert.equal(snap.lastTextSuccess, true);
assert.equal(snap.lastTextProvider, 'openrouter');
assert.equal(snap.identityEngine, IDENTITY_ENGINE_ID);
assert.notEqual(snap.identityEngine, 'mock-dev');
assert.match(formatIdentityLine(snap), /Procedural identity engine/);
assert.match(formatTextLastLine(snap) || '', /openrouter/);

// --- Scenario: Text AI fails ---
snap = applyTextResult(snap, { success: false });
assert.equal(snap.lastTextSuccess, false);
assert.equal(snap.lastIdentitySuccess, true); // identity history preserved
assert.match(formatTextLastLine(snap) || '', /failed/);

// --- Scenario: Identity generation succeeds procedurally ---
assert.equal(isProceduralIdentityAction('generate_identity'), true);
assert.equal(isProceduralIdentityAction('create_brand'), false);
const n = normalizeProviderForAction('generate_identity', 'mock-dev');
assert.equal(n.provider, IDENTITY_ENGINE_ID);
assert.equal(n.isProcedural, true);
assert.equal(n.kind, 'identity');
assert.notEqual(n.provider, 'openrouter');
assert.notEqual(n.provider, 'mock-dev');

// --- Scenario: Workers AI is unavailable ---
assert.match(
  formatImageConfiguredLine({ configured: false }),
  /unavailable/
);
assert.match(
  formatImageConfiguredLine({
    configured: true,
    model: '@cf/black-forest-labs/flux-1-schnell',
  }),
  /Workers AI/
);

// --- Scenario: Image-generation request fails ---
snap = applyImageResult(snap, { success: false, source: null });
assert.equal(snap.lastImageSuccess, false);
assert.equal(snap.lastOperation, 'image');
assert.match(formatImageLastLine(snap) || '', /failed/);

// Template success must not be labeled as model image
snap = applyImageResult(snap, { success: true, source: 'template' });
assert.equal(snap.lastImageSource, 'template');
assert.match(formatImageLastLine(snap) || '', /template/);
assert.doesNotMatch(formatImageLastLine(snap) || '', /Workers AI image$/);

snap = applyImageResult(snap, { success: true, source: 'image_provider' });
assert.match(formatImageLastLine(snap) || '', /Workers AI image/);

// Configured ≠ last success
assert.match(
  formatTextConfiguredLine({
    configured: true,
    model: 'nvidia/nemotron-3-super-120b-a12b:free',
  }),
  /configured/
);

console.log('verify-capability-status: all assertions passed');
