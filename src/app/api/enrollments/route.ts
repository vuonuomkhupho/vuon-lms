import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enrollments } from "@/lib/schema";
import { requireAdmin } from "@/lib/auth-server";
import { enrollStudentSchema } from "@/lib/validations";
import { eq, and } from "drizzle-orm";

// GET /api/enrollments?courseId=X — list enrollments for a course
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const courseId = req.nextUrl.searchParams.get("courseId");

    if (courseId) {
      const result = await db.query.enrollments.findMany({
        where: eq(enrollments.courseId, parseInt(courseId)),
        with: { user: true },
      });
      return NextResponse.json(result);
    }

    const all = await db.query.enrollments.findMany({ with: { user: true, course: true } });
    return NextResponse.json(all);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// POST /api/enrollments — admin enroll a student in a course
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = enrollStudentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { userId, courseId } = parsed.data;

    const existing = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, courseId)
      ),
    });

    if (existing) {
      return NextResponse.json({ error: "Đã ghi danh rồi" }, { status: 400 });
    }

    const [enrollment] = await db
      .insert(enrollments)
      .values({ userId, courseId })
      .returning();

    return NextResponse.json(enrollment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// DELETE /api/enrollments?id=X — remove enrollment
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await db.delete(enrollments).where(eq(enrollments.id, parseInt(id)));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
