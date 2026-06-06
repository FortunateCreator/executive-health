import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getOrgMembers, getOrgMember } from '@executive-health/db';

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

    const members = getOrgMembers(orgId);
    return NextResponse.json(members);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
