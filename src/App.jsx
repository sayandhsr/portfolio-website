import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import HeroTerminal from './components/HeroTerminal';
import TheArchitect from './components/TheArchitect';
import Deployments from './components/Deployments';
import TheArsenal from './components/TheArsenal';
import EngineComponents from './components/EngineComponents';
import Verifications from './components/Verifications';
import CommLink from './components/CommLink';
import AIHelpdesk from './components/AIHelpdesk';

gsap.registerPlugin(ScrollTrigger);

function App() {
  useEffect(() => {
    // Global scroll animations setup can go here, 
    // but we will keep most inside component-level useEffects for clean architecture.
  }, []);

  return (
    <main className="portfolio-container">
      <HeroTerminal />
      <TheArchitect />
      <Deployments />
      <TheArsenal />
      <EngineComponents />
      <Verifications />
      <CommLink />
      <AIHelpdesk />
    </main>
  );
}

export default App;
