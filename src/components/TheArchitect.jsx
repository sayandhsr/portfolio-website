import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './TheArchitect.css';

const TheArchitect = () => {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 80%',
        end: 'top 30%',
        scrub: 1,
      }
    });

    tl.fromTo(headerRef.current,
      { x: -200, opacity: 0 },
      { x: 0, opacity: 1, duration: 1, ease: 'power4.out' }
    )
    .fromTo(textRef.current,
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out' },
      "-=0.5"
    );
  }, []);

  return (
    <section id="architect-section" ref={sectionRef} className="section-container architect-section">
      <h2 ref={headerRef} className="section-header">THE ARCHITECT</h2>
      <div className="architect-content">
        <p ref={textRef} className="architect-bio">
          "I engineer intelligent systems and architect robust, scalable machine learning solutions. 
          Backed by a foundation in Applied AI (BCA, Yenepoya University, 8.59 CGPA) and advanced 
          research via an M.Sc. in Computer Science, I transform complex data into actionable, 
          high-performance infrastructure. From precision generative AI models to predictive 
          analytics engines, my focus is on deploying heavy-duty, data-driven solutions that solve 
          real-world infrastructural and operational bottlenecks."
        </p>
      </div>
    </section>
  );
};

export default TheArchitect;
