export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/lib/db";
import { courses } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth-server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent } from "@/components/ui/card";

export default async function CourseCatalogPage() {
  const session = await getSession();

  const publishedCourses = await db.query.courses.findMany({
    where: eq(courses.isPublished, true),
    with: { instructor: true },
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
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
              </svg>
            </div>
            <p className="text-lg text-muted-foreground">Chưa có khóa học nào</p>
            <p className="text-sm text-muted-foreground mt-2">Quay lại sau để xem khóa học mới</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {publishedCourses.map((course) => (
              <Link key={course.id} href={`/khoa-hoc/${course.slug}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full group">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {course.description || "Khám phá khóa học này"}
                    </p>
                    {course.instructor && (
                      <p className="text-xs text-muted-foreground mt-4">{course.instructor.name}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
