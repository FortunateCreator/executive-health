import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { saveAppointment, saveConciergeMessage } from '@executive-health/db';
import type { ConciergeMessage } from '@executive-health/db';
import { v4 as uuid } from 'uuid';

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { title, description, appointment_date, appointment_time, provider_name, location, duration_minutes, reminder_before_minutes } = body;

    if (!title || !appointment_date || !appointment_time || !provider_name) {
      return NextResponse.json({ error: 'title, appointment_date, appointment_time, and provider_name are required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const apptId = uuid();

    const appointment = {
      id: apptId,
      user_id: userId,
      title,
      description: description || '',
      appointment_date,
      appointment_time,
      duration_minutes: duration_minutes || 30,
      provider_name,
      location: location || 'virtual',
      status: 'scheduled' as const,
      reminder_before_minutes: reminder_before_minutes || 30,
      created_at: now,
    };

    saveAppointment(appointment);

    // Create a confirmation message
    const confirmMessage: ConciergeMessage = {
      id: uuid(),
      user_id: userId,
      sender: 'concierge',
      message: `Appointment "${title}" with ${provider_name} scheduled for ${appointment_date} at ${appointment_time}. A reminder will be sent ${appointment.reminder_before_minutes} minutes before.`,
      created_at: now,
    };
    saveConciergeMessage(confirmMessage);

    return NextResponse.json({ appointment, message: confirmMessage }, { status: 201 });
  } catch (err) {
    console.error('Appointment creation error:', err);
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
  }
}
