export type {
  HealthSnapshot,
  TrendSignal,
  Correlation,
  TrendAnalysis,
} from './types';

export {
  buildHealthSnapshot,
  computeSleepMetrics,
  computeNutritionMetrics,
  computeStressMetrics,
  computeHealthScoreMetrics,
} from './aggregator';

export {
  detectSignals,
  detectCorrelations,
  buildTrendAnalysis,
} from './patterns';

export {
  buildOrgAnalytics,
} from './org-aggregator';
