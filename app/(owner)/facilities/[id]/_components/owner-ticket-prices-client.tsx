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
}

export function OwnerTicketPricesClient({ prices, facilityId }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const handleToggleActive = async (priceId: string, currentActive: boolean) => {
    setUpdating(priceId);
    try {
      const { updateTicketPriceAction } = await import("@/app/(server)/actions/owner");
      await updateTicketPriceAction(priceId, { isActive: !currentActive }, facilityId);
      toast.success(currentActive ? "Cena deaktivirana" : "Cena aktivirana");
      router.refresh();
    } catch {
      toast.error("Greška pri ažuriranju");
    } finally {
      setUpdating(null);
    }
  };

  const handleSavePrice = async (priceId: string) => {
    const newPrice = parseFloat(editValue);
    if (isNaN(newPrice) || newPrice <= 0) {
      toast.error("Unesite validnu cenu");
      return;
    }

    setUpdating(priceId);
    try {
      const { updateTicketPriceAction } = await import("@/app/(server)/actions/owner");
      await updateTicketPriceAction(priceId, { price: newPrice }, facilityId);
      toast.success("Cena ažurirana");
      setEditingId(null);
      router.refresh();
    } catch {
      toast.error("Greška pri ažuriranju cene");
    } finally {
      setUpdating(null);
    }
  };

  if (prices.length === 0) {
    return (
      <p className="text-muted-foreground py-4 text-center text-sm">
        Nema aktivnih cena ulaznica za ovaj objekat.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 font-medium">Kategorija</th>
            <th className="pb-2 font-medium">Tip</th>
            <th className="pb-2 font-medium">Oznaka</th>
            <th className="pb-2 font-medium">Cena (RSD)</th>
            <th className="pb-2 font-medium">Aktivna</th>
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
                      Sačuvaj
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Otkaži
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
                  <span className="text-muted-foreground text-xs">Ažuriranje...</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
