/**
 * Migration script: Normalize city names from "Belgrade" to "Beograd" in existing DB data.
 *
 * This handles existing rows that were seeded before the locale fix.
 * Run after deploying the seed data update.
 *
 * Run: npx tsx scripts/normalize-city-names.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Updating city names from 'Belgrade' to 'Beograd'...");

  const facilityUpdate = await prisma.facility.updateMany({
    where: { city: "Belgrade" },
    data: { city: "Beograd" },
  });
  console.log(`Updated ${facilityUpdate.count} facilities.`);

  const cityUpdate = await prisma.city.updateMany({
    where: { name: "Belgrade" },
    data: { name: "Beograd", slug: "beograd" },
  });
  console.log(`Updated ${cityUpdate.count} cities.`);

  const populatedPlaceUpdate = await prisma.populatedPlace.updateMany({
    where: { name: "Belgrade" },
    data: { name: "Beograd" },
  });
  console.log(`Updated ${populatedPlaceUpdate.count} populated places by name.`);

  const populatedPlaceRegionUpdate = await prisma.populatedPlace.updateMany({
    where: { municipality: "Belgrade" },
    data: { municipality: "Beograd" },
  });
  console.log(`Updated ${populatedPlaceRegionUpdate.count} populated places by municipality.`);

  console.log("City name normalization complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
