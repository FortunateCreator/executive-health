import type { IntakeFormData, HealthScore, RiskFactor, ScoreBreakdown } from '@executive-health/core';

// ── helpers ──

function bmiScore(bmi: number | undefined): number {
  if (bmi == null) return 70; // neutral fallback
  if (bmi >= 18.5 && bmi <= 24.9) return 90;
  if (bmi >= 25 && bmi <= 29.9) return 70;
  if (bmi >= 30 && bmi <= 34.9) return 50;
  return 30; // 35+
}

function computeBMI(data: IntakeFormData): number | undefined {
  if (data.bmi != null) return data.bmi;
  if (data.height_cm != null && data.weight_kg != null) {
    const h = data.height_cm / 100;
    return Math.round((data.weight_kg / (h * h)) * 10) / 10;
  }
  return undefined;
}

function systolicScore(sys: number | undefined): number {
  if (sys == null) return 70;
  if (sys < 120) return 90;
  if (sys >= 120 && sys < 130) return 75;
  if (sys >= 130 && sys < 140) return 55;
  return 30;
}

function diastolicScore(dia: number | undefined): number {
  if (dia == null) return 70;
  if (dia < 80) return 90;
  if (dia >= 80 && dia < 90) return 70;
  return 40;
}

function activityScore(level: IntakeFormData['activity_level']): number {
  const map: Record<string, number> = {
    sedentary: 50, light: 65, moderate: 80, active: 90, very_active: 95,
  };
  return map[level] ?? 65;
}

function smokingScore(status: IntakeFormData['smoking_status']): number {
  const map: Record<string, number> = { never: 90, former: 70, current: 30 };
  return map[status] ?? 70;
}

function glucoseScore(glucose: number | undefined): number {
  if (glucose == null) return 70;
  if (glucose < 100) return 90;
  if (glucose >= 100 && glucose <= 125) return 60;
  return 30;
}

function cholesterolRatioScore(total: number | undefined, hdl: number | undefined): number {
  if (total == null || hdl == null || hdl === 0) return 65;
  const ratio = total / hdl;
  if (ratio < 3.5) return 90;
  if (ratio >= 3.5 && ratio < 5) return 65;
  return 40;
}

function sleepHoursScore(hours: number): number {
  if (hours >= 7 && hours <= 9) return 95;
  if (hours >= 6 && hours < 7) return 75;
  if (hours >= 5 && hours < 6) return 55;
  if (hours < 5) return 30;
  return 50; // >9
}

function sleepQualityScore(quality: IntakeFormData['sleep_quality']): number {
  const map: Record<string, number> = { poor: 30, fair: 55, good: 80, excellent: 95 };
  return map[quality] ?? 55;
}

function alcoholScore(freq: IntakeFormData['alcohol_frequency']): number {
  const map: Record<string, number> = { never: 95, occasionally: 85, moderately: 60, frequently: 30 };
  return map[freq] ?? 60;
}

function dietScore(quality: IntakeFormData['diet_quality']): number {
  const map: Record<string, number> = { poor: 30, fair: 55, good: 80, excellent: 95 };
  return map[quality] ?? 55;
}

function workHoursScore(hours: number | undefined): number {
  if (hours == null) return 80;
  if (hours < 40) return 90;
  if (hours >= 40 && hours <= 50) return 80;
  if (hours > 50 && hours <= 60) return 60;
  return 40;
}

function socialScore(connections: IntakeFormData['social_connections']): number {
  const map: Record<string, number> = { isolated: 30, limited: 55, moderate: 80, strong: 95 };
  return map[connections ?? 'moderate'] ?? 80;
}

function stressScore(level: IntakeFormData['stress_level']): number {
  const map: Record<string, number> = { low: 90, moderate: 70, high: 45, very_high: 25 };
  return map[level] ?? 70;
}

function sleepQualityMentalScore(quality: IntakeFormData['sleep_quality']): number {
  const map: Record<string, number> = { poor: 35, fair: 60, good: 80, excellent: 90 };
  return map[quality] ?? 60;
}

function workPenalty(hours: number | undefined): number {
  if (hours != null && hours > 60) return 15;
  return 0;
}

// ── sub-scores ──

function cardiovascularScore(data: IntakeFormData): number {
  const bmi = computeBMI(data);
  const b = bmiScore(bmi);
  const sys = systolicScore(data.systolic_bp);
  const dia = diastolicScore(data.diastolic_bp);
  const bp = (sys + dia) / 2;
  const act = activityScore(data.activity_level);
  const smok = smokingScore(data.smoking_status);
  return Math.round(0.25 * b + 0.25 * bp + 0.25 * act + 0.25 * smok);
}

