'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@executive-health/ui';

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  last_intake_date: string | null;
  last_score: number | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth/login'); return; }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(res => {
        if (res.error) { router.push('/auth/login'); return; }
        setProfile(res.user);
        setName(res.user.display_name || '');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token || !profile) return;
    setSaving(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ display_name: name }),
      });
      const data = await res.json();
      if (data.user) {
        setProfile(data.user);
        alert('Profile updated!');
      } else {
        alert(data.error || 'Failed to update profile');
      }
    } catch {
      alert('Network error');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <DashboardLayout userName="" currentPath="/profile" onNavigate={(p) => router.push(p)}>
        <div className="eh-empty" style={{ padding: '80px' }}>Loading...</div>
      </DashboardLayout>
    );
  }

  if (!profile) return null;

  return (
    <DashboardLayout userName={profile.display_name} currentPath="/profile" onNavigate={(p) => router.push(p)}>
      <div className="eh-content-narrow">
        <h1 className="eh-page-title">Profile</h1>
        <p className="eh-page-subtitle">Manage your account settings</p>

        <div className="eh-card">
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Display Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-muted)',
                fontSize: '14px',
                outline: 'none',
                opacity: 0.6,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="eh-btn eh-btn-primary"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="eh-card" style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Account Info</h3>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 2 }}>
            <div>Member since: {new Date(profile.created_at).toLocaleDateString()}</div>
            <div>Last assessment: {profile.last_intake_date ? new Date(profile.last_intake_date).toLocaleDateString() : 'Not taken'}</div>
            <div>Last score: {profile.last_score !== null ? `${profile.last_score}/100` : 'N/A'}</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
