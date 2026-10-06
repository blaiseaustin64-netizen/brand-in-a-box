import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type {
  BrandProfile,
  BrandInput,
  BrandSectionKey,
  BrandDirectorAction,
  BrandAsset,
} from '../types/brand';
import * as brandService from '../services/brandService';
import * as assetService from '../services/assets/assetService';

type ViewId =
  | 'create'
  | 'overview'
  | 'strategy'
  | 'voice'
  | 'identity'
  | 'colors'
  | 'typography'
  | 'assets'
  | 'social'
  | 'business'
  | 'website'
  | 'export'
  | 'guidelines';

interface BrandState {
  brand: BrandProfile | null;
  view: ViewId;
  isGenerating: boolean;
  error: string | null;
  directorMessage: string | null;
  providerName: string;
  providerConfigured: boolean;
  mobileNavOpen: boolean;
  mobileDirectorOpen: boolean;
  assets: BrandAsset[];
  isGeneratingAsset: boolean;
  assetError: string | null;
}

type Action =
  | { type: 'SET_BRAND'; payload: BrandProfile | null }
  | { type: 'SET_VIEW'; payload: ViewId }
  | { type: 'SET_GENERATING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DIRECTOR_MESSAGE'; payload: string | null }
  | { type: 'SET_MOBILE_NAV'; payload: boolean }
  | { type: 'SET_MOBILE_DIRECTOR'; payload: boolean }
  | { type: 'SET_ASSETS'; payload: BrandAsset[] }
  | { type: 'SET_GENERATING_ASSET'; payload: boolean }
  | { type: 'SET_ASSET_ERROR'; payload: string | null };

const initialState: BrandState = {
  brand: null,
  view: 'create',
  isGenerating: false,
  error: null,
  directorMessage: null,
  providerName: 'mock-dev',
  providerConfigured: true,
  mobileNavOpen: false,
  mobileDirectorOpen: false,
  assets: [],
  isGeneratingAsset: false,
  assetError: null,
};

