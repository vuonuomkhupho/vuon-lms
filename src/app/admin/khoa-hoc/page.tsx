"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, BookOpen, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";

interface Course {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  isPublished: boolean;
  createdAt: string;
  sessions?: { id: number; materials: { type: string; r2Key?: string }[] }[];
}

const GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-red-500",
  "from-purple-500 to-pink-500",
  "from-cyan-500 to-blue-500",
  "from-amber-500 to-orange-500",
];

export default function AdminCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((data) => {
        setCourses(data);
        setLoading(false);
      });
  }, []);

  async function createCourse() {
    if (!newTitle.trim()) return;
    setCreating(true);

    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, description: newDescription || undefined }),
    });

    if (res.ok) {
      const course = await res.json();
      toast.success("Đã tạo khóa học!");
      setCreateOpen(false);
      setNewTitle("");
      setNewDescription("");
      router.push(`/admin/khoa-hoc/${course.id}/sua`);
    } else {
      toast.error("Không thể tạo khóa học");
    }
    setCreating(false);
  }

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
    toast.success(course.isPublished ? "Đã chuyển sang nháp" : "Đã xuất bản!");
  }

  async function deleteCourse(course: Course) {
    await fetch(`/api/courses/${course.id}`, { method: "DELETE" });
    setCourses((prev) => prev.filter((c) => c.id !== course.id));
    toast.success("Đã xóa khóa học");
    setDeleteTarget(null);
  }

  function getGradient(id: number) {
    return GRADIENTS[id % GRADIENTS.length];
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-32 w-full" />
              <CardContent className="p-5">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Khóa học của bạn</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {courses.length === 0
              ? "Tạo khóa học đầu tiên để bắt đầu"
              : `${courses.length} khóa học · ${courses.filter((c) => c.isPublished).length} đã xuất bản`}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Tạo khóa học
        </Button>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 animate-fade-in-up">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <BookOpen className="w-9 h-9 text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-semibold mb-2">Bắt đầu xây dựng khóa học</h2>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Tạo khóa học đầu tiên trong vài giây. Thêm video, tài liệu và bắt đầu dạy học ngay.
          </p>
          <Button size="lg" onClick={() => setCreateOpen(true)}>
            Tạo khóa học đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const sessionCount = course.sessions?.length || 0;
            const sessionsWithVideo = course.sessions?.filter(
              (s) => s.materials.some((m) => m.type === "video" && m.r2Key)
            ).length || 0;
            const completion = sessionCount > 0 ? Math.round((sessionsWithVideo / sessionCount) * 100) : 0;

            return (
              <Card key={course.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                {/* Gradient header */}
                <Link href={`/admin/khoa-hoc/${course.id}/sua`}>
                  <div className={`h-28 bg-gradient-to-br ${getGradient(course.id)} p-5 flex flex-col justify-between cursor-pointer relative`}>
                    <div className="flex justify-between items-start">
                      <Badge
                        variant={course.isPublished ? "default" : "secondary"}
                        className="bg-white/20 text-white border-0 backdrop-blur-sm text-[11px]"
                      >
                        {course.isPublished ? "Xuất bản" : "Nháp"}
                      </Badge>
                      {/* Stop propagation to prevent navigation when clicking menu */}
                      <div onClick={(e) => e.preventDefault()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition opacity-0 group-hover:opacity-100">
                            <MoreVertical className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/admin/khoa-hoc/${course.id}/sua`)}>
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => togglePublish(course)}>
                              {course.isPublished ? "Chuyển nháp" : "Xuất bản"}
                            </DropdownMenuItem>
                            {course.isPublished && (
                              <DropdownMenuItem onClick={() => window.open(`/khoa-hoc/${course.slug}`, "_blank")}>
                                Xem trước
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(course)}
                            >
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="text-white/70 text-xs font-medium">
                      {sessionCount} buổi học
                    </div>
                  </div>
                </Link>

                {/* Card body */}
                <CardContent className="p-5">
                  <Link href={`/admin/khoa-hoc/${course.id}/sua`}>
                    <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors line-clamp-1">
                      {course.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
                    {course.description || "Chưa có mô tả"}
                  </p>

                  {/* Progress bar */}
                  {sessionCount > 0 && (
                    <div>
                      <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                        <span>Nội dung</span>
                        <span>{sessionsWithVideo}/{sessionCount} buổi có video</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${getGradient(course.id)}`}
                          style={{ width: `${completion}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* "Create new" card */}
          <Card
            className="overflow-hidden border-dashed hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
            onClick={() => setCreateOpen(true)}
          >
            <div className="h-full flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-4 transition">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <p className="font-medium text-muted-foreground group-hover:text-foreground transition">Tạo khóa học mới</p>
              <p className="text-xs text-muted-foreground mt-1">Bắt đầu trong vài giây</p>
            </div>
          </Card>
        </div>
      )}

      {/* Quick create modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo khóa học mới</DialogTitle>
            <DialogDescription>
              Đặt tên cho khóa học. Bạn luôn có thể chỉnh sửa sau.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="course-title">Tên khóa học</Label>
              <Input
                id="course-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="VD: Fullstack Marketing"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && !creating && createCourse()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-desc">
                Mô tả <span className="text-muted-foreground font-normal">(tùy chọn)</span>
              </Label>
              <Textarea
                id="course-desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Mô tả ngắn giúp học viên hiểu khóa học..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button onClick={createCourse} disabled={!newTitle.trim() || creating}>
              {creating ? "Đang tạo..." : "Tạo và bắt đầu soạn"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
