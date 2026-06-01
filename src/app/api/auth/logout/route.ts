import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySession } from "@/lib/db";

export async function POST() {
  const sid = (await cookies()).get("sid")?.value;
  if (sid) {
    await destroySession(sid);
  }
  const res = NextResponse.json({ success: true });
  res.cookies.set("sid", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
