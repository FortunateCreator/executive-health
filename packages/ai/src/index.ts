import type { IntakeFormData, HealthScore } from '@executive-health/core';
import OpenAI from 'openai';
import { computeHeuristicScore } from './heuristic';
import { HEALTH_SCORING_SYSTEM_PROMPT, buildScoringPrompt, parseScoringResponse } from './prompts';
import { aiConfig } from './config';

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: aiConfig.baseUrl,
    });
  }
  return _client;
}

/**
 * Score health intake data using DeepSeek Pro with heuristic fallback.
 * Returns the HealthScore and logs which engine was used.
 */
export async function scoreHealth(intakeData: IntakeFormData): Promise<HealthScore> {
  // ── try AI scoring ──
  try {
    const completion = await getClient().chat.completions.create(
      {
        model: aiConfig.model,
        messages: [
          { role: 'system', content: HEALTH_SCORING_SYSTEM_PROMPT },
          { role: 'user', content: buildScoringPrompt(intakeData) },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      },
      { timeout: aiConfig.timeoutMs },
    );

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new Error('Empty response from AI model');
    }

    const parsed = parseScoringResponse(raw);

    console.log('[ai] Scored via DeepSeek Pro');

    return {
      overall: Number(parsed.overall),
      cardiovascular: Number(parsed.cardiovascular),
      metabolic: Number(parsed.metabolic),
      lifestyle: Number(parsed.lifestyle),
      mental_wellbeing: Number(parsed.mental_wellbeing),
      risk_category: String(parsed.risk_category) as HealthScore['risk_category'],
      risk_factors: Array.isArray(parsed.risk_factors)
        ? parsed.risk_factors.map((rf: any) => ({
            name: String(rf.name),
            severity: String(rf.severity) as 'mild' | 'moderate' | 'severe',
            description: String(rf.description),
          }))
        : [],
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.map((rec: any) => {
            if (typeof rec === 'string') {
              // Legacy string format — wrap in structured object
              return {
                heading: rec.length > 50 ? rec.substring(0, 50) + '…' : rec,
                detail: rec,
                action: rec,
                category: 'general',
              };
            }
            return {
              heading: String(rec.heading || 'Recommendation'),
              detail: String(rec.detail || rec.heading || ''),
              action: String(rec.action || rec.detail || rec.heading || ''),
              category: (['cardiovascular', 'metabolic', 'lifestyle', 'mental_wellbeing', 'general'].includes(rec.category) ? rec.category : 'general') as 'cardiovascular' | 'metabolic' | 'lifestyle' | 'mental_wellbeing' | 'general',
            };
          })
        : [],
      score_breakdown: Array.isArray(parsed.score_breakdown)
        ? parsed.score_breakdown.map((sb: any) => ({
            category: String(sb.category),
            score: Number(sb.score),
            weight: Number(sb.weight),
            details: String(sb.details),
          }))
        : [],
      calculated_at: new Date().toISOString(),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[ai] DeepSeek API call failed: ${msg}. Falling back to heuristic scoring.`);

    if (!aiConfig.fallbackToHeuristic) {
      throw err;
    }

    // ── fallback to heuristic ──
    const score = computeHeuristicScore(intakeData);
    console.log('[ai] Scored via heuristic (fallback)');
    return score;
  }
}

// ── exports from new modules ──

export { generateAlerts } from './predictive';
export type { Alert } from './predictive';

export { generateChatResponse, buildChatPrompt } from './chat-engine';
export type { ChatContext } from './chat-engine';

export {
  generateMorningNudge,
  generateMiddayNudge,
  generateEveningNudge,
  generateWeeklyNudge,
} from './nudges';
export type { Nudge } from './nudges';

export default scoreHealth;
