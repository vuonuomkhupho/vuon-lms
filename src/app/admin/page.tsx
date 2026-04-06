"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Users, Layers, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  { key: "totalCourses" as const, label: "Khóa học", icon: BookOpen, color: "text-blue-600 dark:text-blue-400 bg-blue-500/10" },
  { key: "publishedCourses" as const, label: "Đã xuất bản", icon: BarChart3, color: "text-success bg-success/10" },
  { key: "totalStudents" as const, label: "Học viên", icon: Users, color: "text-purple-600 dark:text-purple-400 bg-purple-500/10" },
  { key: "totalSessions" as const, label: "Buổi học", icon: Layers, color: "text-amber-600 dark:text-amber-400 bg-amber-500/10" },
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
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-48 mb-8" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Tổng quan</h1>
        <p className="text-muted-foreground text-sm mt-1">Tình hình hoạt động của nền tảng</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {STAT_CARDS.map((stat) => (
          <Card key={stat.key}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats[stat.key]}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent enrollments */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Ghi danh gần đây</h2>
              <Link href="/admin/hoc-vien">
                <Button variant="ghost" size="sm">Xem tất cả</Button>
              </Link>
            </div>
            {stats.recentEnrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Chưa có ghi danh nào</p>
            ) : (
              <div className="space-y-3">
                {stats.recentEnrollments.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{e.studentName}</p>
                      <p className="text-xs text-muted-foreground truncate">{e.courseTitle}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Khóa học</h2>
              <Link href="/admin/khoa-hoc">
                <Button variant="ghost" size="sm">Quản lý</Button>
              </Link>
            </div>
            {stats.courseStats.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Chưa có khóa học nào</p>
            ) : (
              <div className="space-y-3">
                {stats.courseStats.slice(0, 5).map((course) => (
                  <Link key={course.id} href={`/admin/khoa-hoc/${course.id}/sua`} className="flex items-center justify-between text-sm hover:bg-muted/50 -mx-2 px-2 py-1.5 rounded-lg transition">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{course.title}</p>
                      <p className="text-xs text-muted-foreground">{course.enrollmentCount} học viên</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${course.isPublished ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                      {course.isPublished ? "Xuất bản" : "Nháp"}
                    </span>
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
