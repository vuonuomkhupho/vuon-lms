"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";

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
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);

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
    toast.success(course.isPublished ? "Đã chuyển sang nháp" : "Đã xuất bản");
  }

  async function deleteCourse(course: Course) {
    await fetch(`/api/courses/${course.id}`, { method: "DELETE" });
    setCourses((prev) => prev.filter((c) => c.id !== course.id));
    toast.success("Đã xóa khóa học");
    setDeleteTarget(null);
  }

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-9 w-36 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="py-4">
                <div className="h-5 w-1/3 bg-muted rounded mb-2" />
                <div className="h-4 w-2/3 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

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
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </div>
            <p className="text-muted-foreground font-medium">Chưa có khóa học nào</p>
            <Link href="/admin/khoa-hoc/tao-moi">
              <Button variant="outline" size="sm">Tạo khóa học đầu tiên</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium truncate">{course.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {course.description || "Chưa có mô tả"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
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
                    <Button variant="outline" size="sm">Sửa</Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteTarget(course)}
                  >
                    Xóa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xóa khóa học?"
        description={`Bạn có chắc muốn xóa "${deleteTarget?.title}"? Tất cả buổi học và tài liệu sẽ bị xóa vĩnh viễn.`}
        confirmLabel="Xóa"
        destructive
        onConfirm={() => deleteTarget && deleteCourse(deleteTarget)}
      />
    </div>
  );
}
