import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FacilityNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="text-6xl font-bold text-cyan-400/40">404</div>
      <h2 className="text-xl font-semibold text-cyan-200">Facility Not Found</h2>
      <p className="text-muted-foreground text-sm max-w-md text-center">
        The facility you&apos;re looking for doesn&apos;t exist or has been removed.
      </p>
      <div className="flex gap-3 mt-2">
        <Link href="/admin/facilities">
          <Button variant="default">Back to Facilities</Button>
        </Link>
        <Link href="/admin">
          <Button variant="outline">Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
