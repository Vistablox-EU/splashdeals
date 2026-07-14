import { requireAdmin } from "@/app/(server)/lib/auth-guards";
import { PageEditor } from "../_components/page-editor";
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/dictionaries";
import type { Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Nova strana | CMS | Splashdeals",
};

export default async function NewPagePage() {
  await requireAdmin();
  await connection();

  const dict = await getDictionary();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild aria-label="Nazad na listu strana">
          <Link href="/admin/cms/pages">
            <Icon name="arrow_back" className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nova strana</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Kreiraj novu statičku ili landing stranu.
          </p>
        </div>
      </div>
      <PageEditor dict={dict} />
    </div>
  );
}
