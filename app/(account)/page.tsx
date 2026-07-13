import { redirect } from "next/navigation";

/**
 * 🌊 Account root — redirect to /moje-karte
 */
export default function AccountRootPage() {
  redirect("/moje-karte");
}
