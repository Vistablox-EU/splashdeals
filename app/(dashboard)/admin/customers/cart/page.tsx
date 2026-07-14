import { connection } from "next/server";
import type { Metadata } from "next";
import { AdminPageShell } from "@/app/(dashboard)/admin/_common/AdminPageShell";
import { requireSuperAdmin } from "@/app/(server)/lib/auth-guards";
import { prisma } from "@/app/(server)/lib/prisma";
import { CartViewer } from "./_components/CartViewer";

export const metadata: Metadata = {
  title: "Pregled korpi | Splashdeals Admin",
};

export default async function AdminCartViewPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; email?: string }>;
}) {
  await connection();
  await requireSuperAdmin({ redirect: true });
  const { userId, email } = await searchParams;

  let cartData = null;
  let userData = null;

  if (userId || email) {
    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : { email: email! },
      select: { id: true, name: true, email: true, image: true },
    });

    if (user) {
      userData = user;
      const cart = await prisma.cartSession.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
      });
      if (cart) {
        cartData = JSON.parse(JSON.stringify(cart));
      }
    }
  }

  return (
    <AdminPageShell
      title="Pregled korpi"
      subtitle="View active user carts and abandoned carts for support."
      stats={[]}
    >
      <CartViewer initialUser={userData} initialCart={cartData} />
    </AdminPageShell>
  );
}
