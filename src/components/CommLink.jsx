import { useEffect, useState } from 'react';
import './CommLink.css';

const CommLink = () => {
  const [repoCount, setRepoCount] = useState('...');

  useEffect(() => {
    fetch('https://api.github.com/users/sayandhsr')
      .then(res => res.json())
      .then(data => {
        if (data.public_repos !== undefined) {
          setRepoCount(data.public_repos);
        }
      })
      .catch(() => setRepoCount('ERR'));
  }, []);

  return (
    <footer className="section-container comm-link-section">
      <h2 className="section-header">WORK WITH ME</h2>
      
      <div className="matcha-container">
        <a 
          href="upi://pay?pa=sayandhsr123-2@okicici&pn=Sayandh%20Raj&cu=INR" 
          target="_blank" 
          rel="noopener noreferrer"
          className="brutalist-button matcha-btn"
        >
          🍵 BUY ME A MATCHA
        </a>
        <p className="matcha-note" style={{marginTop: '1rem'}}>[ DIRECT SECURE TRANSFER: sayandhsr123-2@okicici ]</p>
      </div>

      <div className="comm-grid">
        <a href="tel:+918590679716" className="comm-item">
          <span className="comm-label">PHONE / SECURE CALL</span>
          <span className="comm-value">+91 8590679716</span>
        </a>
        <a href="https://github.com/sayandhsr" target="_blank" rel="noopener noreferrer" className="comm-item">
          <span className="comm-label">GITHUB</span>
          <span className="comm-value">[{repoCount} REPOSITORIES]</span>
        </a>
        <a href="https://www.linkedin.com/in/sayandh-raj" target="_blank" rel="noopener noreferrer" className="comm-item">
          <span className="comm-label">LINKEDIN</span>
          <span className="comm-value">/in/sayandh-raj</span>
        </a>
        <a href="https://www.kaggle.com/sayandhsr" target="_blank" rel="noopener noreferrer" className="comm-item">
          <span className="comm-label">KAGGLE</span>
          <span className="comm-value">/sayandhsr</span>
        </a>
        <a href="https://twitter.com/SayandhSr" target="_blank" rel="noopener noreferrer" className="comm-item">
          <span className="comm-label">X/TWITTER</span>
          <span className="comm-value">@SayandhSr</span>
        </a>
        <a href="https://threads.net/@sayahd_" target="_blank" rel="noopener noreferrer" className="comm-item">
          <span className="comm-label">THREADS</span>
          <span className="comm-value">@sayahd_</span>
        </a>
        <a href="mailto:sayandhsr123@gmail.com" className="comm-item">
          <span className="comm-label">SECURE COMM</span>
          <span className="comm-value">sayandhsr123@gmail.com</span>
        </a>
      </div>
      <div className="footer-bottom">
        <p>SYSTEM ARCHITECT: SAYANDH RAJ © {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
};

export default CommLink;
