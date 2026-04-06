import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { progress, enrollments, courseSessions } from "@/lib/schema";
import { requireAuth } from "@/lib/auth-server";
import { updateProgressSchema } from "@/lib/validations";
import { eq, and } from "drizzle-orm";

// POST /api/progress — mark a session as complete
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = updateProgressSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { sessionId, completed } = parsed.data;

    // Verify session exists and user is enrolled in the course
    const courseSession = await db.query.courseSessions.findFirst({
      where: eq(courseSessions.id, sessionId),
    });

    if (!courseSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const enrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.userId, session.user.id),
        eq(enrollments.courseId, courseSession.courseId)
      ),
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
    }

    // Upsert progress
    const existing = await db.query.progress.findFirst({
      where: and(
        eq(progress.userId, session.user.id),
        eq(progress.sessionId, sessionId)
      ),
    });

    if (existing) {
      await db
        .update(progress)
        .set({ completed, updatedAt: new Date() })
        .where(eq(progress.id, existing.id));
    } else {
      await db.insert(progress).values({
        userId: session.user.id,
        sessionId,
        completed,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
