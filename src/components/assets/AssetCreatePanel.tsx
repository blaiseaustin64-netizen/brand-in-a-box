import { useState, useEffect } from 'react';
import { fetchAiHealth } from '../../services/ai';
import { useBrand } from '../../store/BrandContext';
import {
  ASSET_CATEGORIES,
  ASSET_PRESETS,
  presetsByCategory,
} from '../../services/assets/presets';
import type { AssetCategory } from '../../types/brand';
import './AssetCreatePanel.css';

interface Props {
  onClose: () => void;
  onCreated: (assetId: string) => void;
}

export function AssetCreatePanel({ onClose, onCreated }: Props) {
  const { generateAsset, isGeneratingAsset, brand } = useBrand();
  const [category, setCategory] = useState<AssetCategory | 'all'>('social');
  const [presetId, setPresetId] = useState('ig-post');
  const [instruction, setInstruction] = useState('');
  const [imgConfigured, setImgConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    void fetchAiHealth().then((h) => setImgConfigured(h.workersAiConfigured));
  }, []);

  const presets = presetsByCategory(category);

  const handleGenerate = async () => {
    const asset = await generateAsset(presetId, instruction.trim() || undefined);
    if (asset) onCreated(asset.id);
  };

  const selected = ASSET_PRESETS.find((p) => p.id === presetId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="acp-backdrop" onClick={onClose}>
      <div
        className="acp"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Create asset"
      >
        <header className="acp__header">
          <h2>Generate asset</h2>
          <button type="button" className="acp__close" onClick={onClose}>
            ×
          </button>
        </header>

        <p className="acp__context">
          Context loaded from <strong>{brand?.brandName}</strong>
          {brand?.visualIdentity ? ' + visual identity' : ''}. You do not need
          to re-enter brand details.
        </p>

        {imgConfigured === false && (
          <div className="acp__notice">
            Workers AI is not available in this deployment. Social/campaign
            presets will use branded SVG templates. Business cards and stationery
            always use editable templates.
          </div>
        )}
        {imgConfigured === true && (
          <div className="acp__notice acp__notice--ok">
            Raster image generation is available via Cloudflare Workers AI for
            social and campaign visuals. Logos remain procedural SVG. Business
            assets stay template-based.
          </div>
        )}

        <div className="acp__cats">
          {ASSET_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={category === c.id ? 'active' : ''}
              onClick={() => {
                setCategory(c.id);
                const list = presetsByCategory(c.id);
                if (list[0]) setPresetId(list[0].id);
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="acp__presets">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`acp__preset ${presetId === p.id ? 'acp__preset--active' : ''}`}
              onClick={() => setPresetId(p.id)}
            >
              <span className="acp__preset-name">{p.name}</span>
              <span className="acp__preset-dim">
                {p.aspectLabel} · {p.width}×{p.height}
              </span>
              <span className="acp__preset-desc">{p.description}</span>
            </button>
          ))}
        </div>

        {selected && (
          <p className="acp__selected-meta">
            Selected: {selected.name} ({selected.width}×{selected.height})
          </p>
        )}

        <label className="acp__instruction">
          <span>Optional instruction</span>
          <textarea
            rows={2}
            placeholder="e.g. Emphasize the tagline, keep layout minimal…"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            maxLength={300}
          />
        </label>

        <footer className="acp__footer">
          <button type="button" className="acp__cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="acp__go"
            disabled={isGeneratingAsset || !presetId}
            onClick={handleGenerate}
          >
            {isGeneratingAsset ? 'Generating…' : 'Generate'}
          </button>
        </footer>
      </div>
    </div>
  );
}
