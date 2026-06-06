export interface MealSuggestion {
  name: string;
  cuisine: 'nigerian' | 'western' | 'asian' | 'mediterranean' | 'other';
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  sodium_mg: number;
}

export const MEAL_SUGGESTIONS: MealSuggestion[] = [
  // === Breakfast ===
  { name: 'Akara & Pap', cuisine: 'nigerian', meal_type: 'breakfast', calories: 300, protein_g: 12, carbs_g: 42, fat_g: 10, sodium_mg: 350 },
  { name: 'Moi Moi & Bread', cuisine: 'nigerian', meal_type: 'breakfast', calories: 400, protein_g: 18, carbs_g: 55, fat_g: 12, sodium_mg: 480 },
  { name: 'Oatmeal with Tiger Nuts', cuisine: 'nigerian', meal_type: 'breakfast', calories: 350, protein_g: 10, carbs_g: 50, fat_g: 14, sodium_mg: 120 },
  { name: 'Yam & Egg Sauce', cuisine: 'nigerian', meal_type: 'breakfast', calories: 450, protein_g: 20, carbs_g: 58, fat_g: 16, sodium_mg: 520 },

  // === Lunch ===
  { name: 'Jollof Rice & Chicken', cuisine: 'nigerian', meal_type: 'lunch', calories: 650, protein_g: 38, carbs_g: 75, fat_g: 22, sodium_mg: 780 },
  { name: 'Egusi Soup & Pounded Yam', cuisine: 'nigerian', meal_type: 'lunch', calories: 700, protein_g: 32, carbs_g: 82, fat_g: 28, sodium_mg: 850 },
  { name: 'Ofada Rice & Stew', cuisine: 'nigerian', meal_type: 'lunch', calories: 600, protein_g: 28, carbs_g: 70, fat_g: 24, sodium_mg: 720 },
  { name: 'Fried Rice & Plantain', cuisine: 'nigerian', meal_type: 'lunch', calories: 550, protein_g: 22, carbs_g: 68, fat_g: 20, sodium_mg: 650 },

  // === Dinner ===
  { name: 'Grilled Fish & Vegetables', cuisine: 'nigerian', meal_type: 'dinner', calories: 400, protein_g: 35, carbs_g: 20, fat_g: 18, sodium_mg: 400 },
  { name: 'Pepper Soup', cuisine: 'nigerian', meal_type: 'dinner', calories: 250, protein_g: 28, carbs_g: 12, fat_g: 10, sodium_mg: 520 },
  { name: 'Vegetable Stir-fry', cuisine: 'asian', meal_type: 'dinner', calories: 300, protein_g: 12, carbs_g: 35, fat_g: 14, sodium_mg: 480 },
  { name: 'Okro Soup', cuisine: 'nigerian', meal_type: 'dinner', calories: 350, protein_g: 18, carbs_g: 30, fat_g: 16, sodium_mg: 550 },

  // === Snacks ===
  { name: 'Chin Chin', cuisine: 'nigerian', meal_type: 'snack', calories: 200, protein_g: 3, carbs_g: 28, fat_g: 9, sodium_mg: 80 },
  { name: 'Groundnuts', cuisine: 'nigerian', meal_type: 'snack', calories: 250, protein_g: 12, carbs_g: 8, fat_g: 20, sodium_mg: 5 },
  { name: 'Fruit Salad', cuisine: 'western', meal_type: 'snack', calories: 150, protein_g: 2, carbs_g: 35, fat_g: 1, sodium_mg: 10 },
  { name: 'Puff Puff', cuisine: 'nigerian', meal_type: 'snack', calories: 180, protein_g: 4, carbs_g: 28, fat_g: 7, sodium_mg: 90 },
];

export function getSuggestionsByMealType(mealType: string, cuisine?: string): MealSuggestion[] {
  let filtered = MEAL_SUGGESTIONS.filter(s => s.meal_type === mealType);
  if (cuisine) {
    filtered = filtered.filter(s => s.cuisine === cuisine);
  }
  return filtered;
}

export function getAllSuggestions(cuisine?: string): MealSuggestion[] {
  if (cuisine) return MEAL_SUGGESTIONS.filter(s => s.cuisine === cuisine);
  return MEAL_SUGGESTIONS;
}
