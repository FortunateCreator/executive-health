'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExecutiveScoreRing, TrendChartSimplified, RiskBadge, DashboardLayout, AlertBanner, TrendCard } from '@executive-health/ui';
import type { AlertData, TrendData } from '@executive-health/ui';
import type { HealthScore, IntakeFormData } from '@executive-health/core';
import type { HealthSnapshot, TrendSignal, Correlation } from '@executive-health/analytics';

interface DashboardData {
  user: { id: string; email: string; display_name: string; last_score: number | null };
  latestScore: HealthScore | null;
  scores: { date: string; score: number }[];
  hasCompletedIntake: boolean;
}

interface AlertsResponse {
  snapshot: HealthSnapshot;
  signals: TrendSignal[];
  correlations: Correlation[];
  alerts: AlertData[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertsRes, setAlertsRes] = useState<AlertsResponse | null>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(true);
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    const update = () => setWindowWidth(window.innerWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      let token: string | null = null;
      try {
        token = localStorage.getItem('token');
      } catch { /* private browsing */ }
      if (!token) {
        try {
          const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
          if (match) {
            token = decodeURIComponent(match[1]);
            try { localStorage.setItem('token', token); } catch { /* ignore */ }
          }
        } catch { /* cookie access denied */ }
      }
      if (!token) {
        if (!cancelled) router.push('/auth/login');
        return;
      }

      try {
        const [userRes, scoresRes, alertsRes] = await Promise.all([
          fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => { if (!r.ok) throw new Error(`auth/me returned ${r.status}`); return r.json(); }),
          fetch('/api/scores', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => { if (!r.ok) throw new Error(`scores returned ${r.status}`); return r.json(); }),
          fetch('/api/alerts', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null),
        ]);

        if (cancelled) return;

        if (userRes.error) {
          router.push('/auth/login');
          return;
        }

        setData({
          user: userRes.user,
          latestScore: scoresRes.latestScore ?? null,
          scores: scoresRes.history ?? [],
          hasCompletedIntake: userRes.user?.last_intake_date != null,
        });
        if (alertsRes && !alertsRes.error) {
          setAlertsRes(alertsRes as AlertsResponse);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();
    return () => { cancelled = true; };
  }, [router]);

  if (loading) return <DashboardLayout><div className="eh-empty" style={{ padding: 'clamp(40px, 10vw, 80px)', fontSize: 'var(--eh-text-base)' }}>Loading your health dashboard…</div></DashboardLayout>;

