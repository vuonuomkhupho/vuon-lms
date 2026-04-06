import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";

interface SiteHeaderProps {
  user?: { name: string; email: string; role?: string } | null;
}

export function SiteHeader({ user }: SiteHeaderProps) {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">V</span>
            </div>
            <span className="font-semibold text-lg hidden sm:inline">Vuon LMS</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/khoa-hoc"
              className="text-sm text-muted-foreground hover:text-foreground transition px-3 py-1.5 rounded-md hover:bg-muted"
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
