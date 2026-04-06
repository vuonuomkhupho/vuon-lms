import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionMaterials } from "@/lib/schema";
import { requireAdmin } from "@/lib/auth-server";
import { updateMaterialSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

// PATCH /api/materials/:id — update material (whitelisted fields only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateMaterialSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const [updated] = await db
      .update(sessionMaterials)
      .set(parsed.data)
      .where(eq(sessionMaterials.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
