import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionMaterials } from "@/lib/schema";
import { requireAdmin } from "@/lib/auth-server";
import { createMaterialSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string; sessionId: string }> };

// POST /api/courses/:id/sessions/:sessionId/materials — add material
export async function POST(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { sessionId } = await params;
    const body = await req.json();
    const parsed = createMaterialSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { type, title, r2Key, hlsEncryptionKey, externalUrl, contentText, metadata } = parsed.data;

    const [material] = await db
      .insert(sessionMaterials)
      .values({
        sessionId: parseInt(sessionId),
        type,
        title,
        r2Key: r2Key || null,
        hlsEncryptionKey: hlsEncryptionKey || null,
        externalUrl: externalUrl || null,
        contentText: contentText || null,
        metadata: metadata || null,
      })
      .returning();

    return NextResponse.json(material, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// DELETE materials by id
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const materialId = searchParams.get("materialId");

    if (!materialId) {
      return NextResponse.json({ error: "materialId required" }, { status: 400 });
    }

    await db.delete(sessionMaterials).where(eq(sessionMaterials.id, parseInt(materialId)));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
