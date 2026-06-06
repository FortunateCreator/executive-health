import React, { useState, useCallback } from 'react';
import type { IntakeFormData } from '@executive-health/core';

interface IntakeMultiStepFormProps {
  onSubmit: (data: IntakeFormData) => void;
  isSubmitting?: boolean;
}

// ── Styles ──────────────────────────────────────────────────
const darkInput: React.CSSProperties = {
  width: '100%',
  padding: 'clamp(12px, 2.5vw, 14px) clamp(14px, 3vw, 16px)',
  borderRadius: 10,
  border: '1px solid var(--border)',
  backgroundColor: '#16213e',
  color: '#e2e8f0',
  fontSize: 'clamp(15px, 2.5vw, 16px)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  minHeight: 48,
};

const darkSelect: React.CSSProperties = {
  ...darkInput,
  appearance: 'none',
  cursor: 'pointer',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M6 8L1 3h10z' fill='%2394a3b8'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
  paddingRight: '36px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontSize: 'clamp(13px, 2vw, 14px)',
  fontWeight: 600,
  color: '#cbd5e1',
};

const fieldGroup: React.CSSProperties = {
  marginBottom: 20,
};

const errorText: React.CSSProperties = {
  color: '#f87171',
  fontSize: 12,
  marginTop: 4,
};

const stepHeading: React.CSSProperties = {
  marginBottom: 24,
};

const stepTitle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: 'clamp(18px, 3.5vw, 22px)',
  fontWeight: 700,
  marginBottom: 6,
  marginTop: 0,
  lineHeight: 1.2,
};

const stepSubtitle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: 'clamp(13px, 2vw, 14px)',
  lineHeight: 1.6,
  margin: 0,
};

const progressLabel: React.CSSProperties = {
  textAlign: 'center' as const,
  fontSize: 12,
  color: '#64748b',
  marginBottom: 24,
};

const radioGroup: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const skipNote: React.CSSProperties = {
  background: 'rgba(15, 52, 96, 0.3)',
  border: '1px solid #0f3460',
  borderRadius: 10,
  padding: '12px 16px',
  fontSize: 'clamp(12px, 1.8vw, 13px)',
  color: '#94a3b8',
  lineHeight: 1.6,
  marginBottom: 20,
};

// ── Step definitions ────────────────────────────────────────
const STEPS = [
  'Welcome',
  'About You',
  'Daily Habits',
  'Rest & Recovery',
  'Health Background',
  'Vitals',
];

const TOTAL_FORM_STEPS = STEPS.length - 1; // excluding welcome

// ── Option definitions with friendly labels ──────────────────
const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Mostly sitting — desk job, little exercise' },
  { value: 'light', label: 'Light activity — walking, occasional exercise' },
  { value: 'moderate', label: 'Regular exercise 2–3 times a week' },
  { value: 'active', label: 'Active most days — workouts, sports' },
  { value: 'very_active', label: 'Training daily — high intensity or physical job' },
];

const SMOKING_OPTIONS = [
  { value: 'never', label: 'No, never smoked' },
  { value: 'former', label: 'I used to smoke, but I quit' },
  { value: 'current', label: 'Yes, I currently smoke' },
];

const ALCOHOL_OPTIONS = [
  { value: 'never', label: "I don't drink" },
  { value: 'occasionally', label: 'A few drinks a month' },
  { value: 'moderately', label: 'A few drinks a week' },
  { value: 'frequently', label: 'Most days' },
];

const DIET_OPTIONS = [
  { value: 'poor', label: 'A lot of processed & fast food' },
  { value: 'fair', label: 'Mix of healthy and not-so-great choices' },
  { value: 'good', label: 'Mostly whole foods, balanced meals' },
  { value: 'excellent', label: 'Carefully balanced, nutrient-rich diet' },
];

const SLEEP_QUALITY_OPTIONS = [
  { value: 'poor', label: 'I toss and turn — rarely feel rested' },
  { value: 'fair', label: 'Could be better — some restless nights' },
  { value: 'good', label: 'I sleep pretty well most nights' },
  { value: 'excellent', label: 'Deep, restorative sleep every night' },
];

