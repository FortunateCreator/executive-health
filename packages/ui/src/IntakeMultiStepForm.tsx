import React, { useState, useCallback } from 'react';
import type { IntakeFormData } from '@executive-health/core';

interface IntakeMultiStepFormProps {
  onSubmit: (data: IntakeFormData) => void;
  isSubmitting?: boolean;
}

// ── Styles ──────────────────────────────────────────────────
const darkInput: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #2a2a4e',
  backgroundColor: '#16213e',
  color: '#e2e8f0',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

const darkSelect: React.CSSProperties = {
  ...darkInput,
  appearance: 'none',
  cursor: 'pointer',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontSize: 13,
  fontWeight: 500,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const fieldGroup: React.CSSProperties = {
  marginBottom: 20,
};

const errorText: React.CSSProperties = {
  color: '#ef4444',
  fontSize: 12,
  marginTop: 4,
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#1a1a2e',
  borderRadius: 12,
  padding: 32,
  maxWidth: 640,
  width: '100%',
  margin: '0 auto',
};

const btnBase: React.CSSProperties = {
  padding: '10px 24px',
  borderRadius: 8,
  border: 'none',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.15s',
};

const btnPrimary: React.CSSProperties = {
  ...btnBase,
  backgroundColor: '#0f3460',
  color: '#ffffff',
};

const btnSecondary: React.CSSProperties = {
  ...btnBase,
  backgroundColor: 'transparent',
  color: '#94a3b8',
  border: '1px solid #2a2a4e',
};

const btnDisabled: React.CSSProperties = {
  ...btnBase,
  backgroundColor: '#1e293b',
  color: '#64748b',
  cursor: 'not-allowed',
};

const stepIndicatorContainer: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: 8,
  marginBottom: 28,
};

const stepCircle = (active: boolean, completed: boolean): React.CSSProperties => ({
  width: 32,
  height: 32,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 13,
  fontWeight: 700,
  backgroundColor: active ? '#0f3460' : completed ? '#22c55e' : '#16213e',
  color: '#ffffff',
  border: active ? '2px solid #60a5fa' : '2px solid #2a2a4e',
});

const stepLine: React.CSSProperties = {
  width: 24,
  height: 2,
  backgroundColor: '#2a2a4e',
  alignSelf: 'center',
  marginTop: -2,
};

const buttonRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: 28,
};

const tagStyle = (selected: boolean): React.CSSProperties => ({
  padding: '6px 14px',
  borderRadius: 9999,
  border: selected ? '2px solid #60a5fa' : '1px solid #2a2a4e',
  backgroundColor: selected ? '#0f3460' : '#16213e',
  color: selected ? '#ffffff' : '#94a3b8',
  fontSize: 13,
  cursor: 'pointer',
  transition: 'all 0.15s',
  whiteSpace: 'nowrap',
});

const rangeInput: React.CSSProperties = {
  ...darkInput,
  padding: '8px 12px',
};

// ── Step definitions ────────────────────────────────────────
const STEPS = ['Basic Info', 'Lifestyle', 'Sleep & Stress', 'Health History', 'Vitals'];

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Lightly Active' },
  { value: 'moderate', label: 'Moderately Active' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very Active' },
];

const SMOKING_OPTIONS = [
  { value: 'never', label: 'Never Smoked' },
  { value: 'former', label: 'Former Smoker' },
  { value: 'current', label: 'Current Smoker' },
];

const ALCOHOL_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'occasionally', label: 'Occasionally' },
  { value: 'moderately', label: 'Moderately' },
  { value: 'frequently', label: 'Frequently' },
];

const DIET_OPTIONS = [
  { value: 'poor', label: 'Poor' },
  { value: 'fair', label: 'Fair' },
  { value: 'good', label: 'Good' },
  { value: 'excellent', label: 'Excellent' },
];

const SLEEP_QUALITY_OPTIONS = [
  { value: 'poor', label: 'Poor' },
  { value: 'fair', label: 'Fair' },
  { value: 'good', label: 'Good' },
  { value: 'excellent', label: 'Excellent' },
];

