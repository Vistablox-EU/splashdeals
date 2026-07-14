import { NextResponse } from "next/server";
import { prisma } from "@/app/(server)/lib/prisma";
import { auth } from "@/app/(server)/lib/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, image: true },
  });

  if (!user) {
    return NextResponse.json({ user: null, cart: null });
  }

  const cart = await prisma.cartSession.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    user: JSON.parse(JSON.stringify(user)),
    cart: cart ? JSON.parse(JSON.stringify(cart)) : null,
  });
}
