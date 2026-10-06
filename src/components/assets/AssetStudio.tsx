import { useMemo, useState } from 'react';
import { useBrand } from '../../store/BrandContext';
import {
  ASSET_CATEGORIES,
} from '../../services/assets/presets';
import type { AssetCategory, BrandAsset } from '../../types/brand';
import { AssetCreatePanel } from './AssetCreatePanel';
import { AssetDetail } from './AssetDetail';
import './AssetStudio.css';

type Filter = AssetCategory | 'all' | 'approved' | 'recent';

export function AssetStudio() {
  const {
    brand,
    assets,
    isGeneratingAsset,
    assetError,
    clearAssetError,
  } = useBrand();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const hasIdentity = Boolean(brand?.visualIdentity?.colors?.palette?.length);

  const filtered = useMemo(() => {
    let list = assets.filter((a) => a.status !== 'archived');
    if (filter === 'approved') list = list.filter((a) => a.approved);
    else if (filter === 'recent')
      list = [...list].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    else if (filter !== 'all')
      list = list.filter((a) => a.category === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.type.toLowerCase().includes(q) ||
          a.category.includes(q)
      );
    }
    return list;
  }, [assets, filter, search]);

  const selected = assets.find((a) => a.id === selectedId) || null;

  if (!brand) return null;

  return (
    <div className="asset-studio animate-in">
      <header className="asset-studio__header">
        <div>
          <h1>AI Asset Studio</h1>
          <p>
            Generate brand-consistent assets from your profile and visual
            identity — not isolated one-off images.
          </p>
        </div>
        <button
          type="button"
          className="asset-studio__primary"
          disabled={!hasIdentity || isGeneratingAsset}
          onClick={() => setShowCreate(true)}
          title={
            hasIdentity
              ? 'Create asset'
              : 'Generate a visual identity first'
          }
        >
          Generate asset
        </button>
      </header>

      {!hasIdentity && (
        <div className="asset-studio__banner">
          Generate a visual identity (colors, type, logo) before creating
          assets so outputs stay on-brand.
        </div>
      )}

      {assetError && (
        <div className="asset-studio__error" role="alert">
          <span>{assetError}</span>
          <button type="button" onClick={clearAssetError}>
            Dismiss
          </button>
        </div>
      )}

      <div className="asset-studio__toolbar">
        <div className="asset-studio__filters">
          <button
            type="button"
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className={filter === 'recent' ? 'active' : ''}
            onClick={() => setFilter('recent')}
          >
            Recent
          </button>
          <button
            type="button"
            className={filter === 'approved' ? 'active' : ''}
            onClick={() => setFilter('approved')}
          >
            Approved
          </button>
          {ASSET_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
            <button
              key={c.id}
              type="button"
              className={filter === c.id ? 'active' : ''}
              onClick={() => setFilter(c.id as Filter)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <input
          className="asset-studio__search"
          placeholder="Search assets…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="asset-studio__layout">
        <div className="asset-studio__library">
          {filtered.length === 0 ? (
            <div className="asset-studio__empty">
              <h2>No assets yet</h2>
              <p>
                Pick a preset — Instagram, business card, hero, pattern — and
                generate from your brand context.
              </p>
              <button
                type="button"
                className="asset-studio__primary"
                disabled={!hasIdentity}
                onClick={() => setShowCreate(true)}
              >
                Create first asset
              </button>
            </div>
          ) : (
            <div className="asset-studio__grid">
              {filtered.map((a) => (
                <AssetCard
                  key={a.id}
                  asset={a}
                  selected={a.id === selectedId}
                  onSelect={() => setSelectedId(a.id)}
                />
              ))}
            </div>
          )}
        </div>

        {selected && (
          <AssetDetail
            asset={selected}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>

      {showCreate && (
        <AssetCreatePanel
          onClose={() => setShowCreate(false)}
          onCreated={(id) => {
            setShowCreate(false);
            setSelectedId(id);
          }}
        />
      )}
    </div>
  );
}

function AssetCard({
  asset,
  selected,
  onSelect,
}: {
  asset: BrandAsset;
  selected: boolean;
  onSelect: () => void;
}) {
  const ver =
    asset.versions.find((v) => v.id === asset.currentVersionId) ||
    asset.versions[asset.versions.length - 1];

  return (
    <button
      type="button"
      className={`asset-card ${selected ? 'asset-card--selected' : ''} ${
        asset.approved ? 'asset-card--approved' : ''
      }`}
      onClick={onSelect}
    >
      <div className="asset-card__preview">
        {ver?.svgMarkup ? (
          <div
            className="asset-card__svg"
            dangerouslySetInnerHTML={{ __html: ver.svgMarkup }}
          />
        ) : (
          <span className="asset-card__missing">{asset.status}</span>
        )}
      </div>
      <div className="asset-card__meta">
        <span className="asset-card__name">{asset.name}</span>
        <span className="asset-card__sub">
          {asset.category} · {asset.width}×{asset.height}
          {asset.approved ? ' · Approved' : ''}
        </span>
      </div>
    </button>
  );
}
