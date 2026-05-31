import { NextRequest, NextResponse } from "next/server";
import { deleteComment } from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; cid: string }> }) {
  const { id, cid } = await params;
  const taskId = Number(id);
  const commentId = Number(cid);
  if (isNaN(taskId) || isNaN(commentId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const ok = await deleteComment(taskId, commentId);
  if (!ok) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
