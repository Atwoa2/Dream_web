/**
 * Sign-in business rules. Knows nothing about HTTP or cookies — routes handle
 * that boundary.
 */
import { AUTH } from "@/config/constants";
import { generateOtpCode, generateToken, safeEqualHex, sha256 } from "@/lib/crypto";
import { validation, forbidden } from "@/lib/errors";
import { enforceLimit } from "@/modules/rate-limit";
import { findOrCreateByEmail, type User } from "@/modules/users";
import { normalizeEmail } from "@/modules/users/repository";
import { sendOtpEmail } from "./email";
import { recordAudit } from "@/modules/audit";
import * as repo from "./repository";
import type { GoogleProfile, IssuedSession, RequestMeta } from "./types";

/**
 * "Wrong code", "expired code" and "no code" are deliberately the same
 * message: a distinguishable answer reveals whether an email is registered.
 */
const INVALID_CODE = () => validation("The code is invalid or has expired");

async function issueSession(userId: string): Promise<IssuedSession> {
  const token = generateToken(32);
  const expiresAt = new Date(Date.now() + AUTH.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await repo.createSession(userId, sha256(token), expiresAt);
  return { token, expiresAt, userId };
}

// --- email code -------------------------------------------------------------

export async function requestEmailCode(rawEmail: string, meta: RequestMeta): Promise<void> {
  const email = normalizeEmail(rawEmail);

  // Both limits: per address (flooding someone's inbox) and per IP (one
  // attacker rotating addresses runs up our email bill).
  await enforceLimit(
    `otp:req:email:${email}`,
    AUTH.OTP_REQUESTS_PER_WINDOW,
    AUTH.OTP_WINDOW_MINUTES * 60,
  );
  await enforceLimit(
    `otp:req:ip:${meta.ip}`,
    AUTH.OTP_REQUESTS_PER_IP,
    AUTH.OTP_WINDOW_MINUTES * 60,
  );

  const code = generateOtpCode(AUTH.OTP_LENGTH);
  const expiresAt = new Date(Date.now() + AUTH.OTP_TTL_MINUTES * 60 * 1000);
  await repo.replaceOtp(email, sha256(code), expiresAt);

  await sendOtpEmail(email, code);
  await recordAudit("auth.code_requested", { ip: meta.ip, userAgent: meta.userAgent });
}

export async function verifyEmailCode(
  rawEmail: string,
  code: string,
  meta: RequestMeta,
): Promise<IssuedSession> {
  const email = normalizeEmail(rawEmail);

  // IP-level guard on verification attempts, on top of the per-code counter.
  await enforceLimit(`otp:verify:ip:${meta.ip}`, 30, AUTH.OTP_WINDOW_MINUTES * 60);

  const otp = await repo.findActiveOtp(email);
  if (!otp) throw INVALID_CODE();

  // Count the attempt BEFORE comparing — a failed comparison must not be free.
  const attempts = await repo.incrementOtpAttempts(otp.id);
  if (attempts > AUTH.OTP_MAX_ATTEMPTS) throw INVALID_CODE();

  if (!safeEqualHex(sha256(code), otp.codeHash)) {
    await recordAudit("auth.code_failed", { ip: meta.ip, userAgent: meta.userAgent });
    throw INVALID_CODE();
  }

  await repo.consumeOtp(otp.id);

  const user = await findOrCreateByEmail({ email, emailVerified: true });
  const session = await issueSession(user.id);
  await recordAudit("auth.signed_in_email", {
    userId: user.id,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
  return session;
}

// --- Google -----------------------------------------------------------------

export async function signInWithGoogle(
  profile: GoogleProfile,
  meta: RequestMeta,
): Promise<IssuedSession> {
  // An unverified Google email could belong to someone else — linking it to
  // an existing account by address would be an account takeover.
  if (!profile.emailVerified) {
    throw forbidden("The Google account email is not verified");
  }

  let userId = await repo.findAccountUserId("google", profile.sub);

  if (!userId) {
    const user = await findOrCreateByEmail({
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      emailVerified: true,
    });
    await repo.createAccount(user.id, "google", profile.sub);
    userId = user.id;
  }

  const session = await issueSession(userId);
  await recordAudit("auth.signed_in_google", {
    userId,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
  return session;
}

// --- session ----------------------------------------------------------------

export async function getUserBySessionToken(token: string): Promise<User | null> {
  return repo.findUserByTokenHash(sha256(token));
}

export async function signOut(token: string, meta: RequestMeta): Promise<void> {
  const user = await repo.findUserByTokenHash(sha256(token));
  await repo.deleteSessionByTokenHash(sha256(token));
  await recordAudit("auth.signed_out", {
    userId: user?.id,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
}
