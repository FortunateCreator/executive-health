import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getMoodCheckInsByDateRange } from '@executive-health/db';
import { getTrendAnalysis } from '@executive-health/stress';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const today = new Date().toISOString().slice(0, 10);

    // Get mood check-ins for last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const startDate = fourteenDaysAgo.toISOString().slice(0, 10);

    const checkIns = getMoodCheckInsByDateRange(userId, startDate, today);
    const trends = getTrendAnalysis(checkIns);

    return NextResponse.json({ trends });
  } catch (err) {
    console.error('Stress trends fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
  }
}
