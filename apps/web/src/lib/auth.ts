import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { saveUser, getUserByEmail, getUserById, updateUserPassword, saveResetCode, getResetCode, deleteResetCode } from '@executive-health/db';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = '7d';

export interface AuthResult {
  success: boolean;
  token?: string;
  user?: { id: string; email: string; display_name: string };
  error?: string;
}

export async function registerUser(
  email: string,
  password: string,
  displayName: string
): Promise<AuthResult> {
  const existing = getUserByEmail(email);
  if (existing) return { success: false, error: 'Email already registered' };

  const password_hash = await bcrypt.hash(password, 10);
  const id = uuid();
  const now = new Date().toISOString();

  saveUser({ id, email, password_hash, display_name: displayName, created_at: now });

  const token = jwt.sign({ userId: id, email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  return { success: true, token, user: { id, email, display_name: displayName } };
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResult> {
  const user = getUserByEmail(email);
  if (!user) return { success: false, error: 'Invalid email or password' };

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return { success: false, error: 'Invalid email or password' };

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
  return {
    success: true,
    token,
    user: { id: user.id, email: user.email, display_name: user.display_name },
  };
}

export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch {
    return null;
  }
}

export function getUserIdFromRequest(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const payload = verifyToken(auth.slice(7));
  return payload?.userId || null;
}

// ── Password Reset ──────────────────────────────────────────

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const user = getUserByEmail(email);
  // Don't reveal if email exists — security best practice
  if (!user) return { success: true };

  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  saveResetCode(email, code);

  // In production, send via email. For dev, log to console.
  console.log(`\n🔐 PASSWORD RESET CODE for ${email}: ${code}\n`);

  return { success: true };
}

export async function resetPassword(email: string, code: string, newPassword: string): Promise<AuthResult> {
  const user = getUserByEmail(email);
  if (!user) return { success: false, error: 'Invalid request' };

  const stored = getResetCode(email);
  if (!stored) return { success: false, error: 'No reset code requested' };
  if (stored.code !== code) return { success: false, error: 'Invalid code' };
  if (new Date(stored.expires_at) < new Date()) {
    deleteResetCode(email);
    return { success: false, error: 'Code expired. Request a new one.' };
  }

  const password_hash = await bcrypt.hash(newPassword, 10);
  updateUserPassword(user.id, password_hash);
  deleteResetCode(email);

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });

  return {
    success: true,
    token,
    user: { id: user.id, email: user.email, display_name: user.display_name },
  };
}
