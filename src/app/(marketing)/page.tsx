import Link from "next/link";
import { db } from "@/lib/db";
import { courses, enrollments } from "@/lib/schema";
import { eq, count } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function Home() {
  const publishedCourses = await db.query.courses.findMany({
    where: eq(courses.isPublished, true),
    with: { instructor: true },
    limit: 6,
  });

  const [{ value: totalStudents }] = await db
    .select({ value: count() })
    .from(enrollments);

  return (
    <>
      {/* Hero */}
      <section className="flex items-center justify-center py-20 md:py-32">
        <div className="container mx-auto px-6 lg:px-8 text-center max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
            Nền tảng học
            <br />
            <span className="bg-primary text-primary-foreground px-4 py-1 rounded-lg border-2 border-foreground shadow-brutal inline-block mt-2">trực tuyến</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mt-8">
            Tiếp cận kiến thức chất lượng mọi lúc, mọi nơi.
            Học theo tốc độ của riêng bạn.
          </p>
          <div className="flex gap-4 justify-center mt-10">
            <Link href="/khoa-hoc">
              <Button size="lg" className="text-base px-8">Xem khóa học</Button>
            </Link>
            <Link href="/dang-ky">
              <Button size="lg" variant="outline" className="text-base px-8">Đăng ký miễn phí</Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mt-14">
            <div className="bg-card border-2 border-foreground rounded-lg px-6 py-3 shadow-brutal-sm">
              <span className="text-3xl font-black text-foreground block">{publishedCourses.length}</span>
              <span className="text-sm font-medium text-muted-foreground">Khóa học</span>
            </div>
            <div className="bg-card border-2 border-foreground rounded-lg px-6 py-3 shadow-brutal-sm">
              <span className="text-3xl font-black text-foreground block">{totalStudents}</span>
              <span className="text-sm font-medium text-muted-foreground">Học viên</span>
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
    </>
  );
}
