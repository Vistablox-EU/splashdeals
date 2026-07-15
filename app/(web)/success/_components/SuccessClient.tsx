"use client";
import { Icon } from "@/components/ui/Icon";

import { useEffect, useState, useTransition } from "react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { resendConfirmationAction } from "@/app/(server)/actions/checkout";
import {
  getCheckoutTerminalMessage,
  isCheckoutTerminalStatus,
  shouldRetryCheckoutStatus,
} from "./success-state";

interface IssuedTicket {
  id: string;
  qrHash: string;
  ticket: {
    title: string;
    description: string | null;
    facility: {
      name: string;
      location: string | null;
    };
  };
}

interface Transaction {
  id: string;
  status: string;
  totalAmount: number;
  issuedTickets: IssuedTicket[];
}

export interface SuccessDictionary {
  metadata: {
    title: string;
    description: string;
  };
  access_denied: {
    title: string;
    description: string;
  };
  processing: {
    title: string;
    description: string;
  };
  header: {
    title: string;
    status: string;
    description: string;
  };
  ticket: {
    valid: string;
    location: string;
    issue_date: string;
    ref: string;
  };
  actions: {
    continue: string;
    download: string;
  };
  footer: {
    email_notice: string;
    protocol: string;
  };
  resend_sent: string;
  resend_error: string;
  resend_button: string;
}