const STRESS_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
  { value: 'very_high', label: 'Very High' },
];

const SOCIAL_OPTIONS = [
  { value: 'isolated', label: 'Isolated' },
  { value: 'limited', label: 'Limited' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'strong', label: 'Strong' },
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
  sleep_hours: '',
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
          if (fields.age === '' || Number(fields.age) < 18 || Number(fields.age) > 120)
            errs.age = 'Age must be 18–120';
          if (!fields.gender) errs.gender = 'Please select gender';
          break;
        }
        case 1: {
          if (!fields.activity_level) errs.activity_level = 'Required';
          if (!fields.smoking_status) errs.smoking_status = 'Required';
          if (!fields.alcohol_frequency) errs.alcohol_frequency = 'Required';
          if (!fields.diet_quality) errs.diet_quality = 'Required';
          break;
        }
        case 2: {
          if (fields.sleep_hours === '' || Number(fields.sleep_hours) < 3 || Number(fields.sleep_hours) > 14)
            errs.sleep_hours = 'Sleep hours must be 3–14';
          if (!fields.sleep_quality) errs.sleep_quality = 'Required';
          if (!fields.stress_level) errs.stress_level = 'Required';
          break;
        }
        case 3: {
          // Health History — all optional
          break;
        }
        case 4: {
          // Vitals — all optional, but validate ranges if provided
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
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  };

  const handlePrev = () => setStep((s) => Math.max(s - 1, 0));

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

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={cardStyle}>
      {/* Step indicator */}
      <div style={stepIndicatorContainer}>
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={stepCircle(i === step, i < step)}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 10, color: i === step ? '#60a5fa' : '#64748b', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && <div style={stepLine} />}
          </React.Fragment>
        ))}
      </div>

      {/* ── Step 0: Basic Info ── */}
      {step === 0 && (
        <div>
          <h3 style={{ color: '#ffffff', fontSize: 18, marginBottom: 20 }}>Basic Information</h3>

          <div style={fieldGroup}>
            <label style={labelStyle}>Age</label>
            <input
              type="number"
              min={18}
              max={120}
              value={fields.age}
              onChange={(e) => update('age', e.target.value === '' ? '' : Number(e.target.value))}
              style={darkInput}
              placeholder="e.g. 42"
            />
            {errors.age && <div style={errorText}>{errors.age}</div>}
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Gender</label>
            <select
              value={fields.gender}
              onChange={(e) => update('gender', e.target.value)}
              style={darkSelect}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && <div style={errorText}>{errors.gender}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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

      {/* ── Step 1: Lifestyle ── */}
      {step === 1 && (
        <div>
          <h3 style={{ color: '#ffffff', fontSize: 18, marginBottom: 20 }}>Lifestyle</h3>

          <div style={fieldGroup}>
            <label style={labelStyle}>Activity Level</label>
            <select
              value={fields.activity_level}
              onChange={(e) => update('activity_level', e.target.value)}
              style={darkSelect}
            >
              <option value="">Select activity level</option>
              {ACTIVITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {errors.activity_level && <div style={errorText}>{errors.activity_level}</div>}
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Smoking Status</label>
            <select
              value={fields.smoking_status}
              onChange={(e) => update('smoking_status', e.target.value)}
              style={darkSelect}
            >
              <option value="">Select smoking status</option>
              {SMOKING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {errors.smoking_status && <div style={errorText}>{errors.smoking_status}</div>}
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Alcohol Frequency</label>
            <select
              value={fields.alcohol_frequency}
              onChange={(e) => update('alcohol_frequency', e.target.value)}
              style={darkSelect}
            >
              <option value="">Select alcohol frequency</option>
              {ALCOHOL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {errors.alcohol_frequency && <div style={errorText}>{errors.alcohol_frequency}</div>}
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Diet Quality</label>
            <select
              value={fields.diet_quality}
              onChange={(e) => update('diet_quality', e.target.value)}
              style={darkSelect}
            >
              <option value="">Select diet quality</option>
              {DIET_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {errors.diet_quality && <div style={errorText}>{errors.diet_quality}</div>}
          </div>
        </div>
      )}

      {/* ── Step 2: Sleep & Stress ── */}
      {step === 2 && (
        <div>
          <h3 style={{ color: '#ffffff', fontSize: 18, marginBottom: 20 }}>Sleep & Stress</h3>

          <div style={fieldGroup}>
            <label style={labelStyle}>Sleep Hours (per night): {fields.sleep_hours || '—'}</label>
            <input
              type="range"
              min={3}
              max={14}
              step={0.5}
              value={fields.sleep_hours || 7}
              onChange={(e) => update('sleep_hours', Number(e.target.value))}
              style={{ width: '100%', accentColor: '#0f3460' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b' }}>
              <span>3h</span><span>7h</span><span>14h</span>
            </div>
            {errors.sleep_hours && <div style={errorText}>{errors.sleep_hours}</div>}
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Sleep Quality</label>
            <select
              value={fields.sleep_quality}
              onChange={(e) => update('sleep_quality', e.target.value)}
              style={darkSelect}
            >
              <option value="">Select sleep quality</option>
              {SLEEP_QUALITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {errors.sleep_quality && <div style={errorText}>{errors.sleep_quality}</div>}
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Stress Level</label>
            <select
              value={fields.stress_level}
              onChange={(e) => update('stress_level', e.target.value)}
              style={darkSelect}
            >
              <option value="">Select stress level</option>
              {STRESS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {errors.stress_level && <div style={errorText}>{errors.stress_level}</div>}
          </div>
        </div>
      )}

      {/* ── Step 3: Health History ── */}
      {step === 3 && (
        <div>
          <h3 style={{ color: '#ffffff', fontSize: 18, marginBottom: 20 }}>Health History</h3>

          <div style={fieldGroup}>
            <label style={labelStyle}>Chronic Conditions</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CHRONIC_CONDITIONS.map((c) => (
                <span
                  key={c}
                  style={tagStyle(fields.chronic_conditions.includes(c))}
                  onClick={() => toggleArray('chronic_conditions', c)}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Medications (comma-separated)</label>
            <input
              type="text"
              value={fields.medications}
              onChange={(e) => update('medications', e.target.value)}
              style={darkInput}
              placeholder="e.g. Lisinopril, Metformin"
            />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Family History</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {FAMILY_HISTORY_OPTIONS.map((c) => (
                <span
                  key={c}
                  style={tagStyle(fields.family_history.includes(c))}
                  onClick={() => toggleArray('family_history', c)}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={fieldGroup}>
              <label style={labelStyle}>Work Hours / Week</label>
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
            <div style={fieldGroup}>
              <label style={labelStyle}>Social Connections</label>
              <select
                value={fields.social_connections}
                onChange={(e) => update('social_connections', e.target.value)}
                style={darkSelect}
              >
                <option value="">Select</option>
                {SOCIAL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 4: Vitals ── */}
      {step === 4 && (
        <div>
          <h3 style={{ color: '#ffffff', fontSize: 18, marginBottom: 20 }}>Vitals (optional)</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
              <label style={labelStyle}>Resting HR (bpm)</label>
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

      {/* ── Navigation Buttons ── */}
      <div style={buttonRow}>
        <button
          style={step === 0 ? { ...btnSecondary, visibility: 'hidden' } : btnSecondary}
          onClick={handlePrev}
          disabled={isSubmitting}
        >
          ← Previous
        </button>

        {step < STEPS.length - 1 ? (
          <button style={btnPrimary} onClick={handleNext}>
            Next →
          </button>
        ) : (
          <button
            style={isSubmitting ? btnDisabled : { ...btnPrimary, backgroundColor: '#22c55e' }}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
          </button>
        )}
      </div>
    </div>
  );
};

export default IntakeMultiStepForm;
