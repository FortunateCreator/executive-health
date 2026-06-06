export interface HealthSnapshot {
  userId: string;
  timestamp: string;
  sleep: {
    avg_duration_hours: number;
    avg_quality: number;
    total_debt_hours: number;
    consistency_score: number;
    nights_logged: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  nutrition: {
    avg_daily_calories: number;
    meal_log_rate: number;
    protein_target_pct: number;
    quality_trend: 'improving' | 'declining' | 'stable';
    days_with_data: number;
  };
  stress: {
    avg_mood: number;
    avg_stress: number;
    burnout_risk: number;
    check_in_rate: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  healthScore: {
    overall: number;
    risk_category: string;
    days_since_assessment: number;
    recent_change: number;
  };
  summary: {
    overall_risk: 'low' | 'moderate' | 'high' | 'critical';
    module_count: number;
    days_of_data: number;
  };
}

export interface TrendSignal {
  id: string;
  type: 'decline' | 'improvement' | 'warning' | 'correlation' | 'milestone';
  severity: 'info' | 'warning' | 'critical';
  module: 'sleep' | 'nutrition' | 'stress' | 'healthScore' | 'cross_module';
  title: string;
  message: string;
  metric: string;
  current_value: number;
  previous_value: number;
  threshold?: number;
  detected_at: string;
}

export interface Correlation {
  type: string;
  strength: 'weak' | 'moderate' | 'strong';
  description: string;
  modules: string[];
}

export interface TrendAnalysis {
  snapshot: HealthSnapshot;
  signals: TrendSignal[];
  correlations: Correlation[];
  summary: string;
}
