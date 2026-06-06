import { NextRequest, NextResponse } from 'next/server';
import { getAllSuggestions } from '@executive-health/nutrition';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cuisine = searchParams.get('cuisine') || undefined;
    const mealType = searchParams.get('meal_type') || undefined;

    const suggestions = getAllSuggestions(cuisine);

    const filtered = mealType
      ? suggestions.filter(s => s.meal_type === mealType)
      : suggestions;

    return NextResponse.json({ suggestions: filtered });
  } catch (err) {
    console.error('Suggestions fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
}
