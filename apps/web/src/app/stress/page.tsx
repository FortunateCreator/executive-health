'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@executive-health/ui';
import type { MoodCheckIn } from '@executive-health/db';
import type { BurnoutRisk, Intervention, TrendAnalysis } from '@executive-health/stress';

interface StressDashboardData {
  check_ins: MoodCheckIn[];
  today_check_ins: MoodCheckIn[];
  burnout_risk: BurnoutRisk;
  interventions: Intervention[];
  trends: TrendAnalysis;
  cognitive_fatigue: boolean;
}

const TIME_OPTIONS = [
  { value: 'morning', label: '🌅 Morning' },
  { value: 'afternoon', label: '☀️ Afternoon' },
  { value: 'evening', label: '🌆 Evening' },
];

const TRIGGER_OPTIONS = [
  'Work pressure', 'Meeting overload', 'Email overload',
  'Lack of sleep', 'Personal issues', 'Deadline stress',
  'Health concerns', 'Work-life imbalance',
];

function getRiskColor(risk: string): string {
  switch (risk) {
    case 'low': return '#22c55e';
    case 'moderate': return '#eab308';
    case 'high': return '#f97316';
    case 'critical': return '#ef4444';
    default: return '#6b7280';
  }
}

function getRiskBg(risk: string): string {
  switch (risk) {
    case 'low': return '#14532d';
    case 'moderate': return '#3d2e0a';
    case 'high': return '#451a1a';
    case 'critical': return '#450a0a';
    default: return '#1a1a2e';
  }
}

function formatDateForInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function StressPage() {
  const router = useRouter();
  const [data, setData] = useState<StressDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mood check-in form
  const today = formatDateForInput(new Date());
  const [form, setForm] = useState({
    date: today,
    time_of_day: 'morning' as 'morning' | 'afternoon' | 'evening',
    mood_score: 7,
    stress_level: 4,
    energy_level: 7,
    anxiety_level: 3,
    workload_score: 5,
    sleep_quality: 7,
    triggers: [] as string[],
    notes: '',
  });

  const fetchData = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth/login'); return; }
    fetch('/api/stress', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(res => {
        if (res.error) { router.push('/auth/login'); return; }
        setData(res);
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleTrigger = (trigger: string) => {
    setForm(p => ({
      ...p,
      triggers: p.triggers.includes(trigger)
        ? p.triggers.filter(t => t !== trigger)
        : [...p.triggers, trigger],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth/login'); return; }

    try {
      const res = await fetch('/api/stress/mood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          triggers: form.triggers.length > 0 ? form.triggers : undefined,
          notes: form.notes || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setSuccess('Mood check-in saved! How are you feeling?');
        fetchData();
        setForm(p => ({ ...p, time_of_day: 'afternoon', notes: '', triggers: [] }));
      } else {
        setError(json.error || 'Failed to save');
      }
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Slider component ────────────────────────────────────
  const sliderRow = (
    label: string,
    emoji: string,
    value: number,
    onChange: (v: number) => void,
    color: string,
  ) => (
    <div className="eh-mb-16">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: '#e2e8f0' }}>
          {emoji} {label}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}/10</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          height: 6,
          borderRadius: 3,
          backgroundColor: '#2a2a4e',
          appearance: 'none',
          outline: 'none',
          accentColor: color,
          cursor: 'pointer',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 10, color: '#6b7280' }}>Low</span>
        <span style={{ fontSize: 10, color: '#6b7280' }}>High</span>
      </div>
    </div>
  );

  // ── CSS-Only Trend Chart ────────────────────────────────
  const TrendChart = ({ trends }: { trends: TrendAnalysis }) => {
    if (!trends.points || trends.points.length === 0) {
      return <div className="eh-empty">No trend data available yet. Start logging mood check-ins!</div>;
    }

    const points = trends.points;
    const days = points.map(p => {
      const d = new Date(p.date + 'T00:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    });

    const hasData = points.filter(p => p.check_ins > 0);
    if (hasData.length === 0) {
      return <div className="eh-empty">No data points yet</div>;
    }

    const maxVal = 10;
    const chartHeight = 180;
    const barWidth = `${Math.max(8, Math.floor(90 / days.length))}%`;

    const getBarColor = (field: 'mood_avg' | 'stress_avg' | 'energy_avg', val: number) => {
      if (val === 0) return '#2a2a4e';
      if (field === 'stress_avg') return val > 7 ? '#ef4444' : val > 5 ? '#f97316' : '#eab308';
      // mood and energy: higher is better
      if (field === 'mood_avg') return val > 7 ? '#22c55e' : val > 5 ? '#eab308' : val > 3 ? '#f97316' : '#ef4444';
      if (field === 'energy_avg') return val > 7 ? '#60a5fa' : val > 5 ? '#eab308' : val > 3 ? '#f97316' : '#ef4444';
      return '#6b7280';
    };

    const renderBars = (field: 'mood_avg' | 'stress_avg' | 'energy_avg', color: string) => (
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4, height: chartHeight, paddingTop: 20 }}>
        {points.map((p, i) => {
          const height = p.check_ins > 0 ? (p[field] / maxVal) * (chartHeight - 20) : 0;
          const barColor = getBarColor(field, p[field]);
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: 9, color: '#94a3b8', marginBottom: 4 }}>
                {p[field] > 0 ? p[field].toFixed(1) : '—'}
              </span>
              <div style={{
                width: '100%',
                height: Math.max(height, 2),
                backgroundColor: barColor,
                borderRadius: '3px 3px 0 0',
                transition: 'height 0.3s ease',
                opacity: p.check_ins > 0 ? 1 : 0.3,
              }} />
            </div>
          );
        })}
      </div>
    );

    const trendIcon = (trend: string) => {
      switch (trend) {
        case 'improving': return ' ↗️';
        case 'declining': return ' ↘️';
        default: return ' →';
      }
    };

    return (
      <div>
        <div className="eh-grid-3 eh-gap-12 eh-mb-16">
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Mood {trendIcon(trends.mood_trend)}
            </div>
            {renderBars('mood_avg', '#22c55e')}
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Stress {trendIcon(trends.stress_trend)}
            </div>
            {renderBars('stress_avg', '#ef4444')}
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Energy {trendIcon(trends.energy_trend)}
            </div>
            {renderBars('energy_avg', '#60a5fa')}
          </div>
        </div>
        {/* Day labels */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${days.length}, 1fr)`, gap: 4 }}>
          {days.map((day, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 10, color: '#6b7280' }}>{day}</div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="eh-empty">Loading...</div>
      </DashboardLayout>
    );
  }

  const risk = data?.burnout_risk;
  const riskColor = risk ? getRiskColor(risk.risk_category) : '#6b7280';
  const riskBg = risk ? getRiskBg(risk.risk_category) : '#1a1a2e';

  return (
    <DashboardLayout currentPath="/stress" onNavigate={(p) => router.push(p)}>
      <div className="eh-content">
        <h1 className="eh-page-title">🧘 Stress & Burnout</h1>
        <p className="eh-page-subtitle">Monitor your mental wellness and prevent burnout</p>

        {/* Error/Success Messages */}
        {error && (
          <div className="eh-alert-error">{error}</div>
        )}
        {success && (
          <div className="eh-alert-success">{success}</div>
        )}

        {/* Cognitive Fatigue Alert */}
        {data?.cognitive_fatigue && (
          <div style={{
            backgroundColor: '#450a0a',
            border: '2px solid #ef4444',
            borderRadius: 12,
            padding: '20px 24px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}>
            <span style={{ fontSize: 32 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, color: '#fca5a5', fontSize: 16, marginBottom: 4 }}>
                🧠 Cognitive Fatigue Detected
              </div>
              <div style={{ fontSize: 13, color: '#fca5a5', opacity: 0.9, lineHeight: 1.5 }}>
                Your last 3 check-ins show low energy (under 4/10) combined with high stress (over 7/10).
                This pattern indicates possible cognitive fatigue. Consider taking a rest day and reducing your workload.
              </div>
            </div>
          </div>
        )}

        {/* Burnout Risk Badge */}
        <div className="eh-card eh-mb-24" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div className="eh-stat-tile" style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            backgroundColor: riskBg,
            border: `4px solid ${riskColor}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <div className="eh-stat-value" style={{ color: riskColor }}>{risk?.overall ?? 0}</div>
            <div className="eh-stat-label" style={{ color: riskColor }}>Risk Score</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              Burnout Risk:
              <span className="eh-badge" style={{
                backgroundColor: riskBg,
                color: riskColor,
              }}>
                {risk?.risk_category ?? 'N/A'}
              </span>
            </div>
            <div className="eh-grid-3 eh-gap-12">
              {[
                { label: 'Exhaustion', value: risk?.exhaustion ?? 0, color: '#ef4444' },
                { label: 'Cynicism', value: risk?.cynicism ?? 0, color: '#f97316' },
                { label: 'Efficacy', value: risk?.efficacy ?? 0, color: '#22c55e' },
              ].map(metric => (
                <div className="eh-metric" key={metric.label}>
                  <div className="eh-metric-label">{metric.label}</div>
                  <div className="eh-metric-value" style={{ color: metric.color }}>{metric.value}</div>
                  <div style={{ fontSize: 10, color: '#6b7280' }}>/100</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Two-column layout: Check-in form + Trend chart */}
        <div className="eh-grid-main eh-mb-24">
          {/* Quick Mood Check-in */}
          <div className="eh-card">
            <h3 className="eh-section-title">
              ✍️ Quick Mood Check-in
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="eh-grid-2 eh-gap-12 eh-mb-16">
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>
                    Date
                  </label>
                  <input className="eh-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>
                    Time of Day
                  </label>
                  <select className="eh-select" value={form.time_of_day} onChange={e => setForm(p => ({ ...p, time_of_day: e.target.value as any }))} required>
                    {TIME_OPTIONS.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {sliderRow('Mood', '😊', form.mood_score, v => setForm(p => ({ ...p, mood_score: v })), '#22c55e')}
              {sliderRow('Stress', '😰', form.stress_level, v => setForm(p => ({ ...p, stress_level: v })), '#ef4444')}
              {sliderRow('Energy', '⚡', form.energy_level, v => setForm(p => ({ ...p, energy_level: v })), '#60a5fa')}
              {sliderRow('Anxiety', '😟', form.anxiety_level, v => setForm(p => ({ ...p, anxiety_level: v })), '#f97316')}

              <div className="eh-grid-2 eh-gap-12 eh-mb-16">
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>
                    Workload (optional)
                  </label>
                  <input
                    className="eh-input"
                    type="number"
                    min={1}
                    max={10}
                    value={form.workload_score}
                    onChange={e => setForm(p => ({ ...p, workload_score: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>
                    Sleep Quality (optional)
                  </label>
                  <input
                    className="eh-input"
                    type="number"
                    min={1}
                    max={10}
                    value={form.sleep_quality}
                    onChange={e => setForm(p => ({ ...p, sleep_quality: Number(e.target.value) }))}
                  />
                </div>
              </div>

              {/* Triggers */}
              <div className="eh-mb-16">
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>
                  Stress Triggers
                </label>
                <div className="eh-flex-wrap" style={{ gap: 6 }}>
                  {TRIGGER_OPTIONS.map(trigger => {
                    const selected = form.triggers.includes(trigger);
                    return (
                      <button
                        key={trigger}
                        type="button"
                        onClick={() => toggleTrigger(trigger)}
                        style={{
                          padding: '4px 12px',
                          borderRadius: 99,
                          border: selected ? '1px solid #3b82f6' : '1px solid #2a2a4e',
                          backgroundColor: selected ? '#1e3a5f' : 'transparent',
                          color: selected ? '#ffffff' : '#94a3b8',
                          fontSize: 11,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {trigger}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="eh-mb-16">
                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>
                  Notes (optional)
                </label>
                <textarea
                  className="eh-input"
                  style={{ minHeight: 50, resize: 'vertical' }}
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="How are you feeling today?"
                />
              </div>

              <button className="eh-btn eh-btn-primary" style={{ opacity: submitting ? 0.6 : 1 }} type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : '💾 Save Check-in'}
              </button>
            </form>
          </div>

          {/* Trend Chart */}
          <div className="eh-card">
            <h3 className="eh-section-title">
              📈 7-Day Mood, Stress & Energy Trends
            </h3>
            {data?.trends && <TrendChart trends={data.trends} />}
          </div>
        </div>

        {/* Intervention Plan */}
        {data?.interventions && data.interventions.length > 0 && (
          <div className="eh-card">
            <h3 className="eh-section-title">
              🩺 Your Intervention Plan
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {data.interventions.map(intervention => {
                const priorityColor =
                  intervention.priority === 'urgent' ? '#ef4444' :
                  intervention.priority === 'important' ? '#f97316' :
                  '#22c55e';
                const categoryIcon =
                  intervention.category === 'break' ? '☕' :
                  intervention.category === 'breathing' ? '🫁' :
                  intervention.category === 'mindfulness' ? '🧠' :
                  intervention.category === 'professional' ? '🏥' : '💡';
                return (
                  <div
                    key={intervention.id}
                    className="eh-metric"
                    style={{
                      borderLeft: `3px solid ${priorityColor}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>{categoryIcon}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>{intervention.title}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5, marginBottom: 8 }}>
                      {intervention.description}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>🕐 {intervention.frequency}</span>
                      <span className="eh-badge" style={{
                        backgroundColor: intervention.priority === 'urgent' ? '#450a0a' : intervention.priority === 'important' ? '#3d2e0a' : '#14532d',
                        color: priorityColor,
                      }}>
                        {intervention.priority}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Medical Disclaimer */}
        <div style={{
          textAlign: 'center',
          padding: '12px 16px',
          marginTop: 24,
          marginBottom: 8,
        }}>
          <p style={{
            color: '#6b7280',
            fontSize: 'clamp(10px, 1.5vw, 11px)',
            lineHeight: 1.5,
            margin: 0,
          }}>
            Always consult with a qualified healthcare provider before making any health decisions based on this information.
          </p>
        </div>

        {/* Crisis Resources */}
        <div style={{
          backgroundColor: 'rgba(249, 115, 22, 0.08)',
          border: '2px solid #f97316',
          borderRadius: 12,
          padding: '20px 24px',
          marginTop: 24,
          textAlign: 'center',
        }}>
          <span style={{ fontSize: 16, color: '#fdba74', fontWeight: 600 }}>
            📞 Need help? Call or text <strong style={{ color: '#ffffff' }}>988</strong> (Suicide & Crisis Lifeline)
          </span>
        </div>
      </div>
    </DashboardLayout>
  );
}