  if (error) {
    return (
      <DashboardLayout>
        <div className="eh-content">
          <div className="eh-alert-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
          <button className="eh-btn eh-btn-primary" onClick={() => { setError(null); setLoading(true); window.location.reload(); }}>
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return null;

  const isTablet = windowWidth > 480 && windowWidth <= 1024;
  const isMobile = windowWidth > 0 && windowWidth <= 480;

  // ── Build TrendCard data ──
  function buildTrendCards(): TrendData[] {
    if (!alertsRes?.snapshot) return [];
    const snap = alertsRes.snapshot;
    const cards: TrendData[] = [];

    // Overall Health — always first
    cards.push({
      module: 'Overall Health',
      icon: '🫀',
      metrics: [
        { label: 'Health Score', value: snap.healthScore.overall > 0 ? `${snap.healthScore.overall}/100` : '—', trend: snap.healthScore.recent_change > 0 ? 'up' : snap.healthScore.recent_change < -5 ? 'down' : 'stable' },
        { label: 'Modules Tracked', value: `${snap.summary.module_count}/4`, trend: 'stable' },
        { label: 'Risk Level', value: snap.summary.overall_risk, trend: snap.summary.overall_risk === 'low' ? 'up' : snap.summary.overall_risk === 'critical' ? 'down' : 'stable' },
      ],
      summary: snap.summary.overall_risk === 'low'
        ? 'You are in great shape. Keep maintaining your healthy routines.'
        : snap.summary.overall_risk === 'moderate'
          ? 'Some areas need attention. Review your module-specific trends below.'
          : 'Priority actions needed. Focus on sleep and stress management first.',
      alertCount: alertsRes.alerts.length,
      actionUrl: '/records',
    });

    if (snap.sleep) {
      cards.push({
        module: 'Sleep',
        icon: '🌙',
        metrics: [
          { label: 'Avg Duration', value: snap.sleep.avg_duration_hours ? `${snap.sleep.avg_duration_hours}h` : '—', trend: snap.sleep.trend === 'improving' ? 'up' : snap.sleep.trend === 'declining' ? 'down' : 'stable' },
          { label: 'Quality', value: snap.sleep.avg_quality ? `${snap.sleep.avg_quality}/100` : '—', trend: snap.sleep.trend === 'improving' ? 'up' : snap.sleep.trend === 'declining' ? 'down' : 'stable' },
          { label: 'Sleep Debt', value: `${snap.sleep.total_debt_hours}h`, trend: snap.sleep.total_debt_hours > 5 ? 'down' : 'stable' },
        ],
        summary: snap.sleep.nights_logged > 0
          ? `You logged ${snap.sleep.nights_logged} nights. ${snap.sleep.trend === 'improving' ? 'Your sleep is trending up — keep it going!' : snap.sleep.trend === 'declining' ? 'Sleep is declining. Aim for 7-8h nightly.' : 'Sleep is holding steady.'}`
          : 'No sleep data yet. Start tracking to see trends.',
        alertCount: alertsRes.alerts.filter(a => a.module === 'sleep').length,
        actionUrl: '/sleep',
      });
    }

    if (snap.nutrition) {
      cards.push({
        module: 'Nutrition',
        icon: '🥗',
        metrics: [
          { label: 'Avg Calories', value: snap.nutrition.avg_daily_calories ? `${snap.nutrition.avg_daily_calories}` : '—', trend: snap.nutrition.quality_trend === 'improving' ? 'up' : snap.nutrition.quality_trend === 'declining' ? 'down' : 'stable' },
          { label: 'Log Rate', value: `${snap.nutrition.meal_log_rate}%`, trend: snap.nutrition.meal_log_rate >= 50 ? 'up' : 'down' },
          { label: 'Protein Target', value: snap.nutrition.protein_target_pct ? `${snap.nutrition.protein_target_pct}%` : '—', trend: snap.nutrition.protein_target_pct >= 80 ? 'up' : snap.nutrition.protein_target_pct >= 50 ? 'stable' : 'down' },
        ],
        summary: snap.nutrition.days_with_data > 0
          ? `Meals tracked on ${snap.nutrition.days_with_data} days. ${snap.nutrition.meal_log_rate >= 70 ? 'Great consistency with your food logging.' : 'Try logging meals more consistently for better insights.'}`
          : 'No nutrition data yet. Log your first meal to get started.',
        alertCount: alertsRes.alerts.filter(a => a.module === 'nutrition').length,
        actionUrl: '/nutrition',
      });
    }

    if (snap.stress) {
      cards.push({
        module: 'Stress & Burnout',
        icon: '🧘',
        metrics: [
          { label: 'Avg Mood', value: snap.stress.avg_mood ? `${snap.stress.avg_mood}/100` : '—', trend: snap.stress.trend === 'improving' ? 'up' : snap.stress.trend === 'declining' ? 'down' : 'stable' },
          { label: 'Avg Stress', value: snap.stress.avg_stress ? `${snap.stress.avg_stress}/100` : '—', trend: snap.stress.avg_stress > 60 ? 'down' : 'stable' },
          { label: 'Burnout Risk', value: `${snap.stress.burnout_risk}/100`, trend: snap.stress.burnout_risk > 50 ? 'down' : 'stable' },
        ],
        summary: snap.stress.check_in_rate > 0
          ? `${snap.stress.check_in_rate}% check-in rate. ${snap.stress.burnout_risk >= 70 ? 'Burnout risk is elevated — prioritize recovery.' : snap.stress.burnout_risk >= 50 ? 'Moderate burnout risk. Watch your stress levels.' : 'Burnout risk looks manageable.'}`
          : 'No stress check-ins yet. A 30-second check-in reveals valuable patterns.',
        alertCount: alertsRes.alerts.filter(a => a.module === 'stress').length,
        actionUrl: '/stress',
      });
    }

    return cards;
  }


  const trendCards = buildTrendCards();

  return (
    <DashboardLayout userName={data.user.display_name} currentPath="/" onNavigate={(p) => router.push(p)}>
      <style>{`
        /* ── Dashboard-specific responsive styles ── */
        .eh-dash-score-ring-wrap {
          display: flex;
          justify-content: center;
        }

        /* Tablet: score ring scales down slightly */
        @media (max-width: 1024px) {
          .eh-dash-score-ring-wrap > div {
            transform: scale(0.9);
            transform-origin: center center;
          }
        }

        @media (max-width: 768px) {
          .eh-dash-score-ring-wrap > div {
            transform: scale(0.85);
            transform-origin: center center;
          }
        }

        @media (max-width: 480px) {
          .eh-dash-score-ring-wrap > div {
            transform: scale(0.75);
            transform-origin: center center;
          }
          .eh-dash-recs > div {
            gap: 8px !important;
            margin-bottom: 8px !important;
          }
        }

        /* Onboarding prompt modal */
        .eh-onboard-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: eh-fade-in 0.25s ease;
        }
        .eh-onboard-modal-inner {
          background: var(--bg-card);
          border-radius: 16px;
          padding: clamp(28px, 5vw, 40px);
          max-width: 480px;
          width: 100%;
          text-align: center;
          border: 1px solid var(--border-light);
          box-shadow: var(--eh-shadow-xl);
          animation: eh-scale-in 0.3s ease;
        }

        /* Score ring card */
        .eh-dash-score-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: clamp(12px, 2.5vw, 20px);
        }

        /* Page content entry animation */
        .eh-dash-content {
          animation: eh-fade-in-up 0.4s ease;
        }
      `}</style>

      <div className="eh-content eh-dash-content">
        <h1 className="eh-page-title">Dashboard</h1>
        <p className="eh-page-subtitle">Welcome back, {data.user.display_name}</p>

        {/* ── Alert Banners ── */}
        {alertsRes?.alerts && alertsRes.alerts.length > 0 && (
          <div style={{ marginBottom: 'clamp(12px, 2.5vw, 20px)' }}>
            {alertsRes.alerts.map(a => (
              <AlertBanner
                key={a.id}
                alert={a}
                onDismiss={(id) => {
                  setAlertsRes(prev => prev ? {
                    ...prev,
                    alerts: prev.alerts.filter(alert => alert.id !== id),
                  } : prev);
                }}
                onAction={(url) => router.push(url)}
              />
            ))}
          </div>
        )}

        {/* ── Onboarding prompt ── */}
        {!data.hasCompletedIntake && showOnboardingModal && (
          <div className="eh-onboard-modal-backdrop">
            <div className="eh-onboard-modal-inner">
              <div style={{
                fontSize: 'clamp(40px, 8vw, 48px)',
                marginBottom: '16px',
                animation: 'eh-pulse-gentle 3s ease-in-out infinite',
              }}>
                🚀
              </div>
              <h2 style={{
                fontSize: 'clamp(18px, 3vw, 22px)',
                marginBottom: '10px',
                color: '#fff',
                fontWeight: 700,
                lineHeight: 1.2,
              }}>
                Welcome! Complete Your Health Profile
              </h2>
              <p style={{
                color: 'var(--text-secondary)',
                marginBottom: '24px',
                fontSize: 'clamp(13px, 2vw, 14px)',
                lineHeight: 1.6,
                maxWidth: '360px',
                margin: '0 auto 24px',
                padding: '0 8px',
              }}>
                To get your personalized Executive Health Score and unlock all features, please complete your quick health assessment.
              </p>
              <button
                onClick={() => router.push('/onboarding')}
                className="eh-btn eh-btn-primary"
                style={{
                  padding: 'clamp(14px, 2.5vw, 16px) clamp(28px, 5vw, 36px)',
                  fontSize: 'clamp(15px, 2.5vw, 16px)',
                  fontWeight: 600,
                  width: '100%',
                  maxWidth: '300px',
                  borderRadius: 12,
                }}
              >
                Start Assessment →
              </button>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '12px',
                marginTop: 'clamp(10px, 2vw, 14px)',
                marginBottom: '6px',
              }}>
                Already done? Just close and continue.
              </p>
              <button
                onClick={() => setShowOnboardingModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  opacity: 0.7,
                  minHeight: 36,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.7'; }}
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {data.hasCompletedIntake && (
          <>
            {/* ── Score + Breakdown ── */}
            <div className={isMobile ? '' : 'eh-grid-2'} style={{ marginBottom: 'clamp(16px, 3vw, 24px)' }}>
              <div className="eh-card eh-dash-score-card eh-card-lift">
                <div className="eh-dash-score-ring-wrap">
                  <ExecutiveScoreRing score={data.latestScore?.overall ?? 0} size={180} strokeWidth={10} />
                </div>
                <p style={{
                  color: '#6b7280',
                  fontSize: 'clamp(10px, 1.5vw, 11px)',
                  lineHeight: 1.5,
                  maxWidth: 280,
                  textAlign: 'center',
                  padding: '0 8px',
                }}>
                  Always consult with a qualified healthcare provider before making any health decisions based on this information.
                </p>
              </div>
              <div className="eh-card eh-card-lift">
                <h3 className="eh-section-title">Score Breakdown</h3>
                {data.latestScore?.score_breakdown.map((b, i) => (
                  <div key={i}>
                    <div className="eh-score-bar">
                      <span style={{ color: 'var(--text-secondary)' }}>{b.category}</span>
                      <span style={{ fontWeight: 600 }}>{Math.round(b.score)}</span>
                    </div>
                    <div className="eh-score-bar-track">
                      <div style={{
                        height: '100%',
                        width: `${b.score}%`,
                        background: b.score >= 80 ? 'var(--success)' : b.score >= 60 ? 'var(--warning)' : 'var(--danger)',
                        borderRadius: '3px',
                        transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Score History ── */}
            {data.scores.length > 1 && (
              <div className="eh-card eh-card-lift" style={{ marginBottom: 'clamp(16px, 3vw, 24px)' }}>
                <h3 className="eh-section-title">Score History</h3>
                <div className="eh-table-wrap eh-chart-responsive">
                  <TrendChartSimplified
                    dataPoints={data.scores}
                    width={typeof window !== 'undefined' ? Math.min(window.innerWidth - 80, 900) : 800}
                    height={isMobile ? 180 : 220}
                  />
                </div>
              </div>
            )}

            {/* ── Recommendations ── */}
            {data.latestScore?.recommendations && data.latestScore.recommendations.length > 0 && (
              <div className="eh-card eh-card-lift" style={{ marginBottom: 'clamp(16px, 3vw, 24px)' }}>
                <h3 className="eh-section-title">Recommendations</h3>
                {data.latestScore.recommendations.map((rec: any, i: number) => {
                  // Handle both structured and legacy string formats
                  if (typeof rec === 'string') {
                    return (
                      <div key={i} className="eh-dash-recs" style={{
                        display: 'flex',
                        gap: 'clamp(8px, 1.5vw, 10px)',
                        marginBottom: 'clamp(8px, 1.5vw, 10px)',
                        alignItems: 'flex-start',
                      }}>
                        <span style={{ color: 'var(--success)', fontSize: 'clamp(16px, 2vw, 18px)', flexShrink: 0, lineHeight: 1.4 }}>→</span>
                        <span style={{
                          color: 'var(--text-primary)',
                          fontSize: 'clamp(13px, 2vw, 14px)',
                          lineHeight: 1.5,
                        }}>
                          {rec}
                        </span>
                      </div>
                    );
                  }
                  // Structured recommendation
                  const categoryColors: Record<string, string> = {
                    cardiovascular: '#60a5fa',
                    metabolic: '#34d399',
                    lifestyle: '#f59e0b',
                    mental_wellbeing: '#a78bfa',
                    general: '#94a3b8',
                  };
                  const categoryBgs: Record<string, string> = {
                    cardiovascular: '#1e3a5f',
                    metabolic: '#14532d',
                    lifestyle: '#453a10',
                    mental_wellbeing: '#2e1a47',
                    general: '#1a1a2e',
                  };
                  const borderColor = categoryColors[rec.category] || '#2a2a4e';
                  const bgColor = categoryBgs[rec.category] || '#16213e';
                  return (
                    <div key={i} style={{
                      borderLeft: `4px solid ${borderColor}`,
                      backgroundColor: bgColor,
                      borderRadius: 8,
                      padding: 'clamp(12px, 2vw, 16px)',
                      marginBottom: 'clamp(10px, 1.5vw, 14px)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, color: '#ffffff', fontSize: 'clamp(14px, 2vw, 15px)' }}>
                          {rec.heading}
                        </span>
                        {rec.category && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            color: borderColor,
                            backgroundColor: categoryBgs[rec.category] || '#1a1a2e',
                            padding: '1px 8px',
                            borderRadius: 99,
                          }}>
                            {rec.category.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <p style={{
                        color: '#cbd5e1',
                        fontSize: 'clamp(13px, 1.8vw, 14px)',
                        lineHeight: 1.6,
                        marginBottom: 10,
                      }}>
                        {rec.detail}
                      </p>
                      <div style={{
                        backgroundColor: '#0f3460',
                        padding: '8px 12px',
                        borderRadius: 6,
                        display: 'inline-block',
                        fontSize: 'clamp(12px, 1.6vw, 13px)',
                        color: '#60a5fa',
                        fontWeight: 500,
                      }}>
                        🔹 {rec.action}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Trend Cards ── */}
        {trendCards.length > 0 && (
          <div style={{ marginTop: 'clamp(16px, 3vw, 24px)' }}>
            <h3 className="eh-section-title">Module Trends</h3>
            <div
              className={isMobile ? '' : isTablet ? 'eh-grid-2' : 'eh-grid-2'}
              style={{ marginTop: 12 }}
            >
              {trendCards.map((card, i) => (
                <TrendCard
                  key={i}
                  data={card}
                  onAction={(url) => router.push(url)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
