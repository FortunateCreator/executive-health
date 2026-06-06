import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getSleepRecords, getSleepRecordsByDateRange } from '@executive-health/db';
import { calculateSleepScore, generateEnhancedRecommendations, generateContextualTip } from '@executive-health/sleep';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const records = getSleepRecords(userId);

    const today = new Date().toISOString().slice(0, 10);
    const score = records.length > 0 ? calculateSleepScore(records, today) : null;

    // Get weekly records for enhanced recommendations
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startDate = sevenDaysAgo.toISOString().slice(0, 10);
    const weeklyRecords = getSleepRecordsByDateRange(userId, startDate, today);

    // Build recommendations
    let recommendations: ReturnType<typeof generateEnhancedRecommendations> = [];

    if (score && weeklyRecords.length > 0) {
      recommendations = generateEnhancedRecommendations(
        score.duration_score,
        score.consistency_score,
        score.quality_score,
        score.sleep_debt_minutes,
        weeklyRecords.map(r => ({
          date: r.date,
          bedtime: r.bedtime,
          wake_time: r.wake_time,
          quality: r.quality,
          duration_minutes: r.duration_minutes,
        })),
      );
    } else if (records.length === 0) {
      recommendations = [{
        id: 'no-data',
        category: 'duration' as const,
        icon: '📋',
        title: 'Start Tracking Your Sleep',
        tip: 'Log your first night of sleep to get personalized recommendations and track your patterns over time.',
        priority: 'medium' as const,
        action: 'Use the "Log Tonight\'s Sleep" form to record your first entry.',
      }];
    }

    // Contextual tip
    const now = new Date();
    const currentHour = now.getHours();
    const contextualTip = generateContextualTip(currentHour, records.length > 0);

    return NextResponse.json({ recommendations, contextualTip });
  } catch (err) {
    console.error('Sleep recommendations error:', err);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
