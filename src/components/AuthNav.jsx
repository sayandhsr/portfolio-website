import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import './AuthNav.css';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const AuthNav = () => {
  if (!CLERK_KEY) return null;

  return (
    <nav className="auth-nav">
      <div className="auth-nav-inner">
        <span className="auth-nav-label">SYS_AUTH://</span>
        <div className="auth-controls">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="auth-btn auth-signin">[SIGN IN]</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="auth-btn auth-signup">[REGISTER]</button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <span className="auth-status">AUTHENTICATED</span>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: {
                    width: '36px',
                    height: '36px',
                    border: '3px solid var(--concrete-white)',
                  }
                }
              }}
            />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
};

export default AuthNav;
