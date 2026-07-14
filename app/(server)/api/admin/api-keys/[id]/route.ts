/** @consumer admin-ui -- kept for backward compat; new features should use api-keys.ts Server Action. */
import { NextResponse } from "next/server";
import { prisma } from "@/app/(server)/lib/prisma";
import { requireSuperAdmin } from "@/app/(server)/lib/auth-guards";
import { handleServerActionError } from "@/app/(server)/lib/server-action-error";

/**
 * 🔑 API Key Revocation
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    await prisma.apiKey.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const result = handleServerActionError(error);
    return NextResponse.json(result, { status: result.error ? 400 : 500 });
  }
}
