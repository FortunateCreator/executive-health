import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { buildHealthSnapshot, detectSignals, detectCorrelations } from '@executive-health/analytics';
import { generateAlerts, generateChatResponse } from '@executive-health/ai';

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { message, history } = await request.json();
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    // Build context from user data
    const snapshot = await buildHealthSnapshot(userId);
    const signals = detectSignals(snapshot);
    const alerts = generateAlerts(snapshot, signals);

    const response = await generateChatResponse({
      message,
      userId,
      snapshot,
      signals,
      alerts,
      conversationHistory: history,
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.error('[chat] Error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
