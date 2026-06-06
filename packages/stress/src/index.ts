import type { MoodCheckIn } from '@executive-health/db';

export interface BurnoutRisk {
  exhaustion: number;    // 0–100
  cynicism: number;       // 0–100
  efficacy: number;       // 0–100 (higher is better)
  overall: number;        // 0–100
  risk_category: 'low' | 'moderate' | 'high' | 'critical';
  calculated_at: string;
}

export interface Intervention {
  id: string;
  title: string;
  description: string;
  frequency: string;
  priority: 'routine' | 'important' | 'urgent';
  category: 'break' | 'breathing' | 'mindfulness' | 'lifestyle' | 'professional';
}

export interface TrendPoint {
  date: string;
  mood_avg: number;
  stress_avg: number;
  energy_avg: number;
  anxiety_avg: number;
  check_ins: number;
}

export interface TrendAnalysis {
  points: TrendPoint[];
  mood_trend: 'improving' | 'declining' | 'stable';
  stress_trend: 'improving' | 'declining' | 'stable';
  energy_trend: 'improving' | 'declining' | 'stable';
}

/**
 * Calculate burnout risk from recent mood check-ins (last 7–14 days).
 * - exhaustion = avg(stress + anxiety) over last 7 days, normalized to 0–100
 * - cynicism = trend of mood scores declining
 * - efficacy = avg(energy_level) normalized to 0–100
 * - overall = weighted: 40% exhaustion + 30% cynicism + 30% (100 - efficacy)
 */
export function calculateBurnoutRisk(checkIns: MoodCheckIn[]): BurnoutRisk {
  if (checkIns.length === 0) {
    return {
      exhaustion: 0,
      cynicism: 0,
      efficacy: 100,
      overall: 0,
      risk_category: 'low',
      calculated_at: new Date().toISOString(),
    };
  }

  // Sort by date
  const sorted = [...checkIns].sort((a, b) => a.date.localeCompare(b.date));

  // Use all available entries up to 14 days
  const recentEntries = sorted.slice(-14);

  // Split into two halves for trend analysis
  const halfIdx = Math.max(1, Math.floor(recentEntries.length / 2));
  const firstHalf = recentEntries.slice(0, halfIdx);
  const secondHalf = recentEntries.slice(halfIdx);

  // Exhaustion: avg(stress + anxiety) / 2, normalized to 0–100
  const avgStress = recentEntries.reduce((s, c) => s + c.stress_level, 0) / recentEntries.length;
  const avgAnxiety = recentEntries.reduce((s, c) => s + c.anxiety_level, 0) / recentEntries.length;
  const exhaustion = Math.round(((avgStress + avgAnxiety) / 2) * 10); // scale 1-10 → 0-100

  // Efficacy: avg(energy_level) normalized to 0–100 (higher energy = higher efficacy)
  const avgEnergy = recentEntries.reduce((s, c) => s + c.energy_level, 0) / recentEntries.length;
  const efficacy = Math.round(avgEnergy * 10); // scale 1-10 → 0-100

  // Cynicism: trend of declining mood scores
  const firstMood = firstHalf.reduce((s, c) => s + c.mood_score, 0) / firstHalf.length;
  const secondMood = secondHalf.reduce((s, c) => s + c.mood_score, 0) / secondHalf.length;
  const moodDecline = firstMood - secondMood; // positive = declining mood
  // Normalize: a 3-point decline on 1-10 scale = very cynical (100)
  const cynicism = Math.min(100, Math.max(0, Math.round((moodDecline / 3) * 100)));

  // Overall: 40% exhaustion + 30% cynicism + 30% (100 - efficacy)
  const overall = Math.round(
    exhaustion * 0.4 + cynicism * 0.3 + (100 - efficacy) * 0.3,
  );

  // Risk category
  let risk_category: BurnoutRisk['risk_category'];
  if (overall < 30) risk_category = 'low';
  else if (overall <= 50) risk_category = 'moderate';
  else if (overall <= 75) risk_category = 'high';
  else risk_category = 'critical';

  return {
    exhaustion,
    cynicism,
    efficacy,
    overall,
    risk_category,
    calculated_at: new Date().toISOString(),
  };
}

/**
 * Generate micro-break schedules, breathing exercises, based on risk level.
 */
