import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SignedIn, SignedOut } from '@clerk/clerk-react';

import HeroTerminal from './components/HeroTerminal';
import TheArchitect from './components/TheArchitect';
import Deployments from './components/Deployments';
import TheArsenal from './components/TheArsenal';
import EngineComponents from './components/EngineComponents';
import Verifications from './components/Verifications';
import CommLink from './components/CommLink';
import UNIXTerminal from './components/UNIXTerminal';
import CustomCursor from './components/CustomCursor';
import AuthNav from './components/AuthNav';
import AuthGate from './components/AuthGate';

gsap.registerPlugin(ScrollTrigger);

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function App() {
  useEffect(() => {
  }, []);

  // If Clerk isn't configured, show portfolio without auth gate
  if (!CLERK_KEY) {
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

  return (
    <>
      <SignedOut>
        <AuthGate />
      </SignedOut>
      <SignedIn>
        <main className="portfolio-container">
          <AuthNav />
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
      </SignedIn>
    </>
  );
}

export default App;
