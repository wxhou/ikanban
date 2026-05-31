import { NextResponse } from "next/server";
import { getNotifications, getUnreadNotificationCount, createNotification, markNotificationRead, markAllNotificationsRead } from "@/lib/db";
import { requireUser } from "@/lib/auth";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: Request) {
  if (!(await requireUser(request))) return unauthorized();
  const { searchParams } = new URL(request.url);
  const user = searchParams.get("user");
  const unreadOnly = searchParams.get("unread") === "1";
  if (!user) {
    return NextResponse.json({ error: "user query parameter is required" }, { status: 400 });
  }
  if (unreadOnly) {
    const count = await getUnreadNotificationCount(user);
    return NextResponse.json({ count });
  }
  const notifications = await getNotifications(user);
  return NextResponse.json(notifications);
}

export async function POST(request: Request) {
  if (!(await requireUser(request))) return unauthorized();
  const body = await request.json();
  const { userName, type, text, taskId } = body;
  if (!userName || !type || !text) {
    return NextResponse.json({ error: "userName, type, and text are required" }, { status: 400 });
  }
  await createNotification(userName, type, text, taskId ?? null);
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await requireUser(request))) return unauthorized();
  const { searchParams } = new URL(request.url);
  const user = searchParams.get("user");
  const id = searchParams.get("id");
  if (!user) {
    return NextResponse.json({ error: "user query parameter is required" }, { status: 400 });
  }
  if (id) {
    const ok = await markNotificationRead(Number(id), user);
    if (!ok) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }
  const count = await markAllNotificationsRead(user);
  return NextResponse.json({ ok: true, marked: count });
}
