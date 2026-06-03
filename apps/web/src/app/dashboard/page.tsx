'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExecutiveScoreRing, TrendChartSimplified, RiskBadge, DashboardLayout } from '@executive-health/ui';
import type { HealthScore, IntakeFormData } from '@executive-health/core';

interface DashboardData {
  user: { id: string; email: string; display_name: string; last_score: number | null };
  latestScore: HealthScore | null;
  scores: { date: string; score: number }[];
  hasCompletedIntake: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth/login'); return; }

    Promise.all([
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/scores', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([userRes, scoresRes]) => {
      if (userRes.error) { router.push('/auth/login'); return; }
      setData({
        user: userRes.user,
        latestScore: scoresRes.latestScore ?? null,
        scores: scoresRes.history ?? [],
        hasCompletedIntake: userRes.user.last_intake_date !== null,
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>Loading...</div></DashboardLayout>;
  if (!data) return null;

  return (
    <DashboardLayout userName={data.user.display_name}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Welcome back, {data.user.display_name}</p>

        {!data.hasCompletedIntake ? (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '32px', textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🫀</div>
            <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Complete Your Health Intake</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', maxWidth: '400px', margin: '0 auto 20px' }}>
              Get your personalized Executive Health Score by completing a quick health assessment.
            </p>
            <button onClick={() => router.push('/onboarding')} style={{ background: 'var(--accent-light)', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
              Start Intake
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '24px', textAlign: 'center', border: '1px solid var(--border)' }}>
                <ExecutiveScoreRing score={data.latestScore?.overall ?? 0} size={180} strokeWidth={10} />
              </div>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--text-secondary)' }}>Score Breakdown</h3>
                {data.latestScore?.score_breakdown.map((b, i) => (
                  <div key={i} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{b.category}</span>
                      <span style={{ fontWeight: 600 }}>{Math.round(b.score)}</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--bg-card)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${b.score}%`, background: b.score >= 80 ? 'var(--success)' : b.score >= 60 ? 'var(--warning)' : 'var(--danger)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {data.scores.length > 1 && (
              <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--text-secondary)' }}>Score History</h3>
                <TrendChartSimplified dataPoints={data.scores} width={800} height={200} />
              </div>
            )}

            {data.latestScore?.recommendations && data.latestScore.recommendations.length > 0 && (
              <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--text-secondary)' }}>Recommendations</h3>
                {data.latestScore.recommendations.map((rec, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--success)', fontSize: '18px' }}>→</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: 1.5 }}>{rec}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
