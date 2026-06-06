'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@executive-health/ui';
import type { LabResult, MedicalRecord, HealthTimelineEntry } from '@executive-health/db';

interface RecordsData {
  lab_results: LabResult[];
  medical_records: MedicalRecord[];
  timeline: HealthTimelineEntry[];
}

const CATEGORIES = ['blood', 'urine', 'imaging', 'cardiac', 'other'];
const FLAGS = ['normal', 'high', 'low', 'critical'];

function flagColor(flag: string): string {
  switch (flag) {
    case 'normal': return '#22c55e';
    case 'high': return '#ef4444';
    case 'low': return '#3b82f6';
    case 'critical': return '#dc2626';
    default: return '#6b7280';
  }
}

function entryIcon(type: string): string {
  switch (type) {
    case 'lab_result': return '🔬';
    case 'medical_record': return '📄';
    default: return '📌';
  }
}

function FlagBadge({ flag }: { flag: string }) {
  return (
    <span className="eh-badge" style={{ backgroundColor: flagColor(flag) }}>
      {flag}
    </span>
  );
}

export default function RecordsPage() {
  const router = useRouter();
  const [data, setData] = useState<RecordsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'lab' | 'upload'>('timeline');
  const [exporting, setExporting] = useState(false);

  // Upload form state
  const [labForm, setLabForm] = useState({
    test_name: '', test_category: 'blood', date: new Date().toISOString().slice(0, 10),
    ordered_by: '', notes: '', file_url: '',
  });
  const [labValues, setLabValues] = useState<{ parameter: string; value: string; unit: string; reference_range: string; flag: string }[]>([
    { parameter: '', value: '', unit: '', reference_range: '', flag: 'normal' },
  ]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchData = useCallback(() => {
    if (!token) { router.push('/auth/login'); return; }
    fetch('/api/records', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(res => {
        if (res.error) { router.push('/auth/login'); return; }
        setData(res);
      })
      .finally(() => setLoading(false));
  }, [token, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUploadLab = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/records/lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...labForm,
          values: labValues.filter(v => v.parameter),
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setSuccess('Lab result saved!');
        setLabForm({ test_name: '', test_category: 'blood', date: new Date().toISOString().slice(0, 10), ordered_by: '', notes: '', file_url: '' });
        setLabValues([{ parameter: '', value: '', unit: '', reference_range: '', flag: 'normal' }]);
        fetchData();
      } else {
        setError(json.error || 'Failed to save lab result');
      }
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/records/export', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `health-report-${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess('Report exported!');
    } catch {
      setError('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const addValueRow = () => setLabValues([...labValues, { parameter: '', value: '', unit: '', reference_range: '', flag: 'normal' }]);

  // ── Inline Styles (minimal, for dynamic/interactive elements) ──
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 };
  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600,
    color: active ? '#ffffff' : '#94a3b8',
    borderBottom: active ? '2px solid #60a5fa' : '2px solid transparent',
    backgroundColor: active ? '#16213e' : 'transparent',
  });

  if (loading) {
    return <DashboardLayout><div className="eh-empty" style={{ padding: 80 }}>Loading...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout currentPath="/records" onNavigate={(p) => router.push(p)}>
      <div className="eh-content-wide">
        <div className="eh-flex-between eh-mb-8">
          <div>
            <h1 className="eh-page-title">📋 Health Records</h1>
            <p className="eh-page-subtitle">Your medical history at a glance</p>
          </div>
          <button className="eh-btn eh-btn-primary" style={{ padding: '10px 24px', fontSize: 15 }} onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting...' : '📥 Export Report'}
          </button>
        </div>

        {error && <div className="eh-alert-error">{error}</div>}
        {success && <div className="eh-alert-success">{success}</div>}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid #2a2a4e' }}>
          <div style={tabStyle(activeTab === 'timeline')} onClick={() => setActiveTab('timeline')}>📅 Timeline</div>
          <div style={tabStyle(activeTab === 'lab')} onClick={() => setActiveTab('lab')}>🔬 Lab Results</div>
          <div style={tabStyle(activeTab === 'upload')} onClick={() => setActiveTab('upload')}>➕ Upload Lab Result</div>
        </div>

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="eh-card">
            <h3 className="eh-section-title">Medical Timeline</h3>
            {!data?.timeline?.length ? (
              <div className="eh-empty">No health records yet.</div>
            ) : (
              <div style={{ position: 'relative', paddingLeft: 40 }}>
                {/* Timeline line */}
                <div style={{ position: 'absolute', left: 15, top: 0, bottom: 0, width: 2, backgroundColor: '#2a2a4e' }} />
                {data.timeline.map((entry, i) => (
                  <div key={entry.id} style={{ position: 'relative', marginBottom: 24, paddingLeft: 20 }}>
                    {/* Timeline dot */}
                    <div style={{
                      position: 'absolute', left: -33, top: 4,
                      width: 12, height: 12, borderRadius: '50%',
                      backgroundColor: entry.entry_type === 'lab_result' ? '#60a5fa' : '#a78bfa',
                      border: '2px solid #1a1a2e',
                    }} />
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <div className="eh-card-compact">
                      <span style={{ fontSize: 20, marginRight: 8 }}>{entryIcon(entry.entry_type)}</span>
                      <span style={{ fontSize: 14, color: '#e2e8f0' }}>{entry.summary}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lab Results Tab */}
        {activeTab === 'lab' && (
          <div className="eh-card">
            <h3 className="eh-section-title">Lab Results</h3>
            {!data?.lab_results?.length ? (
              <div className="eh-empty">No lab results yet. Upload one above!</div>
            ) : (
              <div>
                {data.lab_results.map((lab) => (
                  <div key={lab.id} className="eh-card-compact" style={{ marginBottom: 24 }}>
                    <div className="eh-flex-between" style={{ backgroundColor: '#16213e', padding: '12px 16px' }}>
                      <div>
                        <span style={{ fontWeight: 600, color: '#ffffff', fontSize: 14 }}>{lab.test_name}</span>
                        <span style={{ marginLeft: 10, fontSize: 12, color: '#94a3b8' }}>{lab.test_category} · {lab.date}</span>
                        {lab.ordered_by && <span style={{ marginLeft: 10, fontSize: 12, color: '#6b7280' }}>Ordered by: {lab.ordered_by}</span>}
                      </div>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>{lab.values.length} parameters</span>
                    </div>
                    <div className="eh-table-wrap" style={{ padding: 12 }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Parameter</th>
                            <th>Value</th>
                            <th>Unit</th>
                            <th>Reference Range</th>
                            <th>Flag</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lab.values.map((v, i) => (
                            <tr key={i}>
                              <td>{v.parameter}</td>
                              <td style={{ fontWeight: 600 }}>{v.value}</td>
                              <td>{v.unit}</td>
                              <td>{v.reference_range}</td>
                              <td><FlagBadge flag={v.flag} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {lab.notes && <div style={{ padding: '8px 16px', borderTop: '1px solid #1f1f3a', fontSize: 13, color: '#94a3b8' }}>Notes: {lab.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upload Lab Result Tab */}
        {activeTab === 'upload' && (
          <div className="eh-card">
            <h3 className="eh-section-title">Upload Lab Result</h3>
            <form onSubmit={handleUploadLab}>
              <div className="eh-grid-3 eh-mb-16">
                <div>
                  <label style={labelStyle}>Test Name *</label>
                  <input className="eh-input" value={labForm.test_name} onChange={e => setLabForm(p => ({ ...p, test_name: e.target.value }))} placeholder="e.g., Complete Blood Count" required />
                </div>
                <div>
                  <label style={labelStyle}>Category *</label>
                  <select className="eh-select" value={labForm.test_category} onChange={e => setLabForm(p => ({ ...p, test_category: e.target.value }))} required>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Date *</label>
                  <input className="eh-input" type="date" value={labForm.date} onChange={e => setLabForm(p => ({ ...p, date: e.target.value }))} required />
                </div>
              </div>
              <div className="eh-grid-2 eh-mb-20">
                <div>
                  <label style={labelStyle}>Ordered By</label>
                  <input className="eh-input" value={labForm.ordered_by} onChange={e => setLabForm(p => ({ ...p, ordered_by: e.target.value }))} placeholder="Dr. Name" />
                </div>
                <div>
                  <label style={labelStyle}>File URL (optional)</label>
                  <input className="eh-input" value={labForm.file_url} onChange={e => setLabForm(p => ({ ...p, file_url: e.target.value }))} placeholder="https://..." />
                </div>
              </div>

              {/* Test Values */}
              <div className="eh-mb-16">
                <div className="eh-flex-between eh-mb-8">
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Test Values *</label>
                  <button type="button" className="eh-btn eh-btn-sm eh-btn-primary" onClick={addValueRow}>+ Add Parameter</button>
                </div>
                {labValues.map((v, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1fr', gap: 8, marginBottom: 8 }}>
                    <input className="eh-input" placeholder="Parameter" value={v.parameter} onChange={e => {
                      const vals = [...labValues]; vals[i].parameter = e.target.value; setLabValues(vals);
                    }} required />
                    <input className="eh-input" placeholder="Value" value={v.value} onChange={e => {
                      const vals = [...labValues]; vals[i].value = e.target.value; setLabValues(vals);
                    }} required />
                    <input className="eh-input" placeholder="Unit" value={v.unit} onChange={e => {
                      const vals = [...labValues]; vals[i].unit = e.target.value; setLabValues(vals);
                    }} />
                    <input className="eh-input" placeholder="Ref Range" value={v.reference_range} onChange={e => {
                      const vals = [...labValues]; vals[i].reference_range = e.target.value; setLabValues(vals);
                    }} />
                    <div style={{ display: 'flex', gap: 4 }}>
                      <select className="eh-select" value={v.flag} onChange={e => {
                        const vals = [...labValues]; vals[i].flag = e.target.value; setLabValues(vals);
                      }}>
                        {FLAGS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                      {labValues.length > 1 && (
                        <button type="button" className="eh-btn eh-btn-danger eh-btn-sm"
                          onClick={() => setLabValues(labValues.filter((_, idx) => idx !== i))}>✕</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="eh-mb-20">
                <label style={labelStyle}>Notes</label>
                <textarea className="eh-input" style={{ minHeight: 60, resize: 'vertical' }} value={labForm.notes} onChange={e => setLabForm(p => ({ ...p, notes: e.target.value }))} placeholder="Additional notes..." />
              </div>

              <button type="submit" className="eh-btn eh-btn-primary" style={{ width: '100%', padding: '12px' }} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Lab Result'}
              </button>
            </form>
          </div>
        )}

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
