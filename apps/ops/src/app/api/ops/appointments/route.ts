import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import {
  getAllProfiles,
  getAppointments,
  getUserById,
} from '@executive-health/db';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const profiles = getAllProfiles();

    const appointments = profiles.flatMap((profile) => {
      const user = getUserById(profile.id);

      return getAppointments(profile.id).map((appointment) => ({
        ...appointment,
        patient_name: user?.display_name ?? 'Unknown',
        patient_email: user?.email ?? '',
      }));
    });

    // Sort by date ascending
    appointments.sort(
      (a, b) => a.appointment_date.localeCompare(b.appointment_date),
    );

    return NextResponse.json(appointments);
  } catch (err) {
    console.error('Appointments error:', err);
    return NextResponse.json(
      { error: 'Failed to load appointments' },
      { status: 500 },
    );
  }
}
