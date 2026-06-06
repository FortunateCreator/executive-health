import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { saveMealLog } from '@executive-health/db';
import { v4 as uuid } from 'uuid';

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { date, meal_type, foods, total_calories, total_protein_g, total_carbs_g, total_fat_g, total_sodium_mg, cuisine, notes } = body;

    if (!date || !meal_type || !foods || !foods.length) {
      return NextResponse.json(
        { error: 'Missing required fields: date, meal_type, foods' },
        { status: 400 },
      );
    }

    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!validMealTypes.includes(meal_type)) {
      return NextResponse.json({ error: 'Invalid meal_type' }, { status: 400 });
    }

    const validCuisines = ['nigerian', 'western', 'asian', 'mediterranean', 'other'];
    const validatedCuisine = validCuisines.includes(cuisine) ? cuisine : 'other';

    const now = new Date().toISOString();
    const record = {
      id: uuid(),
      user_id: userId,
      date,
      meal_type,
      foods: foods.map((f: any) => ({
        name: String(f.name || ''),
        portion: String(f.portion || ''),
        calories: Number(f.calories || 0),
        protein_g: Number(f.protein_g || 0),
        carbs_g: Number(f.carbs_g || 0),
        fat_g: Number(f.fat_g || 0),
        sodium_mg: Number(f.sodium_mg || 0),
      })),
      total_calories: Number(total_calories || 0),
      total_protein_g: Number(total_protein_g || 0),
      total_carbs_g: Number(total_carbs_g || 0),
      total_fat_g: Number(total_fat_g || 0),
      total_sodium_mg: Number(total_sodium_mg || 0),
      cuisine: validatedCuisine,
      notes: notes || undefined,
      created_at: now,
    };

    saveMealLog(record);

    return NextResponse.json({ record });
  } catch (err) {
    console.error('Meal log error:', err);
    return NextResponse.json({ error: 'Failed to save meal log' }, { status: 500 });
  }
}
