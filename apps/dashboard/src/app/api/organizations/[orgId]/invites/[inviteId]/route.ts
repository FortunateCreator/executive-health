import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { canManageMembers, cancelInvite } from '@executive-health/organizations';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; inviteId: string }> },
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId, inviteId } = await params;

    if (!canManageMembers(orgId, userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    cancelInvite(inviteId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
