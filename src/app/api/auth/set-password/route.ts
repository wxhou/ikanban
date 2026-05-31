import { NextResponse } from "next/server";
import { setUserInitialPassword } from "@/lib/db";

export async function POST(req: Request) {
  const { name, password } = await req.json();
  if (!name || !password) {
    return NextResponse.json({ error: "Name and password are required" }, { status: 400 });
  }
  if (password.length !== 4 || !/^\d{4}$/.test(password)) {
    return NextResponse.json({ error: "Password must be exactly 4 digits" }, { status: 400 });
  }
  const ok = await setUserInitialPassword(name, password);
  if (!ok) {
    return NextResponse.json({ error: "Password already set or user not found" }, { status: 409 });
  }
  return NextResponse.json({ success: true });
}
