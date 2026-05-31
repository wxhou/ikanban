import { NextResponse } from "next/server";
import { getVersions } from "@/lib/db";

export async function GET() {
  const versions = await getVersions();
  return NextResponse.json(versions);
}
