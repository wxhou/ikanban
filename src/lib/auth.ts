import { cookies } from "next/headers";
import { findSessionByToken, renewSessionIfExpiring, getUserRole } from "@/lib/db";

// `req` is kept for API compat with route handlers; identity now comes from
// the `sid` httpOnly cookie via next/headers cookies(), not from the request.
async function resolveSession(): Promise<{ name: string; role: string } | null> {
  const sid = (await cookies()).get("sid")?.value;
  if (!sid) return null;
  const session = await findSessionByToken(sid);
  if (!session) return null;
  await renewSessionIfExpiring(sid);
  return getUserRole(session.userId);
}

export async function getRequestUser(_req: Request): Promise<string | null> {
  void _req; // retained for route-handler API compat; identity now comes from `sid` cookie
  return (await resolveSession())?.name ?? null;
}

export async function requireUser(req: Request): Promise<string | null> {
  return getRequestUser(req);
}

export async function getValidatedUser(_req: Request): Promise<{ name: string; role: string } | null> {
  void _req; // retained for route-handler API compat; identity now comes from `sid` cookie
  return resolveSession();
}
