import { NextResponse } from "next/server";
import { updateUser, deleteUser } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireUser(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { role, name, password } = body;

  const result = await updateUser(Number(id), { role, name, password });
  if (!result) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json(result);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireUser(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const success = await deleteUser(Number(id));
  if (!success) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
