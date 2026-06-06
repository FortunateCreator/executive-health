import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import {
  getUserById, getLatestScore, getScores,
  getSleepRecords, getMoodCheckIns, getMealLogs,
} from '@executive-health/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const staffId = getUserIdFromRequest(request);
  if (!staffId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { userId } = await params;
    const user = getUserById(userId);
    if (!user) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

    const latestScore = getLatestScore(userId);
    const allScores = getScores(userId).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const sleepRecords = getSleepRecords(userId, 30);
    const moodCheckIns = getMoodCheckIns(userId, 30);
    const mealLogs = getMealLogs(userId, 30);

    return NextResponse.json({
      patient: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        created_at: user.created_at,
      },
      healthScore: latestScore ? {
        overall: latestScore.overall_score,
        risk_category: latestScore.score_data?.risk_category ?? 'unknown',
        breakdown: latestScore.score_data,
      } : null,
      scoreHistory: allScores.map(s => ({
        date: s.created_at.slice(0, 10),
        score: s.overall_score,
      })),
      sleepSummary: sleepRecords.length > 0 ? {
        avg_hours: Math.round(sleepRecords.reduce((a, r) => a + (r.duration_minutes ?? 0), 0) / sleepRecords.length / 60 * 10) / 10,
        nights_logged: sleepRecords.length,
        avg_quality: sleepRecords.length > 0
          ? sleepRecords.reduce((a, r) => a + ({ poor: 30, fair: 55, good: 80, excellent: 95 }[r.quality] ?? 55), 0) / sleepRecords.length
          : 0,
      } : null,
      stressSummary: moodCheckIns.length > 0 ? {
        avg_mood: Math.round(moodCheckIns.reduce((a, m) => a + (m.mood_score ?? 5), 0) / moodCheckIns.length * 10),
        avg_stress: Math.round(moodCheckIns.reduce((a, m) => a + (m.stress_level ?? 5), 0) / moodCheckIns.length * 10),
        checkins: moodCheckIns.length,
      } : null,
      nutritionSummary: mealLogs.length > 0 ? {
        avg_calories: Math.round(mealLogs.reduce((a, l) => a + (l.total_calories ?? 0), 0) / mealLogs.length),
        meals_logged: mealLogs.length,
      } : null,
    });
  } catch (err) {
    console.error('Patient detail error:', err);
    return NextResponse.json({ error: 'Failed to load patient data' }, { status: 500 });
  }
}
