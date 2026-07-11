import { getDictionary } from "@/lib/dictionaries";
import { MediaLibraryPage } from "./_components/media-library-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Media biblioteka | CMS | Splashdeals",
};

export default async function MediaLibraryRoute() {
  const dict = await getDictionary();

  return <MediaLibraryPage dict={dict} />;
}
