/**
 * Brand service — single entry point for brand operations.
 * UI components should call this rather than the AI provider directly.
 */

import { getAIProvider } from './ai';
import type {
  BrandProfile,
  BrandInput,
  BrandSectionKey,
  BrandDirectorAction,
  AIGenerateResponse,
} from '../types/brand';

const STORAGE_KEY = 'vexdyn_brand_in_a_box_profile';

function pushHistory(brand: BrandProfile, label: string): BrandProfile {
  const { history, ...rest } = brand;
  const snap = {
    at: new Date().toISOString(),
    label,
    profile: structuredClone(rest),
  };
  const prev = history || [];
  return {
    ...brand,
    history: [...prev.slice(-9), snap],
  };
}

export function loadBrand(): BrandProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BrandProfile;
  } catch {
    return null;
  }
}

export function saveBrand(profile: BrandProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Storage full or unavailable — non-fatal
  }
}

export function clearBrand(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export async function createBrand(input: BrandInput): Promise<AIGenerateResponse> {
  const provider = getAIProvider();
  const response = await provider.generate({
    action: 'create_brand',
    input,
  });
  if (response.success && response.profile) {
    saveBrand(response.profile);
  }
  return response;
}

export async function regenerateSection(
  brand: BrandProfile,
  section: BrandSectionKey,
  instruction?: string
): Promise<AIGenerateResponse> {
  const provider = getAIProvider();
  const response = await provider.generate({
    action: 'regenerate_section',
    brand,
    section,
    instruction,
  });
  if (response.success && response.profile) {
    saveBrand(response.profile);
  }
  return response;
}

export async function runDirectorAction(
  brand: BrandProfile,
  action: BrandDirectorAction,
  instruction?: string
): Promise<AIGenerateResponse> {
  const provider = getAIProvider();
  const response = await provider.generate({
    action,
    brand,
    instruction,
  });
  if (response.success && response.profile) {
    saveBrand(response.profile);
  }
  return response;
}

export function approveSection(
  brand: BrandProfile,
  section: BrandSectionKey
): BrandProfile {
  let next: BrandProfile = {
    ...brand,
    approvedSections: { ...brand.approvedSections, [section]: true },
    updatedAt: new Date().toISOString(),
  };
  next = pushHistory(next, `Approved ${section}`);
  saveBrand(next);
  return next;
}

export function unapproveSection(
  brand: BrandProfile,
  section: BrandSectionKey
): BrandProfile {
  const approved = { ...brand.approvedSections };
  delete approved[section];
  const next: BrandProfile = {
    ...brand,
    approvedSections: approved,
    updatedAt: new Date().toISOString(),
  };
  saveBrand(next);
  return next;
}

export function updateSectionText(
  brand: BrandProfile,
  path: 'strategy' | 'voice' | 'root',
  key: string,
  value: string | string[]
): BrandProfile {
  const next = structuredClone(brand);
  next.updatedAt = new Date().toISOString();

  if (path === 'root') {
    (next as Record<string, unknown>)[key] = value;
  } else if (path === 'strategy') {
    (next.strategy as Record<string, unknown>)[key] = value;
  } else if (path === 'voice') {
    (next.voice as Record<string, unknown>)[key] = value;
  }

  saveBrand(next);
  return next;
}

/** Serialize for future NYVEN / export */
export function serializeBrand(brand: BrandProfile): string {
  const { history, ...rest } = brand;
  return JSON.stringify(rest, null, 2);
}

/** Update visual identity slice and persist */
export function updateVisualIdentity(
  brand: BrandProfile,
  visualIdentity: BrandProfile['visualIdentity']
): BrandProfile {
  const next: BrandProfile = {
    ...brand,
    visualIdentity,
    updatedAt: new Date().toISOString(),
    status:
      visualIdentity?.colors?.palette?.length
        ? 'identity_ready'
        : brand.status,
  };
  saveBrand(next);
  return next;
}

export function approveIdentityPart(
  brand: BrandProfile,
  part: 'logo' | 'colors' | 'typography' | 'visualDirectionDetail'
): BrandProfile {
  const vi = brand.visualIdentity;
  if (!vi) return brand;

  const nextVi = { ...vi };
  if (part === 'logo' && nextVi.logo) {
    nextVi.logo = {
      ...nextVi.logo,
      approvedConceptId: nextVi.logo.selectedConceptId || nextVi.logo.concepts[0]?.id,
      concepts: nextVi.logo.concepts.map((c) => ({
        ...c,
        isApproved: c.id === (nextVi.logo!.selectedConceptId || nextVi.logo!.concepts[0]?.id),
      })),
    };
  }
  if (part === 'colors' && nextVi.colors) {
    nextVi.colors = { ...nextVi.colors, approved: true };
  }
  if (part === 'typography' && nextVi.typography) {
    nextVi.typography = { ...nextVi.typography, approved: true };
  }
  if (part === 'visualDirectionDetail' && nextVi.visualDirectionDetail) {
    nextVi.visualDirectionDetail = {
      ...nextVi.visualDirectionDetail,
      approved: true,
    };
  }

  const sectionKey =
    part === 'visualDirectionDetail' ? 'visualDirectionDetail' : part;

  const next: BrandProfile = {
    ...brand,
    visualIdentity: nextVi,
    approvedSections: { ...brand.approvedSections, [sectionKey]: true },
    updatedAt: new Date().toISOString(),
  };
  saveBrand(next);
  return next;
}

export function selectLogoConcept(
  brand: BrandProfile,
  conceptId: string
): BrandProfile {
  const vi = brand.visualIdentity;
  if (!vi?.logo) return brand;
  const next: BrandProfile = {
    ...brand,
    visualIdentity: {
      ...vi,
      logo: {
        ...vi.logo,
        selectedConceptId: conceptId,
        concepts: vi.logo.concepts.map((c) => ({
          ...c,
          isSelected: c.id === conceptId,
        })),
      },
    },
    updatedAt: new Date().toISOString(),
  };
  saveBrand(next);
  return next;
}
