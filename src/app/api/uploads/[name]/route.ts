import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const filePath = path.join(process.cwd(), "data", "uploads", name);
  try {
    const buffer = await readFile(filePath);
    const ext = path.extname(name).toLowerCase();
    const mime: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml" };
    return new NextResponse(buffer, { headers: { "Content-Type": mime[ext] || "application/octet-stream", "Cache-Control": "max-age=86400" } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
