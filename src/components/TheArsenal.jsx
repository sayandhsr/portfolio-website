import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './TheArsenal.css';

const projects = [
  { title: "ATS Resume Analyzer & AI Resume Builder", url: "https://github.com/sayandhsr" },
  { title: "RAG-Based Document Chatbot with PDF Upload Support", url: "https://github.com/sayandhsr" },
  { title: "AI Code Review Assistant & GitHub Repository Analyzer", url: "https://github.com/sayandhsr" },
  { title: "AI Job Search Assistant, YouTube Video Summarizer & AI Helpdesk Chatbot", url: "https://github.com/sayandhsr" },
  { title: "Precision Crop Forecasting System", url: "https://github.com/sayandhsr" },
  { title: "Skin Disease Prediction using Machine Learning and OpenCV", url: "https://github.com/sayandhsr" },
  { title: "Breast Cancer & House Price Prediction Models using Machine Learning", url: "https://github.com/sayandhsr" },
  { title: "Social Media Trend Analysis", url: "https://github.com/sayandhsr" }
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
          <a 
            href={proj.url}
            target="_blank"
            rel="noopener noreferrer"
            key={idx} 
            className="arsenal-card"
            style={{ textDecoration: 'none' }}
            ref={el => cardsRef.current[idx] = el}
          >
            <div className="card-id">PRJ_{idx < 9 ? '0' : ''}{idx + 1}</div>
            <h3 className="card-title">{proj.title}</h3>
            <div className="card-overlay">
              <span>VIEW LOGS</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};

export default TheArsenal;
