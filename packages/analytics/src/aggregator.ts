import {
  getSleepRecordsByDateRange,
  getMealLogsByDateRange,
  getMoodCheckInsByDateRange,
  getScores,
  getLatestScore,
  getLatestBurnoutAssessment,
  getNutritionGoal,
} from '@executive-health/db';
import type { HealthSnapshot } from './types';

const SLEEP_TARGET_MINUTES = 480; // 8 hours

export async function buildHealthSnapshot(
  userId: string,
  days: number = 14,
): Promise<HealthSnapshot> {
  const endDate = new Date().toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

  const [sleepRecords, mealLogs, moodCheckIns, scores, latestScore, burnout, nutritionGoal] =
    await Promise.all([
      getSleepRecordsByDateRange(userId, startDate, endDate),
      getMealLogsByDateRange(userId, startDate, endDate),
      getMoodCheckInsByDateRange(userId, startDate, endDate),
      getScores(userId),
      getLatestScore(userId),
      getLatestBurnoutAssessment(userId),
      getNutritionGoal(userId),
    ]);

  const sleepMetrics = computeSleepMetrics(sleepRecords);
  const nutritionMetrics = computeNutritionMetrics(mealLogs, nutritionGoal, days);
  const stressMetrics = computeStressMetrics(moodCheckIns, burnout, days);
  const healthScoreMetrics = computeHealthScoreMetrics(scores, latestScore);

  const moduleCount = [
    sleepRecords.length > 0,
    mealLogs.length > 0,
    moodCheckIns.length > 0,
    scores.length > 0,
  ].filter(Boolean).length;

  const maxDays = Math.max(
    sleepRecords.length > 0 ? days : 0,
    mealLogs.length > 0 ? days : 0,
    moodCheckIns.length > 0 ? days : 0,
  );

  const latestOverall = latestScore?.overall_score ?? 0;
  const overallRisk: HealthSnapshot['summary']['overall_risk'] =
    latestOverall >= 80
      ? 'low'
      : latestOverall >= 60
        ? 'moderate'
        : latestOverall >= 40
          ? 'high'
          : 'critical';

  return {
    userId,
    timestamp: new Date().toISOString(),
    sleep: sleepMetrics,
    nutrition: nutritionMetrics,
    stress: stressMetrics,
    healthScore: healthScoreMetrics,
    summary: {
      overall_risk: overallRisk,
      module_count: moduleCount,
      days_of_data: maxDays,
    },
  };
}

const QUALITY_MAP: Record<string, number> = {
  poor: 30,
  fair: 55,
  good: 80,
  excellent: 95,
};

export function computeSleepMetrics(
  records: Array<{
    duration_minutes?: number;
    quality?: string;
    bedtime?: string;
  }>,
): HealthSnapshot['sleep'] {
  if (records.length === 0) {
    return {
      avg_duration_hours: 0,
      avg_quality: 0,
      total_debt_hours: 0,
      consistency_score: 0,
      nights_logged: 0,
      trend: 'stable',
    };
  }

  const durations = records.map(r => (r.duration_minutes ?? 0) / 60);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

  const qualities = records.map(r => QUALITY_MAP[r.quality ?? 'fair'] ?? 55);
  const avgQuality = qualities.reduce((a, b) => a + b, 0) / qualities.length;

  // Sleep debt: cumulative deficit vs 8h target (480 min)
  const totalDebtMinutes = records.reduce(
    (sum, r) => sum + Math.max(0, SLEEP_TARGET_MINUTES - (r.duration_minutes ?? 0)),
    0,
  );
  const totalDebt = totalDebtMinutes / 60;

  // Consistency: lower stddev of bedtimes → higher consistency
  const bedtimes = records
    .map(r => {
      if (!r.bedtime) return null;
      const d = new Date(r.bedtime);
      if (isNaN(d.getTime())) return null;
      return d.getUTCHours() * 60 + d.getUTCMinutes();
    })
    .filter((t): t is number => t !== null);

  let consistency = 50;
  if (bedtimes.length >= 3) {
    const mean = bedtimes.reduce((a, b) => a + b, 0) / bedtimes.length;
    const variance =
      bedtimes.reduce((sum, t) => sum + (t - mean) ** 2, 0) / bedtimes.length;
    const stddev = Math.sqrt(variance);
    consistency = Math.max(0, Math.min(100, 100 - stddev));
  }

  // Trend: compare first half vs second half
  const half = Math.max(1, Math.floor(records.length / 2));
  const firstHalf = durations.slice(0, half);
  const secondHalf = durations.slice(half);
  const firstAvg =
    firstHalf.length > 0
      ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
      : 0;
  const secondAvg =
    secondHalf.length > 0
      ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
      : 0;
  const diff = secondAvg - firstAvg;
  const trend: 'improving' | 'declining' | 'stable' =
    diff > 0.5 ? 'improving' : diff < -0.5 ? 'declining' : 'stable';

  return {
    avg_duration_hours: Math.round(avgDuration * 10) / 10,
    avg_quality: Math.round(avgQuality),
    total_debt_hours: Math.round(totalDebt * 10) / 10,
    consistency_score: Math.round(consistency),
    nights_logged: records.length,
    trend,
  };
}

