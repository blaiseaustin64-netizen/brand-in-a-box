import { useState, type FormEvent } from 'react';
import { useBrand } from '../../store/BrandContext';
import type { BrandPersonality, VisualDirection } from '../../types/brand';
import './CreateBrandFlow.css';

const PERSONALITIES: BrandPersonality[] = [
  'Modern',
  'Bold',
  'Minimal',
  'Luxury',
  'Playful',
  'Professional',
  'Futuristic',
  'Friendly',
  'Technical',
  'Creative',
];

const VISUALS: VisualDirection[] = [
  'Minimal',
  'Dark Tech',
  'Luxury',
  'Editorial',
  'Corporate',
  'Futuristic',
  'Organic',
  'Playful',
];

export function CreateBrandFlow() {
  const { createBrand, isGenerating, error, clearError } = useBrand();

  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [personality, setPersonality] = useState<BrandPersonality[]>([
    'Modern',
  ]);
  const [visualDirection, setVisualDirection] =
    useState<VisualDirection>('Minimal');
  const [keywordsRaw, setKeywordsRaw] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [step, setStep] = useState(0);

  const togglePersonality = (p: BrandPersonality) => {
    setPersonality((prev) => {
      if (prev.includes(p)) {
        if (prev.length === 1) return prev;
        return prev.filter((x) => x !== p);
      }
      if (prev.length >= 3) return [...prev.slice(1), p];
      return [...prev, p];
    });
  };

  const canSubmit =
    brandName.trim().length >= 2 && description.trim().length >= 4;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isGenerating) return;
    clearError();
    const keywords = keywordsRaw
      .split(/[,，]/)
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 12);

    await createBrand({
      brandName: brandName.trim(),
      description: description.trim(),
      industry: industry.trim(),
      targetAudience: targetAudience.trim(),
      personality,
      visualDirection,
      keywords,
      additionalNotes: additionalNotes.trim() || undefined,
    });
  };

  return (
    <div className="create">
      <div className="create__inner animate-scale">
        <header className="create__header">
          <div className="create__mark">V</div>
          <div>
            <p className="create__eyebrow">VEXDYN · Brand-in-a-Box</p>
            <h1 className="create__title">Turn an idea into a brand</h1>
            <p className="create__lead">
              Give the AI Brand Director the essentials. Strategy, voice, and
              identity will be built from your context — not random templates.
            </p>
          </div>
        </header>

        <form className="create__form" onSubmit={handleSubmit}>
          {error && (
            <div className="create__error" role="alert">
              {error}
            </div>
          )}

          <div className="create__steps">
            <button
              type="button"
              className={step === 0 ? 'active' : ''}
              onClick={() => setStep(0)}
            >
              Essentials
            </button>
            <button
              type="button"
              className={step === 1 ? 'active' : ''}
              onClick={() => setStep(1)}
            >
              Personality
            </button>
            <button
              type="button"
              className={step === 2 ? 'active' : ''}
              onClick={() => setStep(2)}
            >
              Direction
            </button>
          </div>

          {step === 0 && (
            <div className="create__panel animate-in">
              <label className="field">
                <span className="field__label">
                  Business / project name <em>*</em>
                </span>
                <input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Northline"
                  maxLength={80}
                  autoFocus
                  required
                />
              </label>

              <label className="field">
                <span className="field__label">
                  What does the business do? <em>*</em>
                </span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="One or two sentences about the product or service."
                  rows={3}
                  maxLength={600}
                  required
                />
              </label>

              <div className="create__row">
                <label className="field">
                  <span className="field__label">Industry</span>
                  <input
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Fintech, Health, SaaS"
                    maxLength={80}
                  />
                </label>
                <label className="field">
                  <span className="field__label">Target audience</span>
                  <input
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. Product teams at mid-size companies"
                    maxLength={120}
                  />
                </label>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="create__panel animate-in">
              <p className="field__label">
                Brand personality <span className="hint">up to 3</span>
              </p>
              <div className="chip-grid">
                {PERSONALITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`chip ${
                      personality.includes(p) ? 'chip--active' : ''
                    }`}
                    onClick={() => togglePersonality(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <label className="field" style={{ marginTop: 20 }}>
                <span className="field__label">Keywords</span>
                <input
                  value={keywordsRaw}
                  onChange={(e) => setKeywordsRaw(e.target.value)}
                  placeholder="clarity, trust, precision (comma-separated)"
                  maxLength={200}
                />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="create__panel animate-in">
              <p className="field__label">Visual direction</p>
              <div className="chip-grid">
                {VISUALS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`chip ${
                      visualDirection === v ? 'chip--active' : ''
                    }`}
                    onClick={() => setVisualDirection(v)}
                  >
                    {v}
                  </button>
                ))}
              </div>

              <label className="field" style={{ marginTop: 20 }}>
                <span className="field__label">
                  Additional notes <span className="hint">optional</span>
                </span>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Competitors to avoid, tone constraints, must-haves…"
                  rows={3}
                  maxLength={400}
                />
              </label>
            </div>
          )}

          <div className="create__footer">
            {step > 0 ? (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setStep((s) => s - 1)}
                disabled={isGenerating}
              >
                Back
              </button>
            ) : (
              <span />
            )}

            {step < 2 ? (
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 0 && !canSubmit}
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn--primary"
                disabled={!canSubmit || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <span className="btn__spinner" />
                    Building brand…
                  </>
                ) : (
                  'Create brand'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