const STRESS_OPTIONS = [
  { value: 'low', label: 'Pretty calm — I manage stress well' },
  { value: 'moderate', label: 'Some pressure, but it feels manageable' },
  { value: 'high', label: "A lot on my plate — often feel stressed" },
  { value: 'very_high', label: 'Overwhelming — it affects my daily life' },
];

const SOCIAL_OPTIONS = [
  { value: 'isolated', label: 'I keep to myself mostly' },
  { value: 'limited', label: 'A few close connections' },
  { value: 'moderate', label: 'Regular social contact with friends & family' },
  { value: 'strong', label: 'Rich, supportive network of people I can lean on' },
];

const CHRONIC_CONDITIONS = [
  'Hypertension', 'Diabetes Type 2', 'High Cholesterol',
  'Heart Disease', 'Asthma', 'Arthritis', 'Depression',
  'Anxiety', 'Thyroid Disorder', 'Obesity',
];

const FAMILY_HISTORY_OPTIONS = [
  'Heart Disease', 'Diabetes', 'Cancer', 'Stroke',
  "Alzheimer's", 'Hypertension', 'Mental Illness',
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male', emoji: '♂️' },
  { value: 'female', label: 'Female', emoji: '♀️' },
  { value: 'other', label: 'Other / Prefer not to say', emoji: '⚧' },
];

// ── Form state type ─────────────────────────────────────────
type FormFields = {
  age: number | '';
  gender: string;
  height_cm: number | '';
  weight_kg: number | '';
  activity_level: string;
  smoking_status: string;
  alcohol_frequency: string;
  diet_quality: string;
  sleep_hours: number | '';
  sleep_quality: string;
  stress_level: string;
  chronic_conditions: string[];
  medications: string;
  family_history: string[];
  systolic_bp: number | '';
  diastolic_bp: number | '';
  resting_hr: number | '';
  cholesterol_total: number | '';
  hdl_cholesterol: number | '';
  fasting_glucose: number | '';
  work_hours_per_week: number | '';
  social_connections: string;
};

const initialFormState: FormFields = {
  age: '',
  gender: '',
  height_cm: '',
  weight_kg: '',
  activity_level: '',
  smoking_status: '',
  alcohol_frequency: '',
  diet_quality: '',
  sleep_hours: 7,
  sleep_quality: '',
  stress_level: '',
  chronic_conditions: [],
  medications: '',
  family_history: [],
  systolic_bp: '',
  diastolic_bp: '',
  resting_hr: '',
  cholesterol_total: '',
  hdl_cholesterol: '',
  fasting_glucose: '',
  work_hours_per_week: '',
  social_connections: '',
};

