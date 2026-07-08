// ─── Seed navigation menus ──────────────────────────────────────
// Run: npx tsx prisma/seed-navigation.ts
// Creates sample left + right navigation menus so the MegaMenu
// renders actual content instead of "Meni nije dostupan".

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config();

globalThis.WebSocket = require("ws");

const connectionString = process.env.DATABASE_URL!;
if (!connectionString) throw new Error("DATABASE_URL is required");

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌊 Seeding navigation menus...\n");

  // ─── LEFT-SIDE MENUS ───────────────────────────────────────────

  const istrazi = await prisma.navigationMenu.upsert({
    where: { id: "seed-menu-istrazi" },
    update: {},
    create: {
      id: "seed-menu-istrazi",
      label: "Istraži",
      icon: "explore",
      placement: "left",
      sortOrder: 1,
    },
  });
  console.log("  ✓ ISTRAŽI menu");

  // Sections for ISTRAŽI
  const istraziSection1 = await prisma.navigationMenuSection.upsert({
    where: { id: "seed-section-istrazi-1" },
    update: {},
    create: {
      id: "seed-section-istrazi-1",
      menuId: istrazi.id,
      heading: "Kategorije",
      column: 0,
      style: "LINKS",
      sortOrder: 0,
    },
  });

  const istraziSection2 = await prisma.navigationMenuSection.upsert({
    where: { id: "seed-section-istrazi-2" },
    update: {},
    create: {
      id: "seed-section-istrazi-2",
      menuId: istrazi.id,
      heading: "Po gradovima",
      column: 1,
      style: "DYNAMIC_CITIES",
      sortOrder: 0,
    },
  });

  // Items for ISTRAŽI section 1
  const istraziItems = [
    { label: "Akva Parkovi", href: "/akva-parkovi", icon: "pool", desc: "Vodeni parkovi i tobogani" },
    { label: "Bazeni", href: "/bazeni", icon: "waves", desc: "Gradski i otvoreni bazeni" },
    { label: "Banje", href: "/banje", icon: "spa", desc: "Termalni izvori i spa centri" },
    { label: "Svi objekti", href: "/svi-objekti", icon: "map", desc: "Pregled svih destinacija" },
  ];

  for (let i = 0; i < istraziItems.length; i++) {
    const item = istraziItems[i];
    await prisma.navigationMenuItem.upsert({
      where: { id: `seed-item-istrazi-${i}` },
      update: {},
      create: {
        id: `seed-item-istrazi-${i}`,
        sectionId: istraziSection1.id,
        label: item.label,
        href: item.href,
        icon: item.icon,
        desc: item.desc,
        sortOrder: i,
      },
    });
  }
  console.log("  ✓   → kategorije + gradovi");

  const blogMenu = await prisma.navigationMenu.upsert({
    where: { id: "seed-menu-blog" },
    update: {},
    create: {
      id: "seed-menu-blog",
      label: "Blog",
      icon: "article",
      placement: "left",
      sortOrder: 4,
    },
  });
  console.log("  ✓ BLOG menu");

  const blogSection = await prisma.navigationMenuSection.upsert({
    where: { id: "seed-section-blog" },
    update: {},
    create: {
      id: "seed-section-blog",
      menuId: blogMenu.id,
      heading: null,
      column: 0,
      style: "DOT_LINKS",
      sortOrder: 0,
    },
  });

  const blogItems = [
    { label: "Najnovije vesti", href: "/blog" },
    { label: "Vodiči", href: "/blog?tag=vodic" },
    { label: "Akcije i popusti", href: "/blog?tag=akcije" },
  ];

  for (let i = 0; i < blogItems.length; i++) {
    await prisma.navigationMenuItem.upsert({
      where: { id: `seed-item-blog-${i}` },
      update: {},
      create: {
        id: `seed-item-blog-${i}`,
        sectionId: blogSection.id,
        label: blogItems[i].label,
        href: blogItems[i].href,
        sortOrder: i,
      },
    });
  }
  console.log("  ✓   → linkovi");

  // ─── RIGHT-SIDE MENUS ──────────────────────────────────────────

  const korisnici = await prisma.navigationMenu.upsert({
    where: { id: "seed-menu-korisnici" },
    update: {},
    create: {
      id: "seed-menu-korisnici",
      label: "Korisnici",
      icon: "person",
      placement: "right",
      sortOrder: 10,
    },
  });
  console.log("  ✓ KORISNICI (right side)");

  const korisniciSection = await prisma.navigationMenuSection.upsert({
    where: { id: "seed-section-korisnici" },
    update: {},
    create: {
      id: "seed-section-korisnici",
      menuId: korisnici.id,
      heading: "Moj nalog",
      column: 0,
      style: "LINKS",
      sortOrder: 0,
    },
  });

  const korisniciItems = [
    { label: "Kontrolna tabla", href: "/dashboard", icon: "dashboard", desc: "Pregled aktivnosti" },
    { label: "Moje karte", href: "/dashboard/tickets", icon: "confirmation_number", desc: "Kupljene ulaznice" },
    { label: "Podešavanja", href: "/dashboard/settings", icon: "settings", desc: "Lični podaci" },
    { label: "Odjava", href: "/auth/logout", icon: "logout", desc: "Kraj sesije" },
  ];

  for (let i = 0; i < korisniciItems.length; i++) {
    const item = korisniciItems[i];
    await prisma.navigationMenuItem.upsert({
      where: { id: `seed-item-korisnici-${i}` },
      update: {},
      create: {
        id: `seed-item-korisnici-${i}`,
        sectionId: korisniciSection.id,
        label: item.label,
        href: item.href,
        icon: item.icon,
        desc: item.desc,
        sortOrder: i,
      },
    });
  }
  console.log("  ✓   → linkovi naloga");

  // ─── HOME MENU (left side, first position) ─────────────────────

  const pocetna = await prisma.navigationMenu.upsert({
    where: { id: "seed-menu-pocetna" },
    update: {},
    create: {
      id: "seed-menu-pocetna",
      label: "Početna",
      icon: "home",
      placement: "left",
      sortOrder: 0,
    },
  });

  const pocetnaSection = await prisma.navigationMenuSection.upsert({
    where: { id: "seed-section-pocetna" },
    update: {},
    create: {
      id: "seed-section-pocetna",
      menuId: pocetna.id,
      heading: null,
      column: 0,
      style: "DOT_LINKS",
      sortOrder: 0,
    },
  });

  await prisma.navigationMenuItem.upsert({
    where: { id: "seed-item-pocetna" },
    update: {},
    create: {
      id: "seed-item-pocetna",
      sectionId: pocetnaSection.id,
      label: "Naslovna strana",
      href: "/",
      sortOrder: 0,
    },
  });
  console.log("  ✓ POČETNA menu");

  console.log("\n✅ Navigation menus seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
