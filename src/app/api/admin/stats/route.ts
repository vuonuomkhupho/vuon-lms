import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { courses, enrollments, courseSessions, user } from "@/lib/schema";
import { requireAdmin } from "@/lib/auth-server";
import { eq, count, sql, desc } from "drizzle-orm";

export async function GET() {
  try {
    await requireAdmin();

    // Total counts
    const [courseCount] = await db.select({ value: count() }).from(courses);
    const [publishedCount] = await db
      .select({ value: count() })
      .from(courses)
      .where(eq(courses.isPublished, true));
    const [studentCount] = await db
      .select({ value: count(sql`DISTINCT ${enrollments.userId}`) })
      .from(enrollments);
    const [sessionCount] = await db.select({ value: count() }).from(courseSessions);

    // Per-course stats
    const courseStats = await db
      .select({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        isPublished: courses.isPublished,
        updatedAt: courses.updatedAt,
        enrollmentCount: count(enrollments.id),
      })
      .from(courses)
      .leftJoin(enrollments, eq(enrollments.courseId, courses.id))
      .groupBy(courses.id)
      .orderBy(desc(courses.updatedAt));

    // Recent enrollments
    const recentEnrollments = await db.query.enrollments.findMany({
      with: { user: true, course: true },
      orderBy: (e, { desc }) => [desc(e.enrolledAt)],
      limit: 5,
    });

    return NextResponse.json({
      totalCourses: courseCount.value,
      publishedCourses: publishedCount.value,
      totalStudents: studentCount.value,
      totalSessions: sessionCount.value,
      courseStats,
      recentEnrollments: recentEnrollments.map((e) => ({
        id: e.id,
        studentName: e.user?.name || "Unknown",
        studentEmail: e.user?.email,
        courseTitle: e.course?.title,
        enrolledAt: e.enrolledAt,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
