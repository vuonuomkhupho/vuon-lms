import { getSession } from "@/lib/auth-server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader
        user={
          session
            ? {
                name: session.user.name,
                email: session.user.email,
                role: (session.user as any).role,
              }
            : null
        }
      />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
