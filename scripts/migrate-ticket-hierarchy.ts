/**
 * Migration script: Move existing Ticket data into the new
 * TicketCategory → TicketProduct → TicketPrice hierarchy.
 *
 * Run: npx tsx scripts/migrate-ticket-hierarchy.ts
 */
import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"

// Polyfill WebSocket for Neon
globalThis.WebSocket = require("ws")

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required")
  process.exit(1)
}
const adapter = new PrismaNeon({ connectionString: DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🚀 Starting ticket hierarchy migration...\n")

  // 1. Get all facilities that have tickets
  const facilities = await prisma.facility.findMany({
    where: { tickets: { some: {} } },
    select: { id: true, name: true },
  })
  console.log(`Found ${facilities.length} facilities with tickets\n`)

  let totalProducts = 0
  let totalPrices = 0
  let totalIssuedLinked = 0

  for (const facility of facilities) {
    console.log(`── ${facility.name} ──`)

    // 2. Create or find default category
    let category = await prisma.ticketCategory.findFirst({
      where: { facilityId: facility.id, slug: "ulaznice" },
    })
    if (!category) {
      category = await prisma.ticketCategory.create({
        data: {
          facilityId: facility.id,
          title: "Ulaznice",
          titleSr: "Ulaznice",
          slug: "ulaznice",
          displayOrder: 0,
        },
      })
      console.log(`  ✅ Created category: ${category.title}`)
    } else {
      console.log(`  📁 Using existing category: ${category.title}`)
    }

    // 3. Get all tickets for this facility
    const tickets = await prisma.ticket.findMany({
      where: { facilityId: facility.id },
      orderBy: { displayOrder: "asc" },
    })

    // Group by type + identity flags → one TicketProduct per group
    const groups = new Map<string, typeof tickets>()
    for (const ticket of tickets) {
      const key = [
        ticket.type,
        ticket.requiresIdentity ? "1" : "0",
        ticket.requiresPhoto ? "1" : "0",
        ticket.minPeople,
        ticket.maxPeople ?? "null",
        ticket.isSeasonPass ? "1" : "0",
        ticket.validityType,
      ].join("|")
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(ticket)
    }

    console.log(`  Found ${tickets.length} tickets → ${groups.size} product groups\n`)

    for (const [, groupTickets] of groups) {
      const first = groupTickets[0]

      const typeToLabel: Record<string, string> = {
        ADULT: "Odrasli",
        CHILD: "Deca",
        SENIOR: "Penzioneri",
        STUDENT: "Student",
        FAMILY_BUNDLE: "Porodični Paket",
        SUMMER_PASS: "Sezonska Karta",
      }
      const title = typeToLabel[first.type] ?? first.type
      const productTitle = first.isSeasonPass ? `${title} — Sezonska` : title

      const product = await prisma.ticketProduct.create({
        data: {
          categoryId: category!.id,
          title: productTitle,
          titleSr: productTitle,
          requiresIdentity: first.requiresIdentity,
          requiresPhoto: first.requiresPhoto,
          minPeople: first.minPeople,
          maxPeople: first.maxPeople,
          isSeasonPass: first.isSeasonPass,
          validityType: first.validityType,
          displayOrder: first.displayOrder,
        },
      })
      totalProducts++
      console.log(`    🏷️  Product: ${product.title} (${groupTickets.length} variations)`)

      for (const ticket of groupTickets) {
        const dayLabel: Record<string, string> = {
          ALL: "Svi dani",
          WEEKDAY: "Radni dan",
          WEEKEND: "Vikend",
          HOLIDAY: "Praznik",
        }
        const timeLabel: Record<string, string> = {
          FULL_DAY: "Ceo dan",
          AFTER_16H: "Posle 16h",
          THREE_HOUR: "3 sata",
        }

        const labelParts: string[] = []
        if (ticket.dayType && ticket.dayType !== "ALL") labelParts.push(dayLabel[ticket.dayType] ?? ticket.dayType)
        if (ticket.timeSlot && ticket.timeSlot !== "FULL_DAY") labelParts.push(timeLabel[ticket.timeSlot] ?? ticket.timeSlot)
        const labelStr = labelParts.length > 0 ? labelParts.join(" — ") : null

        const price = await prisma.ticketPrice.create({
          data: {
            ticketTypeId: product.id,
            label: labelStr,
            labelSr: labelStr,
            price: ticket.price,
            originalPrice: ticket.originalPrice,
            dayType: ticket.dayType ?? "ALL",
            timeSlot: ticket.timeSlot ?? "FULL_DAY",
            displayOrder: ticket.displayOrder,
            isActive: ticket.isActive,
            saleStart: ticket.saleStart,
            saleEnd: ticket.saleEnd,
          },
        })
        totalPrices++

        const linked = await prisma.issuedTicket.updateMany({
          where: { ticketId: ticket.id },
          data: { ticketPriceId: price.id },
        })
        totalIssuedLinked += linked.count

        if (linked.count > 0) {
          console.log(`      📎 ${price.price} RSD ${labelStr ?? ""} → ${linked.count} issued tickets`)
        } else {
          console.log(`      💰 ${price.price} RSD ${labelStr ?? ""}`)
        }
      }
    }
    console.log()
  }

  console.log("═══════════════════════════════════════")
  console.log(`✅ Migration complete!`)
  console.log(`   Products: ${totalProducts}`)
  console.log(`   Prices:   ${totalPrices}`)
  console.log(`   Issued:   ${totalIssuedLinked} linked`)
  console.log("═══════════════════════════════════════")
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
