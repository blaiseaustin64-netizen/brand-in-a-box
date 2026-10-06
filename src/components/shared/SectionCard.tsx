import type { BrandSectionKey } from '../../types/brand';
import { useBrand } from '../../store/BrandContext';
import './SectionCard.css';

interface SectionCardProps {
  title: string;
  sectionKey: BrandSectionKey;
  children: React.ReactNode;
  onEdit?: (value: string) => void;
  editValue?: string;
  multiline?: boolean;
}

export function SectionCard({
  title,
  sectionKey,
  children,
  onEdit,
  editValue,
  multiline,
}: SectionCardProps) {
  const { brand, isGenerating, regenerateSection, approveSection } = useBrand();
  const approved = brand?.approvedSections[sectionKey];

  return (
    <article className={`scard ${approved ? 'scard--approved' : ''}`}>
      <header className="scard__header">
        <div className="scard__title-row">
          <h3 className="scard__title">{title}</h3>
          {approved && <span className="scard__badge">Approved</span>}
        </div>
        <div className="scard__actions">
          <button
            type="button"
            className="scard__btn"
            disabled={isGenerating || !!approved}
            onClick={() => regenerateSection(sectionKey)}
            title={approved ? 'Unapprove to regenerate' : 'Regenerate'}
          >
            Regenerate
          </button>
          {!approved ? (
            <button
              type="button"
              className="scard__btn scard__btn--accent"
              disabled={isGenerating}
              onClick={() => approveSection(sectionKey)}
            >
              Approve
            </button>
          ) : null}
        </div>
      </header>
      <div className="scard__body">
        {onEdit && editValue !== undefined ? (
          multiline ? (
            <textarea
              className="scard__edit"
              value={editValue}
              onChange={(e) => onEdit(e.target.value)}
              rows={4}
            />
          ) : (
            <input
              className="scard__edit scard__edit--single"
              value={editValue}
              onChange={(e) => onEdit(e.target.value)}
            />
          )
        ) : (
          children
        )}
      </div>
    </article>
  );
}
