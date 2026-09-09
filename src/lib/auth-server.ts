/**
 * Current-user helpers for server components and pages.
 * The HTTP boundary (cookie) stays here in lib/ — modules never see it.
 */
import { redirect } from "next/navigation";
import { getUserBySessionToken } from "@/modules/auth";
import type { User } from "@/modules/users";
import { getSessionToken } from "./session-cookie";

export async function getCurrentUser(): Promise<User | null> {
  const token = await getSessionToken();
  if (!token) return null;
  return getUserBySessionToken(token);
}

/** For pages that only exist behind sign-in: redirects instead of erroring. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
