import { Skeleton } from "@/components/ui/skeleton";

/** Brief shell while /checkout redirects to /cart. */
export default function CheckoutLoading() {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-7xl items-center justify-center px-4 pt-8">
      <div className="w-full max-w-sm space-y-4">
        <Skeleton className="bg-muted mx-auto h-6 w-40 rounded-lg" />
        <Skeleton className="bg-muted h-24 w-full rounded-2xl" />
      </div>
    </div>
  );
}
