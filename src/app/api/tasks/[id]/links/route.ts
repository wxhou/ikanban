import { NextResponse } from "next/server";
import { getTaskLinks, createTaskLink, deleteTaskLink } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { LinkType } from "@/lib/types";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireUser(request))) return unauthorized();
  const { id } = await params;
  const numId = Number(id);
  if (isNaN(numId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const links = await getTaskLinks(numId);
  return NextResponse.json(links);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireUser(request))) return unauthorized();
  const { id } = await params;
  const numId = Number(id);
  if (isNaN(numId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const body = await request.json();
  const { linkedTaskId, linkType } = body;
  if (!linkedTaskId || !["blocks", "blocked_by", "related"].includes(linkType)) {
    return NextResponse.json({ error: "linkedTaskId and linkType (blocks|blocked_by|related) are required" }, { status: 400 });
  }
  const link = await createTaskLink(numId, Number(linkedTaskId), linkType as LinkType);
  // Create reverse link for bidirectional display
  const reverseType = linkType === "blocks" ? "blocked_by" : linkType === "blocked_by" ? "blocks" : "related";
  await createTaskLink(Number(linkedTaskId), numId, reverseType as LinkType);
  return NextResponse.json(link, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireUser(request))) return unauthorized();
  const { id } = await params;
  const numId = Number(id);
  if (isNaN(numId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const { searchParams } = new URL(request.url);
  const linkId = Number(searchParams.get("linkId"));
  if (isNaN(linkId)) {
    return NextResponse.json({ error: "linkId query parameter is required" }, { status: 400 });
  }
  const ok = await deleteTaskLink(numId, linkId);
  if (!ok) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
