import { z } from 'zod';

// === ENUMS ===
export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type SmokingStatus = 'never' | 'former' | 'current';
export type AlcoholFrequency = 'never' | 'occasionally' | 'moderately' | 'frequently';
export type DietQuality = 'poor' | 'fair' | 'good' | 'excellent';
export type SleepQuality = 'poor' | 'fair' | 'good' | 'excellent';
export type StressLevel = 'low' | 'moderate' | 'high' | 'very_high';
export type RiskCategory = 'low' | 'moderate' | 'high' | 'critical';

// === INTAKE SCHEMA ===
export const intakeFormSchema = z.object({
  age: z.number().min(18).max(120),
  gender: z.enum(['male', 'female', 'other']),
  height_cm: z.number().min(100).max(250).optional(),
  weight_kg: z.number().min(30).max(300).optional(),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  smoking_status: z.enum(['never', 'former', 'current']),
  alcohol_frequency: z.enum(['never', 'occasionally', 'moderately', 'frequently']),
  diet_quality: z.enum(['poor', 'fair', 'good', 'excellent']),
  sleep_hours: z.number().min(3).max(14),
  sleep_quality: z.enum(['poor', 'fair', 'good', 'excellent']),
  stress_level: z.enum(['low', 'moderate', 'high', 'very_high']),
  chronic_conditions: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  family_history: z.array(z.string()).default([]),
  systolic_bp: z.number().min(70).max(250).optional(),
  diastolic_bp: z.number().min(40).max(150).optional(),
  resting_hr: z.number().min(30).max(220).optional(),
  cholesterol_total: z.number().min(100).max(500).optional(),
  hdl_cholesterol: z.number().min(10).max(150).optional(),
  fasting_glucose: z.number().min(50).max(400).optional(),
  bmi: z.number().min(12).max(60).optional(),
  work_hours_per_week: z.number().min(0).max(168).optional(),
  social_connections: z.enum(['isolated', 'limited', 'moderate', 'strong']).optional(),
});

export type IntakeFormData = z.infer<typeof intakeFormSchema>;

// === HEALTH SCORE ===
export interface DetailedRecommendation {
  heading: string;
  detail: string;
  action: string;
  category: 'cardiovascular' | 'metabolic' | 'lifestyle' | 'mental_wellbeing' | 'general';
}

export interface HealthScore {
  overall: number;           // 0-100
  cardiovascular: number;
  metabolic: number;
  lifestyle: number;
  mental_wellbeing: number;
  risk_category: RiskCategory;
  risk_factors: RiskFactor[];
  recommendations: DetailedRecommendation[];
  score_breakdown: ScoreBreakdown[];
  calculated_at: string;     // ISO date
}

export interface RiskFactor {
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
}

export interface ScoreBreakdown {
  category: string;
  score: number;
  weight: number;
  details: string;
}

// === CHAT ===
export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  session_id?: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

// === USER ===
export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  last_intake_date: string | null;
  last_score: number | null;
}

// === API ===
export interface ScoreResponse {
  score: HealthScore;
  intake_data: IntakeFormData;
}

export interface ApiError {
  error: string;
  code: string;
  details?: unknown;
}

// === ORGANIZATION ===
export type OrgRole = 'super_admin' | 'admin' | 'manager' | 'viewer';
export type OrgMemberStatus = 'invited' | 'active' | 'suspended';
export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'enterprise';
export type InviteStatus = 'pending' | 'accepted' | 'expired';
export type OrgSize = '1-10' | '11-50' | '51-200' | '201-1000' | '1000+';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  industry?: string;
  size?: OrgSize;
  subscription_tier: SubscriptionTier;
  settings: {
    wellness_programs_enabled: boolean;
    auto_invite_domain?: string;
    data_retention_days: number;
  };
  created_at: string;
  updated_at: string;
}

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  email: string;
  display_name: string;
  role: OrgRole;
  department_id?: string;
  invited_by?: string;
  status: OrgMemberStatus;
  joined_at?: string;
  created_at: string;
}

export interface Department {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  head_count: number;
  created_at: string;
  updated_at: string;
}

export interface OrgInvite {
  id: string;
  org_id: string;
  email: string;
  role: OrgRole;
  department_id?: string;
  token: string;
  invited_by: string;
  invited_by_name: string;
  status: InviteStatus;
  expires_at: string;
  created_at: string;
}

export interface OrgAnalytics {
  org_id: string;
  total_members: number;
  active_members: number;
  engagement_rate: number;
  average_health_score: number;
  health_score_trend: Array<{ date: string; score: number }>;
  department_breakdown: Array<{ department: string; members: number; avg_score: number; engagement: number }>;
  risk_distribution: { low: number; moderate: number; high: number; critical: number };
  sleep_avg_hours: number;
  stress_avg_level: number;
  last_updated: string;
}

// === CLINICAL ===
export type StaffRole = 'clinician' | 'nurse' | 'admin' | 'supervisor';
export type NoteType = 'soap' | 'progress' | 'consult' | 'discharge';

export interface ClinicalStaff {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  title: string;
  specialization?: string;
  role: StaffRole;
  license_number?: string;
  created_at: string;
}

export interface ClinicalNote {
  id: string;
  patient_user_id: string;
  staff_id: string;
  staff_name: string;
  note_type: NoteType;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientSummary {
  user_id: string;
  display_name: string;
  email: string;
  risk_category: string;
  last_score: number;
  days_since_assessment: number;
  last_appointment?: string;
  assigned_staff_name?: string;
}
