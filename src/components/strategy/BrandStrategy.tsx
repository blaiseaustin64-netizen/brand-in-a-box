import { useBrand } from '../../store/BrandContext';
import { SectionCard } from '../shared/SectionCard';
import './BrandStrategy.css';

export function BrandStrategy() {
  const { brand, updateSection } = useBrand();
  if (!brand) return null;

  const s = brand.strategy;

  return (
    <div className="strategy animate-in">
      <header className="strategy__header">
        <h1>Brand Strategy</h1>
        <p>
          Positioning, mission, and narrative. Approve sections you want to keep
          locked.
        </p>
      </header>

      <div className="strategy__stack">
        <SectionCard
          title="Tagline"
          sectionKey="tagline"
          editValue={brand.tagline}
          onEdit={(v) => updateSection('root', 'tagline', v)}
        >
          <p>{brand.tagline}</p>
        </SectionCard>

        <SectionCard
          title="Positioning"
          sectionKey="positioning"
          editValue={s.positioning}
          onEdit={(v) => updateSection('strategy', 'positioning', v)}
          multiline
        >
          <p>{s.positioning}</p>
        </SectionCard>

        <SectionCard
          title="Mission"
          sectionKey="mission"
          editValue={s.mission}
          onEdit={(v) => updateSection('strategy', 'mission', v)}
          multiline
        >
          <p>{s.mission}</p>
        </SectionCard>

        <SectionCard
          title="Vision"
          sectionKey="vision"
          editValue={s.vision}
          onEdit={(v) => updateSection('strategy', 'vision', v)}
          multiline
        >
          <p>{s.vision}</p>
        </SectionCard>

        <SectionCard
          title="Brand Story"
          sectionKey="brandStory"
          editValue={s.brandStory}
          onEdit={(v) => updateSection('strategy', 'brandStory', v)}
          multiline
        >
          <p>{s.brandStory}</p>
        </SectionCard>

        <SectionCard
          title="Target Audience"
          sectionKey="targetAudience"
          editValue={s.targetAudienceDetail}
          onEdit={(v) => updateSection('strategy', 'targetAudienceDetail', v)}
          multiline
        >
          <p>{s.targetAudienceDetail}</p>
        </SectionCard>

        <SectionCard
          title="Brand Personality"
          sectionKey="personality"
          editValue={s.personalityDetail}
          onEdit={(v) => updateSection('strategy', 'personalityDetail', v)}
          multiline
        >
          <p>{s.personalityDetail}</p>
        </SectionCard>

        <SectionCard title="Core Values" sectionKey="coreValues">
          <ul className="scard__list">
            {s.coreValues.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Messaging Principles" sectionKey="messagingPrinciples">
          <ul className="scard__list">
            {s.messagingPrinciples.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
