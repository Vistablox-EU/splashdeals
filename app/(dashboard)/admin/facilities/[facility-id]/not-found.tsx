import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Objekat nije pronađen | Splashdeals Admin",
  description: "Traženi objekat ne postoji ili je uklonjen.",
};

export default function FacilityNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="text-primary/40 text-6xl font-bold">404</div>
      <h2 className="text-primary text-xl font-semibold">Objekat nije pronađen</h2>
      <p className="text-muted-foreground max-w-md text-center text-sm">
        Objekat koji tražite ne postoji ili je uklonjen.
      </p>
      <div className="mt-2 flex gap-3">
        <Button asChild variant="default">
          <Link href="/admin/facilities">Nazad na objekte</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin">Kontrolna tabla</Link>
        </Button>
      </div>
    </div>
  );
}
