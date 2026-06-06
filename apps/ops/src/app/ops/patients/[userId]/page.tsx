'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Note {
  id: string; staff_name: string; note_type: string;
  subjective: string; objective: string; assessment: string; plan: string;
  is_private: boolean; created_at: string;
}

export default function PatientDetailPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [data, setData] = useState<any>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteForm, setNoteForm] = useState({ subjective: '', objective: '', assessment: '', plan: '' });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  async function fetchData() {
    try {
      const [patientRes, notesRes] = await Promise.all([
        fetch(`/api/ops/patients/${userId}`, { headers }),
        fetch(`/api/ops/patients/${userId}/notes`, { headers }),
      ]);
      if (patientRes.ok) setData(await patientRes.json());
      else setError('Patient not found');
      if (notesRes.ok) { const n = await notesRes.json(); setNotes(n.notes || []); }
    } catch { setError('Failed to load patient data'); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchData(); }, []);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/ops/patients/${userId}/notes`, {
      method: 'POST', headers,
      body: JSON.stringify({ ...noteForm, note_type: 'soap' }),
    });
    if (res.ok) {
      setShowNoteForm(false);
      setNoteForm({ subjective: '', objective: '', assessment: '', plan: '' });
      const notesRes = await fetch(`/api/ops/patients/${userId}/notes`, { headers });
      if (notesRes.ok) { const n = await notesRes.json(); setNotes(n.notes || []); }
    }
  }

  if (loading) return <div className="text-neutral-400">Loading patient data...</div>;
  if (error || !data) return <div className="text-red-400">{error || 'Failed to load'}</div>;

  const { patient, healthScore, scoreHistory, sleepSummary, stressSummary, nutritionSummary } = data;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link href="/ops/patients" className="text-xs text-blue-400 hover:text-blue-300 mb-2 block">← Back to Patients</Link>
          <h1 className="text-2xl font-bold text-white">{patient.display_name}</h1>
          <p className="text-sm text-neutral-400">{patient.email}</p>
        </div>
        <div className="text-right">
          {healthScore ? (
            <>
              <p className={`text-3xl font-bold ${healthScore.risk_category === 'critical' ? 'text-red-400' : healthScore.risk_category === 'high' ? 'text-orange-400' : healthScore.risk_category === 'moderate' ? 'text-yellow-400' : 'text-green-400'}`}>
                {healthScore.overall}
              </p>
              <p className="text-xs text-neutral-500 capitalize">{healthScore.risk_category} risk</p>
            </>
          ) : (
            <p className="text-neutral-500">No assessment</p>
          )}
        </div>
      </div>

      {/* Health Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-neutral-400 mb-2">Sleep</h3>
          {sleepSummary ? (
            <>
              <p className="text-xl font-bold text-white">{sleepSummary.avg_hours}h</p>
              <p className="text-xs text-neutral-500">{sleepSummary.nights_logged} nights logged</p>
              <p className="text-xs text-neutral-500">Quality: {Math.round(sleepSummary.avg_quality)}/100</p>
            </>
          ) : <p className="text-sm text-neutral-500">No data</p>}
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-neutral-400 mb-2">Stress & Mood</h3>
          {stressSummary ? (
            <>
              <p className="text-xl font-bold text-white">{stressSummary.avg_mood}</p>
              <p className="text-xs text-neutral-500">Mood score (avg)</p>
              <p className="text-xs text-neutral-500">Stress: {stressSummary.avg_stress}</p>
            </>
          ) : <p className="text-sm text-neutral-500">No data</p>}
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-neutral-400 mb-2">Nutrition</h3>
          {nutritionSummary ? (
            <>
              <p className="text-xl font-bold text-white">{nutritionSummary.avg_calories}</p>
              <p className="text-xs text-neutral-500">Avg daily calories</p>
              <p className="text-xs text-neutral-500">{nutritionSummary.meals_logged} meals logged</p>
            </>
          ) : <p className="text-sm text-neutral-500">No data</p>}
        </div>
      </div>

      {/* Score History */}
      {scoreHistory && scoreHistory.length > 0 && (
        <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Score History</h2>
          <div className="flex items-end gap-1 h-24">
            {scoreHistory.map((s: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-blue-600 rounded-t transition-all hover:bg-blue-500"
                  style={{ height: `${(s.score / 100) * 100}%` }}
                  title={`${s.date}: ${s.score}`} />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-neutral-500 mt-2">
            <span>{scoreHistory[0]?.date}</span>
            <span>{scoreHistory[scoreHistory.length - 1]?.date}</span>
          </div>
        </section>
      )}

      {/* Clinical Notes */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Clinical Notes ({notes.length})</h2>
          <button onClick={() => setShowNoteForm(!showNoteForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
            {showNoteForm ? 'Cancel' : 'Add Note'}
          </button>
        </div>

        {showNoteForm && (
          <form onSubmit={handleAddNote} className="mb-6 space-y-3 bg-neutral-800 rounded-lg p-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Subjective</label>
              <textarea value={noteForm.subjective} onChange={e => setNoteForm(s => ({ ...s, subjective: e.target.value }))}
                rows={2} placeholder="Patient's reported symptoms..."
                className="w-full bg-neutral-700 border border-neutral-600 rounded px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Objective</label>
              <textarea value={noteForm.objective} onChange={e => setNoteForm(s => ({ ...s, objective: e.target.value }))}
                rows={2} placeholder="Vitals, observations..."
                className="w-full bg-neutral-700 border border-neutral-600 rounded px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Assessment</label>
              <textarea value={noteForm.assessment} onChange={e => setNoteForm(s => ({ ...s, assessment: e.target.value }))}
                rows={2} placeholder="Clinical assessment..."
                className="w-full bg-neutral-700 border border-neutral-600 rounded px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Plan</label>
              <textarea value={noteForm.plan} onChange={e => setNoteForm(s => ({ ...s, plan: e.target.value }))}
                rows={2} placeholder="Treatment plan, follow-up..."
                className="w-full bg-neutral-700 border border-neutral-600 rounded px-3 py-2 text-white text-sm" />
            </div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
              Save Note
            </button>
          </form>
        )}

        {notes.length === 0 ? (
          <p className="text-sm text-neutral-500">No clinical notes recorded.</p>
        ) : (
          <div className="space-y-3">
            {notes.map(note => (
              <div key={note.id} className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs text-blue-400 font-medium uppercase">{note.note_type}</span>
                    <span className="text-xs text-neutral-500 ml-2">by {note.staff_name}</span>
                  </div>
                  <span className="text-xs text-neutral-500">{new Date(note.created_at).toLocaleDateString()}</span>
                </div>
                {note.subjective && <div className="mb-1"><span className="text-xs text-neutral-500">S: </span><span className="text-sm text-neutral-300">{note.subjective}</span></div>}
                {note.objective && <div className="mb-1"><span className="text-xs text-neutral-500">O: </span><span className="text-sm text-neutral-300">{note.objective}</span></div>}
                {note.assessment && <div className="mb-1"><span className="text-xs text-neutral-500">A: </span><span className="text-sm text-neutral-300">{note.assessment}</span></div>}
                {note.plan && <div><span className="text-xs text-neutral-500">P: </span><span className="text-sm text-neutral-300">{note.plan}</span></div>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
