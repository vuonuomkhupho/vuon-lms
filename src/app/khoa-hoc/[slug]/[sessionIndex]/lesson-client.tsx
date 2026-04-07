"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import { VideoPlayer } from "@/components/video-player";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface Material {
  id: number;
  type: string;
  title: string;
  r2Key?: string | null;
  externalUrl?: string | null;
  contentText?: string | null;
  signedUrl?: string | null;
}

interface Session {
  id: number;
  title: string;
  description?: string | null;
  materials: Material[];
}

interface LessonClientProps {
  course: { id: number; title: string };
  sessions: Session[];
  currentIndex: number;
  currentSession: Session;
  slug: string;
  videoUrl: string | null;
  videoTitle: string | null;
  pdfs: Material[];
  recaps: Material[];
  links: Material[];
  completedSessionIds: number[];
  completedCount: number;
  isCurrentCompleted: boolean;
  sessionId: number;
}

export function LessonClient({
  course, sessions, currentIndex, currentSession, slug,
  videoUrl, videoTitle, pdfs, recaps, links,
  completedSessionIds, completedCount, isCurrentCompleted, sessionId,
}: LessonClientProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(isCurrentCompleted);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const totalSessions = sessions.length;
  const doneCount = completedCount + (completed && !isCurrentCompleted ? 1 : 0);
  const completedSet = new Set(completedSessionIds);

  async function markComplete() {
    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, completed: true }),
    });
    if (res.ok) {
      setCompleted(true);
      toast.success("Đã hoàn thành buổi học!");
    }
  }

  function goNext() {
    if (currentIndex < totalSessions - 1) {
      router.push(`/khoa-hoc/${slug}/${currentIndex + 2}`);
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="h-14 border-b flex items-center px-5 shrink-0 bg-background">
        <div className="flex items-center gap-3 flex-1">
          <Link href="/" className="text-primary font-bold text-[15px] tracking-tight">
            Vuon LMS
          </Link>
          <div className="w-px h-5 bg-border" />
          <span className="text-[13px] text-muted-foreground">{course.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition"
            aria-label="Toggle sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
          </button>
          <Link href="/dashboard" className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
            V
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-[260px] border-r bg-background flex flex-col shrink-0 max-md:hidden">
            <div className="p-4 pb-3 flex items-start justify-between">
              <h2 className="text-sm font-bold leading-snug pr-2">
                {course.title}
              </h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted shrink-0 mt-0.5"
                aria-label="Close sidebar"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="text-muted-foreground"><path d="M11.083 3.624L7.707 7l3.376 3.376-.707.707L7 7.707l-3.376 3.376-.707-.707L6.293 7 2.917 3.624l.707-.707L7 6.293l3.376-3.376z"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {sessions.map((session, i) => {
                const isCurrent = i === currentIndex;
                const isDone = completedSet.has(session.id) || (i === currentIndex && completed);

                // Check if this is a section header
                let isSect = false;
                try { isSect = JSON.parse(session.description || "{}").isSection === true; } catch {}

                if (isSect) {
                  return (
                    <div key={session.id} className="px-4 pt-5 pb-1 first:pt-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {session.title}
                      </span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={session.id}
                    href={`/khoa-hoc/${slug}/${i + 1}`}
                    className={`
                      flex items-start gap-3 px-4 py-3 border-l-[3px] transition-colors
                      ${isCurrent
                        ? "border-l-primary bg-primary/10"
                        : "border-l-transparent hover:bg-muted"
                      }
                    `}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isDone ? (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <circle cx="10" cy="10" r="10" className="fill-success"/>
                          <path d="M6 10l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <circle cx="10" cy="10" r="9" className="stroke-muted-foreground/40" strokeWidth="1.5"/>
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className={`text-sm leading-snug ${isCurrent ? "font-semibold" : isDone ? "text-muted-foreground" : ""}`}>
                        {session.title}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="p-4 border-t">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Tiến độ</span>
                <span>{doneCount}/{totalSessions} buổi</span>
              </div>
              <Progress value={Math.round((doneCount / totalSessions) * 100)} className="h-1.5" />
            </div>
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[800px] mx-auto px-6 md:px-8 py-8">
            <h1 className="text-2xl md:text-4xl font-bold leading-tight mb-6">
              {currentSession.title}
            </h1>

            {/* Video */}
            {videoUrl ? (
              <div className="mb-8 rounded-lg overflow-hidden">
                <VideoPlayer src={videoUrl} />
              </div>
            ) : (
              <div className="mb-8 aspect-video bg-muted rounded-lg flex items-center justify-center border">
                <div className="text-center">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto mb-2">
                    <rect width="48" height="48" rx="24" className="fill-muted-foreground/10"/>
                    <path d="M20 16v16l12-8z" className="fill-muted-foreground/40"/>
                  </svg>
                  <p className="text-sm text-muted-foreground">Video chưa được upload</p>
                </div>
              </div>
            )}

            {/* Recap */}
            {recaps.length > 0 && recaps[0].contentText && (
              <div className="mb-8 prose prose-neutral dark:prose-invert max-w-none">
                <div
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(recaps[0].contentText) }}
                />
              </div>
            )}

            {/* Resources */}
            {(pdfs.length > 0 || links.length > 0) && (
              <div className="mb-8">
                <h3 className="text-sm font-bold mb-3">Tài liệu buổi học</h3>
                <div className="space-y-2">
                  {pdfs.map((pdf) => (
                    <div key={pdf.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition">
                      <div className="w-9 h-9 rounded bg-destructive/10 flex items-center justify-center shrink-0">
                        <svg width="18" height="18" viewBox="0 0 18 18" className="fill-destructive"><path d="M4 1h7l4 4v10a2 2 0 01-2 2H4a2 2 0 01-2-2V3a2 2 0 012-2z"/></svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] font-medium">{pdf.title}</div>
                        <div className="text-xs text-muted-foreground">PDF</div>
                      </div>
                    </div>
                  ))}
                  {links.map((link) => (
                    <a
                      key={link.id}
                      href={link.externalUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition group"
                    >
                      <div className="w-9 h-9 rounded bg-primary/10 flex items-center justify-center shrink-0">
                        <svg width="16" height="16" viewBox="0 0 16 16" className="fill-primary"><path d="M8.636 3.5a.5.5 0 00-.5-.5H1.5A1.5 1.5 0 000 4.5v10A1.5 1.5 0 001.5 16h10a1.5 1.5 0 001.5-1.5V7.864a.5.5 0 00-1 0V14.5a.5.5 0 01-.5.5h-10a.5.5 0 01-.5-.5v-10a.5.5 0 01.5-.5h6.636a.5.5 0 00.5-.5z"/><path d="M16 .5a.5.5 0 00-.5-.5h-5a.5.5 0 000 1h3.793L6.146 9.146a.5.5 0 10.708.708L15 1.707V5.5a.5.5 0 001 0v-5z"/></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-primary group-hover:underline">{link.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{link.externalUrl}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 py-4 border-t">
              {currentIndex > 0 && (
                <Link href={`/khoa-hoc/${slug}/${currentIndex}`}>
                  <Button variant="outline">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="mr-1.5"><path d="M8.354 2.354a.5.5 0 10-.708-.708l-4.5 4.5a.5.5 0 000 .708l4.5 4.5a.5.5 0 00.708-.708L4.207 7l4.147-4.646z"/></svg>
                    Buổi trước
                  </Button>
                </Link>
              )}

              <div className="flex-1" />

              {completed ? (
                <span className="flex items-center gap-2 text-sm font-semibold text-success">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="9" fill="currentColor" opacity="0.2"/>
                    <path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Đã hoàn thành
                </span>
              ) : (
                <Button variant="outline" onClick={markComplete}>
                  Hoàn thành
                </Button>
              )}

              {currentIndex < totalSessions - 1 && (
                <Button onClick={goNext}>
                  Buổi tiếp theo
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="ml-1.5"><path d="M5.646 11.646a.5.5 0 00.708.708l4.5-4.5a.5.5 0 000-.708l-4.5-4.5a.5.5 0 10-.708.708L9.793 7 5.646 11.646z"/></svg>
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
