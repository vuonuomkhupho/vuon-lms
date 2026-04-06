"use client";

import { useEffect, useState } from "react";
import { Search, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Course {
  id: number;
  title: string;
}

interface Enrollment {
  id: number;
  userId: string;
  courseId: number;
  enrolledAt: string;
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
  const [searchQuery, setSearchQuery] = useState("");

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
      body: JSON.stringify({ userId: email, courseId: parseInt(selectedCourse) }),
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

  const uniqueStudents = new Set(enrollments.map((e) => e.userId)).size;

  const filtered = searchQuery
    ? enrollments.filter(
        (e) =>
          e.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.course?.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : enrollments;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Quản lý học viên</h1>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{uniqueStudents}</p>
              <p className="text-xs text-muted-foreground">Học viên</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <Badge variant="outline" className="border-0 text-success text-lg font-bold p-0">{enrollments.length}</Badge>
            </div>
            <div>
              <p className="text-2xl font-bold">{enrollments.length}</p>
              <p className="text-xs text-muted-foreground">Ghi danh</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enroll form */}
      <Card className="mb-6">
        <CardContent className="p-5">
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
              className="h-9 rounded-md border bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

      {/* Search + Table */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Danh sách ghi danh</h3>
        {enrollments.length > 5 && (
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>
        )}
      </div>

      {enrollments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent>
            <EmptyState icon={Users} title="Chưa có học viên" description="Ghi danh học viên đầu tiên ở form phía trên" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Học viên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Khóa học</TableHead>
                <TableHead className="hidden sm:table-cell">Ngày ghi danh</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.user?.name || "?"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{e.user?.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{e.course?.title}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">
                    {e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString("vi-VN") : "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setRemoveTarget(e)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
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
