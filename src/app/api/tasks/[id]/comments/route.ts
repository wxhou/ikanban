import { NextRequest, NextResponse } from "next/server";
import { createComment } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const taskId = Number(id);
  if (isNaN(taskId)) return NextResponse.json({ error: "Invalid task id" }, { status: 400 });

  const body = await req.json();
  if (!body.user || typeof body.user !== "string") {
    return NextResponse.json({ error: "user is required" }, { status: 400 });
  }
  if (!body.text || typeof body.text !== "string") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const images = Array.isArray(body.images) ? body.images : [];
  const comment = await createComment(taskId, body.user.trim(), body.text.trim(), images);
  if (!comment) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json(comment, { status: 201 });
}
