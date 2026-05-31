import { NextRequest, NextResponse } from "next/server";
import { createSubtask } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const taskId = Number(id);
  if (isNaN(taskId)) return NextResponse.json({ error: "Invalid task id" }, { status: 400 });

  const body = await req.json();
  if (!body.text || typeof body.text !== "string") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const subtask = await createSubtask(taskId, body.text.trim());
  if (!subtask) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json(subtask, { status: 201 });
}
