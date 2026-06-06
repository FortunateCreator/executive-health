import type { OrgAnalytics } from '@executive-health/core';
import {
  getUsersByOrg,
  getOrgMembers,
  getDepartments,
  getScores,
  getLatestScore,
  getSleepRecordsByDateRange,
  getMoodCheckInsByDateRange,
} from '@executive-health/db';

/**
 * Build org-level analytics by aggregating health data across all active members.
 */
export async function buildOrgAnalytics(
  orgId: string,
  days: number = 30,
): Promise<OrgAnalytics> {
  const members = getOrgMembers(orgId);
  const activeMembers = members.filter(m => m.status === 'active');
  const departments = getDepartments(orgId);
  const userIds = activeMembers.map(m => m.user_id);

  const endDate = new Date().toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

  if (userIds.length === 0) {
    return emptyAnalytics(orgId);
  }

  // Collect scores, sleep, and stress data for all members
  let totalScore = 0;
  let scoreCount = 0;
  let totalSleepHours = 0;
  let sleepCount = 0;
  let totalStress = 0;
  let stressCount = 0;

  // Risk distribution
  const riskDist = { low: 0, moderate: 0, high: 0, critical: 0 };

  // Health score trend (aggregate per day)
  const trendMap = new Map<string, number[]>();

  // Department breakdown
  const deptMap = new Map<string, { scores: number[]; members: Set<string>; engagement: Set<string> }>();

  for (const uid of userIds) {
    // Scores
    const scores = getScores(uid);
    const latest = getLatestScore(uid);
    if (latest) {
      totalScore += latest.overall_score ?? 0;
      scoreCount++;
      const cat = latest.score_data?.risk_category;
      if (cat === 'low') riskDist.low++;
      else if (cat === 'moderate') riskDist.moderate++;
      else if (cat === 'high') riskDist.high++;
      else riskDist.critical++;

      // Trend data — group by date
      for (const s of scores) {
        if (!s.created_at) continue;
        const date = s.created_at.slice(0, 10);
        if (date >= startDate && date <= endDate) {
          if (!trendMap.has(date)) trendMap.set(date, []);
          trendMap.get(date)!.push(s.overall_score ?? 0);
        }
      }
    }

    // Sleep
    const sleepRecords = getSleepRecordsByDateRange(uid, startDate, endDate);
    if (sleepRecords.length > 0) {
      const avgSleep = sleepRecords.reduce((s, r) => s + (r.duration_minutes ?? 0), 0) / sleepRecords.length;
      totalSleepHours += avgSleep / 60;
      sleepCount++;
    }

    // Stress
    const moods = getMoodCheckInsByDateRange(uid, startDate, endDate);
    if (moods.length > 0) {
      const avgStress = moods.reduce((s, m) => s + (m.stress_level ?? 5), 0) / moods.length;
      totalStress += avgStress * 10; // Scale to 0-100
      stressCount++;
    }

    // Department breakdown
    const member = activeMembers.find(m => m.user_id === uid);
    if (member?.department_id) {
      if (!deptMap.has(member.department_id)) {
        deptMap.set(member.department_id, { scores: [], members: new Set(), engagement: new Set() });
      }
      const deptData = deptMap.get(member.department_id)!;
      deptData.members.add(uid);
      if (latest) deptData.scores.push(latest.overall_score ?? 0);
      if (scores.length > 0) deptData.engagement.add(uid);
    }
  }

  // Build department breakdown
  const departmentBreakdown = departments.map(d => {
    const data = deptMap.get(d.id);
    const scores = data?.scores ?? [];
    return {
      department: d.name,
      members: data?.members.size ?? 0,
      avg_score: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      engagement: data?.members.size && data.engagement.size
        ? Math.round((data.engagement.size / data.members.size) * 100)
        : 0,
    };
  });

  // Build trend array
  const healthScoreTrend = [...trendMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, scores]) => ({
      date,
      score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }));

  return {
    org_id: orgId,
    total_members: members.length,
    active_members: activeMembers.length,
    engagement_rate: activeMembers.length > 0
      ? Math.round((scoreCount / activeMembers.length) * 100)
      : 0,
    average_health_score: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
    health_score_trend: healthScoreTrend,
    department_breakdown: departmentBreakdown,
    risk_distribution: riskDist,
    sleep_avg_hours: sleepCount > 0 ? Math.round((totalSleepHours / sleepCount) * 10) / 10 : 0,
    stress_avg_level: stressCount > 0 ? Math.round(totalStress / stressCount) : 0,
    last_updated: new Date().toISOString(),
  };
}

function emptyAnalytics(orgId: string): OrgAnalytics {
  return {
    org_id: orgId,
    total_members: 0,
    active_members: 0,
    engagement_rate: 0,
    average_health_score: 0,
    health_score_trend: [],
    department_breakdown: [],
    risk_distribution: { low: 0, moderate: 0, high: 0, critical: 0 },
    sleep_avg_hours: 0,
    stress_avg_level: 0,
    last_updated: new Date().toISOString(),
  };
}
