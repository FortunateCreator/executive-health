import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getSleepRecords, getSleepRecordsByDateRange } from '@executive-health/db';
import { calculateSleepScore } from '@executive-health/sleep';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const records = getSleepRecords(userId);

    // Calculate score using today's date
    const today = new Date().toISOString().slice(0, 10);
    const score = records.length > 0 ? calculateSleepScore(records, today) : null;

    // Weekly summary: last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startDate = sevenDaysAgo.toISOString().slice(0, 10);

    const weeklyRecords = getSleepRecordsByDateRange(userId, startDate, today);

    const weeklySummary = {
      avg_duration: weeklyRecords.length > 0
        ? Math.round(weeklyRecords.reduce((sum, r) => sum + r.duration_minutes, 0) / weeklyRecords.length)
        : 0,
      avg_quality: weeklyRecords.length > 0
        ? (() => {
            const qualityMap: Record<string, number> = { excellent: 4, good: 3, fair: 2, poor: 1 };
            const avg = weeklyRecords.reduce((sum, r) => sum + (qualityMap[r.quality] || 0), 0) / weeklyRecords.length;
            if (avg >= 3.5) return 'excellent';
            if (avg >= 2.5) return 'good';
            if (avg >= 1.5) return 'fair';
            return 'poor';
          })()
        : 'fair',
      total_debt: weeklyRecords.reduce((debt, r) => debt + Math.max(0, 480 - r.duration_minutes), 0),
      nights_logged: weeklyRecords.length,
    };

    return NextResponse.json({ records, score, weekly_summary: weeklySummary });
  } catch (err) {
    console.error('Sleep fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch sleep data' }, { status: 500 });
  }
}
