'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface OrgAnalytics {
  org_id: string;
  total_members: number;
  active_members: number;
  engagement_rate: number;
  average_health_score: number;
  health_score_trend: Array<{ date: string; score: number }>;
  department_breakdown: Array<{
    department: string;
    members: number;
    avg_score: number;
    engagement: number;
  }>;
  risk_distribution: {
    low: number;
    moderate: number;
    high: number;
    critical: number;
  };
  sleep_avg_hours: number;
  stress_avg_level: number;
  last_updated: string;
}

export default function DashboardOverview() {
  const router = useRouter();
  const [org, setOrg] = useState<{ id: string; name: string } | null>(null);
  const [analytics, setAnalytics] = useState<OrgAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [orgNameInput, setOrgNameInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((userData) => {
        if (userData.error) {
          router.push('/login');
          return;
        }

        return fetch('/api/organizations/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then((r) => r?.json())
      .then((orgData) => {
        if (!orgData || !Array.isArray(orgData)) return;
        if (orgData.length > 0 && orgData[0]?.organization) {
          const orgInfo = orgData[0].organization;
          setOrg({ id: orgInfo.id, name: orgInfo.name });
          const token2 = localStorage.getItem('token');
          return fetch(
            `/api/organizations/${orgInfo.id}/analytics`,
            { headers: { Authorization: `Bearer ${token2}` } }
          );
        }
        setLoading(false);
      })
      .then((r) => r?.json())
      .then((analyticsData) => {
        if (analyticsData?.org_id) {
          setAnalytics(analyticsData);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgNameInput.trim()) return;
    setCreating(true);
    setError('');

    const token = localStorage.getItem('token');
    const res = await fetch('/api/organizations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: orgNameInput.trim() }),
    });

    const data = await res.json();
    if (res.ok && data.id) {
      setOrg({ id: data.id, name: data.name });
    } else {
      setError(data.error || 'Failed to create organization');
    }
    setCreating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  // No org — show create form
  if (!org) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 max-w-md w-full">
          <h1 className="text-xl font-semibold text-white mb-2">
            Create Your Organization
          </h1>
          <p className="text-sm text-neutral-400 mb-6">
            Set up your organization to start managing your team&apos;s health.
          </p>
          <form onSubmit={handleCreateOrg} className="space-y-4">
            <div>
              <label
                htmlFor="orgName"
                className="block text-sm font-medium text-neutral-300 mb-1"
              >
                Organization Name
              </label>
              <input
                id="orgName"
                type="text"
                value={orgNameInput}
                onChange={(e) => setOrgNameInput(e.target.value)}
                placeholder="Acme Corp"
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-600"
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <button
              type="submit"
              disabled={creating || !orgNameInput.trim()}
              className="w-full py-2 px-4 bg-white text-black font-medium rounded-md hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? 'Creating...' : 'Create Organization'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Has org — show dashboard
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome to {org.name}
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Organization health overview
        </p>
      </div>

      {analytics ? (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Members"
              value={analytics.total_members.toString()}
              sub={`${analytics.active_members} active`}
            />
            <StatCard
              label="Avg Health Score"
              value={analytics.average_health_score.toFixed(1)}
              sub="out of 100"
            />
            <StatCard
              label="Engagement Rate"
              value={`${analytics.engagement_rate.toFixed(0)}%`}
              sub="active participation"
            />
            <StatCard
              label="Avg Sleep Hours"
              value={analytics.sleep_avg_hours.toFixed(1)}
              sub="per night"
            />
          </div>

          {/* Risk Distribution Bar */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Risk Distribution
            </h2>
            <div className="flex h-8 rounded-md overflow-hidden">
              {[
                { label: 'Low', value: analytics.risk_distribution.low, color: 'bg-green-600' },
                { label: 'Moderate', value: analytics.risk_distribution.moderate, color: 'bg-yellow-600' },
                { label: 'High', value: analytics.risk_distribution.high, color: 'bg-orange-600' },
                { label: 'Critical', value: analytics.risk_distribution.critical, color: 'bg-red-600' },
              ].map((seg) => {
                const total =
                  analytics.risk_distribution.low +
                  analytics.risk_distribution.moderate +
                  analytics.risk_distribution.high +
                  analytics.risk_distribution.critical;
                const pct = total > 0 ? (seg.value / total) * 100 : 0;
                return (
                  <div
                    key={seg.label}
                    className={`${seg.color} flex items-center justify-center text-xs text-white font-medium`}
                    style={{ width: `${pct}%` }}
                  >
                    {pct > 10 ? seg.label : ''}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-neutral-400">
              {[
                { label: 'Low', value: analytics.risk_distribution.low, color: 'bg-green-600' },
                { label: 'Moderate', value: analytics.risk_distribution.moderate, color: 'bg-yellow-600' },
                { label: 'High', value: analytics.risk_distribution.high, color: 'bg-orange-600' },
                { label: 'Critical', value: analytics.risk_distribution.critical, color: 'bg-red-600' },
              ].map((seg) => (
                <div key={seg.label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-sm ${seg.color}`} />
                  {seg.label}: {seg.value}
                </div>
              ))}
            </div>
          </div>

          {/* Department Breakdown Table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Department Breakdown
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400">
                    <th className="text-left py-2 font-medium">Department</th>
                    <th className="text-right py-2 font-medium">Members</th>
                    <th className="text-right py-2 font-medium">Avg Score</th>
                    <th className="text-right py-2 font-medium">Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.department_breakdown.map((dept) => (
                    <tr
                      key={dept.department}
                      className="border-b border-neutral-800/50"
                    >
                      <td className="py-2 text-neutral-200">
                        {dept.department}
                      </td>
                      <td className="py-2 text-right text-neutral-300">
                        {dept.members}
                      </td>
                      <td className="py-2 text-right text-neutral-300">
                        {dept.avg_score.toFixed(1)}
                      </td>
                      <td className="py-2 text-right text-neutral-300">
                        {dept.engagement}%
                      </td>
                    </tr>
                  ))}
                  {analytics.department_breakdown.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-4 text-center text-neutral-500"
                      >
                        No department data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <p className="text-neutral-400">
            Analytics data is not yet available. Invite team members to get
            started.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
      <p className="text-sm text-neutral-400">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      <p className="text-xs text-neutral-500 mt-0.5">{sub}</p>
    </div>
  );
}
