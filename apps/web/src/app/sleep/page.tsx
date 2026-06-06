'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout, SleepIdleDetector } from '@executive-health/ui';
import type { SleepRecord } from '@executive-health/db';
import type { SleepScore, SleepRecommendation } from '@executive-health/sleep';

interface SleepDashboardData {
  records: SleepRecord[];
  score: SleepScore | null;
  weekly_summary: {
    avg_duration: number;
    avg_quality: string;
    total_debt: number;
    nights_logged: number;
  };
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function formatDateForInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function SleepPage() {
  const router = useRouter();
  const [data, setData] = useState<SleepDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedNight, setExpandedNight] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<SleepRecommendation[]>([]);
  const [contextualTip, setContextualTip] = useState('');

  // Form state — default to yesterday since you log sleep after waking up
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const defaultDate = formatDateForInput(yesterday);
  const [form, setForm] = useState({
    date: defaultDate,
    bedtime: '22:00',
    wake_time: '06:00',
    quality: 'good' as SleepRecord['quality'],
    interruptions: '0',
    notes: '',
  });

  const fetchData = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth/login'); return; }
    fetch('/api/sleep', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(res => {
        if (res.error) { router.push('/auth/login'); return; }
        setData(res);
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchRecommendations = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/sleep/recommendations', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(res => {
        if (res.recommendations) setRecommendations(res.recommendations);
        if (res.contextualTip) setContextualTip(res.contextualTip);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { fetchRecommendations(); }, [fetchRecommendations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth/login'); return; }

    const bedtimeDate = new Date(`${form.date}T${form.bedtime}:00`);
    const wakeDate = new Date(`${form.date}T${form.wake_time}:00`);
    if (wakeDate <= bedtimeDate) {
      wakeDate.setDate(wakeDate.getDate() + 1);
    }
    const bedtimeISO = bedtimeDate.toISOString();
    const wakeTimeISO = wakeDate.toISOString();

    try {
      const res = await fetch('/api/sleep/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: form.date,
          bedtime: bedtimeISO,
          wake_time: wakeTimeISO,
          quality: form.quality,
          interruptions: Number(form.interruptions),
          notes: form.notes || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setSuccess('Sleep record saved!');
        fetchData();
        fetchRecommendations();
        // Reset form for next day
        setForm(prev => ({
          ...prev,
          quality: 'good',
          interruptions: '0',
          notes: '',
        }));
      } else {
        setError(json.error || 'Failed to save');
      }
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 4,
  };

  const qualityBadge = (q: string) => {
    const color = q === 'excellent' ? '#22c55e' : q === 'good' ? '#60a5fa' : q === 'fair' ? '#eab308' : '#ef4444';
    return (
      <span style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 99,
        backgroundColor: color,
        color: '#fff',
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
      }}>
        {q}
      </span>
    );
  };

  const breakdownCard = (label: string, value: number, color: string) => (
    <div className="eh-card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ marginTop: 8, height: 4, backgroundColor: '#0f0f23', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, backgroundColor: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="eh-empty">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPath="/sleep" onNavigate={(p) => router.push(p)}>
      <SleepIdleDetector getToken={() => localStorage.getItem('token')} onSleepLogged={fetchData} />
      <div className="eh-content">
        <h1 className="eh-page-title">🌙 Sleep Dashboard</h1>
        <p className="eh-page-subtitle">Track your sleep quality and patterns</p>

        {/* Score + Breakdown */}
        <div className="eh-grid-aside eh-mb-24">
          {/* Sleep Score Ring */}
          <div className="eh-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <SleepScoreRing score={data?.score?.overall ?? 0} size={180} strokeWidth={10} />
          </div>

          {/* Score Breakdown Cards */}
          <div className="eh-grid-2">
            {breakdownCard('Duration', data?.score?.duration_score ?? 0, '#60a5fa')}
            {breakdownCard('Consistency', data?.score?.consistency_score ?? 0, '#a78bfa')}
            {breakdownCard('Quality', data?.score?.quality_score ?? 0, '#34d399')}
            {breakdownCard('Recovery Index', data?.score?.recovery_index ?? 0, '#f59e0b')}
          </div>
        </div>

        {/* Sleep Debt Alert */}
        {data?.score && data.score.sleep_debt_minutes > 0 && (
          <div className="eh-alert-error" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 600, color: '#fca5a5', marginBottom: 2 }}>Sleep Debt: {formatDuration(data.score.sleep_debt_minutes)}</div>
              <div style={{ fontSize: 13, color: '#fca5a5', opacity: 0.8 }}>
                You are behind on sleep. Aim for at least 8 hours per night to recover.
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Recommendations */}
        {recommendations.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 className="eh-section-title" style={{ marginBottom: 12 }}>💡 Personalized Recommendations</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recommendations.map((rec) => {
                const priorityColor =
                  rec.priority === 'critical' ? '#ef4444' :
                  rec.priority === 'high' ? '#f97316' :
                  rec.priority === 'medium' ? '#eab308' :
                  '#22c55e';
                const priorityBg =
                  rec.priority === 'critical' ? '#451a1a' :
                  rec.priority === 'high' ? '#452310' :
                  rec.priority === 'medium' ? '#453a10' :
                  '#14532d';
                return (
                  <div
                    key={rec.id}
                    className="eh-card"
                    style={{
                      borderLeft: `4px solid ${priorityColor}`,
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                    }}
                  >
                    <span style={{ fontSize: 24, flexShrink: 0 }}>{rec.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, color: '#ffffff', fontSize: 14 }}>{rec.title}</span>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          color: priorityColor,
                          backgroundColor: priorityBg,
                          padding: '1px 8px',
                          borderRadius: 99,
                          letterSpacing: 0.5,
                        }}>
                          {rec.priority}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>{rec.tip}</div>
                      {rec.action && (
                        <div style={{
                          marginTop: 8,
                          fontSize: 12,
                          color: '#60a5fa',
                          fontWeight: 500,
                          backgroundColor: '#0f3460',
                          padding: '6px 12px',
                          borderRadius: 6,
                          display: 'inline-block',
                        }}>
                          🔹 {rec.action}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Contextual Tip */}
            {contextualTip && (
              <div style={{
                marginTop: 16,
                padding: '14px 18px',
                backgroundColor: '#16213e',
                borderRadius: 10,
                border: '1px solid #2a2a4e',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 13,
                color: '#94a3b8',
              }}>
                <span style={{ fontSize: 18 }}>🕐</span>
                <span>{contextualTip}</span>
              </div>
            )}
          </div>
        )}

        {/* Fallback: simple recommendation when no enhanced recs */}
        {recommendations.length === 0 && data?.score?.recommendation && (
          <div className="eh-card" style={{ marginBottom: 24, borderLeft: '4px solid #60a5fa', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <div>
              <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: 4 }}>Recommendation</div>
              <div style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6 }}>{data.score.recommendation}</div>
            </div>
          </div>
        )}

