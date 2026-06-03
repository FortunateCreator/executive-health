import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getLatestScore } from '@executive-health/db';

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { message } = await request.json();
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    const latestScore = getLatestScore(userId);
    const msg = message.toLowerCase();

    // Simple rule-based responses
    if (msg.includes('score') || msg.includes('health')) {
      if (latestScore) {
        const s = latestScore.overall_score;
        return NextResponse.json({
          response: `Your current Executive Health Score is **${s}/100** (${latestScore.score_data.risk_category} risk). ${s >= 80 ? 'Great shape! Keep up the healthy habits.' : s >= 60 ? 'Some areas need attention. Check your recommendations on the dashboard.' : 'Your score needs improvement. Review the recommendations and consider lifestyle changes.'}`
        });
      }
      return NextResponse.json({ response: 'You haven\'t completed your health intake yet. Head to the onboarding page to get your score.' });
    }

    if (msg.includes('improve') || msg.includes('recommend')) {
      if (latestScore?.score_data.recommendations.length) {
        const recs = latestScore.score_data.recommendations.slice(0, 3).map((r, i) => `${i+1}. ${r}`).join('\n');
        return NextResponse.json({ response: `Based on your last assessment, here are your top recommendations:\n\n${recs}` });
      }
      return NextResponse.json({ response: 'Complete your health intake first, then I can give you personalized recommendations.' });
    }

    if (msg.includes('hello') || msg.includes('hi')) {
      return NextResponse.json({ response: 'Hello! I\'m your health assistant. You can ask me about your score, recommendations, or general health tips.' });
    }

    // Default response
    return NextResponse.json({
      response: 'I can help you with:\n• Your **health score** — ask "what\'s my score?"\n• **Recommendations** — ask "how can I improve?"\n• General health questions'
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
