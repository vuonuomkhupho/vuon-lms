import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { courses } from "@/lib/schema";
import { requireAdmin } from "@/lib/auth-server";
import { eq } from "drizzle-orm";

// GET /api/courses — list all courses (admin)
export async function GET() {
  try {
    await requireAdmin();
    const allCourses = await db.select().from(courses).orderBy(courses.createdAt);
    return NextResponse.json(allCourses);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// POST /api/courses — create a new course
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();

    const slug = body.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const [course] = await db
      .insert(courses)
      .values({
        title: body.title,
        slug: slug + "-" + Date.now().toString(36),
        description: body.description || null,
        instructorId: session.user.id,
        isPublished: false,
      })
      .returning();

    return NextResponse.json(course, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