        {/* Log Sleep Form */}
        <div className="eh-card eh-mb-24">
          <h3 className="eh-section-title">📝 Log Last Night&apos;s Sleep</h3>
          {error && (
            <div className="eh-alert-error">
              {error}
            </div>
          )}
          {success && (
            <div className="eh-alert-success">
              {success}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="eh-grid-3">
              <div>
                <label style={labelStyle}>Date</label>
                <input className="eh-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
              </div>
              <div>
                <label style={labelStyle}>Bedtime</label>
                <input className="eh-input" type="time" value={form.bedtime} onChange={e => setForm(p => ({ ...p, bedtime: e.target.value }))} required />
              </div>
              <div>
                <label style={labelStyle}>Wake Time</label>
                <input className="eh-input" type="time" value={form.wake_time} onChange={e => setForm(p => ({ ...p, wake_time: e.target.value }))} required />
              </div>
            </div>
            <div className="eh-grid-2">
              <div>
                <label style={labelStyle}>Sleep Quality</label>
                <select className="eh-input" value={form.quality} onChange={e => setForm(p => ({ ...p, quality: e.target.value as SleepRecord['quality'] }))} required>
                  <option value="excellent">🌟 Excellent</option>
                  <option value="good">👍 Good</option>
                  <option value="fair">😐 Fair</option>
                  <option value="poor">😞 Poor</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Interruptions</label>
                <input className="eh-input" type="number" min="0" max="20" value={form.interruptions} onChange={e => setForm(p => ({ ...p, interruptions: e.target.value }))} required />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Notes (optional)</label>
              <textarea
                className="eh-input"
                style={{ minHeight: 60, resize: 'vertical' }}
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="e.g., Had caffeine late, noisy environment..."
              />
            </div>
            <button className="eh-btn eh-btn-primary" type="submit" disabled={submitting} style={{ opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Saving...' : 'Save Sleep Record'}
            </button>
          </form>
        </div>

        {/* Last 7 Nights Table */}
        <div className="eh-card">
          <h3 className="eh-section-title">🕐 Last 7 Nights</h3>
          {!data?.records?.length ? (
            <div className="eh-empty">
              No sleep records yet. Log your first night above.
            </div>
          ) : (
            <div className="eh-table-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #2a2a4e', color: '#94a3b8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #2a2a4e', color: '#94a3b8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Duration</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #2a2a4e', color: '#94a3b8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Quality</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #2a2a4e', color: '#94a3b8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Bedtime</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #2a2a4e', color: '#94a3b8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Wake Time</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #2a2a4e', color: '#94a3b8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Interruptions</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #2a2a4e', color: '#94a3b8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {data.records.slice(0, 7).map((record) => (
                    <>
                      <tr
                        key={record.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setExpandedNight(expandedNight === record.id ? null : record.id)}
                      >
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #1f1f3a', color: '#e2e8f0' }}>{new Date(record.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #1f1f3a', color: '#e2e8f0', fontWeight: 600 }}>{formatDuration(record.duration_minutes)}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #1f1f3a', color: '#e2e8f0' }}>{qualityBadge(record.quality)}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #1f1f3a', color: '#e2e8f0' }}>{formatTime(record.bedtime)}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #1f1f3a', color: '#e2e8f0' }}>{formatTime(record.wake_time)}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #1f1f3a', color: '#e2e8f0', textAlign: 'center' }}>{record.interruptions}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #1f1f3a', color: '#e2e8f0' }}>
                          <span style={{ color: '#6b7280', fontSize: 18 }}>{expandedNight === record.id ? '▾' : '▸'}</span>
                        </td>
                      </tr>
                      {expandedNight === record.id && (
                        <tr key={`${record.id}-expanded`}>
                          <td colSpan={7} style={{ padding: '12px 12px', backgroundColor: '#0f0f23' }}>
                            <div className="eh-grid-4" style={{ fontSize: 13 }}>
                              {record.deep_sleep_minutes != null && (
                                <div>
                                  <span style={{ color: '#6b7280' }}>Deep Sleep: </span>
                                  <span style={{ color: '#e2e8f0' }}>{formatDuration(record.deep_sleep_minutes)}</span>
                                </div>
                              )}
                              {record.rem_sleep_minutes != null && (
                                <div>
                                  <span style={{ color: '#6b7280' }}>REM Sleep: </span>
                                  <span style={{ color: '#e2e8f0' }}>{formatDuration(record.rem_sleep_minutes)}</span>
                                </div>
                              )}
                              {record.heart_rate_variability != null && (
                                <div>
                                  <span style={{ color: '#6b7280' }}>HRV: </span>
                                  <span style={{ color: '#e2e8f0' }}>{record.heart_rate_variability} ms</span>
                                </div>
                              )}
                              {record.notes && (
                                <div style={{ gridColumn: '1 / -1' }}>
                                  <span style={{ color: '#6b7280' }}>Notes: </span>
                                  <span style={{ color: '#e2e8f0' }}>{record.notes}</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Medical Disclaimer */}
        <div style={{
          textAlign: 'center',
          padding: '12px 16px',
          marginTop: 8,
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
      </div>
    </DashboardLayout>
  );
}

// ── Sleep Score Ring (adapted from ExecutiveScoreRing) ──
function SleepScoreRing({ score, size = 200, strokeWidth = 12 }: { score: number; size?: number; strokeWidth?: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const startTime = performance.now();
    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(score * eased));
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [score]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const sc = getScoreColor(animatedScore);
  const dashOffset = circumference - (animatedScore / 100) * circumference;
  const fontSize = Math.round(size * 0.22);
  const subFontSize = Math.round(size * 0.07);

  return (
    <div className="eh-score-ring-wrap">
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg style={{ transform: 'rotate(-90deg)', width: size, height: size }} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={center} cy={center} r={radius} fill="none" stroke="#1a1a2e" strokeWidth={strokeWidth} />
          <circle
            cx={center} cy={center} r={radius} fill="none" stroke={sc} strokeWidth={strokeWidth}
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', top: 0, left: 0, width: size, height: size, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <span style={{ fontSize, fontWeight: 700, color: '#ffffff', lineHeight: 1 }}>{animatedScore}</span>
          <span style={{ fontSize: subFontSize, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
            SLEEP SCORE
          </span>
        </div>
      </div>
    </div>
  );
}
