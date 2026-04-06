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
  course,
  sessions,
  currentIndex,
  currentSession,
  slug,
  videoUrl,
  videoTitle,
  pdfs,
  recaps,
  links,
  completedSessionIds,
  completedCount,
  isCurrentCompleted,
  sessionId,
}: LessonClientProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(isCurrentCompleted);
  const [activeTab, setActiveTab] = useState<"overview" | "materials">("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const totalSessions = sessions.length;
  const progressPercent = Math.round(((completedCount + (completed && !isCurrentCompleted ? 1 : 0)) / totalSessions) * 100);

  async function markComplete() {
    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, completed: true }),
    });
    if (res.ok) {
      setCompleted(true);
      toast.success("Đã hoàn thành buổi học!");
      // Auto-advance to next lesson after 1s
      if (currentIndex < totalSessions - 1) {
        setTimeout(() => router.push(`/khoa-hoc/${slug}/${currentIndex + 2}`), 1000);
      }
    }
  }

  const completedSet = new Set(completedSessionIds);

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="h-14 border-b border-[#E0E0E0] flex items-center justify-between px-4 shrink-0 bg-white">
        <div className="flex items-center gap-4">
          <Link
            href={`/khoa-hoc/${slug}`}
            className="text-[#0056D2] text-sm font-medium hover:underline flex items-center gap-1"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10.354 3.354a.5.5 0 00-.708-.708l-5 5a.5.5 0 000 .708l5 5a.5.5 0 00.708-.708L5.707 8l4.647-4.646z"/></svg>
            Quay lại
          </Link>
          <span className="text-[#1F1F1F] font-semibold text-sm hidden sm:block">{course.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-32 h-1.5 bg-[#E0E0E0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0056D2] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs text-[#636363] font-medium">{progressPercent}%</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded hover:bg-[#F5F5F5] transition text-[#636363]"
            title={sidebarOpen ? "Ẩn sidebar" : "Hiện sidebar"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-[280px] border-r border-[#E0E0E0] bg-[#FAFAFA] flex flex-col shrink-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 pb-2">
                <h3 className="text-xs font-semibold text-[#8C8C8C] uppercase tracking-wider">Nội dung khóa học</h3>
              </div>
              <nav className="px-2 pb-4">
                {sessions.map((session, i) => {
                  const isCurrent = i === currentIndex;
                  const isDone = completedSet.has(session.id) || (i === currentIndex && completed);
                  return (
                    <Link
                      key={session.id}
                      href={`/khoa-hoc/${slug}/${i + 1}`}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-150
                        ${isCurrent
                          ? "bg-[#0056D2] text-white"
                          : isDone
                            ? "text-[#8C8C8C] hover:bg-[#EEEEEE]"
                            : "text-[#1F1F1F] hover:bg-[#EEEEEE]"
                        }
                      `}
                    >
                      {/* Status icon */}
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0
                        ${isCurrent
                          ? "bg-white/20 text-white"
                          : isDone
                            ? "bg-[#00A854] text-white"
                            : "bg-[#E0E0E0] text-[#636363]"
                        }
                      `}>
                        {isDone && !isCurrent ? (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M10.28 2.72a.75.75 0 010 1.06l-5.5 5.5a.75.75 0 01-1.06 0l-2.5-2.5a.75.75 0 011.06-1.06L4.25 7.69l4.97-4.97a.75.75 0 011.06 0z"/></svg>
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span className={`text-sm truncate ${isCurrent ? "font-medium" : ""}`}>
                        {session.title}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Sidebar footer — progress */}
            <div className="p-4 border-t border-[#E0E0E0] bg-white">
              <div className="flex justify-between text-xs text-[#636363] mb-2">
                <span>{completedCount + (completed && !isCurrentCompleted ? 1 : 0)}/{totalSessions} buổi</span>
                <span>{progressPercent}% hoàn thành</span>
              </div>
              <div className="w-full h-1.5 bg-[#E0E0E0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0056D2] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </aside>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[900px] mx-auto px-6 py-6">
            {/* Video */}
            {videoUrl ? (
              <div className="mb-6">
                <VideoPlayer src={videoUrl} />
              </div>
            ) : (
              <div className="mb-6 aspect-video bg-[#1F1F1F] rounded-lg flex items-center justify-center">
                <span className="text-[#636363]">Chưa có video</span>
              </div>
            )}

            {/* Tabs */}
            <div className="border-b border-[#E0E0E0] mb-6">
              <div className="flex gap-0">
                {(["overview", "materials"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`
                      px-5 py-3 text-sm font-medium transition-all relative
                      ${activeTab === tab
                        ? "text-[#0056D2]"
                        : "text-[#636363] hover:text-[#1F1F1F]"
                      }
                    `}
                  >
                    {tab === "overview" ? "Tổng quan" : "Tài liệu"}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0056D2] rounded-t" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-[#1F1F1F] mb-2">
                    {currentSession.title}
                  </h1>
                  <p className="text-sm text-[#636363]">
                    Buổi {currentIndex + 1} / {totalSessions} • {course.title}
                  </p>
                </div>

                {/* Recap content */}
                {recaps.length > 0 && recaps[0].contentText && (
                  <div className="bg-[#F5F5F5] rounded-lg p-6">
                    <h3 className="text-sm font-semibold text-[#1F1F1F] mb-3 uppercase tracking-wider">Tóm tắt nội dung</h3>
                    <div
                      className="text-[#1F1F1F] text-[15px] leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: recaps[0].contentText }}
                    />
                  </div>
                )}

                {/* Quick links */}
                {links.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#1F1F1F] mb-3 uppercase tracking-wider">Tài liệu tham khảo</h3>
                    <div className="space-y-2">
                      {links.map((link) => (
                        <a
                          key={link.id}
                          href={link.externalUrl || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg border border-[#E0E0E0] hover:bg-[#F5F5F5] hover:border-[#0056D2] transition group"
                        >
                          <div className="w-8 h-8 rounded bg-[#E8F1FF] flex items-center justify-center shrink-0">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="#0056D2"><path d="M6.354 5.5H4a2 2 0 000 4h3a2 2 0 001.414-.586l.293-.293a.5.5 0 00-.708-.708l-.293.293A1 1 0 017 8.5H4a1 1 0 010-2h2.354a.5.5 0 000-1z"/><path d="M9.646 10.5H12a2 2 0 000-4H9a2 2 0 00-1.414.586l-.293.293a.5.5 0 10.708.708l.293-.293A1 1 0 019 7.5h3a1 1 0 010 2H9.646a.5.5 0 000 1z"/></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-[#1F1F1F] group-hover:text-[#0056D2] transition">{link.title}</div>
                            <div className="text-xs text-[#8C8C8C] truncate">{link.externalUrl}</div>
                          </div>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="#8C8C8C"><path d="M8.636 3.5a.5.5 0 00-.5-.5H1.5A1.5 1.5 0 000 4.5v10A1.5 1.5 0 001.5 16h10a1.5 1.5 0 001.5-1.5V7.864a.5.5 0 00-1 0V14.5a.5.5 0 01-.5.5h-10a.5.5 0 01-.5-.5v-10a.5.5 0 01.5-.5h6.636a.5.5 0 00.5-.5z"/><path d="M16 .5a.5.5 0 00-.5-.5h-5a.5.5 0 000 1h3.793L6.146 9.146a.5.5 0 10.708.708L15 1.707V5.5a.5.5 0 001 0v-5z"/></svg>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "materials" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#1F1F1F] uppercase tracking-wider">Tài liệu buổi học</h3>

                {pdfs.length === 0 && links.length === 0 && recaps.length === 0 && (
                  <div className="text-center py-12 text-[#8C8C8C]">
                    <div className="text-3xl mb-2">📄</div>
                    <p>Chưa có tài liệu cho buổi học này</p>
                  </div>
                )}

                {/* PDFs */}
                {pdfs.map((pdf) => (
                  <div key={pdf.id} className="border border-[#E0E0E0] rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 p-4 bg-[#F5F5F5]">
                      <div className="w-8 h-8 rounded bg-[#E30B5C]/10 flex items-center justify-center">
                        <span className="text-sm">📄</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#1F1F1F]">{pdf.title}</div>
                        <div className="text-xs text-[#8C8C8C]">PDF</div>
                      </div>
                    </div>
                    {pdf.signedUrl && (
                      <iframe
                        src={`${pdf.signedUrl}#toolbar=0&navpanes=0`}
                        className="w-full h-[500px] border-t border-[#E0E0E0]"
                        title={pdf.title}
                      />
                    )}
                  </div>
                ))}

                {/* Links */}
                {links.map((link) => (
                  <a
                    key={link.id}
                    href={link.externalUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-lg border border-[#E0E0E0] hover:bg-[#F5F5F5] transition"
                  >
                    <div className="w-8 h-8 rounded bg-[#E8F1FF] flex items-center justify-center">
                      <span className="text-sm">🔗</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#0056D2]">{link.title}</div>
                      <div className="text-xs text-[#8C8C8C]">{link.externalUrl}</div>
                    </div>
                  </a>
                ))}

                {/* Recaps */}
                {recaps.map((recap) => (
                  <div key={recap.id} className="border border-[#E0E0E0] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm">📝</span>
                      <span className="text-sm font-medium text-[#1F1F1F]">{recap.title}</span>
                    </div>
                    <div
                      className="text-sm text-[#1F1F1F] leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: recap.contentText || "Chưa có nội dung" }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Bottom navigation */}
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-[#E0E0E0]">
              {currentIndex > 0 ? (
                <Link
                  href={`/khoa-hoc/${slug}/${currentIndex}`}
                  className="flex items-center gap-2 text-sm text-[#0056D2] font-medium hover:underline"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10.354 3.354a.5.5 0 00-.708-.708l-5 5a.5.5 0 000 .708l5 5a.5.5 0 00.708-.708L5.707 8l4.647-4.646z"/></svg>
                  Buổi trước
                </Link>
              ) : <div />}

              {!completed ? (
                <button
                  onClick={markComplete}
                  className="px-6 py-2.5 bg-[#0056D2] text-white text-sm font-semibold rounded hover:bg-[#003D9D] transition-colors"
                >
                  ✓ Hoàn thành buổi học
                </button>
              ) : (
                <div className="flex items-center gap-2 text-sm text-[#00A854] font-medium">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/></svg>
                  Đã hoàn thành
                </div>
              )}

              {currentIndex < sessions.length - 1 ? (
                <Link
                  href={`/khoa-hoc/${slug}/${currentIndex + 2}`}
                  className="flex items-center gap-2 text-sm text-[#0056D2] font-medium hover:underline"
                >
                  Buổi tiếp
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M5.646 12.646a.5.5 0 00.708.708l5-5a.5.5 0 000-.708l-5-5a.5.5 0 10-.708.708L10.293 8 5.646 12.646z"/></svg>
                </Link>
              ) : <div />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
