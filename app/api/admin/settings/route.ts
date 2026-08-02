import { NextResponse } from "next/server";
import { loadStorefrontSettings, sanitizeSettings, writeStorefrontSettings } from "@/src/lib/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : header;
  return token === expected;
}

export async function GET() {
  const settings = await loadStorefrontSettings();

  return NextResponse.json({
    settings,
    readMode: process.env.CONFIG_READ_MODE ?? "local",
    writeMode: process.env.CONFIG_WRITE_MODE ?? "local"
  });
}

export async function POST(request: Request) {
  if (!process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "ADMIN_TOKEN is not configured." }, { status: 503 });
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized admin request." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const settings = sanitizeSettings(body);
    const writeResult = await writeStorefrontSettings(settings);

    return NextResponse.json({ settings, mode: writeResult.mode });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Settings could not be saved." },
      { status: 400 }
    );
  }
}
