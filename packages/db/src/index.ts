import fs from 'fs';
import path from 'path';
import type { IntakeFormData, HealthScore, UserProfile, ChatMessage, Organization, OrgMember, Department, OrgInvite, ClinicalStaff, ClinicalNote } from '@executive-health/core';

// === HYBRID STORAGE: file (local) / Vercel Blob (production) ===
const DATA_DIR = path.resolve(process.cwd(), 'data');
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

// In-memory cache for blob mode — survives a single request on Vercel
const cache = new Map<string, any[]>();
let syncTimer: ReturnType<typeof setTimeout> | null = null;

async function syncToBlob(name: string, data: any[]): Promise<void> {
  if (!useBlob) return;
  try {
    const { put } = await import('@vercel/blob');
    await put(`executive-health/${name}.json`, JSON.stringify(data, null, 2), {
      access: 'public',
      addRandomSuffix: false,
    });
  } catch (e) {
    console.error(`Blob sync failed for ${name}:`, e);
  }
}

async function loadFromBlob<T>(name: string): Promise<T[]> {
  try {
    const { list } = await import('@vercel/blob');
    const result = await list({ prefix: `executive-health/${name}.json` });
    if (result.blobs.length === 0) return [];
    const resp = await fetch(result.blobs[0].url);
    return await resp.json();
  } catch {
    return [];
  }
}

function readStore<T>(name: string): T[] {
  if (useBlob) {
    // Check cache first
    if (cache.has(name)) return cache.get(name) as T[];
    // Not cached yet — load synchronously via fs fallback or init empty
    // Blob data is loaded lazily on first non-cache hit
    return [];
  }

  // File backend
  const fp = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(fp)) return [];
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf-8'));
  } catch {
    return [];
  }
}

function writeStore<T>(name: string, data: T[]): void {
  if (useBlob) {
    cache.set(name, data);
    // Debounce sync to blob (within a single request)
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => syncToBlob(name, data), 100);
    return;
  }

  // File backend
  const fp = path.join(DATA_DIR, `${name}.json`);
  ensureDir(path.dirname(fp));
  fs.writeFileSync(fp, JSON.stringify(data, null, 2));
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Preload blob data on module load — happens once per cold start
if (useBlob) {
  (async () => {
    const tables = ['profiles', 'intake_responses', 'health_scores', 'chat_messages', 'users'];
    for (const t of tables) {
      const data = await loadFromBlob(t);
      cache.set(t, data);
    }
  })();
}


// === PROFILES ===
export function getProfile(userId: string): UserProfile | undefined {
  return readStore<UserProfile>('profiles').find(p => p.id === userId);
}

export function getAllProfiles(): UserProfile[] {
  return readStore<UserProfile>('profiles');
}

export function upsertProfile(profile: UserProfile): void {
  const profiles = readStore<UserProfile>('profiles');
  const idx = profiles.findIndex(p => p.id === profile.id);
  if (idx >= 0) profiles[idx] = profile;
  else profiles.push(profile);
  writeStore('profiles', profiles);
}

// === INTAKE RESPONSES ===
export interface IntakeRecord {
  id: string;
  user_id: string;
  data: IntakeFormData;
  created_at: string;
}

export function getIntakes(userId: string): IntakeRecord[] {
  return readStore<IntakeRecord>('intake_responses').filter(i => i.user_id === userId);
}

export function getLatestIntake(userId: string): IntakeRecord | undefined {
  const intakes = getIntakes(userId);
  return intakes.sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
}

export function saveIntake(record: IntakeRecord): void {
  const intakes = readStore<IntakeRecord>('intake_responses');
  intakes.push(record);
  writeStore('intake_responses', intakes);
}

// === HEALTH SCORES ===
export interface ScoreRecord {
  id: string;
  user_id: string;
  overall_score: number;
  score_data: HealthScore;
  intake_id: string;
  created_at: string;
}

export function getScores(userId: string): ScoreRecord[] {
  return readStore<ScoreRecord>('health_scores').filter(s => s.user_id === userId);
}

export function getLatestScore(userId: string): ScoreRecord | undefined {
  const scores = getScores(userId);
  return scores.sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
}

