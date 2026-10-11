import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { credlyBadges } from '../data/credlyBadges';
import './Verifications.css';

const topBadges = credlyBadges.slice(0, 3);

const institutionalCerts = [
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
  const badgesRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (badgesRef.current) {
      gsap.fromTo(
        badgesRef.current.children,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          scrollTrigger: {
            trigger: badgesRef.current,
            start: 'top 85%'
          }
        }
      );
    }

    if (listRef.current) {
      gsap.fromTo(
        listRef.current.children,
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.05,
          duration: 0.5,
          scrollTrigger: {
            trigger: listRef.current,
            start: 'top 85%'
          }
        }
      );
    }
  }, []);

  return (
    <section id="verifications" ref={sectionRef} className="section-container verifications-section">
      <div className="verifications-header-wrap">
        <div className="verifications-meta">
          <span>04 // VERIFICATIONS</span>
          <span className="meta-icon">↘</span>
        </div>
        <h2 className="section-header dark-bg-header">VERIFICATIONS</h2>
      </div>

      {/* TOP: ACHIEVEMENTS / 3 BADGES + MORE REDIRECT */}
      <div className="achievements-container">
        <div className="achievements-title-bar">
          <span className="achievements-label">ACHIEVEMENTS // DIGITAL BADGES</span>
          <span className="achievements-count">TOP 3 CREDLY BADGES</span>
        </div>

        <div className="badges-grid" ref={badgesRef}>
          {topBadges.map((badge) => (
            <a
              key={badge.id}
              href={badge.badgeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="badge-card"
            >
              <div className="badge-card-header">
                <span className={`issuer-tag issuer-${badge.category.toLowerCase()}`}>
                  {badge.issuer}
                </span>
                <span className="badge-date">{badge.issueDate}</span>
              </div>

              <div className="badge-img-wrapper">
                <img
                  src={badge.imageUrl}
                  alt={badge.name}
                  className="badge-icon-img"
                  loading="lazy"
                />
              </div>

              <div className="badge-content">
                <h3 className="badge-title">{badge.name}</h3>
                {badge.skills && badge.skills.length > 0 && (
                  <div className="badge-skills">
                    {badge.skills.slice(0, 3).map((skill, sIdx) => (
                      <span key={sIdx} className="skill-pill">{skill}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="badge-card-footer">
                <span className="verify-status">● VERIFIED</span>
                <span className="verify-arrow">↗</span>
              </div>
            </a>
          ))}

          {/* More redirect card to Credly account */}
          <a
            href="https://www.credly.com/users/sayandhraj"
            target="_blank"
            rel="noopener noreferrer"
            className="badge-card badge-card-more"
          >
            <div className="more-card-content">
              <span className="more-badge-tag">CREDLY ACCOUNT</span>
              <div className="more-hero-number">+20</div>
              <div className="more-title">MORE BADGES</div>
              <p className="more-desc">
                Explore the complete transcript of 23 verified credentials on Credly.
              </p>
              <div className="more-action-btn">
                VIEW MORE ON CREDLY ↗
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* AFTER: CERTIFICATES AS NORMAL */}
      <div className="certs-section-wrap">
        <div className="certs-title-bar">
          <span className="certs-label">ADDITIONAL CERTIFICATIONS</span>
        </div>
        <ul className="cert-list" ref={listRef}>
          {institutionalCerts.map((cert, idx) => (
            <a 
              key={idx}
              href="https://drive.google.com/drive/folders/13HvOqMhvEh0V_z04GpcMPh1rcx5M2W_m?usp=drive_link" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <li className="cert-item">
                <span className="cert-indicator">►</span> {cert}
              </li>
            </a>
          ))}
        </ul>
      </div>

      {/* ACCESS CREDENTIAL DATABASE BUTTON AS NORMAL */}
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
