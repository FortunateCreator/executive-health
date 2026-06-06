'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IntakeMultiStepForm } from '@executive-health/ui';
import { DashboardLayout } from '@executive-health/ui';
import type { IntakeFormData } from '@executive-health/core';

export default function OnboardingPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const [showReturningNotice, setShowReturningNotice] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json();
      })
      .then((user) => {
        if (user.last_intake_date != null) {
          setShowReturningNotice(true);
        }
        setChecking(false);
      })
      .catch(() => {
        router.push('/auth/login');
      });
  }, [router]);

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

      // Try to parse JSON regardless of status code
      let result;
      try {
        result = await res.json();
      } catch {
        result = { error: `Server returned ${res.status} ${res.statusText}` };
      }

      if (!res.ok) {
        setError(result.error || `Request failed (${res.status})`);
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      router.push('/dashboard');
    } catch (err) {
      setError(`Connection error: ${err instanceof Error ? err.message : 'Please try again.'}`);
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{
        maxWidth: '700px',
        margin: '0 auto',
        padding: 'clamp(12px, 3vw, 24px)',
        width: '100%',
      }}>
        {checking ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '48px 0' }}>
            Loading...
          </p>
        ) : (
          <>
            <h1 style={{
              fontSize: 'clamp(20px, 4vw, 24px)',
              fontWeight: 700,
              marginBottom: '6px',
              color: '#ffffff',
            }}>
              Health Assessment
            </h1>
            <p style={{
              color: 'var(--text-secondary)',
              marginBottom: 'clamp(20px, 3vw, 28px)',
              fontSize: 'clamp(13px, 2vw, 14px)',
              lineHeight: 1.6,
            }}>
              Your personalized Executive Health Score starts here.
            </p>
            {error && (
              <div style={{
                background: '#3b1a1a',
                border: '1px solid var(--danger)',
                borderRadius: '8px',
                padding: 'clamp(10px, 2vw, 12px) clamp(12px, 2.5vw, 14px)',
                marginBottom: '16px',
                color: 'var(--danger)',
                fontSize: 'clamp(13px, 2vw, 14px)',
              }}>
                {error}
              </div>
            )}

            {showReturningNotice && (
              <div style={{
                background: '#1e1a3a',
                border: '1px solid #4a4499',
                borderRadius: '10px',
                padding: 'clamp(16px, 3vw, 24px)',
                marginBottom: '20px',
                textAlign: 'center',
              }}>
                <p style={{
                  color: '#c4b5fd',
                  fontSize: 'clamp(13px, 2vw, 15px)',
                  margin: '0 0 16px 0',
                  lineHeight: 1.5,
                }}>
                  You have already completed an assessment. Starting a new one will update your health score.
                </p>
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}>
                  <button
                    onClick={() => setShowReturningNotice(false)}
                    style={{
                      padding: '8px 18px',
                      background: '#7c6ff7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: 'clamp(12px, 2vw, 14px)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#6b5ee0'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#7c6ff7'; }}
                  >
                    Continue Anyway
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    style={{
                      padding: '8px 18px',
                      background: 'transparent',
                      color: '#a5a5c0',
                      border: '1px solid #3d3d6e',
                      borderRadius: '6px',
                      fontSize: 'clamp(12px, 2vw, 14px)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2a4e'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            )}

            {!showReturningNotice && (
              <>
                <IntakeMultiStepForm onSubmit={handleSubmit} isSubmitting={submitting} />

                <p style={{
                  color: '#6b7280',
                  fontSize: 'clamp(11px, 1.8vw, 12px)',
                  lineHeight: 1.6,
                  marginTop: 'clamp(16px, 3vw, 24px)',
                  textAlign: 'center',
                  padding: 'clamp(10px, 2vw, 12px) clamp(12px, 2.5vw, 16px)',
                  borderTop: '1px solid #2a2a4e',
                }}>
                  This assessment is for informational purposes only and does not constitute medical advice. Always consult a qualified healthcare provider for medical decisions.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
