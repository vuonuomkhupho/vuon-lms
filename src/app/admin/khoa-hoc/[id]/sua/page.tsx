"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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

const MATERIAL_ICONS: Record<string, string> = {
  video: "🎬",
  pdf: "📄",
  recap: "📝",
  link: "🔗",
};

const MATERIAL_COLORS: Record<string, string> = {
  video: "bg-purple-50 border-purple-200 text-purple-700",
  pdf: "bg-blue-50 border-blue-200 text-blue-700",
  recap: "bg-amber-50 border-amber-200 text-amber-700",
  link: "bg-emerald-50 border-emerald-200 text-emerald-700",
};

export default function EditCoursePage() {
  const { id } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const newSessionRef = useRef<HTMLInputElement>(null);

  async function loadCourse() {
    const res = await fetch(`/api/courses/${id}`);
    if (res.ok) setCourse(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadCourse(); }, [id]);

  async function updateCourse(data: Partial<Course>) {
    setSaving(true);
    await fetch(`/api/courses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await loadCourse();
    setSaving(false);
  }

  async function addSession(title: string) {
    if (!title.trim()) return;
    await fetch(`/api/courses/${id}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    await loadCourse();
    if (newSessionRef.current) newSessionRef.current.value = "";
  }

  async function deleteSession(sessionId: number) {
    if (!confirm("Xóa buổi học này và tất cả tài liệu?")) return;
    await fetch(`/api/courses/${id}/sessions/${sessionId}`, { method: "DELETE" });
    loadCourse();
  }

  async function addMaterial(sessionId: number, type: Material["type"]) {
    let body: Record<string, unknown> = { type };

    if (type === "link") {
      const title = prompt("Tên tài liệu:") || "";
      const url = prompt("URL (Google Docs, Sheets...):") || "";
      if (!title || !url) return;
      body = { ...body, title, externalUrl: url };
    } else if (type === "recap") {
      body = { ...body, title: "Recap", contentText: "" };
    } else if (type === "video") {
      body = { ...body, title: "Video bài giảng" };
    } else {
      body = { ...body, title: "Slide bài giảng" };
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

  async function uploadFile(sessionId: number, materialId: number, file: File) {
    // Get presigned URL
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        courseId: id,
        sessionId,
      }),
    });

    if (!res.ok) { alert("Lỗi tạo upload URL"); return; }
    const { uploadUrl, key } = await res.json();

    // Upload directly to R2
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (!uploadRes.ok) { alert("Lỗi upload file"); return; }

    // Update material with R2 key
    await fetch(`/api/courses/${id}/sessions/${sessionId}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: file.type.startsWith("video/") ? "video" : "pdf",
        title: file.name,
        r2Key: key,
        metadata: { size: file.size, contentType: file.type },
      }),
    });

    loadCourse();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Đang tải khóa học...</div>
      </div>
    );
  }

  if (!course) return <p>Không tìm thấy khóa học</p>;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.push("/admin/khoa-hoc")}
          className="text-sm text-muted-foreground hover:text-foreground transition"
        >
          ← Quay lại danh sách
        </button>
        <div className="flex items-center gap-3">
          {saving && <span className="text-xs text-muted-foreground">Đang lưu...</span>}
          <Button
            variant={course.isPublished ? "outline" : "default"}
            onClick={() => updateCourse({ isPublished: !course.isPublished })}
          >
            {course.isPublished ? "⬇ Chuyển về nháp" : "🚀 Xuất bản"}
          </Button>
        </div>
      </div>

      {/* Course header — inline editable */}
      <div className="mb-10">
        <input
          className="text-3xl font-bold w-full bg-transparent border-0 outline-none focus:ring-0 placeholder:text-zinc-300"
          defaultValue={course.title}
          placeholder="Tên khóa học..."
          onBlur={(e) => {
            if (e.target.value !== course.title) updateCourse({ title: e.target.value });
          }}
        />
        <textarea
          className="mt-2 w-full text-muted-foreground bg-transparent border-0 outline-none resize-none focus:ring-0 placeholder:text-zinc-300"
          defaultValue={course.description || ""}
          placeholder="Thêm mô tả khóa học..."
          rows={2}
          onBlur={(e) => {
            if (e.target.value !== (course.description || "")) updateCourse({ description: e.target.value });
          }}
        />
        <div className="flex items-center gap-2 mt-3">
          <Badge variant={course.isPublished ? "default" : "secondary"}>
            {course.isPublished ? "Đã xuất bản" : "Nháp"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {course.sessions.length} buổi học
          </span>
        </div>
      </div>

      {/* Sessions */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Nội dung khóa học
        </h2>

        <div className="space-y-3">
          {course.sessions.map((session, idx) => {
            const isExpanded = expandedSession === session.id;

            return (
              <div
                key={session.id}
                className={`rounded-xl border transition-all ${
                  isExpanded ? "bg-white shadow-md border-zinc-300" : "bg-zinc-50/50 hover:bg-zinc-50 border-zinc-200"
                }`}
              >
                {/* Session header */}
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer"
                  onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-200 text-zinc-600 text-sm font-medium shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{session.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {session.materials.length === 0
                        ? "Chưa có tài liệu"
                        : session.materials.map((m) => MATERIAL_ICONS[m.type]).join(" ")}
                    </div>
                  </div>
                  <span className="text-muted-foreground text-lg">
                    {isExpanded ? "−" : "+"}
                  </span>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-zinc-100">
                    {/* Materials list */}
                    {session.materials.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {session.materials.map((mat) => (
                          <div
                            key={mat.id}
                            className={`flex items-center justify-between px-4 py-2.5 rounded-lg border ${MATERIAL_COLORS[mat.type]}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{MATERIAL_ICONS[mat.type]}</span>
                              <div>
                                <div className="text-sm font-medium">{mat.title}</div>
                                {mat.r2Key && (
                                  <div className="text-xs opacity-60">Đã upload</div>
                                )}
                                {mat.externalUrl && (
                                  <div className="text-xs opacity-60 truncate max-w-xs">
                                    {mat.externalUrl}
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              className="text-xs opacity-50 hover:opacity-100 transition"
                              onClick={() => deleteMaterial(session.id, mat.id)}
                            >
                              Xóa
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload dropzone */}
                    <div
                      className="mt-4 border-2 border-dashed border-zinc-200 rounded-lg p-6 text-center hover:border-zinc-400 transition cursor-pointer"
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-primary", "bg-primary/5"); }}
                      onDragLeave={(e) => { e.currentTarget.classList.remove("border-primary", "bg-primary/5"); }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove("border-primary", "bg-primary/5");
                        const file = e.dataTransfer.files[0];
                        if (file) await uploadFile(session.id, 0, file);
                      }}
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "video/*,.pdf,.ppt,.pptx,image/*";
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) await uploadFile(session.id, 0, file);
                        };
                        input.click();
                      }}
                    >
                      <div className="text-2xl mb-1">📁</div>
                      <div className="text-sm text-muted-foreground">
                        Kéo thả file hoặc <span className="text-primary font-medium">bấm để upload</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Video, PDF, Slide, Hình ảnh
                      </div>
                    </div>

                    {/* Quick add buttons */}
                    <div className="flex items-center gap-2 mt-4">
                      <span className="text-xs text-muted-foreground">Thêm nhanh:</span>
                      {(["video", "pdf", "recap", "link"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => addMaterial(session.id, type)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full border border-zinc-200 hover:bg-zinc-100 transition"
                        >
                          {MATERIAL_ICONS[type]} {type === "video" ? "Video" : type === "pdf" ? "PDF" : type === "recap" ? "Recap" : "Link"}
                        </button>
                      ))}
                    </div>

                    {/* Delete session */}
                    <div className="mt-4 pt-3 border-t border-zinc-100">
                      <button
                        className="text-xs text-red-400 hover:text-red-600 transition"
                        onClick={() => deleteSession(session.id)}
                      >
                        Xóa buổi học này
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add session */}
      <div className="flex items-center gap-3 py-3 px-5 rounded-xl border-2 border-dashed border-zinc-200 hover:border-zinc-300 transition">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 text-sm">
          +
        </div>
        <input
          ref={newSessionRef}
          className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-zinc-400"
          placeholder="Nhập tên buổi học mới và nhấn Enter..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addSession(e.currentTarget.value);
            }
          }}
        />
      </div>
    </div>
  );
}
