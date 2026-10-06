import { useBrand } from '../../store/BrandContext';
import { Sidebar } from './Sidebar';
import { AIDirectorPanel } from './AIDirectorPanel';
import { CreateBrandFlow } from '../create/CreateBrandFlow';
import { BrandOverview } from '../overview/BrandOverview';
import { BrandStrategy } from '../strategy/BrandStrategy';
import { BrandVoice } from '../voice/BrandVoice';
import { IdentityStudio } from '../identity/IdentityStudio';
import { ColorStudio } from '../identity/ColorStudio';
import { TypographyStudio } from '../identity/TypographyStudio';
import { AssetStudio } from '../assets/AssetStudio';
import { ExportCenter } from '../export/ExportCenter';
import { BrandGuidelines } from '../guidelines/BrandGuidelines';
import './Workspace.css';

export function Workspace() {
  const {
    brand,
    view,
    isGenerating,
    toggleMobileNav,
    toggleMobileDirector,
  } = useBrand();

  if (!brand) {
    return (
      <div className="workspace workspace--create">
        <CreateBrandFlow />
      </div>
    );
  }

  return (
    <div className="workspace">
      <Sidebar />

      <div className="workspace__main">
        <header className="workspace__topbar">
          <button
            type="button"
            className="workspace__menu-btn"
            onClick={toggleMobileNav}
            aria-label="Open navigation"
          >
            <span />
            <span />
            <span />
          </button>
          <div className="workspace__topbar-title">
            {view === 'overview' && 'Brand Overview'}
            {view === 'strategy' && 'Strategy'}
            {view === 'voice' && 'Brand Voice'}
            {view === 'identity' && 'Visual Identity'}
            {view === 'colors' && 'Colors'}
            {view === 'typography' && 'Typography'}
            {view === 'assets' && 'Asset Studio'}
            {view === 'export' && 'Export & Forge'}
            {view === 'guidelines' && 'Brand Guidelines'}
          </div>
          <button
            type="button"
            className="workspace__director-btn"
            onClick={toggleMobileDirector}
            aria-label="Open AI Brand Director"
          >
            <span className="workspace__director-dot" data-active={isGenerating} />
            Director
          </button>
        </header>

        <main className="workspace__content">
          {view === 'overview' && <BrandOverview />}
          {view === 'strategy' && <BrandStrategy />}
          {view === 'voice' && <BrandVoice />}
          {view === 'identity' && <IdentityStudio />}
          {view === 'colors' && <ColorStudio />}
          {view === 'typography' && <TypographyStudio />}
          {view === 'assets' && <AssetStudio />}
          {view === 'export' && <ExportCenter />}
          {view === 'guidelines' && <BrandGuidelines />}
        </main>
      </div>

      <AIDirectorPanel />
    </div>
  );
}
