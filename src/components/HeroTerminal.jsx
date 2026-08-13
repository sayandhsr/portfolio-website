import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './HeroTerminal.css';

const HeroTerminal = () => {
  const heroRef = useRef(null);
  const textRef = useRef(null);
  const subTextRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();
    
    // Heavy slam-down animation for the main title
    tl.fromTo(textRef.current, 
      { y: -200, opacity: 0, scale: 1.5 },
      { y: 0, opacity: 1, scale: 1, duration: 1, ease: 'power4.out' }
    )
    // Slide in the sub-headline with authority
    .fromTo(subTextRef.current,
      { x: -100, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
      "-=0.5"
    )
    // Fade in the button
    .fromTo(btnRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' },
      "-=0.3"
    );

    // Parallax effect on scroll
    gsap.to(heroRef.current, {
      backgroundPosition: '50% 100%',
      ease: 'none',
      scrollTrigger: {
        trigger: heroRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });
  }, []);

  const handleScroll = () => {
    const architectSection = document.getElementById('architect-section');
    if (architectSection) {
      architectSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section ref={heroRef} className="hero-section section-container">
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <h1 ref={textRef} className="massive-headline">SAYANDH RAJ</h1>
        <h2 ref={subTextRef} className="sub-headline">AI ENGINEER & DATA ARCHITECT</h2>
        <button ref={btnRef} className="brutalist-button initialize-btn" onClick={handleScroll}>
          INITIALIZE PROTOCOL
        </button>
      </div>
    </section>
  );
};

export default HeroTerminal;
