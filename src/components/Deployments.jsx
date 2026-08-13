import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './Deployments.css';

const deploymentsData = [
  {
    company: "IBM",
    role: "Industry Projects and Applied AI Programs",
    details: "Executed advanced AI programs focusing on industrial solutions."
  },
  {
    company: "TCS iON",
    role: "Applied Industry Project",
    details: "End-to-End Cloud Big Data Solution for Real-Time Logistics Intelligence."
  },
  {
    company: "Networkers Home",
    role: "AI Engineering Internship",
    details: "Engineered machine learning models for network optimization."
  },
  {
    company: "AISECT Learn",
    role: "Python for Data Science Internship",
    details: "Built core data analytics pipelines and statistical models."
  },
  {
    company: "The Developers Arena",
    role: "Software Development Internship",
    details: "Developed robust software architecture and integrated scalable backends."
  }
];

const Deployments = () => {
  const sectionRef = useRef(null);
  const itemsRef = useRef([]);

  useEffect(() => {
    let mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      // Heavy slide-ins for desktop
      itemsRef.current.forEach((item, index) => {
        gsap.fromTo(item,
          { opacity: 0, x: index % 2 === 0 ? -100 : 100 },
          {
            opacity: 1, x: 0,
            scrollTrigger: {
              trigger: item,
              start: 'top 85%',
              end: 'top 50%',
              scrub: 1
            }
          }
        );
      });
    });

    mm.add("(max-width: 767px)", () => {
      // Simpler, less aggressive animation for mobile to prevent layout thrashing
      itemsRef.current.forEach((item) => {
        gsap.fromTo(item,
          { opacity: 0, y: 50 },
          {
            opacity: 1, y: 0,
            scrollTrigger: {
              trigger: item,
              start: 'top 90%',
              end: 'top 60%',
              scrub: 1
            }
          }
        );
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} className="section-container deployments-section">
      <h2 className="section-header dark-bg-header">DEPLOYMENTS</h2>
      <div className="timeline-container">
        {deploymentsData.map((dep, idx) => (
          <div 
            key={idx} 
            className="deployment-block"
            ref={el => itemsRef.current[idx] = el}
          >
            <div className="dep-company">{dep.company}</div>
            <div className="dep-role">{dep.role}</div>
            <div className="dep-details">{dep.details}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Deployments;
