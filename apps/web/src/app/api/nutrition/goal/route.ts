import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getNutritionGoal, saveNutritionGoal } from '@executive-health/db';
import { v4 as uuid } from 'uuid';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const goal = getNutritionGoal(userId);
    return NextResponse.json({ goal: goal || null });
  } catch (err) {
    console.error('Nutrition goal fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch goal' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { daily_calories, protein_g, carbs_g, fat_g, sodium_mg, cuisine_preference, dietary_restrictions } = body;

    if (!daily_calories || !protein_g || !carbs_g || !fat_g || !sodium_mg) {
      return NextResponse.json(
        { error: 'Missing required fields: daily_calories, protein_g, carbs_g, fat_g, sodium_mg' },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const existing = getNutritionGoal(userId);

    const goal = {
      id: existing?.id || uuid(),
      user_id: userId,
      daily_calories: Number(daily_calories),
      protein_g: Number(protein_g),
      carbs_g: Number(carbs_g),
      fat_g: Number(fat_g),
      sodium_mg: Number(sodium_mg),
      cuisine_preference: cuisine_preference || ['nigerian'],
      dietary_restrictions: dietary_restrictions || [],
      created_at: existing?.created_at || now,
      updated_at: now,
    };

    saveNutritionGoal(goal);

    return NextResponse.json({ goal });
  } catch (err) {
    console.error('Nutrition goal save error:', err);
    return NextResponse.json({ error: 'Failed to save goal' }, { status: 500 });
  }
}
