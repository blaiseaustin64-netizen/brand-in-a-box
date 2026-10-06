import { useState } from 'react';
import { useBrand } from '../../store/BrandContext';
import './LogoStudio.css';

type BgMode = 'dark' | 'light' | 'brand' | 'transparent';

export function LogoStudio() {
  const {
    brand,
    isGenerating,
    runAction,
    selectLogoConcept,
    approveIdentityPart,
  } = useBrand();
  const logo = brand?.visualIdentity?.logo;
  const colors = brand?.visualIdentity?.colors;
  const [bg, setBg] = useState<BgMode>('dark');

  if (!logo) {
    return (
      <div className="logo-empty">
        <p>No logo concepts yet.</p>
        <button
          type="button"
          className="identity__primary-btn"
          disabled={isGenerating}
          onClick={() => runAction('generate_logo_concepts')}
        >
          Generate logo concepts
        </button>
      </div>
    );
  }

  const selected =
    logo.concepts.find((c) => c.id === logo.selectedConceptId) ||
    logo.concepts[0];

  const brandBg =
    colors?.palette.find((c) => c.role === 'primary')?.hex || '#62E6FF';

  const canvasStyle: import("react").CSSProperties = {
    background:
      bg === 'dark'
        ? '#0A0C10'
        : bg === 'light'
          ? '#F5F6F8'
          : bg === 'brand'
            ? brandBg
            : 'repeating-conic-gradient(#2a2e36 0% 25%, #1a1d24 0% 50%) 50% / 16px 16px',
  };

  return (
    <div className="logo-studio">
      <div className="logo-studio__canvas-wrap">
        <div className="logo-studio__canvas" style={canvasStyle}>
          {selected?.status === 'generating' || selected?.status === 'processing' ? (
            <div className="logo-studio__state">Generating…</div>
          ) : selected?.status === 'failed' ? (
            <div className="logo-studio__state logo-studio__state--fail">
              Generation failed
            </div>
          ) : selected?.svgMarkup ? (
            <div
              className="logo-studio__svg"
              dangerouslySetInnerHTML={{ __html: selected.svgMarkup }}
            />
          ) : (
            <div className="logo-studio__state">No preview available</div>
          )}
        </div>

        <div className="logo-studio__bg-controls">
          {(['dark', 'light', 'brand', 'transparent'] as BgMode[]).map((m) => (
            <button
              key={m}
              type="button"
              className={`logo-studio__bg-btn ${bg === m ? 'logo-studio__bg-btn--active' : ''}`}
              onClick={() => setBg(m)}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="logo-studio__controls">
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => runAction('generate_logo_concepts')}
          >
            Regenerate concepts
          </button>
          <button
            type="button"
            disabled={isGenerating || !selected}
            className="logo-studio__approve"
            onClick={() => approveIdentityPart('logo')}
          >
            {logo.approvedConceptId === selected?.id
              ? 'Approved'
              : 'Approve logo'}
          </button>
        </div>

        {logo.generationNote && (
          <p className="logo-studio__note">{logo.generationNote}</p>
        )}
      </div>

      <div className="logo-studio__concepts">
        <h3>Concepts</h3>
        <div className="logo-studio__concept-list">
          {logo.concepts.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`logo-studio__concept ${
                c.id === logo.selectedConceptId ? 'logo-studio__concept--selected' : ''
              } ${c.id === logo.approvedConceptId ? 'logo-studio__concept--approved' : ''}`}
              onClick={() => selectLogoConcept(c.id)}
            >
              <div className="logo-studio__concept-preview">
                {c.svgMarkup ? (
                  <div dangerouslySetInnerHTML={{ __html: c.svgMarkup }} />
                ) : (
                  <span className="logo-studio__concept-empty">{c.status}</span>
                )}
              </div>
              <div className="logo-studio__concept-meta">
                <span className="logo-studio__concept-label">{c.label}</span>
                <span className="logo-studio__concept-role">{c.role}</span>
              </div>
            </button>
          ))}
        </div>
        {selected?.rationale && (
          <p className="logo-studio__rationale">{selected.rationale}</p>
        )}
      </div>
    </div>
  );
}
