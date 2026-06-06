import type { MealLog, NutritionGoal } from '@executive-health/db';
import { getAllSuggestions, getSuggestionsByMealType, type MealSuggestion } from './suggestions';

export type { MealSuggestion } from './suggestions';
export { getAllSuggestions, getSuggestionsByMealType } from './suggestions';

export interface DailyNutritionSummary {
  date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_sodium_mg: number;
  meal_count: number;
  meals: { meal_type: string; calories: number }[];
}

export interface NutritionAlert {
  type: 'warning' | 'danger' | 'info' | 'success';
  category: string;
  message: string;
  current_value: number;
  target_value: number;
  unit: string;
}

export interface MealPlanSuggestion {
  meal_type: string;
  suggestions: MealSuggestion[];
  total_calories: number;
}

export function calculateDailyNutrition(logs: MealLog[]): DailyNutritionSummary {
  const summary: DailyNutritionSummary = {
    date: logs.length > 0 ? logs[0].date : new Date().toISOString().slice(0, 10),
    total_calories: 0,
    total_protein_g: 0,
    total_carbs_g: 0,
    total_fat_g: 0,
    total_sodium_mg: 0,
    meal_count: logs.length,
    meals: [],
  };

  for (const log of logs) {
    summary.total_calories += log.total_calories;
    summary.total_protein_g += log.total_protein_g;
    summary.total_carbs_g += log.total_carbs_g;
    summary.total_fat_g += log.total_fat_g;
    summary.total_sodium_mg += log.total_sodium_mg;
    summary.meals.push({ meal_type: log.meal_type, calories: log.total_calories });
  }

  // Round values
  summary.total_calories = Math.round(summary.total_calories);
  summary.total_protein_g = Math.round(summary.total_protein_g);
  summary.total_carbs_g = Math.round(summary.total_carbs_g);
  summary.total_fat_g = Math.round(summary.total_fat_g);
  summary.total_sodium_mg = Math.round(summary.total_sodium_mg);

  return summary;
}

export function checkNutritionAlerts(logs: MealLog[], goal: NutritionGoal): NutritionAlert[] {
  const summary = calculateDailyNutrition(logs);
  const alerts: NutritionAlert[] = [];

  const sodiumPct = (summary.total_sodium_mg / goal.sodium_mg) * 100;
  const caloriePct = (summary.total_calories / goal.daily_calories) * 100;
  const proteinPct = (summary.total_protein_g / goal.protein_g) * 100;
  const carbsPct = (summary.total_carbs_g / goal.carbs_g) * 100;
  const fatPct = (summary.total_fat_g / goal.fat_g) * 100;

  // High sodium
  if (sodiumPct > 100) {
    alerts.push({
      type: 'danger',
      category: 'sodium',
      message: 'High sodium intake today — exceeds your daily limit',
      current_value: summary.total_sodium_mg,
      target_value: goal.sodium_mg,
      unit: 'mg',
    });
  } else if (sodiumPct > 75) {
    alerts.push({
      type: 'warning',
      category: 'sodium',
      message: 'Approaching sodium limit — watch your salt intake',
      current_value: summary.total_sodium_mg,
      target_value: goal.sodium_mg,
      unit: 'mg',
    });
  }

  // Low protein
  if (proteinPct < 50 && logs.length > 0) {
    alerts.push({
      type: 'warning',
      category: 'protein',
      message: 'Under protein target for today',
      current_value: summary.total_protein_g,
      target_value: goal.protein_g,
      unit: 'g',
    });
  }

  // Low calories
  if (caloriePct < 50 && logs.length > 0) {
    alerts.push({
      type: 'info',
      category: 'calories',
      message: 'Calorie intake is low today — consider a nutrient-dense meal',
      current_value: summary.total_calories,
      target_value: goal.daily_calories,
      unit: 'kcal',
    });
  }

  // High calories
  if (caloriePct > 120) {
    alerts.push({
      type: 'warning',
      category: 'calories',
      message: 'Calorie intake is above your daily target',
      current_value: summary.total_calories,
      target_value: goal.daily_calories,
      unit: 'kcal',
    });
  }

  // Low carbs
  if (carbsPct < 40 && logs.length > 0) {
    alerts.push({
      type: 'info',
      category: 'carbs',
      message: 'Carb intake is below target — may affect energy levels',
      current_value: summary.total_carbs_g,
      target_value: goal.carbs_g,
      unit: 'g',
    });
  }

  // High fat
  if (fatPct > 120) {
    alerts.push({
      type: 'warning',
      category: 'fat',
      message: 'Fat intake is above your daily target',
      current_value: summary.total_fat_g,
      target_value: goal.fat_g,
      unit: 'g',
    });
  }

  // All good
  if (alerts.length === 0 && logs.length > 0) {
    alerts.push({
      type: 'success',
      category: 'overall',
      message: 'Nutrition is on track today — keep it up!',
      current_value: summary.total_calories,
      target_value: goal.daily_calories,
      unit: 'kcal',
    });
  }

  return alerts;
}

export function generateMealPlanSuggestions(
  preferences: string[],
  restrictions: string[],
): MealPlanSuggestion[] {
  const mealTypes: Array<'breakfast' | 'lunch' | 'dinner' | 'snack'> = [
    'breakfast',
    'lunch',
    'dinner',
    'snack',
  ];

  const mealTypeNames: Record<string, string> = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack',
  };

  return mealTypes.map(mt => {
    let candidates = getSuggestionsByMealType(mt);

    // Filter by cuisine preferences if specified
    if (preferences.length > 0) {
      const prefFiltered = candidates.filter(s => preferences.includes(s.cuisine));
      if (prefFiltered.length > 0) {
        candidates = prefFiltered;
      }
    }

    // Filter out restricted items (simple text matching)
    const filtered = candidates.filter(s => {
      return !restrictions.some(r =>
        s.name.toLowerCase().includes(r.toLowerCase()),
      );
    });

    const suggestions = filtered.slice(0, 3);
    const totalCalories = suggestions.reduce((sum, s) => sum + s.calories, 0);

    return {
      meal_type: mealTypeNames[mt],
      suggestions,
      total_calories: Math.round(totalCalories),
    };
  });
}
