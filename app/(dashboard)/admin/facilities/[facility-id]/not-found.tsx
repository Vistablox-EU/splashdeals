import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Facility Not Found | Splashdeals Admin",
  description: "The requested facility does not exist or has been removed.",
}

export default function FacilityNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="text-6xl font-bold text-primary/40">404</div>
      <h2 className="text-xl font-semibold text-primary">Facility Not Found</h2>
      <p className="text-muted-foreground text-sm max-w-md text-center">
        The facility you&apos;re looking for doesn&apos;t exist or has been removed.
      </p>
      <div className="flex gap-3 mt-2">
        <Button asChild variant="default">
          <Link href="/admin/facilities">Back to Facilities</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin">Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
