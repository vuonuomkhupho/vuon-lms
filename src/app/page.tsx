import Link from "next/link";
import { db } from "@/lib/db";
import { courses, enrollments } from "@/lib/schema";
import { eq, count } from "drizzle-orm";
import { getSession } from "@/lib/auth-server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();

  const publishedCourses = await db.query.courses.findMany({
    where: eq(courses.isPublished, true),
    with: { instructor: true },
    limit: 6,
  });

  const [{ value: totalStudents }] = await db
    .select({ value: count() })
    .from(enrollments);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link href="/" className="text-xl font-bold">
            Vuon LMS
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/khoa-hoc" className="text-sm text-muted-foreground hover:text-foreground transition px-3 py-2">
              Khóa học
            </Link>
            <ThemeToggle />
            {session ? (
              <Link href="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/dang-nhap">
                  <Button variant="ghost" size="sm">Đăng nhập</Button>
                </Link>
                <Link href="/dang-ky">
                  <Button size="sm">Đăng ký</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center py-20 md:py-32">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
            Nền tảng học
            <br />
            <span className="text-primary">trực tuyến</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mt-6">
            Tiếp cận kiến thức chất lượng mọi lúc, mọi nơi.
            Học theo tốc độ của riêng bạn.
          </p>
          <div className="flex gap-3 justify-center mt-8">
            <Link href="/khoa-hoc">
              <Button size="lg" className="text-base px-8">Xem khóa học</Button>
            </Link>
            {!session && (
              <Link href="/dang-ky">
                <Button size="lg" variant="outline" className="text-base px-8">Đăng ký miễn phí</Button>
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-12 text-sm text-muted-foreground">
            <div>
              <span className="text-2xl font-bold text-foreground block">{publishedCourses.length}</span>
              Khóa học
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <span className="text-2xl font-bold text-foreground block">{totalStudents}</span>
              Học viên
            </div>
          </div>
        </div>
      </section>

      {/* Featured courses */}
      {publishedCourses.length > 0 && (
        <section className="border-t bg-muted/30 py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">Khóa học nổi bật</h2>
                <p className="text-muted-foreground mt-1">Bắt đầu hành trình học tập của bạn</p>
              </div>
              <Link href="/khoa-hoc">
                <Button variant="outline" size="sm">Xem tất cả</Button>
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {publishedCourses.map((course) => (
                <Link key={course.id} href={`/khoa-hoc/${course.slug}`}>
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {course.description || "Khám phá khóa học này"}
                      </p>
                      {course.instructor && (
                        <p className="text-xs text-muted-foreground mt-4">
                          {course.instructor.name}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>&copy; 2026 Vuon LMS. All rights reserved.</p>
      </footer>
    </div>
  );
}
