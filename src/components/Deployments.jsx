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
    role: "End-to-End Cloud Big Data Solution",
    details: "Developed Real-Time Logistics Intelligence architecture."
  },
  {
    company: "Networkers Home",
    role: "AI Engineering Intern",
    details: "Engineered machine learning models for network optimization."
  },
  {
    company: "AISECT Learn",
    role: "Data Science Core Intern",
    details: "Built core data analytics pipelines and statistical models."
  }
];

const Deployments = () => {
  const sectionRef = useRef(null);
  const itemsRef = useRef([]);

  useEffect(() => {
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
