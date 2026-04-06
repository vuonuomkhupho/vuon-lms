"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronDown, Plus, X, Check, ExternalLink, Video, FileText, PenLine, Link as LinkIcon, BookOpen, MousePointerClick, GripVertical, Settings, CircleAlert } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  thumbnailR2Key: string | null;
  isPublished: boolean;
  sessions: Session[];
}

// ─── Material type cards ───

const MATERIAL_TYPES = [
  {
    type: "video" as const,
    icon: Video,
    label: "Video",
    description: "Upload video bài giảng",
    colors: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  },
  {
    type: "pdf" as const,
    icon: FileText,
    label: "Tài liệu",
    description: "PDF, slide, hình ảnh",
    colors: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  },
  {
    type: "recap" as const,
    icon: PenLine,
    label: "Recap",
    description: "Tóm tắt nội dung",
    colors: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
  {
    type: "link" as const,
    icon: LinkIcon,
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
            <config.icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{material.title}</div>
            <div className="text-xs text-muted-foreground">{statusText}</div>
          </div>
          {saving && (
            <span className="text-xs text-muted-foreground animate-pulse">Lưu...</span>
          )}
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
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
                    <Check className="w-4 h-4 text-success shrink-0" />
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
                    <Check className="w-4 h-4 text-success shrink-0" />
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

// ─── Sortable Session Item ───

function SortableSessionItem({
  session,
  idx,
  isSelected,
  hasVideo,
  hasContent,
  editingTitle,
  editTitleRef,
  onSelect,
  onDoubleClick,
  onRename,
  onCancelEdit,
  onDelete,
}: {
  session: Session;
  idx: number;
  isSelected: boolean;
  hasVideo: boolean;
  hasContent: boolean;
  editingTitle: number | null;
  editTitleRef: React.RefObject<HTMLInputElement | null>;
  onSelect: () => void;
  onDoubleClick: () => void;
  onRename: (title: string) => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: session.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group flex items-center gap-1 pl-1 pr-2 py-2.5 rounded-lg cursor-pointer transition-colors
        ${isSelected ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-muted/70"}
      `}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
    >
      <button
        className="w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-60 hover:opacity-100 cursor-grab active:cursor-grabbing shrink-0 touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      <div className={`
        w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-semibold shrink-0 transition
        ${isSelected
          ? "bg-primary text-primary-foreground"
          : hasVideo
            ? "bg-success/15 text-success"
            : hasContent
              ? "bg-warning/15 text-warning"
              : "bg-muted text-muted-foreground"
        }
      `}>
        {hasVideo ? <Check className="w-3 h-3" /> : idx + 1}
      </div>

      <div className="flex-1 min-w-0 ml-1.5">
        {editingTitle === session.id ? (
          <input
            ref={editTitleRef}
            className="w-full bg-background text-sm rounded px-1.5 py-0.5 outline-none ring-1 ring-primary"
            defaultValue={session.title}
            onBlur={(e) => onRename(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onRename(e.currentTarget.value);
              if (e.key === "Escape") onCancelEdit();
            }}
          />
        ) : (
          <span className={`text-sm truncate block ${isSelected ? "font-medium" : ""}`}>
            {session.title}
          </span>
        )}
      </div>

      <button
        className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition shrink-0"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
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
  const [publishCheckOpen, setPublishCheckOpen] = useState(false);
  const [rightTab, setRightTab] = useState<"content" | "settings">("content");
  const newSessionRef = useRef<HTMLInputElement>(null);
  const editTitleRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !course) return;

    const oldIndex = course.sessions.findIndex((s) => s.id === active.id);
    const newIndex = course.sessions.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic reorder
    const reordered = [...course.sessions];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    setCourse({ ...course, sessions: reordered });

    // Persist new order
    await Promise.all(
      reordered.map((s, i) =>
        fetch(`/api/courses/${id}/sessions/${s.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderIndex: i }),
        })
      )
    );
    toast.success("Đã sắp xếp lại");
    loadCourse();
  }

  function handlePublishClick() {
    if (!course) return;
    if (course.isPublished) {
      updateCourse({ isPublished: false });
      return;
    }
    setPublishCheckOpen(true);
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
                <ChevronLeft className="w-4 h-4" />
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
                  <ExternalLink className="w-3.5 h-3.5" />
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
              onClick={handlePublishClick}
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

            {/* Session list — drag-and-drop sortable */}
            <ScrollArea className="flex-1">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={course.sessions.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="p-2 space-y-0.5">
                    {course.sessions.map((session, idx) => (
                      <SortableSessionItem
                        key={session.id}
                        session={session}
                        idx={idx}
                        isSelected={selectedSession === session.id}
                        hasVideo={session.materials.some((m) => m.type === "video" && m.r2Key)}
                        hasContent={session.materials.length > 0}
                        editingTitle={editingTitle}
                        editTitleRef={editTitleRef}
                        onSelect={() => setSelectedSession(session.id)}
                        onDoubleClick={() => {
                          setEditingTitle(session.id);
                          setTimeout(() => editTitleRef.current?.focus(), 50);
                        }}
                        onRename={(title) => renameSession(session.id, title)}
                        onCancelEdit={() => setEditingTitle(null)}
                        onDelete={() => setDeleteSessionTarget(session)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </ScrollArea>

            {/* Add session */}
            <div className="p-3 border-t bg-background">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed hover:border-primary/40 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition">
                <Plus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
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
          <div className="flex-1 overflow-hidden flex flex-col bg-muted/20">
            {/* Tab switcher */}
            <div className="flex items-center gap-1 px-6 pt-4 shrink-0">
              <button
                onClick={() => setRightTab("content")}
                className={`px-3 py-1.5 text-sm rounded-md transition ${rightTab === "content" ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
              >
                Nội dung
              </button>
              <button
                onClick={() => setRightTab("settings")}
                className={`px-3 py-1.5 text-sm rounded-md transition flex items-center gap-1.5 ${rightTab === "settings" ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Settings className="w-3.5 h-3.5" />
                Cài đặt
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* ═══ Settings tab ═══ */}
              {rightTab === "settings" && (
                <div className="max-w-2xl mx-auto px-6 lg:px-8 py-8">
                  <h2 className="text-xl font-bold mb-6">Cài đặt khóa học</h2>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Tên khóa học</Label>
                      <Input
                        defaultValue={course.title}
                        key={`settings-title-${course.title}`}
                        onBlur={(e) => {
                          if (e.target.value && e.target.value !== course.title) updateCourse({ title: e.target.value });
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Mô tả</Label>
                      <Textarea
                        defaultValue={course.description || ""}
                        key={`settings-desc-${course.id}`}
                        placeholder="Mô tả ngắn giúp học viên hiểu khóa học..."
                        rows={4}
                        onBlur={(e) => {
                          const val = e.target.value || null;
                          if (val !== course.description) updateCourse({ description: val } as Partial<Course>);
                        }}
                      />
                      <p className="text-xs text-muted-foreground">Hiển thị trên trang chi tiết khóa học</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Thumbnail</Label>
                      {course.thumbnailR2Key ? (
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <Check className="w-4 h-4 text-success shrink-0" />
                          <span className="text-sm text-muted-foreground flex-1">Đã upload thumbnail</span>
                          <button
                            className="text-xs text-destructive hover:underline"
                            onClick={() => updateCourse({ thumbnailR2Key: null } as Partial<Course>)}
                          >
                            Xóa
                          </button>
                        </div>
                      ) : (
                        <FileUpload
                          courseId={id as string}
                          sessionId={0}
                          accept="image/*"
                          onUploadComplete={async (key) => {
                            await updateCourse({ thumbnailR2Key: key } as Partial<Course>);
                          }}
                        />
                      )}
                      <p className="text-xs text-muted-foreground">Hình ảnh đại diện cho khóa học</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Slug</Label>
                      <Input value={course.slug} disabled className="bg-muted" />
                      <p className="text-xs text-muted-foreground">URL: /khoa-hoc/{course.slug}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ Content tab ═══ */}
              {rightTab === "content" && currentSession ? (
              <div className="max-w-2xl mx-auto px-6 lg:px-8 py-8">
                {/* Session header */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`
                      px-2 py-0.5 rounded text-[11px] font-medium
                      ${currentSession.materials.some((m) => m.type === "video" && m.r2Key)
                        ? "bg-success/15 text-success"
                        : currentSession.materials.length > 0
                          ? "bg-warning/15 text-warning"
                          : "bg-muted text-muted-foreground"
                      }
                    `}>
                      Buổi {sessionIdx + 1}
                    </span>
                    {currentSession.materials.some((m) => m.type === "video" && m.r2Key) && (
                      <span className="text-[11px] text-success">Sẵn sàng</span>
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
                            <mt.icon className="w-5 h-5" />
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
            ) : rightTab === "content" ? (
              /* ═══ Empty state — no session selected ═══ */
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-sm px-6">
                  {course.sessions.length === 0 ? (
                    <>
                      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="w-8 h-8 text-primary" strokeWidth={1.5} />
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
                        <MousePointerClick className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">Chọn một buổi học để chỉnh sửa nội dung</p>
                    </>
                  )}
                </div>
              </div>
            ) : null}
            </div>
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

      {/* Publish validation checklist */}
      <Dialog open={publishCheckOpen} onOpenChange={setPublishCheckOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xuất bản khóa học</DialogTitle>
          </DialogHeader>
          {course && (() => {
            const checks = [
              { label: "Có ít nhất 1 buổi học", ok: course.sessions.length > 0 },
              { label: "Có buổi học chứa nội dung", ok: course.sessions.some((s) => s.materials.length > 0) },
              { label: "Có mô tả khóa học", ok: !!course.description },
            ];
            const allOk = checks.every((c) => c.ok);
            return (
              <div className="py-2">
                <div className="space-y-3 mb-6">
                  {checks.map((check, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      {check.ok ? (
                        <Check className="w-4 h-4 text-success shrink-0" />
                      ) : (
                        <CircleAlert className="w-4 h-4 text-warning shrink-0" />
                      )}
                      <span className={check.ok ? "" : "text-muted-foreground"}>{check.label}</span>
                    </div>
                  ))}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPublishCheckOpen(false)}>Hủy</Button>
                  <Button onClick={() => { setPublishCheckOpen(false); updateCourse({ isPublished: true }); }}>
                    {allOk ? "Xuất bản" : "Xuất bản dù sao"}
                  </Button>
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

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
