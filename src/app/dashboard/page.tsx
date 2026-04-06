"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface EnrolledCourse {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  enrolledAt: string;
  totalSessions: number;
  completedSessions: number;
  progressPercent: number;
}

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    if (session) {
      fetch("/api/me/dashboard")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setCourses(data);
        })
        .finally(() => setLoadingCourses(false));
    }
  }, [session]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!session) {
    router.push("/dang-nhap");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link href="/" className="text-xl font-bold">
            Vuon LMS
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/khoa-hoc" className="text-sm text-muted-foreground hover:text-foreground transition">
              Khóa học
            </Link>
            <span className="text-sm text-muted-foreground">
              {session.user.name}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut().then(() => router.push("/"))}
            >
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-1">Khóa học của tôi</h1>
        <p className="text-muted-foreground mb-6">Tiếp tục học từ nơi bạn dừng lại</p>

        {loadingCourses ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-5 w-3/4 bg-muted rounded mb-3" />
                  <div className="h-4 w-1/2 bg-muted rounded mb-4" />
                  <div className="h-2 w-full bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : courses.length === 0 ? (
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
              <Link key={course.id} href={`/khoa-hoc/${course.slug}/1`}>
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
                      <Progress value={course.progressPercent} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
