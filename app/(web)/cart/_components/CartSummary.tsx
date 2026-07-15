"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import type { CartDictionary, DiscountInfo } from "@/lib/types/cart";

interface CartSummaryProps {
  totalBeforeDiscount: number;
  total: number;
  discount: DiscountInfo | null;
  dict: { cart?: CartDictionary } & Record<string, unknown>;
  promoCode: string;
  promoError: string;
  promoLoading: boolean;
  isCheckingOut: boolean;
  onPromoCodeChange: (code: string) => void;
  onApplyPromo: () => void;
  onRemovePromo: () => void;
  onCheckout: () => void;
}

export function CartSummary({
  totalBeforeDiscount,
  total,
  discount,
  dict,
  promoCode,
  promoError,
  promoLoading,
  isCheckingOut,
  onPromoCodeChange,
  onApplyPromo,
  onRemovePromo,
  onCheckout,
}: CartSummaryProps) {
  const formatPrice = (price: number) => new Intl.NumberFormat("sr-RS").format(price);
  const discountAmount = discount
    ? Math.round(totalBeforeDiscount * (discount.discountPercent / 100))
    : 0;
  const promoLabel = dict?.cart?.promo_label;

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="bg-muted/20 border-border p-5 sm:p-8">
        <h2 className="text-foreground mb-4 text-[10px] font-black tracking-[0.2em] uppercase sm:mb-6">
          {dict?.cart?.summary}
        </h2>

        <div className="space-y-3">
          <div className="text-foreground flex justify-between text-sm">
            <span className="text-muted-foreground">{dict?.cart?.subtotal}</span>
            <span className="font-bold tabular-nums">{formatPrice(totalBeforeDiscount)} RSD</span>
          </div>

          {discount && (
            <div className="flex justify-between text-sm">
              <span className="text-success">
                {dict?.cart?.discount} ({discount.discountPercent}%)
              </span>
              <span className="text-success font-bold tabular-nums">
                -{formatPrice(discountAmount)} RSD
              </span>
            </div>
          )}

          <div className="border-border border-t pt-3">
            <div className="flex justify-between text-base">
              <span className="text-foreground font-bold">{dict?.cart?.total}</span>
              <span className="text-foreground text-xl font-black tracking-tight tabular-nums">
                {formatPrice(total)} RSD
              </span>
            </div>
          </div>
        </div>

        {/* Promo Code */}
        <div className="mt-5 space-y-2 sm:mt-6">
          <Label
            htmlFor="cart-promo-code"
            className="text-muted-foreground text-[10px] font-black tracking-widest uppercase"
          >
            {promoLabel}
          </Label>
          <div className="flex gap-2">
            <Input
              id="cart-promo-code"
              value={promoCode}
              onChange={(e) => {
                onPromoCodeChange(e.target.value);
              }}
              placeholder={dict?.cart?.promo_placeholder}
              autoComplete="off"
              enterKeyHint="done"
              aria-invalid={Boolean(promoError)}
              aria-describedby={promoError ? "cart-promo-error" : undefined}
              className="bg-muted/50 border-border h-11 rounded-xl text-base sm:text-xs"
            />
            <Button
              disabled={!promoCode || promoLoading}
              onClick={onApplyPromo}
              className="h-11 shrink-0 rounded-xl px-4 text-xs font-bold"
            >
              {dict?.cart?.apply}
            </Button>
          </div>
          {promoError && (
            <p id="cart-promo-error" className="text-destructive text-xs font-medium" role="alert">
              {promoError}
            </p>
          )}
          {discount && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemovePromo}
              className="text-destructive/70 hover:text-destructive h-11 px-0 text-[10px] font-black tracking-widest uppercase sm:h-8"
            >
              {dict?.cart?.remove} {discount.code}
            </Button>
          )}
        </div>

        {/* Desktop / in-flow checkout — mobile uses sticky bar in CartClient */}
        <Button
          onClick={onCheckout}
          disabled={isCheckingOut}
          className="mt-5 hidden h-14 w-full rounded-2xl text-base font-bold sm:mt-6 lg:inline-flex"
        >
          {isCheckingOut ? dict?.cart?.processing : dict?.cart?.checkout}
        </Button>
      </Card>

      <Card className="bg-muted/20 border-border flex flex-wrap items-center justify-center gap-4 p-4 sm:p-6">
        <Image src="/payments/visa.svg" alt="Visa" width={64} height={24} className="h-6 w-auto" />
        <Image
          src="/payments/mastercard.svg"
          alt="Mastercard"
          width={64}
          height={24}
          className="h-6 w-auto"
        />
        <Image
          src="/payments/dinacard.svg"
          alt="DinaCard"
          width={64}
          height={24}
          className="h-6 w-auto"
        />
      </Card>

      <p className="text-muted-foreground px-2 text-center text-[10px] leading-relaxed font-bold sm:px-8">
        {dict?.cart?.terms_notice}
      </p>
    </div>
  );
}
