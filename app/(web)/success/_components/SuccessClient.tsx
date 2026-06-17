"use client";
import { Icon } from "@/components/ui/Icon";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { LiquidButton } from "@/components/ui/LiquidButton";
import { GlassCard } from "@/components/ui/GlassCard";

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
}

export function SuccessClient({ 
  sessionId, 
  initialTransaction,
  dict
}: { 
  sessionId: string; 
  initialTransaction: Transaction | null;
  dict: SuccessDictionary;
}) {
  const [transaction, setTransaction] = useState<Transaction | null>(initialTransaction);
  const isLoading = !transaction || transaction.status !== "SUCCESS";

  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;
    let isActive = true;

    if (transaction?.status !== "SUCCESS") {
        const poll = async () => {
          if (!isActive) return;
          try {
            const res = await fetch(`/api/checkout/status?session_id=${sessionId}`);
            const data = await res.json();
            
            if (!isActive) return;

            if (data.status === "SUCCESS") {
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
  }, [sessionId, transaction?.status]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center pt-20">
        <div className="relative">
            <div
            className="text-cyan-500 animate-spin"
            >
            <Icon name="progress_activity" className="text-[80px]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
                <Icon name="confirmation_number" className="text-[24px] text-cyan-400 opacity-50" />
            </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">
            {dict.processing.title}
          </h2>
          <p className="text-slate-400 font-medium">{dict.processing.description}</p>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse-dot"
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
      <div className="text-center space-y-6 animate-fade-in-up">
        <div className="relative inline-block">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 relative z-10 animate-scale-in">
            <Icon name="check_circle" className="text-[56px]" />
            </div>
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-cyan-500/20 blur-2xl rounded-full animate-pulse" />
            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-blue-500/20 blur-2xl rounded-full animate-pulse delay-700" />
        </div>

        <div className="space-y-3">
            <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-tight">
              {dict.header.title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{dict.header.status}</span>
            </h1>
            <p className="text-slate-400 max-w-xl mx-auto text-lg">
              {dict.header.description}
            </p>
        </div>
      </div>

      {/* 🎟️ Ticket Container */}
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {transaction.issuedTickets.map((issuedTicket, index) => (
                <div
                key={issuedTicket.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                >
                <GlassCard className="group overflow-hidden flex flex-col md:flex-row p-0 border-white/5 bg-slate-950/40 hover:border-cyan-500/30 transition-colors duration-500">
                    {/* QR Code Wing */}
                    <div className="p-10 bg-white flex items-center justify-center relative min-w-[240px]">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 to-transparent pointer-events-none" />
                        <div className="relative">
                            <QRCodeSVG 
                                value={issuedTicket.qrHash} 
                                size={160} 
                                level="H"
                                includeMargin={false}
                                className="drop-shadow-2xl grayscale group-hover:grayscale-0 transition-all duration-700"
                            />
                            {/* Corner Accents */}
                            <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-slate-900/10" />
                            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-slate-900/10" />
                        </div>
                    </div>
                    
                    {/* Data Wing */}
                    <div className="flex-1 p-8 space-y-6 relative">
                        {/* Decorative background text */}
                        <div className="absolute top-4 right-4 text-white/[0.02] font-black text-6xl pointer-events-none select-none tracking-tighter">
                            SPLASH
                        </div>

                        <div className="space-y-2 relative z-10">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                                <span className="text-[10px] font-bold text-cyan-400 tracking-[0.3em] uppercase">{dict.ticket.valid}</span>
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tighter italic uppercase leading-none">
                                {issuedTicket.ticket.title}
                            </h3>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/5 relative z-10">
                            <div className="flex items-start gap-3 group/item">
                                <div className="p-2 rounded-lg bg-white/5 text-slate-400 group-hover/item:text-cyan-400 transition-colors">
                                    <Icon name="location_on" className="text-[16px]" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{dict.ticket.location}</p>
                                    <p className="text-sm font-medium text-white">{issuedTicket.ticket.facility.name}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 group/item">
                                <div className="p-2 rounded-lg bg-white/5 text-slate-400 group-hover/item:text-cyan-400 transition-colors">
                                    <Icon name="calendar_month" className="text-[16px]" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{dict.ticket.issue_date}</p>
                                    <p className="text-sm font-medium text-white">
                                        {new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex items-center justify-between">
                            <div className="font-mono text-[10px] text-slate-600 tracking-wider">
                                {dict.ticket.ref}: {issuedTicket.id.slice(-12).toUpperCase()}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-cyan-400 group-hover:bg-cyan-400/10 transition-all">
                                <SuccessSparkles size={14} />
                            </div>
                        </div>
                    </div>
                </GlassCard>
                </div>
            ))}
        </div>

        {/* 🛠️ Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10 animate-fade-in"
            style={{ animationDelay: "0.8s", animationFillMode: "both" }}
        >
            <Link href="/facilities" className="w-full sm:w-auto">
            <LiquidButton variant="secondary" size="lg" className="w-full sm:w-auto h-16 px-10">
                <Icon name="arrow_back" className="text-[20px] mr-3" />
                {dict.actions.continue}
            </LiquidButton>
            </Link>
            
            <LiquidButton 
                onClick={() => window.print()}
                variant="primary" 
                size="lg" 
                className="w-full sm:w-auto h-16 px-10 shadow-[0_0_30px_rgba(6,182,212,0.3)]"
            >
                <Icon name="download" className="text-[20px] mr-3 text-black" />
                {dict.actions.download}
            </LiquidButton>
        </div>

        <div className="text-center pt-8">
            <p className="text-xs text-slate-500 font-medium">
                {dict.footer.email_notice}
            </p>
            <p className="text-[10px] text-slate-600 mt-2 uppercase tracking-widest font-bold">
                {dict.footer.protocol}
            </p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
            header, footer, nav, button, .no-print {
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

function SuccessSparkles({ size, className }: { size: number, className?: string }) {
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
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
            <path d="M5 3v4"/>
            <path d="M19 17v4"/>
            <path d="M3 5h4"/>
            <path d="M17 19h4"/>
        </svg>
    );
}
