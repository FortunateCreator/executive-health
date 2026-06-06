import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import {
  getAllProfiles,
  getLatestScore,
  getServiceRequests,
  getAppointments,
  getAllClinicalNotes,
} from '@executive-health/db';
import type { RiskCategory } from '@executive-health/core';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const profiles = getAllProfiles();
    const totalPatients = profiles.length;

    // ── Risk breakdown ──────────────────────────────────────
    const riskBreakdown: Record<RiskCategory, number> = {
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0,
    };

    for (const profile of profiles) {
      const latest = getLatestScore(profile.id);
      const category = latest?.score_data?.risk_category ?? 'low';
      riskBreakdown[category] = (riskBreakdown[category] || 0) + 1;
    }

    // ── Today's appointments ─────────────────────────────────
    const today = new Date().toISOString().slice(0, 10);

    const todayAppointments = profiles.flatMap((profile) =>
      getAppointments(profile.id).filter((a) => a.appointment_date === today),
    );

    // ── Pending service requests ────────────────────────────
    const pendingRequests = profiles.flatMap((profile) =>
      getServiceRequests(profile.id).filter((r) => r.status === 'pending'),
    );

    // ── Recent clinical notes ───────────────────────────────
    const recentNotes = getAllClinicalNotes().slice(0, 5);

    return NextResponse.json({
      totalPatients,
      riskBreakdown,
      todayAppointments,
      pendingRequests,
      recentNotes,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 },
    );
  }
}
