import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getLabResults, getMedicalRecords, getHealthTimeline } from '@executive-health/db';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const lab_results = getLabResults(userId);
    const medical_records = getMedicalRecords(userId);
    const timeline = getHealthTimeline(userId);

    return NextResponse.json({ lab_results, medical_records, timeline });
  } catch (err) {
    console.error('Records fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}
