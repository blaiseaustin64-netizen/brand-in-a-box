import { useBrand } from '../../store/BrandContext';
import './VisualDirectionStudio.css';

const FIELDS: { key: keyof import('../../types/brand').VisualDirectionDetail; label: string }[] = [
  { key: 'designLanguage', label: 'Design language' },
  { key: 'shapeLanguage', label: 'Shape language' },
  { key: 'photographyDirection', label: 'Photography' },
  { key: 'illustrationDirection', label: 'Illustration' },
  { key: 'iconStyle', label: 'Icon style' },
  { key: 'texture', label: 'Texture' },
  { key: 'lighting', label: 'Lighting' },
  { key: 'composition', label: 'Composition' },
  { key: 'spacingPersonality', label: 'Spacing' },
  { key: 'uiStyle', label: 'UI style' },
];

export function VisualDirectionStudio() {
  const { brand, isGenerating, runAction, approveIdentityPart } = useBrand();
  const vd = brand?.visualIdentity?.visualDirectionDetail;

  if (!vd) {
    return (
      <div className="vd-empty">
        <p>No visual direction detail yet.</p>
        <button
          type="button"
          className="identity__primary-btn"
          disabled={isGenerating}
          onClick={() => runAction('generate_visual_direction')}
        >
          Generate visual direction
        </button>
      </div>
    );
  }

  return (
    <div className="vd-studio">
      <div className="vd-studio__toolbar">
        <div className="vd-studio__toolbar-left">
          <h2>Visual direction</h2>
          <span className="vd-studio__tag">{brand?.visualDirection}</span>
          {vd.approved && <span className="vd-studio__approved">Approved</span>}
        </div>
        <div className="vd-studio__toolbar-actions">
          <button
            type="button"
            disabled={isGenerating || vd.approved}
            onClick={() => runAction('generate_visual_direction')}
          >
            Regenerate
          </button>
          {!vd.approved && (
            <button
              type="button"
              className="vd-studio__approve"
              disabled={isGenerating}
              onClick={() => approveIdentityPart('visualDirectionDetail')}
            >
              Approve direction
            </button>
          )}
        </div>
      </div>

      {vd.summary && <p className="vd-studio__summary">{vd.summary}</p>}

      <div className="vd-studio__grid">
        {FIELDS.map((f) => (
          <article key={f.key} className="vd-studio__card">
            <h3>{f.label}</h3>
            <p>{String(vd[f.key] || '—')}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
