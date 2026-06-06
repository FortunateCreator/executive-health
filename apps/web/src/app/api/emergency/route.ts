import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getEmergencyProfile, saveEmergencyProfile, getProfile } from '@executive-health/db';
import { v4 as uuid } from 'uuid';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const profile = getEmergencyProfile(userId);
    const userProfile = getProfile(userId);

    return NextResponse.json({
      profile: profile || null,
      user: userProfile ? { id: userProfile.id, display_name: userProfile.display_name, email: userProfile.email } : null,
    });
  } catch (err) {
    console.error('Emergency profile fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch emergency profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const {
      emergency_contacts,
      medical_conditions_summary,
      allergies,
      medications,
      blood_type,
      primary_physician,
      insurance_info,
      advanced_directives,
    } = body;

    const now = new Date().toISOString();
    const existing = getEmergencyProfile(userId);

    const profile = {
      id: existing?.id || uuid(),
      user_id: userId,
      emergency_contacts: emergency_contacts || [],
      medical_conditions_summary: medical_conditions_summary || '',
      allergies: allergies || [],
      medications: medications || [],
      blood_type: blood_type || undefined,
      primary_physician: primary_physician || undefined,
      insurance_info: insurance_info || undefined,
      advanced_directives: advanced_directives || undefined,
      updated_at: now,
    };

    saveEmergencyProfile(profile);
    return NextResponse.json({ profile });
  } catch (err) {
    console.error('Emergency profile save error:', err);
    return NextResponse.json({ error: 'Failed to save emergency profile' }, { status: 500 });
  }
}
