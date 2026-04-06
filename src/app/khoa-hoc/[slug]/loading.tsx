export default function CourseDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b h-16" />
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="animate-pulse">
          <div className="flex gap-2 mb-3">
            <div className="h-6 w-20 bg-muted rounded-full" />
            <div className="h-6 w-24 bg-muted rounded-full" />
          </div>
          <div className="h-10 w-3/4 bg-muted rounded mb-3" />
          <div className="h-5 w-full bg-muted rounded mb-2" />
          <div className="h-5 w-2/3 bg-muted rounded mb-8" />
          <div className="h-24 w-full bg-muted rounded-xl mb-8" />
          <div className="h-6 w-40 bg-muted rounded mb-4" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 w-full bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