// ── Component ───────────────────────────────────────────────
const IntakeMultiStepForm: React.FC<IntakeMultiStepFormProps> = ({
  onSubmit,
  isSubmitting = false,
}) => {
  const [step, setStep] = useState(0);
  const [fields, setFields] = useState<FormFields>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [animDirection, setAnimDirection] = useState<'forward' | 'back'>('forward');

  const update = useCallback(
    (key: keyof FormFields, value: string | number | string[]) => {
      setFields((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [],
  );

  const toggleArray = useCallback(
    (key: 'chronic_conditions' | 'family_history', item: string) => {
      setFields((prev) => {
        const arr = prev[key];
        const next = arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
        return { ...prev, [key]: next };
      });
    },
    [],
  );

  const num = (v: number | ''): number | undefined =>
    v === '' ? undefined : Number(v);

  // ── Validation per step ──────────────────────────────────
  const validateStep = useCallback(
    (s: number): boolean => {
      const errs: Record<string, string> = {};

      switch (s) {
        case 0: {
          return true;
        }
        case 1: {
          if (fields.age === '' || Number(fields.age) < 18 || Number(fields.age) > 120)
            errs.age = 'Please enter a valid age (18–120)';
          if (!fields.gender) errs.gender = 'Please select an option';
          break;
        }
        case 2: {
          if (!fields.activity_level) errs.activity_level = 'Please tell us about your activity level';
          if (!fields.smoking_status) errs.smoking_status = 'Please select an option';
          if (!fields.alcohol_frequency) errs.alcohol_frequency = 'Please select an option';
          if (!fields.diet_quality) errs.diet_quality = 'Please tell us about your eating habits';
          break;
        }
        case 3: {
          if (fields.sleep_hours === '' || Number(fields.sleep_hours) < 3 || Number(fields.sleep_hours) > 14)
            errs.sleep_hours = 'Please set your sleep hours (3–14)';
          if (!fields.sleep_quality) errs.sleep_quality = "Please tell us how well you're sleeping";
          if (!fields.stress_level) errs.stress_level = 'Please tell us about your stress level';
          break;
        }
        case 4: {
          break;
        }
        case 5: {
          if (fields.systolic_bp !== '' && (Number(fields.systolic_bp) < 70 || Number(fields.systolic_bp) > 250))
            errs.systolic_bp = 'Must be 70–250';
          if (fields.diastolic_bp !== '' && (Number(fields.diastolic_bp) < 40 || Number(fields.diastolic_bp) > 150))
            errs.diastolic_bp = 'Must be 40–150';
          if (fields.resting_hr !== '' && (Number(fields.resting_hr) < 30 || Number(fields.resting_hr) > 220))
            errs.resting_hr = 'Must be 30–220';
          if (fields.cholesterol_total !== '' && (Number(fields.cholesterol_total) < 100 || Number(fields.cholesterol_total) > 500))
            errs.cholesterol_total = 'Must be 100–500';
          if (fields.hdl_cholesterol !== '' && (Number(fields.hdl_cholesterol) < 10 || Number(fields.hdl_cholesterol) > 150))
            errs.hdl_cholesterol = 'Must be 10–150';
          if (fields.fasting_glucose !== '' && (Number(fields.fasting_glucose) < 50 || Number(fields.fasting_glucose) > 400))
            errs.fasting_glucose = 'Must be 50–400';
          break;
        }
      }

      setErrors(errs);
      return Object.keys(errs).length === 0;
    },
    [fields],
  );

  const handleNext = () => {
    if (validateStep(step)) {
      setAnimDirection('forward');
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  };

  const handlePrev = () => {
    setAnimDirection('back');
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = () => {
    if (!validateStep(step)) return;

    const data: IntakeFormData = {
      age: Number(fields.age),
      gender: fields.gender as IntakeFormData['gender'],
      height_cm: num(fields.height_cm),
      weight_kg: num(fields.weight_kg),
      activity_level: fields.activity_level as IntakeFormData['activity_level'],
      smoking_status: fields.smoking_status as IntakeFormData['smoking_status'],
      alcohol_frequency: fields.alcohol_frequency as IntakeFormData['alcohol_frequency'],
      diet_quality: fields.diet_quality as IntakeFormData['diet_quality'],
      sleep_hours: Number(fields.sleep_hours),
      sleep_quality: fields.sleep_quality as IntakeFormData['sleep_quality'],
      stress_level: fields.stress_level as IntakeFormData['stress_level'],
      chronic_conditions: fields.chronic_conditions,
      medications: fields.medications ? fields.medications.split(',').map((s) => s.trim()).filter(Boolean) : [],
      family_history: fields.family_history,
      systolic_bp: num(fields.systolic_bp),
      diastolic_bp: num(fields.diastolic_bp),
      resting_hr: num(fields.resting_hr),
      cholesterol_total: num(fields.cholesterol_total),
      hdl_cholesterol: num(fields.hdl_cholesterol),
      fasting_glucose: num(fields.fasting_glucose),
      work_hours_per_week: num(fields.work_hours_per_week),
      social_connections: fields.social_connections
        ? (fields.social_connections as IntakeFormData['social_connections'])
        : undefined,
    };

    onSubmit(data);
  };

  // ── Progress ──────────────────────────────────────────────
  const progressPct = Math.round((step / TOTAL_FORM_STEPS) * 100);
  const completedSteps = step;

  // ── Dynamic styles ────────────────────────────────────────
  const getStepCircle = (active: boolean, completed: boolean): React.CSSProperties => ({
    width: 'clamp(26px, 4vw, 30px)',
    height: 'clamp(26px, 4vw, 30px)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    backgroundColor: active ? 'var(--accent)' : completed ? '#22c55e' : '#16213e',
    color: '#ffffff',
    border: active ? '2px solid #60a5fa' : completed ? '2px solid #22c55e' : '2px solid var(--border)',
    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    flexShrink: 0,
  });

  const getRadioOption = (selected: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 'clamp(12px, 2.5vw, 14px) clamp(14px, 3vw, 16px)',
    borderRadius: 10,
    border: selected ? '2px solid #60a5fa' : '1px solid var(--border)',
    backgroundColor: selected ? 'rgba(15, 52, 96, 0.4)' : '#16213e',
    color: selected ? '#ffffff' : '#cbd5e1',
    fontSize: 'clamp(13px, 2vw, 14px)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minHeight: 48,
  });

  const getRadioDot = (selected: boolean): React.CSSProperties => ({
    width: 18,
    height: 18,
    borderRadius: '50%',
    border: selected ? '5px solid #60a5fa' : '2px solid #475569',
    backgroundColor: selected ? '#ffffff' : 'transparent',
    flexShrink: 0,
    transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
  });

  const getTagStyle = (selected: boolean): React.CSSProperties => ({
    padding: 'clamp(8px, 1.5vw, 10px) clamp(14px, 2.5vw, 16px)',
    borderRadius: 9999,
    border: selected ? '2px solid #60a5fa' : '1px solid var(--border)',
    backgroundColor: selected ? 'var(--accent)' : '#16213e',
    color: selected ? '#ffffff' : '#94a3b8',
    fontSize: 'clamp(13px, 2vw, 14px)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    minHeight: 40,
    display: 'inline-flex',
    alignItems: 'center',
    userSelect: 'none',
  });

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="eh-intake-card" style={{
      backgroundColor: 'var(--bg-card)',
      borderRadius: 'clamp(14px, 3vw, 16px)',
      padding: 'clamp(20px, 5vw, 36px)',
      maxWidth: 640,
      width: '100%',
      margin: '0 auto',
      border: '1px solid var(--border-light)',
      boxSizing: 'border-box',
      animation: 'eh-fade-in-up 0.35s ease forwards',
    }}>
      <style>{`
        .eh-intake-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(12px, 2.5vw, 16px);
        }
        .eh-intake-step-content {
          animation-duration: 0.3s;
          animation-fill-mode: forwards;
        }
        .eh-intake-step-forward {
          animation-name: eh-intake-slide-forward;
        }
        .eh-intake-step-back {
          animation-name: eh-intake-slide-back;
        }
        @keyframes eh-intake-slide-forward {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes eh-intake-slide-back {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .eh-intake-btn {
          padding: clamp(12px, 2.5vw, 14px) clamp(20px, 4vw, 28px);
          border-radius: 10;
          border: none;
          font-size: clamp(14px, 2.2vw, 15px);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .eh-intake-btn:active { transform: scale(0.97); }
        .eh-intake-btn-primary {
          background: var(--accent-light);
          color: #ffffff;
        }
        .eh-intake-btn-primary:hover {
          background: #4f46e5;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          transform: translateY(-1px);
        }
        .eh-intake-btn-secondary {
          background: transparent;
          color: #94a3b8;
          border: 1px solid var(--border);
        }
        .eh-intake-btn-secondary:hover {
          border-color: rgba(255, 255, 255, 0.2);
          color: #cbd5e1;
        }
        .eh-intake-btn-success {
          background: #22c55e;
          color: #ffffff;
        }
        .eh-intake-btn-success:hover {
          background: #16a34a;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
          transform: translateY(-1px);
        }
        .eh-intake-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }
        .eh-intake-range {
          min-height: 44px;
          cursor: pointer;
          width: 100%;
          accent-color: #60a5fa;
          margin-top: 4px;
        }
        .eh-intake-progress-bar {
          height: 4px;
          background: #16213e;
          border-radius: 2px;
          margin-bottom: 20px;
          overflow: hidden;
        }
        .eh-intake-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #60a5fa, #818cf8);
          border-radius: 2px;
          transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .eh-intake-step-line {
          width: clamp(14px, 3vw, 24px);
          height: 2px;
          background: var(--border);
          flex-shrink: 0;
          border-radius: 1px;
        }
        .eh-intake-step-line-completed {
          background: #22c55e;
        }
        .eh-intake-card:focus-within {
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        @media (max-width: 480px) {
          .eh-intake-grid-2 {
            grid-template-columns: 1fr !important;
            gap: 12px;
          }
          .eh-intake-card {
            padding: clamp(14px, 3vw, 18px) !important;
            border-radius: 16px !important;
          }
          .eh-intake-welcome {
            padding: clamp(12px, 4vw, 20px) 0 clamp(6px, 1.5vw, 10px) !important;
          }
          .eh-intake-btn-row {
            flex-direction: column !important;
          }
          .eh-intake-btn-row button {
            width: 100% !important;
          }
        }
        @media (max-width: 768px) {
          .eh-intake-grid-2 {
            gap: 12px;
          }
        }
      `}</style>

      {/* Progress bar */}
      <div className="eh-intake-progress-bar">
        <div
          className="eh-intake-progress-fill"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <div style={progressLabel}>
        {step === 0
          ? 'Let\'s get started'
          : `${completedSteps} of ${TOTAL_FORM_STEPS} steps complete · ${progressPct}%`}
      </div>

      {/* Step indicator dots — skip for welcome */}
      {step > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 6,
          marginBottom: 8,
          flexWrap: 'wrap',
        }}>
          {STEPS.filter((_, i) => i > 0).map((label, i) => {
            const realIndex = i + 1;
            const isCompleted = realIndex < step;
            return (
              <React.Fragment key={label}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <div style={
                    getStepCircle(realIndex === step, isCompleted)
                  }>
                    {isCompleted ? '✓' : i + 1}
                  </div>
                  <span style={{
                    fontSize: 'clamp(9px, 1.5vw, 10px)',
                    color: realIndex === step ? '#60a5fa' : isCompleted ? '#22c55e' : '#64748b',
                    fontWeight: realIndex === step ? 600 : 400,
                    whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 2 && (
                  <div className={`eh-intake-step-line${isCompleted ? ' eh-intake-step-line-completed' : ''}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* ── Step content with animation ── */}
      <div
        className={`eh-intake-step-content ${animDirection === 'forward' ? 'eh-intake-step-forward' : 'eh-intake-step-back'}`}
        key={step}
      >
        {/* ── Step 0: Welcome ── */}
        {step === 0 && (
          <div className="eh-intake-welcome" style={{
            textAlign: 'center',
            padding: 'clamp(20px, 5vw, 32px) 0 clamp(8px, 2vw, 16px)',
          }}>
            <div style={{
              fontSize: 'clamp(48px, 10vw, 64px)',
              marginBottom: 16,
              animation: 'eh-pulse-gentle 3s ease-in-out infinite',
            }}>
              🫀
            </div>
            <h2 style={{
              color: '#ffffff',
              fontSize: 'clamp(20px, 4vw, 26px)',
              fontWeight: 700,
              marginBottom: 12,
              marginTop: 0,
              lineHeight: 1.2,
            }}>
              Welcome to Your Executive Health Score
            </h2>
            <p style={{
              color: '#94a3b8',
              fontSize: 'clamp(14px, 2.3vw, 15px)',
              lineHeight: 1.7,
              maxWidth: 480,
              margin: '0 auto 8px',
              padding: '0 8px',
            }}>
              We&apos;ll ask a few questions about your lifestyle and health to generate your personalized assessment.
            </p>
            <p style={{
              color: '#64748b',
              fontSize: 'clamp(13px, 2vw, 14px)',
              lineHeight: 1.7,
              maxWidth: 420,
              margin: '0 auto 28px',
              padding: '0 8px',
            }}>
              It takes about <strong style={{ color: '#cbd5e1' }}>3 minutes</strong> and your answers help us build a complete picture of your health.
            </p>
            <button
              className="eh-intake-btn eh-intake-btn-success"
              style={{
                padding: 'clamp(14px, 3vw, 16px) clamp(32px, 6vw, 44px)',
                fontSize: 'clamp(15px, 2.5vw, 17px)',
                borderRadius: 12,
              }}
              onClick={handleNext}
            >
              Begin Assessment →
            </button>
          </div>
        )}

        {/* ── Step 1: About You ── */}
        {step === 1 && (
          <div>
            <div style={stepHeading}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🧑</div>
              <h3 style={stepTitle}>Let&apos;s get to know you</h3>
              <p style={stepSubtitle}>
                Basic details help us personalize your results and calculate important health metrics.
              </p>
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>How old are you?</label>
              <input
                type="number"
                min={18}
                max={120}
                value={fields.age}
                onChange={(e) => update('age', e.target.value === '' ? '' : Number(e.target.value))}
                style={darkInput}
                placeholder="Enter your age"
              />
              {errors.age && <div style={errorText}>{errors.age}</div>}
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>Sex</label>
              <div style={radioGroup}>
                {GENDER_OPTIONS.map((opt) => (
                  <div
                    key={opt.value}
                    style={getRadioOption(fields.gender === opt.value)}
                    onClick={() => update('gender', opt.value)}
                  >
                    <div style={getRadioDot(fields.gender === opt.value)} />
                    <span>{opt.emoji} {opt.label}</span>
                  </div>
                ))}
              </div>
              {errors.gender && <div style={errorText}>{errors.gender}</div>}
            </div>

            <div className="eh-intake-grid-2">
              <div style={fieldGroup}>
                <label style={labelStyle}>Height (cm)</label>
                <input
                  type="number"
                  min={100}
                  max={250}
                  value={fields.height_cm}
                  onChange={(e) => update('height_cm', e.target.value === '' ? '' : Number(e.target.value))}
                  style={darkInput}
                  placeholder="e.g. 175"
                />
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>Weight (kg)</label>
                <input
                  type="number"
                  min={30}
                  max={300}
                  value={fields.weight_kg}
                  onChange={(e) => update('weight_kg', e.target.value === '' ? '' : Number(e.target.value))}
                  style={darkInput}
                  placeholder="e.g. 78"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Daily Habits ── */}
        {step === 2 && (
          <div>
            <div style={stepHeading}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🏃</div>
              <h3 style={stepTitle}>How&apos;s your daily routine?</h3>
              <p style={stepSubtitle}>
                Your day-to-day choices have a big impact on long-term health. Be honest — there are no wrong answers.
              </p>
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>How active are you during a typical week?</label>
              <select
                value={fields.activity_level}
                onChange={(e) => update('activity_level', e.target.value)}
                style={darkSelect}
              >
                <option value="">Select your activity level</option>
                {ACTIVITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {errors.activity_level && <div style={errorText}>{errors.activity_level}</div>}
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>Do you smoke?</label>
              <select
                value={fields.smoking_status}
                onChange={(e) => update('smoking_status', e.target.value)}
                style={darkSelect}
              >
                <option value="">Select an option</option>
                {SMOKING_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {errors.smoking_status && <div style={errorText}>{errors.smoking_status}</div>}
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>How often do you drink alcohol?</label>
              <select
                value={fields.alcohol_frequency}
                onChange={(e) => update('alcohol_frequency', e.target.value)}
                style={darkSelect}
              >
                <option value="">Select frequency</option>
                {ALCOHOL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {errors.alcohol_frequency && <div style={errorText}>{errors.alcohol_frequency}</div>}
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>How would you describe your eating habits?</label>
              <select
                value={fields.diet_quality}
                onChange={(e) => update('diet_quality', e.target.value)}
                style={darkSelect}
              >
                <option value="">Describe your diet</option>
                {DIET_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {errors.diet_quality && <div style={errorText}>{errors.diet_quality}</div>}
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>How many hours a week do you work? (optional)</label>
              <input
                type="number"
                min={0}
                max={168}
                value={fields.work_hours_per_week}
                onChange={(e) => update('work_hours_per_week', e.target.value === '' ? '' : Number(e.target.value))}
                style={darkInput}
                placeholder="e.g. 40"
              />
            </div>
          </div>
        )}

        {/* ── Step 3: Rest & Recovery ── */}
        {step === 3 && (
          <div>
            <div style={stepHeading}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🌙</div>
              <h3 style={stepTitle}>How are you resting and recovering?</h3>
              <p style={stepSubtitle}>
                Sleep and stress management are foundational to executive performance and long-term health.
              </p>
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>
                How many hours of sleep do you typically get? &nbsp;
                <span style={{ color: '#60a5fa', fontWeight: 700, fontSize: 'clamp(14px, 2.2vw, 16px)' }}>
                  {fields.sleep_hours || 7}h
                </span>
              </label>
              <input
                type="range"
                min={3}
                max={14}
                step={0.5}
                value={fields.sleep_hours || 7}
                onChange={(e) => update('sleep_hours', Number(e.target.value))}
                className="eh-intake-range"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginTop: 4 }}>
                <span>3h</span><span>7h</span><span>14h</span>
              </div>
              {errors.sleep_hours && <div style={errorText}>{errors.sleep_hours}</div>}
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>How well do you sleep?</label>
              <select
                value={fields.sleep_quality}
                onChange={(e) => update('sleep_quality', e.target.value)}
                style={darkSelect}
              >
                <option value="">Describe your sleep quality</option>
                {SLEEP_QUALITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {errors.sleep_quality && <div style={errorText}>{errors.sleep_quality}</div>}
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>How would you rate your stress levels?</label>
              <select
                value={fields.stress_level}
                onChange={(e) => update('stress_level', e.target.value)}
                style={darkSelect}
              >
                <option value="">Describe your stress level</option>
                {STRESS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {errors.stress_level && <div style={errorText}>{errors.stress_level}</div>}
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>How connected do you feel socially? (optional)</label>
              <select
                value={fields.social_connections}
                onChange={(e) => update('social_connections', e.target.value)}
                style={darkSelect}
              >
                <option value="">Describe your social life</option>
                {SOCIAL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ── Step 4: Health Background ── */}
        {step === 4 && (
          <div>
            <div style={stepHeading}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🏥</div>
              <h3 style={stepTitle}>What&apos;s your health background?</h3>
              <p style={stepSubtitle}>
                This helps us identify risk factors and tailor our recommendations. Everything here is confidential.
              </p>
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>Any chronic conditions? <span style={{ color: '#64748b', fontWeight: 400 }}>(select all that apply)</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CHRONIC_CONDITIONS.map((c) => (
                  <span
                    key={c}
                    style={getTagStyle(fields.chronic_conditions.includes(c))}
                    onClick={() => toggleArray('chronic_conditions', c)}
                  >
                    {fields.chronic_conditions.includes(c) ? '✓ ' : ''}{c}
                  </span>
                ))}
              </div>
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>Current medications? <span style={{ color: '#64748b', fontWeight: 400 }}>(separate with commas)</span></label>
              <input
                type="text"
                value={fields.medications}
                onChange={(e) => update('medications', e.target.value)}
                style={darkInput}
                placeholder="e.g. Lisinopril, Metformin, Atorvastatin"
              />
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>Conditions that run in your family? <span style={{ color: '#64748b', fontWeight: 400 }}>(select all that apply)</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {FAMILY_HISTORY_OPTIONS.map((c) => (
                  <span
                    key={c}
                    style={getTagStyle(fields.family_history.includes(c))}
                    onClick={() => toggleArray('family_history', c)}
                  >
                    {fields.family_history.includes(c) ? '✓ ' : ''}{c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 5: Vitals ── */}
        {step === 5 && (
          <div>
            <div style={stepHeading}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🩺</div>
              <h3 style={stepTitle}>Got recent vitals?</h3>
              <p style={stepSubtitle}>
                If you&apos;ve had a checkup recently, your numbers help us be more precise.
              </p>
            </div>

            <div style={skipNote}>
              💡 <strong style={{ color: '#cbd5e1' }}>Don&apos;t have these numbers handy?</strong> No problem — just skip this section.
              We&apos;ll estimate based on your other answers and you can add them later.
            </div>

            <div className="eh-intake-grid-2">
              <div style={fieldGroup}>
                <label style={labelStyle}>Systolic BP (mmHg)</label>
                <input
                  type="number"
                  min={70}
                  max={250}
                  value={fields.systolic_bp}
                  onChange={(e) => update('systolic_bp', e.target.value === '' ? '' : Number(e.target.value))}
                  style={darkInput}
                  placeholder="e.g. 120"
                />
                {errors.systolic_bp && <div style={errorText}>{errors.systolic_bp}</div>}
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>Diastolic BP (mmHg)</label>
                <input
                  type="number"
                  min={40}
                  max={150}
                  value={fields.diastolic_bp}
                  onChange={(e) => update('diastolic_bp', e.target.value === '' ? '' : Number(e.target.value))}
                  style={darkInput}
                  placeholder="e.g. 80"
                />
                {errors.diastolic_bp && <div style={errorText}>{errors.diastolic_bp}</div>}
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>Resting Heart Rate (bpm)</label>
                <input
                  type="number"
                  min={30}
                  max={220}
                  value={fields.resting_hr}
                  onChange={(e) => update('resting_hr', e.target.value === '' ? '' : Number(e.target.value))}
                  style={darkInput}
                  placeholder="e.g. 68"
                />
                {errors.resting_hr && <div style={errorText}>{errors.resting_hr}</div>}
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>Total Cholesterol (mg/dL)</label>
                <input
                  type="number"
                  min={100}
                  max={500}
                  value={fields.cholesterol_total}
                  onChange={(e) => update('cholesterol_total', e.target.value === '' ? '' : Number(e.target.value))}
                  style={darkInput}
                  placeholder="e.g. 190"
                />
                {errors.cholesterol_total && <div style={errorText}>{errors.cholesterol_total}</div>}
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>HDL Cholesterol (mg/dL)</label>
                <input
                  type="number"
                  min={10}
                  max={150}
                  value={fields.hdl_cholesterol}
                  onChange={(e) => update('hdl_cholesterol', e.target.value === '' ? '' : Number(e.target.value))}
                  style={darkInput}
                  placeholder="e.g. 55"
                />
                {errors.hdl_cholesterol && <div style={errorText}>{errors.hdl_cholesterol}</div>}
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>Fasting Glucose (mg/dL)</label>
                <input
                  type="number"
                  min={50}
                  max={400}
                  value={fields.fasting_glucose}
                  onChange={(e) => update('fasting_glucose', e.target.value === '' ? '' : Number(e.target.value))}
                  style={darkInput}
                  placeholder="e.g. 95"
                />
                {errors.fasting_glucose && <div style={errorText}>{errors.fasting_glucose}</div>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation Buttons ── */}
      {step > 0 && (
        <div
          className="eh-intake-btn-row"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 32,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <button
            className="eh-intake-btn eh-intake-btn-secondary"
            onClick={handlePrev}
            disabled={isSubmitting}
          >
            ← Back
          </button>

          {step < STEPS.length - 1 ? (
            <button className="eh-intake-btn eh-intake-btn-primary" onClick={handleNext}>
              Continue →
            </button>
          ) : (
            <button
              className={`eh-intake-btn ${isSubmitting ? '' : 'eh-intake-btn-success'}`}
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={isSubmitting ? {
                backgroundColor: '#1e293b',
                color: '#64748b',
                cursor: 'not-allowed',
                padding: 'clamp(12px, 2.5vw, 14px) clamp(24px, 5vw, 32px)',
                minHeight: 48,
                border: 'none',
                borderRadius: 10,
                fontSize: 'clamp(14px, 2.2vw, 15px)',
                fontWeight: 600,
              } : {
                padding: 'clamp(12px, 2.5vw, 14px) clamp(24px, 5vw, 32px)',
                minHeight: 48,
                borderRadius: 12,
              }}
            >
              {isSubmitting ? 'Generating Your Score...' : '✨ Generate My Health Score'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default IntakeMultiStepForm;
