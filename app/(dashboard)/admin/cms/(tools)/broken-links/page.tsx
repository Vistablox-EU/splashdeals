import { requireAdmin } from "@/app/(server)/lib/auth-guards";
import type { Metadata } from "next";
import { BrokenLinksClient } from "./_components/broken-links-client";

export const metadata: Metadata = {
  title: "Provera linkova | CMS | Splashdeals",
};

export default async function BrokenLinksPage() {
  await requireAdmin();

  return <BrokenLinksClient />;
}
