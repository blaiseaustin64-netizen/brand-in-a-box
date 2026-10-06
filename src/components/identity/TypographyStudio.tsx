import { useEffect } from 'react';
import { useBrand } from '../../store/BrandContext';
import './TypographyStudio.css';

export function TypographyStudio() {
  const { brand, isGenerating, runAction, approveIdentityPart } = useBrand();
  const type = brand?.visualIdentity?.typography;

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

  if (!type) {
    return (
      <div className="type-empty">
        <p>No typography system yet.</p>
        <button
          type="button"
          className="identity__primary-btn"
          disabled={isGenerating}
          onClick={() => runAction('generate_typography')}
        >
          Generate typography
        </button>
      </div>
    );
  }

  return (
    <div className="type-studio">
      <div className="type-studio__toolbar">
        <div className="type-studio__toolbar-left">
          <h2>Typography</h2>
          {type.approved && <span className="type-studio__approved">Approved</span>}
        </div>
        <div className="type-studio__toolbar-actions">
          <button
            type="button"
            disabled={isGenerating || type.approved}
            onClick={() => runAction('generate_typography')}
          >
            Regenerate
          </button>
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => runAction('make_typography_stronger')}
          >
            Stronger type
          </button>
          {!type.approved && (
            <button
              type="button"
              className="type-studio__approve"
              disabled={isGenerating}
              onClick={() => approveIdentityPart('typography')}
            >
              Approve typography
            </button>
          )}
        </div>
      </div>

      {type.notes && <p className="type-studio__notes">{type.notes}</p>}

      <div className="type-studio__fonts">
        <div className="type-studio__font-row">
          <span>Display</span>
          <strong style={{ fontFamily: type.displayStack }}>{type.displayFont}</strong>
        </div>
        <div className="type-studio__font-row">
          <span>Heading</span>
          <strong style={{ fontFamily: type.headingStack }}>{type.headingFont}</strong>
        </div>
        <div className="type-studio__font-row">
          <span>Body</span>
          <strong style={{ fontFamily: type.bodyStack }}>{type.bodyFont}</strong>
        </div>
        <div className="type-studio__font-row">
          <span>UI</span>
          <strong style={{ fontFamily: type.uiStack }}>{type.uiFont}</strong>
        </div>
        <div className="type-studio__font-row">
          <span>Mono</span>
          <strong style={{ fontFamily: type.monoStack }}>{type.monoFont}</strong>
        </div>
      </div>

      <div className="type-studio__preview">
        <p
          className="type-studio__display"
          style={{
            fontFamily: type.displayStack,
            fontSize: type.scale[0]?.size,
            fontWeight: type.scale[0]?.weight,
            lineHeight: type.scale[0]?.lineHeight,
            letterSpacing: type.scale[0]?.letterSpacing,
          }}
        >
          {brand?.tagline || 'Build what comes next.'}
        </p>
        <p
          className="type-studio__heading"
          style={{
            fontFamily: type.headingStack,
            fontSize: type.scale[1]?.size,
            fontWeight: type.scale[1]?.weight,
            lineHeight: type.scale[1]?.lineHeight,
          }}
        >
          {brand?.brandName} — brand system
        </p>
        <p
          className="type-studio__body"
          style={{
            fontFamily: type.bodyStack,
            fontSize: type.scale[3]?.size,
            lineHeight: type.scale[3]?.lineHeight,
          }}
        >
          {brand?.summary ||
            'Typography is matched to personality and visual direction so every surface feels like one brand.'}
        </p>
        <div className="type-studio__ui-row">
          <button
            type="button"
            className="type-studio__sample-btn"
            style={{ fontFamily: type.uiStack }}
          >
            Primary action
          </button>
          <span
            className="type-studio__caption"
            style={{ fontFamily: type.uiStack, fontSize: type.scale[5]?.size }}
          >
            Caption · UI label
          </span>
          <code style={{ fontFamily: type.monoStack, fontSize: type.scale[6]?.size }}>
            const brand = &quot;{brand?.brandName}&quot;;
          </code>
        </div>
      </div>

      <div className="type-studio__scale">
        <h3>Type scale</h3>
        <ul>
          {type.scale.map((s) => (
            <li key={s.name}>
              <span>{s.name}</span>
              <span>
                {s.size} / {s.weight} / {s.lineHeight}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
