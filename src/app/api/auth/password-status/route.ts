import { NextResponse } from "next/server";
import { checkUserHasPassword } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const hasPassword = await checkUserHasPassword(name);
  return NextResponse.json({ hasPassword });
}
