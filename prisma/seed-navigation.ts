import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString = process.env.DATABASE_URL || "";
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding navigation menus...");

  // Clean existing data
  await prisma.$executeRawUnsafe(`DELETE FROM marketing.navigation_menu_items`);
  await prisma.$executeRawUnsafe(`DELETE FROM marketing.navigation_menu_sections`);
  await prisma.$executeRawUnsafe(`DELETE FROM marketing.navigation_menus`);

  // Helper to insert a menu
  async function insertMenu(
    label: string,
    icon: string,
    sortOrder: number
  ): Promise<string> {
    const id = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO marketing.navigation_menus (id, label, icon, "sortOrder", "isActive", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      id,
      label,
      icon,
      sortOrder,
      true
    );
    return id;
  }

  // Helper to insert a section
  async function insertSection(
    menuId: string,
    heading: string | null,
    col: number,
    style: string,
    sortOrder: number,
    config?: Record<string, unknown>
  ): Promise<string> {
    const id = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO marketing.navigation_menu_sections (id, "menuId", heading, "column", style, config, "sortOrder", "isActive", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, NOW(), NOW())`,
      id,
      menuId,
      heading,
      col,
      style,
      config ? JSON.stringify(config) : null,
      sortOrder,
      true
    );
    return id;
  }

  // Helper to insert an item
  async function insertItem(
    sectionId: string,
    label: string,
    href: string,
    sortOrder: number,
    extras?: { icon?: string; desc?: string; metadata?: Record<string, unknown> }
  ) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO marketing.navigation_menu_items (id, "sectionId", label, href, icon, "sortOrder", "isActive", "createdAt", "updatedAt", "desc", metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8::text, $9::jsonb)`,
      crypto.randomUUID(),
      sectionId,
      label,
      href,
      extras?.icon || null,
      sortOrder,
      true,
      extras?.desc || null,
      extras?.metadata ? JSON.stringify(extras.metadata) : null,
    )
  }

  // ─── Istraži ────────────────────────────────
  const exploreId = await insertMenu("Istraži", "explore", 0);

  const featId = await insertSection(exploreId, "Istaknuto", 0, "LINKS", 0);
  await insertItem(featId, "Premium ponuda", "/#deals", 0, {
    icon: "auto_awesome",
    desc: "Najbolje cene za akva parkove i bazene",
    metadata: { variant: "featured" },
  });

  const catId = await insertSection(exploreId, "Kategorije", 0, "LINKS", 1);
  await insertItem(catId, "Akva Parkovi", "/akva-parkovi", 0, { icon: "waves" });
  await insertItem(catId, "Termalne Rivijere", "/termalne-rivijere", 1, { icon: "hot_tub" });
  await insertItem(catId, "Bazeni", "/bazeni", 2, { icon: "waves" });
  await insertItem(catId, "Banje", "/banje", 3, { icon: "spa" });
  await insertItem(catId, "Wellness & Spa", "/wellness-i-spa", 4, { icon: "auto_awesome" });
  await insertItem(catId, "Jezera", "/jezera", 5, { icon: "water" });
  await insertItem(catId, "Plaže i Kupališta", "/plaze-i-kupalista", 6, { icon: "deck" });
  await insertItem(catId, "Vodeni Sportovi", "/vodeni-sportovi", 7, { icon: "sailing" });
  await insertItem(catId, "Sve Akcije", "/#deals", 8, { icon: "local_fire_department" });

  await insertSection(exploreId, "Gradovi", 1, "DYNAMIC_CITIES", 0, {
    popularSlugs: ["beograd", "novi-sad", "jagodina", "vrnjacka-banja", "subotica"],
    maxItems: 10,
  });

  const quickId = await insertSection(exploreId, "Brzi linkovi", 2, "LINKS", 0);
  await insertItem(quickId, "Korisnička Pomoć", "/support", 0, { icon: "help" });

  // ─── Za Biznis ──────────────────────────────
  const bizId = await insertMenu("Za Biznis", "business_center", 1);

  await insertSection(bizId, null, 0, "VISUAL", 0, { component: "scanner" });

  const partnerId = await insertSection(bizId, "Partner Hub", 1, "LINKS", 0);
  await insertItem(partnerId, "Pridruži se mreži bazena", "/facilities", 0, {
    icon: "login",
    desc: "Predstavite svoj bazen ili akva park stotinama hiljada korisnika.",
  });
  await insertItem(partnerId, "Partner Portal (Admin)", "/admin/facilities", 1, {
    icon: "verified_user",
    desc: "Upravljajte ponudama i isplatama direktno preko Stripe panela.",
  });

  const integId = await insertSection(bizId, "Integracije", 2, "LINKS", 0);
  await insertItem(integId, "Validacioni Ticketing API", "/support", 0, {
    icon: "qr_code",
    desc: "Integracija sa bar-kod i RFID rampama na kapijama.",
  });

  await insertSection(bizId, "Provizija samo 5% po prodatoj karti", 2, "FOOTER_BADGE", 1, {
    icon: "auto_awesome",
  });

  // ─── Korisnici ──────────────────────────────
  const usersId = await insertMenu("Korisnici", "smartphone", 2);

  await insertSection(usersId, null, 0, "VISUAL", 0, { component: "club_card" });

  const portalId = await insertSection(usersId, "Korisnički Portal", 1, "LINKS", 0);
  await insertItem(portalId, "Kako funkcioniše platforma?", "/how-it-works", 0, {
    icon: "explore",
    desc: "Vodič za brzu kupovinu karata i čuvanje u Apple & Google Wallet novčanik.",
  });
  await insertItem(portalId, "Centar za Pomoć & FAQ", "/support", 1, {
    icon: "help_outline",
    desc: "Brzi odgovori na pitanja o refundacijama, slanju ulaznica i radnom vremenu.",
  });

  const secId = await insertSection(usersId, "Sigurnost", 2, "LINKS", 0);
  await insertItem(secId, "Pravila i sigurnost kupovine", "/terms", 0, {
    icon: "verified_user",
    desc: "Bezbedno 3D Secure procesiranje platnih kartica i zaštita potrošača.",
  });

  await insertSection(usersId, "100% digitalne ulaznice na telefonu", 2, "FOOTER_BADGE", 1, {
    icon: "waves",
  });

  // ─── Blog ───────────────────────────────────
  const blogId = await insertMenu("Blog", "article", 3);

  const blogCatId = await insertSection(blogId, "Kategorije", 0, "LINKS", 0);
  await insertItem(blogCatId, "Sve objave", "/blog", 0, {
    icon: "rss_feed",
    desc: "Najnovije vesti i članci",
  });
  await insertItem(blogCatId, "Vodiči", "/blog?category=guides", 1, {
    icon: "book",
    desc: "Kako odabrati i uživati",
  });
  await insertItem(blogCatId, "Novosti", "/blog?category=news", 2, {
    icon: "newspaper",
    desc: "Dešavanja i najave",
  });
  await insertItem(blogCatId, "Recenzije", "/blog?category=reviews", 3, {
    icon: "star",
    desc: "Utisci sa bazena",
  });

  const blogPopId = await insertSection(blogId, "Popularne teme", 1, "DOT_LINKS", 0);
  await insertItem(blogPopId, "Akva Parkovi Srbije", "/blog/akva-parkovi-srbije", 0);
  await insertItem(blogPopId, "Wellness Vodič", "/blog/wellness-vodic", 1);
  await insertItem(blogPopId, "Porodični Izleti", "/blog/porodicni-izleti", 2);

  const blogAllId = await insertSection(blogId, null, 1, "LINKS", 1);
  await insertItem(blogAllId, "Sve objave", "/blog", 0, { icon: "arrow_forward" });

  const blogContId = await insertSection(blogId, "Sadržaj", 2, "LINKS", 0);
  await insertItem(blogContId, "Početna Blog", "/blog", 0, {
    icon: "rss_feed",
    desc: "Svi članci i vodiči",
  });
  await insertItem(blogContId, "RSS Feed", "/blog/feed.xml", 1, {
    icon: "rss_feed",
    desc: "Pratite putem RSS-a",
  });

  const menuCount = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    "SELECT COUNT(*)::int as count FROM marketing.navigation_menus"
  );
  const sectionCount = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    "SELECT COUNT(*)::int as count FROM marketing.navigation_menu_sections"
  );
  const itemCount = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    "SELECT COUNT(*)::int as count FROM marketing.navigation_menu_items"
  );

  console.log(`Done: ${Number(menuCount[0].count)} menus, ${Number(sectionCount[0].count)} sections, ${Number(itemCount[0].count)} items`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
