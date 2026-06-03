'use client';

import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();
  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Health Intake</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Complete your health assessment to get your Executive Health Score.
      </p>
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid var(--border)',
        }}
      >
        <p style={{ color: 'var(--text-muted)' }}>Intake form coming in next phase.</p>
        <button
          onClick={() => router.push('/auth/login')}
          style={{
            background: 'var(--accent-light)',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 600,
            marginTop: '16px',
            cursor: 'pointer',
          }}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
