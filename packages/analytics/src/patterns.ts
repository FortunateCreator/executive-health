import type { HealthSnapshot, TrendSignal, Correlation } from './types';

export function detectSignals(snapshot: HealthSnapshot): TrendSignal[] {
  const signals: TrendSignal[] = [];
  const now = new Date().toISOString();
  let id = 0;

  // --- Sleep signals ---

  // Sleep debt warning
  if (snapshot.sleep.total_debt_hours >= 10) {
    signals.push({
      id: `sig-${id++}`,
      type: 'warning',
      severity: 'critical',
      module: 'sleep',
      title: 'Critical Sleep Debt',
      message: `You have ${snapshot.sleep.total_debt_hours}h of sleep debt. This significantly impacts cognitive function and metabolic health.`,
      metric: 'total_debt_hours',
      current_value: snapshot.sleep.total_debt_hours,
      previous_value: 0,
      threshold: 10,
      detected_at: now,
    });
  } else if (snapshot.sleep.total_debt_hours >= 5) {
    signals.push({
      id: `sig-${id++}`,
      type: 'warning',
      severity: 'warning',
      module: 'sleep',
      title: 'Sleep Debt Accumulating',
      message: `Sleep debt is at ${snapshot.sleep.total_debt_hours}h. Prioritize recovery sleep this week.`,
      metric: 'total_debt_hours',
      current_value: snapshot.sleep.total_debt_hours,
      previous_value: 0,
      threshold: 5,
      detected_at: now,
    });
  }

  // Sleep duration declining
  if (
    snapshot.sleep.trend === 'declining' &&
    snapshot.sleep.avg_duration_hours < 6
  ) {
    signals.push({
      id: `sig-${id++}`,
      type: 'decline',
      severity: 'warning',
      module: 'sleep',
      title: 'Sleep Duration Declining',
      message: `Your average sleep duration dropped to ${snapshot.sleep.avg_duration_hours}h and is trending down.`,
      metric: 'avg_duration_hours',
      current_value: snapshot.sleep.avg_duration_hours,
      previous_value: 7,
      threshold: 6,
      detected_at: now,
    });
  }

  // Sleep consistency warning
  if (
    snapshot.sleep.consistency_score < 40 &&
    snapshot.sleep.nights_logged >= 3
  ) {
    signals.push({
      id: `sig-${id++}`,
      type: 'warning',
      severity: 'info',
      module: 'sleep',
      title: 'Inconsistent Bedtimes',
      message: `Your sleep consistency is low (${snapshot.sleep.consistency_score}/100). Irregular bedtimes reduce sleep quality.`,
      metric: 'consistency_score',
      current_value: snapshot.sleep.consistency_score,
      previous_value: 70,
      threshold: 40,
      detected_at: now,
    });
  }

  // --- Nutrition signals ---

  // Nutrition logging dropped
  if (
    snapshot.nutrition.meal_log_rate < 50 &&
    snapshot.nutrition.days_with_data > 0
  ) {
    signals.push({
      id: `sig-${id++}`,
      type: 'decline',
      severity: 'info',
      module: 'nutrition',
      title: 'Nutrition Logging Dropped',
      message: `You logged meals on only ${snapshot.nutrition.meal_log_rate}% of days. Consistent tracking leads to better outcomes.`,
      metric: 'meal_log_rate',
      current_value: snapshot.nutrition.meal_log_rate,
      previous_value: 100,
      threshold: 50,
      detected_at: now,
    });
  }

  // Low protein relative to target
  if (
    snapshot.nutrition.protein_target_pct > 0 &&
    snapshot.nutrition.protein_target_pct < 60
  ) {
    signals.push({
      id: `sig-${id++}`,
      type: 'warning',
      severity: 'warning',
      module: 'nutrition',
      title: 'Protein Below Target',
      message: `You're hitting only ${snapshot.nutrition.protein_target_pct}% of your daily protein goal. Protein is essential for recovery and metabolic health.`,
      metric: 'protein_target_pct',
      current_value: snapshot.nutrition.protein_target_pct,
      previous_value: 100,
      threshold: 60,
      detected_at: now,
    });
  }

  // --- Stress signals ---

  // High burnout risk
  if (snapshot.stress.burnout_risk >= 70) {
    signals.push({
      id: `sig-${id++}`,
      type: 'warning',
      severity: 'critical',
      module: 'stress',
      title: 'High Burnout Risk',
      message: `Your burnout risk score is ${snapshot.stress.burnout_risk}/100. Take immediate steps to reduce stress and prioritize recovery.`,
      metric: 'burnout_risk',
      current_value: snapshot.stress.burnout_risk,
      previous_value: 0,
      threshold: 70,
      detected_at: now,
    });
  } else if (snapshot.stress.burnout_risk >= 50) {
    signals.push({
      id: `sig-${id++}`,
      type: 'warning',
      severity: 'warning',
      module: 'stress',
      title: 'Moderate Burnout Risk',
      message: `Burnout risk is ${snapshot.stress.burnout_risk}/100. Monitor your stress levels and ensure adequate recovery time.`,
      metric: 'burnout_risk',
      current_value: snapshot.stress.burnout_risk,
      previous_value: 0,
      threshold: 50,
      detected_at: now,
    });
  }

  // High average stress
  if (snapshot.stress.avg_stress > 70 && snapshot.stress.check_in_rate > 0) {
    signals.push({
      id: `sig-${id++}`,
      type: 'warning',
      severity: 'warning',
      module: 'stress',
      title: 'Chronically High Stress',
      message: `Your average stress level is ${snapshot.stress.avg_stress}/100. Consider adding stress management practices to your daily routine.`,
      metric: 'avg_stress',
      current_value: snapshot.stress.avg_stress,
      previous_value: 0,
      threshold: 70,
      detected_at: now,
    });
  }

  // Mood improvement
  if (snapshot.stress.trend === 'improving' && snapshot.stress.avg_mood > 0) {
    signals.push({
      id: `sig-${id++}`,
      type: 'improvement',
      severity: 'info',
      module: 'stress',
      title: 'Mood Trending Up',
      message: `Your mood is improving over the last ${snapshot.stress.check_in_rate > 0 ? 'period' : 'check-ins'}. Keep doing what's working!`,
      metric: 'avg_mood',
      current_value: snapshot.stress.avg_mood,
      previous_value: 0,
      detected_at: now,
    });
  }

  // --- HealthScore signals ---

  // Health score decline
  if (snapshot.healthScore.recent_change <= -10) {
    signals.push({
      id: `sig-${id++}`,
      type: 'decline',
      severity: 'warning',
      module: 'healthScore',
      title: 'Health Score Declining',
      message: `Your health score dropped ${Math.abs(snapshot.healthScore.recent_change)} points since your last assessment. Review your recommendations.`,
      metric: 'recent_change',
      current_value: snapshot.healthScore.recent_change,
      previous_value: 0,
      threshold: -10,
      detected_at: now,
    });
  }

  // Health score improvement
  if (snapshot.healthScore.recent_change >= 5) {
    signals.push({
      id: `sig-${id++}`,
      type: 'milestone',
      severity: 'info',
      module: 'healthScore',
      title: 'Health Score Improving',
      message: `Your health score improved ${snapshot.healthScore.recent_change} points! Keep up the great work.`,
      metric: 'recent_change',
      current_value: snapshot.healthScore.recent_change,
      previous_value: 0,
      threshold: 5,
      detected_at: now,
    });
  }

  // Stale health score
  if (snapshot.healthScore.days_since_assessment > 30) {
    signals.push({
      id: `sig-${id++}`,
      type: 'warning',
      severity: 'warning',
      module: 'healthScore',
      title: 'Health Score Outdated',
      message: `Your last health assessment was ${snapshot.healthScore.days_since_assessment} days ago. Update it to get accurate recommendations.`,
      metric: 'days_since_assessment',
      current_value: snapshot.healthScore.days_since_assessment,
      previous_value: 0,
      threshold: 30,
      detected_at: now,
    });
  }

  // --- Cross-module signals ---

  // Sleep-stress feedback loop
  if (
    snapshot.sleep.avg_duration_hours < 6 &&
    snapshot.stress.avg_stress > 60
  ) {
    signals.push({
      id: `sig-${id++}`,
      type: 'correlation',
      severity: 'warning',
      module: 'cross_module',
      title: 'Sleep-Stress Feedback Loop',
      message: `Poor sleep (${snapshot.sleep.avg_duration_hours}h avg) combined with high stress (${snapshot.stress.avg_stress}/100) creates a feedback loop. Improving either will benefit both.`,
      metric: 'avg_duration_hours',
      current_value: snapshot.sleep.avg_duration_hours,
      previous_value: 7,
      threshold: 6,
      detected_at: now,
    });
  }

  // Nutrition-mood connection
  if (
    snapshot.nutrition.meal_log_rate < 40 &&
    snapshot.stress.avg_mood < 50
  ) {
    signals.push({
      id: `sig-${id++}`,
      type: 'correlation',
      severity: 'info',
      module: 'cross_module',
      title: 'Nutrition-Mood Connection',
      message: `Low nutrition tracking (${snapshot.nutrition.meal_log_rate}%) and low mood (${snapshot.stress.avg_mood}/100) often go together. A small dietary win can lift both.`,
      metric: 'meal_log_rate',
      current_value: snapshot.nutrition.meal_log_rate,
      previous_value: 100,
      threshold: 40,
      detected_at: now,
    });
  }

  // Low sleep + declining health score
  if (
    snapshot.sleep.avg_duration_hours < 6 &&
    snapshot.healthScore.recent_change < -5
  ) {
    signals.push({
      id: `sig-${id++}`,
      type: 'correlation',
      severity: 'warning',
      module: 'cross_module',
      title: 'Sleep Deficit Impacting Health',
      message: `Low sleep (${snapshot.sleep.avg_duration_hours}h) combined with a declining health score suggests insufficient recovery is affecting your overall health markers.`,
      metric: 'avg_duration_hours',
      current_value: snapshot.sleep.avg_duration_hours,
      previous_value: 7,
      threshold: 6,
      detected_at: now,
    });
  }

  return signals;
}

