import { useEffect } from 'react';
import { useBrand } from '../../store/BrandContext';
import './BrandPreview.css';

export function BrandPreview() {
  const { brand } = useBrand();
  const vi = brand?.visualIdentity;
  const colors = vi?.colors;
  const type = vi?.typography;
  const logo = vi?.logo;

  useEffect(() => {
    if (!type?.googleFontsQuery) return;
    const id = 'bib-google-fonts';
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${type.googleFontsQuery}&display=swap`;
  }, [type?.googleFontsQuery]);

  if (!colors?.palette?.length) {
    return (
      <div className="preview-empty">
        <p>Generate a visual identity to see the live brand preview.</p>
      </div>
    );
  }

  const token = (role: string) =>
    colors.palette.find((c) => c.role === role)?.hex;

  const bg = token('background') || '#08090B';
  const surface = token('surface') || '#111318';
  const primary = token('primary') || '#62E6FF';
  const secondary = token('secondary') || '#8B5CF6';
  const text = token('text') || '#F2F4F7';
  const muted = token('muted') || '#9AA5B1';
  const primaryContrast = token('primaryContrast') || '#0A0C10';
  const border = token('border') || 'rgba(255,255,255,0.1)';

  const selected =
    logo?.concepts.find((c) => c.id === logo.selectedConceptId) ||
    logo?.concepts[0];

  return (
    <div className="brand-preview">
      <p className="brand-preview__hint">
        Live system preview — updates when you change approved identity values.
      </p>
      <div
        className="brand-preview__stage"
        style={{
          background: bg,
          color: text,
          fontFamily: type?.bodyStack || 'system-ui, sans-serif',
        }}
      >
        <div
          className="brand-preview__card"
          style={{ background: surface, borderColor: border }}
        >
          {selected?.svgMarkup && (
            <div
              className="brand-preview__logo"
              dangerouslySetInnerHTML={{ __html: selected.svgMarkup }}
            />
          )}
          <p
            className="brand-preview__tagline"
            style={{
              color: muted,
              fontFamily: type?.headingStack,
            }}
          >
            {brand?.tagline}
          </p>
          <h2
            style={{
              fontFamily: type?.displayStack,
              fontWeight: 650,
              letterSpacing: '-0.02em',
            }}
          >
            {brand?.brandName}
          </h2>
          <p style={{ color: muted, lineHeight: 1.6, marginTop: 8 }}>
            {brand?.summary}
          </p>
          <div className="brand-preview__buttons">
            <button
              type="button"
              style={{
                background: primary,
                color: primaryContrast,
                fontFamily: type?.uiStack,
              }}
            >
              Primary action
            </button>
            <button
              type="button"
              style={{
                background: 'transparent',
                color: text,
                border: `1px solid ${border}`,
                fontFamily: type?.uiStack,
              }}
            >
              Secondary
            </button>
          </div>
          <div className="brand-preview__swatches">
            {colors.palette
              .filter((c) =>
                ['primary', 'secondary', 'accent', 'surface', 'text'].includes(
                  c.role
                )
              )
              .map((c) => (
                <div key={c.id} className="brand-preview__swatch">
                  <span style={{ background: c.hex }} />
                  <em>{c.name}</em>
                </div>
              ))}
          </div>
          {type && (
            <p
              className="brand-preview__type-meta"
              style={{ color: muted, fontFamily: type.uiStack }}
            >
              {type.displayFont} · {type.bodyFont}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
