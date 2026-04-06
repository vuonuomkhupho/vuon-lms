"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CourseItem {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  instructor: { name: string } | null;
  sessions: { id: number }[];
}

export function CourseGrid({ courses }: { courses: CourseItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = query
    ? courses.filter(
        (c) =>
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          c.description?.toLowerCase().includes(query.toLowerCase())
      )
    : courses;

  return (
    <>
      {courses.length > 3 && (
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm khóa học..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Không tìm thấy khóa học nào cho &ldquo;{query}&rdquo;</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <Link key={course.id} href={`/khoa-hoc/${course.slug}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full group">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {course.description || "Khám phá khóa học này"}
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    {course.instructor && (
                      <span className="text-xs text-muted-foreground">{course.instructor.name}</span>
                    )}
                    <Badge variant="outline" className="text-[10px] ml-auto">
                      {course.sessions.length} buổi
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
