import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { courseSessions } from "@/lib/schema";
import { requireAdmin } from "@/lib/auth-server";
import { updateSessionSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string; sessionId: string }> };

// PATCH /api/courses/:id/sessions/:sessionId — update a session (whitelisted fields)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { sessionId } = await params;
    const body = await req.json();
    const parsed = updateSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const [updated] = await db
      .update(courseSessions)
      .set(parsed.data)
      .where(eq(courseSessions.id, parseInt(sessionId)))
      .returning();

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// DELETE /api/courses/:id/sessions/:sessionId — delete a session
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { sessionId } = await params;

    await db.delete(courseSessions).where(eq(courseSessions.id, parseInt(sessionId)));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
