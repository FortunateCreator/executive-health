import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getDepartment } from '@executive-health/db';
import {
  canManageMembers,
  updateDepartment,
  deleteDepartment,
} from '@executive-health/organizations';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; deptId: string }> },
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId, deptId } = await params;

    if (!canManageMembers(orgId, userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = getDepartment(deptId);
    if (!existing) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    const body = await request.json();
    const updated = updateDepartment(deptId, body);
    if (!updated) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; deptId: string }> },
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId, deptId } = await params;

    if (!canManageMembers(orgId, userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = getDepartment(deptId);
    if (!existing) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    deleteDepartment(deptId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
