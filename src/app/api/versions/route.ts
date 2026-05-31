import { NextResponse } from "next/server";
import { getVersions, createVersion } from "@/lib/db";

export async function GET() {
  const versions = await getVersions();
  return NextResponse.json(versions);
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const version = await createVersion(body.name.trim(), body.description || "");
  return NextResponse.json(version, { status: 201 });
}
