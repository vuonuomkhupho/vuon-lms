import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || (session.user as any).role !== "admin") {
    redirect("/dang-nhap");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold">V</span>
              </div>
              <span className="font-semibold hidden sm:inline">Vuon Admin</span>
            </Link>
            <div className="w-px h-6 bg-border hidden sm:block" />
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/admin/khoa-hoc"
                className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
              >
                Khóa học
              </Link>
              <Link
                href="/admin/hoc-vien"
                className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
              >
                Học viên
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition px-3 py-1.5 rounded-md hover:bg-muted"
            >
              Về trang chủ
            </Link>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
              {session.user.name?.charAt(0).toUpperCase() || "A"}
            </div>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
