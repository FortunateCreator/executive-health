import type { IntakeFormData } from '@executive-health/core';

// ── system prompt ──

export const HEALTH_SCORING_SYSTEM_PROMPT = `You are an executive health scoring AI. Your job is to evaluate health intake form data and return a structured health assessment.

You must respond with ONLY valid JSON — no markdown, no commentary, no code fences. The JSON must conform exactly to this TypeScript shape:

{
  "overall": number (0-100),
  "cardiovascular": number (0-100),
  "metabolic": number (0-100),
  "lifestyle": number (0-100),
  "mental_wellbeing": number (0-100),
  "risk_category": "low" | "moderate" | "high" | "critical",
  "risk_factors": [
    {
      "name": string,
      "severity": "mild" | "moderate" | "severe",
      "description": string
    }
  ],
  "recommendations": string[],
  "score_breakdown": [
    {
      "category": string,
      "score": number (0-100),
      "weight": number,
      "details": string
    }
  ]
}

Scoring guidelines:
- Cardiovascular (weight 0.30): Consider blood pressure, BMI, activity level, smoking status. BMI 18.5-24.9 is optimal. Systolic <120 is optimal. Regular exercise and non-smoking increase scores.
- Metabolic (weight 0.20): Consider BMI, fasting glucose, cholesterol ratio (total/HDL). Glucose <100 mg/dL and ratio <3.5 are optimal.
- Lifestyle (weight 0.25): Consider sleep hours and quality, alcohol consumption, diet quality, work hours, social connections.
- Mental Wellbeing (weight 0.25): Consider stress level, sleep quality, social connections. High work hours (60+) and high stress reduce scores.

Risk categories: overall >= 80 = "low", >= 60 = "moderate", >= 40 = "high", < 40 = "critical".

Generate 2-4 risk factors focused on the most concerning measurements.
Generate 2-4 actionable, specific recommendations targeting the lowest-scoring categories.
Each recommendation should be a single sentence with a concrete action.

Be conservative — err toward lower scores when data is missing or ambiguous.`;

// ── build user prompt ──

export function buildScoringPrompt(data: IntakeFormData): string {
  const lines: string[] = ['Score the following executive health intake data:', ''];

  lines.push('```json');
  lines.push(JSON.stringify(data, null, 2));
  lines.push('```');
  lines.push('');
  lines.push('Return ONLY the JSON health score assessment. No markdown formatting, no explanation.');

  return lines.join('\n');
}

// ── parse AI response ──

export function parseScoringResponse(raw: string): Record<string, unknown> {
  // Strip any markdown code fences if present
  let cleaned = raw.trim();

  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }

  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }

  cleaned = cleaned.trim();

  return JSON.parse(cleaned);
}
