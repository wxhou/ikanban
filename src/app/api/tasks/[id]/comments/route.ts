import { NextRequest, NextResponse } from "next/server";
import { createComment } from "@/lib/db";
import { getRequestUser } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const taskId = Number(id);
  if (isNaN(taskId)) return NextResponse.json({ error: "Invalid task id" }, { status: 400 });

  const body = await req.json();
  if (!body.text || typeof body.text !== "string") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const sessionUser = await getRequestUser(req);
  const fallbackUser = typeof body.user === "string" ? body.user.trim() : "";
  const user = sessionUser || fallbackUser || "匿名";

  const images = Array.isArray(body.images) ? body.images : [];
  const comment = await createComment(taskId, user, body.text.trim(), images);
  if (!comment) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json(comment, { status: 201 });
}
