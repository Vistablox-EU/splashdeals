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
 * 🏙️ Cities API - List & Create
 */
export async function GET(request: Request) {
  try {
    // Cities are public info, but management list might need auth
    await authenticateRequest(request).catch(() => requireSuperAdmin());

    const cities = await prisma.city.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { facilities: true },
        },
      },
    });

    return NextResponse.json(cities);
  } catch (error) {
    const result = handleServerActionError(error);
    return NextResponse.json(result, { status: result.error ? 400 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    await authenticateRequest(request).catch(() => requireSuperAdmin());

    const json = await request.json();
    const validated = citySchema.parse(json);

    const city = await prisma.city.create({
      data: validated,
    });

    return NextResponse.json(city, { status: 201 });
  } catch (error) {
    const result = handleServerActionError(error);
    return NextResponse.json(result, { status: result.error ? 400 : 500 });
  }
}
