import type { HealthSnapshot } from '@executive-health/analytics';

// ── Nudge type ──

export interface Nudge {
  type: 'morning' | 'midday' | 'evening' | 'weekly';
  priority: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  module: string;
  actionUrl?: string;
}

// ── helper ──

function fmt(x: number, decimals = 0): string {
  return x.toFixed(decimals);
}

// ── morning nudge ──

/**
 * Generate a morning nudge based on last night's sleep data, stress levels,
 * and current health state.
 */
export function generateMorningNudge(snapshot: HealthSnapshot): Nudge | null {
  const s = snapshot.sleep;
  const st = snapshot.stress;

  // Priority 1: sleep data available and below target
  if (s.nights_logged > 0 && s.avg_duration_hours < 7.5) {
    const deficit = Math.max(0, 8 - s.avg_duration_hours);
    return {
      type: 'morning',
      priority: 'high',
      title: 'Sleep Below Target',
      message: `You slept ${fmt(s.avg_duration_hours, 1)}h last night — ${fmt(deficit, 1)}h below your target. Try winding down 30 min earlier tonight.`,
      module: 'sleep',
      actionUrl: '/sleep',
    };
  }

  // Priority 2: yesterday's stress was high
  if (st.avg_stress > 65 && st.check_in_rate > 0) {
    return {
      type: 'morning',
      priority: 'medium',
      title: 'Start Calm',
      message: 'Start today with a 5-minute breathing exercise to set a calm tone.',
      module: 'stress',
      actionUrl: '/stress',
    };
  }

  // Priority 3: no sleep data at all
  if (s.nights_logged === 0) {
    return {
      type: 'morning',
      priority: 'medium',
      title: 'How Did You Sleep?',
      message: 'Good morning! How did you sleep last night? Log it to track your patterns.',
      module: 'sleep',
      actionUrl: '/sleep',
    };
  }

  // Good sleep — positive nudge
  if (s.avg_duration_hours >= 7.5 && s.nights_logged > 0) {
    return {
      type: 'morning',
      priority: 'low',
      title: 'Great Sleep Last Night',
      message: `You slept ${fmt(s.avg_duration_hours, 1)}h last night — right on target. Keep up the great routine!`,
      module: 'sleep',
      actionUrl: '/sleep',
    };
  }

  return null;
}

// ── midday nudge ──

/**
 * Generate a midday nudge focused on nutrition logging, sleep debt management,
 * and mood improvement suggestions.
 */
export function generateMiddayNudge(snapshot: HealthSnapshot): Nudge | null {
  const s = snapshot.sleep;
  const n = snapshot.nutrition;
  const st = snapshot.stress;

  // Priority 1: no meal logged today
  if (n.meal_log_rate < 50 || n.days_with_data === 0) {
    return {
      type: 'midday',
      priority: 'high',
      title: 'Log Your Lunch',
      message: "You haven't logged lunch yet — a quick check-in takes 10 seconds.",
      module: 'nutrition',
      actionUrl: '/nutrition',
    };
  }

  // Priority 2: sleep debt > 5h
  if (s.total_debt_hours > 5) {
    return {
      type: 'midday',
      priority: 'medium',
      title: 'Avoid Afternoon Caffeine',
      message: "Feeling the sleep debt? Avoid caffeine after 2 PM to protect tonight's sleep quality.",
      module: 'sleep',
      actionUrl: '/sleep',
    };
  }

  // Priority 3: yesterday's mood was low
  if (st.avg_mood < 40 && st.check_in_rate > 0) {
    return {
      type: 'midday',
      priority: 'medium',
      title: 'Mood Boost',
      message: 'Take a 5-minute walk outside. Fresh air and movement can shift your mood.',
      module: 'stress',
      actionUrl: '/stress',
    };
  }

  return null;
}

// ── evening nudge ──

/**
 * Generate an evening nudge focused on bedtime routine, stress check-in,
 * and wind-down suggestions.
 */
export function generateEveningNudge(snapshot: HealthSnapshot): Nudge | null {
  const s = snapshot.sleep;
  const st = snapshot.stress;

  // Priority 1: low sleep consistency
  if (s.consistency_score < 50 && s.nights_logged >= 3) {
    return {
      type: 'evening',
      priority: 'high',
      title: 'Bedtime Consistency',
      message: 'Bedtime reminder: aim for the same time as last night. Consistency beats duration.',
      module: 'sleep',
      actionUrl: '/sleep',
    };
  }

  // Priority 2: no stress check-in today
  if (st.check_in_rate < 30 || st.avg_mood === 0) {
    return {
      type: 'evening',
      priority: 'medium',
      title: 'Evening Check-In',
      message: 'Quick evening check-in: how was your stress level today? (1-10)',
      module: 'stress',
      actionUrl: '/stress',
    };
  }

  // Priority 3: general wind-down
  return {
    type: 'evening',
    priority: 'low',
    title: 'Wind-Down Routine',
    message: 'Wind-down routine suggestion: 10 min of reading, no screens 30 min before bed.',
    module: 'sleep',
    actionUrl: '/sleep',
  };
}

// ── weekly nudge ──

/**
 * Generate a weekly summary nudge highlighting averages and notable changes.
 */
export function generateWeeklyNudge(snapshot: HealthSnapshot): Nudge | null {
  const s = snapshot.sleep;
  const n = snapshot.nutrition;
  const st = snapshot.stress;
  const hs = snapshot.healthScore;

  // Determine the most notable insight
  let insight: string;
  if (hs.recent_change <= -5) {
    insight = `Your health score dropped ${Math.abs(hs.recent_change)} points — focus on sleep and stress this week.`;
  } else if (hs.recent_change >= 5) {
    insight = `Your health score improved ${hs.recent_change} points — great momentum!`;
  } else if (s.total_debt_hours > 5) {
    insight = `Sleep debt is your biggest opportunity — aim for consistent 8h nights.`;
  } else if (n.meal_log_rate < 50) {
    insight = `Improving meal tracking this week can unlock personalized nutrition insights.`;
  } else if (st.burnout_risk > 50) {
    insight = `Your burnout risk is elevated — prioritize recovery activities this week.`;
  } else {
    insight = `Consistency across all modules is driving solid results. Keep it up!`;
  }

  return {
    type: 'weekly',
    priority: 'medium',
    title: 'Your Weekly Summary',
    message: `Your weekly summary: sleep avg ${fmt(s.avg_duration_hours, 1)}h, ${n.days_with_data} meals logged, mood avg ${fmt(st.avg_mood / 10, 1)}/10. ${insight}`,
    module: 'cross_module',
    actionUrl: '/dashboard',
  };
}
