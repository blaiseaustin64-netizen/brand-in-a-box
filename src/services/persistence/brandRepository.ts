/**
 * Brand persistence repository — localStorage implementation.
 * UI must not call localStorage directly; swap this module for a remote API later.
 *
 * Future backend mapping:
 * - listBrands()      → GET /api/brands
 * - getBrand(id)      → GET /api/brands/:id
 * - saveBrand(p)      → PUT /api/brands/:id
 * - deleteBrand(id)   → DELETE /api/brands/:id
 * - setActiveBrandId  → user preference / session
 * - ownerUserId       → from auth session (not used in local mode)
 *
 * Limitation: localStorage is per-browser/device; no cross-device sync or accounts yet.
 */

import type { BrandProfile } from '../../types/brand';

const LEGACY_KEY = 'vexdyn_brand_in_a_box_profile';
const INDEX_KEY = 'vexdyn_bib_brands_index_v1';
const BRAND_PREFIX = 'vexdyn_bib_brand_v1_';

export interface BrandListItem {
  id: string;
  brandName: string;
  industry: string;
  tagline?: string;
  status: string;
  updatedAt: string;
  createdAt: string;
}

interface BrandIndex {
  activeId: string | null;
  ids: string[];
  ownerUserId: string | null;
}

function readIndex(): BrandIndex {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BrandIndex;
      return {
        activeId: parsed.activeId ?? null,
        ids: Array.isArray(parsed.ids) ? parsed.ids : [],
        ownerUserId: parsed.ownerUserId ?? null,
      };
    }
  } catch {
    /* ignore */
  }
  return { activeId: null, ids: [], ownerUserId: null };
}

function writeIndex(index: BrandIndex): void {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {
    /* quota */
  }
}

function brandKey(id: string): string {
  return `${BRAND_PREFIX}${id}`;
}

export function migrateLegacyBrandIfNeeded(): void {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return;
    const index = readIndex();
    if (index.ids.length > 0) {
      localStorage.removeItem(LEGACY_KEY);
      return;
    }
    const profile = JSON.parse(legacy) as BrandProfile;
    if (!profile?.id) {
      localStorage.removeItem(LEGACY_KEY);
      return;
    }
    localStorage.setItem(brandKey(profile.id), JSON.stringify(profile));
    writeIndex({
      activeId: profile.id,
      ids: [profile.id],
      ownerUserId: null,
    });
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* leave legacy if parse fails */
  }
}

export function listBrands(): BrandListItem[] {
  migrateLegacyBrandIfNeeded();
  const index = readIndex();
  const items: BrandListItem[] = [];
  for (const id of index.ids) {
    const b = getBrand(id);
    if (!b) continue;
    items.push({
      id: b.id,
      brandName: b.brandName,
      industry: b.industry,
      tagline: b.tagline,
      status: b.status,
      updatedAt: b.updatedAt,
      createdAt: b.createdAt,
    });
  }
  items.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return items;
}

export function getBrand(id: string): BrandProfile | null {
  try {
    const raw = localStorage.getItem(brandKey(id));
    if (!raw) return null;
    return JSON.parse(raw) as BrandProfile;
  } catch {
    return null;
  }
}

export function getActiveBrandId(): string | null {
  migrateLegacyBrandIfNeeded();
  return readIndex().activeId;
}

export function setActiveBrandId(id: string | null): void {
  const index = readIndex();
  index.activeId = id;
  if (id && !index.ids.includes(id)) {
    index.ids = [id, ...index.ids];
  }
  writeIndex(index);
}

export function loadActiveBrand(): BrandProfile | null {
  migrateLegacyBrandIfNeeded();
  const id = getActiveBrandId();
  if (!id) return null;
  return getBrand(id);
}

export function saveBrand(profile: BrandProfile): void {
  if (!profile?.id) return;
  try {
    localStorage.setItem(brandKey(profile.id), JSON.stringify(profile));
    const index = readIndex();
    if (!index.ids.includes(profile.id)) {
      index.ids = [profile.id, ...index.ids];
    }
    index.activeId = profile.id;
    writeIndex(index);
  } catch {
    /* quota */
  }
}

export function deleteBrand(id: string): void {
  try {
    localStorage.removeItem(brandKey(id));
  } catch {
    /* ignore */
  }
  const index = readIndex();
  index.ids = index.ids.filter((x) => x !== id);
  if (index.activeId === id) {
    index.activeId = index.ids[0] || null;
  }
  writeIndex(index);
}

export function clearActiveBrandOnly(): void {
  const index = readIndex();
  index.activeId = null;
  writeIndex(index);
}

export const LEGACY_STORAGE_KEY = LEGACY_KEY;
