import { BrandProvider } from './store/BrandContext';
import { Workspace } from './components/layout/Workspace';
import './styles/global.css';

export default function App() {
  return (
    <BrandProvider>
      <Workspace />
    </BrandProvider>
  );
}
