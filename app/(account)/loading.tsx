import { Icon } from "@/components/ui/Icon";

export default function AccountLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Icon name="refresh" className="text-primary size-8 animate-spin" />
        <p className="text-muted-foreground text-sm font-medium">Učitavanje...</p>
      </div>
    </div>
  );
}
