export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/lib/db";
import { courses } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function CourseCatalogPage() {
  const publishedCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.isPublished, true));

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link href="/" className="text-xl font-bold">
            Vuon LMS
          </Link>
          <Link href="/dang-nhap">
            <Button variant="outline" size="sm">
              Đăng nhập
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Khóa học</h1>
        <p className="text-muted-foreground mb-8">
          Khám phá các khóa học chất lượng
        </p>

        {publishedCourses.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">Chưa có khóa học nào</p>
            <p className="text-sm mt-2">Quay lại sau để xem khóa học mới</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {publishedCourses.map((course) => (
              <Link key={course.id} href={`/khoa-hoc/${course.slug}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription>
                      {course.description || "Không có mô tả"}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
