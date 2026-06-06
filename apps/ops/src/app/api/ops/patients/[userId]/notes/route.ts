import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { getUserIdFromRequest } from '@/lib/auth';
import { getClinicalNotes, saveClinicalNote, getUserById } from '@executive-health/db';
import type { ClinicalNote, NoteType } from '@executive-health/core';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const staffId = getUserIdFromRequest(request);
  if (!staffId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { userId } = await params;
    const notes = getClinicalNotes(userId);
    return NextResponse.json({ notes });
  } catch {
    return NextResponse.json({ error: 'Failed to load notes' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const staffId = getUserIdFromRequest(request);
  if (!staffId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { userId } = await params;
    const body = await request.json();
    const { note_type, subjective, objective, assessment, plan, is_private } = body;

    if (!subjective && !objective && !assessment && !plan) {
      return NextResponse.json({ error: 'At least one note field is required' }, { status: 400 });
    }

    const staff = getUserById(staffId);
    const now = new Date().toISOString();

    const note: ClinicalNote = {
      id: uuid(),
      patient_user_id: userId,
      staff_id: staffId,
      staff_name: staff?.display_name || 'Unknown',
      note_type: (note_type as NoteType) || 'soap',
      subjective: subjective || '',
      objective: objective || '',
      assessment: assessment || '',
      plan: plan || '',
      is_private: is_private || false,
      created_at: now,
      updated_at: now,
    };

    saveClinicalNote(note);
    return NextResponse.json(note, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
