'use client';
import { useState, useEffect } from 'react';

interface Member {
  id: string; user_id: string; email: string; display_name: string;
  role: string; department_id?: string; status: string; joined_at?: string;
}

interface Department {
  id: string; name: string; description?: string; head_count: number;
}

interface Invite {
  id: string; email: string; role: string; status: string; created_at: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviteDept, setInviteDept] = useState('');
  const [newDept, setNewDept] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  async function fetchData() {
    try {
      const meRes = await fetch('/api/organizations/me', { headers });
      const meData = await meRes.json();
      const org = meData[0]?.organization;
      if (!org) return;
      setOrgId(org.id);
      const [mRes, dRes, iRes] = await Promise.all([
        fetch(`/api/organizations/${org.id}/members`, { headers }),
        fetch(`/api/organizations/${org.id}/departments`, { headers }),
        fetch(`/api/organizations/${org.id}/invites`, { headers }),
      ]);
      if (mRes.ok) setMembers(await mRes.json());
      if (dRes.ok) setDepartments(await dRes.json());
      if (iRes.ok) setInvites(await iRes.json());
    } catch { setError('Failed to load team data'); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchData(); }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const body: any = { email: inviteEmail, role: inviteRole };
    if (inviteDept) body.department_id = inviteDept;
    const res = await fetch(`/api/organizations/${orgId}/invites`, {
      method: 'POST', headers, body: JSON.stringify(body),
    });
    if (res.ok) { setShowInvite(false); setInviteEmail(''); fetchData(); }
    else { const d = await res.json(); setError(d.error || 'Invite failed'); }
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm('Remove this member?')) return;
    await fetch(`/api/organizations/${orgId}/members/${userId}`, {
      method: 'DELETE', headers,
    });
    fetchData();
  }

  async function handleChangeRole(userId: string, role: string) {
    await fetch(`/api/organizations/${orgId}/members/${userId}`, {
      method: 'PATCH', headers, body: JSON.stringify({ role }),
    });
    fetchData();
  }

  async function handleAddDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!newDept.trim()) return;
    await fetch(`/api/organizations/${orgId}/departments`, {
      method: 'POST', headers, body: JSON.stringify({ name: newDept }),
    });
    setNewDept('');
    fetchData();
  }

  async function handleDeleteDept(id: string) {
    if (!confirm('Delete this department?')) return;
    await fetch(`/api/organizations/${orgId}/departments/${id}`, {
      method: 'DELETE', headers,
    });
    fetchData();
  }

  async function handleCancelInvite(id: string) {
    await fetch(`/api/organizations/${orgId}/invites/${id}`, {
      method: 'DELETE', headers,
    });
    fetchData();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Team</h1>

      {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded">{error}</div>}

      <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Members ({members.length})</h2>
          <button onClick={()=>setShowInvite(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
            Invite Member
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-neutral-400 border-b border-neutral-800">
              <th className="text-left py-2">Name</th>
              <th className="text-left py-2">Email</th>
              <th className="text-left py-2">Role</th>
              <th className="text-left py-2">Status</th>
              <th className="text-right py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id} className="border-b border-neutral-800/50">
                <td className="py-3 text-white">{m.display_name}</td>
                <td className="py-3 text-neutral-400">{m.email}</td>
                <td className="py-3">
                  <select value={m.role} onChange={e=>handleChangeRole(m.user_id, e.target.value)}
                    className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-white text-xs">
                    <option value="viewer">Viewer</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </td>
                <td className="py-3">
                  <span className={'px-2 py-0.5 rounded text-xs ' + (m.status==='active'
                    ? 'bg-green-900/50 text-green-400'
                    : 'bg-yellow-900/50 text-yellow-400')}>
                    {m.status}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <button onClick={()=>handleRemoveMember(m.user_id)} className="text-red-400 hover:text-red-300 text-xs">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Invite Member</h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Email</label>
                <input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} required
                  className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-white text-sm"/>
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Role</label>
                <select value={inviteRole} onChange={e=>setInviteRole(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-white text-sm">
                  <option value="viewer">Viewer</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {departments.length > 0 && (
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Department</label>
                  <select value={inviteDept} onChange={e=>setInviteDept(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-white text-sm">
                    <option value="">None</option>
                    {departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-2">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm flex-1">Send Invite</button>
                <button type="button" onClick={()=>setShowInvite(false)} className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2 rounded text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Departments</h2>
        <form onSubmit={handleAddDepartment} className="flex gap-2 mb-4">
          <input value={newDept} onChange={e=>setNewDept(e.target.value)} placeholder="Department name"
            className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-white text-sm"/>
          <button type="submit" className="bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded text-sm">Add</button>
        </form>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-neutral-400 border-b border-neutral-800">
              <th className="text-left py-2">Name</th>
              <th className="text-left py-2">Members</th>
              <th className="text-right py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map(d => (
              <tr key={d.id} className="border-b border-neutral-800/50">
                <td className="py-3 text-white">{d.name}</td>
                <td className="py-3 text-neutral-400">{d.head_count}</td>
                <td className="py-3 text-right">
                  <button onClick={()=>handleDeleteDept(d.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {invites.filter(i => i.status === 'pending').length > 0 && (
        <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Pending Invites</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-neutral-400 border-b border-neutral-800">
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Role</th>
                <th className="text-right py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invites.filter(i => i.status === 'pending').map(i => (
                <tr key={i.id} className="border-b border-neutral-800/50">
                  <td className="py-3 text-white">{i.email}</td>
                  <td className="py-3 text-neutral-400">{i.role}</td>
                  <td className="py-3 text-right">
                    <button onClick={()=>handleCancelInvite(i.id)} className="text-red-400 hover:text-red-300 text-xs">Cancel</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