export function saveScore(record: ScoreRecord): void {
  const scores = readStore<ScoreRecord>('health_scores');
  scores.push(record);
  writeStore('health_scores', scores);
}

// === CHAT MESSAGES ===
export function getChatMessages(userId: string, sessionId?: string): ChatMessage[] {
  let msgs = readStore<ChatMessage>('chat_messages').filter(m => m.user_id === userId);
  if (sessionId) msgs = msgs.filter(m => m.session_id === sessionId);
  return msgs.sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function saveChatMessage(msg: ChatMessage): void {
  const msgs = readStore<ChatMessage>('chat_messages');
  msgs.push(msg);
  writeStore('chat_messages', msgs);
}

// === AUTH ===
export interface AuthUser {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  created_at: string;
}

export function getUserByEmail(email: string): AuthUser | undefined {
  return readStore<AuthUser>('users').find(u => u.email === email);
}

export function getUserById(id: string): AuthUser | undefined {
  return readStore<AuthUser>('users').find(u => u.id === id);
}

export function saveUser(user: AuthUser): void {
  const users = readStore<AuthUser>('users');
  users.push(user);
  writeStore('users', users);
}

export function updateUserPassword(id: string, newHash: string): void {
  const users = readStore<AuthUser>('users');
  const idx = users.findIndex(u => u.id === id);
  if (idx >= 0) {
    users[idx] = { ...users[idx], password_hash: newHash };
    writeStore('users', users);
  }
}

// === PASSWORD RESET CODES ===
export interface ResetCode {
  email: string;
  code: string;
  expires_at: string; // ISO timestamp
}

export function saveResetCode(email: string, code: string): void {
  const codes = readStore<ResetCode>('reset_codes').filter(c => c.email !== email); // remove old
  const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15min
  codes.push({ email, code, expires_at });
  writeStore('reset_codes', codes);
}

export function getResetCode(email: string): ResetCode | undefined {
  const codes = readStore<ResetCode>('reset_codes').filter(c => c.email === email);
  return codes.sort((a, b) => b.expires_at.localeCompare(a.expires_at))[0];
}

export function deleteResetCode(email: string): void {
  const codes = readStore<ResetCode>('reset_codes').filter(c => c.email !== email);
  writeStore('reset_codes', codes);
}

// === SLEEP ===
export interface SleepRecord {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  bedtime: string; // ISO datetime
  wake_time: string; // ISO datetime
  duration_minutes: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  interruptions: number;
  deep_sleep_minutes?: number;
  rem_sleep_minutes?: number;
  heart_rate_variability?: number;
  notes?: string;
  created_at: string;
  source: 'manual' | 'wearable' | 'idle_detected';
}

export function saveSleepRecord(record: SleepRecord): void {
  const records = readStore<SleepRecord>('sleep_records');
  records.push(record);
  writeStore('sleep_records', records);
}

export function getSleepRecords(userId: string, limit?: number): SleepRecord[] {
  const records = readStore<SleepRecord>('sleep_records')
    .filter(r => r.user_id === userId)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (limit) return records.slice(0, limit);
  return records;
}

export function getSleepRecordsByDateRange(userId: string, startDate: string, endDate: string): SleepRecord[] {
  return readStore<SleepRecord>('sleep_records')
    .filter(r => r.user_id === userId && r.date >= startDate && r.date <= endDate)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function deleteSleepRecord(id: string): void {
  const records = readStore<SleepRecord>('sleep_records');
  writeStore('sleep_records', records.filter(r => r.id !== id));
}

// === NUTRITION ===
export interface MealLog {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: FoodItem[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_sodium_mg: number;
  cuisine: 'nigerian' | 'western' | 'asian' | 'mediterranean' | 'other';
  notes?: string;
  created_at: string;
}

export interface FoodItem {
  name: string;
  portion: string; // e.g. "1 cup", "200g"
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  sodium_mg: number;
}

export interface NutritionGoal {
  id: string;
  user_id: string;
  daily_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  sodium_mg: number; // max
  cuisine_preference: string[];
  dietary_restrictions: string[];
  created_at: string;
  updated_at: string;
}

export interface MealPlan {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  meals: { meal_type: string; suggestions: string[]; calories: number }[];
  total_calories: number;
  notes?: string;
  created_at: string;
}

export function saveMealLog(record: MealLog): void {
  const records = readStore<MealLog>('meal_logs');
  records.push(record);
  writeStore('meal_logs', records);
}

export function getMealLogs(userId: string, limit?: number): MealLog[] {
  const records = readStore<MealLog>('meal_logs')
    .filter(r => r.user_id === userId)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (limit) return records.slice(0, limit);
  return records;
}

export function getMealLogsByDateRange(userId: string, start: string, end: string): MealLog[] {
  return readStore<MealLog>('meal_logs')
    .filter(r => r.user_id === userId && r.date >= start && r.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function saveNutritionGoal(goal: NutritionGoal): void {
  const goals = readStore<NutritionGoal>('nutrition_goals');
  const idx = goals.findIndex(g => g.user_id === goal.user_id);
  if (idx >= 0) goals[idx] = goal;
  else goals.push(goal);
  writeStore('nutrition_goals', goals);
}

export function getNutritionGoal(userId: string): NutritionGoal | undefined {
  return readStore<NutritionGoal>('nutrition_goals').find(g => g.user_id === userId);
}

export function saveMealPlan(plan: MealPlan): void {
  const plans = readStore<MealPlan>('meal_plans');
  plans.push(plan);
  writeStore('meal_plans', plans);
}

export function getMealPlans(userId: string, limit?: number): MealPlan[] {
  const records = readStore<MealPlan>('meal_plans')
    .filter(r => r.user_id === userId)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (limit) return records.slice(0, limit);
  return records;
}

// === STRESS ===
export interface MoodCheckIn {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  time_of_day: 'morning' | 'afternoon' | 'evening';
  mood_score: number; // 1-10
  stress_level: number; // 1-10
  energy_level: number; // 1-10
  anxiety_level: number; // 1-10
  workload_score?: number; // 1-10 optional
  sleep_quality?: number; // 1-10 optional
  triggers?: string[];
  notes?: string;
  created_at: string;
}

export interface BurnoutAssessment {
  id: string;
  user_id: string;
  date: string;
  exhaustion_score: number; // 0-100 derived from recent mood data
  cynicism_score: number;
  efficacy_score: number;
  overall_burnout_risk: 'low' | 'moderate' | 'high' | 'critical';
  recommendation: string;
  calculated_at: string;
}

export function saveMoodCheckIn(checkin: MoodCheckIn): void {
  const records = readStore<MoodCheckIn>('mood_checkins');
  records.push(checkin);
  writeStore('mood_checkins', records);
}

export function getMoodCheckIns(userId: string, limit?: number): MoodCheckIn[] {
  const records = readStore<MoodCheckIn>('mood_checkins')
    .filter(r => r.user_id === userId)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (limit) return records.slice(0, limit);
  return records;
}

export function getMoodCheckInsByDateRange(userId: string, start: string, end: string): MoodCheckIn[] {
  return readStore<MoodCheckIn>('mood_checkins')
    .filter(r => r.user_id === userId && r.date >= start && r.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function saveBurnoutAssessment(assessment: BurnoutAssessment): void {
  const records = readStore<BurnoutAssessment>('burnout_assessments');
  records.push(assessment);
  writeStore('burnout_assessments', records);
}

export function getLatestBurnoutAssessment(userId: string): BurnoutAssessment | undefined {
  const records = readStore<BurnoutAssessment>('burnout_assessments')
    .filter(r => r.user_id === userId)
    .sort((a, b) => b.calculated_at.localeCompare(a.calculated_at));
  return records[0];
}

// === CONCIERGE ===
export type ServiceType = 'lab_test' | 'doctor_appointment' | 'emergency_support' | 'prescription_refill' | 'health_screening' | 'other';
export type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface ServiceRequest {
  id: string;
  user_id: string;
  service_type: ServiceType;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: RequestStatus;
  scheduled_date?: string;
  provider_name?: string;
  provider_notes?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  title: string;
  description: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  provider_name: string;
  location: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  reminder_before_minutes: number;
  created_at: string;
}

export interface ConciergeMessage {
  id: string;
  user_id: string;
  sender: 'user' | 'concierge' | 'ai';
  message: string;
  request_id?: string;
  created_at: string;
}

export function saveServiceRequest(req: ServiceRequest): void {
  const requests = readStore<ServiceRequest>('service_requests');
  const idx = requests.findIndex(r => r.id === req.id);
  if (idx >= 0) requests[idx] = req;
  else requests.push(req);
  writeStore('service_requests', requests);
}

export function getServiceRequests(userId: string): ServiceRequest[] {
  return readStore<ServiceRequest>('service_requests')
    .filter(r => r.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function updateServiceRequest(id: string, updates: Partial<ServiceRequest>): void {
  const requests = readStore<ServiceRequest>('service_requests');
  const idx = requests.findIndex(r => r.id === id);
  if (idx >= 0) {
    requests[idx] = { ...requests[idx], ...updates, updated_at: new Date().toISOString() };
    writeStore('service_requests', requests);
  }
}

export function saveAppointment(appt: Appointment): void {
  const appointments = readStore<Appointment>('appointments');
  const idx = appointments.findIndex(a => a.id === appt.id);
  if (idx >= 0) appointments[idx] = appt;
  else appointments.push(appt);
  writeStore('appointments', appointments);
}

export function getAppointments(userId: string): Appointment[] {
  return readStore<Appointment>('appointments')
    .filter(a => a.user_id === userId)
    .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date));
}

export function saveConciergeMessage(msg: ConciergeMessage): void {
  const messages = readStore<ConciergeMessage>('concierge_messages');
  messages.push(msg);
  writeStore('concierge_messages', messages);
}

export function getConciergeMessages(userId: string, limit?: number): ConciergeMessage[] {
  const messages = readStore<ConciergeMessage>('concierge_messages')
    .filter(m => m.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  if (limit) return messages.slice(0, limit);
  return messages;
}

// === HEALTH RECORDS ===
export interface LabResult {
  id: string;
  user_id: string;
  test_name: string;
  test_category: 'blood' | 'urine' | 'imaging' | 'cardiac' | 'other';
  date: string;
  values: { parameter: string; value: string; unit: string; reference_range: string; flag: 'normal' | 'high' | 'low' | 'critical' }[];
  ordered_by?: string;
  notes?: string;
  file_url?: string;
  created_at: string;
}

export interface MedicalRecord {
  id: string;
  user_id: string;
  record_type: 'visit_summary' | 'diagnosis' | 'prescription' | 'imaging_report' | 'lab_report' | 'immunization' | 'other';
  title: string;
  description: string;
  date: string;
  provider_name?: string;
  facility_name?: string;
  attachments: { name: string; url: string; type: string }[];
  notes?: string;
  created_at: string;
}

export interface HealthTimelineEntry {
  id: string;
  user_id: string;
  entry_type: 'lab_result' | 'medical_record';
  date: string;
  summary: string;
  source_id: string;
  created_at: string;
}

export function saveLabResult(result: LabResult): void {
  const results = readStore<LabResult>('lab_results');
  const idx = results.findIndex(r => r.id === result.id);
  if (idx >= 0) results[idx] = result;
  else results.push(result);
  writeStore('lab_results', results);
  // Also add to timeline
  addTimelineEntry(result.user_id, 'lab_result', result.date, `${result.test_name} — ${result.test_category}`, result.id);
}

export function getLabResults(userId: string): LabResult[] {
  return readStore<LabResult>('lab_results')
    .filter(r => r.user_id === userId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function saveMedicalRecord(record: MedicalRecord): void {
  const records = readStore<MedicalRecord>('medical_records');
  const idx = records.findIndex(r => r.id === record.id);
  if (idx >= 0) records[idx] = record;
  else records.push(record);
  writeStore('medical_records', records);
  // Also add to timeline
  addTimelineEntry(record.user_id, 'medical_record', record.date, record.title, record.id);
}

export function getMedicalRecords(userId: string): MedicalRecord[] {
  return readStore<MedicalRecord>('medical_records')
    .filter(r => r.user_id === userId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function addTimelineEntry(userId: string, entryType: 'lab_result' | 'medical_record', date: string, summary: string, sourceId: string): void {
  const entries = readStore<HealthTimelineEntry>('health_timeline');
  const existing = entries.find(e => e.source_id === sourceId);
  if (existing) {
    existing.date = date;
    existing.summary = summary;
  } else {
    entries.push({
      id: sourceId,
      user_id: userId,
      entry_type: entryType,
      date,
      summary,
      source_id: sourceId,
      created_at: new Date().toISOString(),
    });
  }
  entries.sort((a, b) => b.date.localeCompare(a.date));
  writeStore('health_timeline', entries);
}

export function getHealthTimeline(userId: string): HealthTimelineEntry[] {
  return readStore<HealthTimelineEntry>('health_timeline')
    .filter(e => e.user_id === userId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

// === EMERGENCY PROFILE ===
export interface EmergencyProfile {
  id: string;
  user_id: string;
  emergency_contacts: EmergencyContact[];
  medical_conditions_summary: string;
  allergies: string[];
  medications: string[];
  blood_type?: string;
  primary_physician?: string;
  insurance_info?: string;
  advanced_directives?: string;
  updated_at: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  is_primary: boolean;
}

export function getEmergencyProfile(userId: string): EmergencyProfile | undefined {
  return readStore<EmergencyProfile>('emergency_profiles').find(p => p.user_id === userId);
}

export function saveEmergencyProfile(profile: EmergencyProfile): void {
  const profiles = readStore<EmergencyProfile>('emergency_profiles');
  const idx = profiles.findIndex(p => p.user_id === profile.user_id);
  if (idx >= 0) profiles[idx] = profile;
  else profiles.push(profile);
  writeStore('emergency_profiles', profiles);
}

// === ORGANIZATIONS ===
export function getOrganizations(): Organization[] {
  return readStore<Organization>('organizations');
}

export function getOrganization(id: string): Organization | undefined {
  return readStore<Organization>('organizations').find(o => o.id === id);
}

export function getOrganizationBySlug(slug: string): Organization | undefined {
  return readStore<Organization>('organizations').find(o => o.slug === slug);
}

export function saveOrganization(org: Organization): void {
  const orgs = readStore<Organization>('organizations');
  const idx = orgs.findIndex(o => o.id === org.id);
  if (idx >= 0) orgs[idx] = org;
  else orgs.push(org);
  writeStore('organizations', orgs);
}

export function deleteOrganization(id: string): void {
  writeStore('organizations', readStore<Organization>('organizations').filter(o => o.id !== id));
}

// === ORG MEMBERS ===
export function getOrgMembers(orgId: string): OrgMember[] {
  return readStore<OrgMember>('org_members').filter(m => m.org_id === orgId);
}

export function getOrgMember(orgId: string, userId: string): OrgMember | undefined {
  return readStore<OrgMember>('org_members').find(m => m.org_id === orgId && m.user_id === userId);
}

export function getMemberOrgs(userId: string): OrgMember[] {
  return readStore<OrgMember>('org_members').filter(m => m.user_id === userId && m.status === 'active');
}

export function saveOrgMember(member: OrgMember): void {
  const members = readStore<OrgMember>('org_members');
  const idx = members.findIndex(m => m.org_id === member.org_id && m.user_id === member.user_id);
  if (idx >= 0) members[idx] = member;
  else members.push(member);
  writeStore('org_members', members);
}

export function removeOrgMember(orgId: string, userId: string): void {
  writeStore('org_members', readStore<OrgMember>('org_members').filter(m => !(m.org_id === orgId && m.user_id === userId)));
}

export function getUsersByOrg(orgId: string): string[] {
  return readStore<OrgMember>('org_members')
    .filter(m => m.org_id === orgId && m.status === 'active')
    .map(m => m.user_id);
}

// === DEPARTMENTS ===
export function getDepartments(orgId: string): Department[] {
  return readStore<Department>('departments').filter(d => d.org_id === orgId);
}

export function getDepartment(id: string): Department | undefined {
  return readStore<Department>('departments').find(d => d.id === id);
}

export function saveDepartment(dept: Department): void {
  const depts = readStore<Department>('departments');
  const idx = depts.findIndex(d => d.id === dept.id);
  if (idx >= 0) depts[idx] = dept;
  else depts.push(dept);
  writeStore('departments', depts);
}

export function deleteDepartment(id: string): void {
  writeStore('departments', readStore<Department>('departments').filter(d => d.id !== id));
}

// === INVITES ===
export function getInvites(orgId: string): OrgInvite[] {
  return readStore<OrgInvite>('invites').filter(i => i.org_id === orgId);
}

export function getInviteByToken(token: string): OrgInvite | undefined {
  return readStore<OrgInvite>('invites').find(i => i.token === token && i.status === 'pending');
}

export function saveInvite(invite: OrgInvite): void {
  const invites = readStore<OrgInvite>('invites');
  invites.push(invite);
  writeStore('invites', invites);
}

export function updateInvite(id: string, updates: Partial<OrgInvite>): void {
  const invites = readStore<OrgInvite>('invites');
  const idx = invites.findIndex(i => i.id === id);
  if (idx >= 0) {
    invites[idx] = { ...invites[idx], ...updates };
    writeStore('invites', invites);
  }
}

// === CLINICAL STAFF ===
export function getClinicalStaff(): ClinicalStaff[] {
  return readStore<ClinicalStaff>('clinical_staff');
}

export function getClinicalStaffByUserId(userId: string): ClinicalStaff | undefined {
  return readStore<ClinicalStaff>('clinical_staff').find(s => s.user_id === userId);
}

export function getClinicalStaffById(id: string): ClinicalStaff | undefined {
  return readStore<ClinicalStaff>('clinical_staff').find(s => s.id === id);
}

export function saveClinicalStaff(staff: ClinicalStaff): void {
  const all = readStore<ClinicalStaff>('clinical_staff');
  const idx = all.findIndex(s => s.id === staff.id);
  if (idx >= 0) all[idx] = staff;
  else all.push(staff);
  writeStore('clinical_staff', all);
}

// === CLINICAL NOTES ===
export function getClinicalNotes(patientUserId: string): ClinicalNote[] {
  return readStore<ClinicalNote>('clinical_notes')
    .filter(n => n.patient_user_id === patientUserId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getAllClinicalNotes(): ClinicalNote[] {
  return readStore<ClinicalNote>('clinical_notes').sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function saveClinicalNote(note: ClinicalNote): void {
  const notes = readStore<ClinicalNote>('clinical_notes');
  const idx = notes.findIndex(n => n.id === note.id);
  if (idx >= 0) notes[idx] = note;
  else notes.push(note);
  writeStore('clinical_notes', notes);
}

export function deleteClinicalNote(id: string): void {
  writeStore('clinical_notes', readStore<ClinicalNote>('clinical_notes').filter(n => n.id !== id));
}

// === DELETE USER DATA (GDPR/CCPA compliance) ===
export function deleteUserData(userId: string): { deleted: boolean; removedCount: number } {
  let removedCount = 0;

  // Remove from 'users' store
  const users = readStore<AuthUser>('users');
  const userIdx = users.findIndex(u => u.id === userId);
  if (userIdx >= 0) {
    users.splice(userIdx, 1);
    writeStore('users', users);
    removedCount++;
  }

  // Remove from 'profiles' store
  const profilesBefore = readStore<UserProfile>('profiles').length;
  writeStore('profiles', readStore<UserProfile>('profiles').filter(p => p.id !== userId));
  removedCount += profilesBefore - readStore<UserProfile>('profiles').length;

  // Remove intake records
  const intakesBefore = readStore<IntakeRecord>('intake_responses').length;
  writeStore('intake_responses', readStore<IntakeRecord>('intake_responses').filter(i => i.user_id !== userId));
  removedCount += intakesBefore - readStore<IntakeRecord>('intake_responses').length;

  // Remove score records
  const scoresBefore = readStore<ScoreRecord>('health_scores').length;
  writeStore('health_scores', readStore<ScoreRecord>('health_scores').filter(s => s.user_id !== userId));
  removedCount += scoresBefore - readStore<ScoreRecord>('health_scores').length;

  // Remove chat messages
  const chatBefore = readStore<ChatMessage>('chat_messages').length;
  writeStore('chat_messages', readStore<ChatMessage>('chat_messages').filter(m => m.user_id !== userId));
  removedCount += chatBefore - readStore<ChatMessage>('chat_messages').length;

  // Remove sleep records
  const sleepBefore = readStore<SleepRecord>('sleep_records').length;
  writeStore('sleep_records', readStore<SleepRecord>('sleep_records').filter(r => r.user_id !== userId));
  removedCount += sleepBefore - readStore<SleepRecord>('sleep_records').length;

  // Remove meal logs
  const mealsBefore = readStore<MealLog>('meal_logs').length;
  writeStore('meal_logs', readStore<MealLog>('meal_logs').filter(r => r.user_id !== userId));
  removedCount += mealsBefore - readStore<MealLog>('meal_logs').length;

  // Remove nutrition goals
  const nutritionGoalsBefore = readStore<NutritionGoal>('nutrition_goals').length;
  writeStore('nutrition_goals', readStore<NutritionGoal>('nutrition_goals').filter(g => g.user_id !== userId));
  removedCount += nutritionGoalsBefore - readStore<NutritionGoal>('nutrition_goals').length;

  // Remove meal plans
  const mealPlansBefore = readStore<MealPlan>('meal_plans').length;
  writeStore('meal_plans', readStore<MealPlan>('meal_plans').filter(p => p.user_id !== userId));
  removedCount += mealPlansBefore - readStore<MealPlan>('meal_plans').length;

  // Remove mood check-ins
  const checkinsBefore = readStore<MoodCheckIn>('mood_checkins').length;
  writeStore('mood_checkins', readStore<MoodCheckIn>('mood_checkins').filter(c => c.user_id !== userId));
  removedCount += checkinsBefore - readStore<MoodCheckIn>('mood_checkins').length;

  // Remove burnout assessments
  const burnoutBefore = readStore<BurnoutAssessment>('burnout_assessments').length;
  writeStore('burnout_assessments', readStore<BurnoutAssessment>('burnout_assessments').filter(a => a.user_id !== userId));
  removedCount += burnoutBefore - readStore<BurnoutAssessment>('burnout_assessments').length;

  // Remove service requests
  const serviceBefore = readStore<ServiceRequest>('service_requests').length;
  writeStore('service_requests', readStore<ServiceRequest>('service_requests').filter(r => r.user_id !== userId));
  removedCount += serviceBefore - readStore<ServiceRequest>('service_requests').length;

  // Remove appointments
  const apptsBefore = readStore<Appointment>('appointments').length;
  writeStore('appointments', readStore<Appointment>('appointments').filter(a => a.user_id !== userId));
  removedCount += apptsBefore - readStore<Appointment>('appointments').length;

  // Remove concierge messages
  const conciergeBefore = readStore<ConciergeMessage>('concierge_messages').length;
  writeStore('concierge_messages', readStore<ConciergeMessage>('concierge_messages').filter(m => m.user_id !== userId));
  removedCount += conciergeBefore - readStore<ConciergeMessage>('concierge_messages').length;

  // Remove lab results
  const labBefore = readStore<LabResult>('lab_results').length;
  writeStore('lab_results', readStore<LabResult>('lab_results').filter(r => r.user_id !== userId));
  removedCount += labBefore - readStore<LabResult>('lab_results').length;

  // Remove medical records
  const medBefore = readStore<MedicalRecord>('medical_records').length;
  writeStore('medical_records', readStore<MedicalRecord>('medical_records').filter(r => r.user_id !== userId));
  removedCount += medBefore - readStore<MedicalRecord>('medical_records').length;

  // Remove health timeline entries
  const timelineBefore = readStore<HealthTimelineEntry>('health_timeline').length;
  writeStore('health_timeline', readStore<HealthTimelineEntry>('health_timeline').filter(e => e.user_id !== userId));
  removedCount += timelineBefore - readStore<HealthTimelineEntry>('health_timeline').length;

  // Remove emergency profile
  const emergencyBefore = readStore<EmergencyProfile>('emergency_profiles').length;
  writeStore('emergency_profiles', readStore<EmergencyProfile>('emergency_profiles').filter(p => p.user_id !== userId));
  removedCount += emergencyBefore - readStore<EmergencyProfile>('emergency_profiles').length;

  // Remove org memberships
  const orgMembersBefore = readStore<OrgMember>('org_members').length;
  writeStore('org_members', readStore<OrgMember>('org_members').filter(m => m.user_id !== userId));
  removedCount += orgMembersBefore - readStore<OrgMember>('org_members').length;

  return { deleted: true, removedCount };
}
