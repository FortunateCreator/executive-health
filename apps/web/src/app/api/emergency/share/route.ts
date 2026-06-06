import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getEmergencyProfile, getProfile } from '@executive-health/db';

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const profile = getEmergencyProfile(userId);
    const userProfile = getProfile(userId);

    const lines: string[] = [];
    lines.push('='.repeat(50));
    lines.push('EMERGENCY HEALTH SUMMARY');
    lines.push('='.repeat(50));
    lines.push('');

    if (userProfile) {
      lines.push(`Patient: ${userProfile.display_name}`);
      lines.push(`Blood Type: ${profile?.blood_type || 'UNKNOWN'}`);
      lines.push('');
    }

    lines.push('--- CRITICAL MEDICAL INFORMATION ---');
    lines.push('');

    lines.push('Medical Conditions:');
    if (profile?.medical_conditions_summary) {
      lines.push(`  ${profile.medical_conditions_summary}`);
    } else {
      lines.push('  None reported.');
    }
    lines.push('');

    lines.push('Allergies:');
    if (profile?.allergies && profile.allergies.length > 0) {
      profile.allergies.forEach((a) => lines.push(`  - ${a}`));
    } else {
      lines.push('  No known allergies.');
    }
    lines.push('');

    lines.push('Current Medications:');
    if (profile?.medications && profile.medications.length > 0) {
      profile.medications.forEach((m) => lines.push(`  - ${m}`));
    } else {
      lines.push('  None reported.');
    }
    lines.push('');

    lines.push('Primary Physician:');
    lines.push(`  ${profile?.primary_physician || 'Not on file.'}`);
    lines.push('');

    lines.push('Insurance Information:');
    lines.push(`  ${profile?.insurance_info || 'Not on file.'}`);
    lines.push('');

    if (profile?.advanced_directives) {
      lines.push('Advanced Directives:');
      lines.push(`  ${profile.advanced_directives}`);
      lines.push('');
    }

    lines.push('--- EMERGENCY CONTACTS ---');
    if (profile?.emergency_contacts && profile.emergency_contacts.length > 0) {
      profile.emergency_contacts.forEach((c) => {
        lines.push(`  ${c.is_primary ? '★ ' : '  '}${c.name} — ${c.relationship}`);
        lines.push(`    Phone: ${c.phone}${c.email ? ` | Email: ${c.email}` : ''}`);
      });
    } else {
      lines.push('  No emergency contacts on file.');
    }
    lines.push('');

    lines.push('='.repeat(50));
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('This summary is intended for emergency use only.');

    const summary = lines.join('\n');
    return NextResponse.json({ summary });
  } catch (err) {
    console.error('Emergency share error:', err);
    return NextResponse.json({ error: 'Failed to generate emergency summary' }, { status: 500 });
  }
}
