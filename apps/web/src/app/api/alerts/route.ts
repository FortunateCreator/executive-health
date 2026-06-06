import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { buildHealthSnapshot, detectSignals, detectCorrelations } from '@executive-health/analytics';
import { generateAlerts } from '@executive-health/ai';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const snapshot = await buildHealthSnapshot(userId);
    const signals = detectSignals(snapshot);
    const correlations = detectCorrelations(snapshot);
    const alerts = generateAlerts(snapshot, signals);

    return NextResponse.json({
      snapshot,
      signals,
      correlations,
      alerts,
    });
  } catch (error) {
    console.error('[alerts] Error:', error);
    return NextResponse.json({ error: 'Failed to generate alerts' }, { status: 500 });
  }
}
