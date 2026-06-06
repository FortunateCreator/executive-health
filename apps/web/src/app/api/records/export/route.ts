import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getLabResults, getMedicalRecords, getEmergencyProfile, getProfile } from '@executive-health/db';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const profile = getProfile(userId);
    const labResults = getLabResults(userId);
    const medicalRecords = getMedicalRecords(userId);
    const emergencyProfile = getEmergencyProfile(userId);

    const lines: string[] = [];
    lines.push('='.repeat(60));
    lines.push('EXECUTIVE HEALTH REPORT');
    lines.push('='.repeat(60));
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');

    // Personal info
    if (profile) {
      lines.push('--- PERSONAL INFORMATION ---');
      lines.push(`Name: ${profile.display_name}`);
      lines.push(`Email: ${profile.email}`);
      lines.push(`Last Intake: ${profile.last_intake_date || 'N/A'}`);
      lines.push(`Health Score: ${profile.last_score != null ? profile.last_score : 'N/A'}`);
      lines.push('');
    }

    // Emergency profile
    if (emergencyProfile) {
      lines.push('--- EMERGENCY PROFILE ---');
      lines.push(`Blood Type: ${emergencyProfile.blood_type || 'N/A'}`);
      lines.push(`Medical Conditions: ${emergencyProfile.medical_conditions_summary || 'None reported'}`);
      lines.push(`Allergies: ${emergencyProfile.allergies.length > 0 ? emergencyProfile.allergies.join(', ') : 'None reported'}`);
      lines.push(`Medications: ${emergencyProfile.medications.length > 0 ? emergencyProfile.medications.join(', ') : 'None reported'}`);
      lines.push(`Primary Physician: ${emergencyProfile.primary_physician || 'N/A'}`);
      lines.push(`Insurance: ${emergencyProfile.insurance_info || 'N/A'}`);
      lines.push('');
      lines.push('Emergency Contacts:');
      emergencyProfile.emergency_contacts.forEach((c, i) => {
        lines.push(`  ${i + 1}. ${c.name} (${c.relationship}) — ${c.phone}${c.email ? ` / ${c.email}` : ''}${c.is_primary ? ' [PRIMARY]' : ''}`);
      });
      lines.push('');
    }

    // Lab results
    lines.push('--- LAB RESULTS ---');
    if (labResults.length === 0) {
      lines.push('No lab results on file.');
    } else {
      labResults.forEach((lab) => {
        lines.push(`\n  Date: ${lab.date}`);
        lines.push(`  Test: ${lab.test_name} (${lab.test_category})`);
        lines.push(`  Ordered by: ${lab.ordered_by || 'N/A'}`);
        lines.push('  Values:');
        lab.values.forEach((v) => {
          const flag = v.flag !== 'normal' ? ` [${v.flag.toUpperCase()}]` : '';
          lines.push(`    - ${v.parameter}: ${v.value} ${v.unit} (ref: ${v.reference_range})${flag}`);
        });
        if (lab.notes) lines.push(`  Notes: ${lab.notes}`);
      });
    }
    lines.push('');

    // Medical records
    lines.push('--- MEDICAL RECORDS ---');
    if (medicalRecords.length === 0) {
      lines.push('No medical records on file.');
    } else {
      medicalRecords.forEach((rec) => {
        lines.push(`\n  Date: ${rec.date}`);
        lines.push(`  Type: ${rec.record_type.replace(/_/g, ' ')}`);
        lines.push(`  Title: ${rec.title}`);
        lines.push(`  Description: ${rec.description}`);
        lines.push(`  Provider: ${rec.provider_name || 'N/A'}`);
        lines.push(`  Facility: ${rec.facility_name || 'N/A'}`);
        if (rec.notes) lines.push(`  Notes: ${rec.notes}`);
      });
    }

    lines.push('');
    lines.push('='.repeat(60));
    lines.push('END OF REPORT');
    lines.push('='.repeat(60));

    const report = lines.join('\n');

    return new NextResponse(report, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="health-report-${new Date().toISOString().slice(0, 10)}.txt"`,
      },
    });
  } catch (err) {
    console.error('Records export error:', err);
    return NextResponse.json({ error: 'Failed to export records' }, { status: 500 });
  }
}
