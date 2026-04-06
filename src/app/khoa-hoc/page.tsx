export const dynamic = "force-dynamic";

import { BookOpen } from "lucide-react";
import { db } from "@/lib/db";
import { courses } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth-server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EmptyState } from "@/components/empty-state";
import { CourseGrid } from "./course-grid";

export default async function CourseCatalogPage() {
  const session = await getSession();

  const publishedCourses = await db.query.courses.findMany({
    where: eq(courses.isPublished, true),
    with: {
      instructor: true,
      sessions: { columns: { id: true } },
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader
        user={session ? { name: session.user.name, email: session.user.email, role: (session.user as any).role } : null}
      />
      <main className="flex-1 container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">Khóa học</h1>
        <p className="text-muted-foreground mb-8">Khám phá các khóa học chất lượng</p>

        {publishedCourses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Chưa có khóa học nào"
            description="Quay lại sau để xem khóa học mới"
          />
        ) : (
          <CourseGrid courses={publishedCourses} />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
