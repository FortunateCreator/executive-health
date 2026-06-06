'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!termsAccepted) {
      setError('You must accept the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName, termsAccepted }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      localStorage.setItem('token', data.token);
      router.push('/onboarding');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .auth-container {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          padding: clamp(12px, 3vw, 20px);
        }
        .auth-card {
          background: var(--bg-card);
          border-radius: clamp(14px, 3vw, 16px);
          padding: clamp(24px, 6vw, 40px);
          max-width: 440px;
          width: 100%;
          border: 1px solid var(--border-light);
          animation: eh-fade-in-up 0.4s ease;
        }
        .auth-logo {
          font-size: clamp(40px, 8vw, 48px);
          text-align: center;
          margin-bottom: clamp(12px, 2vw, 16px);
        }
        .auth-title {
          font-size: clamp(22px, 4.5vw, 28px);
          font-weight: 700;
          text-align: center;
          color: var(--text-primary);
          margin-bottom: 8px;
          line-height: 1.2;
        }
        .auth-subtitle {
          font-size: clamp(13px, 2vw, 14px);
          text-align: center;
          color: var(--text-muted);
          margin-bottom: clamp(16px, 3vw, 24px);
          line-height: 1.5;
        }
        .auth-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: var(--danger);
          padding: clamp(10px, 2vw, 12px) clamp(12px, 2.5vw, 14px);
          border-radius: var(--eh-radius-md);
          font-size: clamp(12px, 1.8vw, 13px);
          margin-bottom: clamp(12px, 2.5vw, 16px);
          text-align: center;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: clamp(12px, 2.5vw, 16px);
        }
        .auth-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .auth-label {
          font-size: clamp(12px, 1.8vw, 13px);
          font-weight: 600;
          color: var(--text-secondary);
        }
        .auth-submit-btn {
          margin-top: 8px;
          background: var(--accent-light);
          color: #fff;
          border: none;
          padding: clamp(12px, 2.5vw, 14px) clamp(24px, 4vw, 28px);
          border-radius: 10px;
          font-size: clamp(14px, 2.2vw, 15px);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 48px;
        }
        .auth-submit-btn:hover {
          background: #4f46e5;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          transform: translateY(-1px);
        }
        .auth-submit-btn:active {
          transform: scale(0.98);
        }
        .auth-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }
        .auth-terms {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 4px;
        }
        .auth-terms-checkbox {
          margin-top: 2px;
          accent-color: var(--accent-light);
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
        .auth-terms-label {
          font-size: clamp(12px, 1.7vw, 13px);
          color: #94a3b8;
          line-height: 1.5;
          cursor: pointer;
        }
        .auth-footer {
          margin-top: clamp(16px, 3vw, 20px);
          text-align: center;
          font-size: clamp(13px, 2vw, 14px);
          color: var(--text-muted);
        }
        .auth-link {
          color: var(--accent-light);
          text-decoration: none;
          font-weight: 600;
          transition: color 0.15s;
        }
        .auth-link:hover {
          color: #818cf8;
        }
        @media (max-width: 480px) {
          .auth-card {
            border-radius: 20px;
            padding: clamp(20px, 5vw, 28px);
          }
        }
      `}</style>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">🫀</div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Start your health assessment journey.</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} method="POST" action="/api/auth/register" className="auth-form">
            <div className="auth-field">
              <label className="auth-label" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="displayName">Display Name</label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="John Doe"
                required
                autoComplete="name"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                autoComplete="new-password"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                required
                autoComplete="new-password"
              />
            </div>

            <div className="auth-terms">
              <input
                id="termsAccepted"
                name="termsAccepted"
                type="checkbox"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                className="auth-terms-checkbox"
              />
              <label htmlFor="termsAccepted" className="auth-terms-label">
                I have read and agree to the{' '}
                <Link href="/legal/terms" className="auth-link">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/legal/privacy" className="auth-link">Privacy Policy</Link>
              </label>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{' '}
            <Link href="/auth/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </>
  );
}
