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
import UNIXTerminal from './components/UNIXTerminal';
import CustomCursor from './components/CustomCursor';

gsap.registerPlugin(ScrollTrigger);

function App() {
  useEffect(() => {
  }, []);

  return (
    <main className="portfolio-container">
      <CustomCursor />
      <HeroTerminal />
      <TheArchitect />
      <Deployments />
      <TheArsenal />
      <EngineComponents />
      <Verifications />
      <CommLink />
      <UNIXTerminal />
    </main>
  );
}

export default App;
