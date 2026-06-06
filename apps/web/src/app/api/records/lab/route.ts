import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { saveLabResult, getLabResults } from '@executive-health/db';
import { v4 as uuid } from 'uuid';

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { test_name, test_category, date, values, ordered_by, notes, file_url } = body;

    if (!test_name || !test_category || !date || !values || !Array.isArray(values)) {
      return NextResponse.json({ error: 'test_name, test_category, date, and values (array) are required' }, { status: 400 });
    }

    const validCategories = ['blood', 'urine', 'imaging', 'cardiac', 'other'];
    if (!validCategories.includes(test_category)) {
      return NextResponse.json({ error: `Invalid test_category. Must be one of: ${validCategories.join(', ')}` }, { status: 400 });
    }

    const now = new Date().toISOString();
    const labResult = {
      id: uuid(),
      user_id: userId,
      test_name,
      test_category,
      date,
      values: values.map((v: any) => ({
        parameter: v.parameter || '',
        value: String(v.value || ''),
        unit: v.unit || '',
        reference_range: v.reference_range || '',
        flag: (['normal', 'high', 'low', 'critical'].includes(v.flag) ? v.flag : 'normal') as 'normal' | 'high' | 'low' | 'critical',
      })),
      ordered_by,
      notes,
      file_url,
      created_at: now,
    };

    saveLabResult(labResult);
    return NextResponse.json({ lab_result: labResult }, { status: 201 });
  } catch (err) {
    console.error('Lab result save error:', err);
    return NextResponse.json({ error: 'Failed to save lab result' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const results = getLabResults(userId);
    return NextResponse.json({ lab_results: results });
  } catch (err) {
    console.error('Lab results fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch lab results' }, { status: 500 });
  }
}
