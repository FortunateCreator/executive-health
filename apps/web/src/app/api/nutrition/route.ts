import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getMealLogs, getMealLogsByDateRange, getNutritionGoal } from '@executive-health/db';
import { calculateDailyNutrition, checkNutritionAlerts } from '@executive-health/nutrition';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Today's date
    const today = new Date().toISOString().slice(0, 10);

    // Today's meal logs
    const todayLogs = getMealLogsByDateRange(userId, today, today);
    const dailyNutrition = calculateDailyNutrition(todayLogs);

    // Alerts
    const goal = getNutritionGoal(userId);
    const alerts = goal ? checkNutritionAlerts(todayLogs, goal) : [];

    // Recent logs (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startDate = sevenDaysAgo.toISOString().slice(0, 10);
    const recentLogs = getMealLogsByDateRange(userId, startDate, today);

    // Weekly summary
    const weeklyTotals = recentLogs.reduce(
      (acc, log) => {
        acc.calories += log.total_calories;
        acc.protein += log.total_protein_g;
        acc.carbs += log.total_carbs_g;
        acc.fat += log.total_fat_g;
        acc.sodium += log.total_sodium_mg;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0 },
    );

    const daysLogged = new Set(recentLogs.map(l => l.date)).size;
    const weeklySummary = {
      avg_daily_calories: daysLogged > 0 ? Math.round(weeklyTotals.calories / daysLogged) : 0,
      avg_daily_protein: daysLogged > 0 ? Math.round(weeklyTotals.protein / daysLogged) : 0,
      avg_daily_carbs: daysLogged > 0 ? Math.round(weeklyTotals.carbs / daysLogged) : 0,
      avg_daily_fat: daysLogged > 0 ? Math.round(weeklyTotals.fat / daysLogged) : 0,
      avg_daily_sodium: daysLogged > 0 ? Math.round(weeklyTotals.sodium / daysLogged) : 0,
      days_logged: daysLogged,
    };

    return NextResponse.json({
      daily_nutrition: dailyNutrition,
      alerts,
      goal,
      recent_logs: todayLogs,
      weekly_summary: weeklySummary,
    });
  } catch (err) {
    console.error('Nutrition fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch nutrition data' }, { status: 500 });
  }
}
