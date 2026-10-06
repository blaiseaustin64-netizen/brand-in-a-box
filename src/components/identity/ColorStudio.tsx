import { useState } from 'react';
import { useBrand } from '../../store/BrandContext';
import { getContrastLabel } from '../../services/identity/generateIdentity';
import './ColorStudio.css';

export function ColorStudio() {
  const { brand, isGenerating, runAction, approveIdentityPart } = useBrand();
  const colors = brand?.visualIdentity?.colors;
  const [copied, setCopied] = useState<string | null>(null);

  if (!colors?.palette?.length) {
    return (
      <div className="color-empty">
        <p>No color system yet.</p>
        <button
          type="button"
          className="identity__primary-btn"
          disabled={isGenerating}
          onClick={() => runAction('generate_colors')}
        >
          Generate palette
        </button>
      </div>
    );
  }

  const bg = colors.palette.find((c) => c.role === 'background')?.hex || '#08090B';
  const text = colors.palette.find((c) => c.role === 'text')?.hex || '#F2F4F7';

  const copyHex = async (hex: string, id: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(id);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="color-studio">
      <div className="color-studio__toolbar">
        <div className="color-studio__toolbar-left">
          <h2>Color system</h2>
          {colors.approved && <span className="color-studio__approved">Approved</span>}
        </div>
        <div className="color-studio__toolbar-actions">
          <button
            type="button"
            disabled={isGenerating || colors.approved}
            onClick={() => runAction('generate_colors')}
          >
            Regenerate
          </button>
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => runAction('generate_colors', 'make more premium')}
          >
            More premium
          </button>
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => runAction('increase_contrast')}
          >
            More contrast
          </button>
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => runAction('make_darker')}
          >
            Darker
          </button>
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => runAction('make_lighter')}
          >
            Lighter
          </button>
          {!colors.approved && (
            <button
              type="button"
              className="color-studio__approve"
              disabled={isGenerating}
              onClick={() => approveIdentityPart('colors')}
            >
              Approve colors
            </button>
          )}
        </div>
      </div>

      {colors.notes && <p className="color-studio__notes">{colors.notes}</p>}

      <div className="color-studio__grid">
        {colors.palette.map((token, i) => {
          const contrast =
            token.role === 'text' || token.role === 'muted'
              ? getContrastLabel(token.hex, bg)
              : token.role === 'primary' || token.role === 'secondary' || token.role === 'accent'
                ? getContrastLabel(text, token.hex)
                : null;

          return (
            <button
              key={token.id}
              type="button"
              className="color-swatch"
              style={{ animationDelay: `${i * 40}ms` }}
              onClick={() => copyHex(token.hex, token.id)}
              title="Click to copy HEX"
            >
              <div
                className="color-swatch__preview"
                style={{ background: token.hex }}
              />
              <div className="color-swatch__meta">
                <span className="color-swatch__name">{token.name}</span>
                <span className="color-swatch__hex">
                  {copied === token.id ? 'Copied' : token.hex}
                </span>
                {contrast && (
                  <span
                    className={`color-swatch__contrast ${
                      contrast.startsWith('AA') || contrast === 'AAA'
                        ? 'color-swatch__contrast--ok'
                        : 'color-swatch__contrast--low'
                    }`}
                  >
                    {contrast}
                  </span>
                )}
                <span className="color-swatch__usage">{token.usage}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
