import { Icon } from "@/components/ui/Icon";
import { getDictionary } from "@/lib/dictionaries";

export default async function AccountLoading() {
  const dict = await getDictionary();
  const t = dict.account;

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Icon name="refresh" className="text-primary size-8 animate-spin" />
        <p className="text-muted-foreground text-sm font-medium">{t.loading || "Učitavanje..."}</p>
      </div>
    </div>
  );
}
