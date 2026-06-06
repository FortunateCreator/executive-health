'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ORG_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1000+'];

export default function SettingsPage() {
  const router = useRouter();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [size, setSize] = useState('');
  const [wellnessEnabled, setWellnessEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  async function fetchOrg() {
    try {
      const meRes = await fetch('/api/organizations/me', { headers });
      const meData = await meRes.json();
      const orgInfo = meData[0]?.organization;
      if (!orgInfo) return;
      setOrgId(orgInfo.id);
      const orgRes = await fetch(`/api/organizations/${orgInfo.id}`, { headers });
      if (orgRes.ok) {
        const org = await orgRes.json();
        setName(org.name || '');
        setIndustry(org.industry || '');
        setSize(org.size || '');
        setWellnessEnabled(org.settings?.wellness_programs_enabled ?? true);
      }
    } catch {
      setError('Failed to load organization');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchOrg(); }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch(`/api/organizations/${orgId}`, {
        method: 'PUT', headers,
        body: JSON.stringify({
          name,
          industry,
          size: size || undefined,
          settings: { wellness_programs_enabled: wellnessEnabled, data_retention_days: 365 },
        }),
      });
      if (res.ok) {
        setMessage('Settings saved successfully');
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to save');
      }
    } catch {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteOrg() {
    if (!orgId) return;
    const confirm1 = prompt('Type DELETE to confirm deleting your organization and all associated data:');
    if (confirm1 !== 'DELETE') return;
    const confirm2 = confirm('This action is irreversible. All members, departments, invites, and health data will be permanently deleted. Continue?');
    if (!confirm2) return;

    try {
      const res = await fetch(`/api/organizations/${orgId}`, {
        method: 'DELETE', headers,
      });
      if (res.ok) {
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to delete organization');
      }
    } catch {
      setError('Failed to delete organization');
    }
  }

  if (loading) {
    return <div className="text-neutral-400">Loading settings...</div>;
  }

  if (!orgId) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 text-center">
        <h2 className="text-xl font-semibold text-white mb-2">No Organization Found</h2>
        <p className="text-neutral-400">Create an organization from the Dashboard overview first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Organization Settings</h1>

      {message && <div className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-2 rounded">{message}</div>}
      {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded">{error}</div>}

      <form onSubmit={handleSave} className="space-y-6">
        <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">General</h2>

          <div>
            <label className="block text-sm text-neutral-400 mb-1">Organization Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-white text-sm"/>
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1">Industry</label>
            <input type="text" value={industry} onChange={e => setIndustry(e.target.value)}
              placeholder="e.g. Technology, Healthcare, Finance"
              className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-white text-sm"/>
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1">Company Size</label>
            <select value={size} onChange={e => setSize(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-white text-sm">
              <option value="">Select size...</option>
              {ORG_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
            </select>
          </div>
        </section>

        <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Wellness Programs</h2>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={wellnessEnabled} onChange={e => setWellnessEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-600 bg-neutral-800"/>
            <span className="text-sm text-neutral-300">Enable wellness programs for team members</span>
          </label>
          <p className="text-xs text-neutral-500 ml-7">
            When enabled, team members can access health tracking, scores, and recommendations.
          </p>
        </section>

        <button type="submit" disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 text-white px-6 py-2 rounded text-sm">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      <section className="bg-neutral-900 border border-red-800/50 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
        <p className="text-sm text-neutral-400">
          Once you delete your organization, there is no going back. All data including member records,
          health scores, departments, and invites will be permanently removed.
        </p>
        <button onClick={handleDeleteOrg}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded text-sm">
          Delete Organization
        </button>
      </section>
    </div>
  );
}
