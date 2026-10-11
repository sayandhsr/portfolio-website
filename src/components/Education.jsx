import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import dukLogo from '../assets/duk-logo.png';
import yenepoyaLogo from '../assets/yenepoya-logo.svg';
import ibmLogo from '../assets/ibm-logo.svg';
import tcsLogo from '../assets/tcs-logo.svg';
import './Education.css';

const educationList = [
  {
    degree: "Master of Science (M.Sc.)",
    major: "Computer Science (Artificial Intelligence)",
    period: "2026 – 2028",
    status: "Pursuing",
    institution: "Kerala University of Digital Sciences, Innovation and Technology",
    universityAlias: "Digital University of Kerala (DUK)",
    historicalNote: "Former Name: Indian Institute of Information Technology and Management - Kerala (IIITM-K)",
    location: "Trivandrum (Thiruvananthapuram), Kerala, India",
    overview: "Advanced study and research in deep neural architectures, machine learning theory, autonomous systems, and large-scale AI infrastructure.",
    logo: dukLogo,
    logoAlt: "Digital University of Kerala Logo",
    logoPadding: "10px 18px"
  },
  {
    degree: "Bachelor of Computer Applications (BCA)",
    major: "Artificial Intelligence & Data Science",
    period: "2023 – 2026",
    status: "CGPA: 8.59 / 10",
    institution: "Yenepoya (Deemed to be University)",
    universityAlias: "Bengaluru Off-Campus, Karnataka",
    historicalNote: "Main Campus: Mangalore, Karnataka, India",
    location: "Bengaluru, Karnataka, India",
    overview: "Core undergraduate foundation in applied machine learning, statistical modeling, database systems, and data engineering pipelines.",
    logo: yenepoyaLogo,
    logoAlt: "Yenepoya University Logo",
    logoPadding: "12px 20px",
    partners: [
      {
        name: "IBM",
        role: "Applied AI & Industry Curriculum Partner",
        logo: ibmLogo,
        logoAlt: "IBM Logo",
        padding: "6px 14px"
      },
      {
        name: "TCS iON",
        role: "Cloud Big Data & Applied Industry Projects",
        logo: tcsLogo,
        logoAlt: "Tata Consultancy Services Logo",
        padding: "6px 14px"
      }
    ]
  }
];

const Education = () => {
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    let mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      cardsRef.current.forEach((card) => {
        if (!card) return;
        gsap.fromTo(card,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power2.out',
            clearProps: 'all',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none none',
              once: true
            }
          }
        );
      });
    });

    mm.add("(max-width: 767px)", () => {
      cardsRef.current.forEach((card) => {
        if (!card) return;
        gsap.fromTo(card,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: 'power2.out',
            clearProps: 'all',
            scrollTrigger: {
              trigger: card,
              start: 'top 90%',
              toggleActions: 'play none none none',
              once: true
            }
          }
        );
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section id="education-section" ref={sectionRef} className="section-container education-section">
      <h2 className="section-header dark-bg-header">EDUCATION</h2>

      <div className="education-grid">
        {educationList.map((item, idx) => (
          <article
            key={idx}
            className="education-card"
            ref={el => (cardsRef.current[idx] = el)}
          >
            {/* University Logo Showcase */}
            <div className="edu-logo-wrapper" style={{ padding: item.logoPadding }}>
              <img
                src={item.logo}
                alt={item.logoAlt}
                className="edu-logo-img"
                loading="lazy"
              />
            </div>

            {/* Status & Period Metadata - Clean text below logo, no boxes */}
            <div className="edu-card-meta">
              <span className="edu-meta-status">{item.status}</span>
              <span className="edu-meta-period">{item.period}</span>
            </div>

            {/* Degree and Major */}
            <div className="edu-title-group">
              <h3 className="edu-degree-title">{item.degree}</h3>
              <div className="edu-major-name">{item.major}</div>
            </div>

            {/* University Details */}
            <div className="edu-institution-info">
              <div className="edu-inst-main">{item.institution}</div>
              {item.universityAlias && (
                <div className="edu-inst-sub">{item.universityAlias}</div>
              )}
              {item.historicalNote && (
                <div className="edu-inst-note">{item.historicalNote}</div>
              )}
            </div>

            {/* Overview */}
            <p className="edu-overview">{item.overview}</p>

            {/* Industry Partners for BCA */}
            {item.partners && item.partners.length > 0 && (
              <div className="edu-partners-container">
                <div className="edu-partners-heading">ACADEMIC INDUSTRIAL PARTNERS</div>
                <div className="edu-partners-grid">
                  {item.partners.map((partner, pIdx) => (
                    <div key={pIdx} className="edu-partner-card">
                      <div className="edu-partner-logo-box" style={{ padding: partner.padding }}>
                        <img
                          src={partner.logo}
                          alt={partner.logoAlt}
                          className="edu-partner-logo"
                          loading="lazy"
                        />
                      </div>
                      <div className="edu-partner-details">
                        <span className="edu-partner-name">{partner.name}</span>
                        <span className="edu-partner-role">{partner.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

export default Education;
