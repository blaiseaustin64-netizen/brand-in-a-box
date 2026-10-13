import { useEffect, useState } from 'react';
import { useBrand } from '../../store/BrandContext';
import type { BrandDirectorAction } from '../../types/brand';
import './AIDirectorPanel.css';
import { fetchAiHealth, type AiHealthStatus } from '../../services/ai';
import {
  formatTextConfiguredLine,
  formatTextLastLine,
  formatIdentityLine,
  formatImageConfiguredLine,
  formatImageLastLine,
} from '../../services/ai/capabilityStatus';

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
  const [aiStatus, setAiStatus] = useState<AiHealthStatus | null>(null);
  useEffect(() => {
    void fetchAiHealth(true).then(setAiStatus);
  }, []);
  const {
    brand,
    isGenerating,
    directorMessage,
    error,
    clearError,
    runAction,
    mobileDirectorOpen,
    toggleMobileDirector,
    capabilitySnapshot,
  } = useBrand();

  if (!brand) return null;

  const textConfigured = formatTextConfiguredLine({
    configured: Boolean(aiStatus?.openRouterConfigured),
    model: aiStatus?.openRouterModel,
  });
  const textLast = formatTextLastLine(capabilitySnapshot);
  const identityLine = formatIdentityLine(capabilitySnapshot);
  const imageConfigured = formatImageConfiguredLine({
    configured: Boolean(aiStatus?.workersAiConfigured),
    model: aiStatus?.imageModel,
  });
  const imageLast = formatImageLastLine(capabilitySnapshot);

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
          <p className="director__subtitle">Context-aware brand refinements</p>
          <div className="director__capabilities" role="status">
            <p className="director__cap-line">{textConfigured}</p>
            {textLast && (
              <p className="director__cap-line director__cap-line--last">
                {textLast}
              </p>
            )}
            <p className="director__cap-line">{identityLine}</p>
            <p className="director__cap-line">{imageConfigured}</p>
            {imageLast && (
              <p className="director__cap-line director__cap-line--last">
                {imageLast}
              </p>
            )}
          </div>
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
        </div>
      </aside>
    </>
  );
}
