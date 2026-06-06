'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@executive-health/ui';
import type { ServiceRequest, Appointment, ConciergeMessage } from '@executive-health/db';

interface ConciergeData {
  requests: ServiceRequest[];
  appointments: Appointment[];
  messages: ConciergeMessage[];
}

const SERVICE_TYPES: { value: string; label: string }[] = [
  { value: 'lab_test', label: 'Book Lab Test' },
  { value: 'doctor_appointment', label: 'Book Doctor' },
  { value: 'emergency_support', label: 'Emergency Support' },
  { value: 'prescription_refill', label: 'Prescription Refill' },
  { value: 'health_screening', label: 'Health Screening' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

function statusColor(s: string): string {
  switch (s) {
    case 'pending': return '#3b82f6';
    case 'in_progress': return '#eab308';
    case 'completed': return '#22c55e';
    case 'cancelled': return '#ef4444';
    default: return '#6b7280';
  }
}

function priorityColor(p: string): string {
  switch (p) {
    case 'urgent': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    case 'low': return '#22c55e';
    default: return '#6b7280';
  }
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span className="eh-badge" style={{ backgroundColor: color }}>
      {text.replace(/_/g, ' ')}
    </span>
  );
}

export default function ConciergePage() {
  const router = useRouter();
  const [data, setData] = useState<ConciergeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'appointments' | 'chat'>('requests');
  const [showModal, setShowModal] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState(30);

  // Quick action form state
  const [reqForm, setReqForm] = useState({ service_type: '', description: '', priority: 'medium' });
  const [apptForm, setApptForm] = useState({
    title: '', description: '', appointment_date: '', appointment_time: '',
    provider_name: '', location: 'virtual', duration_minutes: '30',
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchData = useCallback(() => {
    if (!token) { router.push('/auth/login'); return; }
    fetch('/api/concierge', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(res => {
        if (res.error) { router.push('/auth/login'); return; }
        setData(res);
      })
      .finally(() => setLoading(false));
  }, [token, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/concierge/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(reqForm),
      });
      const json = await res.json();
      if (res.ok) {
        setSuccess('Request created successfully!');
        setShowModal(null);
        setReqForm({ service_type: '', description: '', priority: 'medium' });
        fetchData();
      } else {
        setError(json.error || 'Failed to create request');
      }
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/concierge/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...apptForm,
          duration_minutes: Number(apptForm.duration_minutes),
          reminder_before_minutes: reminderMinutes,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setSuccess('Appointment booked successfully!');
        setShowModal(null);
        setApptForm({ title: '', description: '', appointment_date: '', appointment_time: '', provider_name: '', location: 'virtual', duration_minutes: '30' });
        fetchData();
      } else {
        setError(json.error || 'Failed to book appointment');
      }
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setError('');
    try {
      const res = await fetch('/api/concierge/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          service_type: 'other',
          description: chatInput.trim(),
          priority: /help|urgent|emergency/i.test(chatInput) ? 'urgent' : 'medium',
        }),
      });
      if (res.ok) {
        setChatInput('');
        fetchData();
      }
    } catch {
      setError('Failed to send message');
    }
  };

  // ── Inline Styles (minimal, for dynamic/interactive elements) ──
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 };
  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600,
    color: active ? '#ffffff' : '#94a3b8',
    borderBottom: active ? '2px solid #60a5fa' : '2px solid transparent',
    backgroundColor: active ? '#16213e' : 'transparent',
    transition: 'all 0.15s',
  });

  if (loading) {
    return <DashboardLayout><div className="eh-empty" style={{ padding: 80 }}>Loading...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout currentPath="/concierge" onNavigate={(p) => router.push(p)}>
      <div className="eh-content-wide">
        <h1 className="eh-page-title">🛎️ Executive Concierge</h1>
        <p className="eh-page-subtitle">Manage your healthcare services, appointments, and support</p>

        {error && <div className="eh-alert-error">{error}</div>}
        {success && <div className="eh-alert-success">{success}</div>}

        {/* Quick Action Buttons */}
        <div className="eh-card eh-mb-20">
          <h3 className="eh-section-title">Quick Actions</h3>
          <div className="eh-flex-wrap" style={{ gap: 12 }}>
            {SERVICE_TYPES.map((st) => (
              <button
                key={st.value}
                className="eh-btn"
                style={{
                  padding: '12px 20px', borderRadius: 10, border: '1px solid #2a2a4e',
                  backgroundColor: '#0f0f23', color: '#e2e8f0', fontSize: 14, fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onClick={() => {
                  if (st.value === 'doctor_appointment') {
                    setShowModal('appointment');
                  } else {
                    setReqForm(p => ({ ...p, service_type: st.value }));
                    setShowModal('request');
                  }
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#16213e'; (e.currentTarget as HTMLElement).style.borderColor = '#60a5fa'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#0f0f23'; (e.currentTarget as HTMLElement).style.borderColor = '#2a2a4e'; }}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reminder Settings */}
        <div className="eh-card eh-mb-20">
          <h3 className="eh-section-title">⏰ Default Reminder</h3>
          <div className="eh-flex-center" style={{ gap: 12 }}>
            <span style={{ fontSize: 14, color: '#e2e8f0' }}>Remind me</span>
            <select className="eh-select" style={{ width: 'auto' }} value={reminderMinutes} onChange={e => setReminderMinutes(Number(e.target.value))}>
              <option value={15}>15 minutes before</option>
              <option value={30}>30 minutes before</option>
              <option value={60}>1 hour before</option>
              <option value={120}>2 hours before</option>
              <option value={1440}>1 day before</option>
            </select>
            <span style={{ fontSize: 14, color: '#e2e8f0' }}>appointments</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid #2a2a4e' }}>
          <div style={tabStyle(activeTab === 'requests')} onClick={() => setActiveTab('requests')}>📋 Requests ({data?.requests?.length || 0})</div>
          <div style={tabStyle(activeTab === 'appointments')} onClick={() => setActiveTab('appointments')}>📅 Appointments ({data?.appointments?.length || 0})</div>
          <div style={tabStyle(activeTab === 'chat')} onClick={() => setActiveTab('chat')}>💬 Chat ({data?.messages?.length || 0})</div>
        </div>

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="eh-card">
            <h3 className="eh-section-title">Service Requests</h3>
            {!data?.requests?.length ? (
              <div className="eh-empty">No service requests yet.</div>
            ) : (
              <div className="eh-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Priority</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.requests.map((req) => (
                      <tr key={req.id}>
                        <td>{new Date(req.created_at).toLocaleDateString()}</td>
                        <td><Badge text={req.service_type} color="#1e40af" /></td>
                        <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.description}</td>
                        <td><Badge text={req.priority} color={priorityColor(req.priority)} /></td>
                        <td><Badge text={req.status} color={statusColor(req.status)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {!data?.appointments?.length ? (
              <div className="eh-empty" style={{ gridColumn: '1 / -1' }}>No upcoming appointments.</div>
            ) : (
              data.appointments.map((appt) => (
                <div key={appt.id} className="eh-card" style={{ borderLeft: '4px solid #60a5fa' }}>
                  <div className="eh-flex-between eh-mb-8">
                    <h4 style={{ margin: 0, fontSize: 16, color: '#ffffff', fontWeight: 600 }}>{appt.title}</h4>
                    <Badge text={appt.status} color={appt.status === 'confirmed' ? '#22c55e' : appt.status === 'scheduled' ? '#3b82f6' : appt.status === 'completed' ? '#6b7280' : '#ef4444'} />
                  </div>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 12px' }}>{appt.description || 'No description'}</p>
                  <div style={{ fontSize: 13, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div>📅 {appt.appointment_date} at {appt.appointment_time}</div>
                    <div>👨‍⚕️ {appt.provider_name}</div>
                    <div>📍 {appt.location}</div>
                    <div>⏱️ {appt.duration_minutes} min</div>
                    <div>🔔 Reminder: {appt.reminder_before_minutes} min before</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="eh-card">
            <h3 className="eh-section-title">Concierge Messages</h3>
            <div style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 16, padding: '0 4px' }}>
              {!data?.messages?.length ? (
                <div className="eh-empty">No messages yet. Start a conversation!</div>
              ) : (
                data.messages.map((msg) => (
                  <div key={msg.id} style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: 12,
                  }}>
                    <div style={{
                      maxWidth: '70%', padding: '10px 16px', borderRadius: 12,
                      backgroundColor: msg.sender === 'user' ? '#1e40af' : msg.sender === 'ai' ? '#16213e' : '#1a1a2e',
                      border: '1px solid #2a2a4e',
                    }}>
                      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
                        {msg.sender === 'user' ? 'You' : msg.sender === 'ai' ? 'AI Assistant' : 'Concierge'}
                        {' · '}{new Date(msg.created_at).toLocaleString()}
                      </div>
                      <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.5 }}>{msg.message}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 8 }}>
              <input
                className="eh-input"
                style={{ flex: 1 }}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Type a message or request..."
              />
              <button type="submit" className="eh-btn eh-btn-primary" disabled={!chatInput.trim()}>Send</button>
            </form>
          </div>
        )}
      </div>

      {/* Modal for Request Form */}
      {showModal === 'request' && (
        <Modal onClose={() => setShowModal(null)} title="New Service Request">
          <form onSubmit={handleCreateRequest}>
            <div className="eh-mb-16">
              <label style={labelStyle}>Service Type</label>
              <select className="eh-select" value={reqForm.service_type} onChange={e => setReqForm(p => ({ ...p, service_type: e.target.value }))} required>
                <option value="">Select type...</option>
                {SERVICE_TYPES.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
              </select>
            </div>
            <div className="eh-mb-16">
              <label style={labelStyle}>Description</label>
              <textarea className="eh-input" style={{ minHeight: 80, resize: 'vertical' }} value={reqForm.description} onChange={e => setReqForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe what you need..." required />
            </div>
            <div className="eh-mb-20">
              <label style={labelStyle}>Priority</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {PRIORITIES.map(p => (
                  <button key={p} type="button" className="eh-btn eh-btn-sm" style={{
                    border: reqForm.priority === p ? '2px solid #60a5fa' : '1px solid #2a2a4e',
                    backgroundColor: reqForm.priority === p ? '#16213e' : '#0f0f23',
                    textTransform: 'capitalize',
                  }} onClick={() => setReqForm(pr => ({ ...pr, priority: p }))}>{p}</button>
                ))}
              </div>
            </div>
            <button type="submit" className="eh-btn eh-btn-primary" style={{ width: '100%', padding: '12px' }} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Create Request'}
            </button>
          </form>
        </Modal>
      )}

      {/* Modal for Appointment Form */}
      {showModal === 'appointment' && (
        <Modal onClose={() => setShowModal(null)} title="Book Appointment">
          <form onSubmit={handleCreateAppointment}>
            <div className="eh-mb-16">
              <label style={labelStyle}>Title *</label>
              <input className="eh-input" value={apptForm.title} onChange={e => setApptForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g., Annual Physical" required />
            </div>
            <div className="eh-mb-16">
              <label style={labelStyle}>Description</label>
              <textarea className="eh-input" style={{ minHeight: 60, resize: 'vertical' }} value={apptForm.description} onChange={e => setApptForm(p => ({ ...p, description: e.target.value }))} placeholder="Reason for visit..." />
            </div>
            <div className="eh-grid-2 eh-mb-16">
              <div>
                <label style={labelStyle}>Date *</label>
                <input className="eh-input" type="date" value={apptForm.appointment_date} onChange={e => setApptForm(p => ({ ...p, appointment_date: e.target.value }))} required />
              </div>
              <div>
                <label style={labelStyle}>Time *</label>
                <input className="eh-input" type="time" value={apptForm.appointment_time} onChange={e => setApptForm(p => ({ ...p, appointment_time: e.target.value }))} required />
              </div>
            </div>
            <div className="eh-mb-16">
              <label style={labelStyle}>Provider Name *</label>
              <input className="eh-input" value={apptForm.provider_name} onChange={e => setApptForm(p => ({ ...p, provider_name: e.target.value }))} placeholder="Dr. Name" required />
            </div>
            <div className="eh-grid-2 eh-mb-20">
              <div>
                <label style={labelStyle}>Location</label>
                <select className="eh-select" value={apptForm.location} onChange={e => setApptForm(p => ({ ...p, location: e.target.value }))}>
                  <option value="virtual">Virtual</option>
                  <option value="Lagos Clinic">Lagos Clinic</option>
                  <option value="Abuja Medical Center">Abuja Medical Center</option>
                  <option value="Port Harcourt Hospital">Port Harcourt Hospital</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Duration (min)</label>
                <input className="eh-input" type="number" min={15} max={180} step={15} value={apptForm.duration_minutes} onChange={e => setApptForm(p => ({ ...p, duration_minutes: e.target.value }))} />
              </div>
            </div>
            <button type="submit" className="eh-btn eh-btn-primary" style={{ width: '100%', padding: '12px' }} disabled={submitting}>
              {submitting ? 'Booking...' : 'Book Appointment'}
            </button>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}

// ── Reusable Modal Component ──
function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000 }} onClick={onClose} />
      <div className="eh-card" style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 1001, width: 480, maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto',
      }}>
        <div className="eh-flex-between eh-mb-20">
          <h2 style={{ margin: 0, fontSize: 18, color: '#ffffff', fontWeight: 600 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 24, cursor: 'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </>
  );
}
