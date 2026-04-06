"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function EnrollButton({ courseId }: { courseId: number }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleEnroll() {
    setLoading(true);
    try {
      const res = await fetch("/api/me/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      if (res.ok) {
        toast.success("Ghi danh thành công!");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Không thể ghi danh");
      }
    } catch {
      toast.error("Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="lg" onClick={handleEnroll} disabled={loading}>
      {loading ? "Đang ghi danh..." : "Ghi danh miễn phí"}
    </Button>
  );
}