export function SuccessClient({
  sessionId,
  initialTransaction,
  dict,
}: {
  sessionId: string;
  initialTransaction: Transaction | null;
  dict: SuccessDictionary;
}) {
  const [transaction, setTransaction] = useState<Transaction | null>(initialTransaction);
  const transactionStatus = transaction?.status;
  const terminalMessage = transactionStatus ? getCheckoutTerminalMessage(transactionStatus) : null;
  const isLoading = !transactionStatus || transactionStatus === "PENDING";
  const [isPending, startTransition] = useTransition();
  const [resendStatus, setResendStatus] = useState<"idle" | "sent" | "error">("idle");
  const [pollingError, setPollingError] = useState<string | null>(null);

  const handleResend = () => {
    startTransition(async () => {
      try {
        const result = await resendConfirmationAction(transaction!.id);
        if (result.success) {
          setResendStatus("sent");
          setTimeout(() => setResendStatus("idle"), 3000);
        } else {
          setResendStatus("error");
          setTimeout(() => setResendStatus("idle"), 3000);
        }
      } catch {
        setResendStatus("error");
        setTimeout(() => setResendStatus("idle"), 3000);
      }
    });
  };

  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;
    let isActive = true;

    if (!transactionStatus || transactionStatus === "PENDING") {
      const poll = async () => {
        if (!isActive) return;
        try {
          const res = await fetch(`/api/checkout/status?session_id=${sessionId}`);
          const data = await res.json();

          if (!isActive) return;

          if (!res.ok) {
            if (shouldRetryCheckoutStatus(res.status)) {
              throw new Error(`Status zahteva nije dostupan (${res.status}).`);
            }
            setPollingError(
              res.status === 401 || res.status === 403
                ? "Vaša sesija je istekla. Prijavite se ponovo da biste proverili plaćanje."
                : "Podaci o ovom plaćanju nisu pronađeni.",
            );
            return;
          }
          if (data.status === "SUCCESS" || isCheckoutTerminalStatus(data.status)) {
            setTransaction(data);
          } else {
            timerId = setTimeout(poll, 3000);
          }
        } catch (error) {
          console.error("Polling error:", error);
          if (isActive) {
            timerId = setTimeout(poll, 5000);
          }
        }
      };

      poll();
    }

    return () => {
      isActive = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [sessionId, transactionStatus]);

  if (pollingError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 pt-20 text-center">
        <div className="border-destructive/20 bg-destructive/10 text-destructive flex h-20 w-20 items-center justify-center rounded-full border">
          <Icon name="error" className="text-[40px]" />
        </div>
        <div className="max-w-lg space-y-3">
          <h1 className="text-foreground text-3xl font-black tracking-tighter uppercase italic">
            Provera plaćanja nije dostupna
          </h1>
          <p className="text-muted-foreground font-medium">{pollingError}</p>
        </div>
        <Link href="/prijava">
          <Button size="lg" variant="outline">
            Prijavite se
          </Button>
        </Link>
      </div>
    );
  }

  if (terminalMessage) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 pt-20 text-center">
        <div className="border-primary/20 bg-primary/10 text-primary flex h-20 w-20 items-center justify-center rounded-full border">
          <Icon
            name={transaction?.status === "PAID_REVIEW" ? "support_agent" : "info"}
            className="text-[40px]"
          />
        </div>
        <div className="max-w-lg space-y-3">
          <h1 className="text-foreground text-3xl font-black tracking-tighter uppercase italic">
            Status plaćanja
          </h1>
          <p className="text-muted-foreground font-medium">{terminalMessage}</p>
        </div>
        <Link href="/cart">
          <Button size="lg" variant="outline">
            <Icon name="shopping_bag" className="mr-2 text-[20px]" />
            Nazad u korpu
          </Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-8 pt-20 text-center">
        <div className="relative">
          <div className="text-primary animate-spin">
            <Icon name="progress_activity" className="text-[80px]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon name="confirmation_number" className="text-primary/50 text-[24px]" />
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-foreground text-3xl leading-none font-black tracking-tighter uppercase italic">
            {dict.processing.title}
          </h2>
          <p className="text-muted-foreground font-medium">{dict.processing.description}</p>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="bg-primary animate-pulse-dot h-1.5 w-1.5 rounded-full"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-20">
      {/* 🌟 Header Section */}
      <div className="animate-fade-in-up space-y-6 text-center">
        <div className="relative inline-block">
          <div className="animate-scale-in border-primary/20 bg-primary/10 text-primary relative z-10 inline-flex h-24 w-24 items-center justify-center rounded-full border">
            <Icon name="check_circle" className="text-[56px]" />
          </div>
          <div className="bg-primary/20 absolute -top-4 -right-4 h-12 w-12 animate-pulse rounded-full blur-2xl" />
          <div className="bg-primary/20 absolute -bottom-4 -left-4 h-12 w-12 animate-pulse rounded-full blur-2xl delay-700" />
        </div>

        <div className="space-y-3">
          <h1 className="text-foreground text-4xl leading-tight font-black tracking-tighter uppercase italic md:text-6xl">
            {dict.header.title}{" "}
            <span className="from-primary to-primary-dark bg-gradient-to-r bg-clip-text text-transparent">
              {dict.header.status}
            </span>
          </h1>
          <p className="text-muted-foreground mx-auto max-w-xl text-lg">
            {dict.header.description}
          </p>
        </div>
      </div>

      {/* 🎟️ Ticket Container */}
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {transaction.issuedTickets.map((issuedTicket, index) => (
            <div
              key={issuedTicket.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${0.2 + index * 0.1}s` }}
            >
              <Card className="group border-border/5 bg-card/40 hover:border-primary/30 flex flex-col overflow-hidden p-0 transition-colors duration-500 md:flex-row">
                {/* QR Code Wing */}
                <div className="bg-background relative flex min-w-[240px] items-center justify-center p-10">
                  <div className="from-primary/5 pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent" />
                  <div className="relative">
                    <QRCodeSVG
                      value={issuedTicket.qrHash}
                      size={160}
                      level="H"
                      includeMargin={false}
                      className="drop-shadow-2xl grayscale transition-all duration-700 group-hover:grayscale-0"
                    />
                    {/* Corner Accents */}
                    <div className="border-muted-foreground/10 absolute -top-2 -left-2 h-4 w-4 border-t-2 border-l-2" />
                    <div className="border-muted-foreground/10 absolute -right-2 -bottom-2 h-4 w-4 border-r-2 border-b-2" />
                  </div>
                </div>

                {/* Data Wing */}
                <div className="relative flex-1 space-y-6 p-8">
                  {/* Decorative background text */}
                  <div className="text-foreground/[0.02] pointer-events-none absolute top-4 right-4 text-6xl font-black tracking-tighter select-none">
                    SPLASH
                  </div>

                  <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary h-1.5 w-1.5 rounded-full shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                      <span className="text-primary text-[10px] font-bold tracking-[0.3em] uppercase">
                        {dict.ticket.valid}
                      </span>
                    </div>
                    <h3 className="text-foreground text-2xl leading-none font-black tracking-tighter uppercase italic">
                      {issuedTicket.ticket.title}
                    </h3>
                  </div>

                  <div className="border-border/5 relative z-10 space-y-4 border-t pt-4">
                    <div className="group/item flex items-start gap-3">
                      <div className="bg-muted/5 text-muted-foreground group-hover/item:text-primary rounded-lg p-2 transition-colors">
                        <Icon name="location_on" className="text-[16px]" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-muted-foreground/60 text-[10px] font-bold tracking-wider uppercase">
                          {dict.ticket.location}
                        </p>
                        <p className="text-foreground text-sm font-medium">
                          {issuedTicket.ticket.facility.name}
                        </p>
                      </div>
                    </div>

                    <div className="group/item flex items-start gap-3">
                      <div className="bg-muted/5 text-muted-foreground group-hover/item:text-primary rounded-lg p-2 transition-colors">
                        <Icon name="calendar_month" className="text-[16px]" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-muted-foreground/60 text-[10px] font-bold tracking-wider uppercase">
                          {dict.ticket.issue_date}
                        </p>
                        <p className="text-foreground text-sm font-medium">
                          {new Date().toLocaleDateString(undefined, {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="text-muted-foreground/50 font-mono text-[10px] tracking-wider">
                      {dict.ticket.ref}: {issuedTicket.id.slice(-12).toUpperCase()}
                    </div>
                    <div className="bg-muted/5 text-foreground/20 group-hover:text-primary group-hover:bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full transition-all">
                      <SuccessSparkles size={14} />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* 🛠️ Footer Actions */}
        <div
          className="animate-fade-in flex flex-col items-center justify-center gap-6 pt-10 sm:flex-row"
          style={{ animationDelay: "0.8s", animationFillMode: "both" }}
        >
          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="bg-muted/5 text-foreground hover:bg-muted/10 border-border/10 h-16 w-full rounded-full border px-10 sm:w-auto"
            >
              <Icon name="arrow_back" className="mr-3 text-[20px]" />
              {dict.actions.continue}
            </Button>
          </Link>

          <Button
            onClick={() => window.print()}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-16 w-full rounded-full px-10 shadow-[0_0_30px_hsl(var(--primary)/0.3)] sm:w-auto"
          >
            <Icon name="download" className="text-primary-foreground mr-3 text-[20px]" />
            {dict.actions.download}
          </Button>

          <Button
            onClick={handleResend}
            disabled={isPending}
            size="lg"
            variant="outline"
            className="bg-muted/5 text-foreground hover:bg-muted/10 border-border/10 h-16 w-full rounded-full border px-10 sm:w-auto"
          >
            <Icon
              name={
                resendStatus === "sent" ? "check_circle" : isPending ? "progress_activity" : "mail"
              }
              className={`mr-3 text-[20px] ${isPending ? "animate-spin" : ""}`}
            />
            {resendStatus === "sent"
              ? dict.resend_sent
              : resendStatus === "error"
                ? dict.resend_error
                : dict.resend_button}
          </Button>
        </div>

        <div className="pt-8 text-center">
          <p className="text-muted-foreground text-xs font-medium">{dict.footer.email_notice}</p>
          <p className="text-muted-foreground/60 mt-2 text-[10px] font-bold tracking-widest uppercase">
            {dict.footer.protocol}
          </p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          header,
          footer,
          nav,
          button,
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .container {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .issued-ticket {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

function SuccessSparkles({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
