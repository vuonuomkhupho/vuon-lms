export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { courses, courseSessions, enrollments, sessionMaterials } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth-server";
import { getDownloadUrl } from "@/lib/r2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoPlayer } from "@/components/video-player";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; sessionIndex: string }>;
}) {
  const { slug, sessionIndex } = await params;
  const idx = parseInt(sessionIndex) - 1;

  // Auth check
  const authSession = await getSession();
  if (!authSession) redirect("/dang-nhap");

  // Get course with sessions
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

  // Check enrollment
  const enrollment = await db.query.enrollments.findFirst({
    where: and(
      eq(enrollments.userId, authSession.user.id),
      eq(enrollments.courseId, course.id)
    ),
  });

  if (!enrollment) redirect(`/khoa-hoc/${slug}`);

  const currentSession = course.sessions[idx];
  if (!currentSession) notFound();

  // Group materials by type
  const videos = currentSession.materials.filter((m) => m.type === "video");
  const pdfs = currentSession.materials.filter((m) => m.type === "pdf");
  const recaps = currentSession.materials.filter((m) => m.type === "recap");
  const links = currentSession.materials.filter((m) => m.type === "link");

  // Generate signed URLs for videos and PDFs
  const videoUrls = await Promise.all(
    videos.map(async (v) => ({
      ...v,
      signedUrl: v.r2Key ? await getDownloadUrl(v.r2Key) : null,
    }))
  );

  const pdfUrls = await Promise.all(
    pdfs.map(async (p) => ({
      ...p,
      signedUrl: p.r2Key ? await getDownloadUrl(p.r2Key) : null,
    }))
  );

  return (
    <div className="min-h-screen flex">
      {/* Sidebar — session list */}
      <aside className="w-72 border-r bg-zinc-50 overflow-y-auto hidden md:block">
        <div className="p-4">
          <Link href={`/khoa-hoc/${slug}`} className="text-sm text-muted-foreground hover:underline">
            &larr; {course.title}
          </Link>
        </div>
        <nav className="px-2 pb-4">
          {course.sessions.map((s, i) => (
            <Link
              key={s.id}
              href={`/khoa-hoc/${slug}/${i + 1}`}
              className={`block px-3 py-2 rounded-md text-sm mb-1 ${
                i === idx
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-zinc-100"
              }`}
            >
              <span className="text-xs opacity-70 mr-1">Buổi {i + 1}.</span>{" "}
              {s.title}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Buổi {idx + 1} / {course.sessions.length}
            </p>
            <h1 className="text-2xl font-bold">{currentSession.title}</h1>
            {currentSession.description && (
              <p className="text-muted-foreground mt-1">
                {currentSession.description}
              </p>
            )}
          </div>

          {/* Video */}
          {videoUrls.length > 0 && videoUrls[0].signedUrl && (
            <div className="mb-6">
              <VideoPlayer src={videoUrls[0].signedUrl} />
            </div>
          )}

          {/* Materials tabs */}
          <Tabs defaultValue={recaps.length > 0 ? "recap" : pdfs.length > 0 ? "slides" : "links"}>
            <TabsList>
              {recaps.length > 0 && <TabsTrigger value="recap">Recap</TabsTrigger>}
              {pdfs.length > 0 && <TabsTrigger value="slides">Slides</TabsTrigger>}
              {links.length > 0 && <TabsTrigger value="links">Tài liệu</TabsTrigger>}
            </TabsList>

            {recaps.length > 0 && (
              <TabsContent value="recap">
                <Card>
                  <CardContent className="pt-6 prose prose-sm max-w-none">
                    {recaps.map((r) => (
                      <div key={r.id} dangerouslySetInnerHTML={{
                        __html: r.contentText || "<p>Chưa có nội dung</p>"
                      }} />
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {pdfs.length > 0 && (
              <TabsContent value="slides">
                <Card>
                  <CardContent className="pt-6">
                    {pdfUrls.map((p) => (
                      <div key={p.id} className="mb-4">
                        <p className="font-medium mb-2">{p.title}</p>
                        {p.signedUrl ? (
                          <iframe
                            src={`${p.signedUrl}#toolbar=0&navpanes=0`}
                            className="w-full h-[600px] border rounded"
                            title={p.title}
                          />
                        ) : (
                          <p className="text-muted-foreground">Chưa có file</p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {links.length > 0 && (
              <TabsContent value="links">
                <Card>
                  <CardContent className="pt-6 space-y-2">
                    {links.map((l) => (
                      <a
                        key={l.id}
                        href={l.externalUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 rounded-md border hover:bg-zinc-50 transition"
                      >
                        <span className="text-primary">&#x1F517;</span>
                        <span>{l.title}</span>
                      </a>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {idx > 0 ? (
              <Link href={`/khoa-hoc/${slug}/${idx}`}>
                <Button variant="outline">&larr; Buổi trước</Button>
              </Link>
            ) : <div />}
            {idx < course.sessions.length - 1 && (
              <Link href={`/khoa-hoc/${slug}/${idx + 2}`}>
                <Button>Buổi tiếp &rarr;</Button>
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
