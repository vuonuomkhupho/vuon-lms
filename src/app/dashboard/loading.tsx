import { Card, CardContent } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b h-16" />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mb-1" />
          <div className="h-5 w-64 bg-muted rounded mb-6" />
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-5 w-3/4 bg-muted rounded mb-3" />
                  <div className="h-4 w-1/2 bg-muted rounded mb-4" />
                  <div className="h-2 w-full bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
