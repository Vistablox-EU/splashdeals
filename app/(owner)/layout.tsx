"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { getClientDictionary } from "@/lib/client-dictionaries";
import type { Dict } from "@/lib/types";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dict, setDict] = useState<Dict | null>(null);

  useEffect(() => {
    getClientDictionary().then(setDict);
  }, []);

  const t = dict?.owner as Record<string, string> | undefined;

  const navItems = [
    {
      title: t?.facilities ?? "Moji objekti",
      href: "/owner/facilities",
      icon: "store",
    },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/auth/login");
          },
        },
      });
    } catch {
      toast.error("Something went wrong");
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top navigation */}
      <header className="border-border bg-background sticky top-0 z-50 border-b">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/owner/facilities" className="flex items-center gap-2 font-bold">
              <span className="text-lg">🏪</span>
              <span className="hidden sm:inline">{t?.title ?? "Vlasnički panel"}</span>
            </Link>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    pathname.startsWith(item.href) && "bg-accent text-accent-foreground",
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
            <Icon name="logout" className="mr-1 size-4" />
            {isLoggingOut ? (t?.logging_out ?? "Odjavljivanje...") : (t?.logout ?? "Odjava")}
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
