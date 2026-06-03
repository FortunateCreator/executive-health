import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getScores } from '@executive-health/db';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const scores = getScores(userId);
  const sorted = scores.sort((a, b) => a.created_at.localeCompare(b.created_at));

  return NextResponse.json({
    latestScore: sorted[sorted.length - 1]?.score_data || null,
    history: sorted.map(s => ({ date: s.created_at, score: s.overall_score })),
  });
}
