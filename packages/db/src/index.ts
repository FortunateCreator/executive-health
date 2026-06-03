import fs from 'fs';
import path from 'path';
import type { IntakeFormData, HealthScore, UserProfile, ChatMessage } from '@executive-health/core';

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