function reducer(state: BrandState, action: Action): BrandState {
  switch (action.type) {
    case 'SET_BRAND':
      return { ...state, brand: action.payload };
    case 'SET_VIEW':
      return {
        ...state,
        view: action.payload,
        mobileNavOpen: false,
      };
    case 'SET_GENERATING':
      return { ...state, isGenerating: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_DIRECTOR_MESSAGE':
      return { ...state, directorMessage: action.payload };
    case 'SET_MOBILE_NAV':
      return { ...state, mobileNavOpen: action.payload };
    case 'SET_MOBILE_DIRECTOR':
      return { ...state, mobileDirectorOpen: action.payload };
    case 'SET_ASSETS':
      return { ...state, assets: action.payload };
    case 'SET_GENERATING_ASSET':
      return { ...state, isGeneratingAsset: action.payload };
    case 'SET_ASSET_ERROR':
      return { ...state, assetError: action.payload };
    default:
      return state;
  }
}

interface BrandContextValue extends BrandState {
  setView: (view: ViewId) => void;
  createBrand: (input: BrandInput) => Promise<void>;
  regenerateSection: (section: BrandSectionKey, instruction?: string) => Promise<void>;
  runAction: (action: BrandDirectorAction, instruction?: string) => Promise<void>;
  approveSection: (section: BrandSectionKey) => void;
  updateSection: (
    path: 'strategy' | 'voice' | 'root',
    key: string,
    value: string | string[]
  ) => void;
  clearError: () => void;
  resetBrand: () => void;
  toggleMobileNav: () => void;
  toggleMobileDirector: () => void;
  generateIdentity: () => Promise<void>;
  selectLogoConcept: (conceptId: string) => void;
  approveIdentityPart: (part: 'logo' | 'colors' | 'typography' | 'visualDirectionDetail') => void;
  generateAsset: (presetId: string, instruction?: string) => Promise<BrandAsset | null>;
  refineAsset: (assetId: string, refineAction?: string, instruction?: string) => Promise<void>;
  approveAsset: (assetId: string) => void;
  restoreAssetVersion: (assetId: string, versionId: string) => void;
  deleteAsset: (assetId: string) => void;
  downloadAsset: (assetId: string, versionId?: string) => void;
  clearAssetError: () => void;
}

const BrandContext = createContext<BrandContextValue | null>(null);

export function BrandProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const saved = brandService.loadBrand();
    if (saved) {
      dispatch({ type: 'SET_BRAND', payload: saved });
      dispatch({ type: 'SET_VIEW', payload: 'overview' });
      dispatch({ type: 'SET_ASSETS', payload: assetService.loadAssets(saved.id) });
    }
  }, []);

  const setView = useCallback((view: ViewId) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  }, []);

  const createBrand = useCallback(async (input: BrandInput) => {
    dispatch({ type: 'SET_GENERATING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({
      type: 'SET_DIRECTOR_MESSAGE',
      payload: 'Understanding your idea…',
    });

    try {
      // staged messaging for the creation flow
      const stages = [
        'Understanding your idea…',
        'Shaping strategy…',
        'Defining personality…',
        'Crafting voice…',
        'Assembling brand…',
      ];
      let stageIdx = 0;
      const interval = setInterval(() => {
        stageIdx = Math.min(stageIdx + 1, stages.length - 1);
        dispatch({ type: 'SET_DIRECTOR_MESSAGE', payload: stages[stageIdx] });
      }, 700);

      const response = await brandService.createBrand(input);
      clearInterval(interval);

      if (!response.success || !response.profile) {
        dispatch({
          type: 'SET_ERROR',
          payload: response.error || 'Failed to create brand.',
        });
        dispatch({ type: 'SET_DIRECTOR_MESSAGE', payload: null });
        return;
      }

      dispatch({ type: 'SET_BRAND', payload: response.profile });
      dispatch({ type: 'SET_ASSETS', payload: [] });
      dispatch({ type: 'SET_VIEW', payload: 'overview' });
      dispatch({
        type: 'SET_DIRECTOR_MESSAGE',
        payload: 'Brand foundation ready. Review strategy and voice, then refine.',
      });
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Unexpected error',
      });
      dispatch({ type: 'SET_DIRECTOR_MESSAGE', payload: null });
    } finally {
      dispatch({ type: 'SET_GENERATING', payload: false });
    }
  }, []);

  const regenerateSection = useCallback(
    async (section: BrandSectionKey, instruction?: string) => {
      if (!state.brand) return;
      dispatch({ type: 'SET_GENERATING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({
        type: 'SET_DIRECTOR_MESSAGE',
        payload: `Refining ${section.replace(/([A-Z])/g, ' $1').toLowerCase()}…`,
      });

      try {
        const response = await brandService.regenerateSection(
          state.brand,
          section,
          instruction
        );
        if (!response.success || !response.profile) {
          dispatch({
            type: 'SET_ERROR',
            payload: response.error || 'Regeneration failed.',
          });
          return;
        }
        dispatch({ type: 'SET_BRAND', payload: response.profile });
        dispatch({
          type: 'SET_DIRECTOR_MESSAGE',
          payload: 'Section updated. Approve when it feels right.',
        });
      } catch (err) {
        dispatch({
          type: 'SET_ERROR',
          payload: err instanceof Error ? err.message : 'Unexpected error',
        });
      } finally {
        dispatch({ type: 'SET_GENERATING', payload: false });
      }
    },
    [state.brand]
  );

  const runAction = useCallback(
    async (action: BrandDirectorAction, instruction?: string) => {
      if (!state.brand) return;
      dispatch({ type: 'SET_GENERATING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({
        type: 'SET_DIRECTOR_MESSAGE',
        payload: 'Working on your brand…',
      });

      try {
        const response = await brandService.runDirectorAction(
          state.brand,
          action,
          instruction
        );
        if (!response.success) {
          dispatch({
            type: 'SET_ERROR',
            payload: response.error || 'Action failed.',
          });
          return;
        }
        if (response.profile) {
          dispatch({ type: 'SET_BRAND', payload: response.profile });
        }
        if (response.explanation) {
          dispatch({
            type: 'SET_DIRECTOR_MESSAGE',
            payload: response.explanation,
          });
        } else {
          dispatch({
            type: 'SET_DIRECTOR_MESSAGE',
            payload: 'Brand updated.',
          });
        }
      } catch (err) {
        dispatch({
          type: 'SET_ERROR',
          payload: err instanceof Error ? err.message : 'Unexpected error',
        });
      } finally {
        dispatch({ type: 'SET_GENERATING', payload: false });
      }
    },
    [state.brand]
  );

  const approveSection = useCallback(
    (section: BrandSectionKey) => {
      if (!state.brand) return;
      const next = brandService.approveSection(state.brand, section);
      dispatch({ type: 'SET_BRAND', payload: next });
      dispatch({
        type: 'SET_DIRECTOR_MESSAGE',
        payload: `Approved. This section will be preserved on future regenerations.`,
      });
    },
    [state.brand]
  );

  const updateSection = useCallback(
    (path: 'strategy' | 'voice' | 'root', key: string, value: string | string[]) => {
      if (!state.brand) return;
      const next = brandService.updateSectionText(state.brand, path, key, value);
      dispatch({ type: 'SET_BRAND', payload: next });
    },
    [state.brand]
  );

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const resetBrand = useCallback(() => {
    brandService.clearBrand();
    dispatch({ type: 'SET_BRAND', payload: null });
    dispatch({ type: 'SET_ASSETS', payload: [] });
    dispatch({ type: 'SET_VIEW', payload: 'create' });
    dispatch({ type: 'SET_DIRECTOR_MESSAGE', payload: null });
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const toggleMobileNav = useCallback(() => {
    dispatch({ type: 'SET_MOBILE_NAV', payload: !state.mobileNavOpen });
  }, [state.mobileNavOpen]);

  const toggleMobileDirector = useCallback(() => {
    dispatch({
      type: 'SET_MOBILE_DIRECTOR',
      payload: !state.mobileDirectorOpen,
    });
  }, [state.mobileDirectorOpen]);


  const generateIdentity = useCallback(async () => {
    if (!state.brand) return;
    dispatch({ type: 'SET_GENERATING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({
      type: 'SET_DIRECTOR_MESSAGE',
      payload: 'Building visual identity…',
    });
    try {
      const stages = [
        'Reading brand strategy…',
        'Composing color system…',
        'Selecting typography…',
        'Defining visual direction…',
        'Drafting logo concepts…',
      ];
      let i = 0;
      const interval = setInterval(() => {
        i = Math.min(i + 1, stages.length - 1);
        dispatch({ type: 'SET_DIRECTOR_MESSAGE', payload: stages[i] });
      }, 500);
      const response = await brandService.runDirectorAction(
        state.brand,
        'generate_identity'
      );
      clearInterval(interval);
      if (!response.success || !response.profile) {
        dispatch({
          type: 'SET_ERROR',
          payload: response.error || 'Identity generation failed.',
        });
        return;
      }
      dispatch({ type: 'SET_BRAND', payload: response.profile });
      dispatch({
        type: 'SET_DIRECTOR_MESSAGE',
        payload: 'Visual identity ready. Review logo, colors, and type.',
      });
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Unexpected error',
      });
    } finally {
      dispatch({ type: 'SET_GENERATING', payload: false });
    }
  }, [state.brand]);

  const selectLogoConcept = useCallback(
    (conceptId: string) => {
      if (!state.brand) return;
      const next = brandService.selectLogoConcept(state.brand, conceptId);
      dispatch({ type: 'SET_BRAND', payload: next });
    },
    [state.brand]
  );

  const approveIdentityPart = useCallback(
    (part: 'logo' | 'colors' | 'typography' | 'visualDirectionDetail') => {
      if (!state.brand) return;
      const next = brandService.approveIdentityPart(state.brand, part);
      dispatch({ type: 'SET_BRAND', payload: next });
      dispatch({
        type: 'SET_DIRECTOR_MESSAGE',
        payload: `${part === 'visualDirectionDetail' ? 'Visual direction' : part} approved.`,
      });
    },
    [state.brand]
  );


  const generateAsset = useCallback(
    async (presetId: string, instruction?: string) => {
      if (!state.brand) return null;
      dispatch({ type: 'SET_GENERATING_ASSET', payload: true });
      dispatch({ type: 'SET_ASSET_ERROR', payload: null });
      dispatch({
        type: 'SET_DIRECTOR_MESSAGE',
        payload: 'Preparing brand context…',
      });
      try {
        const stages = [
          'Preparing brand context…',
          'Creating concept…',
          'Generating asset…',
          'Refining…',
        ];
        let i = 0;
        const interval = setInterval(() => {
          i = Math.min(i + 1, stages.length - 1);
          dispatch({ type: 'SET_DIRECTOR_MESSAGE', payload: stages[i] });
        }, 450);
        const response = await assetService.generateAsset(
          state.brand,
          state.assets,
          presetId,
          instruction
        );
        clearInterval(interval);
        if (!response.success || !response.asset) {
          dispatch({
            type: 'SET_ASSET_ERROR',
            payload: response.error || 'Asset generation failed.',
          });
          dispatch({ type: 'SET_DIRECTOR_MESSAGE', payload: null });
          return null;
        }
        const next = [response.asset, ...state.assets];
        assetService.persistAssets(state.brand.id, next);
        dispatch({ type: 'SET_ASSETS', payload: next });
        dispatch({
          type: 'SET_DIRECTOR_MESSAGE',
          payload: response.usedTemplate
            ? 'Asset ready (branded template — image provider not configured).'
            : 'Asset ready.',
        });
        return response.asset;
      } catch (err) {
        dispatch({
          type: 'SET_ASSET_ERROR',
          payload: err instanceof Error ? err.message : 'Unexpected error',
        });
        return null;
      } finally {
        dispatch({ type: 'SET_GENERATING_ASSET', payload: false });
      }
    },
    [state.brand, state.assets]
  );

  const refineAsset = useCallback(
    async (assetId: string, refineAction?: string, instruction?: string) => {
      if (!state.brand) return;
      const asset = state.assets.find((a) => a.id === assetId);
      if (!asset) return;
      dispatch({ type: 'SET_GENERATING_ASSET', payload: true });
      dispatch({ type: 'SET_ASSET_ERROR', payload: null });
      try {
        const response = await assetService.refineAsset(
          state.brand,
          state.assets,
          asset,
          refineAction,
          instruction
        );
        if (!response.success || !response.asset) {
          dispatch({
            type: 'SET_ASSET_ERROR',
            payload: response.error || 'Refine failed.',
          });
          return;
        }
        const next = state.assets.map((a) =>
          a.id === assetId ? response.asset! : a
        );
        assetService.persistAssets(state.brand.id, next);
        dispatch({ type: 'SET_ASSETS', payload: next });
        dispatch({ type: 'SET_DIRECTOR_MESSAGE', payload: 'Asset updated.' });
      } catch (err) {
        dispatch({
          type: 'SET_ASSET_ERROR',
          payload: err instanceof Error ? err.message : 'Unexpected error',
        });
      } finally {
        dispatch({ type: 'SET_GENERATING_ASSET', payload: false });
      }
    },
    [state.brand, state.assets]
  );

  const approveAsset = useCallback(
    (assetId: string) => {
      if (!state.brand) return;
      const next = state.assets.map((a) =>
        a.id === assetId ? assetService.approveAsset(a) : a
      );
      assetService.persistAssets(state.brand.id, next);
      dispatch({ type: 'SET_ASSETS', payload: next });
      dispatch({ type: 'SET_DIRECTOR_MESSAGE', payload: 'Asset approved.' });
    },
    [state.brand, state.assets]
  );

  const restoreAssetVersion = useCallback(
    (assetId: string, versionId: string) => {
      if (!state.brand) return;
      const next = state.assets.map((a) =>
        a.id === assetId ? assetService.restoreVersion(a, versionId) : a
      );
      assetService.persistAssets(state.brand.id, next);
      dispatch({ type: 'SET_ASSETS', payload: next });
    },
    [state.brand, state.assets]
  );

  const deleteAsset = useCallback(
    (assetId: string) => {
      if (!state.brand) return;
      const next = assetService.deleteAsset(state.assets, assetId);
      assetService.persistAssets(state.brand.id, next);
      dispatch({ type: 'SET_ASSETS', payload: next });
    },
    [state.brand, state.assets]
  );

  const downloadAsset = useCallback(
    (assetId: string, versionId?: string) => {
      const asset = state.assets.find((a) => a.id === assetId);
      if (!asset) return;
      try {
        assetService.downloadAssetVersion(asset, versionId);
      } catch (err) {
        dispatch({
          type: 'SET_ASSET_ERROR',
          payload: err instanceof Error ? err.message : 'Download failed',
        });
      }
    },
    [state.assets]
  );

  const clearAssetError = useCallback(() => {
    dispatch({ type: 'SET_ASSET_ERROR', payload: null });
  }, []);

  const value: BrandContextValue = {
    ...state,
    setView,
    createBrand,
    regenerateSection,
    runAction,
    approveSection,
    updateSection,
    clearError,
    resetBrand,
    toggleMobileNav,
    toggleMobileDirector,
    generateIdentity,
    selectLogoConcept,
    approveIdentityPart,
    generateAsset,
    refineAsset,
    approveAsset,
    restoreAssetVersion,
    deleteAsset,
    downloadAsset,
    clearAssetError,
  };

  return (
    <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
  );
}

export function useBrand(): BrandContextValue {
  const ctx = useContext(BrandContext);
  if (!ctx) {
    throw new Error('useBrand must be used within BrandProvider');
  }
  return ctx;
}

export type { ViewId };
