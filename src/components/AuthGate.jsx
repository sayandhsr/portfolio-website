import { SignInButton, SignUpButton } from '@clerk/clerk-react';
import './AuthGate.css';

const AuthGate = () => {
  return (
    <div className="auth-gate">
      <div className="auth-gate-content">
        <div className="auth-gate-glitch" data-text="ACCESS DENIED">ACCESS DENIED</div>
        <h1 className="auth-gate-title">SAYANDH RAJ</h1>
        <h2 className="auth-gate-subtitle">AI/ML ENGINEER & DATA ARCHITECT</h2>
        <p className="auth-gate-msg">AUTHENTICATION REQUIRED TO ACCESS THIS TERMINAL.</p>
        <div className="auth-gate-actions">
          <SignInButton mode="modal">
            <button className="auth-gate-btn auth-gate-signin">[ SIGN IN ]</button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="auth-gate-btn auth-gate-signup">[ REGISTER ]</button>
          </SignUpButton>
        </div>
        <p className="auth-gate-footer">SYSTEM v3.0 // CLEARANCE LEVEL: RESTRICTED</p>
      </div>
    </div>
  );
};

export default AuthGate;