function metabolicScore(data: IntakeFormData): number {
  const bmi = computeBMI(data);
  const b = bmiScore(bmi);
  const glu = glucoseScore(data.fasting_glucose);
  const chol = cholesterolRatioScore(data.cholesterol_total, data.hdl_cholesterol);
  // fourth factor also uses BMI per spec
  return Math.round(0.30 * b + 0.30 * glu + 0.25 * chol + 0.15 * b);
}

function lifestyleScore(data: IntakeFormData): number {
  const sleep = Math.round(
    0.4 * sleepHoursScore(data.sleep_hours) + 0.6 * sleepQualityScore(data.sleep_quality),
  );
  const alc = alcoholScore(data.alcohol_frequency);
  const diet = dietScore(data.diet_quality);
  const work = workHoursScore(data.work_hours_per_week);
  const soc = socialScore(data.social_connections);
  return Math.round(0.25 * sleep + 0.20 * alc + 0.20 * diet + 0.15 * work + 0.20 * soc);
}

function mentalWellbeingScore(data: IntakeFormData): number {
  const stress = stressScore(data.stress_level);
  const sq = sleepQualityMentalScore(data.sleep_quality);
  const soc = socialScore(data.social_connections);
  const penalty = workPenalty(data.work_hours_per_week);
  return Math.round(0.35 * stress + 0.30 * sq + 0.25 * soc - 0.10 * penalty);
}

// ── risk category ──

function riskCategory(overall: number): HealthScore['risk_category'] {
  if (overall >= 80) return 'low';
  if (overall >= 60) return 'moderate';
  if (overall >= 40) return 'high';
  return 'critical';
}

// ── risk factors ──

function buildRiskFactors(data: IntakeFormData, scores: {
  cardio: number; metabolic: number; lifestyle: number; mental: number;
}): RiskFactor[] {
  const factors: RiskFactor[] = [];

  const add = (name: string, severity: RiskFactor['severity'], desc: string) => {
    factors.push({ name, severity, description: desc });
  };

  const bmi = computeBMI(data);
  if (bmi != null && bmi >= 30) {
    add('Elevated BMI', bmi >= 35 ? 'severe' : 'moderate',
      `BMI of ${bmi} falls in the ${bmi >= 35 ? 'severely' : ''}obese range, increasing cardiovascular and metabolic risk.`);
  }

  if (data.smoking_status === 'current') {
    add('Active Smoking', 'severe',
      'Current tobacco use significantly elevates risk for cardiovascular disease, cancer, and respiratory conditions.');
  } else if (data.smoking_status === 'former') {
    add('Smoking History', 'mild',
      'Former smoking history — continued monitoring recommended as risk remains slightly elevated.');
  }

  const sys = data.systolic_bp;
  const dia = data.diastolic_bp;
  if (sys != null && dia != null && (sys >= 130 || dia >= 85)) {
    const sev = sys >= 140 || dia >= 90 ? 'moderate' as const : 'mild' as const;
    add('Elevated Blood Pressure', sev,
      `Blood pressure ${sys}/${dia} mmHg is above optimal range, increasing strain on the cardiovascular system.`);
  }

  if (data.fasting_glucose != null && data.fasting_glucose >= 100) {
    add('Elevated Fasting Glucose',
      data.fasting_glucose >= 126 ? 'severe' : 'moderate',
      `Fasting glucose of ${data.fasting_glucose} mg/dL may indicate ${data.fasting_glucose >= 126 ? 'diabetes' : 'prediabetes'}.`);
  }

  if (data.stress_level === 'high' || data.stress_level === 'very_high') {
    add('High Stress Level', data.stress_level === 'very_high' ? 'severe' : 'moderate',
      `Self-reported ${data.stress_level.replace('_', ' ')} stress — chronic stress impacts cardiovascular health, sleep, and mental wellbeing.`);
  }

  if (data.sleep_hours < 6) {
    add('Insufficient Sleep', data.sleep_hours < 5 ? 'severe' : 'moderate',
      `Averaging only ${data.sleep_hours} hours of sleep per night — inadequate sleep is linked to metabolic dysfunction and cognitive decline.`);
  }

  if (data.alcohol_frequency === 'frequently') {
    add('Frequent Alcohol Consumption', 'severe',
      'Frequent alcohol intake increases risk for liver disease, certain cancers, and cardiovascular issues.');
  } else if (data.alcohol_frequency === 'moderately') {
    add('Moderate Alcohol Consumption', 'mild',
      'Moderate alcohol intake — consider reducing to occasional for optimal health outcomes.');
  }

  if (data.diet_quality === 'poor') {
    add('Poor Diet Quality', 'severe',
      'Diet rated as poor — nutritional deficiencies and excess processed food intake elevate multiple health risks.');
  }

  if (data.activity_level === 'sedentary') {
    add('Sedentary Lifestyle', 'moderate',
      'Lack of regular physical activity is an independent risk factor for cardiovascular disease and metabolic syndrome.');
  }

  // Return top 2-4 by severity
  const severityOrder: Record<string, number> = { severe: 3, moderate: 2, mild: 1 };
  factors.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
  return factors.slice(0, 4);
}