export function computeNutritionMetrics(
  mealLogs: Array<{
    date?: string;
    total_calories?: number;
    total_protein_g?: number;
  }>,
  goal: { protein_g?: number } | undefined,
  days: number,
): HealthSnapshot['nutrition'] {
  if (mealLogs.length === 0) {
    return {
      avg_daily_calories: 0,
      meal_log_rate: 0,
      protein_target_pct: 0,
      quality_trend: 'stable',
      days_with_data: 0,
    };
  }

  const daysWithLogs = new Set(mealLogs.map(l => l.date?.slice(0, 10))).size;
  const mealLogRate = Math.round((daysWithLogs / Math.max(days, 1)) * 100);

  const uniqueDates = [...new Set(mealLogs.map(l => l.date?.slice(0, 10)))].sort();
  const dailyCalories = uniqueDates.map(d => {
    const logs = mealLogs.filter(l => l.date?.slice(0, 10) === d);
    return logs.reduce((sum, l) => sum + (l.total_calories ?? 0), 0);
  });
  const avgCalories =
    dailyCalories.length > 0
      ? dailyCalories.reduce((a, b) => a + b, 0) / dailyCalories.length
      : 0;

  let proteinPct = 0;
  if (goal?.protein_g) {
    const totalProtein = mealLogs.reduce(
      (sum, l) => sum + (l.total_protein_g ?? 0),
      0,
    );
    const avgProtein =
      mealLogs.length > 0 ? totalProtein / mealLogs.length : 0;
    proteinPct = Math.min(100, Math.round((avgProtein / goal.protein_g) * 100));
  }

  // Trend by comparing first half vs second half of daily calorie averages
  const half = Math.max(1, Math.floor(uniqueDates.length / 2));
  const firstHalf = dailyCalories.slice(0, half);
  const secondHalf = dailyCalories.slice(half);
  const firstCals =
    firstHalf.length > 0
      ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
      : 0;
  const secondCals =
    secondHalf.length > 0
      ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
      : 0;
  const calDiff = secondCals - firstCals;
  const quality_trend: 'improving' | 'declining' | 'stable' =
    calDiff > 100 ? 'improving' : calDiff < -100 ? 'declining' : 'stable';

  return {
    avg_daily_calories: Math.round(avgCalories),
    meal_log_rate: mealLogRate,
    protein_target_pct: proteinPct,
    quality_trend,
    days_with_data: daysWithLogs,
  };
}

export function computeStressMetrics(
  moodCheckIns: Array<{
    date?: string;
    mood_score?: number;
    stress_level?: number;
  }>,
  burnout:
    | { exhaustion_score?: number; cynicism_score?: number; efficacy_score?: number }
    | undefined,
  days: number,
): HealthSnapshot['stress'] {
  if (moodCheckIns.length === 0) {
    return {
      avg_mood: 0,
      avg_stress: 0,
      burnout_risk: 0,
      check_in_rate: 0,
      trend: 'stable',
    };
  }

  const moods = moodCheckIns
    .map(m => m.mood_score ?? 5)
    .filter((v): v is number => v !== null);
  const stresses = moodCheckIns
    .map(m => m.stress_level ?? 5)
    .filter((v): v is number => v !== null);

  // Scale 1-10 to 0-100
  const avgMood =
    moods.length > 0
      ? (moods.reduce((a, b) => a + b, 0) / moods.length) * 10
      : 0;
  const avgStress =
    stresses.length > 0
      ? (stresses.reduce((a, b) => a + b, 0) / stresses.length) * 10
      : 0;

  const checkInDays = new Set(moodCheckIns.map(m => m.date?.slice(0, 10))).size;
  const checkInRate = Math.round((checkInDays / Math.max(days, 1)) * 100);

  // Burnout risk: average of exhaustion and cynicism, adjusted for low efficacy
  let burnoutRisk = 0;
  if (burnout) {
    const ex = burnout.exhaustion_score ?? 0;
    const cy = burnout.cynicism_score ?? 0;
    const ef = burnout.efficacy_score ?? 100;
    // Higher exhaustion + cynicism + low efficacy = higher risk (0-100)
    burnoutRisk = Math.round((ex + cy + (100 - ef)) / 3);
  }

  // Trend: compare first half vs second half of mood scores
  const half = Math.max(1, Math.floor(moods.length / 2));
  const firstMoods = moods.slice(0, half);
  const secondMoods = moods.slice(half);
  const firstAvg =
    firstMoods.length > 0
      ? firstMoods.reduce((a, b) => a + b, 0) / firstMoods.length
      : 0;
  const secondAvg =
    secondMoods.length > 0
      ? secondMoods.reduce((a, b) => a + b, 0) / secondMoods.length
      : 0;
  const moodDiff = secondAvg - firstAvg;
  const trend: 'improving' | 'declining' | 'stable' =
    moodDiff > 0.5
      ? 'improving'
      : moodDiff < -0.5
        ? 'declining'
        : 'stable';

  return {
    avg_mood: Math.round(avgMood),
    avg_stress: Math.round(avgStress),
    burnout_risk: burnoutRisk,
    check_in_rate: checkInRate,
    trend,
  };
}

export function computeHealthScoreMetrics(
  scores: Array<{
    overall_score?: number;
    score_data?: { risk_category?: string };
    created_at: string;
  }>,
  latestScore:
    | {
        overall_score?: number;
        score_data?: { risk_category?: string };
        created_at: string;
      }
    | undefined,
): HealthSnapshot['healthScore'] {
  const overall = latestScore?.overall_score ?? 0;
  const risk_category =
    latestScore?.score_data?.risk_category ?? 'unknown';
  const daysSince = latestScore
    ? Math.floor(
        (Date.now() - new Date(latestScore.created_at).getTime()) / 86400000,
      )
    : 999;

  const sorted = [...scores].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  let recentChange = 0;
  if (sorted.length >= 2) {
    const last = sorted[sorted.length - 1].overall_score ?? 0;
    const prev = sorted[sorted.length - 2].overall_score ?? 0;
    recentChange = last - prev;
  }

  return {
    overall,
    risk_category,
    days_since_assessment: daysSince,
    recent_change: recentChange,
  };
}
