import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";

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
      <header className="border-b bg-muted/30">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-bold">
              Vuon Admin
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/admin/khoa-hoc" className="text-muted-foreground hover:text-foreground transition">
                Khóa học
              </Link>
              <Link href="/admin/hoc-vien" className="text-muted-foreground hover:text-foreground transition">
                Học viên
              </Link>
            </nav>
          </div>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition">
            Về trang chủ
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
