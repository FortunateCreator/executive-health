import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { saveUser, getUserByEmail, getUserById } from '@executive-health/db';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-fallback-secret';
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
