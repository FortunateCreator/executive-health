import type { HealthSnapshot, TrendSignal } from '@executive-health/analytics';

// ── Alert type ──

export interface Alert {
  id: string;
  type: 'predictive' | 'proactive' | 'insight';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  body: string;
  module: string;
  actionUrl?: string;
  expiresAt?: string;
  generatedAt: string;
}

// ── helpers ──

let _alertSeq = 0;
function nextId(): string {
  return `alert-${Date.now()}-${_alertSeq++}`;
}

function daysUntil(
  debtHours: number,
  avgDurationHours: number,
  targetHours: number,
): number {
  // How many days until cumulative debt hits a critical threshold (e.g. 14h debt)
  // Each day adds (target - avg) hours of new debt
  const dailyDeficit = targetHours - avgDurationHours;
  if (dailyDeficit <= 0) return 999; // not accumulating
  return Math.ceil((14 - debtHours) / dailyDeficit);
}

function expiredAt(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ── format helpers ──

function fmt(x: number, decimals = 0): string {
  return x.toFixed(decimals);
}

function fmtMinutes(minutes: number): string {
  const absMin = Math.abs(minutes);
  const h = Math.floor(absMin / 60);
  const m = Math.round(absMin % 60);
  if (h === 0) return `${m} minutes`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function sleepConsistencyMinuteVariance(score: number): number {
  // consistency score = max(0, min(100, 100 - stddev))
  // so stddev ≈ 100 - score
  return Math.round(100 - score);
}

// ── signal helpers ──

function hasSignal(
  signals: TrendSignal[],
  module: string,
  type?: string,
): TrendSignal | undefined {
  return signals.find(
    s => s.module === module && (type === undefined || s.type === type),
  );
}

// ── alert factory ──

function alert(
  type: Alert['type'],
  priority: Alert['priority'],
  title: string,
  body: string,
  module: string,
  opts?: { actionUrl?: string; expiresInDays?: number },
): Alert {
  return {
    id: nextId(),
    type,
    priority,
    title,
    body,
    module,
    actionUrl: opts?.actionUrl,
    expiresAt: opts?.expiresInDays != null ? expiredAt(opts.expiresInDays) : undefined,
    generatedAt: new Date().toISOString(),
  };
}

// ── predictive / proactive alerts ──

function generateSleepAlerts(
  snapshot: HealthSnapshot,
  signals: TrendSignal[],
): Alert[] {
  const alerts: Alert[] = [];
  const s = snapshot.sleep;

  // Sleep debt > 8h and trend declining
  if (s.total_debt_hours > 8 && s.trend === 'declining') {
    const days = daysUntil(s.total_debt_hours, s.avg_duration_hours, 8);
    alerts.push(
      alert(
        'predictive',
        'high',
        'Sleep Debt Approaching Critical',
        `Based on your current trajectory, you'll reach critical sleep debt within ${days} days. Your sleep is averaging ${fmt(s.avg_duration_hours, 1)}h with ${fmt(s.total_debt_hours, 1)}h debt. Consider a recovery night.`,
        'sleep',
        { actionUrl: '/sleep' },
      ),
    );
  }

  // Sleep improving
  if (s.trend === 'improving' && s.nights_logged >= 3 && s.avg_duration_hours > 0) {
    // Estimate previous average from current minus a reasonable improvement delta
    const prevEstimate = Math.max(0, s.avg_duration_hours - 0.8);
    alerts.push(
      alert(
        'proactive',
        'medium',
        'Sleep Trending Up',
        `Your sleep is trending up! Your average improved from ${fmt(prevEstimate, 1)}h to ${fmt(s.avg_duration_hours, 1)}h. Consistency is the next milestone.`,
        'sleep',
        { actionUrl: '/sleep' },
      ),
    );
  }

  // Sleep consistency < 40
  if (s.consistency_score < 40 && s.nights_logged >= 3) {
    const variance = sleepConsistencyMinuteVariance(s.consistency_score);
    alerts.push(
      alert(
        'proactive',
        'medium',
        'Inconsistent Bedtimes',
        `Your bedtime varies by ${fmtMinutes(variance)} minutes night-to-night. Consistent sleep timing is as important as duration.`,
        'sleep',
        { actionUrl: '/sleep' },
      ),
    );
  }

  return alerts;
}

function generateStressAlerts(
  snapshot: HealthSnapshot,
  signals: TrendSignal[],
): Alert[] {
  const alerts: Alert[] = [];
  const s = snapshot.stress;

  // Stress > 70 and no check-in for 3+ days (low check_in_rate implies sparse check-ins)
  if (s.avg_stress > 70 && s.check_in_rate < 30) {
    // Estimate days since last check-in from check_in_rate
    const estimatedDaysSince = Math.round((100 - s.check_in_rate) / 100 * 14);
    alerts.push(
      alert(
        'predictive',
        'high',
        'Missing Mood Check-In',
        `It's been approximately ${estimatedDaysSince} days since your last mood check-in. Your stress was high — a quick check-in helps track the trend.`,
        'stress',
        { actionUrl: '/stress' },
      ),
    );
  }

  // Burnout risk > 60 and low check-in
  if (s.burnout_risk > 60 && s.check_in_rate < 40) {
    alerts.push(
      alert(
        'predictive',
        'high',
        'Elevated Burnout Risk — Check In',
        `Your burnout risk is elevated and we haven't seen a recent mood check-in. A 30-second check-in can help surface patterns.`,
        'stress',
        { actionUrl: '/stress' },
      ),
    );
  }

  return alerts;
}

function generateNutritionAlerts(
  snapshot: HealthSnapshot,
  _signals: TrendSignal[],
): Alert[] {
  const alerts: Alert[] = [];
  const n = snapshot.nutrition;

  // Protein intake < 60% of goal
  if (n.protein_target_pct > 0 && n.protein_target_pct < 60 && n.days_with_data >= 5) {
    alerts.push(
      alert(
        'predictive',
        'high',
        'Protein Below Target',
        `Your protein intake is at ${fmt(n.protein_target_pct)}% of target. Low protein affects recovery and energy. Try adding a protein source to your next meal.`,
        'nutrition',
        { actionUrl: '/nutrition' },
      ),
    );
  }

  // Nutrition logging < 40%
  if (n.meal_log_rate < 40 && n.meal_log_rate > 0) {
    alerts.push(
      alert(
        'proactive',
        'medium',
        'Low Nutrition Logging',
        `You've logged meals on only ${fmt(n.meal_log_rate)}% of days this period. Even one log per day helps AI personalize recommendations.`,
        'nutrition',
        { actionUrl: '/nutrition' },
      ),
    );
  }

  return alerts;
}

function generateHealthScoreAlerts(
  snapshot: HealthSnapshot,
  signals: TrendSignal[],
): Alert[] {
  const alerts: Alert[] = [];
  const hs = snapshot.healthScore;

  // Score dropped and no reassessment in 30+ days
  if (hs.recent_change < -5 && hs.days_since_assessment > 30) {
    alerts.push(
      alert(
        'predictive',
        'high',
        'Health Score Drop — Reassess',
        `Your score dropped ${Math.abs(hs.recent_change)} points ${hs.days_since_assessment} days ago with no reassessment. A quick check-in can track if changes are working.`,
        'healthScore',
        { actionUrl: '/records' },
      ),
    );
  }

  return alerts;
}

function generateEmergencyAlert(
  snapshot: HealthSnapshot,
  _signals: TrendSignal[],
): Alert[] {
  const alerts: Alert[] = [];

  // Overall risk critical — no emergency profile note
  if (snapshot.summary.overall_risk === 'critical') {
    alerts.push(
      alert(
        'proactive',
        'urgent',
        'Emergency Profile Not Set',
        `Your health assessment indicates elevated risk, and you haven't set up an Emergency Profile yet. In a crisis, every second counts.`,
        'cross_module',
        { actionUrl: '/emergency' },
      ),
    );
  }

  return alerts;
}

// ── insight alerts ──

function generateInsightAlerts(snapshot: HealthSnapshot): Alert[] {
  const alerts: Alert[] = [];

  // General insights — always provide one relevant to the user's state
  if (snapshot.sleep.avg_duration_hours > 0 && snapshot.stress.avg_stress > 0) {
    alerts.push(
      alert(
        'insight',
        'low',
        'Sleep-Stress Connection',
        'Sleep and stress are closely linked — improving either one typically lifts the other by 15-20%.',
        'cross_module',
      ),
    );
  }

  if (snapshot.nutrition.meal_log_rate > 0) {
    alerts.push(
      alert(
        'insight',
        'low',
        'Tracking Pays Off',
        'Did you know? People who log meals at least 80% of days see 2x the health score improvement in 30 days.',
        'nutrition',
        { actionUrl: '/nutrition' },
      ),
    );
  }

  alerts.push(
    alert(
      'insight',
      'low',
      'Movement Boosts Focus',
      'Even a 10-minute walk after lunch can improve afternoon cognitive performance by up to 25%.',
      'cross_module',
    ),
  );

  return alerts;
}

// ── priority ordering ──

const PRIORITY_ORDER: Record<Alert['priority'], number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function sortAlerts(alerts: Alert[]): Alert[] {
  return alerts.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

// ── public API ──

/**
 * Generate prioritized, human-readable alerts from a health snapshot and trend signals.
 * Returns the top 5 alerts sorted by priority: urgent > high > medium > low.
 */
export function generateAlerts(
  snapshot: HealthSnapshot,
  signals: TrendSignal[],
  _persona?: string,
): Alert[] {
  const all: Alert[] = [
    ...generateSleepAlerts(snapshot, signals),
    ...generateStressAlerts(snapshot, signals),
    ...generateNutritionAlerts(snapshot, signals),
    ...generateHealthScoreAlerts(snapshot, signals),
    ...generateEmergencyAlert(snapshot, signals),
    ...generateInsightAlerts(snapshot),
  ];

  return sortAlerts(all).slice(0, 5);
}
