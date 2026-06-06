import type { HealthSnapshot, TrendSignal } from '@executive-health/analytics';
import OpenAI from 'openai';
import { aiConfig } from './config';

// ── types ──

export interface ChatContext {
  message: string;
  userId: string;
  snapshot?: HealthSnapshot;
  signals?: TrendSignal[];
  alerts?: any[]; // from predictive.ts
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
}

// ── OpenAI client ──

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

// ── data formatting helpers ──

function formatSnapshot(snapshot?: HealthSnapshot): string {
  if (!snapshot) return 'No health snapshot data available.';

  const s = snapshot.sleep;
  const n = snapshot.nutrition;
  const st = snapshot.stress;
  const hs = snapshot.healthScore;
  const sum = snapshot.summary;

  return [
    '## Current Health Snapshot',
    '',
    '### Sleep',
    `- Average duration: ${s.avg_duration_hours}h/night`,
    `- Quality score: ${s.avg_quality}/100`,
    `- Sleep debt: ${s.total_debt_hours}h`,
    `- Consistency: ${s.consistency_score}/100`,
    `- Nights logged: ${s.nights_logged}`,
    `- Trend: ${s.trend}`,
    '',
    '### Nutrition',
    `- Average daily calories: ${n.avg_daily_calories}`,
    `- Meal log rate: ${n.meal_log_rate}%`,
    `- Protein vs target: ${n.protein_target_pct}%`,
    `- Quality trend: ${n.quality_trend}`,
    `- Days with data: ${n.days_with_data}`,
    '',
    '### Stress & Mood',
    `- Average mood: ${st.avg_mood}/100`,
    `- Average stress: ${st.avg_stress}/100`,
    `- Burnout risk: ${st.burnout_risk}/100`,
    `- Check-in rate: ${st.check_in_rate}%`,
    `- Trend: ${st.trend}`,
    '',
    '### Health Score',
    `- Overall: ${hs.overall}/100`,
    `- Risk category: ${hs.risk_category}`,
    `- Days since last assessment: ${hs.days_since_assessment}`,
    `- Recent change: ${hs.recent_change > 0 ? '+' : ''}${hs.recent_change} points`,
    '',
    '### Summary',
    `- Overall risk: ${sum.overall_risk}`,
    `- Active modules: ${sum.module_count}`,
    `- Days of data: ${sum.days_of_data}`,
  ].join('\n');
}

function formatSignals(signals?: TrendSignal[]): string {
  if (!signals || signals.length === 0) return 'No active trend signals.';

  const lines = ['## Active Trend Signals', ''];

  for (const sig of signals) {
    lines.push(
      `- [${sig.severity.toUpperCase()}] ${sig.module}: ${sig.title} — ${sig.message}`,
    );
  }

  return lines.join('\n');
}

function formatAlerts(alerts?: any[]): string {
  if (!alerts || alerts.length === 0) return 'No active alerts.';

  const lines = ['## Active Alerts', ''];

  for (const a of alerts) {
    const typeTag = a.type ? `[${a.type}]` : '';
    const priorityTag = a.priority ? `(${a.priority})` : '';
    lines.push(`- ${priorityTag} ${typeTag} ${a.title}: ${a.body}`);
  }

  return lines.join('\n');
}

function formatHistory(history?: { role: 'user' | 'assistant'; content: string }[]): string {
  if (!history || history.length === 0) return 'No prior conversation.';

  const recent = history.slice(-6);
  const lines = ['## Recent Conversation History', ''];

  for (const msg of recent) {
    lines.push(`${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`);
  }

  return lines.join('\n');
}

// ── prompt builder ──

/**
 * Build the full system prompt with embedded health context.
 * Auth-sensitive data is stripped — no PII, tokens, or credentials are included.
 */
export function buildChatPrompt(context: ChatContext): string {
  const blocks = [
    `You are an executive health AI assistant. Your role is to provide personalized, data-driven health guidance based on the user's current health metrics.`,
    '',
    `### Instructions`,
    `- Reference specific data points from the user's health snapshot when relevant.`,
    `- Cite active trends and alerts to add context to your advice.`,
    `- Offer actionable, concrete recommendations — not just observations.`,
    `- Be concise and warm. Use a supportive, coaching tone.`,
    `- If the user asks a general question (not health-related), answer helpfully but briefly.`,
    `- If you don't have enough data to answer confidently, say so and suggest what data would help.`,
    `- Never make a definitive medical diagnosis. Always recommend consulting a healthcare professional for medical concerns.`,
    `- Respond in plain text. No markdown formatting.`,
    '',
    '---',
    '',
    formatSnapshot(context.snapshot),
    '',
    '---',
    '',
    formatSignals(context.signals),
    '',
    '---',
    '',
    formatAlerts(context.alerts),
    '',
    '---',
    '',
    formatHistory(context.conversationHistory),
  ];

  return blocks.join('\n');
}

// ── chat response generator ──

/**
 * Generate an AI chat response with full context awareness.
 * Uses DeepSeek via the configured OpenAI-compatible client.
 */
export async function generateChatResponse(context: ChatContext): Promise<string> {
  const systemPrompt = buildChatPrompt(context);

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: context.message },
  ];

  try {
    const completion = await getClient().chat.completions.create(
      {
        model: aiConfig.model,
        messages,
        temperature: 0.5,
        max_tokens: 1024,
      },
      { timeout: aiConfig.timeoutMs },
    );

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return "I'm sorry, I couldn't generate a response. Please try again.";
    }

    return raw.trim();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[ai] Chat response generation failed: ${msg}`);
    return "I'm having trouble connecting to my knowledge base right now. Please try again in a moment, or check with your healthcare provider for urgent concerns.";
  }
}
