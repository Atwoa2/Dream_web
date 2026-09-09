/** What a successful sign-in returns: the raw token goes into the cookie. */
export type IssuedSession = {
  token: string;
  expiresAt: Date;
  userId: string;
};

/** Google profile after the OAuth exchange, normalized for our use. */
export type GoogleProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  avatarUrl: string | null;
};

/** Request metadata for audit and rate limiting. */
export type RequestMeta = {
  ip: string;
  userAgent?: string | null;
};
