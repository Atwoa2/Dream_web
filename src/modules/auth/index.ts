/** Public interface of the auth module. Import from here only. */
export {
  requestEmailCode,
  verifyEmailCode,
  signInWithGoogle,
  getUserBySessionToken,
  signOut,
} from "./service";
export { buildAuthorizationUrl, fetchGoogleProfile } from "./google";
export type { IssuedSession, GoogleProfile, RequestMeta } from "./types";
