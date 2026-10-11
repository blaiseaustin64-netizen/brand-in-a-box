import { useMemo } from 'react';
import { useBrand } from '../../store/BrandContext';
import { buildDesignTokens } from '../../services/export/designTokens';
import { buildGuidelinesFoundation } from '../../services/export/brandPackage';
import { getContrastLabel } from '../../services/identity/generateIdentity';
import { downloadJson, downloadText } from '../../services/export/brandPackage';
import './BrandGuidelines.css';

export function BrandGuidelines() {
  const { brand, assets } = useBrand();

  const tokens = useMemo(
    () => (brand ? buildDesignTokens(brand) : null),
    [brand]
  );
  const foundation = useMemo(
    () => (brand ? buildGuidelinesFoundation(brand) : null),
    [brand]
  );

  if (!brand) return null;

  const vi = brand.visualIdentity;
  const colors = vi?.colors?.palette || [];
  const type = vi?.typography;
  const logo = vi?.logo;
  const vd = vi?.visualDirectionDetail;
  const approvedAssets = assets.filter((a) => a.approved);
  const hasIdentity = Boolean(colors.length);

  const exportJson = () => {
    downloadJson(
      `${brand.brandName.replace(/\s+/g, '-').toLowerCase()}-guidelines.json`,
      {
        brand: brand.brandName,
        tagline: brand.tagline,
        strategy: brand.strategy,
        voice: brand.voice,
        visualIdentity: vi,
        designTokens: tokens,
        guidelines: foundation,
        approvedAssets: approvedAssets.map((a) => ({
          id: a.id,
          name: a.name,
          category: a.category,
          type: a.type,
        })),
        exportedAt: new Date().toISOString(),
      }
    );
  };

  const exportHtml = () => {
    const html = buildGuidelinesHtml(brand, tokens, foundation, colors, type, logo, vd, approvedAssets);
    downloadText(
      `${brand.brandName.replace(/\s+/g, '-').toLowerCase()}-guidelines.html`,
      html,
      'text/html;charset=utf-8'
    );
  };

  return (
    <div className="guidelines animate-in">
      <header className="guidelines__header">
        <div>
          <h1>Brand Guidelines</h1>
          <p>
            How to use {brand.brandName} — strategy, identity, voice, and system
            tokens in one place.
          </p>
        </div>
        <div className="guidelines__exports">
          <button type="button" onClick={exportJson}>
            Export JSON
          </button>
          <button type="button" onClick={exportHtml}>
            Export HTML
          </button>
        </div>
      </header>

      {!hasIdentity && (
        <div className="guidelines__banner" role="status">
          Generate a visual identity to unlock the full brand book (logo, colors,
          type, and system examples).
        </div>
      )}

      {/* Cover */}
      <section
        className="guidelines__cover"
        style={{
          background: tokens?.colors.background || 'var(--surface)',
          color: tokens?.colors.text || 'var(--text)',
        }}
      >
        <p className="guidelines__eyebrow">Brand guidelines</p>
        <h2
          style={{
            fontFamily: tokens?.typography.fonts.displayStack || 'inherit',
          }}
        >
          {brand.brandName}
        </h2>
        {brand.tagline && (
          <p className="guidelines__tagline">{brand.tagline}</p>
        )}
        <div className="guidelines__cover-swatches">
          {['primary', 'secondary', 'accent'].map((role) => {
            const c = colors.find((x) => x.role === role);
            if (!c) return null;
            return (
              <span key={role} style={{ background: c.hex }} title={c.hex} />
            );
          })}
        </div>
      </section>

      {/* Overview */}
      <section className="guidelines__section">
        <h3>Brand overview</h3>
        <div className="guidelines__prose">
          <p>
            <strong>Positioning.</strong> {brand.strategy.positioning}
          </p>
          <p>
            <strong>Mission.</strong> {brand.strategy.mission}
          </p>
          <p>
            <strong>Vision.</strong> {brand.strategy.vision}
          </p>
          <p>
            <strong>Story.</strong> {brand.strategy.brandStory}
          </p>
        </div>
      </section>

      {/* Personality */}
      <section className="guidelines__section">
        <h3>Personality</h3>
        <div className="guidelines__chips">
          {brand.personality.map((p) => (
            <span key={p}>{p}</span>
          ))}
        </div>
        {brand.keywords.length > 0 && (
          <div className="guidelines__chips guidelines__chips--muted">
            {brand.keywords.map((k) => (
              <span key={k}>{k}</span>
            ))}
          </div>
        )}
        <ul className="guidelines__list">
          {brand.strategy.coreValues.map((v) => (
            <li key={v}>{v}</li>
          ))}
        </ul>
        <p className="guidelines__muted">{brand.strategy.personalityDetail}</p>
      </section>

      {/* Voice */}
      <section className="guidelines__section">
        <h3>Brand voice</h3>
        <div className="guidelines__grid-2">
          <div>
            <h4>Tone</h4>
            <p>{brand.voice.tone}</p>
          </div>
          <div>
            <h4>Writing style</h4>
            <p>{brand.voice.writingStyle}</p>
          </div>
        </div>
        <div className="guidelines__grid-2">
          <div>
            <h4>Words to use</h4>
            <div className="guidelines__chips">
              {brand.voice.wordsToUse.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
          </div>
          <div>
            <h4>Words to avoid</h4>
            <div className="guidelines__chips guidelines__chips--muted">
              {brand.voice.wordsToAvoid.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
          </div>
        </div>
        <blockquote className="guidelines__quote">
          {brand.voice.exampleVoice}
        </blockquote>
        {foundation && (
          <p className="guidelines__muted">{foundation.voiceUsage}</p>
        )}
      </section>

      {/* Logo */}
      <section className="guidelines__section">
        <h3>Logo</h3>
        {logo?.concepts?.length ? (
          <>
            <div className="guidelines__logo-grid">
              {logo.concepts.map((c) => (
                <div
                  key={c.id}
                  className={`guidelines__logo-card ${
                    c.id === logo.approvedConceptId || c.id === logo.selectedConceptId
                      ? 'guidelines__logo-card--active'
                      : ''
                  }`}
                >
                  {c.svgMarkup ? (
                    <div
                      className="guidelines__logo-preview"
                      dangerouslySetInnerHTML={{ __html: c.svgMarkup }}
                    />
                  ) : (
                    <span className="guidelines__muted">No preview</span>
                  )}
                  <span>
                    {c.label}
                    {c.id === logo.approvedConceptId ? ' · Approved' : ''}
                  </span>
                </div>
              ))}
            </div>
            {foundation && (
              <p className="guidelines__muted">{foundation.logoUsage}</p>
            )}
          </>
        ) : (
          <p className="guidelines__muted">No logo concepts yet.</p>
        )}
      </section>

      {/* Colors */}
      <section className="guidelines__section">
        <h3>Colors</h3>
        {colors.length ? (
          <>
            <div className="guidelines__color-grid">
              {colors
                .filter((c) =>
                  [
                    'primary',
                    'secondary',
                    'accent',
                    'background',
                    'surface',
                    'text',
                    'muted',
                    'success',
                    'warning',
                    'error',
                  ].includes(c.role)
                )
                .map((c) => {
                  const bg =
                    colors.find((x) => x.role === 'background')?.hex ||
                    '#08090B';
                  const contrast =
                    c.role === 'text' || c.role === 'muted'
                      ? getContrastLabel(c.hex, bg)
                      : c.role === 'primary' ||
                          c.role === 'secondary' ||
                          c.role === 'accent'
                        ? getContrastLabel(
                            colors.find((x) => x.role === 'text')?.hex ||
                              '#F2F4F7',
                            c.hex
                          )
                        : null;
                  return (
                    <div key={c.id} className="guidelines__color">
                      <div
                        className="guidelines__color-swatch"
                        style={{ background: c.hex }}
                      />
                      <strong>{c.name}</strong>
                      <code>{c.hex}</code>
                      {contrast && (
                        <span className="guidelines__contrast">{contrast}</span>
                      )}
                      <span className="guidelines__muted">{c.usage}</span>
                    </div>
                  );
                })}
            </div>
            {foundation && (
              <p className="guidelines__muted">{foundation.colorUsage}</p>
            )}
          </>
        ) : (
          <p className="guidelines__muted">No color system yet.</p>
        )}
      </section>

      {/* Typography */}
      <section className="guidelines__section">
        <h3>Typography</h3>
        {type ? (
          <>
            <div
              className="guidelines__type-sample"
              style={{ fontFamily: type.displayStack }}
            >
              <p className="guidelines__type-display">
                {brand.tagline || 'Build what comes next.'}
              </p>
              <p style={{ fontFamily: type.headingStack, fontSize: '1.25rem' }}>
                {brand.brandName}
              </p>
              <p
                style={{
                  fontFamily: type.bodyStack,
                  color: 'var(--text-muted)',
                  fontSize: '0.95rem',
                }}
              >
                {brand.summary}
              </p>
            </div>
            <div className="guidelines__type-meta">
              <span>Display · {type.displayFont}</span>
              <span>Heading · {type.headingFont}</span>
              <span>Body · {type.bodyFont}</span>
              <span>UI · {type.uiFont}</span>
              <span>Mono · {type.monoFont}</span>
            </div>
            <ul className="guidelines__scale">
              {type.scale.map((s) => (
                <li key={s.name}>
                  <span>{s.name}</span>
                  <span>
                    {s.size} / {s.weight} / {s.lineHeight}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="guidelines__muted">No typography system yet.</p>
        )}
      </section>

      {/* Visual direction */}
      <section className="guidelines__section">
        <h3>Visual direction</h3>
        <p className="guidelines__tag">{brand.visualDirection}</p>
        {vd ? (
          <div className="guidelines__vd-grid">
            {(
              [
                ['Design language', vd.designLanguage],
                ['Photography', vd.photographyDirection],
                ['Illustration', vd.illustrationDirection],
                ['Iconography', vd.iconStyle],
                ['Texture', vd.texture],
                ['Lighting', vd.lighting],
                ['Composition', vd.composition],
                ['Spacing', vd.spacingPersonality],
                ['UI style', vd.uiStyle],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <h4>{label}</h4>
                <p>{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="guidelines__muted">Direction detail not generated.</p>
        )}
      </section>

      {/* Assets */}
      <section className="guidelines__section">
        <h3>Asset usage</h3>
        {approvedAssets.length === 0 ? (
          <p className="guidelines__muted">
            No approved assets yet. Approve assets in Asset Studio to showcase
            them here.
          </p>
        ) : (
          <div className="guidelines__asset-grid">
            {approvedAssets.slice(0, 8).map((a) => {
              const ver =
                a.versions.find((v) => v.id === a.currentVersionId) ||
                a.versions.at(-1);
              return (
                <div key={a.id} className="guidelines__asset">
                  {ver?.svgMarkup ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: ver.svgMarkup }}
                    />
                  ) : null}
                  <span>
                    {a.name}
                    <em>
                      {a.category} · {a.type}
                    </em>
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {foundation && (
          <p className="guidelines__muted">{foundation.assetUsage}</p>
        )}
      </section>

      {/* Website system / tokens */}
      <section className="guidelines__section">
        <h3>Website system</h3>
        {tokens ? (
          <>
            <div
              className="guidelines__system-demo"
              style={{
                background: tokens.colors.background,
                color: tokens.colors.text,
                borderRadius: tokens.radius.card,
              }}
            >
              <div
                className="guidelines__system-card"
                style={{
                  background: tokens.colors.surface,
                  borderRadius: tokens.radius.card,
                  border: tokens.effects.borders.subtle,
                }}
              >
                <h4 style={{ fontFamily: tokens.typography.fonts.headingStack }}>
                  Component preview
                </h4>
                <p
                  style={{
                    color: tokens.colors.muted,
                    fontFamily: tokens.typography.fonts.bodyStack,
                  }}
                >
                  Cards, buttons, and inputs should follow these tokens.
                </p>
                <div className="guidelines__system-actions">
                  <button
                    type="button"
                    style={{
                      background: tokens.components?.button.primaryBg,
                      color: tokens.components?.button.primaryColor,
                      borderRadius: tokens.radius.button,
                      fontFamily: tokens.typography.fonts.uiStack,
                    }}
                  >
                    Primary
                  </button>
                  <button
                    type="button"
                    style={{
                      background: 'transparent',
                      color: tokens.colors.text,
                      border: tokens.effects.borders.subtle,
                      borderRadius: tokens.radius.button,
                      fontFamily: tokens.typography.fonts.uiStack,
                    }}
                  >
                    Secondary
                  </button>
                </div>
              </div>
            </div>
            <div className="guidelines__token-list">
              <span>Radius card · {tokens.radius.card}</span>
              <span>Space md · {tokens.spacing.md}</span>
              <span>Shadow md · defined</span>
              <span>Border · subtle</span>
            </div>
          </>
        ) : (
          <p className="guidelines__muted">
            Design tokens unlock after visual identity is generated.
          </p>
        )}
      </section>

      <p className="guidelines__pdf-note" role="note">
        PDF brand-book export requires a document pipeline that is not configured
        in this client. Use HTML or JSON exports, or the full Brand Package ZIP
        from Export.
      </p>
    </div>
  );
}

function buildGuidelinesHtml(
  brand: {
    brandName: string;
    tagline: string;
    strategy: { positioning: string; mission: string };
    voice: { tone: string; exampleVoice: string };
    visualDirection: string;
  },
  tokens: { colors: Record<string, string> } | null,
  foundation: { logoUsage: string; colorUsage: string } | null,
  colors: { name: string; hex: string; role: string; usage: string }[],
  type: { displayFont: string; bodyFont: string } | undefined,
  _logo: unknown,
  vd: { summary: string } | undefined,
  assets: { name: string; category: string }[]
): string {
  const primary = colors.find((c) => c.role === 'primary')?.hex || '#62E6FF';
  const bg = tokens?.colors.background || '#08090B';
  const text = tokens?.colors.text || '#F2F4F7';
  const surface = tokens?.colors.surface || '#111318';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(brand.brandName)} — Brand Guidelines</title>
<style>
  body{margin:0;font-family:system-ui,sans-serif;background:${bg};color:${text};line-height:1.55;padding:40px 24px}
  main{max-width:720px;margin:0 auto}
  h1{font-size:2rem;letter-spacing:-0.03em}
  h2{margin-top:2.5rem;font-size:1.15rem;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:8px}
  .swatch{display:inline-block;width:28px;height:28px;border-radius:6px;margin-right:6px;border:1px solid rgba(255,255,255,0.1)}
  .card{background:${surface};border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;margin:12px 0}
  .muted{opacity:0.7;font-size:0.9rem}
  code{font-size:0.85rem}
</style>
</head>
<body>
<main>
  <p class="muted">Brand guidelines · Generated by VEXDYN Brand-in-a-Box</p>
  <h1>${escapeHtml(brand.brandName)}</h1>
  <p>${escapeHtml(brand.tagline || '')}</p>
  <p>${colors.slice(0,5).map(c=>`<span class="swatch" style="background:${c.hex}" title="${c.hex}"></span>`).join('')}</p>
  <h2>Positioning</h2>
  <p>${escapeHtml(brand.strategy.positioning)}</p>
  <h2>Mission</h2>
  <p>${escapeHtml(brand.strategy.mission)}</p>
  <h2>Voice</h2>
  <div class="card"><p><strong>Tone:</strong> ${escapeHtml(brand.voice.tone)}</p>
  <p class="muted">${escapeHtml(brand.voice.exampleVoice)}</p></div>
  <h2>Colors</h2>
  ${colors.filter(c=>['primary','secondary','accent','background','text'].includes(c.role)).map(c=>`<p><span class="swatch" style="background:${c.hex}"></span> <strong>${escapeHtml(c.name)}</strong> <code>${c.hex}</code> — ${escapeHtml(c.usage)}</p>`).join('')}
  <h2>Typography</h2>
  <p>${type ? escapeHtml(`${type.displayFont} / ${type.bodyFont}`) : 'Not set'}</p>
  <h2>Visual direction</h2>
  <p>${escapeHtml(vd?.summary || brand.visualDirection)}</p>
  <h2>Approved assets</h2>
  <p>${assets.length ? assets.map(a=>escapeHtml(a.name)).join(', ') : 'None yet'}</p>
  ${foundation ? `<h2>Usage notes</h2><p class="muted">${escapeHtml(foundation.logoUsage)}</p><p class="muted">${escapeHtml(foundation.colorUsage)}</p>` : ''}
  <p class="muted" style="margin-top:3rem">Primary accent reference: ${primary}</p>
</main>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
