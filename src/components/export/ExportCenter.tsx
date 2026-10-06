import { useMemo, useState, useEffect } from 'react';
import { useBrand } from '../../store/BrandContext';
import {
  buildBrandPackage,
  validateBrandPackage,
  exportBrandPackageJson,
  exportDesignTokensJson,
  exportDesignTokensCss,
  exportBrandPackageZip,
} from '../../services/export/exportService';
import { sendToForge, buildForgePayload } from '../../services/forge/forgeAdapter';
import { downloadJson } from '../../services/export/brandPackage';
import type { ForgeHandoffResult } from '../../types/brand';
import './ExportCenter.css';

export function ExportCenter() {
  const { brand, assets } = useBrand();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForgeReview, setShowForgeReview] = useState(false);
  const [forgeResult, setForgeResult] = useState<ForgeHandoffResult | null>(null);

  useEffect(() => {
    if (!showForgeReview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowForgeReview(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showForgeReview]);

  const validation = useMemo(
    () => validateBrandPackage(brand, assets),
    [brand, assets]
  );

  const pkg = useMemo(() => {
    if (!brand || !validation.canExport) return null;
    try {
      return buildBrandPackage(brand, assets);
    } catch {
      return null;
    }
  }, [brand, assets, validation.canExport]);

  if (!brand) return null;

  const run = async (label: string, fn: () => void | Promise<void>) => {
    setBusy(label);
    setError(null);
    setSuccess(null);
    try {
      await fn();
      setSuccess(`${label} complete.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setBusy(null);
    }
  };

  const handleForge = async () => {
    setBusy('Forge handoff');
    setError(null);
    setSuccess(null);
    setForgeResult(null);
    try {
      const result = await sendToForge(brand, assets);
      setForgeResult(result);
      if (result.success) {
        setSuccess(result.message || 'Sent to Forge.');
        setShowForgeReview(false);
      } else if (!result.configured) {
        // Keep review open with payload available
        setError(null);
      } else {
        setError(result.error || 'Forge handoff failed.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Forge handoff failed.');
    } finally {
      setBusy(null);
    }
  };

  const checklist = [
    { label: 'Brand Profile', ok: Boolean(brand.brandName) },
    { label: 'Strategy', ok: Boolean(brand.strategy?.positioning) },
    { label: 'Brand Voice', ok: Boolean(brand.voice?.tone) },
    {
      label: 'Logo System',
      ok: Boolean(brand.visualIdentity?.logo?.concepts?.length),
    },
    {
      label: 'Color System',
      ok: Boolean(brand.visualIdentity?.colors?.palette?.length),
    },
    {
      label: 'Typography',
      ok: Boolean(brand.visualIdentity?.typography),
    },
    {
      label: 'Visual Direction',
      ok: Boolean(brand.visualIdentity?.visualDirectionDetail),
    },
    {
      label: 'Approved Assets',
      ok: assets.some((a) => a.approved),
    },
    {
      label: 'Design Tokens',
      ok: Boolean(pkg?.designTokens),
    },
    {
      label: 'Guidelines data',
      ok: Boolean(pkg?.guidelines),
    },
  ];

  return (
    <div className="export-center animate-in">
      <header className="export-center__header">
        <div>
          <h1>Export & Forge</h1>
          <p>
            Package the current brand as a portable system — then hand off to
            Forge when ready.
          </p>
        </div>
        {pkg && (
          <span className="export-center__version">
            Package v{pkg.version}
          </span>
        )}
      </header>

      <section className="export-center__checklist">
        <h2>Package contents</h2>
        <ul>
          {checklist.map((c) => (
            <li key={c.label} data-ok={c.ok}>
              <span className="export-center__dot" />
              {c.label}
            </li>
          ))}
        </ul>
      </section>

      {validation.issues.length > 0 && (
        <section className="export-center__validation">
          <h2>Validation</h2>
          {validation.issues.map((issue, i) => (
            <p
              key={i}
              className={
                issue.level === 'error'
                  ? 'export-center__issue--error'
                  : 'export-center__issue--warn'
              }
            >
              {issue.level === 'error' ? 'Error' : 'Warning'}: {issue.message}
            </p>
          ))}
        </section>
      )}

      {error && (
        <div className="export-center__banner export-center__banner--error">
          {error}
        </div>
      )}
      {success && (
        <div className="export-center__banner export-center__banner--ok">
          {success}
        </div>
      )}

      {pkg && (
        <section className="export-center__preview">
          <h2>Live summary</h2>
          <div className="export-center__summary-grid">
            <div>
              <span>Brand</span>
              <strong>{pkg.brand.brandName}</strong>
            </div>
            <div>
              <span>Tagline</span>
              <strong>{pkg.brand.tagline || '—'}</strong>
            </div>
            <div>
              <span>Primary</span>
              <strong className="export-center__swatch-row">
                <i style={{ background: pkg.designTokens.colors.primary }} />
                {pkg.designTokens.colors.primary}
              </strong>
            </div>
            <div>
              <span>Display font</span>
              <strong>{pkg.designTokens.typography.fonts.display}</strong>
            </div>
            <div>
              <span>Assets</span>
              <strong>
                {pkg.metadata.approvedAssetCount} approved /{' '}
                {pkg.metadata.totalAssetCount} total
              </strong>
            </div>
            <div>
              <span>Visual</span>
              <strong>{pkg.brand.visualDirection}</strong>
            </div>
          </div>
        </section>
      )}

      <section className="export-center__actions">
        <h2>Export formats</h2>
        <div className="export-center__action-grid">
          <button
            type="button"
            disabled={!validation.canExport || Boolean(busy)}
            onClick={() =>
              run('Brand Package JSON', () =>
                exportBrandPackageJson(brand, assets)
              )
            }
          >
            {busy === 'Brand Package JSON' ? 'Exporting…' : 'Brand Package JSON'}
          </button>
          <button
            type="button"
            disabled={!validation.canExport || Boolean(busy)}
            onClick={() =>
              run('Design Tokens JSON', () =>
                exportDesignTokensJson(brand, assets)
              )
            }
          >
            Design Tokens JSON
          </button>
          <button
            type="button"
            disabled={!validation.canExport || Boolean(busy)}
            onClick={() =>
              run('CSS variables', () => exportDesignTokensCss(brand, assets))
            }
          >
            CSS variables
          </button>
          <button
            type="button"
            disabled={!validation.canExport || Boolean(busy)}
            onClick={() =>
              run('Brand Package ZIP', () =>
                exportBrandPackageZip(brand, assets)
              )
            }
          >
            {busy === 'Brand Package ZIP' ? 'Packaging…' : 'Full ZIP package'}
          </button>
        </div>
      </section>

      <section className="export-center__forge">
        <h2>Send to Forge</h2>
        <p>
          Hands a structured design-system payload to VEXDYN Forge — colors,
          type, tokens, logos, and approved assets. No UI scraping.
        </p>
        <button
          type="button"
          className="export-center__forge-btn"
          disabled={!validation.canExport || Boolean(busy)}
          onClick={() => {
            setShowForgeReview(true);
            setForgeResult(null);
          }}
        >
          Send to Forge
        </button>
      </section>

      {showForgeReview && pkg && (
        <div className="export-center__modal-backdrop" onClick={() => setShowForgeReview(false)}>
          <div
            className="export-center__modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Forge handoff"
          >
            <header>
              <h3>Review Forge payload</h3>
              <button type="button" onClick={() => setShowForgeReview(false)}>
                ×
              </button>
            </header>
            <div className="export-center__modal-body">
              <p>
                <strong>{pkg.brand.brandName}</strong> · Package v{pkg.version}
              </p>
              <ul>
                <li>Primary: {pkg.designTokens.colors.primary}</li>
                <li>Secondary: {pkg.designTokens.colors.secondary}</li>
                <li>
                  Type: {pkg.designTokens.typography.fonts.display} /{' '}
                  {pkg.designTokens.typography.fonts.body}
                </li>
                <li>
                  Logos: {pkg.visualIdentity?.logo?.concepts?.length || 0}{' '}
                  concepts
                </li>
                <li>
                  Approved assets: {pkg.metadata.approvedAssetCount}
                </li>
              </ul>

              {forgeResult && !forgeResult.configured && (
                <div className="export-center__forge-unconfigured">
                  <p>
                    <strong>Forge connection not configured.</strong>
                  </p>
                  <p>{forgeResult.message}</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (forgeResult.payload) {
                        downloadJson(
                          `${brand.brandName.replace(/\s+/g, '-').toLowerCase()}-forge-payload.json`,
                          forgeResult.payload
                        );
                      } else {
                        downloadJson(
                          'forge-payload.json',
                          buildForgePayload(brand, assets)
                        );
                      }
                    }}
                  >
                    Download Forge payload JSON
                  </button>
                </div>
              )}

              {forgeResult?.error && forgeResult.configured && (
                <p className="export-center__issue--error">{forgeResult.error}</p>
              )}
            </div>
            <footer>
              <button type="button" onClick={() => setShowForgeReview(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="export-center__forge-btn"
                disabled={Boolean(busy)}
                onClick={handleForge}
              >
                {busy === 'Forge handoff' ? 'Sending…' : 'Continue to Forge'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
