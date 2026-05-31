import { NextRequest, NextResponse } from "next/server";
import { updateVersion, deleteVersion } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = Number(id);
  if (isNaN(numId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const body = await req.json();
  const version = await updateVersion(numId, body);
  if (!version) return NextResponse.json({ error: "Version not found" }, { status: 404 });
  return NextResponse.json(version);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = Number(id);
  if (isNaN(numId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const ok = await deleteVersion(numId);
  if (!ok) return NextResponse.json({ error: "Cannot delete version with tasks" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
