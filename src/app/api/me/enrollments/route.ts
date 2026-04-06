import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enrollments, courses } from "@/lib/schema";
import { requireAuth } from "@/lib/auth-server";
import { eq, and } from "drizzle-orm";

// POST /api/me/enrollments — self-enroll in a published course
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { courseId } = await req.json();

    if (!courseId || typeof courseId !== "number") {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    // Verify course exists and is published
    const course = await db.query.courses.findFirst({
      where: and(eq(courses.id, courseId), eq(courses.isPublished, true)),
    });

    if (!course) {
      return NextResponse.json({ error: "Khóa học không tồn tại" }, { status: 404 });
    }

    // Check if already enrolled
    const existing = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.userId, session.user.id),
        eq(enrollments.courseId, courseId)
      ),
    });

    if (existing) {
      return NextResponse.json({ error: "Bạn đã ghi danh rồi" }, { status: 400 });
    }

    const [enrollment] = await db
      .insert(enrollments)
      .values({ userId: session.user.id, courseId })
      .returning();

    return NextResponse.json(enrollment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// DELETE /api/me/enrollments?courseId=X — unenroll from a course
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAuth();
    const courseId = req.nextUrl.searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    await db
      .delete(enrollments)
      .where(
        and(
          eq(enrollments.userId, session.user.id),
          eq(enrollments.courseId, parseInt(courseId))
        )
      );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
