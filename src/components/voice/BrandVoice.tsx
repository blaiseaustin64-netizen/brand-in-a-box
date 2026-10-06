import { useBrand } from '../../store/BrandContext';
import { SectionCard } from '../shared/SectionCard';
import './BrandVoice.css';

export function BrandVoice() {
  const { brand, updateSection } = useBrand();
  if (!brand) return null;

  const v = brand.voice;

  return (
    <div className="voice animate-in">
      <header className="voice__header">
        <h1>Brand Voice</h1>
        <p>
          How the brand speaks. Tone, vocabulary, and example copy stay aligned
          with strategy.
        </p>
      </header>

      <div className="voice__stack">
        <SectionCard
          title="Tone"
          sectionKey="toneOfVoice"
          editValue={v.tone}
          onEdit={(val) => updateSection('voice', 'tone', val)}
        >
          <p>{v.tone}</p>
        </SectionCard>

        <SectionCard
          title="Writing style"
          sectionKey="writingStyle"
          editValue={v.writingStyle}
          onEdit={(val) => updateSection('voice', 'writingStyle', val)}
          multiline
        >
          <p>{v.writingStyle}</p>
        </SectionCard>

        <SectionCard title="Words to use" sectionKey="wordsToUse">
          <div className="scard__tags">
            {v.wordsToUse.map((w) => (
              <span key={w} className="scard__tag">
                {w}
              </span>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Words to avoid" sectionKey="wordsToAvoid">
          <div className="scard__tags">
            {v.wordsToAvoid.map((w) => (
              <span key={w} className="scard__tag">
                {w}
              </span>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Example brand voice"
          sectionKey="exampleVoice"
          editValue={v.exampleVoice}
          onEdit={(val) => updateSection('voice', 'exampleVoice', val)}
          multiline
        >
          <p className="voice__example">{v.exampleVoice}</p>
        </SectionCard>

        <SectionCard
          title="Short bio"
          sectionKey="shortBio"
          editValue={v.shortBio}
          onEdit={(val) => updateSection('voice', 'shortBio', val)}
        >
          <p>{v.shortBio}</p>
        </SectionCard>

        <SectionCard
          title="Long description"
          sectionKey="longDescription"
          editValue={v.longDescription}
          onEdit={(val) => updateSection('voice', 'longDescription', val)}
          multiline
        >
          <p>{v.longDescription}</p>
        </SectionCard>

        <SectionCard
          title="Social bio"
          sectionKey="socialBio"
          editValue={v.socialBio}
          onEdit={(val) => updateSection('voice', 'socialBio', val)}
        >
          <p>{v.socialBio}</p>
        </SectionCard>

        <SectionCard title="Messaging principles" sectionKey="messagingPrinciples">
          <ul className="scard__list">
            {v.messagingPrinciples.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
