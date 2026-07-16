import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/app/(server)/lib/auth-guards";
import { connection } from "next/server";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/Icon";
import { CMS_NAV } from "./_lib/cms-nav";
import { loadCmsHubStats } from "./_data/cms-loaders";

export const metadata: Metadata = {
  title: "CMS | Splashdeals Admin",
  description: "Upravljajte blog postovima, stranicama i sadržajem.",
};

export default async function CMSHubPage() {
  await requireAdmin();
  await connection();

  const stats = await loadCmsHubStats();

  const hubLinks = CMS_NAV.filter((item) => item.hub);
  const statCards: Array<{ label: string; value: number; href?: string }> = [
    { label: "Objave", value: stats.posts, href: "/admin/cms/posts" },
    { label: "Zakazane", value: stats.scheduled, href: "/admin/cms/posts?status=scheduled" },
    { label: "Strane", value: stats.pages, href: "/admin/cms/pages" },
    { label: "Kategorije", value: stats.categories, href: "/admin/cms/categories" },
    { label: "Oznake", value: stats.tags, href: "/admin/cms/tags" },
    { label: "Kuponi / kampanje", value: stats.campaigns, href: "/admin/cms/campaigns" },
    { label: "Recenzije", value: stats.reviews, href: "/admin/cms/reviews" },
    { label: "Preusmeravanja", value: stats.redirects, href: "/admin/cms/redirects" },
    { label: "Vebhukovi", value: stats.webhooks, href: "/admin/cms/webhooks" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">CMS pregled</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Brzi pristup modulima sadržaja i operativnim alatima. Kuponi/kampanje su marketplace
          popusti — email kampanje idu preko Listmonk-a.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat) => {
          const body = (
            <Card className="p-4 transition-colors hover:border-primary/40">
              <p className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-black tracking-tight">{stat.value}</p>
            </Card>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href} className="block">
              {body}
            </Link>
          ) : (
            body
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {hubLinks.map((item) => (
          <Link key={item.href} href={item.href} className="group">
            <Card className="hover:border-primary/40 flex items-center gap-3 p-4 transition-colors">
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
                <Icon name={item.icon} className="text-[20px]" />
              </div>
              <span className="group-hover:text-primary text-sm font-bold tracking-wide uppercase transition-colors">
                {item.label}
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
