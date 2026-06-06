import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { saveServiceRequest, saveConciergeMessage } from '@executive-health/db';
import type { ServiceType, ConciergeMessage } from '@executive-health/db';
import { v4 as uuid } from 'uuid';

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { service_type, description, priority } = body;

    if (!service_type || !description) {
      return NextResponse.json({ error: 'service_type and description are required' }, { status: 400 });
    }

    const validTypes: ServiceType[] = ['lab_test', 'doctor_appointment', 'emergency_support', 'prescription_refill', 'health_screening', 'other'];
    if (!validTypes.includes(service_type)) {
      return NextResponse.json({ error: `Invalid service_type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 });
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    const finalPriority = validPriorities.includes(priority) ? priority : 'medium';

    const now = new Date().toISOString();
    const reqId = uuid();

    const serviceReq = {
      id: reqId,
      user_id: userId,
      service_type: service_type as ServiceType,
      description,
      priority: finalPriority,
      status: 'pending' as const,
      created_at: now,
      updated_at: now,
    };

    saveServiceRequest(serviceReq);

    // Auto-create initial concierge message
    const autoMessage: ConciergeMessage = {
      id: uuid(),
      user_id: userId,
      sender: 'ai',
      message: `Your ${service_type.replace(/_/g, ' ')} request has been received. Our concierge team will review it shortly. Priority: ${finalPriority}.`,
      request_id: reqId,
      created_at: now,
    };
    saveConciergeMessage(autoMessage);

    return NextResponse.json({ request: serviceReq, message: autoMessage }, { status: 201 });
  } catch (err) {
    console.error('Concierge request error:', err);
    return NextResponse.json({ error: 'Failed to create service request' }, { status: 500 });
  }
}
