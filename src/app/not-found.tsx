import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center animate-fade-in-up">
        <p className="text-7xl font-bold text-primary/20 mb-4">404</p>
        <h1 className="text-2xl font-bold mb-2">Không tìm thấy trang</h1>
        <p className="text-muted-foreground mb-6">Trang bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        <Link href="/">
          <Button>Về trang chủ</Button>
        </Link>
      </div>
    </div>
  );
}