export function detectCorrelations(snapshot: HealthSnapshot): Correlation[] {
  const correlations: Correlation[] = [];

  // Sleep-Stress correlation
  if (
    snapshot.sleep.avg_duration_hours > 0 &&
    snapshot.stress.avg_stress > 0
  ) {
    correlations.push({
      type: 'sleep_stress',
      strength:
        snapshot.sleep.avg_duration_hours < 6 &&
        snapshot.stress.avg_stress > 50
          ? 'strong'
          : 'moderate',
      description:
        'Sleep quality and stress levels are closely linked. Improving sleep duration typically reduces perceived stress.',
      modules: ['sleep', 'stress'],
    });
  }

  // Nutrition-Mood correlation
  if (
    snapshot.nutrition.days_with_data > 0 &&
    snapshot.stress.avg_mood > 0
  ) {
    correlations.push({
      type: 'nutrition_mood',
      strength: 'moderate',
      description:
        'Dietary patterns influence mood and energy levels. Consistent meal timing can stabilize energy throughout the day.',
      modules: ['nutrition', 'stress'],
    });
  }

  // Sleep-HealthScore correlation
  if (
    snapshot.sleep.avg_duration_hours > 0 &&
    snapshot.healthScore.overall > 0
  ) {
    correlations.push({
      type: 'sleep_health_score',
      strength:
        snapshot.sleep.avg_duration_hours >= 7 ? 'strong' : 'moderate',
      description:
        'Adequate sleep (7+ hours) is strongly correlated with better cardiovascular and metabolic health scores.',
      modules: ['sleep', 'healthScore'],
    });
  }

  // Nutrition-HealthScore correlation
  if (
    snapshot.nutrition.days_with_data > 0 &&
    snapshot.healthScore.overall > 0
  ) {
    correlations.push({
      type: 'nutrition_health_score',
      strength: 'moderate',
      description:
        'Consistent nutrition tracking correlates with better health outcomes by enabling data-driven dietary adjustments.',
      modules: ['nutrition', 'healthScore'],
    });
  }

  // Stress-HealthScore correlation
  if (
    snapshot.stress.avg_stress > 0 &&
    snapshot.healthScore.overall > 0
  ) {
    correlations.push({
      type: 'stress_health_score',
      strength:
        snapshot.stress.avg_stress > 60 ? 'strong' : 'moderate',
      description:
        'Elevated stress levels often correlate with lower overall health scores through impacts on sleep, eating habits, and recovery.',
      modules: ['stress', 'healthScore'],
    });
  }

  return correlations;
}

