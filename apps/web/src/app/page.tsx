'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => { if (!data.error) router.push('/dashboard'); })
        .catch(() => {});
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '20px' }}>
      <div style={{ textAlign: 'center', maxWidth: '520px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🫀</div>
        <h1 style={{ fontSize: '42px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '-0.02em' }}>
          Executive Health Score
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '32px' }}>
          AI-powered health assessment for high-performance professionals.
          <br />
          Complete your intake, get your score, track your progress.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link href="/auth/login">
            <button style={{ background: 'var(--accent-light)', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
              Sign In
            </button>
          </Link>
          <Link href="/auth/register">
            <button style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '12px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
              Create Account
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
