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
    let scrollTimeout;
    let globalAudioCtx;
    
    const initAudio = () => {
      if (!globalAudioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        globalAudioCtx = new AudioContext();
      }
      if (globalAudioCtx.state === 'suspended') {
        globalAudioCtx.resume();
      }
    };

    const handleScroll = () => {
      if (!scrollTimeout) {
        if (navigator.vibrate) navigator.vibrate(5);
        scrollTimeout = setTimeout(() => {
          scrollTimeout = null;
        }, 80);
      }
    };

    const handleClick = () => {
      initAudio();
      if (navigator.vibrate) navigator.vibrate(10);
      
      try {
        const osc = globalAudioCtx.createOscillator();
        const gain = globalAudioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, globalAudioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, globalAudioCtx.currentTime + 0.03);
        gain.gain.setValueAtTime(0.05, globalAudioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, globalAudioCtx.currentTime + 0.03);
        osc.connect(gain);
        gain.connect(globalAudioCtx.destination);
        osc.start();
        osc.stop(globalAudioCtx.currentTime + 0.03);
      } catch(e) {}
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleClick);
      if (globalAudioCtx && globalAudioCtx.state !== 'closed') {
        globalAudioCtx.close().catch(() => {});
      }
    };
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
