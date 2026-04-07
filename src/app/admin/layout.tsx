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
    <div className="min-h-screen bg-background">
      <header className="border-b-2 border-foreground bg-[#DBEAFE] dark:bg-primary/20 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-6 lg:px-8">
          <div className="flex items-center gap-5">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center border-2 border-foreground shadow-brutal-sm">
                <span className="text-background text-sm font-black">V</span>
              </div>
              <span className="font-bold text-lg hidden sm:inline">Vuon Admin</span>
            </Link>
            <div className="w-px h-7 bg-foreground/20 hidden sm:block" />
            <nav className="flex items-center gap-1">
              <Link
                href="/admin/khoa-hoc"
                className="px-3.5 py-2 rounded-lg font-medium text-sm hover:bg-foreground/10 transition"
              >
                Khóa học
              </Link>
              <Link
                href="/admin/hoc-vien"
                className="px-3.5 py-2 rounded-lg font-medium text-sm hover:bg-foreground/10 transition"
              >
                Học viên
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="text-sm font-medium hover:bg-foreground/10 transition px-3.5 py-2 rounded-lg"
            >
              Trang chủ
            </Link>
            <div className="w-9 h-9 rounded-lg bg-foreground border-2 border-foreground flex items-center justify-center text-background text-sm font-bold shadow-brutal-sm">
              {session.user.name?.charAt(0).toUpperCase() || "A"}
            </div>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
