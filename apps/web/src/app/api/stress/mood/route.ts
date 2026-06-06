import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { saveMoodCheckIn } from '@executive-health/db';
import { v4 as uuid } from 'uuid';

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const {
      date,
      time_of_day,
      mood_score,
      stress_level,
      energy_level,
      anxiety_level,
      workload_score,
      sleep_quality,
      triggers,
      notes,
    } = body;

    if (!date || !time_of_day || mood_score === undefined || stress_level === undefined || energy_level === undefined || anxiety_level === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: date, time_of_day, mood_score, stress_level, energy_level, anxiety_level' },
        { status: 400 },
      );
    }

    const validTimes = ['morning', 'afternoon', 'evening'];
    if (!validTimes.includes(time_of_day)) {
      return NextResponse.json({ error: 'Invalid time_of_day' }, { status: 400 });
    }

    // Validate ranges 1-10
    const scores = [mood_score, stress_level, energy_level, anxiety_level];
    for (const s of scores) {
      if (s < 1 || s > 10) {
        return NextResponse.json({ error: 'Scores must be between 1 and 10' }, { status: 400 });
      }
    }

    const now = new Date().toISOString();
    const checkin = {
      id: uuid(),
      user_id: userId,
      date,
      time_of_day,
      mood_score: Number(mood_score),
      stress_level: Number(stress_level),
      energy_level: Number(energy_level),
      anxiety_level: Number(anxiety_level),
      workload_score: workload_score !== undefined ? Number(workload_score) : undefined,
      sleep_quality: sleep_quality !== undefined ? Number(sleep_quality) : undefined,
      triggers: triggers || undefined,
      notes: notes || undefined,
      created_at: now,
    };

    saveMoodCheckIn(checkin);

    return NextResponse.json({ checkin });
  } catch (err) {
    console.error('Mood check-in error:', err);
    return NextResponse.json({ error: 'Failed to save mood check-in' }, { status: 500 });
  }
}
