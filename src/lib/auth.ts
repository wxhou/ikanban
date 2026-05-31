import { getUserByName } from "@/lib/db";

function decodeUser(value: string): string {
  try {
    return decodeURIComponent(escape(atob(value)));
  } catch {
    return value;
  }
}

export function getRequestUser(req: Request): string | null {
  const encoded = req.headers.get("x-user");
  if (!encoded) return null;
  return decodeUser(encoded);
}

export async function requireUser(req: Request): Promise<string | null> {
  const user = getRequestUser(req);
  if (!user) return null;
  const exists = await getUserByName(user);
  return exists ? user : null;
}

export async function getValidatedUser(req: Request): Promise<{ name: string; role: string } | null> {
  const name = getRequestUser(req);
  if (!name) return null;
  const user = await getUserByName(name);
  return user ? { name: user.name, role: user.role } : null;
}
