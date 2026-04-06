import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { courseSessions } from "@/lib/schema";
import { requireAdmin } from "@/lib/auth-server";
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

    // Get the next order index
    const [maxOrder] = await db
      .select({ max: sql<number>`COALESCE(MAX(${courseSessions.orderIndex}), -1)` })
      .from(courseSessions)
      .where(eq(courseSessions.courseId, courseId));

    const [session] = await db
      .insert(courseSessions)
      .values({
        courseId,
        title: body.title,
        description: body.description || null,
        orderIndex: (maxOrder?.max ?? -1) + 1,
      })
      .returning();

    return NextResponse.json(session, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
