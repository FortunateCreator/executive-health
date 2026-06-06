import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getMoodCheckIns, getMoodCheckInsByDateRange, getLatestBurnoutAssessment, saveBurnoutAssessment } from '@executive-health/db';
import { calculateBurnoutRisk, generateInterventionPlan, getTrendAnalysis } from '@executive-health/stress';
import { v4 as uuid } from 'uuid';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const today = new Date().toISOString().slice(0, 10);

    // Get mood check-ins for last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const startDate = fourteenDaysAgo.toISOString().slice(0, 10);

    const recentCheckIns = getMoodCheckInsByDateRange(userId, startDate, today);

    // Calculate burnout risk
    const burnoutRisk = calculateBurnoutRisk(recentCheckIns);

    // Save the burnout assessment
    const existingAssessment = getLatestBurnoutAssessment(userId);
    const assessment = {
      id: uuid(),
      user_id: userId,
      date: today,
      exhaustion_score: burnoutRisk.exhaustion,
      cynicism_score: burnoutRisk.cynicism,
      efficacy_score: burnoutRisk.efficacy,
      overall_burnout_risk: burnoutRisk.risk_category,
      recommendation: generateInterventionPlan(burnoutRisk).map(i => i.title).join('. '),
      calculated_at: burnoutRisk.calculated_at,
    };

    // Only save if it's new or the last one is older
    if (!existingAssessment || existingAssessment.date !== today) {
      saveBurnoutAssessment(assessment);
    }

    // Generate intervention plan
    const interventions = generateInterventionPlan(burnoutRisk);

    // Trend analysis
    const trends = getTrendAnalysis(recentCheckIns);

    // Today's check-ins
    const todayCheckIns = getMoodCheckInsByDateRange(userId, today, today);

    // Cognitive fatigue detection: energy < 4 AND stress > 7 in last 3 check-ins
    const sortedRecent = [...recentCheckIns].sort((a, b) => b.created_at.localeCompare(a.created_at));
    const last3 = sortedRecent.slice(0, 3);
    const cognitiveFatigue = last3.length >= 3 &&
      last3.every(c => c.energy_level < 4 && c.stress_level > 7);

    return NextResponse.json({
      check_ins: recentCheckIns,
      today_check_ins: todayCheckIns,
      burnout_risk: burnoutRisk,
      assessment,
      interventions,
      trends,
      cognitive_fatigue: cognitiveFatigue,
    });
  } catch (err) {
    console.error('Stress fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch stress data' }, { status: 500 });
  }
}