// ── recommendations ──

function buildRecommendations(data: IntakeFormData, scores: {
  cardio: number; metabolic: number; lifestyle: number; mental: number;
}): string[] {
  const recs: string[] = [];

  // Find lowest-scoring categories
  const ranked = [
    { name: 'Cardiovascular', score: scores.cardio },
    { name: 'Metabolic', score: scores.metabolic },
    { name: 'Lifestyle', score: scores.lifestyle },
    { name: 'Mental Wellbeing', score: scores.mental },
  ].sort((a, b) => a.score - b.score);

  const presets: Record<string, string[]> = {
    Cardiovascular: [
      'Engage in 150+ minutes of moderate-intensity aerobic activity weekly (brisk walking, cycling, swimming).',
      'Schedule a comprehensive lipid panel and blood pressure check with your primary care physician.',
      'Reduce sodium intake to <2,300 mg/day and increase potassium-rich foods (bananas, spinach, sweet potatoes).',
    ],
    Metabolic: [
      'Replace refined carbohydrates with whole grains and legumes to improve glycemic control.',
      'Aim for 7-9 hours of quality sleep per night — poor sleep directly impairs glucose metabolism.',
      'Consider intermittent fasting or time-restricted eating after consulting your physician.',
    ],
    Lifestyle: [
      'Track food intake for 2 weeks using a nutrition app to identify patterns and improvement areas.',
      'Reduce alcohol consumption to no more than 1-2 drinks per week.',
      'Establish a consistent sleep schedule — same bedtime and wake time, even on weekends.',
      'Block 30 minutes daily for physical activity, treating it as a non-negotiable appointment.',
    ],
    'Mental Wellbeing': [
      'Practice daily mindfulness meditation (start with 5-10 minutes using an app like Headspace or Calm).',
      'Schedule regular social connection time — weekly calls or in-person meetings with friends/family.',
      'Set firm work boundaries: define a shutdown time and avoid email/messages after hours.',
      'Consider speaking with a licensed therapist or counselor for stress management strategies.',
    ],
  };

  // Pick 1-2 recommendations from each of the 2 lowest categories
  const targeted = ranked.slice(0, 2);
  for (const cat of targeted) {
    const options = presets[cat.name] ?? [];
    // Pick 2 recs, varying by data characteristics
    if (cat.name === 'Cardiovascular' && data.smoking_status === 'current') {
      recs.push('Prioritize smoking cessation — consider nicotine replacement therapy, counseling, or prescription options.');
    }
    for (let i = 0; i < Math.min(2, options.length); i++) {
      const rec = options[i];
      if (!recs.includes(rec)) recs.push(rec);
    }
  }

  // Deduplicate and limit to 4
  return [...new Set(recs)].slice(0, 4);
}

// ── breakdown ──

function buildBreakdown(scores: {
  cardio: number; metabolic: number; lifestyle: number; mental: number; overall: number;
}): ScoreBreakdown[] {
  return [
    { category: 'Cardiovascular', score: scores.cardio, weight: 0.30, details: 'Blood pressure, BMI, activity, and smoking status' },
    { category: 'Metabolic',       score: scores.metabolic, weight: 0.20, details: 'BMI, fasting glucose, cholesterol ratio' },
    { category: 'Lifestyle',       score: scores.lifestyle, weight: 0.25, details: 'Sleep, alcohol, diet, work hours, social connections' },
    { category: 'Mental Wellbeing',score: scores.mental,   weight: 0.25, details: 'Stress, sleep quality, social connections, work penalty' },
  ];
}

// ── public API ──

export function computeHeuristicScore(data: IntakeFormData): HealthScore {
  const cardio = cardiovascularScore(data);
  const metabolic = metabolicScore(data);
  const lifestyle = lifestyleScore(data);
  const mental = mentalWellbeingScore(data);

  const overall = Math.round(
    cardio * 0.30 + metabolic * 0.20 + lifestyle * 0.25 + mental * 0.25,
  );

  const scores = { cardio, metabolic, lifestyle, mental, overall };

  return {
    overall,
    cardiovascular: cardio,
    metabolic,
    lifestyle,
    mental_wellbeing: mental,
    risk_category: riskCategory(overall),
    risk_factors: buildRiskFactors(data, scores),
    recommendations: buildRecommendations(data, scores),
    score_breakdown: buildBreakdown(scores),
    calculated_at: new Date().toISOString(),
  };
}

export default computeHeuristicScore;
