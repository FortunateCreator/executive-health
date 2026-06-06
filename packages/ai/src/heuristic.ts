import type { IntakeFormData, HealthScore, RiskFactor, ScoreBreakdown, DetailedRecommendation } from '@executive-health/core';

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
}): DetailedRecommendation[] {
  const recs: DetailedRecommendation[] = [];

  // Find lowest-scoring categories
  const ranked = [
    { name: 'Cardiovascular', score: scores.cardio },
    { name: 'Metabolic', score: scores.metabolic },
    { name: 'Lifestyle', score: scores.lifestyle },
    { name: 'Mental Wellbeing', score: scores.mental },
  ].sort((a, b) => a.score - b.score);

  const presets: Record<string, DetailedRecommendation[]> = {
    Cardiovascular: [
      {
        heading: 'Cardiovascular Risk Profiling & Mitigation',
        detail: 'Regular moderate-intensity aerobic exercise induces favorable hemodynamic changes, including reduced systemic vascular resistance, improved left ventricular compliance, and enhanced endothelial nitric oxide bioavailability. These physiological adaptations collectively lower both systolic and diastolic blood pressure while improving myocardial oxygen supply-demand balance. Based on the American Heart Association/American College of Cardiology guidelines, accumulating ≥150 minutes of moderate-intensity aerobic activity per week is associated with a 30-40% relative risk reduction in major adverse cardiovascular events. Please consult your physician before implementing any changes.',
        action: 'Schedule three 30-minute sessions of brisk walking or stationary cycling this week, maintaining a heart rate between 64-76% of your age-predicted maximum (calculated as 220 minus your age) to achieve the target moderate-intensity zone.',
        category: 'cardiovascular',
      },
      {
        heading: 'Lipid Profile Surveillance & Blood Pressure Optimization',
        detail: 'Hypertension and dyslipidemia are often asymptomatic until end-organ damage has occurred, making routine screening a cornerstone of preventive cardiology. Serial measurements of resting blood pressure and a fasting lipid panel (total cholesterol, LDL-C, HDL-C, and triglycerides) provide actionable data for risk stratification using pooled cohort equations as recommended by the ACC/AHA guidelines. Early identification of elevated LDL-C or sustained BP ≥130/80 mmHg allows for timely lifestyle modification or pharmacotherapy initiation. Please consult your physician before implementing any changes.',
        action: 'Schedule a comprehensive fasting lipid panel and standardized office blood pressure measurement with your primary care physician within the next 2 weeks, and request calculation of your 10-year atherosclerotic cardiovascular disease (ASCVD) risk score.',
        category: 'cardiovascular',
      },
      {
        heading: 'Dietary Sodium Restriction & Potassium Augmentation',
        detail: 'Excess dietary sodium increases intravascular volume and raises blood pressure through osmotic fluid retention and increased arterial stiffness, while potassium promotes natriuresis and vasodilation via endothelial hyperpolarization. The DASH-Sodium trial demonstrated that reducing sodium intake to <2,300 mg/day in combination with increased potassium intake yields reductions in systolic BP comparable to single-agent antihypertensive therapy. Most executive diets are disproportionately high in sodium from restaurant meals and processed foods while lacking potassium-rich whole foods. Please consult your physician before implementing any changes.',
        action: 'Limit total sodium intake to <2,300 mg/day by reviewing nutrition labels and reducing restaurant meals, while incorporating potassium-rich sources (bananas, spinach, avocados, sweet potatoes, white beans) into at least two meals daily to target approximately 4,700 mg/day of dietary potassium.',
        category: 'cardiovascular',
      },
    ],
    Metabolic: [
      {
        heading: 'Glycemic Control & Insulin Sensitivity Optimization',
        detail: 'Postprandial glucose excursions and insulin resistance are key drivers of metabolic syndrome and precede the development of type 2 diabetes by years. Complex carbohydrates with a low glycemic index slow gastric emptying and attenuate post-meal glucose spikes, reducing the pancreatic beta-cell workload and improving peripheral insulin sensitivity over time. The American Diabetes Association recommends replacing refined grains with whole-grain alternatives as a first-line dietary intervention for glycemic management. Please consult your physician before implementing any changes.',
        action: 'Replace refined carbohydrates (white rice, white bread, refined pasta) with low-glycemic alternatives including quinoa, steel-cut oats, legumes, and whole-grain bread in at least one meal per day, aiming to keep postprandial glucose excursions below 140 mg/dL if self-monitoring.',
        category: 'metabolic',
      },
      {
        heading: 'Sleep Architecture Optimization for Metabolic Homeostasis',
        detail: 'Sleep restriction leads to decreased glucose tolerance, increased cortisol secretion, and heightened sympathetic nervous system activity — all of which promote insulin resistance independent of dietary factors. Stage N3 (slow-wave) sleep is particularly critical for growth hormone secretion and glycogen replenishment. A consistent 7-9 hour sleep schedule aligning with circadian rhythms optimizes the HPA axis regulation and maintains metabolic flexibility. Please consult your physician before implementing any changes.',
        action: 'Establish a fixed sleep-wake schedule targeting 7.5-8 hours per night, with a consistent bedtime no later than 10:30 PM and an ambient bedroom temperature of 65-68°F to facilitate the core temperature drop necessary for sleep onset and maintenance.',
        category: 'metabolic',
      },
      {
        heading: 'Time-Restricted Feeding & Circadian Metabolic Alignment',
        detail: 'Time-restricted feeding (TRF) aligns caloric intake with the body\'s circadian regulation of glucose metabolism, lipid oxidation, and autophagy. Early TRF protocols (e.g., a 14-hour overnight fast from 7 PM to 9 AM) have been shown to improve insulin sensitivity, reduce circulating triglycerides, and lower blood pressure in patients with prediabetes and metabolic syndrome, independent of caloric restriction. Current evidence from the Cell Metabolism literature suggests these metabolic benefits are mediated by synchronization of peripheral circadian clocks in the liver and pancreas. Please consult your physician before implementing any changes.',
        action: 'Implement a 14-hour overnight fasting window (e.g., finish all caloric intake by 7 PM and delay breakfast until 9 AM) for at least 5 days per week, ensuring adequate hydration with water or unsweetened beverages during the fast.',
        category: 'metabolic',
      },
    ],
    Lifestyle: [
      {
        heading: 'Comprehensive Nutritional Assessment & Macronutrient Optimization',
        detail: 'Objective dietary assessment through structured food logging reveals macronutrient imbalances, micronutrient deficiencies, and hidden caloric surplus that subjective recall consistently underestimates — studies show self-reported caloric intake underestimation of 30-50% in high-performing professionals. Tracking intake for a minimum of 14 days provides sufficient data for a clinical nutrition evaluation and allows for targeted dietary modifications. The Academy of Nutrition and Dietetics recommends a macronutrient distribution of 45-65% carbohydrate, 20-35% fat, and 10-35% protein with emphasis on fiber adequacy (≥38 g/day for men, ≥25 g/day for women). Please consult your physician before implementing any changes.',
        action: 'Use a validated nutrition tracking application (Cronometer, MyFitnessPal, or Lose It) to log all food and beverage intake for 14 consecutive days, prioritizing complete entries with portion sizes to enable a clinical macronutrient and micronutrient analysis.',
        category: 'lifestyle',
      },
      {
        heading: 'Alcohol Intake Reduction & Hepatobiliary Risk Mitigation',
        detail: 'Ethanol metabolism generates acetaldehyde, a hepatotoxic intermediate that impairs hepatic gluconeogenesis, disrupts sleep architecture by suppressing REM sleep, and contributes to elevated liver enzymes (ALT, AST, GGT) even at moderate intake levels defined as 1-2 drinks per day. The National Institute on Alcohol Abuse and Alcoholism (NIAAA) defines low-risk drinking limits as ≤4 drinks per week for men and ≤3 drinks per week for women, with at least 2-3 alcohol-free days per week to allow hepatic recovery. Reducing alcohol intake yields compounding benefits across sleep quality, blood pressure regulation, and metabolic function. Please consult your physician before implementing any changes.',
        action: 'Limit alcohol consumption to no more than 2 standard drinks on any given day with a target of ≤4 drinks per week, ensuring at least 3 consecutive alcohol-free days to enable hepatic clearance of acetaldehyde metabolites and restoration of normal sleep architecture.',
        category: 'lifestyle',
      },
      {
        heading: 'Circadian Rhythm Entrainment & Sleep Hygiene Optimization',
        detail: 'The suprachiasmatic nucleus (SCN) coordinates peripheral circadian clocks throughout the body, and desynchronization — caused by inconsistent sleep-wake timing — disrupts cortisol rhythm, melatonin secretion, and metabolic gene expression. Consistent bedtimes strengthen the circadian phase, improving sleep onset latency, slow-wave sleep duration, and overall sleep efficiency. The American Academy of Sleep Medicine emphasizes a cool, dark, and quiet sleep environment (68°F or below, complete darkness) as essential for optimal melatonin production. Please consult your physician before implementing any changes.',
        action: 'Maintain a consistent bedtime by 10:30 PM and wake time by 6:30 AM (±30 minutes) seven days per week, eliminate all blue-light-emitting devices at least 45 minutes before bed, and keep ambient bedroom temperature at 65-68°F with blackout curtains.',
        category: 'lifestyle',
      },
      {
        heading: 'Structured Physical Activity Prescription for Longevity',
        detail: 'Physical inactivity is the fourth leading risk factor for global mortality, associated with a 20-30% increased risk of all-cause mortality independent of other risk factors. Even short, intermittent bouts of movement improve endothelial function, cerebral blood flow, and insulin-mediated glucose uptake. The WHO physical activity guidelines recommend 150-300 minutes of moderate-intensity or 75-150 minutes of vigorous-intensity aerobic activity weekly, supplemented by resistance training at least 2 days per week. Please consult your physician before implementing any changes.',
        action: 'Dedicate a non-negotiable 30-minute block on your calendar daily for structured physical activity — alternating between moderate-intensity aerobic sessions (brisk walking, cycling, swimming) and resistance training (bodyweight exercises, resistance bands, or gym-based compound lifts targeting all major muscle groups).',
        category: 'lifestyle',
      },
    ],
    'Mental Wellbeing': [
      {
        heading: 'Mindfulness-Based Stress Reduction & HPA Axis Regulation',
        detail: 'Chronic psychosocial stress activates the hypothalamic-pituitary-adrenal (HPA) axis, resulting in sustained cortisol elevation that impairs hippocampal neurogenesis, increases inflammatory cytokine production (IL-6, TNF-α), and accelerates telomere shortening — a cellular marker of biological aging. Randomized controlled trials demonstrate that 8 weeks of daily mindfulness-based stress reduction (MBSR) reduces salivary cortisol levels by 20-30% and improves heart rate variability, a validated measure of autonomic nervous system balance. Please consult your physician before implementing any changes.',
        action: 'Initiate a daily mindfulness practice using a structured protocol (MBSR, Headspace, or Ten Percent Happier), starting with 5 minutes each morning and increasing by 2 minutes per week to reach 15-20 minutes, focusing on breath awareness and body scanning techniques.',
        category: 'mental_wellbeing',
      },
      {
        heading: 'Social Connectedness & Psychoneuroimmunological Resilience',
        detail: 'Social isolation triggers a conserved transcriptional response to adversity (CTRA), characterized by upregulation of pro-inflammatory gene expression and downregulation of antiviral responses — a molecular pattern associated with increased cardiovascular disease risk and all-cause mortality. Longitudinal cohort data from Brigham Young University shows that low social integration confers a mortality risk comparable to smoking 15 cigarettes per day (OR 1.50, 95% CI 1.35-1.65). Regular meaningful social interaction attenuates this response by modulating oxytocin and vagal tone. Please consult your physician before implementing any changes.',
        action: 'Schedule at least one intentional in-person or video-based social connection per week with a trusted friend or family member lasting ≥30 minutes, and enroll in at least one recurring group activity (professional, recreational, or volunteer-based) within the next 2 weeks.',
        category: 'mental_wellbeing',
      },
      {
        heading: 'Work-Life Boundary Implementation & Cognitive Recovery',
        detail: 'Chronic working hours exceeding 55 hours per week are associated with a 33% increased risk of stroke (Lancet, 2015) and significantly elevated rates of anxiety disorders and burnout syndrome. Sustained cognitive demand without adequate recovery impairs prefrontal cortex function, reduces decision-making quality, and increases amygdala reactivity to negative stimuli. The autonomic nervous system requires periods of parasympathetic dominance — achieved through rest and disengagement from work demands — to restore heart rate variability and metabolic homeostasis. Please consult your physician before implementing any changes.',
        action: 'Establish a firm daily work cessation time no later than 7 PM, after which all work-related electronic communication is prohibited. Communicate this boundary to your team and implement a wind-down routine (e.g., light reading, gentle stretching, or a warm bath) to facilitate transition to parasympathetic-dominant rest.',
        category: 'mental_wellbeing',
      },
      {
        heading: 'Clinical Mental Health Assessment & Evidence-Based Intervention',
        detail: 'Subclinical stress, anxiety, and mood disturbances are prevalent among executives but frequently go unrecognized and untreated, leading to progressive impairment in occupational function and quality of life. Evidence-based treatments including cognitive-behavioral therapy (CBT), acceptance and commitment therapy (ACT), and executive-function-focused coaching have demonstrated strong efficacy for stress reduction in high-performing populations. Routine screening using validated instruments (PHQ-9, GAD-7, or PSS-14) provides objective baseline data to guide treatment selection and monitor therapeutic response. Please consult your physician before implementing any changes.',
        action: 'Complete a validated mental health screening (PHQ-9 for mood, GAD-7 for anxiety) available through your primary care provider or online patient portal, and schedule an introductory consultation with a licensed mental health professional or executive coach specializing in cognitive-behavioral approaches within the next 2 weeks.',
        category: 'mental_wellbeing',
      },
    ],
  };

  // Pick recommendations from lowest-scoring categories
  const targeted = ranked.slice(0, 2);
  for (const cat of targeted) {
    const options = presets[cat.name] ?? [];
    // Add category-specific overrides based on data
    if (cat.name === 'Cardiovascular' && data.smoking_status === 'current') {
      recs.push({
        heading: 'Smoking Cessation & Cardiopulmonary Risk Mitigation',
        detail: 'Tobacco combustion delivers over 7,000 chemical compounds including carbon monoxide — which binds hemoglobin with 200x greater affinity than oxygen — and nicotine, which acutely elevates heart rate and blood pressure via sympathetic activation. Smoking is the single most preventable cause of premature mortality, accounting for 480,000 deaths annually in the United States per the CDC. The USPSTF recommends that clinicians ask all adults about tobacco use and provide FDA-approved pharmacotherapy (nicotine replacement therapy, varenicline, or bupropion) combined with behavioral interventions for those using tobacco. Please consult your physician before implementing any changes.',
        action: 'Schedule a consultation with your physician this week to discuss FDA-approved smoking cessation pharmacotherapy options (nicotine replacement therapy, varenicline/Chantix, or bupropion/Wellbutrin) and identify a local or telehealth tobacco cessation program (e.g., 1-800-QUIT-NOW) to initiate within the next 7 days.',
        category: 'cardiovascular',
      });
    }
    if (cat.name === 'Cardiovascular' && (data.activity_level === 'sedentary' || data.activity_level === 'light')) {
      recs.push({
        heading: 'Graded Exercise Tolerance Initiation Protocol',
        detail: 'Sedentary behavior is associated with a 147% increased risk of cardiovascular events (Archives of Internal Medicine) and contributes to endothelial dysfunction through reduced shear stress-mediated nitric oxide production. The principle of graded exercise prescription involves starting at a low intensity and volume to build tolerance without exceeding the musculoskeletal or cardiovascular system\'s current capacity, minimizing injury risk while maximizing adherence. The ACSM recommends beginning with low-to-moderate intensity activity at 30-40% of heart rate reserve for deconditioned individuals. Please consult your physician before implementing any changes.',
        action: 'Begin with 15-minute daily walks at a conversational pace (Rate of Perceived Exertion 3-4 out of 10) this week, increasing duration by 5 minutes each week until reaching 30 minutes daily, then gradually increase pace toward moderate intensity (RPE 5-6, 64-76% of maximum heart rate).',
        category: 'cardiovascular',
      });
    }
    if (cat.name === 'Mental Wellbeing' && data.work_hours_per_week != null && data.work_hours_per_week > 55) {
      recs.push({
        heading: 'Occupational Overload Reduction & Neuroendocrine Recovery',
        detail: 'Working >55 hours per week is associated with a 33% increased risk of stroke and 13% increased risk of coronary heart disease (Lancet, 2015 meta-analysis of 603,838 individuals). The chronic allostatic load from prolonged work hours elevates catecholamines and cortisol, leading to impaired vagal tone, reduced heart rate variability, and increased risk of burnout syndrome. Deliberate delegation and reduction of non-essential work demands is a necessary structural intervention — not merely a lifestyle preference — for long-term cardiovascular and neurocognitive health. Please consult your physician before implementing any changes.',
        action: 'Perform a time audit of your calendar for the next week to identify and delegate or defer at least 5 hours of non-essential meetings, low-priority tasks, or administrative work to reduce total working hours below 50 per week and restore capacity for recovery.',
        category: 'mental_wellbeing',
      });
    }
    for (let i = 0; i < Math.min(2, options.length); i++) {
      const rec = options[i];
      if (!recs.some(r => r.heading === rec.heading)) recs.push(rec);
    }
  }

  // Ensure we have at least 3 recommendations, pad with general ones
  if (recs.length < 3) {
    recs.push({
      heading: 'Comprehensive Preventive Health Screening & Risk Stratification',
      detail: 'Regular preventive health assessments enable early detection of subclinical disease processes when interventions are most effective and least invasive. Annual executive-level physical examinations should include age-appropriate screenings per the USPSTF guidelines, including comprehensive metabolic panel, lipid profile, thyroid function, and cancer screenings as indicated. Early identification and management of cardiovascular risk factors, metabolic abnormalities, and mental health concerns significantly reduces long-term morbidity and mortality. Please consult your physician before implementing any changes.',
      action: 'Schedule a comprehensive annual physical examination with an executive health program or your primary care provider within the next 30 days, requesting a full panel of age-appropriate preventive screenings including fasting lipid profile, comprehensive metabolic panel, HbA1c, and thyroid-stimulating hormone (TSH).',
      category: 'general',
    });
  }

  return recs.slice(0, 6);
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
