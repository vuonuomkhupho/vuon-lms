import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import { getUploadUrl } from "@/lib/r2";

// POST /api/upload — get a presigned upload URL for R2
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { filename, contentType, courseId, sessionId } = await req.json();

    const key = `courses/${courseId}/sessions/${sessionId}/${Date.now()}-${filename}`;
    const uploadUrl = await getUploadUrl(key, contentType);

    return NextResponse.json({ uploadUrl, key });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