export function buildTrendAnalysis(snapshot: HealthSnapshot): {
  snapshot: HealthSnapshot;
  signals: TrendSignal[];
  correlations: Correlation[];
  summary: string;
} {
  const signals = detectSignals(snapshot);
  const correlations = detectCorrelations(snapshot);

  const criticalCount = signals.filter(s => s.severity === 'critical').length;
  const warningCount = signals.filter(s => s.severity === 'warning').length;
  const improvementCount = signals.filter(
    s => s.type === 'improvement' || s.type === 'milestone',
  ).length;

  let summary = '';
  if (snapshot.summary.overall_risk === 'critical') {
    summary = `Critical health state detected with ${criticalCount} critical and ${warningCount} warning signals across ${snapshot.summary.module_count} modules. Immediate intervention recommended.`;
  } else if (snapshot.summary.overall_risk === 'high') {
    summary = `High-risk health state with ${criticalCount} critical and ${warningCount} warning signals. ${improvementCount > 0 ? `Positive trends in ${improvementCount} areas. ` : ''}Priority: address sleep and stress.`;
  } else if (snapshot.summary.overall_risk === 'moderate') {
    summary = `Moderate health state. ${warningCount} areas need attention${improvementCount > 0 ? `, while ${improvementCount} areas show improvement` : ''}.`;
  } else {
    summary = `Low-risk health state across ${snapshot.summary.module_count} modules. ${improvementCount > 0 ? `${improvementCount} areas are improving. ` : ''}Maintain current habits.`;
  }

  return { snapshot, signals, correlations, summary };
}
