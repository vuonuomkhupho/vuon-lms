import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import { getUploadUrl } from "@/lib/r2";
import { uploadRequestSchema } from "@/lib/validations";

const ALLOWED_CONTENT_TYPES = [
  "video/mp4", "video/webm", "video/quicktime",
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg", "image/png", "image/webp", "image/gif",
];

const MAX_FILENAME_LENGTH = 200;

// POST /api/upload — get a presigned upload URL for R2
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = uploadRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { filename, contentType, courseId, sessionId } = parsed.data;

    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    // Sanitize filename
    const safeName = filename.slice(0, MAX_FILENAME_LENGTH).replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `courses/${courseId}/sessions/${sessionId}/${Date.now()}-${safeName}`;
    const uploadUrl = await getUploadUrl(key, contentType);

    return NextResponse.json({ uploadUrl, key });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
