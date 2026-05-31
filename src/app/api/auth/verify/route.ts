import { NextResponse } from "next/server";
import { verifyUserPassword } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const { name, password } = body;

  if (!name || !password) {
    return NextResponse.json({ error: "Name and password are required" }, { status: 400 });
  }

  const isValid = await verifyUserPassword(name, password);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
