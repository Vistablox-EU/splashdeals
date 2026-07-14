import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionaries";

export const metadata: Metadata = {
  title: "Stranica nije pronađena | Splashdeals Admin",
  description: "This admin sector does not exist or has been relocated.",
};

export default async function AdminNotFound() {
  const dict = await getDictionary();
  const t = (dict.admin as Record<string, any>) || {};

  return (
    <div className="bg-background flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-[60px]" />
        <div className="bg-muted relative rounded-2xl border border-amber-500/50 p-6 shadow-2xl">
          <Icon name="search" className="size-12 text-amber-500" />
        </div>
      </div>

      <h1 className="text-foreground mb-4 text-4xl font-black tracking-tighter uppercase italic">
        {t.not_found_title || "Stranica nije pronađena"}
      </h1>

      <p className="text-muted-foreground mb-8 max-w-md leading-relaxed font-medium">
        {t.not_found_description ||
          "This admin sector does not exist or has been relocated. Check the navigation for available sections."}
      </p>

      <Button
        asChild
        variant="secondary"
        size="lg"
        className="rounded-xl text-[10px] font-black tracking-widest uppercase"
      >
        <Link href="/admin">
          <Icon name="arrow_back" className="size-4" />
          {t.not_found_back || "Kontrolna tabla"}
        </Link>
      </Button>
    </div>
  );
}
