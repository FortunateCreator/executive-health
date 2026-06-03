import fs from 'fs';
import path from 'path';
import type { IntakeFormData, HealthScore, UserProfile, ChatMessage } from '@executive-health/core';

const DATA_DIR = path.resolve(process.cwd(), 'data');

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJSON<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return [];
  }
}

function writeJSON<T>(filePath: string, data: T[]): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// === PROFILES ===
const profilesPath = () => path.join(DATA_DIR, 'profiles.json');

export function getProfile(userId: string): UserProfile | undefined {
  return readJSON<UserProfile>(profilesPath()).find(p => p.id === userId);
}

export function getAllProfiles(): UserProfile[] {
  return readJSON<UserProfile>(profilesPath());
}

export function upsertProfile(profile: UserProfile): void {
  const profiles = readJSON<UserProfile>(profilesPath());
  const idx = profiles.findIndex(p => p.id === profile.id);
  if (idx >= 0) profiles[idx] = profile;
  else profiles.push(profile);
  writeJSON(profilesPath(), profiles);
}

// === INTAKE RESPONSES ===
const intakePath = () => path.join(DATA_DIR, 'intake_responses.json');

export interface IntakeRecord {
  id: string;
  user_id: string;
  data: IntakeFormData;
  created_at: string;
}

export function getIntakes(userId: string): IntakeRecord[] {
  return readJSON<IntakeRecord>(intakePath()).filter(i => i.user_id === userId);
}

export function getLatestIntake(userId: string): IntakeRecord | undefined {
  const intakes = getIntakes(userId);
  return intakes.sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
}

export function saveIntake(record: IntakeRecord): void {
  const intakes = readJSON<IntakeRecord>(intakePath());
  intakes.push(record);
  writeJSON(intakePath(), intakes);
}

// === HEALTH SCORES ===
const scoresPath = () => path.join(DATA_DIR, 'health_scores.json');

export interface ScoreRecord {
  id: string;
  user_id: string;
  overall_score: number;
  score_data: HealthScore;
  intake_id: string;
  created_at: string;
}

export function getScores(userId: string): ScoreRecord[] {
  return readJSON<ScoreRecord>(scoresPath()).filter(s => s.user_id === userId);
}

export function getLatestScore(userId: string): ScoreRecord | undefined {
  const scores = getScores(userId);
  return scores.sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
}

export function saveScore(record: ScoreRecord): void {
  const scores = readJSON<ScoreRecord>(scoresPath());
  scores.push(record);
  writeJSON(scoresPath(), scores);
}

// === CHAT MESSAGES ===
const chatPath = () => path.join(DATA_DIR, 'chat_messages.json');

export function getChatMessages(userId: string, sessionId?: string): ChatMessage[] {
  let msgs = readJSON<ChatMessage>(chatPath()).filter(m => m.user_id === userId);
  if (sessionId) msgs = msgs.filter(m => m.session_id === sessionId);
  return msgs.sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function saveChatMessage(msg: ChatMessage): void {
  const msgs = readJSON<ChatMessage>(chatPath());
  msgs.push(msg);
  writeJSON(chatPath(), msgs);
}

// === AUTH ===
const usersPath = () => path.join(DATA_DIR, 'users.json');

export interface AuthUser {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  created_at: string;
}

export function getUserByEmail(email: string): AuthUser | undefined {
  return readJSON<AuthUser>(usersPath()).find(u => u.email === email);
}

export function getUserById(id: string): AuthUser | undefined {
  return readJSON<AuthUser>(usersPath()).find(u => u.id === id);
}

export function saveUser(user: AuthUser): void {
  const users = readJSON<AuthUser>(usersPath());
  users.push(user);
  writeJSON(usersPath(), users);
}
