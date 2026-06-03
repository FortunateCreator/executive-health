import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getProfile, upsertProfile, saveIntake, saveScore, getScores } from '@executive-health/db';
import { scoreHealth } from '@executive-health/ai';
import { v4 as uuid } from 'uuid';

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const intakeData = await request.json();
    const intakeId = uuid();
    const now = new Date().toISOString();

    // Save intake
    saveIntake({ id: intakeId, user_id: userId, data: intakeData, created_at: now });

    // Calculate score
    const score = await scoreHealth(intakeData);

    // Save score
    saveScore({
      id: uuid(),
      user_id: userId,
      overall_score: score.overall,
      score_data: score,
      intake_id: intakeId,
      created_at: now,
    });

    // Update profile
    const profile = getProfile(userId);
    if (profile) {
      upsertProfile({ ...profile, last_intake_date: now, last_score: score.overall });
    }

    return NextResponse.json({ score });
  } catch (err) {
    console.error('Score error:', err);
    return NextResponse.json({ error: 'Failed to calculate score' }, { status: 500 });
  }
}
