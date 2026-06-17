import { Icon } from "@/components/ui/Icon";
import type { Metadata } from "next";
import * as React from "react";

import { AdminSidebar } from "@/app/(dashboard)/admin/_common/sidebar/admin-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { BreadcrumbProvider } from "@/app/(dashboard)/admin/_common/breadcrumb-context"
import { AdminLayoutShell } from "./_components/AdminLayoutShell"
import { CommandPalette } from "@/app/(dashboard)/admin/_common/CommandPalette"
import { AdminSkeleton } from "@/app/(dashboard)/admin/_common/AdminSkeleton"
import { auth } from "@/server/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { connection } from "next/server"

export const metadata: Metadata = {
  title: "Splashdeals.rs Admin",
  description: "Vodeći digitalni portal za ulaznice za akva parkove i bazene u Srbiji.",
  openGraph: {
    title: "Splashdeals.rs Admin",
    description: "Vodeći digitalni portal za ulaznice za akva parkove i bazene u Srbiji.",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <BreadcrumbProvider>
      <React.Suspense fallback={<AdminSkeleton />}>
        <AuthenticatedLayout>
          {children}
        </AuthenticatedLayout>
      </React.Suspense>
    </BreadcrumbProvider>
  );
}

async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await auth.api.getSession({ 
    headers: await headers() 
  });

  if (!session) {
    redirect("/auth/login?callbackUrl=/admin");
  }

  const user = session.user as { role?: string; email?: string };
  const role = user.role;

  if (role !== "SUPER_ADMIN" && role !== "FACILITY_STAFF") {
    console.warn(`[Security] Unauthorized access attempt by ${session.user.email} (Role: ${role})`);
    redirect("/admin/forbidden");
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "19rem",
        } as React.CSSProperties
      }
    >
      <AdminSidebar variant="inset" user={session.user} />
      <SidebarInset className="overflow-hidden">
        <AdminLayoutShell user={session.user}>
          <React.Suspense fallback={
            <div className="flex flex-1 items-center justify-center min-h-[50vh]">
              <Icon name="progress_activity" className="size-10 animate-spin text-primary/30" />
            </div>
          }>
            {children}
          </React.Suspense>
        </AdminLayoutShell>
      </SidebarInset>
      <CommandPalette />
    </SidebarProvider>
  )
}