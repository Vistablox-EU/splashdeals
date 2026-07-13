import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL || "";
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

const cities = [
  { name: "Beograd", slug: "belgrade" },
  { name: "Novi Sad", slug: "novi-sad" },
  { name: "Niš", slug: "nis" },
  { name: "Kragujevac", slug: "kragujevac" },
  { name: "Subotica", slug: "subotica" },
  { name: "Zlatibor", slug: "zlatibor" },
  { name: "Kopaonik", slug: "kopaonik" },
  { name: "Vojvodina", slug: "vojvodina" },
  { name: "Srem", slug: "srem" },
  { name: "Banat", slug: "banat" },
  { name: "Central Serbia", slug: "central-serbia" },
  { name: "Beograd Day Trip", slug: "belgrade-day-trip" },
  { name: "Airport Area", slug: "airport-area" },
  { name: "Šumadija", slug: "sumadija" },
  { name: "Bačka", slug: "backa" },
];

async function main() {
  console.log("🌊 Seeding Cities...");

  for (const city of cities) {
    await prisma.city.upsert({
      where: { slug: city.slug },
      update: {},
      create: city,
    });
  }

  console.log(`✅ Seeded ${cities.length} cities successfully.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
