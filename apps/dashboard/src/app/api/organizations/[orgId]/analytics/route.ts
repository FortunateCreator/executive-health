import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getOrgMember } from '@executive-health/db';
import { buildOrgAnalytics } from '@executive-health/analytics';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;

    const member = getOrgMember(orgId, userId);
    if (!member || member.status !== 'active') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30', 10);

    const analytics = buildOrgAnalytics(orgId, days);
    return NextResponse.json(analytics);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
