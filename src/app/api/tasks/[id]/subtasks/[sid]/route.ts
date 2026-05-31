import { NextRequest, NextResponse } from "next/server";
import { updateSubtask, deleteSubtask } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; sid: string }> }) {
  const { id, sid } = await params;
  const taskId = Number(id);
  const subtaskId = Number(sid);
  if (isNaN(taskId) || isNaN(subtaskId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json();
  const fields: { text?: string; done?: boolean } = {};
  if (body.text !== undefined) fields.text = body.text;
  if (body.done !== undefined) fields.done = !!body.done;

  const subtask = await updateSubtask(taskId, subtaskId, fields);
  if (!subtask) return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
  return NextResponse.json(subtask);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; sid: string }> }) {
  const { id, sid } = await params;
  const taskId = Number(id);
  const subtaskId = Number(sid);
  if (isNaN(taskId) || isNaN(subtaskId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const ok = await deleteSubtask(taskId, subtaskId);
  if (!ok) return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
