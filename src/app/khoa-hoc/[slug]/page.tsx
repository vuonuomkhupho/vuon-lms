export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { courses, courseSessions, enrollments } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth-server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const course = await db.query.courses.findFirst({
    where: and(eq(courses.slug, slug), eq(courses.isPublished, true)),
    with: {
      sessions: {
        orderBy: (s, { asc }) => [asc(s.orderIndex)],
      },
      instructor: true,
    },
  });

  if (!course) notFound();

  const session = await getSession();
  let isEnrolled = false;

  if (session) {
    const enrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.userId, session.user.id),
        eq(enrollments.courseId, course.id)
      ),
    });
    isEnrolled = !!enrollment;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link href="/" className="text-xl font-bold">Vuon LMS</Link>
          <div className="flex items-center gap-4">
            <Link href="/khoa-hoc" className="text-sm hover:underline">Khóa học</Link>
            {session ? (
              <Link href="/dashboard">
                <Button variant="outline" size="sm">Dashboard</Button>
              </Link>
            ) : (
              <Link href="/dang-nhap">
                <Button variant="outline" size="sm">Đăng nhập</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
        {course.description && (
          <p className="text-muted-foreground mb-6">{course.description}</p>
        )}

        <div className="flex items-center gap-3 mb-8">
          <Badge variant="outline">{course.sessions.length} buổi học</Badge>
          {isEnrolled && <Badge>Đã ghi danh</Badge>}
        </div>

        <h2 className="text-lg font-semibold mb-4">Nội dung khóa học</h2>
        <div className="space-y-2">
          {course.sessions.map((s, idx) => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-8">
                    {idx + 1}.
                  </span>
                  <span className="font-medium">{s.title}</span>
                </div>
                {isEnrolled ? (
                  <Link href={`/khoa-hoc/${slug}/${idx + 1}`}>
                    <Button size="sm" variant="outline">Xem</Button>
                  </Link>
                ) : (
                  <span className="text-xs text-muted-foreground">Cần ghi danh</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {!session && (
          <div className="mt-8 text-center">
            <p className="text-muted-foreground mb-3">
              Đăng nhập để xem nội dung khóa học
            </p>
            <Link href="/dang-nhap">
              <Button>Đăng nhập</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
