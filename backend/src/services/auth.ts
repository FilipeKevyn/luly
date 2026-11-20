import { SignJWT, jwtVerify } from 'jose';
import { hash, verify } from '@node-rs/argon2';
import { env } from '@/config';
import { randomBytes } from 'crypto';

// ============================================
// PASSWORD HASHING (Argon2id)
// ============================================

export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    memoryCost: env.ARGON2_MEMORY_COST,
    timeCost: env.ARGON2_TIME_COST,
    parallelism: env.ARGON2_PARALLELISM,
    outputLen: 32,
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await verify(hash, password);
  } catch {
    return false;
  }
}

// ============================================
// JWT TOKENS
// ============================================

const JWT_SECRET_KEY = new TextEncoder().encode(env.JWT_SECRET);

export interface AccessTokenPayload {
  sub: string; // user ID
  email: string;
  type: 'access';
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  sub: string; // user ID
  jti: string; // unique token ID for rotation
  type: 'refresh';
  iat: number;
  exp: number;
}

export async function createAccessToken(userId: string, email: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + parseDuration(env.JWT_ACCESS_TTL);

  return new SignJWT({ sub: userId, email, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(JWT_SECRET_KEY);
}

export async function createRefreshToken(userId: string): Promise<{ token: string; jti: string; exp: number }> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + parseDuration(env.JWT_REFRESH_TTL);
  const jti = randomBytes(16).toString('hex');

  const token = await new SignJWT({ sub: userId, jti, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(JWT_SECRET_KEY);

  return { token, jti, exp };
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY, {
      algorithms: ['HS256'],
    });
    return payload as unknown as AccessTokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY, {
      algorithms: ['HS256'],
    });
    return payload as unknown as RefreshTokenPayload;
  } catch {
    return null;
  }
}

function parseDuration(str: string): number {
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // default 15m
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      return 900;
  }
}

// ============================================
// REFRESH TOKEN BLOCKLIST (revogação)
// ============================================

import { db } from '@/db/client';
import { refreshTokenBlocklist } from '@/db/schema';
import { eq, and, lt } from 'drizzle-orm';
import { createHash } from 'crypto';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function addToBlocklist(token: string, userId: string, expiresAt: Date): Promise<void> {
  await db
    .insert(refreshTokenBlocklist)
    .values({
      tokenHash: hashToken(token),
      userId,
      expiresAt,
    })
    .onConflictDoNothing();
}

export async function isBlocklisted(token: string): Promise<boolean> {
  const result = await db
    .select({ tokenHash: refreshTokenBlocklist.tokenHash })
    .from(refreshTokenBlocklist)
    .where(eq(refreshTokenBlocklist.tokenHash, hashToken(token)))
    .limit(1);
  return result.length > 0;
}

export async function cleanupExpiredBlocklist(): Promise<number> {
  const result = await db
    .delete(refreshTokenBlocklist)
    .where(lt(refreshTokenBlocklist.expiresAt, new Date()));
  return result.rowCount ?? 0;
}