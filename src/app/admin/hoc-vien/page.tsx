"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Course {
  id: number;
  title: string;
}

interface Enrollment {
  id: number;
  userId: string;
  courseId: number;
  user: User;
  course: Course;
}

export default function StudentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Enrollment | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/enrollments").then((r) => r.json()),
      fetch("/api/courses").then((r) => r.json()),
    ]).then(([e, c]) => {
      setEnrollments(e);
      setCourses(c);
      setLoading(false);
    });
  }, []);

  async function enrollStudent() {
    if (!email || !selectedCourse) {
      toast.error("Vui lòng nhập email và chọn khóa học");
      return;
    }

    setEnrolling(true);
    const res = await fetch("/api/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: email,
        courseId: parseInt(selectedCourse),
      }),
    });

    if (res.ok) {
      const updated = await fetch("/api/enrollments").then((r) => r.json());
      setEnrollments(updated);
      setEmail("");
      toast.success("Đã ghi danh học viên");
    } else {
      const err = await res.json();
      toast.error(err.error || "Lỗi ghi danh");
    }
    setEnrolling(false);
  }

  async function removeEnrollment(enrollment: Enrollment) {
    await fetch(`/api/enrollments?id=${enrollment.id}`, { method: "DELETE" });
    setEnrollments((prev) => prev.filter((e) => e.id !== enrollment.id));
    toast.success("Đã xóa ghi danh");
    setRemoveTarget(null);
  }

  if (loading) {
    return (
      <div>
        <div className="h-8 w-48 bg-muted rounded animate-pulse mb-6" />
        <Card className="mb-6 animate-pulse">
          <CardContent className="pt-6"><div className="h-10 w-full bg-muted rounded" /></CardContent>
        </Card>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="py-3"><div className="h-5 w-2/3 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Quản lý học viên</h1>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-3">Ghi danh học viên</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Email học viên"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="sm:max-w-xs"
              type="email"
            />
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Chọn khóa học</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <Button onClick={enrollStudent} disabled={enrolling}>
              {enrolling ? "Đang ghi danh..." : "Ghi danh"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <h3 className="font-medium mb-3">
        Danh sách ghi danh ({enrollments.length})
      </h3>
      {enrollments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Chưa có học viên nào được ghi danh</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {enrollments.map((e) => (
            <Card key={e.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium truncate">{e.user?.name || "?"}</span>
                  <span className="text-sm text-muted-foreground truncate hidden sm:inline">
                    {e.user?.email}
                  </span>
                  <Badge variant="outline" className="shrink-0">
                    {e.course?.title}
                  </Badge>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="shrink-0 ml-2"
                  onClick={() => setRemoveTarget(e)}
                >
                  Xóa
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Xóa ghi danh?"
        description={`Xóa ghi danh của "${removeTarget?.user?.name}" khỏi "${removeTarget?.course?.title}"?`}
        confirmLabel="Xóa"
        destructive
        onConfirm={() => removeTarget && removeEnrollment(removeTarget)}
      />
    </div>
  );
}
