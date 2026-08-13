import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './EngineComponents.css';

const skillCategories = [
  { title: "MACHINE INTELLIGENCE & DEEP LEARNING", skills: ["PyTorch", "TensorFlow", "Deep Learning / Neural Networks", "Machine Learning", "NLP", "Computer Vision"] },
  { title: "DATA SCIENCE LIBRARIES", skills: ["Pandas", "NumPy", "Scikit-Learn", "Matplotlib", "Seaborn"] },
  { title: "DATA ANALYTICS & BI", skills: ["Power BI", "Excel", "Tableau (DAX)", "Data Cleaning", "Data Modelling & Visualisation", "Exploratory Data Analysis (EDA)"] },
  { title: "MATHEMATICS FOR AI", skills: ["Linear Algebra", "Statistics and Probability", "Calculus"] },
  { title: "LANGUAGES & CORE", skills: ["Python", "SQL", "R"] },
  { title: "GENERATIVE AI & FRAMEWORKS", skills: ["LangChain", "Hugging Face", "OpenRouter", "RAG", "LLM Applications"] },
  { title: "INFRASTRUCTURE, BACKEND & TOOLS", skills: ["FastAPI", "Docker", "Firebase", "Supabase", "GitHub", "Vercel", "REST APIs"] }
];

const EngineComponents = () => {
  const sectionRef = useRef(null);
  const blocksRef = useRef([]);

  useEffect(() => {
    blocksRef.current.forEach((block, idx) => {
      gsap.fromTo(block,
        { x: -50, opacity: 0 },
        {
          x: 0, opacity: 1,
          scrollTrigger: {
            trigger: block,
            start: 'top 85%',
            end: 'top 60%',
            scrub: true
          }
        }
      );
    });
  }, []);

  return (
    <section ref={sectionRef} className="section-container engine-section">
      <h2 className="section-header">ENGINE COMPONENTS</h2>
      <div className="skills-container">
        {skillCategories.map((cat, idx) => (
          <div 
            key={idx} 
            className="skill-category"
            ref={el => blocksRef.current[idx] = el}
          >
            <h3 className="category-title">[{cat.title}]</h3>
            <div className="tags-cloud">
              {cat.skills.map((skill, sIdx) => (
                <span key={sIdx} className="brutalist-tag">{skill}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default EngineComponents;
