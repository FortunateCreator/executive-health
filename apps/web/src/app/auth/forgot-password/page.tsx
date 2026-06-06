'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Request failed');
        return;
      }

      setSent(true);
      setMessage(data.message || 'Check your email for the reset code.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>🫀</div>
        <h1 style={styles.title}>Forgot Password</h1>

        {!sent ? (
          <>
            <p style={styles.subtitle}>Enter your email and we&apos;ll send you a reset code.</p>

            {error && <div style={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <button type="submit" style={styles.submitBtn} disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p style={styles.successMsg}>{message}</p>
            <p style={styles.subtitle}>Use the 6-digit code on the reset page to set a new password.</p>
            <Link href="/auth/reset-password" style={styles.link}>Go to Reset Password →</Link>
          </>
        )}

        <p style={styles.footer}>
          <Link href="/auth/login" style={styles.link}>Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-primary)', padding: '20px',
  },
  card: {
    background: 'var(--bg-secondary)', borderRadius: '16px', padding: '40px',
    maxWidth: '420px', width: '100%', border: '1px solid var(--border)',
  },
  logo: { fontSize: '48px', textAlign: 'center', marginBottom: '16px' },
  title: { fontSize: '28px', fontWeight: 700, textAlign: 'center', color: 'var(--text-primary)', marginBottom: '8px' },
  subtitle: { fontSize: '14px', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.5 },
  successMsg: { fontSize: '14px', textAlign: 'center', color: '#22c55e', marginBottom: '16px', lineHeight: 1.5, background: 'rgba(34,197,94,0.1)', padding: '12px', borderRadius: '8px' },
  error: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' },
  submitBtn: { marginTop: '8px', background: 'var(--accent-light)', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' },
  footer: { marginTop: '20px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' },
  link: { color: 'var(--accent-light)', textDecoration: 'none', fontWeight: 600 },
};
