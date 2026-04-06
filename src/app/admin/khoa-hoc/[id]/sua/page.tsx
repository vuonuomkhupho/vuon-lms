"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/file-upload";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
  video: { icon: "🎬", label: "Video", color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800" },
  pdf: { icon: "📄", label: "PDF / Slide", color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800" },
  recap: { icon: "📝", label: "Recap", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800" },
  link: { icon: "🔗", label: "Link", color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800" },
};

function MaterialEditor({
  material,
  courseId,
  sessionId,
  onDelete,
  onUpdate,
}: {
  material: Material;
  courseId: string;
  sessionId: number;
  onDelete: () => void;
  onUpdate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const config = MATERIAL_CONFIG[material.type];

  async function saveMaterial(data: Record<string, unknown>) {
    setSaving(true);
    await fetch(`/api/materials/${material.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    toast.success("Đã lưu");
    onUpdate();
  }

  return (
    <>
      <div className={`rounded-xl border overflow-hidden transition-all ${expanded ? "shadow-sm" : ""} ${config.color}`}>
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="text-lg">{config.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">{material.title}</div>
            <div className="text-xs opacity-60">
              {material.type === "recap" && (material.contentText ? "Bấm để sửa nội dung" : "Chưa có nội dung — bấm để thêm")}
              {material.type === "link" && (material.externalUrl || "Chưa có URL")}
              {material.type === "pdf" && (material.r2Key ? "Đã upload" : "Chưa upload")}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saving && <span className="text-xs opacity-60">Đang lưu...</span>}
            <span className="text-xs opacity-50">{expanded ? "▲" : "▼"}</span>
          </div>
        </div>

        {expanded && (
          <div className="px-4 pb-4 border-t border-current/10 bg-background/50">
            {material.type === "recap" && (
              <div className="mt-3">
                <label className="text-xs font-medium text-muted-foreground block mb-1">Nội dung recap</label>
                <textarea
                  className="w-full min-h-[200px] p-3 text-sm border rounded-lg resize-y outline-none focus:border-primary focus:ring-1 focus:ring-primary transition bg-background"
                  defaultValue={material.contentText || ""}
                  placeholder="Viết tóm tắt nội dung buổi học ở đây..."
                  onBlur={(e) => saveMaterial({ contentText: e.target.value })}
                />
              </div>
            )}

            {material.type === "link" && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Tên tài liệu</label>
                  <input
                    className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-primary transition bg-background"
                    defaultValue={material.title}
                    onBlur={(e) => saveMaterial({ title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">URL</label>
                  <input
                    className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-primary transition bg-background"
                    defaultValue={material.externalUrl || ""}
                    placeholder="https://docs.google.com/..."
                    onBlur={(e) => saveMaterial({ externalUrl: e.target.value })}
                  />
                </div>
              </div>
            )}

            {material.type === "pdf" && (
              <div className="mt-3">
                {material.r2Key ? (
                  <div className="text-sm text-muted-foreground">
                    File đã upload. <button className="text-primary hover:underline" onClick={() => setConfirmDelete(true)}>Xóa và upload lại</button>
                  </div>
                ) : (
                  <FileUpload
                    courseId={courseId}
                    sessionId={sessionId}
                    accept=".pdf,.ppt,.pptx"
                    onUploadComplete={async (key) => {
                      await saveMaterial({ r2Key: key });
                    }}
                  />
                )}
              </div>
            )}

            <div className="mt-4 pt-3 border-t">
              <button
                className="text-xs text-destructive/70 hover:text-destructive transition"
                onClick={() => setConfirmDelete(true)}
              >
                Xóa tài liệu này
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Xóa tài liệu?"
        description={`Bạn có chắc muốn xóa "${material.title}"?`}
        confirmLabel="Xóa"
        destructive
        onConfirm={onDelete}
      />
    </>
  );
}

export default function EditCoursePage() {
  const { id } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState<number | null>(null);
  const [addingMaterial, setAddingMaterial] = useState(false);
  const [deleteSessionTarget, setDeleteSessionTarget] = useState<Session | null>(null);
  const [linkDialog, setLinkDialog] = useState<{ sessionId: number } | null>(null);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const newSessionRef = useRef<HTMLInputElement>(null);
  const editTitleRef = useRef<HTMLInputElement>(null);

  async function loadCourse() {
    const res = await fetch(`/api/courses/${id}`);
    if (res.ok) {
      const data = await res.json();
      setCourse(data);
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

  async function deleteSession(session: Session) {
    await fetch(`/api/courses/${id}/sessions/${session.id}`, { method: "DELETE" });
    toast.success("Đã xóa buổi học");
    if (selectedSession === session.id) setSelectedSession(null);
    setDeleteSessionTarget(null);
    loadCourse();
  }

  async function addMaterial(sessionId: number, type: Material["type"], extra?: Record<string, unknown>) {
    const body: Record<string, unknown> = { type, ...extra };

    if (type === "recap") {
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

  async function addLinkMaterial(sessionId: number) {
    if (!linkTitle || !linkUrl) return;
    await fetch(`/api/courses/${id}/sessions/${sessionId}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "link", title: linkTitle, externalUrl: linkUrl }),
    });
    toast.success("Đã thêm Link");
    setLinkDialog(null);
    setLinkTitle("");
    setLinkUrl("");
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
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!course) return <p className="text-muted-foreground">Không tìm thấy khóa học</p>;

  const currentSession = course.sessions.find((s) => s.id === selectedSession);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col -my-6 -mx-4">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b bg-background shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => router.push("/admin/khoa-hoc")}
            className="text-sm text-muted-foreground hover:text-foreground transition shrink-0"
          >
            ← Quay lại
          </button>
          <input
            className="text-lg font-semibold bg-transparent border-0 outline-none focus:ring-0 min-w-0 w-full max-w-sm"
            defaultValue={course.title}
            onBlur={(e) => {
              if (e.target.value !== course.title) updateCourse({ title: e.target.value });
            }}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
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
        <div className="w-72 border-r bg-muted/30 flex flex-col shrink-0 max-md:w-56">
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
                        : "hover:bg-muted"
                      }
                    `}
                    onClick={() => setSelectedSession(session.id)}
                    onDoubleClick={() => {
                      setEditingTitle(session.id);
                      setTimeout(() => editTitleRef.current?.focus(), 50);
                    }}
                  >
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0
                      ${isSelected
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : hasVideo
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : hasMaterials
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                            : "bg-muted text-muted-foreground"
                      }
                    `}>
                      {hasVideo ? "✓" : idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      {editingTitle === session.id ? (
                        <input
                          ref={editTitleRef}
                          className="w-full bg-background text-foreground text-sm rounded px-1 py-0.5 outline-none"
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

                    {isSelected && (
                      <button
                        className="text-primary-foreground/50 hover:text-primary-foreground text-xs shrink-0"
                        onClick={(e) => { e.stopPropagation(); setDeleteSessionTarget(session); }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="p-3 border-t">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed hover:border-muted-foreground/40 transition">
              <span className="text-muted-foreground text-sm">+</span>
              <input
                ref={newSessionRef}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
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
            <div className="max-w-2xl mx-auto px-6 md:px-8 py-8">
              <div className="mb-8">
                <div className="text-xs text-muted-foreground mb-1">
                  Buổi {course.sessions.findIndex((s) => s.id === currentSession.id) + 1}
                </div>
                <input
                  className="text-2xl font-bold w-full bg-transparent outline-none placeholder:text-muted-foreground/30"
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
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-50 border border-purple-200 dark:bg-purple-950 dark:border-purple-800">
                    <span className="text-2xl">🎬</span>
                    <div className="flex-1">
                      <div className="font-medium text-purple-700 dark:text-purple-300">
                        {currentSession.materials.find((m) => m.type === "video")?.title}
                      </div>
                      <div className="text-xs text-purple-500 dark:text-purple-400">Đã upload</div>
                    </div>
                    <button
                      className="text-xs text-purple-400 hover:text-destructive transition"
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

                <div className="space-y-3 mb-4">
                  {currentSession.materials
                    .filter((m) => m.type !== "video")
                    .map((mat) => (
                      <MaterialEditor
                        key={mat.id}
                        material={mat}
                        courseId={id as string}
                        sessionId={currentSession.id}
                        onDelete={() => deleteMaterial(currentSession.id, mat.id)}
                        onUpdate={loadCourse}
                      />
                    ))}
                </div>

                <div className="relative">
                  <button
                    onClick={() => setAddingMaterial(!addingMaterial)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed text-sm text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground transition"
                  >
                    + Thêm tài liệu
                  </button>

                  {addingMaterial && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-popover rounded-xl shadow-lg border p-2 z-10 animate-in fade-in duration-150">
                      {(["pdf", "recap"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            addMaterial(currentSession.id, type);
                            setAddingMaterial(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition text-left"
                        >
                          <span className="text-lg">{MATERIAL_CONFIG[type].icon}</span>
                          <div>
                            <div className="text-sm font-medium">{MATERIAL_CONFIG[type].label}</div>
                            <div className="text-xs text-muted-foreground">
                              {type === "pdf" && "Upload slide hoặc tài liệu PDF"}
                              {type === "recap" && "Tóm tắt nội dung buổi học"}
                            </div>
                          </div>
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setLinkDialog({ sessionId: currentSession.id });
                          setAddingMaterial(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition text-left"
                      >
                        <span className="text-lg">{MATERIAL_CONFIG.link.icon}</span>
                        <div>
                          <div className="text-sm font-medium">{MATERIAL_CONFIG.link.label}</div>
                          <div className="text-xs text-muted-foreground">Link Google Docs, Sheets, bài viết</div>
                        </div>
                      </button>

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
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
                    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
                  </svg>
                </div>
                <p>Chọn một buổi học để chỉnh sửa</p>
                <p className="text-sm">hoặc thêm buổi học mới từ sidebar bên trái</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete session dialog */}
      <ConfirmDialog
        open={!!deleteSessionTarget}
        onOpenChange={(open) => !open && setDeleteSessionTarget(null)}
        title="Xóa buổi học?"
        description={`Bạn có chắc muốn xóa "${deleteSessionTarget?.title}"? Tất cả tài liệu trong buổi học này sẽ bị xóa vĩnh viễn.`}
        confirmLabel="Xóa"
        destructive
        onConfirm={() => deleteSessionTarget && deleteSession(deleteSessionTarget)}
      />

      {/* Add link dialog (replaces prompt()) */}
      <Dialog open={!!linkDialog} onOpenChange={(open) => !open && setLinkDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm link tài liệu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tên tài liệu</Label>
              <Input
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="VD: Bài tập Google Sheets"
              />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://docs.google.com/..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialog(null)}>Hủy</Button>
            <Button
              onClick={() => linkDialog && addLinkMaterial(linkDialog.sessionId)}
              disabled={!linkTitle || !linkUrl}
            >
              Thêm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
