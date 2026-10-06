import { useBrand } from '../../store/BrandContext';
import { computeBrandReadiness } from '../../services/readiness/brandReadiness';
import './BrandOverview.css';

export function BrandOverview() {
  const { brand, assets, setView } = useBrand();
  if (!brand) return null;
  const readiness = computeBrandReadiness(brand, assets);

  const approvedCount = Object.keys(brand.approvedSections).length;
  const statusLabel: Record<string, string> = {
    draft: 'Draft',
    generating: 'Generating',
    strategy_ready: 'Strategy ready',
    voice_ready: 'Voice ready',
    identity_pending: 'Identity pending',
    complete: 'Complete',
  };

  return (
    <div className="overview animate-in">
      <header className="overview__hero">
        <div className="overview__hero-top">
          <span className="overview__status">
            {statusLabel[brand.status] || brand.status}
          </span>
          <span className="overview__meta">
            {approvedCount} section{approvedCount === 1 ? '' : 's'} approved
          </span>
        </div>
        <h1 className="overview__name">{brand.brandName}</h1>
        {brand.tagline && (
          <p className="overview__tagline">{brand.tagline}</p>
        )}
        {brand.summary && (
          <p className="overview__summary">{brand.summary}</p>
        )}
      </header>

      <div className="overview__readiness" aria-label="Brand readiness">
        <div className="overview__readiness-top">
          <span>Brand readiness</span>
          <strong>{readiness.score}%</strong>
        </div>
        <div className="overview__readiness-bar" role="progressbar" aria-valuenow={readiness.score} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${readiness.score}%` }} />
        </div>
        <ul className="overview__readiness-list">
          {readiness.items.map((item) => (
            <li key={item.id} data-complete={item.complete}>
              {item.detail}
            </li>
          ))}
        </ul>
      </div>

      <div className="overview__grid">
        <div className="overview__card">
          <h3>Industry</h3>
          <p>{brand.industry || '—'}</p>
        </div>
        <div className="overview__card">
          <h3>Audience</h3>
          <p>{brand.targetAudience || '—'}</p>
        </div>
        <div className="overview__card">
          <h3>Personality</h3>
          <div className="overview__chips">
            {brand.personality.map((p) => (
              <span key={p} className="overview__chip">
                {p}
              </span>
            ))}
          </div>
        </div>
        <div className="overview__card">
          <h3>Visual direction</h3>
          <p>{brand.visualDirection}</p>
        </div>
      </div>

      {brand.keywords.length > 0 && (
        <div className="overview__keywords">
          <h3>Keywords</h3>
          <div className="overview__chips">
            {brand.keywords.map((k) => (
              <span key={k} className="overview__chip overview__chip--muted">
                {k}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="overview__actions">
        <button
          type="button"
          className="overview__cta"
          onClick={() => setView('strategy')}
        >
          Review strategy
        </button>
        <button
          type="button"
          className="overview__cta overview__cta--ghost"
          onClick={() => setView('voice')}
        >
          Review voice
        </button>
        <button
          type="button"
          className="overview__cta overview__cta--ghost"
          onClick={() => setView('identity')}
        >
          Visual identity
        </button>
        <button
          type="button"
          className="overview__cta overview__cta--ghost"
          onClick={() => setView('export')}
        >
          Export
        </button>
      </div>

      {brand.description && (
        <div className="overview__desc">
          <h3>Original brief</h3>
          <p>{brand.description}</p>
        </div>
      )}
    </div>
  );
}
