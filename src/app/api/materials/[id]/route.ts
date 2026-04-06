import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionMaterials } from "@/lib/schema";
import { requireAdmin } from "@/lib/auth-server";
import { eq } from "drizzle-orm";

// PATCH /api/materials/:id — update material (title, content, URL)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    const [updated] = await db
      .update(sessionMaterials)
      .set(body)
      .where(eq(sessionMaterials.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
