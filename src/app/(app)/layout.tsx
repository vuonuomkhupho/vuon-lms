import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { SiteHeader } from "@/components/site-header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/dang-nhap");
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader
        user={{
          name: session.user.name,
          email: session.user.email,
          role: (session.user as any).role,
        }}
      />
      <main>{children}</main>
    </div>
  );
}
