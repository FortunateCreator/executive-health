import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getServiceRequests, getAppointments, getConciergeMessages } from '@executive-health/db';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const requests = getServiceRequests(userId);
    const appointments = getAppointments(userId);
    const messages = getConciergeMessages(userId);

    return NextResponse.json({ requests, appointments, messages });
  } catch (err) {
    console.error('Concierge fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch concierge data' }, { status: 500 });
  }
}
