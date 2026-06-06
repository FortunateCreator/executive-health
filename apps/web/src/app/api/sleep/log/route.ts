import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { saveSleepRecord, getSleepRecords } from '@executive-health/db';
import { calculateSleepScore } from '@executive-health/sleep';
import { v4 as uuid } from 'uuid';

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { date, bedtime, wake_time, quality, interruptions, deep_sleep_minutes, rem_sleep_minutes, heart_rate_variability, notes, source } = body;

    if (!date || !bedtime || !wake_time || !quality || interruptions === undefined) {
      return NextResponse.json({ error: 'Missing required fields: date, bedtime, wake_time, quality, interruptions' }, { status: 400 });
    }

    const bedtimeDate = new Date(bedtime);
    const wakeTimeDate = new Date(wake_time);
    const durationMinutes = Math.round((wakeTimeDate.getTime() - bedtimeDate.getTime()) / 60000);

    if (durationMinutes <= 0) {
      return NextResponse.json({ error: 'Wake time must be after bedtime' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const record = {
      id: uuid(),
      user_id: userId,
      date,
      bedtime,
      wake_time,
      duration_minutes: durationMinutes,
      quality: quality as 'poor' | 'fair' | 'good' | 'excellent',
      interruptions: Number(interruptions),
      deep_sleep_minutes: deep_sleep_minutes ? Number(deep_sleep_minutes) : undefined,
      rem_sleep_minutes: rem_sleep_minutes ? Number(rem_sleep_minutes) : undefined,
      heart_rate_variability: heart_rate_variability ? Number(heart_rate_variability) : undefined,
      notes: notes || undefined,
      created_at: now,
      source: source || 'manual',
    };

    saveSleepRecord(record);

    // Calculate updated sleep score using all of this user's records
    const allRecords = getSleepRecords(userId);
    const score = calculateSleepScore(allRecords, date);

    return NextResponse.json({ record, score });
  } catch (err) {
    console.error('Sleep log error:', err);
    return NextResponse.json({ error: 'Failed to save sleep record' }, { status: 500 });
  }
}
