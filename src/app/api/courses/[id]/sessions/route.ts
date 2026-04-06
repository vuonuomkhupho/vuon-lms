import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { courseSessions } from "@/lib/schema";
import { requireAdmin } from "@/lib/auth-server";
import { createSessionSchema } from "@/lib/validations";
import { eq, sql } from "drizzle-orm";

// POST /api/courses/:id/sessions — add a session to a course
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const courseId = parseInt(id);
    const body = await req.json();
    const parsed = createSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const [maxOrder] = await db
      .select({ max: sql<number>`COALESCE(MAX(${courseSessions.orderIndex}), -1)` })
      .from(courseSessions)
      .where(eq(courseSessions.courseId, courseId));

    const [session] = await db
      .insert(courseSessions)
      .values({
        courseId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        orderIndex: (maxOrder?.max ?? -1) + 1,
      })
      .returning();

    return NextResponse.json(session, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
