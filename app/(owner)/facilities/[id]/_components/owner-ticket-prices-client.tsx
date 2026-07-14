"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface TicketPrice {
  id: string;
  price: { toString(): string; toNumber(): number };
  isActive: boolean;
  displayOrder: number;
  label: string | null;
  ticketType: {
    title: string;
    category: { title: string };
  };
}

interface Props {
  prices: TicketPrice[];
  facilityId: string;
  dict: Record<string, unknown>;
}

export function OwnerTicketPricesClient({ prices, facilityId, dict }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const t = dict.owner as Record<string, string>;

  const handleToggleActive = async (priceId: string, currentActive: boolean) => {
    setUpdating(priceId);
    try {
      const { updateTicketPriceAction } = await import("@/app/(server)/actions/owner");
      await updateTicketPriceAction(priceId, { isActive: !currentActive }, facilityId);
      toast.success(currentActive ? t.ticket_deactivated : t.ticket_activated);
      router.refresh();
    } catch {
      toast.error(t.update_error);
    } finally {
      setUpdating(null);
    }
  };

  const handleSavePrice = async (priceId: string) => {
    const newPrice = parseFloat(editValue);
    if (isNaN(newPrice) || newPrice <= 0) {
      toast.error(t.invalid_price);
      return;
    }

    setUpdating(priceId);
    try {
      const { updateTicketPriceAction } = await import("@/app/(server)/actions/owner");
      await updateTicketPriceAction(priceId, { price: newPrice }, facilityId);
      toast.success(t.price_updated);
      setEditingId(null);
      router.refresh();
    } catch {
      toast.error(t.price_update_error);
    } finally {
      setUpdating(null);
    }
  };

  if (prices.length === 0) {
    return <p className="text-muted-foreground py-4 text-center text-sm">{t.no_prices}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 font-medium">{t.category_header}</th>
            <th className="pb-2 font-medium">{t.type_header}</th>
            <th className="pb-2 font-medium">{t.label_header}</th>
            <th className="pb-2 font-medium">{t.price_header}</th>
            <th className="pb-2 font-medium">{t.active_header}</th>
            <th className="pb-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {prices.map((price) => (
            <tr key={price.id} className="border-b last:border-0">
              <td className="text-muted-foreground py-2">{price.ticketType.category.title}</td>
              <td className="py-2 font-medium">{price.ticketType.title}</td>
              <td className="text-muted-foreground py-2">{price.label || "—"}</td>
              <td className="py-2">
                {editingId === price.id ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.01"
                      className="h-8 w-24"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSavePrice(price.id)}
                      disabled={updating === price.id}
                    >
                      {t.save}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      {t.cancel}
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(price.id);
                      setEditValue(String(Number(price.price)));
                    }}
                    className="hover:text-primary cursor-pointer font-mono transition-colors"
                  >
                    {Number(price.price).toLocaleString("sr-RS", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    RSD
                  </button>
                )}
              </td>
              <td className="py-2">
                <Switch
                  checked={price.isActive}
                  onCheckedChange={() => handleToggleActive(price.id, price.isActive)}
                  disabled={updating === price.id}
                />
              </td>
              <td className="py-2">
                {updating === price.id && (
                  <span className="text-muted-foreground text-xs">{t.updating}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
