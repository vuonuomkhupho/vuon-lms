"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Course {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  isPublished: boolean;
  createdAt: string;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((data) => {
        setCourses(data);
        setLoading(false);
      });
  }, []);

  async function togglePublish(course: Course) {
    await fetch(`/api/courses/${course.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !course.isPublished }),
    });
    setCourses((prev) =>
      prev.map((c) =>
        c.id === course.id ? { ...c, isPublished: !c.isPublished } : c
      )
    );
  }

  async function deleteCourse(id: number) {
    if (!confirm("Bạn có chắc muốn xóa khóa học này?")) return;
    await fetch(`/api/courses/${id}`, { method: "DELETE" });
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }

  if (loading) return <p className="text-muted-foreground">Đang tải...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý khóa học</h1>
        <Link href="/admin/khoa-hoc/tao-moi">
          <Button>+ Tạo khóa học mới</Button>
        </Link>
      </div>

      {courses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-40 gap-2">
            <p className="text-muted-foreground">Chưa có khóa học nào</p>
            <Link href="/admin/khoa-hoc/tao-moi">
              <Button variant="outline" size="sm">
                Tạo khóa học đầu tiên
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <h3 className="font-medium">{course.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {course.description || "Chưa có mô tả"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={course.isPublished ? "default" : "secondary"}>
                    {course.isPublished ? "Đã xuất bản" : "Nháp"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => togglePublish(course)}
                  >
                    {course.isPublished ? "Ẩn" : "Xuất bản"}
                  </Button>
                  <Link href={`/admin/khoa-hoc/${course.id}/sua`}>
                    <Button variant="outline" size="sm">
                      Sửa
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteCourse(course.id)}
                  >
                    Xóa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
