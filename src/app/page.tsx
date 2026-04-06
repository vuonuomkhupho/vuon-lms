import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link href="/" className="text-xl font-bold">
            Vuon LMS
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/khoa-hoc" className="text-sm hover:underline">
              Khóa học
            </Link>
            <Link href="/dang-nhap">
              <Button variant="outline" size="sm">
                Đăng nhập
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-6 px-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Nền tảng học
            <br />
            <span className="text-primary">trực tuyến</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Tiếp cận kiến thức chất lượng mọi lúc, mọi nơi. Học theo tốc độ
            của riêng bạn.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/khoa-hoc">
              <Button size="lg">Xem khóa học</Button>
            </Link>
            <Link href="/dang-ky">
              <Button size="lg" variant="outline">
                Đăng ký tài khoản
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>&copy; 2026 Vuon LMS. All rights reserved.</p>
      </footer>
    </div>
  );
}
