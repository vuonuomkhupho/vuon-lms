import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enrollments, progress } from "@/lib/schema";
import { requireAuth } from "@/lib/auth-server";
import { eq } from "drizzle-orm";

// GET /api/me/dashboard — get enrolled courses with progress
export async function GET() {
  try {
    const session = await requireAuth();

    const userEnrollments = await db.query.enrollments.findMany({
      where: eq(enrollments.userId, session.user.id),
      with: {
        course: {
          with: {
            sessions: {
              orderBy: (s, { asc }) => [asc(s.orderIndex)],
            },
          },
        },
      },
    });

    const userProgress = await db.query.progress.findMany({
      where: eq(progress.userId, session.user.id),
    });

    const completedMap = new Map(
      userProgress.filter((p) => p.completed).map((p) => [p.sessionId, true])
    );

    const coursesWithProgress = userEnrollments.map((enrollment) => {
      const totalSessions = enrollment.course.sessions.length;
      const completedSessions = enrollment.course.sessions.filter(
        (s) => completedMap.has(s.id)
      ).length;

      return {
        id: enrollment.course.id,
        title: enrollment.course.title,
        slug: enrollment.course.slug,
        description: enrollment.course.description,
        enrolledAt: enrollment.enrolledAt,
        totalSessions,
        completedSessions,
        progressPercent: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
      };
    });

    return NextResponse.json(coursesWithProgress);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
