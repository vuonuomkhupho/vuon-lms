import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { progress } from "@/lib/schema";
import { requireAuth } from "@/lib/auth-server";
import { eq, and } from "drizzle-orm";

// POST /api/progress — mark a session as complete
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { sessionId, completed } = await req.json();

    // Check if progress record exists
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
