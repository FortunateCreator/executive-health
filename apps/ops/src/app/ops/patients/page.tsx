'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Patient {
  user_id: string;
  display_name: string;
  email: string;
  risk_category: string;
  last_score: number | null;
  notes_count: number;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch('/api/ops/patients', { headers })
      .then(r => r.json())
      .then(d => setPatients(d.patients || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p => {
    const matchSearch = !search || p.display_name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === 'all' || p.risk_category === riskFilter;
    return matchSearch && matchRisk;
  });

  const riskColors: Record<string, string> = {
    low: 'bg-green-900/50 text-green-400',
    moderate: 'bg-yellow-900/50 text-yellow-400',
    high: 'bg-orange-900/50 text-orange-400',
    critical: 'bg-red-900/50 text-red-400',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Patients</h1>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-white text-sm flex-1 max-w-sm"
        />
        <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)}
          className="bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-white text-sm">
          <option value="all">All Risk Levels</option>
          <option value="low">Low</option>
          <option value="moderate">Moderate</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <span className="text-xs text-neutral-500">{filtered.length} patients</span>
      </div>

      {/* Patient Table */}
      {loading ? (
        <div className="text-neutral-400 py-8">Loading patients...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 text-center">
          <p className="text-neutral-400">No patients found.</p>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400">
                <th className="text-left py-3 px-4 font-medium">Name</th>
                <th className="text-left py-3 px-4 font-medium">Email</th>
                <th className="text-left py-3 px-4 font-medium">Risk Level</th>
                <th className="text-left py-3 px-4 font-medium">Last Score</th>
                <th className="text-left py-3 px-4 font-medium">Notes</th>
                <th className="text-right py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.user_id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                  <td className="py-3 px-4 text-white font-medium">{p.display_name}</td>
                  <td className="py-3 px-4 text-neutral-400">{p.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${riskColors[p.risk_category] || 'bg-neutral-800 text-neutral-400'}`}>
                      {p.risk_category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-neutral-300">{p.last_score ?? '—'}</td>
                  <td className="py-3 px-4 text-neutral-400">{p.notes_count}</td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/ops/patients/${p.user_id}`}
                      className="text-blue-400 hover:text-blue-300 text-xs font-medium">
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
