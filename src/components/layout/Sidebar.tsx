import { useBrand, type ViewId } from '../../store/BrandContext';
import './Sidebar.css';

interface NavItem {
  id: ViewId;
  label: string;
  available: boolean;
}

const NAV: NavItem[] = [
  { id: 'overview', label: 'Brand Overview', available: true },
  { id: 'strategy', label: 'Strategy', available: true },
  { id: 'voice', label: 'Brand Voice', available: true },
  { id: 'identity', label: 'Identity', available: true },
  { id: 'colors', label: 'Colors', available: true },
  { id: 'typography', label: 'Typography', available: true },
  { id: 'assets', label: 'Assets', available: true },
  { id: 'export', label: 'Export', available: true },
  { id: 'social', label: 'Social Kit', available: false },
  { id: 'business', label: 'Business Kit', available: false },
  { id: 'website', label: 'Website', available: false },
  { id: 'guidelines', label: 'Guidelines', available: true },
];

export function Sidebar() {
  const { brand, view, setView, mobileNavOpen, toggleMobileNav, resetBrand } =
    useBrand();

  if (!brand) return null;

  return (
    <>
      {mobileNavOpen && (
        <div
          className="sidebar-backdrop"
          onClick={toggleMobileNav}
          aria-hidden
        />
      )}
      <aside
        className={`sidebar ${mobileNavOpen ? 'sidebar--open' : ''}`}
        aria-label="Brand navigation"
      >
        <div className="sidebar__brand">
          <div className="sidebar__logo">
            <span className="sidebar__logo-mark">V</span>
            <div className="sidebar__logo-text">
              <span className="sidebar__product">Brand-in-a-Box</span>
              <span className="sidebar__brand-name">{brand.brandName}</span>
            </div>
          </div>
        </div>

        <nav className="sidebar__nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar__item ${
                view === item.id ? 'sidebar__item--active' : ''
              } ${!item.available ? 'sidebar__item--disabled' : ''}`}
              onClick={() => item.available && setView(item.id)}
              disabled={!item.available}
              title={item.available ? item.label : 'Coming in a later phase'}
            >
              <span className="sidebar__item-label">{item.label}</span>
              {!item.available && (
                <span className="sidebar__badge">Soon</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar__footer">
          <button
            type="button"
            className="sidebar__reset"
            onClick={() => {
              if (
                window.confirm(
                  'Start a new brand? Current brand will be cleared from this device.'
                )
              ) {
                resetBrand();
              }
            }}
          >
            New brand
          </button>
        </div>
      </aside>
    </>
  );
}
