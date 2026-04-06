"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    if (!email || !selectedCourse) return;

    const res = await fetch("/api/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: email, // We'll resolve email to userId server-side
        courseId: parseInt(selectedCourse),
      }),
    });

    if (res.ok) {
      // Refresh enrollments
      const updated = await fetch("/api/enrollments").then((r) => r.json());
      setEnrollments(updated);
      setEmail("");
    } else {
      const err = await res.json();
      alert(err.error || "Lỗi ghi danh");
    }
  }

  async function removeEnrollment(id: number) {
    if (!confirm("Xóa ghi danh này?")) return;
    await fetch(`/api/enrollments?id=${id}`, { method: "DELETE" });
    setEnrollments((prev) => prev.filter((e) => e.id !== id));
  }

  if (loading) return <p className="text-muted-foreground">Đang tải...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Quản lý học viên</h1>

      {/* Enroll form */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-3">Ghi danh học viên</h3>
          <div className="flex gap-2">
            <Input
              placeholder="User ID của học viên"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="max-w-xs"
            />
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="">Chọn khóa học</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <Button onClick={enrollStudent}>Ghi danh</Button>
          </div>
        </CardContent>
      </Card>

      {/* Enrollment list */}
      <h3 className="font-medium mb-3">
        Danh sách ghi danh ({enrollments.length})
      </h3>
      {enrollments.length === 0 ? (
        <p className="text-muted-foreground">Chưa có học viên nào được ghi danh</p>
      ) : (
        <div className="space-y-2">
          {enrollments.map((e) => (
            <Card key={e.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <span className="font-medium">{e.user?.name || "?"}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {e.user?.email}
                  </span>
                  <Badge variant="outline" className="ml-2">
                    {e.course?.title}
                  </Badge>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeEnrollment(e.id)}
                >
                  Xóa
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
