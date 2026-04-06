export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { courses, courseSessions, enrollments, sessionMaterials, progress } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth-server";
import { getDownloadUrl } from "@/lib/r2";
import { VideoPlayer } from "@/components/video-player";
import { LessonClient } from "./lesson-client";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; sessionIndex: string }>;
}) {
  const { slug, sessionIndex } = await params;
  const idx = parseInt(sessionIndex) - 1;

  const authSession = await getSession();
  if (!authSession) redirect("/dang-nhap");

  const course = await db.query.courses.findFirst({
    where: and(eq(courses.slug, slug), eq(courses.isPublished, true)),
    with: {
      sessions: {
        orderBy: (s, { asc }) => [asc(s.orderIndex)],
        with: { materials: true },
      },
    },
  });

  if (!course) notFound();

  const enrollment = await db.query.enrollments.findFirst({
    where: and(
      eq(enrollments.userId, authSession.user.id),
      eq(enrollments.courseId, course.id)
    ),
  });

  if (!enrollment) redirect(`/khoa-hoc/${slug}`);

  const currentSession = course.sessions[idx];
  if (!currentSession) notFound();

  // Get progress for all sessions
  const userProgress = await db.query.progress.findMany({
    where: eq(progress.userId, authSession.user.id),
  });
  const completedSessionIds = new Set(
    userProgress.filter((p) => p.completed).map((p) => p.sessionId)
  );

  // Get signed URLs for video and PDFs
  const video = currentSession.materials.find((m) => m.type === "video" && m.r2Key);
  const videoUrl = video?.r2Key ? await getDownloadUrl(video.r2Key) : null;

  const pdfs = currentSession.materials.filter((m) => m.type === "pdf");
  const pdfUrls = await Promise.all(
    pdfs.map(async (p) => ({
      ...p,
      signedUrl: p.r2Key ? await getDownloadUrl(p.r2Key) : null,
    }))
  );

  const recaps = currentSession.materials.filter((m) => m.type === "recap");
  const links = currentSession.materials.filter((m) => m.type === "link");
  const completedCount = course.sessions.filter((s) => completedSessionIds.has(s.id)).length;
  const isCurrentCompleted = completedSessionIds.has(currentSession.id);

  return (
    <LessonClient
      course={course}
      sessions={course.sessions}
      currentIndex={idx}
      currentSession={currentSession}
      slug={slug}
      videoUrl={videoUrl}
      videoTitle={video?.title || null}
      pdfs={pdfUrls}
      recaps={recaps}
      links={links}
      completedSessionIds={Array.from(completedSessionIds)}
      completedCount={completedCount}
      isCurrentCompleted={isCurrentCompleted}
      sessionId={currentSession.id}
    />
  );
}
