"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect to course list — creation is now a modal
export default function CreateCoursePage() {
  const router = useRouter();
  useEffect(() => { router.replace("/admin/khoa-hoc"); }, [router]);
  return null;
}
