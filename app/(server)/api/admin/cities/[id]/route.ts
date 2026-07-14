/** @consumer external-agent -- called by external tools/agents via API key. Admin UI uses Server Actions instead. */
import { NextResponse } from "next/server";
import { prisma } from "@/app/(server)/lib/prisma";
import { authenticateRequest } from "@/app/(server)/lib/api-key-auth";
import { requireSuperAdmin } from "@/app/(server)/lib/auth-guards";
import { handleServerActionError } from "@/app/(server)/lib/server-action-error";
import { z } from "zod";

const citySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
});

/**
 * 🏙️ City API - Update & Delete
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await authenticateRequest(request).catch(() => requireSuperAdmin());
    const { id } = await params;

    const json = await request.json();
    const validated = citySchema.partial().parse(json);

    const city = await prisma.city.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json(city);
  } catch (error) {
    const result = handleServerActionError(error);
    return NextResponse.json(result, { status: result.error ? 400 : 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await authenticateRequest(request).catch(() => requireSuperAdmin());
    const { id } = await params;

    await prisma.city.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const result = handleServerActionError(error);
    return NextResponse.json(result, { status: result.error ? 400 : 500 });
  }
}
