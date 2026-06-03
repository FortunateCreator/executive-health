'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IntakeMultiStepForm } from '@executive-health/ui';
import { DashboardLayout } from '@executive-health/ui';
import type { IntakeFormData } from '@executive-health/core';

export default function OnboardingPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (data: IntakeFormData) => {
    setSubmitting(true);
    setError('');
    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth/login'); return; }

    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) { setError(result.error || 'Failed to calculate score'); setSubmitting(false); return; }
      router.push('/dashboard');
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Health Intake</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Complete all steps to generate your personalized Executive Health Score.
        </p>
        {error && (
          <div style={{ background: '#3b1a1a', border: '1px solid var(--danger)', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: 'var(--danger)' }}>
            {error}
          </div>
        )}
        <IntakeMultiStepForm onSubmit={handleSubmit} isSubmitting={submitting} />
      </div>
    </DashboardLayout>
  );
}
