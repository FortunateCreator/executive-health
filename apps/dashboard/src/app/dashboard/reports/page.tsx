'use client';
import { useState, useEffect } from 'react';

interface OrgAnalytics {
  org_id: string;
  total_members: number;
  active_members: number;
  engagement_rate: number;
  average_health_score: number;
  health_score_trend: Array<{ date: string; score: number }>;
  department_breakdown: Array<{ department: string; members: number; avg_score: number; engagement: number }>;
  risk_distribution: { low: number; moderate: number; high: number; critical: number };
  sleep_avg_hours: number;
  stress_avg_level: number;
  last_updated: string;
}

export default function ReportsPage() {
  const [analytics, setAnalytics] = useState<OrgAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = { 'Authorization': `Bearer ${token}` };

  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch('/api/organizations/me', { headers });
        const meData = await meRes.json();
        const org = meData[0]?.organization;
        if (!org) { setLoading(false); return; }
        const aRes = await fetch(`/api/organizations/${org.id}/analytics?days=30`, { headers });
        if (aRes.ok) setAnalytics(await aRes.json());
        else setError('Failed to load analytics');
      } catch { setError('Failed to load reports'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="text-neutral-400">Loading reports...</div>;
  if (!analytics) return <div className="text-neutral-400">No analytics available. Create an organization first.</div>;

  const maxScore = Math.max(...analytics.health_score_trend.map(t => t.score), 100);
  const totalRisk = analytics.risk_distribution.low + analytics.risk_distribution.moderate +
    analytics.risk_distribution.high + analytics.risk_distribution.critical;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Reports</h1>

      {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded">{error}</div>}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">Avg Health Score</p>
          <p className="text-3xl font-bold text-white mt-1">{analytics.average_health_score}</p>
          <p className="text-xs text-neutral-500 mt-1">out of 100</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">Engagement</p>
          <p className="text-3xl font-bold text-white mt-1">{analytics.engagement_rate}%</p>
          <p className="text-xs text-neutral-500 mt-1">{analytics.active_members} active members</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">Avg Sleep</p>
          <p className="text-3xl font-bold text-white mt-1">{analytics.sleep_avg_hours}h</p>
          <p className="text-xs text-neutral-500 mt-1">per night</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">Avg Stress</p>
          <p className="text-3xl font-bold text-white mt-1">{analytics.stress_avg_level}</p>
          <p className="text-xs text-neutral-500 mt-1">out of 100</p>
        </div>
      </div>

      {/* Health Score Trend */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Health Score Trend (30 days)</h2>
        {analytics.health_score_trend.length === 0 ? (
          <p className="text-neutral-500 text-sm">No trend data available yet.</p>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {analytics.health_score_trend.map((t, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-600 rounded-t transition-all hover:bg-blue-500"
                  style={{ height: `${(t.score / maxScore) * 100}%` }}
                  title={`${t.date}: ${t.score}`}
                />
                {analytics.health_score_trend.length <= 14 && (
                  <span className="text-[10px] text-neutral-500 mt-1 truncate w-full text-center">
                    {t.date.slice(5)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Risk Distribution */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Risk Distribution</h2>
        {totalRisk === 0 ? (
          <p className="text-neutral-500 text-sm">No health scores recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {[
              { label: 'Low', value: analytics.risk_distribution.low, color: 'bg-green-600' },
              { label: 'Moderate', value: analytics.risk_distribution.moderate, color: 'bg-yellow-600' },
              { label: 'High', value: analytics.risk_distribution.high, color: 'bg-orange-600' },
              { label: 'Critical', value: analytics.risk_distribution.critical, color: 'bg-red-600' },
            ].map(item => (
              item.value > 0 && (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-sm text-neutral-300 w-20">{item.label}</span>
                  <div className="flex-1 bg-neutral-800 rounded-full h-4 overflow-hidden">
                    <div className={`${item.color} h-full rounded-full transition-all`}
                      style={{ width: `${(item.value / totalRisk) * 100}%` }} />
                  </div>
                  <span className="text-sm text-neutral-400 w-12 text-right">
                    {Math.round((item.value / totalRisk) * 100)}%
                  </span>
                </div>
              )
            ))}
          </div>
        )}
      </section>

      {/* Department Breakdown */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Department Breakdown</h2>
        {analytics.department_breakdown.length === 0 ? (
          <p className="text-neutral-500 text-sm">No departments created yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-neutral-400 border-b border-neutral-800">
                <th className="text-left py-2">Department</th>
                <th className="text-left py-2">Members</th>
                <th className="text-left py-2">Avg Score</th>
                <th className="text-left py-2">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {analytics.department_breakdown.map((d, i) => (
                <tr key={i} className="border-b border-neutral-800/50">
                  <td className="py-3 text-white">{d.department}</td>
                  <td className="py-3 text-neutral-400">{d.members}</td>
                  <td className="py-3">
                    <span className={'px-2 py-0.5 rounded text-xs ' + (
                      d.avg_score >= 80 ? 'bg-green-900/50 text-green-400' :
                      d.avg_score >= 60 ? 'bg-yellow-900/50 text-yellow-400' :
                      'bg-red-900/50 text-red-400'
                    )}>{d.avg_score}</span>
                  </td>
                  <td className="py-3 text-neutral-400">{d.engagement}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Export placeholder */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Export</h2>
        <p className="text-sm text-neutral-400 mb-4">
          Download your organization's health analytics as a report.
        </p>
        <button disabled
          className="bg-neutral-800 text-neutral-500 px-4 py-2 rounded text-sm cursor-not-allowed">
          Export Report (Coming Soon)
        </button>
      </section>
    </div>
  );
}
