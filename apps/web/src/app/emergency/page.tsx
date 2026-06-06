'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@executive-health/ui';
import type { EmergencyProfile, EmergencyContact } from '@executive-health/db';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function EmergencyPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<EmergencyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [shareSummary, setShareSummary] = useState('');

  // Editable form state
  const [form, setForm] = useState({
    medical_conditions_summary: '',
    allergies: [] as string[],
    medications: [] as string[],
    blood_type: '',
    primary_physician: '',
    insurance_info: '',
    advanced_directives: '',
  });
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { name: '', relationship: '', phone: '', email: '', is_primary: true },
  ]);
  const [allergyInput, setAllergyInput] = useState('');
  const [medicationInput, setMedicationInput] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchProfile = useCallback(() => {
    if (!token) { router.push('/auth/login'); return; }
    fetch('/api/emergency', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(res => {
        if (res.error) { router.push('/auth/login'); return; }
        if (res.profile) {
          setProfile(res.profile);
          setForm({
            medical_conditions_summary: res.profile.medical_conditions_summary || '',
            allergies: res.profile.allergies || [],
            medications: res.profile.medications || [],
            blood_type: res.profile.blood_type || '',
            primary_physician: res.profile.primary_physician || '',
            insurance_info: res.profile.insurance_info || '',
            advanced_directives: res.profile.advanced_directives || '',
          });
          setContacts(res.profile.emergency_contacts.length > 0 ? res.profile.emergency_contacts : [
            { name: '', relationship: '', phone: '', email: '', is_primary: true },
          ]);
        } else {
          setEditMode(true);
        }
      })
      .finally(() => setLoading(false));
  }, [token, router]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const validContacts = contacts.filter(c => c.name && c.phone);
      const res = await fetch('/api/emergency', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          emergency_contacts: validContacts,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setSuccess('Emergency profile saved!');
        setProfile(json.profile);
        setEditMode(false);
      } else {
        setError(json.error || 'Failed to save');
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    setError('');
    try {
      const res = await fetch('/api/emergency/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        setShareSummary(json.summary);
        // Try to copy to clipboard
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(json.summary);
          setSuccess('Emergency summary copied to clipboard!');
        }
        // Try Web Share API
        if (navigator.share) {
          try {
            await navigator.share({ title: 'Emergency Health Summary', text: json.summary });
          } catch { /* user cancelled */ }
        }
      } else {
        setError(json.error || 'Failed to generate summary');
      }
    } catch {
      setError('Network error');
    }
  };

  const addContact = () => setContacts([...contacts, { name: '', relationship: '', phone: '', email: '', is_primary: false }]);
  const removeContact = (i: number) => setContacts(contacts.filter((_, idx) => idx !== i));

  const addAllergy = () => {
    if (allergyInput.trim() && !form.allergies.includes(allergyInput.trim())) {
      setForm(p => ({ ...p, allergies: [...p.allergies, allergyInput.trim()] }));
    }
    setAllergyInput('');
  };

  const addMedication = () => {
    if (medicationInput.trim() && !form.medications.includes(medicationInput.trim())) {
      setForm(p => ({ ...p, medications: [...p.medications, medicationInput.trim()] }));
    }
    setMedicationInput('');
  };

  // ── Inline Styles (minimal, for dynamic/interactive elements) ──
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 };

  if (loading) {
    return <DashboardLayout><div className="eh-empty" style={{ padding: 80 }}>Loading...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout currentPath="/emergency" onNavigate={(p) => router.push(p)}>
      <div className="eh-content">
        {/* Medical Disclaimer Banner */}
        <div style={{
          backgroundColor: 'rgba(220, 38, 38, 0.12)',
          border: '2px solid #dc2626',
          borderRadius: 10,
          padding: '14px 18px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>🚨</span>
          <span style={{ fontSize: 14, color: '#fca5a5', fontWeight: 600, lineHeight: 1.5 }}>
            This is NOT a substitute for emergency medical care. If you are experiencing a medical emergency, call 911 immediately.
          </span>
        </div>

        {/* Crisis Hotline Banner */}
        <div style={{
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          border: '2px solid #f97316',
          borderRadius: 10,
          padding: '12px 18px',
          marginBottom: 24,
          textAlign: 'center',
        }}>
          <span style={{ fontSize: 15, color: '#fdba74', fontWeight: 600 }}>
            📞 Need help? Call or text <strong style={{ color: '#ffffff' }}>988</strong> (Suicide & Crisis Lifeline)
          </span>
        </div>

        <div className="eh-flex-between">
          <div>
            <h1 className="eh-page-title">🚨 Emergency Profile</h1>
            <p className="eh-page-subtitle">Critical medical information for first responders</p>
          </div>
          <div className="eh-flex-center" style={{ gap: 8 }}>
            {editMode ? (
              <>
                <button className="eh-btn eh-btn-danger" onClick={() => { setEditMode(false); fetchProfile(); }}>Cancel</button>
                <button className="eh-btn eh-btn-primary" style={{ backgroundColor: '#22c55e' }} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </>
            ) : (
              <>
                <button className="eh-btn eh-btn-primary" style={{ backgroundColor: '#f97316' }} onClick={handleShare}>📤 Share Summary</button>
                <button className="eh-btn eh-btn-primary" onClick={() => setEditMode(true)}>✏️ Edit</button>
              </>
            )}
          </div>
        </div>

        {error && <div className="eh-alert-error">{error}</div>}
        {success && <div className="eh-alert-success">{success}</div>}

        {/* Emergency Card Preview */}
        <div className="eh-card eh-mb-24" style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #1e0a0a 100%)',
          border: '2px solid #dc2626',
        }}>
          <div className="eh-flex-center" style={{ gap: 12, marginBottom: 16, justifyContent: 'flex-start' }}>
            <span style={{ fontSize: 32 }}>🏥</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, color: '#ffffff', fontWeight: 700 }}>EMERGENCY MEDICAL ID</h3>
              <span style={{ fontSize: 11, color: '#f97316', fontWeight: 600 }}>Show to first responders in emergency</span>
            </div>
          </div>
          <div className="eh-grid-2" style={{ gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Blood Type</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>{profile?.blood_type || 'Not set'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Physician</div>
              <div style={{ fontSize: 14, color: '#e2e8f0' }}>{profile?.primary_physician || 'Not set'}</div>
            </div>
          </div>
          <div style={{ marginTop: 12, padding: '8px 12px', backgroundColor: 'rgba(220, 38, 38, 0.15)', borderRadius: 8, border: '1px solid rgba(220, 38, 38, 0.3)' }}>
            <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>⚠️ Allergies</div>
            <div style={{ fontSize: 14, color: '#fca5a5', fontWeight: 600 }}>
              {profile?.allergies?.length ? profile.allergies.join(', ') : 'None reported'}
            </div>
          </div>
          <div style={{ marginTop: 8, padding: '8px 12px', backgroundColor: 'rgba(249, 115, 22, 0.15)', borderRadius: 8, border: '1px solid rgba(249, 115, 22, 0.3)' }}>
            <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>🏥 Medical Conditions</div>
            <div style={{ fontSize: 14, color: '#fdba74', fontWeight: 600 }}>
              {profile?.medical_conditions_summary || 'None reported'}
            </div>
          </div>
        </div>

        {editMode ? (
          /* ── Edit Mode Form ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Emergency Contacts */}
            <div className="eh-card">
              <div className="eh-flex-between eh-mb-16">
                <h3 className="eh-section-title">📞 Emergency Contacts</h3>
                <button type="button" className="eh-btn eh-btn-primary eh-btn-sm" onClick={addContact}>+ Add Contact</button>
              </div>
              {contacts.map((c, i) => (
                <div key={i} className="eh-card-compact eh-mb-16">
                  <div className="eh-flex-between eh-mb-8">
                    <span style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 600 }}>Contact {i + 1}</span>
                    <div className="eh-flex-center" style={{ gap: 8 }}>
                      <label style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input type="checkbox" checked={c.is_primary} onChange={e => {
                          const cs = [...contacts];
                          if (e.target.checked) cs.forEach((_, idx) => cs[idx].is_primary = idx === i);
                          else cs[i].is_primary = false;
                          setContacts(cs);
                        }} />
                        Primary
                      </label>
                      {contacts.length > 1 && (
                        <button type="button" className="eh-btn eh-btn-danger eh-btn-sm" onClick={() => removeContact(i)}>✕</button>
                      )}
                    </div>
                  </div>
                  <div className="eh-grid-2" style={{ gap: 8 }}>
                    <div>
                      <label style={labelStyle}>Name</label>
                      <input className="eh-input" value={c.name} onChange={e => { const cs = [...contacts]; cs[i].name = e.target.value; setContacts(cs); }} placeholder="Full name" />
                    </div>
                    <div>
                      <label style={labelStyle}>Relationship</label>
                      <input className="eh-input" value={c.relationship} onChange={e => { const cs = [...contacts]; cs[i].relationship = e.target.value; setContacts(cs); }} placeholder="Spouse, Parent, etc." />
                    </div>
                    <div>
                      <label style={labelStyle}>Phone</label>
                      <input className="eh-input" value={c.phone} onChange={e => { const cs = [...contacts]; cs[i].phone = e.target.value; setContacts(cs); }} placeholder="+234..." />
                    </div>
                    <div>
                      <label style={labelStyle}>Email</label>
                      <input className="eh-input" value={c.email || ''} onChange={e => { const cs = [...contacts]; cs[i].email = e.target.value; setContacts(cs); }} placeholder="email@example.com" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Medical Info */}
            <div className="eh-card">
              <h3 className="eh-section-title">🏥 Medical Information</h3>
              <div className="eh-mb-16">
                <label style={labelStyle}>Medical Conditions Summary</label>
                <textarea className="eh-input" style={{ minHeight: 80, resize: 'vertical' }} value={form.medical_conditions_summary} onChange={e => setForm(p => ({ ...p, medical_conditions_summary: e.target.value }))} placeholder="Describe your medical conditions..." />
              </div>
              <div className="eh-grid-2 eh-mb-16">
                <div>
                  <label style={labelStyle}>Blood Type</label>
                  <select className="eh-select" value={form.blood_type} onChange={e => setForm(p => ({ ...p, blood_type: e.target.value }))}>
                    <option value="">Unknown</option>
                    {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Primary Physician</label>
                  <input className="eh-input" value={form.primary_physician} onChange={e => setForm(p => ({ ...p, primary_physician: e.target.value }))} placeholder="Dr. Name" />
                </div>
              </div>
              <div className="eh-mb-16">
                <label style={labelStyle}>Allergies</label>
                <div className="eh-flex-wrap eh-mb-8" style={{ gap: 8 }}>
                  {form.allergies.map((a, i) => (
                    <span key={i} className="eh-badge" style={{ backgroundColor: '#dc2626' }}>
                      {a}
                      <button type="button" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1, marginLeft: 4 }}
                        onClick={() => setForm(p => ({ ...p, allergies: p.allergies.filter((_, idx) => idx !== i) }))}>×</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="eh-input" style={{ flex: 1 }} value={allergyInput} onChange={e => setAllergyInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAllergy(); } }}
                    placeholder="Type an allergy and press Enter..." />
                  <button type="button" className="eh-btn eh-btn-danger" onClick={addAllergy}>Add</button>
                </div>
              </div>
              <div className="eh-mb-16">
                <label style={labelStyle}>Current Medications</label>
                <div className="eh-flex-wrap eh-mb-8" style={{ gap: 8 }}>
                  {form.medications.map((m, i) => (
                    <span key={i} className="eh-badge" style={{ backgroundColor: '#f97316' }}>
                      {m}
                      <button type="button" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1, marginLeft: 4 }}
                        onClick={() => setForm(p => ({ ...p, medications: p.medications.filter((_, idx) => idx !== i) }))}>×</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="eh-input" style={{ flex: 1 }} value={medicationInput} onChange={e => setMedicationInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMedication(); } }}
                    placeholder="Type a medication and press Enter..." />
                  <button type="button" className="eh-btn eh-btn-primary" style={{ backgroundColor: '#f97316' }} onClick={addMedication}>Add</button>
                </div>
              </div>
              <div className="eh-grid-2">
                <div>
                  <label style={labelStyle}>Insurance Info</label>
                  <input className="eh-input" value={form.insurance_info} onChange={e => setForm(p => ({ ...p, insurance_info: e.target.value }))} placeholder="Provider and policy #" />
                </div>
                <div>
                  <label style={labelStyle}>Advanced Directives</label>
                  <textarea className="eh-input" style={{ minHeight: 60, resize: 'vertical' }} value={form.advanced_directives} onChange={e => setForm(p => ({ ...p, advanced_directives: e.target.value }))} placeholder="DNR, living will, etc." />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── Read-only View ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Summary display for non-edit mode */}
            <div className="eh-card">
              <h3 className="eh-section-title">📋 Medical Summary</h3>
              <div className="eh-grid-2" style={{ gap: 12 }}>
                <div>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>Blood Type: </span>
                  <span style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 600 }}>{profile?.blood_type || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>Physician: </span>
                  <span style={{ fontSize: 14, color: '#e2e8f0' }}>{profile?.primary_physician || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>Insurance: </span>
                  <span style={{ fontSize: 14, color: '#e2e8f0' }}>{profile?.insurance_info || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>Last Updated: </span>
                  <span style={{ fontSize: 14, color: '#e2e8f0' }}>{profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
              {profile?.medical_conditions_summary && (
                <div style={{ marginTop: 12 }}>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>Medical Conditions: </span>
                  <span style={{ fontSize: 14, color: '#e2e8f0' }}>{profile.medical_conditions_summary}</span>
                </div>
              )}
              {profile?.advanced_directives && (
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>Advanced Directives: </span>
                  <span style={{ fontSize: 14, color: '#e2e8f0' }}>{profile.advanced_directives}</span>
                </div>
              )}
            </div>

            {/* Medications + Allergies */}
            <div className="eh-grid-2" style={{ gap: 20 }}>
              <div className="eh-card">
                <h3 className="eh-section-title">💊 Medications</h3>
                {profile?.medications?.length ? (
                  <div className="eh-flex-wrap" style={{ gap: 6 }}>
                    {profile.medications.map((m, i) => (
                      <span key={i} className="eh-badge" style={{ backgroundColor: '#f97316' }}>{m}</span>
                    ))}
                  </div>
                ) : <span style={{ fontSize: 14, color: '#6b7280' }}>None reported</span>}
              </div>
              <div className="eh-card">
                <h3 className="eh-section-title">⚠️ Allergies</h3>
                {profile?.allergies?.length ? (
                  <div className="eh-flex-wrap" style={{ gap: 6 }}>
                    {profile.allergies.map((a, i) => (
                      <span key={i} className="eh-badge" style={{ backgroundColor: '#dc2626' }}>{a}</span>
                    ))}
                  </div>
                ) : <span style={{ fontSize: 14, color: '#6b7280' }}>None reported</span>}
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="eh-card">
              <h3 className="eh-section-title">📞 Emergency Contacts</h3>
              {profile?.emergency_contacts?.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
                  {profile.emergency_contacts.map((c, i) => (
                    <div key={i} className="eh-card-compact" style={{ border: c.is_primary ? '1px solid #f97316' : undefined }}>
                      <div className="eh-flex-between eh-mb-4">
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>{c.name}</span>
                        {c.is_primary && <span className="eh-badge" style={{ backgroundColor: '#f97316', fontSize: 10 }}>★ PRIMARY</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>{c.relationship}</div>
                      <div style={{ fontSize: 13, color: '#e2e8f0' }}>{c.phone}</div>
                      {c.email && <div style={{ fontSize: 12, color: '#6b7280' }}>{c.email}</div>}
                    </div>
                  ))}
                </div>
              ) : <span style={{ fontSize: 14, color: '#6b7280' }}>No emergency contacts</span>}
            </div>

            {/* Share Summary Preview */}
            {shareSummary && (
              <div className="eh-card">
                <h3 className="eh-section-title">📤 Shared Summary (Copied!)</h3>
                <pre className="eh-card-compact" style={{
                  color: '#e2e8f0', fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap', overflowX: 'auto',
                  maxHeight: 300, overflowY: 'auto',
                }}>
                  {shareSummary}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
