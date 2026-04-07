"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Users, Layers, BarChart3, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  totalCourses: number;
  publishedCourses: number;
  totalStudents: number;
  totalSessions: number;
  courseStats: {
    id: number;
    title: string;
    slug: string;
    isPublished: boolean;
    enrollmentCount: number;
  }[];
  recentEnrollments: {
    id: number;
    studentName: string;
    studentEmail: string;
    courseTitle: string;
    enrolledAt: string;
  }[];
}

const STAT_CARDS = [
  { key: "totalCourses" as const, label: "Khóa học", icon: BookOpen, bg: "bg-[#DBEAFE]", iconBg: "bg-[#3B82F6]", iconColor: "text-white" },
  { key: "publishedCourses" as const, label: "Đã xuất bản", icon: BarChart3, bg: "bg-[#D1FAE5]", iconBg: "bg-[#10B981]", iconColor: "text-white" },
  { key: "totalStudents" as const, label: "Học viên", icon: Users, bg: "bg-[#FEF3C7]", iconBg: "bg-[#F59E0B]", iconColor: "text-white" },
  { key: "totalSessions" as const, label: "Buổi học", icon: Layers, bg: "bg-[#EDE9FE]", iconBg: "bg-[#8B5CF6]", iconColor: "text-white" },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-6 lg:px-8 py-10">
        <Skeleton className="h-10 w-72 mb-2" />
        <Skeleton className="h-5 w-56 mb-10" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="container mx-auto px-6 lg:px-8 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-black">Tổng quan</h1>
        <p className="text-muted-foreground mt-1">Tình hình hoạt động của nền tảng</p>
      </div>

      {/* Stat cards — bold colored backgrounds */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {STAT_CARDS.map((stat) => (
          <div
            key={stat.key}
            className={`${stat.bg} rounded-lg border-2 border-foreground p-6 shadow-brutal transition-transform hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--foreground)]`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-11 h-11 rounded-lg ${stat.iconBg} flex items-center justify-center border-2 border-foreground shadow-brutal-sm`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </div>
            <p className="text-4xl font-black tracking-tight">{stats[stat.key]}</p>
            <p className="text-sm font-semibold mt-1 text-foreground/70">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent enrollments */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Ghi danh gần đây</h2>
              <Link href="/admin/hoc-vien">
                <Button variant="outline" size="sm">
                  Xem tất cả
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
            {stats.recentEnrollments.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Chưa có ghi danh nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentEnrollments.map((e) => (
                  <div key={e.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary border-2 border-foreground flex items-center justify-center text-xs font-bold shrink-0">
                      {e.studentName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{e.studentName}</p>
                      <p className="text-xs text-muted-foreground truncate">{e.courseTitle}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(e.enrolledAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top courses */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Khóa học</h2>
              <Link href="/admin/khoa-hoc">
                <Button variant="outline" size="sm">
                  Quản lý
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
            {stats.courseStats.length === 0 ? (
              <div className="py-12 text-center">
                <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Chưa có khóa học nào</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.courseStats.slice(0, 5).map((course) => (
                  <Link
                    key={course.id}
                    href={`/admin/khoa-hoc/${course.id}/sua`}
                    className="flex items-center justify-between py-3 px-3 -mx-3 rounded-lg hover:bg-muted transition group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm group-hover:text-primary transition truncate">{course.title}</p>
                      <p className="text-xs text-muted-foreground">{course.enrollmentCount} học viên</p>
                    </div>
                    <Badge variant={course.isPublished ? "default" : "secondary"}>
                      {course.isPublished ? "Xuất bản" : "Nháp"}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
