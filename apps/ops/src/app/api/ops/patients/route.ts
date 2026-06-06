import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import {
  getAllProfiles,
  getLatestScore,
  getClinicalNotes,
} from '@executive-health/db';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const profiles = getAllProfiles();

    const patients = profiles.map((profile) => {
      const latest = getLatestScore(profile.id);
      const notes = getClinicalNotes(profile.id);

      return {
        user_id: profile.id,
        display_name: profile.display_name,
        email: profile.email,
        risk_category: latest?.score_data?.risk_category ?? 'low',
        last_score: latest?.overall_score ?? null,
        notes_count: notes.length,
      };
    });

    return NextResponse.json({ patients });
  } catch (err) {
    console.error('Patients error:', err);
    return NextResponse.json(
      { error: 'Failed to load patients' },
      { status: 500 },
    );
  }
}
