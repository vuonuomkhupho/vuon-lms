export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { courses, enrollments } from "@/lib/schema";
import { eq, and, count } from "drizzle-orm";
import { getSession } from "@/lib/auth-server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnrollButton } from "./enroll-button";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const course = await db.query.courses.findFirst({
    where: and(eq(courses.slug, slug), eq(courses.isPublished, true)),
    with: {
      sessions: { orderBy: (s, { asc }) => [asc(s.orderIndex)] },
      instructor: true,
    },
  });

  if (!course) notFound();

  const session = await getSession();
  let isEnrolled = false;

  if (session) {
    const enrollment = await db.query.enrollments.findFirst({
      where: and(eq(enrollments.userId, session.user.id), eq(enrollments.courseId, course.id)),
    });
    isEnrolled = !!enrollment;
  }

  const [{ value: enrollmentCount }] = await db
    .select({ value: count() })
    .from(enrollments)
    .where(eq(enrollments.courseId, course.id));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader
        user={session ? { name: session.user.name, email: session.user.email, role: (session.user as any).role } : null}
      />

      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline">{course.sessions.length} buổi học</Badge>
            <Badge variant="secondary">{enrollmentCount} học viên</Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{course.title}</h1>
          {course.description && (
            <p className="text-lg text-muted-foreground leading-relaxed">{course.description}</p>
          )}
          {course.instructor && (
            <p className="text-sm text-muted-foreground mt-3">
              Giảng viên: <span className="font-medium text-foreground">{course.instructor.name}</span>
            </p>
          )}
        </div>

        {/* Enrollment CTA */}
        <div className="rounded-xl border bg-card p-6 mb-8">
          {!session ? (
            <div className="text-center">
              <p className="text-muted-foreground mb-3">Đăng nhập để ghi danh khóa học này</p>
              <Link href="/dang-nhap"><Button size="lg">Đăng nhập</Button></Link>
            </div>
          ) : isEnrolled ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-success flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.2"/>
                    <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Bạn đã ghi danh khóa học này
                </p>
                <p className="text-sm text-muted-foreground mt-1">Bắt đầu học ngay từ buổi đầu tiên</p>
              </div>
              <Link href={`/khoa-hoc/${slug}/1`}><Button size="lg">Vào học</Button></Link>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sẵn sàng bắt đầu?</p>
                <p className="text-sm text-muted-foreground mt-1">Ghi danh miễn phí để truy cập toàn bộ nội dung</p>
              </div>
              <EnrollButton courseId={course.id} />
            </div>
          )}
        </div>

        {/* Curriculum */}
        <h2 className="text-lg font-semibold mb-4">Nội dung khóa học</h2>
        <div className="space-y-2">
          {course.sessions.map((s, idx) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 transition hover:bg-accent/50">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium text-muted-foreground">{idx + 1}</span>
                <span className="font-medium">{s.title}</span>
              </div>
              {isEnrolled ? (
                <Link href={`/khoa-hoc/${slug}/${idx + 1}`}><Button size="sm" variant="ghost">Xem</Button></Link>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" className="text-muted-foreground">
                  <path d="M11.5 1a3.5 3.5 0 00-3.5 3.5V6H3a1 1 0 00-1 1v7a1 1 0 001 1h10a1 1 0 001-1V7a1 1 0 00-1-1H9.5V4.5a2 2 0 114 0V6h1.5V4.5A3.5 3.5 0 0011.5 1z" fill="currentColor"/>
                </svg>
              )}
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
