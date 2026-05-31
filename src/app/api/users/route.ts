import { NextResponse } from "next/server";
import { getAllUsers, createUser } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const users = await getAllUsers();
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  if (!(await requireUser(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { name, role, password } = body;
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  try {
    const user = await createUser(name, role || "developer", "", password || "");
    return NextResponse.json(user);
  } catch (err) {
    console.error("Failed to create user:", err);
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }
}
