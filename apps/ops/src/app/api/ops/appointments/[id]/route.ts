import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getAppointments, saveAppointment, getUserById } from '@executive-health/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const staffId = getUserIdFromRequest(request);
  if (!staffId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const { status: newStatus } = body;

    // Find appointment across all users
    const allProfiles = (await import('@executive-health/db')).getAllProfiles();
    let found = false;
    for (const profile of allProfiles) {
      const appts = getAppointments(profile.id);
      const appt = appts.find(a => a.id === id);
      if (appt) {
        const updated = { ...appt, status: newStatus || appt.status, updated_at: new Date().toISOString() };
        saveAppointment(updated);
        found = true;
        return NextResponse.json(updated);
      }
    }

    if (!found) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
  } catch {
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}
