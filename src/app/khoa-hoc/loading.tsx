import { Card, CardContent } from "@/components/ui/card";

export default function CoursesLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b h-16" />
      <main className="container mx-auto px-4 py-10">
        <div className="h-9 w-32 bg-muted rounded animate-pulse mb-2" />
        <div className="h-5 w-56 bg-muted rounded animate-pulse mb-8" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-5 w-3/4 bg-muted rounded mb-3" />
                <div className="h-4 w-full bg-muted rounded mb-2" />
                <div className="h-4 w-2/3 bg-muted rounded mb-4" />
                <div className="h-3 w-24 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
