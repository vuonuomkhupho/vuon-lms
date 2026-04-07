import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { courses } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function Home() {
  const publishedCourses = await db.query.courses.findMany({
    where: eq(courses.isPublished, true),
    with: { instructor: true },
    limit: 6,
  });

  return (
    <>
      {/* Hero */}
      <section className="py-24 md:py-36">
        <div className="container mx-auto px-6 lg:px-8 max-w-5xl">
          <div className="max-w-3xl">
            <div className="inline-block bg-[#D1FAE5] border-2 border-foreground rounded-lg px-3 py-1 text-sm font-bold mb-6 shadow-brutal-sm">
              100% miễn phí
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05]">
              Học mọi thứ,{" "}
              <span className="underline decoration-primary decoration-4 underline-offset-4">mọi lúc</span>,{" "}
              mọi nơi.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mt-6 max-w-2xl leading-relaxed">
              Nền tảng học trực tuyến dành cho người Việt. Tiếp cận kiến thức chất lượng — học theo tốc độ của riêng bạn.
            </p>
            <div className="flex flex-wrap gap-4 mt-10">
              <Link href="/khoa-hoc">
                <Button size="lg" className="text-base px-8 h-14">
                  Xem khóa học
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/dang-ky">
                <Button size="lg" variant="outline" className="text-base px-8 h-14">
                  Đăng ký miễn phí
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured courses */}
      {publishedCourses.length > 0 && (
        <section className="border-t-2 border-foreground bg-[#DBEAFE] dark:bg-primary/10 py-20 md:py-24">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-black">Khóa học nổi bật</h2>
                <p className="text-muted-foreground mt-2 text-lg">Bắt đầu hành trình học tập của bạn</p>
              </div>
              <Link href="/khoa-hoc" className="hidden md:block">
                <Button variant="outline" size="sm">
                  Xem tất cả
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {publishedCourses.map((course) => (
                <Link key={course.id} href={`/khoa-hoc/${course.slug}`}>
                  <Card className="h-full cursor-pointer group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--foreground)] transition-all">
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {course.description || "Khám phá khóa học này"}
                      </p>
                      {course.instructor && (
                        <div className="flex items-center gap-2 mt-5 pt-4 border-t">
                          <div className="w-6 h-6 rounded bg-secondary border border-foreground flex items-center justify-center text-[10px] font-bold">
                            {course.instructor.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium">{course.instructor.name}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center md:hidden">
              <Link href="/khoa-hoc">
                <Button variant="outline">Xem tất cả khóa học</Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
