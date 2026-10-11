import { useEffect, useRef, useState, useMemo } from 'react';
import gsap from 'gsap';
import { credlyBadges } from '../data/credlyBadges';
import './Verifications.css';

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
  const gridRef = useRef(null);
  const [activeTab, setActiveTab] = useState('badges'); // 'badges' | 'certs'
  const [activeCategory, setActiveCategory] = useState('ALL'); // 'ALL' | 'IBM' | 'GOOGLE'
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBadges = useMemo(() => {
    return credlyBadges.filter(badge => {
      const matchesCategory = activeCategory === 'ALL' || badge.category.toUpperCase() === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        badge.name.toLowerCase().includes(q) ||
        badge.issuer.toLowerCase().includes(q) ||
        (badge.skills && badge.skills.some(s => s.toLowerCase().includes(q)));
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    if (gridRef.current && gridRef.current.children.length > 0) {
      gsap.fromTo(
        gridRef.current.children,
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.35,
          stagger: 0.02,
          ease: 'power2.out',
          overwrite: 'auto'
        }
      );
    }
  }, [filteredBadges, activeTab]);

  return (
    <section id="verifications" ref={sectionRef} className="section-container verifications-section">
      <div className="verifications-header-wrap">
        <div className="verifications-meta">
          <span>04 // CREDLY VERIFIED ARCHIVE</span>
          <span className="meta-badge-count">{credlyBadges.length} BADGES TOTAL</span>
        </div>
        <h2 className="section-header dark-bg-header">VERIFICATIONS & ACHIEVEMENTS</h2>
        <p className="verifications-subtitle">
          Official digital credentials issued via Credly & certified industry partners. Verified cryptographic proof of competence in AI/ML, Data Systems, and Computational Architecture.
        </p>
      </div>

      {/* Main Tab Switcher */}
      <div className="view-mode-bar">
        <div className="tab-buttons">
          <button 
            type="button"
            className={`mode-btn ${activeTab === 'badges' ? 'active' : ''}`}
            onClick={() => setActiveTab('badges')}
          >
            CREDLY BADGES [{credlyBadges.length}]
          </button>
          <button 
            type="button"
            className={`mode-btn ${activeTab === 'certs' ? 'active' : ''}`}
            onClick={() => setActiveTab('certs')}
          >
            INSTITUTIONAL CERTS [{institutionalCerts.length}]
          </button>
        </div>

        <div className="external-profile-links">
          <a 
            href="https://www.credly.com/users/sayandhraj" 
            target="_blank" 
            rel="noopener noreferrer"
            className="credly-profile-link"
          >
            CREDLY PROFILE ↗
          </a>
        </div>
      </div>

      {activeTab === 'badges' ? (
        <div className="badges-view-container">
          {/* Filter and Search Bar */}
          <div className="badges-controls">
            <div className="category-chips">
              {['ALL', 'IBM', 'GOOGLE'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`chip-btn ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat} {cat === 'ALL' ? `(${credlyBadges.length})` : cat === 'IBM' ? `(${credlyBadges.filter(b => b.category === 'IBM').length})` : `(${credlyBadges.filter(b => b.category === 'Google').length})`}
                </button>
              ))}
            </div>

            <div className="search-wrap">
              <span className="search-prompt">&gt;</span>
              <input
                type="text"
                placeholder="FILTER BY SKILL OR TITLE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="badge-search-input"
              />
              {searchQuery && (
                <button type="button" className="clear-search-btn" onClick={() => setSearchQuery('')}>✕</button>
              )}
            </div>
          </div>

          {/* Badges Grid */}
          <div className="badges-grid" ref={gridRef}>
            {filteredBadges.map((badge) => (
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
                      {badge.skills.map((skill, sIdx) => (
                        <span key={sIdx} className="skill-pill">{skill}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="badge-card-footer">
                  <span className="verify-status">● VERIFIED ON CREDLY</span>
                  <span className="verify-arrow">↗</span>
                </div>
              </a>
            ))}
          </div>

          {filteredBadges.length === 0 && (
            <div className="no-badges-found">
              <p>&gt; NO BADGES MATCHING "{searchQuery}"</p>
              <button type="button" className="reset-filter-btn" onClick={() => { setSearchQuery(''); setActiveCategory('ALL'); }}>
                RESET FILTERS
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="certs-view-container">
          <ul className="cert-list">
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
      )}

      {/* Global Actions Bar */}
      <div className="db-access-container">
        <a 
          href="https://www.credly.com/users/sayandhraj" 
          target="_blank" 
          rel="noopener noreferrer"
          className="brutalist-button credly-main-action"
        >
          VIEW PUBLIC CREDLY VAULT ↗
        </a>
        <a 
          href="https://drive.google.com/drive/folders/13HvOqMhvEh0V_z04GpcMPh1rcx5M2W_m?usp=drive_link" 
          target="_blank" 
          rel="noopener noreferrer"
          className="brutalist-button massive-block-link"
        >
          ACCESS CREDENTIAL DATABASE (DRIVE) ↗
        </a>
      </div>
    </section>
  );
};

export default Verifications;
