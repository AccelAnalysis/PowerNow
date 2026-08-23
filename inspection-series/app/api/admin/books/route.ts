import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import {
  getBooksPersistenceInfo,
  loadSeriesCatalog,
  sanitizeSeriesCatalog,
  writeSeriesCatalogToGitHub
} from "@/src/lib/books";
import { resolveGitHubWriteToken } from "@/src/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const catalog = await loadSeriesCatalog();
  return NextResponse.json(
    {
      catalog,
      persistence: getBooksPersistenceInfo(),
      writeAuthentication: process.env.GITHUB_TOKEN
        ? "server_token"
        : "session_token_required"
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  try {
    const token = resolveGitHubWriteToken(request);
    const body = await request.json();
    const catalog = sanitizeSeriesCatalog(body);
    const commit = await writeSeriesCatalogToGitHub(catalog, token);
    revalidateTag("power-now-books", { expire: 0 });

    return NextResponse.json({
      catalog,
      persistence: "github",
      commit
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Series catalog could not be saved.";

    if (message === "ADMIN_UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized admin request." },
        { status: 401 }
      );
    }
    if (message === "GITHUB_TOKEN_REQUIRED") {
      return NextResponse.json(
        {
          error:
            "A GitHub fine-grained token with Contents read/write permission is required for this save."
        },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
