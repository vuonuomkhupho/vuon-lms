export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/lib/db";
import { enrollments, progress } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth-server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";

export default async function DashboardPage() {
  const session = (await getSession())!;

  const userEnrollments = await db.query.enrollments.findMany({
    where: eq(enrollments.userId, session.user.id),
    with: {
      course: {
        with: {
          sessions: { orderBy: (s, { asc }) => [asc(s.orderIndex)] },
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

  const courses = userEnrollments.map((enrollment) => {
    const totalSessions = enrollment.course.sessions.length;
    const completedSessions = enrollment.course.sessions.filter(
      (s) => completedMap.has(s.id)
    ).length;
    // Find next incomplete session index
    const nextSessionIdx = enrollment.course.sessions.findIndex(
      (s) => !completedMap.has(s.id)
    );

    return {
      id: enrollment.course.id,
      title: enrollment.course.title,
      slug: enrollment.course.slug,
      description: enrollment.course.description,
      totalSessions,
      completedSessions,
      progressPercent: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
      nextSessionIndex: nextSessionIdx >= 0 ? nextSessionIdx + 1 : 1,
    };
  });

  // Course to continue (lowest progress, non-zero sessions)
  const continueTarget = courses
    .filter((c) => c.totalSessions > 0 && c.progressPercent < 100)
    .sort((a, b) => a.progressPercent - b.progressPercent)[0];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">Khóa học của tôi</h1>
      <p className="text-muted-foreground mb-8">Tiếp tục học từ nơi bạn dừng lại</p>

      {/* Continue learning hero */}
      {continueTarget && (
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="p-6 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">Tiếp tục học</p>
              <h2 className="text-lg font-semibold truncate">{continueTarget.title}</h2>
              <div className="flex items-center gap-3 mt-2">
                <ProgressBar value={continueTarget.progressPercent} className="h-2 flex-1 max-w-48" />
                <span className="text-xs text-muted-foreground shrink-0">
                  {continueTarget.completedSessions}/{continueTarget.totalSessions} buổi
                </span>
              </div>
            </div>
            <Link href={`/khoa-hoc/${continueTarget.slug}/${continueTarget.nextSessionIndex}`}>
              <Button>Vào học</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {courses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
              </svg>
            </div>
            <p className="text-muted-foreground font-medium">Chưa có khóa học nào</p>
            <p className="text-sm text-muted-foreground">Khám phá và ghi danh khóa học đầu tiên</p>
            <Link href="/khoa-hoc">
              <Button className="mt-2">Xem khóa học</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <Link key={course.id} href={`/khoa-hoc/${course.slug}/${course.nextSessionIndex}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors mb-1">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {course.description}
                    </p>
                  )}
                  <div className="mt-auto">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span>{course.completedSessions}/{course.totalSessions} buổi</span>
                      <span>{course.progressPercent}%</span>
                    </div>
                    <ProgressBar value={course.progressPercent} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
