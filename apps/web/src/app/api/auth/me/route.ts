import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getProfile, upsertProfile } from '@executive-health/db';
import { getUserById } from '@executive-health/db';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let profile = getProfile(userId);
  if (!profile) {
    const authUser = getUserById(userId);
    if (!authUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    profile = {
      id: userId,
      email: authUser.email,
      display_name: authUser.display_name,
      created_at: authUser.created_at,
      last_intake_date: null,
      last_score: null,
    };
    upsertProfile(profile);
  }
  return NextResponse.json({ user: profile });
}

export async function PATCH(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { display_name } = await request.json();
    let profile = getProfile(userId);
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    profile.display_name = display_name || profile.display_name;
    upsertProfile(profile);

    return NextResponse.json({ user: profile });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
