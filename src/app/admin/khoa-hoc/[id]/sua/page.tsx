"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileUpload } from "@/components/file-upload";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";

// ─── Types ───

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

// ─── Material type cards ───

const MATERIAL_TYPES = [
  {
    type: "video" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
    label: "Video",
    description: "Upload video bài giảng",
    colors: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  },
  {
    type: "pdf" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
    label: "Tài liệu",
    description: "PDF, slide, hình ảnh",
    colors: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  },
  {
    type: "recap" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
    label: "Recap",
    description: "Tóm tắt nội dung",
    colors: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
  {
    type: "link" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
      </svg>
    ),
    label: "Link",
    description: "Google Docs, bài viết",
    colors: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
];

function getMaterialConfig(type: string) {
  return MATERIAL_TYPES.find((m) => m.type === type) || MATERIAL_TYPES[0];
}

// ─── MaterialCard ───

function MaterialCard({
  material,
  onSave,
  onDelete,
  courseId,
  sessionId,
}: {
  material: Material;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onDelete: () => void;
  courseId: string;
  sessionId: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const config = getMaterialConfig(material.type);

  async function save(data: Record<string, unknown>) {
    setSaving(true);
    await onSave(data);
    setSaving(false);
  }

  const statusText = {
    recap: material.contentText ? "Đã viết" : "Chưa có nội dung",
    link: material.externalUrl ? new URL(material.externalUrl).hostname : "Chưa có URL",
    pdf: material.r2Key ? "Đã upload" : "Chưa upload",
    video: material.r2Key ? "Đã upload" : "Chưa upload",
  }[material.type] || "";

  return (
    <>
      <div className={`rounded-lg border transition-all ${expanded ? "shadow-sm ring-1 ring-border" : "hover:shadow-sm"}`}>
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.colors}`}>
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{material.title}</div>
            <div className="text-xs text-muted-foreground">{statusText}</div>
          </div>
          {saving && (
            <span className="text-xs text-muted-foreground animate-pulse">Lưu...</span>
          )}
          <svg
            width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
            className={`text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M4 6l4 4 4-4"/>
          </svg>
        </div>

        {expanded && (
          <div className="px-4 pb-4 border-t">
            {material.type === "recap" && (
              <div className="mt-3">
                <Textarea
                  className="min-h-[160px] resize-y"
                  defaultValue={material.contentText || ""}
                  placeholder="Viết tóm tắt nội dung buổi học..."
                  onBlur={(e) => save({ contentText: e.target.value })}
                />
              </div>
            )}

            {material.type === "link" && (
              <div className="mt-3 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tên hiển thị</Label>
                  <Input
                    defaultValue={material.title}
                    onBlur={(e) => save({ title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">URL</Label>
                  <Input
                    defaultValue={material.externalUrl || ""}
                    placeholder="https://..."
                    onBlur={(e) => save({ externalUrl: e.target.value })}
                  />
                </div>
              </div>
            )}

            {material.type === "pdf" && (
              <div className="mt-3">
                {material.r2Key ? (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500 shrink-0"><path d="M20 6L9 17l-5-5"/></svg>
                    <span className="text-sm text-muted-foreground flex-1">File đã upload</span>
                    <button className="text-xs text-destructive hover:underline" onClick={() => setConfirmDelete(true)}>Xóa</button>
                  </div>
                ) : (
                  <FileUpload courseId={courseId} sessionId={sessionId} accept=".pdf,.ppt,.pptx" onUploadComplete={async (key) => { await save({ r2Key: key }); }} />
                )}
              </div>
            )}

            {material.type === "video" && (
              <div className="mt-3">
                {material.r2Key ? (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500 shrink-0"><path d="M20 6L9 17l-5-5"/></svg>
                    <span className="text-sm text-muted-foreground flex-1">{material.title}</span>
                    <button className="text-xs text-destructive hover:underline" onClick={() => setConfirmDelete(true)}>Xóa</button>
                  </div>
                ) : (
                  <FileUpload courseId={courseId} sessionId={sessionId} accept="video/*" onUploadComplete={async (key) => { await save({ r2Key: key }); }} />
                )}
              </div>
            )}

            <div className="mt-3 flex justify-end">
              <button className="text-xs text-muted-foreground hover:text-destructive transition" onClick={() => setConfirmDelete(true)}>
                Xóa tài liệu
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog open={confirmDelete} onOpenChange={setConfirmDelete} title="Xóa tài liệu?" description={`Xóa "${material.title}"?`} confirmLabel="Xóa" destructive onConfirm={onDelete} />
    </>
  );
}

// ─── Main Editor ───

export default function EditCoursePage() {
  const { id } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState<number | null>(null);
  const [deleteSessionTarget, setDeleteSessionTarget] = useState<Session | null>(null);
  const [linkDialog, setLinkDialog] = useState<number | null>(null);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const newSessionRef = useRef<HTMLInputElement>(null);
  const editTitleRef = useRef<HTMLInputElement>(null);

  const loadCourse = useCallback(async () => {
    const res = await fetch(`/api/courses/${id}`);
    if (res.ok) {
      const data = await res.json();
      setCourse(data);
      if (!selectedSession && data.sessions.length > 0) {
        setSelectedSession(data.sessions[0].id);
      }
    }
    setLoading(false);
  }, [id, selectedSession]);

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
    toast.success("Đã thêm buổi học!");
    if (newSessionRef.current) newSessionRef.current.value = "";
    await loadCourse();
    setSelectedSession(session.id);
  }

  async function renameSession(sessionId: number, title: string) {
    if (!title.trim()) return;
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
    if (selectedSession === session.id) {
      const remaining = course?.sessions.filter((s) => s.id !== session.id);
      setSelectedSession(remaining?.[0]?.id || null);
    }
    setDeleteSessionTarget(null);
    loadCourse();
  }

  async function addMaterial(sessionId: number, type: Material["type"]) {
    if (type === "link") {
      setLinkDialog(sessionId);
      return;
    }

    const titles: Record<string, string> = { video: "Video bài giảng", pdf: "Slide bài giảng", recap: "Recap" };
    await fetch(`/api/courses/${id}/sessions/${sessionId}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title: titles[type] || type, contentText: type === "recap" ? "" : undefined }),
    });
    toast.success(`Đã thêm ${getMaterialConfig(type).label}`);
    loadCourse();
  }

  async function addLinkMaterial(sessionId: number) {
    if (!linkTitle || !linkUrl) return;
    await fetch(`/api/courses/${id}/sessions/${sessionId}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "link", title: linkTitle, externalUrl: linkUrl }),
    });
    toast.success("Đã thêm link");
    setLinkDialog(null);
    setLinkTitle("");
    setLinkUrl("");
    loadCourse();
  }

  async function saveMaterial(materialId: number, data: Record<string, unknown>) {
    await fetch(`/api/materials/${materialId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    toast.success("Đã lưu");
    loadCourse();
  }

  async function deleteMaterial(sessionId: number, materialId: number) {
    await fetch(`/api/courses/${id}/sessions/${sessionId}/materials?materialId=${materialId}`, { method: "DELETE" });
    toast.success("Đã xóa");
    loadCourse();
  }

  async function handleFileUpload(sessionId: number, key: string, file: File) {
    const type = file.type.startsWith("video/") ? "video" : "pdf";
    await fetch(`/api/courses/${id}/sessions/${sessionId}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title: file.name, r2Key: key, metadata: { size: file.size, contentType: file.type } }),
    });
    toast.success(`Đã upload ${file.name}`);
    loadCourse();
  }

  // ─── Loading state ───

  if (loading) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex">
        <div className="w-80 border-r p-4 space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-96 mb-8" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Không tìm thấy khóa học</p>
          <Button variant="outline" onClick={() => router.push("/admin/khoa-hoc")}>Quay lại</Button>
        </div>
      </div>
    );
  }

  const currentSession = course.sessions.find((s) => s.id === selectedSession);
  const sessionIdx = currentSession ? course.sessions.findIndex((s) => s.id === currentSession.id) : -1;
  const sessionsWithContent = course.sessions.filter((s) => s.materials.length > 0).length;

  // ─── Render ───

  return (
    <TooltipProvider>
      <div className="h-[calc(100vh-3.5rem)] flex flex-col">
        {/* ═══ Top bar ═══ */}
        <div className="flex items-center justify-between px-4 lg:px-6 py-2.5 border-b bg-background shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Tooltip>
              <TooltipTrigger
                onClick={() => router.push("/admin/khoa-hoc")}
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 12L6 8l4-4"/></svg>
              </TooltipTrigger>
              <TooltipContent>Quay lại danh sách</TooltipContent>
            </Tooltip>
            <div className="w-px h-6 bg-border" />
            <input
              className="text-base font-semibold bg-transparent border-0 outline-none min-w-0 w-full max-w-md placeholder:text-muted-foreground/40"
              defaultValue={course.title}
              placeholder="Tên khóa học..."
              key={course.title}
              onBlur={(e) => {
                if (e.target.value && e.target.value !== course.title) updateCourse({ title: e.target.value });
              }}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {course.isPublished && (
              <Tooltip>
                <TooltipTrigger
                  onClick={() => window.open(`/khoa-hoc/${course.slug}`, "_blank")}
                  className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </TooltipTrigger>
                <TooltipContent>Xem trang khóa học</TooltipContent>
              </Tooltip>
            )}
            <Badge variant={course.isPublished ? "default" : "secondary"} className="text-[11px]">
              {course.isPublished ? "Xuất bản" : "Nháp"}
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

        {/* ═══ Main area ═══ */}
        <div className="flex flex-1 overflow-hidden">
          {/* ═══ Left sidebar ═══ */}
          <div className="w-72 lg:w-80 border-r bg-background flex flex-col shrink-0">
            {/* Stats */}
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Chương trình
              </span>
              <span className="text-xs text-muted-foreground">
                {sessionsWithContent}/{course.sessions.length} buổi có nội dung
              </span>
            </div>

            {/* Session list */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-0.5">
                {course.sessions.map((session, idx) => {
                  const isSelected = selectedSession === session.id;
                  const hasContent = session.materials.length > 0;
                  const hasVideo = session.materials.some((m) => m.type === "video" && m.r2Key);

                  return (
                    <div
                      key={session.id}
                      className={`
                        group flex items-center gap-2.5 pl-3 pr-2 py-2.5 rounded-lg cursor-pointer transition-all
                        ${isSelected ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-muted/70"}
                      `}
                      onClick={() => setSelectedSession(session.id)}
                      onDoubleClick={() => {
                        setEditingTitle(session.id);
                        setTimeout(() => editTitleRef.current?.focus(), 50);
                      }}
                    >
                      {/* Number / status */}
                      <div className={`
                        w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-semibold shrink-0 transition
                        ${isSelected
                          ? "bg-primary text-primary-foreground"
                          : hasVideo
                            ? "bg-green-500/15 text-green-600 dark:text-green-400"
                            : hasContent
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : "bg-muted text-muted-foreground"
                        }
                      `}>
                        {hasVideo ? (
                          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/></svg>
                        ) : (
                          idx + 1
                        )}
                      </div>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        {editingTitle === session.id ? (
                          <input
                            ref={editTitleRef}
                            className="w-full bg-background text-sm rounded px-1.5 py-0.5 outline-none ring-1 ring-primary"
                            defaultValue={session.title}
                            onBlur={(e) => renameSession(session.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") renameSession(session.id, e.currentTarget.value);
                              if (e.key === "Escape") setEditingTitle(null);
                            }}
                          />
                        ) : (
                          <span className={`text-sm truncate block ${isSelected ? "font-medium" : ""}`}>
                            {session.title}
                          </span>
                        )}
                      </div>

                      {/* Delete */}
                      <button
                        className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition shrink-0"
                        onClick={(e) => { e.stopPropagation(); setDeleteSessionTarget(session); }}
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4l8 8M12 4l-8 8"/></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Add session */}
            <div className="p-3 border-t bg-background">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed hover:border-primary/40 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground shrink-0"><path d="M8 3v10M3 8h10"/></svg>
                <input
                  ref={newSessionRef}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                  placeholder="Thêm buổi học mới..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addSession(e.currentTarget.value);
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-1.5 px-1">
                Nhấn Enter để thêm. Nhấp đôi để đổi tên.
              </p>
            </div>
          </div>

          {/* ═══ Right panel ═══ */}
          <div className="flex-1 overflow-y-auto bg-muted/20">
            {currentSession ? (
              <div className="max-w-2xl mx-auto px-6 lg:px-8 py-8">
                {/* Session header */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`
                      px-2 py-0.5 rounded text-[11px] font-medium
                      ${currentSession.materials.some((m) => m.type === "video" && m.r2Key)
                        ? "bg-green-500/15 text-green-600 dark:text-green-400"
                        : currentSession.materials.length > 0
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-muted text-muted-foreground"
                      }
                    `}>
                      Buổi {sessionIdx + 1}
                    </span>
                    {currentSession.materials.some((m) => m.type === "video" && m.r2Key) && (
                      <span className="text-[11px] text-green-600 dark:text-green-400">Sẵn sàng</span>
                    )}
                  </div>
                  <input
                    className="text-2xl font-bold w-full bg-transparent outline-none placeholder:text-muted-foreground/30"
                    defaultValue={currentSession.title}
                    placeholder="Tên buổi học..."
                    key={currentSession.id + "-title"}
                    onBlur={(e) => {
                      if (e.target.value && e.target.value !== currentSession.title) {
                        renameSession(currentSession.id, e.target.value);
                      }
                    }}
                  />
                </div>

                {/* Existing materials */}
                {currentSession.materials.length > 0 && (
                  <div className="space-y-2 mb-6">
                    {currentSession.materials.map((mat) => (
                      <MaterialCard
                        key={mat.id}
                        material={mat}
                        courseId={id as string}
                        sessionId={currentSession.id}
                        onSave={(data) => saveMaterial(mat.id, data)}
                        onDelete={() => deleteMaterial(currentSession.id, mat.id)}
                      />
                    ))}
                  </div>
                )}

                {/* Add material — type picker cards */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    {currentSession.materials.length > 0 ? "Thêm nội dung" : "Bắt đầu thêm nội dung"}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {MATERIAL_TYPES.map((mt) => {
                      // Don't show video option if already has one
                      const hasVideo = mt.type === "video" && currentSession.materials.some((m) => m.type === "video");
                      if (hasVideo) return null;

                      return (
                        <button
                          key={mt.type}
                          onClick={() => addMaterial(currentSession.id, mt.type)}
                          className="flex items-center gap-3 p-3.5 rounded-lg border border-dashed hover:border-primary/40 hover:bg-primary/5 transition text-left group"
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${mt.colors} transition`}>
                            {mt.icon}
                          </div>
                          <div>
                            <div className="text-sm font-medium group-hover:text-primary transition">{mt.label}</div>
                            <div className="text-[11px] text-muted-foreground">{mt.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick file upload */}
                  <div className="mt-4">
                    <FileUpload
                      courseId={id as string}
                      sessionId={currentSession.id}
                      onUploadComplete={(key, file) => handleFileUpload(currentSession.id, key, file)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* ═══ Empty state — no session selected ═══ */
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-sm px-6">
                  {course.sessions.length === 0 ? (
                    <>
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
                          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Xây dựng chương trình học</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Thêm buổi học đầu tiên ở sidebar bên trái. Mỗi buổi có thể chứa video, tài liệu, recap và link.
                      </p>
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px]">Enter</kbd>
                        <span>để thêm nhanh</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground"><path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/></svg>
                      </div>
                      <p className="text-muted-foreground">Chọn một buổi học để chỉnh sửa nội dung</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={!!deleteSessionTarget}
        onOpenChange={(open) => !open && setDeleteSessionTarget(null)}
        title="Xóa buổi học?"
        description={`Xóa "${deleteSessionTarget?.title}" và tất cả nội dung? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        destructive
        onConfirm={() => deleteSessionTarget && deleteSession(deleteSessionTarget)}
      />

      <Dialog open={linkDialog !== null} onOpenChange={(open) => !open && setLinkDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm link tài liệu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Tên hiển thị</Label>
              <Input value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} placeholder="VD: Bài tập tuần 1" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>URL</Label>
              <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://docs.google.com/..." onKeyDown={(e) => e.key === "Enter" && linkDialog !== null && addLinkMaterial(linkDialog)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialog(null)}>Hủy</Button>
            <Button onClick={() => linkDialog !== null && addLinkMaterial(linkDialog)} disabled={!linkTitle || !linkUrl}>Thêm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
