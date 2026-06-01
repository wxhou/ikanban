import { NextResponse } from "next/server";
import { verifyUserPassword, getUserByName, createSession } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8h, must match design D3/D4

function clientIpFrom(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const xri = req.headers.get("x-real-ip");
  if (xri) return xri.trim();
  return "unknown";
}

export async function POST(req: Request) {
  let body: { name?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { name, password } = body;
  if (!name || !password) {
    return NextResponse.json({ error: "Name and password are required" }, { status: 400 });
  }

  const ip = clientIpFrom(req);
  if (!checkRateLimit(`${ip}:${name}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many login attempts" }, { status: 429 });
  }

  const isValid = await verifyUserPassword(name, password);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const user = await getUserByName(name);
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const { token } = await createSession(user.id);

  const res = NextResponse.json({ success: true, name: user.name, role: user.role });
  res.cookies.set("sid", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
