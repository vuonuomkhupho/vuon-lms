"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUpload } from "@/components/file-upload";
import { toast } from "sonner";

interface Material {
  id: number;
  type: "video" | "pdf" | "recap" | "link";
  title: string;
  r2Key?: string;
  externalUrl?: string;
  contentText?: string;
  metadata?: Record<string, unknown>;
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
  slug: string;
  description: string | null;
  isPublished: boolean;
  sessions: Session[];
}

const MATERIAL_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  video: { icon: "🎬", label: "Video", color: "bg-purple-50 text-purple-700 border-purple-200" },
  pdf: { icon: "📄", label: "PDF / Slide", color: "bg-blue-50 text-blue-700 border-blue-200" },
  recap: { icon: "📝", label: "Recap", color: "bg-amber-50 text-amber-700 border-amber-200" },
  link: { icon: "🔗", label: "Link", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export default function EditCoursePage() {
  const { id } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState<number | null>(null);
  const [addingMaterial, setAddingMaterial] = useState(false);
  const newSessionRef = useRef<HTMLInputElement>(null);
  const editTitleRef = useRef<HTMLInputElement>(null);

  async function loadCourse() {
    const res = await fetch(`/api/courses/${id}`);
    if (res.ok) {
      const data = await res.json();
      setCourse(data);
      // Auto-select first session if none selected
      if (!selectedSession && data.sessions.length > 0) {
        setSelectedSession(data.sessions[0].id);
      }
    }
    setLoading(false);
  }

  useEffect(() => { loadCourse(); }, [id]);

  async function updateCourse(data: Partial<Course>) {
    await fetch(`/api/courses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    toast.success("Đã lưu");
    loadCourse();
  }

  async function addSession(title: string) {
    if (!title.trim()) return;
    const res = await fetch(`/api/courses/${id}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const session = await res.json();
    toast.success("Đã thêm buổi học");
    if (newSessionRef.current) newSessionRef.current.value = "";
    await loadCourse();
    setSelectedSession(session.id);
  }

  async function renameSession(sessionId: number, title: string) {
    await fetch(`/api/courses/${id}/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setEditingTitle(null);
    loadCourse();
  }

  async function deleteSession(sessionId: number) {
    if (!confirm("Xóa buổi học này và tất cả tài liệu?")) return;
    await fetch(`/api/courses/${id}/sessions/${sessionId}`, { method: "DELETE" });
    toast.success("Đã xóa buổi học");
    if (selectedSession === sessionId) setSelectedSession(null);
    loadCourse();
  }

  async function addMaterial(sessionId: number, type: Material["type"], extra?: Record<string, unknown>) {
    const body: Record<string, unknown> = { type, ...extra };

    if (type === "link") {
      const title = prompt("Tên tài liệu:");
      const url = prompt("URL (Google Docs, Sheets...):");
      if (!title || !url) return;
      body.title = title;
      body.externalUrl = url;
    } else if (type === "recap") {
      body.title = "Recap";
      body.contentText = "";
    } else if (type === "video") {
      body.title = "Video bài giảng";
    } else {
      body.title = "Slide bài giảng";
    }

    await fetch(`/api/courses/${id}/sessions/${sessionId}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    toast.success(`Đã thêm ${MATERIAL_CONFIG[type].label}`);
    loadCourse();
  }

  async function deleteMaterial(sessionId: number, materialId: number) {
    await fetch(
      `/api/courses/${id}/sessions/${sessionId}/materials?materialId=${materialId}`,
      { method: "DELETE" }
    );
    toast.success("Đã xóa");
    loadCourse();
  }

  async function handleFileUpload(sessionId: number, key: string, file: File) {
    const type = file.type.startsWith("video/") ? "video" : "pdf";
    await fetch(`/api/courses/${id}/sessions/${sessionId}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        title: file.name,
        r2Key: key,
        metadata: { size: file.size, contentType: file.type },
      }),
    });
    toast.success(`Upload ${file.name} thành công!`);
    loadCourse();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="animate-pulse text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  if (!course) return <p>Không tìm thấy khóa học</p>;

  const currentSession = course.sessions.find((s) => s.id === selectedSession);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col -my-6 -mx-4">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-white shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/khoa-hoc")}
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            ← Quay lại
          </button>
          <input
            className="text-lg font-semibold bg-transparent border-0 outline-none focus:ring-0 w-80"
            defaultValue={course.title}
            onBlur={(e) => {
              if (e.target.value !== course.title) updateCourse({ title: e.target.value });
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={course.isPublished ? "default" : "secondary"} className="text-xs">
            {course.isPublished ? "Đã xuất bản" : "Nháp"}
          </Badge>
          <Button
            size="sm"
            variant={course.isPublished ? "outline" : "default"}
            onClick={() => updateCourse({ isPublished: !course.isPublished })}
          >
            {course.isPublished ? "Chuyển nháp" : "Xuất bản"}
          </Button>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Curriculum */}
        <div className="w-72 border-r bg-zinc-50/50 flex flex-col shrink-0">
          <div className="px-4 py-3 border-b">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Nội dung ({course.sessions.length} buổi)
            </h3>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {course.sessions.map((session, idx) => {
                const isSelected = selectedSession === session.id;
                const hasVideo = session.materials.some((m) => m.type === "video" && m.r2Key);
                const hasMaterials = session.materials.length > 0;

                return (
                  <div
                    key={session.id}
                    className={`
                      group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150
                      ${isSelected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-zinc-100"
                      }
                    `}
                    onClick={() => setSelectedSession(session.id)}
                    onDoubleClick={() => {
                      setEditingTitle(session.id);
                      setTimeout(() => editTitleRef.current?.focus(), 50);
                    }}
                  >
                    {/* Status indicator */}
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0
                      ${isSelected
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : hasVideo
                          ? "bg-green-100 text-green-700"
                          : hasMaterials
                            ? "bg-amber-100 text-amber-700"
                            : "bg-zinc-200 text-zinc-500"
                      }
                    `}>
                      {hasVideo ? "✓" : idx + 1}
                    </div>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                      {editingTitle === session.id ? (
                        <input
                          ref={editTitleRef}
                          className="w-full bg-white text-foreground text-sm rounded px-1 py-0.5 outline-none"
                          defaultValue={session.title}
                          onBlur={(e) => renameSession(session.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") renameSession(session.id, e.currentTarget.value);
                            if (e.key === "Escape") setEditingTitle(null);
                          }}
                        />
                      ) : (
                        <span className="text-sm truncate block">{session.title}</span>
                      )}
                      {!isSelected && session.materials.length > 0 && (
                        <span className="text-xs opacity-50">
                          {session.materials.map((m) => MATERIAL_CONFIG[m.type].icon).join("")}
                        </span>
                      )}
                    </div>

                    {/* Delete */}
                    {isSelected && (
                      <button
                        className="text-primary-foreground/50 hover:text-primary-foreground text-xs shrink-0"
                        onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Add session */}
          <div className="p-3 border-t">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-zinc-300 hover:border-zinc-400 transition">
              <span className="text-zinc-400 text-sm">+</span>
              <input
                ref={newSessionRef}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
                placeholder="Thêm buổi học..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") addSession(e.currentTarget.value);
                }}
              />
            </div>
          </div>
        </div>

        {/* Right panel — Lesson Editor */}
        <div className="flex-1 overflow-y-auto">
          {currentSession ? (
            <div className="max-w-2xl mx-auto px-8 py-8">
              {/* Session title */}
              <div className="mb-8">
                <div className="text-xs text-muted-foreground mb-1">
                  Buổi {course.sessions.findIndex((s) => s.id === currentSession.id) + 1}
                </div>
                <input
                  className="text-2xl font-bold w-full bg-transparent outline-none placeholder:text-zinc-300"
                  defaultValue={currentSession.title}
                  key={currentSession.id + "-title"}
                  onBlur={(e) => {
                    if (e.target.value !== currentSession.title) {
                      renameSession(currentSession.id, e.target.value);
                    }
                  }}
                />
              </div>

              {/* Video section */}
              <div className="mb-8">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">VIDEO BÀI GIẢNG</h4>
                {currentSession.materials.find((m) => m.type === "video" && m.r2Key) ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-50 border border-purple-200">
                    <span className="text-2xl">🎬</span>
                    <div className="flex-1">
                      <div className="font-medium text-purple-700">
                        {currentSession.materials.find((m) => m.type === "video")?.title}
                      </div>
                      <div className="text-xs text-purple-500">Đã upload</div>
                    </div>
                    <button
                      className="text-xs text-purple-400 hover:text-red-500 transition"
                      onClick={() => {
                        const mat = currentSession.materials.find((m) => m.type === "video");
                        if (mat) deleteMaterial(currentSession.id, mat.id);
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                ) : (
                  <FileUpload
                    courseId={id as string}
                    sessionId={currentSession.id}
                    accept="video/*"
                    onUploadComplete={(key, file) => handleFileUpload(currentSession.id, key, file)}
                  />
                )}
              </div>

              {/* Materials section */}
              <div className="mb-8">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">TÀI LIỆU</h4>

                {/* Existing materials (non-video) */}
                <div className="space-y-2 mb-4">
                  {currentSession.materials
                    .filter((m) => m.type !== "video")
                    .map((mat) => {
                      const config = MATERIAL_CONFIG[mat.type];
                      return (
                        <div
                          key={mat.id}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150 hover:shadow-sm ${config.color}`}
                        >
                          <span className="text-lg">{config.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{mat.title}</div>
                            {mat.externalUrl && (
                              <div className="text-xs opacity-60 truncate">{mat.externalUrl}</div>
                            )}
                            {mat.r2Key && (
                              <div className="text-xs opacity-60">Đã upload</div>
                            )}
                            {mat.type === "recap" && !mat.contentText && (
                              <div className="text-xs opacity-60">Chưa có nội dung</div>
                            )}
                          </div>
                          <button
                            className="text-xs opacity-40 hover:opacity-100 hover:text-red-600 transition"
                            onClick={() => deleteMaterial(currentSession.id, mat.id)}
                          >
                            Xóa
                          </button>
                        </div>
                      );
                    })}
                </div>

                {/* Add material */}
                <div className="relative">
                  <button
                    onClick={() => setAddingMaterial(!addingMaterial)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-zinc-200 text-sm text-muted-foreground hover:border-zinc-300 hover:text-foreground transition"
                  >
                    + Thêm tài liệu
                  </button>

                  {addingMaterial && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border p-2 z-10 animate-in fade-in duration-150">
                      {(["pdf", "recap", "link"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            addMaterial(currentSession.id, type);
                            setAddingMaterial(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-zinc-50 transition text-left"
                        >
                          <span className="text-lg">{MATERIAL_CONFIG[type].icon}</span>
                          <div>
                            <div className="text-sm font-medium">{MATERIAL_CONFIG[type].label}</div>
                            <div className="text-xs text-muted-foreground">
                              {type === "pdf" && "Upload slide hoặc tài liệu PDF"}
                              {type === "recap" && "Tóm tắt nội dung buổi học"}
                              {type === "link" && "Link Google Docs, Sheets, bài viết"}
                            </div>
                          </div>
                        </button>
                      ))}

                      {/* File upload option */}
                      <div className="border-t mt-1 pt-1">
                        <FileUpload
                          courseId={id as string}
                          sessionId={currentSession.id}
                          accept=".pdf,.ppt,.pptx,image/*"
                          onUploadComplete={(key, file) => {
                            handleFileUpload(currentSession.id, key, file);
                            setAddingMaterial(false);
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center space-y-2">
                <div className="text-4xl">📚</div>
                <p>Chọn một buổi học để chỉnh sửa</p>
                <p className="text-sm">hoặc thêm buổi học mới từ sidebar bên trái</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
