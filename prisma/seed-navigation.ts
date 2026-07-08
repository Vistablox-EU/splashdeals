// ─── Seed navigation menus ──────────────────────────────────────
// Run: npx tsx prisma/seed-navigation.ts
// Replaces ALL existing navigation menus with clean sample data.

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config();

// eslint-disable-next-line @typescript-eslint/no-require-imports
globalThis.WebSocket = require("ws");

const connectionString = process.env.DATABASE_URL!;
if (!connectionString) throw new Error("DATABASE_URL is required");

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌊 Reseeding navigation menus...\n");

  // ─── Wipe existing menus (cascade deletes sections + items) ───
  const deleted = await prisma.navigationMenu.deleteMany({});
  console.log(`  ✗ Deleted ${deleted.count} existing menus\n`);

  // ─── LEFT-SIDE MENUS ───────────────────────────────────────────

  // 1. POČETNA — simple dot-links menu
  await prisma.navigationMenu.create({
    data: {
      id: "seed-menu-pocetna",
      label: "Početna",
      icon: "home",
      placement: "left",
      sortOrder: 0,
      sections: {
        create: [
          {
            id: "seed-section-pocetna",
            heading: null,
            column: 0,
            style: "DOT_LINKS",
            sortOrder: 0,
            items: {
              create: [
                { id: "seed-item-pocetna", label: "Naslovna strana", href: "/", sortOrder: 0 },
              ],
            },
          },
        ],
      },
    },
  });
  console.log("  ✓ POČETNA (left)");

  // 2. ISTRAŽI — category links + dynamic cities
  await prisma.navigationMenu.create({
    data: {
      id: "seed-menu-istrazi",
      label: "Istraži",
      icon: "explore",
      placement: "left",
      sortOrder: 1,
      sections: {
        create: [
          {
            id: "seed-section-istrazi-kategorije",
            heading: "Kategorije",
            column: 0,
            style: "LINKS",
            sortOrder: 0,
            items: {
              create: [
                { id: "seed-item-istrazi-0", label: "Akva Parkovi", href: "/akva-parkovi", icon: "pool", desc: "Vodeni parkovi i tobogani", sortOrder: 0 },
                { id: "seed-item-istrazi-1", label: "Bazeni", href: "/bazeni", icon: "waves", desc: "Gradski i otvoreni bazeni", sortOrder: 1 },
                { id: "seed-item-istrazi-2", label: "Banje", href: "/banje", icon: "spa", desc: "Termalni izvori i spa centri", sortOrder: 2 },
                { id: "seed-item-istrazi-3", label: "Svi objekti", href: "/svi-objekti", icon: "map", desc: "Pregled svih destinacija", sortOrder: 3 },
              ],
            },
          },
          {
            id: "seed-section-istrazi-gradovi",
            heading: "Po gradovima",
            column: 1,
            style: "DYNAMIC_CITIES",
            sortOrder: 0,
          },
        ],
      },
    },
  });
  console.log("  ✓ ISTRAŽI (left)");

  // 3. ZA BIZNIS — simple DOT_LINKS
  await prisma.navigationMenu.create({
    data: {
      id: "seed-menu-biznis",
      label: "Za Biznis",
      icon: "business",
      placement: "left",
      sortOrder: 2,
      sections: {
        create: [
          {
            id: "seed-section-biznis",
            heading: null,
            column: 0,
            style: "DOT_LINKS",
            sortOrder: 0,
            items: {
              create: [
                { id: "seed-item-biznis-0", label: "Postanite partner", href: "/za-biznis", sortOrder: 0 },
                { id: "seed-item-biznis-1", label: "Prodajne opcije", href: "/za-biznis/prodaja", sortOrder: 1 },
                { id: "seed-item-biznis-2", label: "Kontakt", href: "/podrska", sortOrder: 2 },
              ],
            },
          },
        ],
      },
    },
  });
  console.log("  ✓ ZA BIZNIS (left)");

  // 4. BLOG — DOT_LINKS
  await prisma.navigationMenu.create({
    data: {
      id: "seed-menu-blog",
      label: "Blog",
      icon: "article",
      placement: "left",
      sortOrder: 3,
      sections: {
        create: [
          {
            id: "seed-section-blog",
            heading: null,
            column: 0,
            style: "DOT_LINKS",
            sortOrder: 0,
            items: {
              create: [
                { id: "seed-item-blog-0", label: "Najnovije vesti", href: "/blog", sortOrder: 0 },
                { id: "seed-item-blog-1", label: "Vodiči", href: "/blog?tag=vodic", sortOrder: 1 },
                { id: "seed-item-blog-2", label: "Akcije i popusti", href: "/blog?tag=akcije", sortOrder: 2 },
              ],
            },
          },
        ],
      },
    },
  });
  console.log("  ✓ BLOG (left)");

  // ─── RIGHT-SIDE MENUS ──────────────────────────────────────────

  // KORISNICI — user account dropdown (right side of logo)
  await prisma.navigationMenu.create({
    data: {
      id: "seed-menu-korisnici",
      label: "Korisnici",
      icon: "person",
      placement: "right",
      sortOrder: 0,
      sections: {
        create: [
          {
            id: "seed-section-korisnici",
            heading: "Moj nalog",
            column: 0,
            style: "LINKS",
            sortOrder: 0,
            items: {
              create: [
                { id: "seed-item-korisnici-0", label: "Kontrolna tabla", href: "/dashboard", icon: "dashboard", desc: "Pregled aktivnosti", sortOrder: 0 },
                { id: "seed-item-korisnici-1", label: "Moje karte", href: "/dashboard/tickets", icon: "confirmation_number", desc: "Kupljene ulaznice", sortOrder: 1 },
                { id: "seed-item-korisnici-2", label: "Podešavanja", href: "/dashboard/settings", icon: "settings", desc: "Lični podaci", sortOrder: 2 },
                { id: "seed-item-korisnici-3", label: "Odjava", href: "/auth/logout", icon: "logout", desc: "Kraj sesije", sortOrder: 3 },
              ],
            },
          },
        ],
      },
    },
  });
  console.log("  ✓ KORISNICI (right)");

  console.log("\n✅ Navigation menus seeded successfully!");
  console.log("   Left:", ["POČETNA", "ISTRAŽI", "ZA BIZNIS", "BLOG"].join(", "));
  console.log("   Right:", ["KORISNICI"]);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
