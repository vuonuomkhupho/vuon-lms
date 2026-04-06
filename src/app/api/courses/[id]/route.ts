import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { courses, courseSessions, sessionMaterials } from "@/lib/schema";
import { requireAdmin } from "@/lib/auth-server";
import { eq } from "drizzle-orm";

// GET /api/courses/:id — get course with sessions and materials
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const course = await db.query.courses.findFirst({
      where: eq(courses.id, parseInt(id)),
      with: {
        sessions: {
          orderBy: (s, { asc }) => [asc(s.orderIndex)],
          with: {
            materials: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// PATCH /api/courses/:id — update course
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    const [updated] = await db
      .update(courses)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// DELETE /api/courses/:id — delete course
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    await db.delete(courses).where(eq(courses.id, parseInt(id)));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
