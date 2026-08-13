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
    details: "End-to-End Cloud Big Data Solution for Real-Time Logistics Intelligence.",
    url: "https://drive.google.com/file/d/1PaUBkPkdkWM6r0UbMbtRwC3ANRpt4TKP/view?usp=drive_link"
  },
  {
    company: "Networkers Home",
    role: "AI Engineering Internship",
    details: "Engineered machine learning models for network optimization.",
    url: "https://drive.google.com/file/d/14CDnqWtqvgZdBRMsQfnHxQSejRQ_rW3H/view?usp=drive_link"
  },
  {
    company: "AISECT Learn",
    role: "Python for Data Science Internship",
    details: "Built core data analytics pipelines and statistical models.",
    url: "https://drive.google.com/file/d/1FlF3gsDiORiWDPdoq1mZKw5H9y0BIHad/view?usp=drive_link"
  },
  {
    company: "The Developers Arena",
    role: "Software Development Internship",
    details: "Developed robust software architecture and integrated scalable backends.",
    url: "https://drive.google.com/file/d/1tIRGmHjQig1_3QKwpW9yxTmygaZBNiWH/view?usp=drive_link"
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
      <h2 className="section-header dark-bg-header">EXPERIENCE</h2>
      <div className="timeline-container">
        {deploymentsData.map((dep, idx) => {
          const content = (
            <>
              <div className="dep-company">{dep.company}</div>
              <div className="dep-role">{dep.role}</div>
              <div className="dep-details">{dep.details}</div>
            </>
          );
          return dep.url ? (
            <a
              href={dep.url}
              target="_blank"
              rel="noreferrer"
              key={idx} 
              className="deployment-block"
              style={{ textDecoration: 'none', color: 'var(--asphalt-black)', display: 'block' }}
              ref={el => itemsRef.current[idx] = el}
            >
              {content}
            </a>
          ) : (
            <div 
              key={idx} 
              className="deployment-block"
              ref={el => itemsRef.current[idx] = el}
            >
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Deployments;
