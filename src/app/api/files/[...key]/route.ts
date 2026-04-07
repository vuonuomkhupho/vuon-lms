import { NextRequest, NextResponse } from "next/server";
import { getDownloadUrl } from "@/lib/r2";

// GET /api/files/courses/123/... — proxy R2 file downloads
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key } = await params;
    const fileKey = key.join("/");

    if (!fileKey || fileKey.includes("..")) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }

    const signedUrl = await getDownloadUrl(fileKey, 3600);

    // Redirect to signed URL (cached for 1 hour)
    return NextResponse.redirect(signedUrl, {
      headers: {
        "Cache-Control": "public, max-age=3500",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
