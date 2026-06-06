import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getInvites } from '@executive-health/db';
import { canManageMembers, createInvite } from '@executive-health/organizations';
import type { OrgRole } from '@executive-health/core';

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

    if (!canManageMembers(orgId, userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const invites = getInvites(orgId);
    return NextResponse.json(invites);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;

    if (!canManageMembers(orgId, userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { email, role, department_id } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!role || typeof role !== 'string') {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    const invite = createInvite(orgId, email, role as OrgRole, userId, department_id);
    return NextResponse.json(invite, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
