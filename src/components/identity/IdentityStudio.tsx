import { useState, useEffect } from 'react';
import { useBrand } from '../../store/BrandContext';
import { LogoStudio } from './LogoStudio';
import { ColorStudio } from './ColorStudio';
import { TypographyStudio } from './TypographyStudio';
import { VisualDirectionStudio } from './VisualDirectionStudio';
import { BrandPreview } from './BrandPreview';
import './IdentityStudio.css';

type IdentityTab = 'overview' | 'logo' | 'colors' | 'typography' | 'direction' | 'preview';

const TABS: { id: IdentityTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'logo', label: 'Logo' },
  { id: 'colors', label: 'Colors' },
  { id: 'typography', label: 'Typography' },
  { id: 'direction', label: 'Direction' },
  { id: 'preview', label: 'Preview' },
];

export function IdentityStudio() {
  const { brand, isGenerating, generateIdentity, runAction } = useBrand();
  const [tab, setTab] = useState<IdentityTab>('overview');

  const vi = brand?.visualIdentity;
  const hasIdentity = Boolean(vi?.colors?.palette?.length);

  useEffect(() => {
    if (hasIdentity && tab === 'overview') {
      // stay on overview until user navigates
    }
  }, [hasIdentity, tab]);

  if (!brand) return null;

  return (
    <div className="identity animate-in">
      <header className="identity__header">
        <div>
          <h1>Visual Identity</h1>
          <p>
            Logo, color, type, and direction — generated from your brand
            strategy.
          </p>
        </div>
        <div className="identity__header-actions">
          {!hasIdentity ? (
            <button
              type="button"
              className="identity__primary-btn"
              disabled={isGenerating}
              onClick={() => generateIdentity()}
            >
              {isGenerating ? 'Generating…' : 'Generate identity'}
            </button>
          ) : (
            <button
              type="button"
              className="identity__secondary-btn"
              disabled={isGenerating}
              onClick={() => generateIdentity()}
            >
              Regenerate all
            </button>
          )}
        </div>
      </header>

      {hasIdentity && (
        <nav className="identity__tabs" aria-label="Identity sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`identity__tab ${tab === t.id ? 'identity__tab--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      )}

      {!hasIdentity ? (
        <div className="identity__empty">
          <div className="identity__empty-card">
            <div className="identity__empty-glow" />
            <h2>No visual identity yet</h2>
            <p>
              The AI Brand Director will compose a color system, typography,
              visual direction, and logo concepts from your approved strategy
              and personality.
            </p>
            <button
              type="button"
              className="identity__primary-btn"
              disabled={isGenerating}
              onClick={() => generateIdentity()}
            >
              {isGenerating ? 'Building identity…' : 'Generate visual identity'}
            </button>
          </div>
        </div>
      ) : (
        <div className="identity__body">
          {tab === 'overview' && (
            <IdentityOverview onNavigate={setTab} />
          )}
          {tab === 'logo' && <LogoStudio />}
          {tab === 'colors' && <ColorStudio />}
          {tab === 'typography' && <TypographyStudio />}
          {tab === 'direction' && <VisualDirectionStudio />}
          {tab === 'preview' && <BrandPreview />}
        </div>
      )}
    </div>
  );
}

function IdentityOverview({
  onNavigate,
}: {
  onNavigate: (t: IdentityTab) => void;
}) {
  const { brand, runAction, isGenerating, approveIdentityPart } = useBrand();
  const vi = brand!.visualIdentity!;

  const cards: {
    id: IdentityTab;
    title: string;
    status: string;
    approved: boolean;
    part?: 'logo' | 'colors' | 'typography' | 'visualDirectionDetail';
  }[] = [
    {
      id: 'logo',
      title: 'Logo system',
      status: vi.logo?.concepts?.length
        ? `${vi.logo.concepts.length} concepts`
        : 'Empty',
      approved: Boolean(vi.logo?.approvedConceptId),
      part: 'logo',
    },
    {
      id: 'colors',
      title: 'Color system',
      status: `${vi.colors?.palette?.length || 0} tokens`,
      approved: Boolean(vi.colors?.approved),
      part: 'colors',
    },
    {
      id: 'typography',
      title: 'Typography',
      status: vi.typography
        ? `${vi.typography.displayFont} / ${vi.typography.bodyFont}`
        : 'Empty',
      approved: Boolean(vi.typography?.approved),
      part: 'typography',
    },
    {
      id: 'direction',
      title: 'Visual direction',
      status: brand!.visualDirection,
      approved: Boolean(vi.visualDirectionDetail?.approved),
      part: 'visualDirectionDetail',
    },
  ];

  return (
    <div className="identity-overview">
      <div className="identity-overview__grid">
        {cards.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`identity-overview__card ${c.approved ? 'identity-overview__card--approved' : ''}`}
            onClick={() => onNavigate(c.id)}
          >
            <div className="identity-overview__card-top">
              <h3>{c.title}</h3>
              {c.approved && <span className="identity-overview__badge">Approved</span>}
            </div>
            <p>{c.status}</p>
            <span className="identity-overview__open">Open →</span>
          </button>
        ))}
      </div>

      <div className="identity-overview__actions">
        <p className="identity-overview__actions-label">Identity refinements</p>
        <div className="identity-overview__action-row">
          {(
            [
              ['make_premium', 'More premium'],
              ['make_minimal', 'More minimal'],
              ['make_futuristic', 'More futuristic'],
              ['make_playful', 'More playful'],
              ['increase_contrast', 'Increase contrast'],
              ['make_typography_stronger', 'Stronger type'],
            ] as const
          ).map(([action, label]) => (
            <button
              key={action}
              type="button"
              className="identity-overview__action"
              disabled={isGenerating}
              onClick={() => runAction(action)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="identity-overview__preview-btn"
        onClick={() => onNavigate('preview')}
      >
        Open live brand preview
      </button>
    </div>
  );
}
