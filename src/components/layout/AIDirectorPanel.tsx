import { useBrand } from '../../store/BrandContext';
import type { BrandDirectorAction } from '../../types/brand';
import './AIDirectorPanel.css';

const QUICK_ACTIONS: { action: BrandDirectorAction; label: string }[] = [
  { action: 'make_premium', label: 'More premium' },
  { action: 'make_futuristic', label: 'More futuristic' },
  { action: 'make_minimal', label: 'More minimal' },
  { action: 'make_playful', label: 'More playful' },
  { action: 'increase_contrast', label: 'More contrast' },
  { action: 'make_typography_stronger', label: 'Stronger type' },
  { action: 'generate_identity', label: 'Generate identity' },
  { action: 'explain_why', label: 'Explain why' },
];

export function AIDirectorPanel() {
  const {
    brand,
    isGenerating,
    directorMessage,
    error,
    clearError,
    runAction,
    mobileDirectorOpen,
    toggleMobileDirector,
    providerName,
  } = useBrand();

  if (!brand) return null;

  return (
    <>
      {mobileDirectorOpen && (
        <div
          className="director-backdrop"
          onClick={toggleMobileDirector}
          aria-hidden
        />
      )}
      <aside
        className={`director ${mobileDirectorOpen ? 'director--open' : ''}`}
        aria-label="AI Brand Director"
      >
        <header className="director__header">
          <div className="director__title-row">
            <div className="director__pulse" data-active={isGenerating} />
            <h2 className="director__title">AI Brand Director</h2>
          </div>
          <p className="director__subtitle">
            Context-aware · Provider: {providerName}
          </p>
        </header>

        <div className="director__body">
          {error && (
            <div className="director__error" role="alert">
              <span>{error}</span>
              <button type="button" onClick={clearError} aria-label="Dismiss">
                ×
              </button>
            </div>
          )}

          <div className="director__status">
            {isGenerating ? (
              <div className="director__generating">
                <div className="director__spinner" />
                <p>{directorMessage || 'Working…'}</p>
              </div>
            ) : directorMessage ? (
              <p className="director__message animate-in">{directorMessage}</p>
            ) : (
              <p className="director__message director__message--muted">
                Select a section to refine, or use a quick action below. Approved
                sections stay locked.
              </p>
            )}
          </div>

          <div className="director__actions">
            <p className="director__actions-label">Quick actions</p>
            <div className="director__action-grid">
              {QUICK_ACTIONS.map(({ action, label }) => (
                <button
                  key={action}
                  type="button"
                  className="director__action"
                  disabled={isGenerating}
                  onClick={() => runAction(action)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="director__context">
            <p className="director__context-label">Active context</p>
            <ul className="director__context-list">
              <li>
                <span>Personality</span>
                <strong>{brand.personality.join(' · ')}</strong>
              </li>
              <li>
                <span>Visual</span>
                <strong>{brand.visualDirection}</strong>
              </li>
              <li>
                <span>Industry</span>
                <strong>{brand.industry || '—'}</strong>
              </li>
              <li>
                <span>Approved</span>
                <strong>
                  {Object.keys(brand.approvedSections).length || 'None yet'}
                </strong>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
}
