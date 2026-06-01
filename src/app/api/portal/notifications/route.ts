import { NextResponse } from "next/server";
import { getPortalNotifications, getUnreadPortalNotificationCount } from "@/lib/db";
import { getValidatedUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getValidatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [notifications, unread] = await Promise.all([
    getPortalNotifications(50),
    getUnreadPortalNotificationCount(),
  ]);
  return NextResponse.json({ notifications, unread });
}
