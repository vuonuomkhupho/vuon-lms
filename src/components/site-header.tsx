import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";

interface SiteHeaderProps {
  user?: { name: string; email: string; role?: string } | null;
}

export function SiteHeader({ user }: SiteHeaderProps) {
  return (
    <header className="border-b-2 border-foreground bg-card dark:bg-card sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-6 lg:px-8">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center border-2 border-foreground shadow-brutal-sm">
              <span className="text-background text-sm font-black">V</span>
            </div>
            <span className="font-bold text-lg hidden sm:inline">Vuon LMS</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/khoa-hoc"
              className="font-medium text-sm hover:bg-foreground/10 transition px-3.5 py-2 rounded-lg"
            >
              Khóa học
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Link href="/dang-nhap">
                <Button variant="ghost" size="sm">Đăng nhập</Button>
              </Link>
              <Link href="/dang-ky">
                <Button size="sm">Đăng ký</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
