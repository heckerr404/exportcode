import { useState } from 'react';
import { signInWithGoogle, signInAsGuest } from '../lib/firebase';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      onLogin();
    } catch (err: any) {
      setError(err?.message ?? 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGuestSignIn() {
    setLoading(true);
    setError(null);
    try {
      await signInAsGuest();
      onLogin();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* Background blobs */}
      <div className="login-blob login-blob-1" />
      <div className="login-blob login-blob-2" />
      <div className="login-blob login-blob-3" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1 className="login-title">CodeSync</h1>
        <p className="login-subtitle">
          Auto-sync your LeetCode &amp; GFG solutions<br />to GitHub — one commit per problem.
        </p>

        {/* Features */}
        <ul className="login-features">
          {[
            { icon: '⚡', text: 'Instant sync on demand' },
            { icon: '🤖', text: 'Nightly auto-sync scheduler' },
            { icon: '📁', text: 'Smart folder structure by difficulty' },
            { icon: '🔒', text: 'Your data, isolated and private' },
          ].map(({ icon, text }) => (
            <li key={text} className="login-feature-item">
              <span className="login-feature-icon">{icon}</span>
              <span>{text}</span>
            </li>
          ))}
        </ul>

        {/* Error */}
        {error && (
          <div className="login-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Sign in button */}
        <button
          id="btn-google-signin"
          className="login-btn"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? (
            <span className="login-btn-spinner" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>

        <button
          id="btn-guest-signin"
          type="button"
          className="login-btn-secondary"
          onClick={handleGuestSignIn}
          disabled={loading}
        >
          ⚡ Continue as Guest (Demo Mode)
        </button>

        <p className="login-footer">
          Your solutions stay in your own GitHub repo.<br />
          We never store your code.
        </p>
      </div>
    </div>
  );
}
