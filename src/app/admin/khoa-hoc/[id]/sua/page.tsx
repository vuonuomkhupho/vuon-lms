"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Material {
  id: number;
  type: "video" | "pdf" | "recap" | "link";
  title: string;
  r2Key?: string;
  externalUrl?: string;
  contentText?: string;
}

interface Session {
  id: number;
  title: string;
  description: string | null;
  orderIndex: number;
  materials: Material[];
}

interface Course {
  id: number;
  title: string;
  description: string | null;
  isPublished: boolean;
  sessions: Session[];
}

export default function EditCoursePage() {
  const { id } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [newSessionTitle, setNewSessionTitle] = useState("");

  async function loadCourse() {
    const res = await fetch(`/api/courses/${id}`);
    if (res.ok) {
      setCourse(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => {
    loadCourse();
  }, [id]);

  async function updateCourse(data: Partial<Course>) {
    await fetch(`/api/courses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    loadCourse();
  }

  async function addSession() {
    if (!newSessionTitle.trim()) return;
    await fetch(`/api/courses/${id}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newSessionTitle }),
    });
    setNewSessionTitle("");
    loadCourse();
  }

  async function deleteSession(sessionId: number) {
    if (!confirm("Xóa buổi học này?")) return;
    await fetch(`/api/courses/${id}/sessions/${sessionId}`, {
      method: "DELETE",
    });
    loadCourse();
  }

  async function addMaterial(sessionId: number, type: Material["type"]) {
    let title = "";
    let body: Record<string, unknown> = { type };

    if (type === "link") {
      title = prompt("Tên link:") || "";
      const url = prompt("URL:") || "";
      if (!title || !url) return;
      body = { ...body, title, externalUrl: url };
    } else if (type === "recap") {
      title = prompt("Tiêu đề:") || "Recap";
      body = { ...body, title, contentText: "" };
    } else {
      title = prompt(`Tên ${type === "video" ? "video" : "tài liệu"}:`) || "";
      if (!title) return;
      body = { ...body, title };
    }

    await fetch(`/api/courses/${id}/sessions/${sessionId}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    loadCourse();
  }

  async function deleteMaterial(sessionId: number, materialId: number) {
    await fetch(
      `/api/courses/${id}/sessions/${sessionId}/materials?materialId=${materialId}`,
      { method: "DELETE" }
    );
    loadCourse();
  }

  if (loading) return <p className="text-muted-foreground">Đang tải...</p>;
  if (!course) return <p>Không tìm thấy khóa học</p>;

  const materialTypeLabels: Record<string, string> = {
    video: "Video",
    pdf: "PDF/Slide",
    recap: "Recap",
    link: "Link",
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Chỉnh sửa khóa học</h1>
        <Badge variant={course.isPublished ? "default" : "secondary"}>
          {course.isPublished ? "Đã xuất bản" : "Nháp"}
        </Badge>
      </div>

      {/* Course info */}
      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Tên khóa học</Label>
            <Input
              defaultValue={course.title}
              onBlur={(e) => {
                if (e.target.value !== course.title) {
                  updateCourse({ title: e.target.value });
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea
              defaultValue={course.description || ""}
              rows={2}
              onBlur={(e) => {
                if (e.target.value !== (course.description || "")) {
                  updateCourse({ description: e.target.value });
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sessions */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          Buổi học ({course.sessions.length})
        </h2>
      </div>

      <div className="space-y-3 mb-4">
        {course.sessions.map((session, idx) => (
          <Card key={session.id}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-sm text-muted-foreground mr-2">
                    Buổi {idx + 1}
                  </span>
                  <span className="font-medium">{session.title}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                  onClick={() => deleteSession(session.id)}
                >
                  Xóa
                </Button>
              </div>

              {/* Materials */}
              {session.materials.length > 0 && (
                <div className="space-y-1 mb-3">
                  {session.materials.map((mat) => (
                    <div
                      key={mat.id}
                      className="flex items-center justify-between text-sm py-1 px-2 bg-zinc-50 rounded"
                    >
                      <span>
                        <Badge variant="outline" className="mr-2 text-xs">
                          {materialTypeLabels[mat.type]}
                        </Badge>
                        {mat.title}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 h-6 px-2"
                        onClick={() => deleteMaterial(session.id, mat.id)}
                      >
                        &times;
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add material buttons */}
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => addMaterial(session.id, "video")}
                >
                  + Video
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => addMaterial(session.id, "pdf")}
                >
                  + PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => addMaterial(session.id, "recap")}
                >
                  + Recap
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => addMaterial(session.id, "link")}
                >
                  + Link
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add session */}
      <div className="flex gap-2 mb-8">
        <Input
          placeholder="Tên buổi học mới..."
          value={newSessionTitle}
          onChange={(e) => setNewSessionTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSession()}
        />
        <Button onClick={addSession} disabled={!newSessionTitle.trim()}>
          Thêm buổi
        </Button>
      </div>

      <Separator className="mb-4" />

      <div className="flex gap-2">
        <Button
          onClick={() =>
            updateCourse({ isPublished: !course.isPublished })
          }
        >
          {course.isPublished ? "Chuyển về nháp" : "Xuất bản khóa học"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/admin/khoa-hoc")}>
          Quay lại
        </Button>
      </div>
    </div>
  );
}
