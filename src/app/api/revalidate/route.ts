import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

/**
 * On-demand revalidation endpoint.
 *
 * Usage:
 *   POST /api/revalidate
 *   Headers: { "x-revalidate-token": "<REVALIDATE_SECRET>" }
 *   Body (optional): { "path": "/docs" }
 *
 * Without a body, revalidates all doc and blog pages.
 * With a path, revalidates only that specific path.
 *
 * Set REVALIDATE_SECRET env var to secure the endpoint.
 */
export async function POST(request: NextRequest) {
  const token = request.headers.get("x-revalidate-token");
  const secret = process.env.REVALIDATE_SECRET;

  if (secret && token !== secret) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const targetPath = body?.path as string | undefined;

    if (targetPath) {
      revalidatePath(targetPath, "page");
      return NextResponse.json({ revalidated: true, path: targetPath });
    }

    // Revalidate all doc and blog pages
    revalidatePath("/docs", "layout");
    revalidatePath("/blogs", "layout");

    return NextResponse.json({
      revalidated: true,
      paths: ["/docs", "/blogs"],
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Revalidation failed" }, { status: 500 });
  }
}
