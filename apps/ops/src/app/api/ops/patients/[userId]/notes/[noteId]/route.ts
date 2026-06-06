import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getClinicalNotes, saveClinicalNote, deleteClinicalNote } from '@executive-health/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; noteId: string }> },
) {
  const staffId = getUserIdFromRequest(request);
  if (!staffId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { userId, noteId } = await params;
    const notes = getClinicalNotes(userId);
    const note = notes.find(n => n.id === noteId);
    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

    const body = await request.json();
    const updated = {
      ...note,
      subjective: body.subjective ?? note.subjective,
      objective: body.objective ?? note.objective,
      assessment: body.assessment ?? note.assessment,
      plan: body.plan ?? note.plan,
      is_private: body.is_private ?? note.is_private,
      updated_at: new Date().toISOString(),
    };

    saveClinicalNote(updated);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; noteId: string }> },
) {
  const staffId = getUserIdFromRequest(request);
  if (!staffId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { noteId } = await params;
    deleteClinicalNote(noteId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
