/** @consumer admin-ui -- kept for backward compat; new features should use api-keys.ts Server Action. */
import { NextResponse } from "next/server";
import { prisma } from "@/app/(server)/lib/prisma";
import { requireSuperAdmin } from "@/app/(server)/lib/auth-guards";
import { generateApiKey } from "@/app/(server)/lib/api-key-auth";
import { handleServerActionError } from "@/app/(server)/lib/server-action-error";

/**
 * 🔑 API Keys Management - List & Create
 */
export async function GET() {
  try {
    await requireSuperAdmin();
    const apiKeys = await prisma.apiKey.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        prefix: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
        userId: true,
      },
    });
    return NextResponse.json(apiKeys);
  } catch (error) {
    const result = handleServerActionError(error);
    return NextResponse.json(result, { status: result.error ? 400 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSuperAdmin();
    const { name, expiresAt } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { plainKey, prefix, hashedKey } = generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        prefix,
        key: hashedKey,
        userId: user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // Return the plain key ONLY once during creation
    return NextResponse.json(
      {
        ...apiKey,
        key: plainKey,
      },
      { status: 201 },
    );
  } catch (error) {
    const result = handleServerActionError(error);
    return NextResponse.json(result, { status: result.error ? 400 : 500 });
  }
}
