import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getOrgMember } from '@executive-health/db';
import {
  canManageMembers,
  changeMemberRole,
  setMemberDepartment,
  removeMember as removeOrgMemberFn,
  suspendMember,
  activateMember,
} from '@executive-health/organizations';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; userId: string }> },
) {
  try {
    const currentUserId = getUserIdFromRequest(request);
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId, userId } = await params;

    if (!canManageMembers(orgId, currentUserId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const targetMember = getOrgMember(orgId, userId);
    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const body = await request.json();
    const { role, department_id, status } = body;

    if (role) {
      changeMemberRole(orgId, userId, role);
    }

    if (department_id !== undefined) {
      setMemberDepartment(orgId, userId, department_id);
    }

    if (status) {
      if (status === 'suspended') {
        suspendMember(orgId, userId);
      } else if (status === 'active') {
        activateMember(orgId, userId);
      }
    }

    const updated = getOrgMember(orgId, userId);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; userId: string }> },
) {
  try {
    const currentUserId = getUserIdFromRequest(request);
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId, userId } = await params;

    if (!canManageMembers(orgId, currentUserId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const targetMember = getOrgMember(orgId, userId);
    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    removeOrgMemberFn(orgId, userId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
