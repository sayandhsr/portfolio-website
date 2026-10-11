import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import dukLogo from '../assets/duk-logo.png';
import yenepoyaLogo from '../assets/yenepoya-logo.svg';
import ibmLogo from '../assets/ibm-logo.svg';
import tcsLogo from '../assets/tcs-logo.svg';
import './Education.css';

const educationData = [
  {
    id: "EDU_01",
    degree: "Master of Science (M.Sc.)",
    field: "Computer Science (Artificial Intelligence)",
    institution: "Kerala University of Digital Sciences, Innovation and Technology",
    universityAlias: "Digital University of Kerala (DUK)",
    historicalNote: "Former Name: Indian Institute of Information Technology and Management - Kerala (IIITM-K)",
    campus: "Trivandrum, Kerala, India",
    period: "2026 – 2028",
    statusBadge: "PURSUING",
    badgeType: "gold",
    logo: dukLogo,
    logoAlt: "Digital University of Kerala Logo",
    logoPadding: "10px 16px",
    details: [
      "Specialization: Artificial Intelligence & Intelligent Systems Architecture",
      "Advanced focus: Deep Learning, Neural Computation, Autonomous Systems & Large-scale Models",
      "Campus: Technopark Phase IV, Trivandrum (Thiruvananthapuram), Kerala, India"
    ]
  },
  {
    id: "EDU_02",
    degree: "Bachelor of Computer Applications (BCA)",
    field: "Artificial Intelligence & Data Science",
    institution: "Yenepoya (Deemed to be University)",
    universityAlias: "Bengaluru Off-Campus, Karnataka",
    historicalNote: "Main University Campus: Mangalore, Karnataka, India",
    campus: "Bengaluru Off-Campus, Karnataka",
    period: "2023 – 2026",
    statusBadge: "CGPA: 8.59 / 10",
    badgeType: "green",
    logo: yenepoyaLogo,
    logoAlt: "Yenepoya University Logo",
    logoPadding: "12px 18px",
    details: [
      "Specialization: Artificial Intelligence, Machine Learning & Predictive Analytics",
      "Academic Performance: Graduated with 8.59 / 10.00 CGPA distinction",
      "Location: Bengaluru Off-Campus, Karnataka (Main University: Mangalore, Karnataka, India)"
    ],
    partners: [
      {
        name: "IBM",
        tag: "APPLIED AI PARTNER",
        role: "Industrial Curriculum & Applied AI Programs",
        logo: ibmLogo,
        logoAlt: "IBM Logo",
        padding: "6px 14px"
      },
      {
        name: "TCS iON",
        tag: "BIG DATA PARTNER",
        role: "Applied Industry Project & Logistics Intelligence",
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
      cardsRef.current.forEach((card, index) => {
        if (!card) return;
        gsap.fromTo(card,
          { opacity: 0, y: 80, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              end: 'top 55%',
              scrub: 1
            }
          }
        );
      });
    });

    mm.add("(max-width: 767px)", () => {
      cardsRef.current.forEach((card) => {
        if (!card) return;
        gsap.fromTo(card,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            scrollTrigger: {
              trigger: card,
              start: 'top 90%',
              end: 'top 65%',
              scrub: 1
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
      <p className="education-subheading">
        ACADEMIC ROOTS &middot; ARTIFICIAL INTELLIGENCE &amp; DATA SCIENCE
      </p>

      <div className="education-grid">
        {educationData.map((item, idx) => (
          <article
            key={item.id}
            className="education-card"
            ref={el => (cardsRef.current[idx] = el)}
          >
            <div className="edu-card-topbar">
              <span className="edu-id">{item.id}</span>
              <div className="edu-meta-tags">
                <span className={`edu-status-badge badge-${item.badgeType}`}>
                  {item.statusBadge}
                </span>
                <span className="edu-period-badge">{item.period}</span>
              </div>
            </div>

            <div className="edu-logo-wrapper" style={{ padding: item.logoPadding }}>
              <img
                src={item.logo}
                alt={item.logoAlt}
                className="edu-logo-img"
                loading="lazy"
              />
            </div>

            <div className="edu-card-body">
              <h3 className="edu-degree-title">{item.degree}</h3>
              <div className="edu-field-name">{item.field}</div>

              <div className="edu-institution-info">
                <div className="edu-inst-main">{item.institution}</div>
                {item.universityAlias && (
                  <div className="edu-inst-alias">{item.universityAlias}</div>
                )}
                {item.historicalNote && (
                  <div className="edu-historical-note">{item.historicalNote}</div>
                )}
              </div>

              <div className="edu-highlights">
                {item.details.map((detail, dIdx) => (
                  <div key={dIdx} className="edu-highlight-row">
                    <span className="edu-bullet">&gt;</span>
                    <span className="edu-detail-text">{detail}</span>
                  </div>
                ))}
              </div>

              {item.partners && item.partners.length > 0 && (
                <div className="edu-partners-container">
                  <div className="edu-partners-header">
                    <span className="edu-partners-tag">ACADEMIC INDUSTRIAL PARTNERS</span>
                    <span className="edu-partners-sub">Curriculum & Applied Industry Projects</span>
                  </div>
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
                        <div className="edu-partner-meta">
                          <span className="edu-partner-tag-pill">{partner.tag}</span>
                          <span className="edu-partner-name">{partner.name}</span>
                          <span className="edu-partner-role">{partner.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="edu-card-footer">
              <span className="edu-terminal-stamp">[VERIFIED ACADEMIC RECORD]</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Education;
