import { useState, useEffect } from 'react';
import { useBrand } from '../../store/BrandContext';
import {
  ASSET_CATEGORIES,
  ASSET_PRESETS,
  presetsByCategory,
} from '../../services/assets/presets';
import type { AssetCategory } from '../../types/brand';
import { getAIProvider } from '../../services/ai';
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
  const provider = getAIProvider();
  const supportsImg = Boolean(provider.supportsImageGeneration);

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

        {!supportsImg && (
          <div className="acp__notice">
            Raster image generation is not configured. Assets are produced as
            branded SVG templates from your palette, type, and voice — honest
            system outputs, not fake AI photos.
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
