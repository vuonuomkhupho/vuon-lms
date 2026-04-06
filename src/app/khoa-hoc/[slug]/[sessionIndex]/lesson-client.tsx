"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VideoPlayer } from "@/components/video-player";
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
    <div className="h-screen flex flex-col" style={{ fontFamily: "'Source Sans 3', 'Inter', system-ui, sans-serif" }}>
      {/* ═══ HEADER ═══ */}
      <header className="h-[56px] border-b border-[#E0E0E0] flex items-center px-5 shrink-0 bg-white">
        <div className="flex items-center gap-3 flex-1">
          <Link href="/" className="text-[#0056D2] font-bold text-[15px] tracking-tight">
            Vuon LMS
          </Link>
          <div className="w-px h-5 bg-[#E0E0E0]" />
          <span className="text-[13px] text-[#636363]">{course.title}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F5F5F5] transition"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#636363" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
          </button>
          <Link href="/dashboard" className="w-8 h-8 rounded-full bg-[#0056D2] flex items-center justify-center text-white text-xs font-bold">
            V
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ═══ SIDEBAR (Coursera-style) ═══ */}
        {sidebarOpen && (
          <aside className="w-[260px] border-r border-[#E0E0E0] bg-white flex flex-col shrink-0">
            {/* Course title + close */}
            <div className="p-4 pb-3 flex items-start justify-between">
              <h2 className="text-[14px] font-bold text-[#1F1F1F] leading-snug pr-2">
                {course.title}
              </h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F5F5F5] shrink-0 mt-0.5"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="#636363"><path d="M11.083 3.624L7.707 7l3.376 3.376-.707.707L7 7.707l-3.376 3.376-.707-.707L6.293 7 2.917 3.624l.707-.707L7 6.293l3.376-3.376z"/></svg>
              </button>
            </div>

            {/* Lesson list */}
            <div className="flex-1 overflow-y-auto">
              {sessions.map((session, i) => {
                const isCurrent = i === currentIndex;
                const isDone = completedSet.has(session.id) || (i === currentIndex && completed);
                const hasVideo = session.materials.some(m => m.type === "video");

                return (
                  <Link
                    key={session.id}
                    href={`/khoa-hoc/${slug}/${i + 1}`}
                    className={`
                      flex items-start gap-3 px-4 py-3 border-l-[3px] transition-colors
                      ${isCurrent
                        ? "border-l-[#0056D2] bg-[#E8F1FF]"
                        : "border-l-transparent hover:bg-[#F5F5F5]"
                      }
                    `}
                  >
                    {/* Status icon */}
                    <div className="mt-0.5 shrink-0">
                      {isDone ? (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <circle cx="10" cy="10" r="10" fill="#00A854"/>
                          <path d="M6 10l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <circle cx="10" cy="10" r="9" stroke="#BDBDBD" strokeWidth="1.5"/>
                          {hasVideo && <path d="M8 7v6l5-3z" fill="#BDBDBD"/>}
                          {!hasVideo && <circle cx="10" cy="10" r="2" fill="#BDBDBD"/>}
                        </svg>
                      )}
                    </div>
                    {/* Lesson info */}
                    <div className="min-w-0">
                      <div className={`text-[13px] leading-snug ${isCurrent ? "font-semibold text-[#1F1F1F]" : isDone ? "text-[#636363]" : "text-[#1F1F1F]"}`}>
                        {session.title}
                      </div>
                      <div className="text-[11px] text-[#8C8C8C] mt-0.5">
                        Buổi {i + 1} • {session.materials.length > 0
                          ? session.materials.map(m =>
                              m.type === "video" ? "Video" : m.type === "pdf" ? "PDF" : m.type === "recap" ? "Recap" : "Link"
                            ).join(", ")
                          : "Chưa có tài liệu"
                        }
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Progress footer */}
            <div className="p-4 border-t border-[#E0E0E0]">
              <div className="flex justify-between text-[11px] text-[#636363] mb-1.5">
                <span>Tiến độ</span>
                <span>{doneCount}/{totalSessions} buổi</span>
              </div>
              <div className="w-full h-[6px] bg-[#E0E0E0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0056D2] rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((doneCount / totalSessions) * 100)}%` }}
                />
              </div>
            </div>
          </aside>
        )}

        {/* ═══ MAIN CONTENT ═══ */}
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-[800px] mx-auto px-8 py-8">
            {/* Large title (Coursera-style) */}
            <h1 className="text-[36px] font-bold text-[#1F1F1F] leading-[1.2] mb-6">
              {currentSession.title}
            </h1>

            {/* Video player */}
            {videoUrl ? (
              <div className="mb-8 rounded-lg overflow-hidden">
                <VideoPlayer src={videoUrl} />
              </div>
            ) : (
              <div className="mb-8 aspect-video bg-[#F5F5F5] rounded-lg flex items-center justify-center border border-[#E0E0E0]">
                <div className="text-center">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto mb-2">
                    <rect width="48" height="48" rx="24" fill="#E0E0E0"/>
                    <path d="M20 16v16l12-8z" fill="#8C8C8C"/>
                  </svg>
                  <p className="text-[14px] text-[#8C8C8C]">Video chưa được upload</p>
                </div>
              </div>
            )}

            {/* Recap / Description content */}
            {recaps.length > 0 && recaps[0].contentText && (
              <div className="mb-8">
                <div className="text-[16px] text-[#1F1F1F] leading-[1.7]"
                  dangerouslySetInnerHTML={{ __html: recaps[0].contentText }}
                />
              </div>
            )}

            {/* Materials — Coursera "Resources" style */}
            {(pdfs.length > 0 || links.length > 0) && (
              <div className="mb-8">
                <h3 className="text-[14px] font-bold text-[#1F1F1F] mb-3">Tài liệu buổi học</h3>
                <div className="space-y-2">
                  {pdfs.map((pdf) => (
                    <div key={pdf.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#E0E0E0] hover:bg-[#F5F5F5] transition">
                      <div className="w-9 h-9 rounded bg-[#FEE2E2] flex items-center justify-center shrink-0">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="#E30B5C"><path d="M4 1h7l4 4v10a2 2 0 01-2 2H4a2 2 0 01-2-2V3a2 2 0 012-2z"/><path d="M11 1v4h4" fill="none" stroke="#E30B5C" strokeWidth="1"/></svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] font-medium text-[#1F1F1F]">{pdf.title}</div>
                        <div className="text-[11px] text-[#8C8C8C]">PDF</div>
                      </div>
                    </div>
                  ))}
                  {links.map((link) => (
                    <a
                      key={link.id}
                      href={link.externalUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-[#E0E0E0] hover:bg-[#F5F5F5] transition group"
                    >
                      <div className="w-9 h-9 rounded bg-[#E8F1FF] flex items-center justify-center shrink-0">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="#0056D2"><path d="M8.636 3.5a.5.5 0 00-.5-.5H1.5A1.5 1.5 0 000 4.5v10A1.5 1.5 0 001.5 16h10a1.5 1.5 0 001.5-1.5V7.864a.5.5 0 00-1 0V14.5a.5.5 0 01-.5.5h-10a.5.5 0 01-.5-.5v-10a.5.5 0 01.5-.5h6.636a.5.5 0 00.5-.5z"/><path d="M16 .5a.5.5 0 00-.5-.5h-5a.5.5 0 000 1h3.793L6.146 9.146a.5.5 0 10.708.708L15 1.707V5.5a.5.5 0 001 0v-5z"/></svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] font-medium text-[#0056D2] group-hover:underline">{link.title}</div>
                        <div className="text-[11px] text-[#8C8C8C] truncate">{link.externalUrl}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ ACTION ROW (Coursera-style) ═══ */}
            <div className="flex items-center gap-3 py-4 border-t border-[#E0E0E0]">
              {currentIndex > 0 && (
                <Link
                  href={`/khoa-hoc/${slug}/${currentIndex}`}
                  className="px-5 py-2.5 text-[14px] font-semibold text-[#0056D2] border border-[#0056D2] rounded-[4px] hover:bg-[#E8F1FF] transition"
                >
                  ← Buổi trước
                </Link>
              )}

              <div className="flex-1" />

              {completed ? (
                <span className="flex items-center gap-2 text-[14px] font-semibold text-[#00A854]">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="9" fill="#00A854"/>
                    <path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Đã hoàn thành
                </span>
              ) : (
                <button
                  onClick={markComplete}
                  className="px-5 py-2.5 text-[14px] font-semibold text-[#636363] border border-[#E0E0E0] rounded-[4px] hover:bg-[#F5F5F5] transition"
                >
                  ✓ Hoàn thành
                </button>
              )}

              {currentIndex < totalSessions - 1 && (
                <button
                  onClick={goNext}
                  className="px-5 py-2.5 text-[14px] font-semibold text-white bg-[#0056D2] rounded-[4px] hover:bg-[#003D9D] transition"
                >
                  Buổi tiếp theo →
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ═══ FLOATING NEXT BUTTON (Coursera-style, bottom right) ═══ */}
      {currentIndex < totalSessions - 1 && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={goNext}
            className="px-4 py-2.5 text-[13px] font-semibold text-[#0056D2] bg-white border border-[#0056D2] rounded-[4px] shadow-lg hover:bg-[#E8F1FF] transition flex items-center gap-1.5"
          >
            Buổi tiếp theo
            <svg width="14" height="14" viewBox="0 0 14 14" fill="#0056D2"><path d="M5.646 11.646a.5.5 0 00.708.708l4.5-4.5a.5.5 0 000-.708l-4.5-4.5a.5.5 0 10-.708.708L9.793 7 5.646 11.646z"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}
