import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getUserById, deleteUserData } from '@executive-health/db';

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = getUserById(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const result = deleteUserData(userId);

  return NextResponse.json({
    success: true,
    deleted: result.deleted,
    recordsRemoved: result.removedCount,
    message: 'Your account and all associated data have been permanently deleted.',
  });
}
