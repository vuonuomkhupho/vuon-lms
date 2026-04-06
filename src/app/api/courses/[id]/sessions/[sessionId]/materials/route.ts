import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionMaterials } from "@/lib/schema";
import { requireAdmin } from "@/lib/auth-server";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string; sessionId: string }> };

// POST /api/courses/:id/sessions/:sessionId/materials — add material
export async function POST(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { sessionId } = await params;
    const body = await req.json();

    const [material] = await db
      .insert(sessionMaterials)
      .values({
        sessionId: parseInt(sessionId),
        type: body.type,
        title: body.title,
        r2Key: body.r2Key || null,
        hlsEncryptionKey: body.hlsEncryptionKey || null,
        externalUrl: body.externalUrl || null,
        contentText: body.contentText || null,
        metadata: body.metadata || null,
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