export function generateInterventionPlan(burnoutRisk: BurnoutRisk): Intervention[] {
  const interventions: Intervention[] = [];

  switch (burnoutRisk.risk_category) {
    case 'low':
      interventions.push({
        id: 'maintain-habits',
        title: 'Maintain Current Habits',
        description: 'Continue your current wellness routine. Take a 5-minute break every 2 hours to stretch and reset.',
        frequency: 'Every 2 hours',
        priority: 'routine',
        category: 'break',
      });
      interventions.push({
        id: 'stay-hydrated',
        title: 'Hydration Check',
        description: 'Keep water at your desk and aim for 8 glasses throughout the day.',
        frequency: 'Hourly',
        priority: 'routine',
        category: 'lifestyle',
      });
      break;

    case 'moderate':
      interventions.push({
        id: 'micro-breaks-3',
        title: 'Scheduled Micro-Breaks',
        description: 'Schedule 3 micro-breaks (5 minutes each) throughout the day. Step away from your screen and do light stretching.',
        frequency: '3x per day',
        priority: 'important',
        category: 'break',
      });
      interventions.push({
        id: 'box-breathing',
        title: 'Box Breathing (4-4-4-4)',
        description: 'Practice box breathing twice daily: inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat for 5 cycles.',
        frequency: '2x per day',
        priority: 'important',
        category: 'breathing',
      });
      interventions.push({
        id: 'walk-break',
        title: 'Midday Walk',
        description: 'Take a 15-minute walk during lunch to reset your mind and get natural light.',
        frequency: '1x per day',
        priority: 'important',
        category: 'lifestyle',
      });
      break;

    case 'high':
      interventions.push({
        id: 'mental-health-day',
        title: 'Take a Mental Health Day',
        description: 'Plan a day off this week dedicated to rest and recovery. No emails, no meetings.',
        frequency: 'This week',
        priority: 'urgent',
        category: 'lifestyle',
      });
      interventions.push({
        id: 'mindfulness-am-pm',
        title: 'AM/PM Mindfulness Sessions',
        description: '10-minute mindfulness sessions in the morning and evening. Use guided meditation or quiet reflection.',
        frequency: '2x per day',
        priority: 'urgent',
        category: 'mindfulness',
      });
      interventions.push({
        id: 'reduce-meetings',
        title: 'Reduce Meetings by 20%',
        description: 'Audit your calendar and decline or delegate non-essential meetings. Protect at least 2 hours of focus time daily.',
        frequency: 'Ongoing',
        priority: 'urgent',
        category: 'lifestyle',
      });
      break;

    case 'critical':
      interventions.push({
        id: 'consult-professional',
        title: 'URGENT: Consult a Mental Health Professional',
        description: 'Your burnout indicators are at critical levels. Please speak with a therapist, counselor, or doctor as soon as possible.',
        frequency: 'Immediate',
        priority: 'urgent',
        category: 'professional',
      });
      interventions.push({
        id: 'workload-reduction',
        title: 'Immediate Workload Reduction',
        description: 'Request a reduced workload immediately. Speak with your manager about delegating projects and extending deadlines.',
        frequency: 'Immediate',
        priority: 'urgent',
        category: 'lifestyle',
      });
      interventions.push({
        id: 'daily-mindfulness',
        title: 'Daily Guided Meditation',
        description: 'Commit to 15-minute guided meditation sessions daily. Use apps like Headspace or Calm for structure.',
        frequency: '1x per day',
        priority: 'urgent',
        category: 'mindfulness',
      });
      break;
  }

  return interventions;
}

/**
 * Generate 7-day trend data for charting.
 */
export function getTrendAnalysis(checkIns: MoodCheckIn[]): TrendAnalysis {
  if (checkIns.length === 0) {
    return {
      points: [],
      mood_trend: 'stable',
      stress_trend: 'stable',
      energy_trend: 'stable',
    };
  }

  const sorted = [...checkIns].sort((a, b) => a.date.localeCompare(b.date));

  // Group by date
  const byDate = new Map<string, MoodCheckIn[]>();
  for (const c of sorted) {
    if (!byDate.has(c.date)) byDate.set(c.date, []);
    byDate.get(c.date)!.push(c);
  }

  // Get last 7 days
  const today = new Date();
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const points: TrendPoint[] = dates.map(date => {
    const dayEntries = byDate.get(date) || [];
    if (dayEntries.length === 0) {
      return { date, mood_avg: 0, stress_avg: 0, energy_avg: 0, anxiety_avg: 0, check_ins: 0 };
    }
    return {
      date,
      mood_avg: Math.round((dayEntries.reduce((s, c) => s + c.mood_score, 0) / dayEntries.length) * 10) / 10,
      stress_avg: Math.round((dayEntries.reduce((s, c) => s + c.stress_level, 0) / dayEntries.length) * 10) / 10,
      energy_avg: Math.round((dayEntries.reduce((s, c) => s + c.energy_level, 0) / dayEntries.length) * 10) / 10,
      anxiety_avg: Math.round((dayEntries.reduce((s, c) => s + c.anxiety_level, 0) / dayEntries.length) * 10) / 10,
      check_ins: dayEntries.length,
    };
  });

  // Determine trends by comparing first 3 days vs last 3 days with data
  const withData = points.filter(p => p.check_ins > 0);
  if (withData.length < 4) {
    return {
      points,
      mood_trend: 'stable',
      stress_trend: 'stable',
      energy_trend: 'stable',
    };
  }

  const firstHalf = withData.slice(0, Math.floor(withData.length / 2));
  const secondHalf = withData.slice(Math.floor(withData.length / 2));

  const getTrend = (field: 'mood_avg' | 'stress_avg' | 'energy_avg'): 'improving' | 'declining' | 'stable' => {
    const first = firstHalf.reduce((s, p) => s + p[field], 0) / firstHalf.length;
    const second = secondHalf.reduce((s, p) => s + p[field], 0) / secondHalf.length;
    const diff = second - first;
    if (field === 'stress_avg') {
      // For stress, lower is better (improving)
      if (diff < -0.5) return 'improving';
      if (diff > 0.5) return 'declining';
    } else {
      // For mood and energy, higher is better (improving)
      if (diff > 0.5) return 'improving';
      if (diff < -0.5) return 'declining';
    }
    return 'stable';
  };

  return {
    points,
    mood_trend: getTrend('mood_avg'),
    stress_trend: getTrend('stress_avg'),
    energy_trend: getTrend('energy_avg'),
  };
}
