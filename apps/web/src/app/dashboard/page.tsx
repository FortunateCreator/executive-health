'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ display_name: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.error) router.push('/auth/login');
        else setUser(data.user);
      });
  }, [router]);

  if (!user) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Dashboard</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Welcome back, {user.display_name}
      </p>
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid var(--border)',
        }}
      >
        <p style={{ color: 'var(--text-muted)' }}>
          Complete your health intake to see your score.
        </p>
        <a
          href="/onboarding"
          style={{
            display: 'inline-block',
            marginTop: '16px',
            background: 'var(--accent-light)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Start Intake
        </a>
      </div>
    </div>
  );
}
