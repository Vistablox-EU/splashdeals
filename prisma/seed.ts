import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import type { Amenity, FacilityStatus } from '@prisma/client'
import { PrismaNeon } from "@prisma/adapter-neon";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

const connectionString = process.env.DATABASE_URL || "";
const adapter = new PrismaNeon({ connectionString });

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting extensive Splashdeals database seed...')

  // 0. Clean the slate
  await prisma.issuedTicket.deleteMany({})
  await prisma.transaction.deleteMany({})
  await prisma.ticketCategory.deleteMany({})
  await prisma.facilityAmenity.deleteMany({})
  await prisma.facilityCity.deleteMany({})
  await prisma.operatingHours.deleteMany({})
  await prisma.facilityMedia.deleteMany({})
  await prisma.facility.deleteMany({})
  await prisma.amenity.deleteMany({})
  await prisma.city.deleteMany({})
  await prisma.user.deleteMany({})

  console.log('🧹 Database wiped cleanly.')
  
  // 0.1 Seed Admin User
  const adminEmail = process.env.ADMIN_SEED_EMAIL || "admin@splashdeals.rs";
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  
  if (!adminPassword) {
    console.warn("⚠️ Skipping admin seed: ADMIN_SEED_PASSWORD not set.");
  } else {
  console.log(`👤 Seeding admin user: ${adminEmail}`);
  
  const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    emailAndPassword: { enabled: true },
  });

  try {
    const result = await auth.api.signUpEmail({
      body: {
        email: adminEmail,
        password: adminPassword,
        name: "Super Admin",
      },
    });

    if (result?.user) {
      await prisma.user.update({
        where: { id: result.user.id },
        data: { role: "SUPER_ADMIN" },
      });
      console.log("✅ Admin user created and elevated to SUPER_ADMIN.");
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message?.includes("already exists")) {
       console.log("⚠️ Admin user already exists, skipping creation.");
    } else {
       console.error("❌ Failed to seed admin user:", err);
    }
  }
  }

  // 1. Seed Strategic Cities/Regions
  const citiesData = [
    { name: "Belgrade", slug: "belgrade" },
    { name: "Novi Sad", slug: "novi-sad" },
    { name: "Niš", slug: "nis" },
    { name: "Kragujevac", slug: "kragujevac" },
    { name: "Subotica", slug: "subotica" },
    { name: "Aranđelovac", slug: "arandjelovac" },
    { name: "Jagodina", slug: "jagodina" },
    { name: "Soko Banja", slug: "soko-banja" },
    { name: "Užice", slug: "uzice" },
    { name: "Bački Petrovac", slug: "backi-petrovac" },
    { name: "Petrovac na Mlavi", slug: "petrovac-na-mlavi" },
    { name: "Vrnjačka Banja", slug: "vrnjacka-banja" },
    { name: "Zlatibor", slug: "zlatibor" },
    { name: "Vojvodina", slug: "vojvodina" },
    { name: "Central Serbia", slug: "central-serbia" },
    { name: "Apatin", slug: "apatin" },
    { name: "Valjevo", slug: "valjevo" },
    { name: "Ruma", slug: "ruma" },
    { name: "Inđija", slug: "indjija" },
    { name: "Stara Pazova", slug: "stara-pazova" },
    { name: "Veliko Gradište", slug: "veliko-gradiste" },
    { name: "Kruševac", slug: "krusevac" },
    { name: "Čačak", slug: "cacak" },
    { name: "Leskovac", slug: "leskovac" },
    { name: "Šabac", slug: "sabac" },
    { name: "Kikinda", slug: "kikinda" },
    { name: "Mionica", slug: "mionica" },
    { name: "Airport Area", slug: "airport-area" },
    { name: "Bačka", slug: "backa" },
    { name: "Srem", slug: "srem" },
  ]

  for (const city of citiesData) {
    await prisma.city.create({ data: city })
  }
  console.log(`✅ Seeded ${citiesData.length} strategic regions.`)

  // 2. Seed Amenities Registry
  const amenitiesData = [
    { name: "Water Slides", icon: "Waves", category: "Attractions" },
    { name: "Wave Pool", icon: "Wind", category: "Attractions" },
    { name: "Kids' Pool", icon: "Baby", category: "Attractions" },
    { name: "Lazy River", icon: "Anchor", category: "Attractions" },
    { name: "Indoor Pool", icon: "Home", category: "Attractions" },
    { name: "Olympic Pool", icon: "Target", category: "Attractions" },
    { name: "Thermal Water", icon: "Flame", category: "Attractions" },
    { name: "Hydromassage", icon: "Sparkles", category: "Attractions" },
    { name: "Restaurant", icon: "Utensils", category: "Services" },
    { name: "Cafe Bar", icon: "Coffee", category: "Services" },
    { name: "Locker Rooms", icon: "Lock", category: "Services" },
    { name: "Changing Rooms", icon: "Shirt", category: "Services" },
    { name: "Parking", icon: "Car", category: "Services" },
    { name: "Free WiFi", icon: "Wifi", category: "Services" },
    { name: "First Aid", icon: "HeartPulse", category: "Services" },
    { name: "Wellness & Spa", icon: "Flower2", category: "Services" },
  ]

  const createdAmenities: Record<string, Amenity> = {}
  for (const am of amenitiesData) {
    const record = await prisma.amenity.create({ data: am })
    createdAmenities[am.name] = record
  }

  // 3. Seed Facilities & REAL TICKETS
  const facilities = [
    {
      name: "AquaPark Petroland",
      slug: "petroland",
      category: "Akva Park",
      city: "Bački Petrovac",
      streetName: "Novosadski put",
      streetNumber: "bb",
      postalCode: "21470",
      lat: 45.362, lng: 19.589,
      status: "ACTIVE",
      description: "Najveći akva park u Srbiji. Preko 10 tobogana, ogroman bazen sa talasima i specijalizovane dečije zone.",
      amenities: ["Water Slides", "Wave Pool", "Kids' Pool", "Restaurant", "Parking"],
      regions: ["backi-petrovac", "novi-sad", "vojvodina"],
      tickets: [
        { title: "Dnevna Karta - Odrasli (Radni dan)", type: "ADULT", price: 1190 },
        { title: "Dnevna Karta - Odrasli (Vikend)", type: "ADULT", price: 1490 },
        { title: "Dnevna Karta - Deca (Radni dan)", type: "CHILD", price: 490 },
        { title: "Dnevna Karta - Deca (Vikend)", type: "CHILD", price: 990 },
        { title: "Studenti / Penzioneri (Radni dan)", type: "ADULT", price: 690 },
        { title: "Studenti / Penzioneri (Vikend)", type: "ADULT", price: 1190 }
      ]
    },
    {
      name: "Aqua Park Izvor",
      slug: "aquapark-izvor",
      category: "Akva Park",
      city: "Aranđelovac",
      streetName: "Mišarska",
      streetNumber: "2",
      postalCode: "34300",
      lat: 44.306, lng: 20.558,
      status: "ACTIVE",
      description: "Vrhunski akva park i luksuzni wellness centar. Sadrži 12 tobogana i profesionalne termalne sadržaje.",
      amenities: ["Water Slides", "Thermal Water", "Wellness & Spa", "Kids' Pool", "Restaurant"],
      regions: ["arandjelovac", "central-serbia"],
      tickets: [
        { title: "SPA Day Pass - Odrasli (Radni dan)", type: "ADULT", price: 6000 },
        { title: "SPA Day Pass - Odrasli (Vikend)", type: "ADULT", price: 7000 },
        { title: "Dnevna karta za Aqua park (Sezonska)", type: "ADULT", price: 1500 }
      ]
    },
    {
      name: "Aqua Park Jagodina",
      slug: "aquapark-jagodina",
      category: "Akva Park",
      city: "Jagodina",
      streetName: "Stevana Prvovenčanog",
      streetNumber: "bb",
      postalCode: "35000",
      lat: 43.966, lng: 21.263,
      status: "ACTIVE",
      description: "Prvi akva park u Srbiji, sa 7 bazena i 9 tobogana uključujući čuveni 'Kamikaze'.",
      amenities: ["Water Slides", "Olympic Pool", "Kids' Pool", "Cafe Bar", "Parking"],
      regions: ["jagodina", "central-serbia"],
      tickets: [
        { title: "Dnevna Karta - Odrasli", type: "ADULT", price: 1200 },
        { title: "Dnevna Karta - Deca (do 12 god)", type: "CHILD", price: 700 }
      ]
    },
    {
      name: "Hollywoodland Belgrade",
      slug: "hollywoodland",
      category: "Akva Park",
      city: "Belgrade",
      streetName: "Jakovački kormandin",
      streetNumber: "10",
      postalCode: "11271",
      lat: 44.793, lng: 20.285,
      status: "ACTIVE",
      description: "Prvi zatvoreno-otvoreni akva park u Beogradu. Tematski tobogani, wellness zone i zabava tokom cele godine.",
      amenities: ["Indoor Pool", "Water Slides", "Wellness & Spa", "Kids' Pool", "Restaurant"],
      regions: ["belgrade", "airport-area"],
      tickets: [
        { title: "Dnevna Karta - Odrasli (Radni dan)", type: "ADULT", price: 1200 },
        { title: "Dnevna Karta - Odrasli (Vikend)", type: "ADULT", price: 1500 },
        { title: "Dnevna Karta - Deca (Radni dan)", type: "CHILD", price: 800 },
        { title: "Dnevna Karta - Deca (Vikend)", type: "CHILD", price: 1000 },
        { title: "Noćno Kupanje", type: "ADULT", price: 1500 }
      ]
    },
    {
      name: "Aqua Park Mlavske Terme",
      slug: "mlavske-terme",
      category: "Akva Park",
      city: "Petrovac na Mlavi",
      streetName: "Banja Ždrelo",
      streetNumber: "bb",
      postalCode: "12300",
      lat: 44.2965, lng: 21.5075,
      status: "ACTIVE",
      description: "Termalni raj sa celogodišnjim kupanjem u lekovitoj vodi temperature 30-40°C.",
      amenities: ["Thermal Water", "Indoor Pool", "Water Slides", "Wellness & Spa", "Parking"],
      regions: ["petrovac-na-mlavi", "central-serbia"],
      tickets: [
        { title: "Dnevna Karta - Odrasli", type: "ADULT", price: 1200 },
        { title: "Dnevna Karta - Deca (2-12 god)", type: "CHILD", price: 800 }
      ]
    },
    {
      name: "SRC Tašmajdan",
      slug: "tasmajdan",
      category: "Otvoreni Bazen",
      city: "Belgrade",
      streetName: "Beogradska",
      streetNumber: "71",
      postalCode: "11000",
      lat: 44.809, lng: 20.470,
      status: "ACTIVE",
      description: "Kultni beogradski plivački kompleks sa otvorenim olimpijskim i zatvorenim bazenima.",
      amenities: ["Olympic Pool", "Indoor Pool", "Locker Rooms", "Cafe Bar", "First Aid"],
      regions: ["belgrade"],
      tickets: [
        { title: "Dnevni termin - Odrasli", type: "ADULT", price: 600 },
        { title: "Dnevni termin - Deca", type: "CHILD", price: 300 }
      ]
    },
    {
      name: "SC Milan Gale Muškatirović",
      slug: "milan-gale-muskatirovic",
      category: "Otvoreni Bazen",
      city: "Belgrade",
      streetName: "Tadeuša Košćuška",
      streetNumber: "63",
      postalCode: "11000",
      lat: 44.8306, lng: 20.4501,
      status: "ACTIVE",
      description: "Legendarni sportski centar na ušću Save u Dunav.",
      amenities: ["Olympic Pool", "Indoor Pool", "Locker Rooms", "Parking", "Cafe Bar"],
      regions: ["belgrade"],
      tickets: [
        { title: "Dnevna Karta - Odrasli", type: "ADULT", price: 600 },
        { title: "Dnevna Karta - Deca", type: "CHILD", price: 300 }
      ]
    },
    {
      name: "SC 11. April",
      slug: "11-april",
      category: "Otvoreni Bazen",
      city: "Belgrade",
      streetName: "Autoput",
      streetNumber: "2",
      postalCode: "11070",
      lat: 44.821, lng: 20.395,
      status: "ACTIVE",
      description: "Centar letnje rekreacije na Novom Beogradu sa tri velika otvorena bazena.",
      amenities: ["Olympic Pool", "Indoor Pool", "Kids' Pool", "Parking", "Locker Rooms"],
      regions: ["belgrade"],
      tickets: [
        { title: "Dnevni termin - Odrasli", type: "ADULT", price: 600 },
        { title: "Porodični Paket", type: "FAMILY_BUNDLE", price: 1200 }
      ]
    },
    {
      name: "Aqua Park Podina",
      slug: "aquapark-podina",
      category: "Akva Park",
      city: "Soko Banja",
      streetName: "IX Brigade",
      streetNumber: "bb",
      postalCode: "18230",
      lat: 43.6425, lng: 21.8680,
      status: "ACTIVE",
      description: "Moderan akva park u Soko Banji, idealan za porodice koje traže planinski vazduh i zabavu na vodi.",
      amenities: ["Water Slides", "Kids' Pool", "Parking", "Cafe Bar", "Changing Rooms"],
      regions: ["soko-banja", "central-serbia"],
      tickets: [
        { title: "Dnevna Karta - Odrasli", type: "ADULT", price: 600 },
        { title: "Dnevna Karta - Deca (do 12 god)", type: "CHILD", price: 400 }
      ]
    },
    {
      name: "SC Čair Niš",
      slug: "cair-nis",
      category: "Otvoreni Bazen",
      city: "Niš",
      streetName: "IX Brigade",
      streetNumber: "10",
      postalCode: "18000",
      lat: 43.3150, lng: 21.9056,
      status: "ACTIVE",
      description: "Vodeći plivački centar u Nišu sa bogatim zatvorenim i otvorenim sadržajima.",
      amenities: ["Olympic Pool", "Indoor Pool", "Locker Rooms", "Parking", "Restaurant"],
      regions: ["nis", "central-serbia"],
      tickets: [
        { title: "Dnevna Karta - Odrasli", type: "ADULT", price: 500 },
        { title: "Dnevna Karta - Deca", type: "CHILD", price: 300 }
      ]
    },
    {
      name: "Banja Junaković",
      slug: "banja-junakovic",
      category: "Akva Park",
      city: "Apatin",
      streetName: "Banjski put",
      streetNumber: "71",
      postalCode: "25263",
      lat: 45.6773, lng: 19.0314,
      status: "ACTIVE",
      description: "Čuveno termalno lečilište sa više bazena i tobogana u srcu Bačke.",
      amenities: ["Thermal Water", "Water Slides", "Kids' Pool", "Restaurant", "Wellness & Spa"],
      regions: ["apatin", "backa", "vojvodina"],
      tickets: [
        { title: "Dnevna Karta - Odrasli", type: "ADULT", price: 700 },
        { title: "Dnevna Karta - Deca", type: "CHILD", price: 400 }
      ]
    },
    {
      name: "SRC Petnica",
      slug: "petnica",
      category: "Otvoreni Bazen",
      city: "Valjevo",
      streetName: "Petnica",
      streetNumber: "bb",
      postalCode: "14000",
      lat: 44.2483, lng: 19.9283,
      status: "ACTIVE",
      description: "Legendarni rekreativni centar kod Petničke pećine, poznat po kristalno čistoj izvorskoj vodi.",
      amenities: ["Olympic Pool", "Kids' Pool", "Restaurant", "Parking"],
      regions: ["valjevo", "central-serbia"],
      tickets: [
        { title: "Dnevna Karta - Odrasli", type: "ADULT", price: 300 },
        { title: "Dnevna Karta - Deca (Vikend)", type: "CHILD", price: 200 }
      ]
    },
    {
      name: "Bazen Borkovac",
      slug: "borkovac",
      category: "Otvoreni Bazen",
      city: "Ruma",
      streetName: "Orlovićeva",
      streetNumber: "bb",
      postalCode: "22400",
      lat: 45.0256, lng: 19.8244,
      status: "ACTIVE",
      description: "Mirni otvoreni bazen okružen borovom šumom Borkovac.",
      amenities: ["Kids' Pool", "Cafe Bar", "Parking", "Locker Rooms"],
      regions: ["ruma", "srem", "vojvodina"],
      tickets: [
        { title: "Dnevna Karta - Odrasli (Radni dan)", type: "ADULT", price: 400 },
        { title: "Dnevna Karta - Odrasli (Vikend)", type: "ADULT", price: 500 },
        { title: "Dnevna Karta - Deca (7-15 god)", type: "CHILD", price: 250 }
      ]
    },
    {
      name: "Srebrno Jezero Aquapark",
      slug: "srebrno-jezero",
      category: "Akva Park",
      city: "Veliko Gradište",
      streetName: "Srebrno Jezero",
      streetNumber: "bb",
      postalCode: "12220",
      lat: 44.7578, lng: 21.4936,
      status: "ACTIVE",
      description: "Popularna letnja destinacija na obali Srebrnog jezera.",
      amenities: ["Water Slides", "Wave Pool", "Restaurant", "Parking", "Cafe Bar"],
      regions: ["veliko-gradiste", "central-serbia"],
      tickets: [
        { title: "Dnevna Karta - Odrasli (Radni dan)", type: "ADULT", price: 1000 },
        { title: "Dnevna Karta - Odrasli (Vikend)", type: "ADULT", price: 1200 },
        { title: "Dnevna Karta - Deca (Radni dan)", type: "CHILD", price: 700 },
        { title: "Dnevna Karta - Deca (Vikend)", type: "CHILD", price: 800 }
      ]
    },
    {
      name: "Banja Vrujci Aquapark",
      slug: "banja-vrujci",
      category: "Akva Park",
      city: "Mionica",
      streetName: "Banja Vrujci",
      streetNumber: "bb",
      postalCode: "14242",
      lat: 44.2250, lng: 20.2056,
      status: "ACTIVE",
      description: "Najnoviji akva park koji koristi lekovite termalno-mineralne vode.",
      amenities: ["Thermal Water", "Water Slides", "Kids' Pool", "Restaurant", "Parking"],
      regions: ["mionica", "central-serbia"],
      tickets: [
        { title: "Bazen - Odrasli (Radni dan)", type: "ADULT", price: 800 },
        { title: "Bazen - Odrasli (Vikend)", type: "ADULT", price: 950 },
        { title: "Bazen - Deca (5-10 god)", type: "CHILD", price: 600 },
        { title: "Doplata za Akva-park", type: "ADULT", price: 500 }
      ]
    },
    {
      name: "SC Jezero Kikinda",
      slug: "jezero-kikinda",
      category: "Otvoreni Bazen",
      city: "Kikinda",
      streetName: "Branka Vujina",
      streetNumber: "bb",
      postalCode: "23300",
      lat: 45.8247, lng: 20.4561,
      status: "ACTIVE",
      description: "Veliki severni sportski centar sa olimpijskim i rekreativnim bazenima.",
      amenities: ["Olympic Pool", "Indoor Pool", "Kids' Pool", "Parking", "Locker Rooms"],
      regions: ["kikinda", "vojvodina"],
      tickets: [
        { title: "Dnevna Karta - Odrasli", type: "ADULT", price: 300 },
        { title: "Dnevna Karta - Deca", type: "CHILD", price: 200 }
      ]
    },
    {
      name: "Gradski bazen Inđija",
      slug: "indjija-pool",
      category: "Otvoreni Bazen",
      city: "Inđija",
      streetName: "Novosadski put",
      streetNumber: "bb",
      postalCode: "22320",
      lat: 45.0531, lng: 20.0764,
      status: "ACTIVE",
      description: "Omiljeno letnje mesto u Sremu sa prelepim zelenim površinama.",
      amenities: ["Kids' Pool", "Parking", "Cafe Bar", "Locker Rooms"],
      regions: ["indjija", "srem", "vojvodina"],
      tickets: [
        { title: "Dnevna Karta - Odrasli", type: "ADULT", price: 350 },
        { title: "Dnevna Karta - Deca", type: "CHILD", price: 150 }
      ]
    },
    {
      name: "Gradski bazen Stara Pazova",
      slug: "stara-pazova-pool",
      category: "Otvoreni Bazen",
      city: "Stara Pazova",
      streetName: "Staropazovački put",
      streetNumber: "bb",
      postalCode: "22300",
      lat: 44.9758, lng: 20.1742,
      status: "ACTIVE",
      description: "Moderan kompleks bazena za letnju rekreaciju.",
      amenities: ["Kids' Pool", "Water Slides", "Cafe Bar", "Parking", "Locker Rooms"],
      regions: ["stara-pazova", "srem", "vojvodina"],
      tickets: [
        { title: "Dnevna Karta - Odrasli", type: "ADULT", price: 400 },
        { title: "Dnevna Karta - Deca", type: "CHILD", price: 200 }
      ]
    },
    {
      name: "Aqua Park Sunny Hill",
      slug: "sunny-hill",
      category: "Akva Park",
      city: "Vrnjačka Banja",
      streetName: "Mare Jakovljević",
      streetNumber: "9A",
      postalCode: "36210",
      lat: 43.6149, lng: 20.9016,
      status: "ACTIVE",
      description: "Luksuzni akva rizort sa panoramskim pogledom na Vrnjačku Banju.",
      amenities: ["Water Slides", "Wellness & Spa", "Restaurant", "Parking", "Hydromassage"],
      regions: ["vrnjacka-banja", "central-serbia"],
      tickets: [
        { title: "Dnevni pass - Odrasli", type: "ADULT", price: 1200 },
        { title: "Dnevni pass - Deca", type: "CHILD", price: 800 }
      ]
    },
    {
      name: "Gradski bazen Kruševac",
      slug: "krusevac-pool",
      category: "Otvoreni Bazen",
      city: "Kruševac",
      streetName: "Nikole Tesle",
      streetNumber: "bb",
      postalCode: "37000",
      lat: 43.5858, lng: 21.3167,
      status: "ACTIVE",
      description: "Centralni plivački centar sa olimpijskim i dečijim bazenima.",
      amenities: ["Olympic Pool", "Kids' Pool", "Parking", "Cafe Bar", "Locker Rooms"],
      regions: ["krusevac", "central-serbia"],
      tickets: [
        { title: "Dnevna Karta - Odrasli", type: "ADULT", price: 350 },
        { title: "Dnevna Karta - Deca", type: "CHILD", price: 200 }
      ]
    },
    {
      name: "Gradski bazen Čačak",
      slug: "cacak-pool",
      category: "Otvoreni Bazen",
      city: "Čačak",
      streetName: "Bulevar Vuka Karadžića",
      streetNumber: "bb",
      postalCode: "32000",
      lat: 43.8914, lng: 20.3411,
      status: "ACTIVE",
      description: "Popularno letnje rekreativno mesto pored Zapadne Morave.",
      amenities: ["Kids' Pool", "Parking", "Cafe Bar", "Locker Rooms", "Restaurant"],
      regions: ["cacak", "central-serbia"],
      tickets: [
        { title: "Dnevna Karta - Odrasli", type: "ADULT", price: 350 },
        { title: "Dnevna Karta - Deca", type: "CHILD", price: 200 }
      ]
    },
    {
      name: "SRC Dubočica Leskovac",
      slug: "dubocica",
      category: "Otvoreni Bazen",
      city: "Leskovac",
      streetName: "Kralja Petra I",
      streetNumber: "bb",
      postalCode: "16000",
      lat: 42.9986, lng: 21.9422,
      status: "ACTIVE",
      description: "Ključni plivački trenažni centar u južnoj Srbiji.",
      amenities: ["Olympic Pool", "Indoor Pool", "Locker Rooms", "Parking", "Cafe Bar"],
      regions: ["leskovac", "central-serbia"],
      tickets: [
        { title: "Dnevni termin - Odrasli", type: "ADULT", price: 120 },
        { title: "Dnevni termin - Deca", type: "CHILD", price: 100 }
      ]
    },
    {
      name: "Gradski bazen Šabac",
      slug: "sabac-pool",
      category: "Otvoreni Bazen",
      city: "Šabac",
      streetName: "Hajduk Veljkova",
      streetNumber: "bb",
      postalCode: "15000",
      lat: 44.7558, lng: 19.6917,
      status: "ACTIVE",
      description: "Moderan zatvoreni bazenski kompleks za profesionalni sport i javnu zabavu.",
      amenities: ["Indoor Pool", "Wellness & Spa", "Locker Rooms", "Parking", "Cafe Bar"],
      regions: ["sabac", "central-serbia"],
      tickets: [
        { title: "Dnevni termin - Odrasli", type: "ADULT", price: 350 },
        { title: "Noćno Kupanje", type: "ADULT", price: 550 }
      ]
    },
    {
      name: "SC Olimp",
      slug: "olimp",
      category: "Otvoreni Bazen",
      city: "Belgrade",
      streetName: "Vjekoslava Kovača",
      streetNumber: "11",
      postalCode: "11000",
      lat: 44.794, lng: 20.511,
      status: "ACTIVE",
      description: "Mirna sportska oaza na obroncima Zvezdarske šume.",
      amenities: ["Olympic Pool", "Kids' Pool", "Parking", "Cafe Bar", "Locker Rooms"],
      regions: ["belgrade"],
      tickets: [
        { title: "Dnevni termin - Odrasli", type: "ADULT", price: 600 },
        { title: "Dnevni termin - Deca", type: "CHILD", price: 300 }
      ]
    },
    {
      name: "SC Banjica",
      slug: "banjica",
      category: "Otvoreni Bazen",
      city: "Belgrade",
      streetName: "Crnotravska",
      streetNumber: "4",
      postalCode: "11000",
      lat: 44.764, lng: 20.472,
      status: "ACTIVE",
      description: "Tradicionalni dom beogradskog vaterpola i atletskog plivanja.",
      amenities: ["Olympic Pool", "Indoor Pool", "Locker Rooms", "Parking", "Cafe Bar"],
      regions: ["belgrade"],
      tickets: [
        { title: "Dnevni termin - Odrasli", type: "ADULT", price: 600 },
        { title: "Dnevni termin - Deca", type: "CHILD", price: 300 }
      ]
    },
    {
      name: "Ada Ciganlija",
      slug: "ada-ciganlija",
      category: "Kupalište",
      city: "Belgrade",
      streetName: "Ada Ciganlija",
      streetNumber: "2",
      postalCode: "11000",
      lat: 44.787, lng: 20.415,
      status: "ACTIVE",
      description: "Beogradsko 'more'. Ogromna rekreativna zona sa šljunkovitim plažama, sportskim terenima i brojnim kafićima.",
      amenities: ["Parking", "Cafe Bar", "Restaurant", "First Aid", "Free WiFi"],
      regions: ["belgrade"],
      tickets: [
        { title: "Zakup Ležaljke (Radni dan)", type: "ADULT", price: 500 },
        { title: "Zakup Ležaljke (Vikend)", type: "ADULT", price: 800 },
        { title: "Dnevni Parking (JKP)", type: "ADULT", price: 200 }
      ]
    },
  ]

  for (const f of facilities) {
    const facility = await prisma.facility.create({
      data: {
        name: f.name,
        slug: f.slug,
        category: f.category,
        city: f.city,
        streetName: f.streetName,
        streetNumber: f.streetNumber,
        postalCode: f.postalCode,
        lat: f.lat,
        lng: f.lng,
        status: f.status as FacilityStatus,
        description: f.description,
      }
    })

    // Add Amenities
    for (const amName of f.amenities) {
      const amenity = createdAmenities[amName]
      if (amenity) {
        await prisma.facilityAmenity.create({
          data: {
            facilityId: facility.id,
            amenityId: amenity.id,
            value: "Standard"
          }
        })
      }
    }

    // Add Regions
    for (const regSlug of f.regions) {
      const city = await prisma.city.findUnique({ where: { slug: regSlug } })
      if (city) {
        await prisma.facilityCity.create({
          data: {
            facilityId: facility.id,
            cityId: city.id,
            isPrimary: regSlug === f.slug // Approximation
          }
        })
      }
    }

    // Add Operating Hours (Default 9-20)
    for (let day = 0; day < 7; day++) {
      await prisma.operatingHours.create({
        data: {
          facilityId: facility.id,
          dayOfWeek: day,
          openTime: "09:00",
          closeTime: "20:00",
          isClosed: false
        }
      })
    }

    // Ticket seeding — DEPRECATED (model removed)
    // TODO: Update seed to use TicketCategory → TicketProduct → TicketPrice hierarchy
    /*
      data: f.tickets.map((t, idx) => ({
        facilityId: facility.id,
        title: t.title,
        type: t.type as TicketType,
        price: t.price,
        originalPrice: t.price + 200, // Show a "was" price for marketing density
        currency: "RSD",
        validityType: "FIXED_DATE" as ValidityType,
        isActive: true,
        isFeatured: idx === 0, // Feature the first ticket of each facility
        displayOrder: idx,
        description: `Kompletan pristup za ${facility.name} uključujući sve aktivne sadržaje. Važi za jednu osobu.`,
        requiresIdentity: false,
        requiresPhoto: false,
      }))
    })
    */

    console.log(`✅ Seeded ${facility.name} with ${f.tickets.length} Real Tickets.`)
  }

  console.log('🏁 Seeding finished successfully! Database is now a real-world Serbian Aqua Registry with full pricing logic.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
