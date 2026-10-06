import { useBrand } from '../../store/BrandContext';
import type { BrandAsset } from '../../types/brand';
import './AssetDetail.css';

const REFINE: { id: string; label: string }[] = [
  { id: 'more_minimal', label: 'More minimal' },
  { id: 'more_premium', label: 'More premium' },
  { id: 'more_futuristic', label: 'More futuristic' },
  { id: 'more_professional', label: 'More professional' },
  { id: 'more_bold', label: 'More bold' },
  { id: 'improve_composition', label: 'Improve composition' },
  { id: 'improve_contrast', label: 'Improve contrast' },
  { id: 'change_layout', label: 'Change layout' },
  { id: 'change_background', label: 'Change background' },
];

interface Props {
  asset: BrandAsset;
  onClose: () => void;
}

export function AssetDetail({ asset, onClose }: Props) {
  const {
    refineAsset,
    approveAsset,
    restoreAssetVersion,
    deleteAsset,
    downloadAsset,
    isGeneratingAsset,
  } = useBrand();

  const current =
    asset.versions.find((v) => v.id === asset.currentVersionId) ||
    asset.versions[asset.versions.length - 1];

  const aspect = asset.width / asset.height;
  const frameClass =
    aspect < 0.7 ? 'tall' : aspect > 1.6 ? 'wide' : aspect > 0.9 && aspect < 1.1 ? 'square' : 'standard';

  return (
    <aside className="asset-detail">
      <header className="asset-detail__header">
        <div>
          <h2>{asset.name}</h2>
          <p>
            {asset.category} · v{current?.version} · {asset.format.toUpperCase()}
            {asset.approved ? ' · Approved' : ''}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>

      <div className={`asset-detail__frame asset-detail__frame--${frameClass}`}>
        {current?.svgMarkup ? (
          <div
            className="asset-detail__svg"
            dangerouslySetInnerHTML={{ __html: current.svgMarkup }}
          />
        ) : (
          <div className="asset-detail__missing">
            {asset.status === 'failed'
              ? 'Generation failed'
              : 'No preview available'}
          </div>
        )}
      </div>

      {current?.notes && (
        <p className="asset-detail__notes">{current.notes}</p>
      )}

      <div className="asset-detail__actions">
        <button
          type="button"
          disabled={isGeneratingAsset}
          onClick={() => refineAsset(asset.id, undefined, 'regenerate')}
        >
          Regenerate
        </button>
        <button
          type="button"
          disabled={isGeneratingAsset}
          onClick={() => refineAsset(asset.id, 'change_layout')}
        >
          Variation
        </button>
        {!asset.approved && (
          <button
            type="button"
            className="asset-detail__approve"
            onClick={() => approveAsset(asset.id)}
          >
            Approve
          </button>
        )}
        <button type="button" onClick={() => downloadAsset(asset.id)}>
          Download SVG
        </button>
        <button
          type="button"
          className="asset-detail__danger"
          onClick={() => {
            if (window.confirm('Delete this asset?')) {
              deleteAsset(asset.id);
              onClose();
            }
          }}
        >
          Delete
        </button>
      </div>

      <div className="asset-detail__refine">
        <p className="asset-detail__label">Refine</p>
        <div className="asset-detail__refine-grid">
          {REFINE.map((r) => (
            <button
              key={r.id}
              type="button"
              disabled={isGeneratingAsset}
              onClick={() => refineAsset(asset.id, r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="asset-detail__versions">
        <p className="asset-detail__label">
          Versions ({asset.versions.length})
        </p>
        <ul>
          {[...asset.versions].reverse().map((v) => (
            <li key={v.id}>
              <button
                type="button"
                className={
                  v.id === asset.currentVersionId
                    ? 'asset-detail__ver--current'
                    : ''
                }
                onClick={() => restoreAssetVersion(asset.id, v.id)}
              >
                v{v.version}
                {v.id === asset.approvedVersionId ? ' · approved' : ''}
                {v.id === asset.currentVersionId ? ' · current' : ''}
              </button>
              <span>{new Date(v.createdAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="asset-detail__ctx">{asset.generationContextSummary}</p>
    </aside>
  );
}
