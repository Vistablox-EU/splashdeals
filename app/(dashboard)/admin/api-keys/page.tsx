import { Metadata } from "next"
import { prisma } from "@/server/lib/prisma"
import { requireSuperAdmin } from "@/server/lib/auth-guards"
import { ApiKeysClient } from "./api-keys-client"

export const metadata: Metadata = {
  title: "API ključevi | Splashdeals Admin",
  description: "Manage agent API keys for Splashdeals integrations.",
}

export default async function ApiKeysPage() {
  await requireSuperAdmin({ redirect: true })

  const keys = await prisma.apiKey.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      createdAt: true,
      lastUsedAt: true,
      expiresAt: true,
    },
  })

  const serializedKeys = keys.map((key) => ({
    ...key,
    createdAt: key.createdAt.toISOString(),
    lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
    expiresAt: key.expiresAt?.toISOString() ?? null,
  }))

  return <ApiKeysClient initialKeys={serializedKeys} />
}
