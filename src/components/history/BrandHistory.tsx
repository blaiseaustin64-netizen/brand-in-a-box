import { useMemo, useState } from 'react';
import { useBrand } from '../../store/BrandContext';
import './BrandHistory.css';

export function BrandHistory() {
  const {
    brand,
    listBrandHistory,
    openBrandFromHistory,
    deleteBrandFromHistory,
    setView,
  } = useBrand();
  const [, setTick] = useState(0);
  const items = useMemo(() => listBrandHistory(), [listBrandHistory, brand?.id, brand?.updatedAt]);

  return (
    <div className="brand-history">
      <header className="brand-history__header">
        <h1>Brand History</h1>
        <p>
          Brands saved on this device. Opening a brand restores its strategy, identity,
          and assets. Storage is local to this browser — not a cloud account.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="brand-history__empty">
          <p>No saved brands yet. Create a brand to start building history.</p>
          <button type="button" className="brand-history__primary" onClick={() => setView('create')}>
            Create a brand
          </button>
        </div>
      ) : (
        <ul className="brand-history__list">
          {items.map((item) => {
            const active = brand?.id === item.id;
            return (
              <li
                key={item.id}
                className={`brand-history__item ${active ? 'brand-history__item--active' : ''}`}
              >
                <div className="brand-history__meta">
                  <div className="brand-history__name-row">
                    <span className="brand-history__name">{item.brandName}</span>
                    {active && <span className="brand-history__badge">Active</span>}
                  </div>
                  <span className="brand-history__sub">
                    {item.industry}
                    {item.tagline ? ` · ${item.tagline}` : ''}
                  </span>
                  <span className="brand-history__dates">
                    Updated {new Date(item.updatedAt).toLocaleString()} · {item.status}
                  </span>
                </div>
                <div className="brand-history__actions">
                  <button
                    type="button"
                    className="brand-history__open"
                    disabled={active}
                    onClick={() => {
                      openBrandFromHistory(item.id);
                      setTick((n) => n + 1);
                    }}
                  >
                    {active ? 'Current' : 'Open'}
                  </button>
                  <button
                    type="button"
                    className="brand-history__delete"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Remove “${item.brandName}” from this device? This cannot be undone here.`
                        )
                      ) {
                        deleteBrandFromHistory(item.id);
                        setTick((n) => n + 1);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
