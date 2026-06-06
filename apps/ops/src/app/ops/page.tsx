'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function OpsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) return;
    fetch('/api/ops/dashboard', { headers })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-neutral-400">Loading dashboard...</div>;
  if (!data) return <div className="text-red-400">Failed to load. Please login.</div>;

  const riskColors: Record<string, string> = {
    low: 'bg-green-600', moderate: 'bg-yellow-600', high: 'bg-orange-600', critical: 'bg-red-600',
  };
  const totalRisk = Object.values(data.riskBreakdown as Record<string, number>).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Clinical Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">Total Patients</p>
          <p className="text-3xl font-bold text-white mt-1">{data.totalPatients}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">High Risk</p>
          <p className="text-3xl font-bold text-orange-400 mt-1">{(data.riskBreakdown.high || 0) + (data.riskBreakdown.critical || 0)}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">Appointments Today</p>
          <p className="text-3xl font-bold text-blue-400 mt-1">{data.todayAppointments?.length || 0}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">Pending Requests</p>
          <p className="text-3xl font-bold text-yellow-400 mt-1">{data.pendingRequests?.length || 0}</p>
        </div>
      </div>

      {/* Risk Distribution */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Patient Risk Distribution</h2>
        <div className="flex h-8 rounded-md overflow-hidden">
          {['low', 'moderate', 'high', 'critical'].map(level => {
            const count = data.riskBreakdown[level] || 0;
            const pct = totalRisk > 0 ? (count / totalRisk) * 100 : 0;
            return pct > 0 ? (
              <div key={level} className={`${riskColors[level]} flex items-center justify-center text-xs text-white font-medium`}
                style={{ width: `${pct}%` }}>
                {pct > 8 ? `${level} (${count})` : ''}
              </div>
            ) : null;
          })}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-neutral-400">
          {['low', 'moderate', 'high', 'critical'].map(level => (
            <div key={level} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${riskColors[level]}`} />
              {level}: {data.riskBreakdown[level] || 0}
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Today's Appointments</h2>
            <Link href="/ops/appointments" className="text-xs text-blue-400 hover:text-blue-300">View All</Link>
          </div>
          {data.todayAppointments?.length === 0 ? (
            <p className="text-sm text-neutral-500">No appointments scheduled for today.</p>
          ) : (
            <div className="space-y-2">
              {data.todayAppointments?.slice(0, 5).map((a: any, i: number) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-neutral-800/50 last:border-0">
                  <div>
                    <p className="text-sm text-white">{a.title}</p>
                    <p className="text-xs text-neutral-500">{a.appointment_time}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    a.status === 'confirmed' ? 'bg-green-900/50 text-green-400' :
                    a.status === 'scheduled' ? 'bg-blue-900/50 text-blue-400' :
                    'bg-neutral-800 text-neutral-400'
                  }`}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pending Requests */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Pending Service Requests</h2>
          {data.pendingRequests?.length === 0 ? (
            <p className="text-sm text-neutral-500">No pending service requests.</p>
          ) : (
            <div className="space-y-2">
              {data.pendingRequests?.slice(0, 5).map((r: any, i: number) => (
                <div key={i} className="py-2 border-b border-neutral-800/50 last:border-0">
                  <p className="text-sm text-white capitalize">{r.service_type?.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-neutral-500">{r.description?.slice(0, 80)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
