import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './TheArsenal.css';

const projects = [
  "ATS Resume Analyzer & AI Resume Builder",
  "RAG-Based Document Chatbot with PDF Upload Support",
  "AI Code Review Assistant & GitHub Repository Analyzer",
  "AI Job Search Assistant, YouTube Video Summarizer & AI Helpdesk Chatbot",
  "Precision Crop Forecasting System",
  "Skin Disease Prediction using Machine Learning and OpenCV",
  "Breast Cancer & House Price Prediction Models using Machine Learning",
  "Social Media Trend Analysis"
];

const TheArsenal = () => {
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    gsap.fromTo(cardsRef.current,
      { scale: 0.8, opacity: 0, rotationY: 45 },
      {
        scale: 1, opacity: 1, rotationY: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "back.out(1.5)",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
        }
      }
    );
  }, []);

  return (
    <section ref={sectionRef} className="section-container arsenal-section">
      <h2 className="section-header dark-bg-header">THE ARSENAL</h2>
      <div className="masonry-grid">
        {projects.map((proj, idx) => (
          <div 
            key={idx} 
            className="arsenal-card"
            ref={el => cardsRef.current[idx] = el}
          >
            <div className="card-id">PRJ_{idx < 9 ? '0' : ''}{idx + 1}</div>
            <h3 className="card-title">{proj}</h3>
            <div className="card-overlay">
              <span>VIEW LOGS</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TheArsenal;
