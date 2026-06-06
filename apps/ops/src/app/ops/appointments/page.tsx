'use client';
import { useState, useEffect } from 'react';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  async function fetchAppointments() {
    const res = await fetch('/api/ops/appointments', { headers });
    if (res.ok) setAppointments(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchAppointments(); }, []);

  async function handleUpdateStatus(id: string, newStatus: string) {
    await fetch(`/api/ops/appointments/${id}`, {
      method: 'PUT', headers,
      body: JSON.stringify({ status: newStatus }),
    });
    fetchAppointments();
  }

  const filtered = statusFilter === 'all'
    ? appointments
    : appointments.filter(a => a.status === statusFilter);

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-900/50 text-blue-400',
    confirmed: 'bg-green-900/50 text-green-400',
    completed: 'bg-neutral-700/50 text-neutral-400',
    cancelled: 'bg-red-900/50 text-red-400',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Appointments</h1>

      {/* Filter */}
      <div className="flex gap-3 items-center">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-white text-sm">
          <option value="all">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span className="text-xs text-neutral-500">{filtered.length} appointments</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-neutral-400 py-8">Loading appointments...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 text-center">
          <p className="text-neutral-400">No appointments found.</p>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400">
                <th className="text-left py-3 px-4 font-medium">Patient</th>
                <th className="text-left py-3 px-4 font-medium">Title</th>
                <th className="text-left py-3 px-4 font-medium">Date</th>
                <th className="text-left py-3 px-4 font-medium">Time</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-right py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a: any) => (
                <tr key={a.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                  <td className="py-3 px-4 text-white font-medium">{a.patient_name || 'Unknown'}</td>
                  <td className="py-3 px-4 text-neutral-300">{a.title}</td>
                  <td className="py-3 px-4 text-neutral-300">{a.appointment_date}</td>
                  <td className="py-3 px-4 text-neutral-300">{a.appointment_time}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[a.status] || 'bg-neutral-800 text-neutral-400'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex gap-1 justify-end">
                      {a.status === 'scheduled' && (
                        <button onClick={() => handleUpdateStatus(a.id, 'confirmed')}
                          className="text-green-400 hover:text-green-300 text-xs px-2 py-1 rounded hover:bg-green-900/20">
                          Confirm
                        </button>
                      )}
                      {a.status !== 'completed' && a.status !== 'cancelled' && (
                        <button onClick={() => handleUpdateStatus(a.id, 'completed')}
                          className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded hover:bg-blue-900/20">
                          Complete
                        </button>
                      )}
                      {a.status !== 'cancelled' && a.status !== 'completed' && (
                        <button onClick={() => handleUpdateStatus(a.id, 'cancelled')}
                          className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-900/20">
                          Cancel
                        </button>
                      )}
                    </div>
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
