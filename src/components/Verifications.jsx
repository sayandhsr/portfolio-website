import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './Verifications.css';

const certifications = [
  "AI Engineering Specialization (Coursera)",
  "AI Infrastructure & Operations Fundamentals (Coursera)",
  "Google Advanced Data Analytics (Coursera)",
  "Google Data Analytics (Coursera)",
  "IBM Data Science Professional (Coursera)",
  "IBM Machine Learning Professional (Coursera)",
  "IBM Introduction to ML (Coursera)",
  "Microsoft Power BI Data Analyst (Coursera)",
  "Data Analysis with R (Coursera)",
  "Data Science Fundamentals with Python & SQL (Coursera)",
  "Strategic Leadership & Management (Coursera)",
  "People & Soft Skills (Coursera)",
  "Data Modelling & Visualization (TCS)",
  "TCS NQT 2026 – Cognitive Score: 70.47%"
];

const Verifications = () => {
  const sectionRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(listRef.current.children,
      { opacity: 0, y: 50 },
      {
        opacity: 1, y: 0,
        stagger: 0.1,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        }
      }
    );
  }, []);

  return (
    <section ref={sectionRef} className="section-container verifications-section">
      <h2 className="section-header dark-bg-header">VERIFICATIONS</h2>
      <ul className="cert-list" ref={listRef}>
        {certifications.map((cert, idx) => (
          <li key={idx} className="cert-item">
            <span className="cert-indicator">►</span> {cert}
          </li>
        ))}
      </ul>
      <div className="db-access-container">
        <a 
          href="https://drive.google.com/drive/folders/13HvOqMhvEh0V_z04GpcMPh1rcx5M2W_m?usp=drive_link" 
          target="_blank" 
          rel="noopener noreferrer"
          className="brutalist-button massive-block-link"
        >
          ACCESS CREDENTIAL DATABASE
        </a>
      </div>
    </section>
  );
};

export default Verifications;
