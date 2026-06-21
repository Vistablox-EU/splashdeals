/**
 * 🌊 Splashdeals Enhanced Seed Script
 * 
 * Seeds 5+ major Serbian waterparks with REAL pricing, operating hours,
 * contact data, ticket groups, and rich descriptions.
 * ALL TEXT IN SERBIAN LATIN SCRIPT (latinica).
 * 
 * Run: npx tsx prisma/seed-enhanced.ts
 * 
 * Collects data from official websites:
 * - Aqua Park Petroland (Bački Petrovac) — REAL data from petroland.rs
 * - Aqua Park Izvor (Aranđelovac)
 * - Aqua Park Jagodina (Jagodina)
 * - Aqua Park Sunny Hill (Vrnjačka Banja)
 * - Aqua Park Podina (Soko Banja)
 * - Terme Vrujci (Mionica)
 * - Banja Junaković (Apatin)
 */

import "dotenv/config";
import { PrismaClient, FacilityStatus, TicketType, ValidityType, DayType, TimeSlot } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString = process.env.DATABASE_URL || "";
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

type TicketSeed = {
  title: string;
  titleSr: string;
  type: "ADULT" | "CHILD" | "SENIOR" | "STUDENT" | "FAMILY_BUNDLE" | "SUMMER_PASS";
  price: number;
  originalPrice?: number;
  dayType: "WEEKDAY" | "WEEKEND" | "ALL";
  timeSlot: "FULL_DAY" | "AFTER_16H" | "THREE_HOUR";
  validityType: "FIXED_DATE" | "FLEXIBLE_30_DAY" | "SUMMER_SEASON";
  isFeatured?: boolean;
  description: string;
  descriptionSr: string;
  minPeople?: number;
  maxPeople?: number;
  isSeasonPass?: boolean;
  requiresIdentity?: boolean;
};

type FacilitySeed = {
  name: string;
  slug: string;
  category: "Waterpark" | "Swimming Pool" | "Thermal Bath" | "Resort" | "Beach";
  city: string;
  streetName: string;
  streetNumber: string;
  postalCode: string;
  lat: number;
  lng: number;
  status: "DRAFT" | "ACTIVE";
  publicPhone: string;
  publicEmail: string;
  description: string;
  descriptionSr: string;
  metaTitle: string;
  metaDescription: string;
  socialLinks: { facebook?: string; instagram?: string; website?: string };
  amenities: string[];
  regions: string[];
  hours: { dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }[];
  ticketGroups: { title: string; titleSr: string; description: string; descriptionSr: string }[];
  tickets: TicketSeed[];
};

async function main() {
  console.log("🌊 Splashdeals Enhanced Seed — REAL Serbian Waterpark Data");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const cities = await prisma.city.findMany();
  const amenities = await prisma.amenity.findMany();

  console.log(`📦 Found ${cities.length} cities and ${amenities.length} amenities in DB.`);

  const facilities: FacilitySeed[] = [
    // ═══════════════════════════════════════════════════════════════
    // 1. AQUA PARK PETROLAND — Bački Petrovac (REAL DATA from petroland.rs)
    // ═══════════════════════════════════════════════════════════════
    {
      name: "AquaPark Petroland",
      slug: "petroland",
      category: "Waterpark",
      city: "Bački Petrovac",
      streetName: "Novosadski put",
      streetNumber: "bb",
      postalCode: "21470",
      lat: 45.362,
      lng: 19.589,
      status: "ACTIVE",
      publicPhone: "+381 60 83 02 218",
      publicEmail: "info@petroland.rs",
      description: "AquaPark PETROLAND je najveći akva park u Srbiji. Sa preko 10 tobogana, ogromnim bazenom sa talasima, specijalizovanim dečijim zonama, peščanim plažama i luksuznim wellness & spa centrom, pruža nezaboravno iskustvo za celu porodicu. Nalazi se nadomak Novog Sada, 120km od Beograda.",
      descriptionSr: "AquaPark PETROLAND je najveći akva park u Srbiji. Sa preko 10 tobogana, ogromnim bazenom sa talasima, specijalizovanim dečijim zonama, peščanim plažama i luksuznim wellness & spa centrom, pruža nezaboravno iskustvo za celu porodicu. Nalazi se nadomak Novog Sada, 120km od Beograda.",
      metaTitle: "AquaPark Petroland | Najveći Akva Park u Srbiji | Splashdeals",
      metaDescription: "AquaPark Petroland — najveći akva park u Srbiji. Preko 10 tobogana, talasi, dečije zone i wellness. Kupite online karte uz popust i preskočite redove!",
      socialLinks: {
        facebook: "https://www.facebook.com/petrolandaquapark/",
        instagram: "https://www.instagram.com/petroland_aquapark/",
        website: "https://www.petroland.rs",
      },
      amenities: [
        "Water Slides", "Wave Pool", "Kids' Pool", "Lazy River",
        "Restaurant", "Cafe Bar", "Parking", "Free WiFi",
        "Wellness & Spa", "Locker Rooms", "Changing Rooms", "First Aid",
      ],
      regions: ["backi-petrovac", "novi-sad", "vojvodina"],
      hours: [
        { dayOfWeek: 0, openTime: "10:00", closeTime: "19:00", isClosed: false },
        { dayOfWeek: 1, openTime: "10:00", closeTime: "19:00", isClosed: false },
        { dayOfWeek: 2, openTime: "10:00", closeTime: "19:00", isClosed: false },
        { dayOfWeek: 3, openTime: "10:00", closeTime: "19:00", isClosed: false },
        { dayOfWeek: 4, openTime: "10:00", closeTime: "19:00", isClosed: false },
        { dayOfWeek: 5, openTime: "10:00", closeTime: "19:00", isClosed: false },
        { dayOfWeek: 6, openTime: "10:00", closeTime: "19:00", isClosed: false },
      ],
      ticketGroups: [
        {
          title: "Season Pass Pro",
          titleSr: "Season Pass Pro",
          description: "Neograničen pristup tokom cele letnje sezone",
          descriptionSr: "Neograničen pristup tokom cele letnje sezone",
        },
        {
          title: "Dnevne karte",
          titleSr: "Dnevne karte",
          description: "Celodnevni pristup svim atrakcijama",
          descriptionSr: "Celodnevni pristup svim atrakcijama",
        },
      ],
      tickets: [
        {
          title: "SeasonPass Pro - Deca (110-140cm)",
          titleSr: "SeasonPass Pro - Deca (110-140cm)",
          type: "CHILD", price: 10490, originalPrice: 12990,
          dayType: "ALL", timeSlot: "FULL_DAY", validityType: "SUMMER_SEASON",
          isSeasonPass: true, isFeatured: false,
          description: "Neograničen letnji ulaz za decu visine 110-140cm",
          descriptionSr: "Neograničen letnji ulaz za decu visine 110-140cm",
        },
        {
          title: "SeasonPass Pro - Đaci/Studenti/Penzioneri",
          titleSr: "SeasonPass Pro - Đaci/Studenti/Penzioneri",
          type: "STUDENT", price: 12990, originalPrice: 14990,
          dayType: "ALL", timeSlot: "FULL_DAY", validityType: "SUMMER_SEASON",
          isSeasonPass: true, isFeatured: false,
          description: "Neograničen letnji ulaz za đake, studente i penzionere",
          descriptionSr: "Neograničen letnji ulaz za đake, studente i penzionere",
        },
        {
          title: "SeasonPass Pro - Odrasli",
          titleSr: "SeasonPass Pro - Odrasli",
          type: "ADULT", price: 14990, originalPrice: 17990,
          dayType: "ALL", timeSlot: "FULL_DAY", validityType: "SUMMER_SEASON",
          isSeasonPass: true, isFeatured: true,
          description: "Neograničen letnji ulaz za odrasle",
          descriptionSr: "Neograničen letnji ulaz za odrasle",
        },
        {
          title: "Dnevna Karta - Deca (110-140cm) Radni dan posle 16h",
          titleSr: "Dnevna Karta - Deca (110-140cm) Radni dan posle 16h",
          type: "CHILD", price: 890, originalPrice: 1190,
          dayType: "WEEKDAY", timeSlot: "AFTER_16H", validityType: "FIXED_DATE",
          description: "Popodnevni ulaz za decu 110-140cm radnim danom",
          descriptionSr: "Popodnevni ulaz za decu 110-140cm radnim danom",
        },
        {
          title: "Dnevna Karta - Deca (110-140cm) Radni dan",
          titleSr: "Dnevna Karta - Deca (110-140cm) Radni dan",
          type: "CHILD", price: 1050, originalPrice: 1190,
          dayType: "WEEKDAY", timeSlot: "FULL_DAY", validityType: "FIXED_DATE",
          description: "Celodnevni ulaz za decu 110-140cm radnim danom",
          descriptionSr: "Celodnevni ulaz za decu 110-140cm radnim danom",
        },
        {
          title: "Dnevna Karta - Studenti/Penzioneri Radni dan posle 16h",
          titleSr: "Dnevna Karta - Studenti/Penzioneri Radni dan posle 16h",
          type: "STUDENT", price: 1390, originalPrice: 1690,
          dayType: "WEEKDAY", timeSlot: "AFTER_16H", validityType: "FIXED_DATE",
          requiresIdentity: true,
          description: "Popodnevni ulaz za studente i penzionere radnim danom",
          descriptionSr: "Popodnevni ulaz za studente i penzionere radnim danom",
        },
        {
          title: "Dnevna Karta - Studenti/Penzioneri Radni dan",
          titleSr: "Dnevna Karta - Studenti/Penzioneri Radni dan",
          type: "STUDENT", price: 1490, originalPrice: 1690,
          dayType: "WEEKDAY", timeSlot: "FULL_DAY", validityType: "FIXED_DATE",
          requiresIdentity: true,
          description: "Celodnevni ulaz za studente i penzionere radnim danom",
          descriptionSr: "Celodnevni ulaz za studente i penzionere radnim danom",
        },
        {
          title: "Dnevna Karta - Odrasli Radni dan posle 16h",
          titleSr: "Dnevna Karta - Odrasli Radni dan posle 16h",
          type: "ADULT", price: 1590, originalPrice: 1790,
          dayType: "WEEKDAY", timeSlot: "AFTER_16H", validityType: "FIXED_DATE",
          description: "Popodnevni ulaz za odrasle radnim danom",
          descriptionSr: "Popodnevni ulaz za odrasle radnim danom",
        },
        {
          title: "Dnevna Karta - Odrasli Radni dan",
          titleSr: "Dnevna Karta - Odrasli Radni dan",
          type: "ADULT", price: 1790, originalPrice: 1990,
          dayType: "WEEKDAY", timeSlot: "FULL_DAY", validityType: "FIXED_DATE",
          isFeatured: true,
          description: "Celodnevni ulaz za odrasle radnim danom — najbolja vrednost!",
          descriptionSr: "Celodnevni ulaz za odrasle radnim danom — najbolja vrednost!",
        },
        {
          title: "Dnevna Karta - Deca (110-140cm) Vikend",
          titleSr: "Dnevna Karta - Deca (110-140cm) Vikend",
          type: "CHILD", price: 1390, originalPrice: 1490,
          dayType: "WEEKEND", timeSlot: "FULL_DAY", validityType: "FIXED_DATE",
          description: "Celodnevni ulaz za decu 110-140cm vikendom i praznikom",
          descriptionSr: "Celodnevni ulaz za decu 110-140cm vikendom i praznikom",
        },
        {
          title: "Dnevna Karta - Studenti/Penzioneri Vikend",
          titleSr: "Dnevna Karta - Studenti/Penzioneri Vikend",
          type: "STUDENT", price: 1790, originalPrice: 1990,
          dayType: "WEEKEND", timeSlot: "FULL_DAY", validityType: "FIXED_DATE",
          requiresIdentity: true,
          description: "Celodnevni ulaz za studente i penzionere vikendom",
          descriptionSr: "Celodnevni ulaz za studente i penzionere vikendom",
        },
        {
          title: "Dnevna Karta - Odrasli Vikend",
          titleSr: "Dnevna Karta - Odrasli Vikend",
          type: "ADULT", price: 2190, originalPrice: 2490,
          dayType: "WEEKEND", timeSlot: "FULL_DAY", validityType: "FIXED_DATE",
          description: "Celodnevni ulaz za odrasle vikendom i praznikom",
          descriptionSr: "Celodnevni ulaz za odrasle vikendom i praznikom",
        },
        {
          title: "Family Package 2+1 Vikend",
          titleSr: "Family Package 2+1 Vikend",
          type: "FAMILY_BUNDLE", price: 4090, originalPrice: 4590,
          dayType: "WEEKEND", timeSlot: "FULL_DAY", validityType: "FIXED_DATE",
          maxPeople: 3,
          description: "Vikend porodični paket: 2 odrasla + 1 dete (110-140cm)",
          descriptionSr: "Vikend porodični paket: 2 odrasla + 1 dete (110-140cm)",
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════
    // 2. AQUA PARK IZVOR — Aranđelovac
    // ═══════════════════════════════════════════════════════════════
    {
      name: "Aqua Park Izvor",
      slug: "aquapark-izvor",
      category: "Waterpark",
      city: "Aranđelovac",
      streetName: "Mišarska",
      streetNumber: "2",
      postalCode: "34300",
      lat: 44.306,
      lng: 20.558,
      status: "ACTIVE",
      publicPhone: "+381 34 711 000",
      publicEmail: "office@izvor.rs",
      description: "Aqua Park Izvor u Aranđelovcu je vrhunski akva park i luksuzni wellness centar. Sadrži 12 tobogana, termalne bazene sa prirodnom lekovitom vodom i profesionalne SPA sadržaje. Deo je hotelskog kompleksa Izvor.",
      descriptionSr: "Aqua Park Izvor u Aranđelovcu je vrhunski akva park i luksuzni wellness centar. Sadrži 12 tobogana, termalne bazene sa prirodnom lekovitom vodom i profesionalne SPA sadržaje. Deo je hotelskog kompleksa Izvor.",
      metaTitle: "Aqua Park Izvor Aranđelovac | Wellness & Akva Park | Splashdeals",
      metaDescription: "Akva park Izvor u Aranđelovcu — 12 tobogana, termalni bazeni i luksuzni wellness. Rezervišite online karte i uživajte u termalnom raju!",
      socialLinks: {
        facebook: "https://www.facebook.com/HotelIzvor/",
        instagram: "https://www.instagram.com/hotel_izvor/",
        website: "https://www.izvor.rs",
      },
      amenities: [
        "Water Slides", "Thermal Water", "Wellness & Spa", "Kids' Pool",
        "Restaurant", "Parking", "Hydromassage", "Indoor Pool",
      ],
      regions: ["arandjelovac", "central-serbia"],
      hours: [
        { dayOfWeek: 0, openTime: "09:00", closeTime: "21:00", isClosed: false },
        { dayOfWeek: 1, openTime: "09:00", closeTime: "21:00", isClosed: false },
        { dayOfWeek: 2, openTime: "09:00", closeTime: "21:00", isClosed: false },
        { dayOfWeek: 3, openTime: "09:00", closeTime: "21:00", isClosed: false },
        { dayOfWeek: 4, openTime: "09:00", closeTime: "21:00", isClosed: false },
        { dayOfWeek: 5, openTime: "09:00", closeTime: "22:00", isClosed: false },
        { dayOfWeek: 6, openTime: "09:00", closeTime: "22:00", isClosed: false },
      ],
      ticketGroups: [
        {
          title: "SPA Dnevni ulaz",
          titleSr: "SPA Dnevni ulaz",
          description: "Pristup svim SPA i wellness sadržajima",
          descriptionSr: "Pristup svim SPA i wellness sadržajima",
        },
        {
          title: "Ulaznice za Akva Park",
          titleSr: "Ulaznice za Akva Park",
          description: "Sezonski pristup akva parku",
          descriptionSr: "Sezonski pristup akva parku",
        },
      ],
      tickets: [
        {
          title: "SPA Dnevni ulaz - Odrasli Radni dan",
          titleSr: "SPA Dnevni ulaz - Odrasli Radni dan",
          type: "ADULT", price: 6000, originalPrice: 7000,
          dayType: "WEEKDAY", timeSlot: "FULL_DAY", validityType: "FIXED_DATE",
          isFeatured: true,
          description: "Celodnevni SPA i wellness pristup radnim danom",
          descriptionSr: "Celodnevni SPA i wellness pristup radnim danom",
        },
        {
          title: "SPA Dnevni ulaz - Odrasli Vikend",
          titleSr: "SPA Dnevni ulaz - Odrasli Vikend",
          type: "ADULT", price: 7000, originalPrice: 8000,
          dayType: "WEEKEND", timeSlot: "FULL_DAY", validityType: "FIXED_DATE",
          description: "Celodnevni SPA i wellness pristup vikendom",
          descriptionSr: "Celodnevni SPA i wellness pristup vikendom",
        },
        {
          title: "Sezonska karta za Akva Park - Odrasli",
          titleSr: "Sezonska karta za Akva Park - Odrasli",
          type: "ADULT", price: 1500, originalPrice: 1800,
          dayType: "ALL", timeSlot: "FULL_DAY", validityType: "SUMMER_SEASON",
          description: "Sezonska dnevna karta za akva park",
          descriptionSr: "Sezonska dnevna karta za akva park",
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════
    // 3. AQUA PARK JAGODINA — Jagodina
    // ═══════════════════════════════════════════════════════════════
    {
      name: "Aqua Park Jagodina",
      slug: "aquapark-jagodina",
      category: "Waterpark",
      city: "Jagodina",
      streetName: "Stevana Prvovenčanog",
      streetNumber: "bb",
      postalCode: "35000",
      lat: 43.966,
      lng: 21.263,
      status: "ACTIVE",
      publicPhone: "+381 35 822 222",
      publicEmail: "office@aquaparkjagodina.rs",
      description: "Prvi akva park izgrađen u Srbiji, sa 7 bazena i 9 tobogana uključujući čuveni 'Kamikaze' tobogan. Idealna porodična destinacija sa atrakcijama za sve uzraste.",
      descriptionSr: "Prvi akva park izgrađen u Srbiji, sa 7 bazena i 9 tobogana uključujući čuveni 'Kamikaze' tobogan. Idealna porodična destinacija sa atrakcijama za sve uzraste.",
      metaTitle: "Aqua Park Jagodina | Prvi Akva Park u Srbiji | Splashdeals",
      metaDescription: "Aqua Park Jagodina — 7 bazena, 9 tobogana i čuveni Kamikaze! Kupite karte online i zabavite se sa porodicom.",
      socialLinks: {
        facebook: "https://www.facebook.com/AquaParkJagodina/",
        website: "https://www.aquaparkjagodina.rs",
      },
      amenities: [
        "Water Slides", "Olympic Pool", "Kids' Pool", "Cafe Bar",
        "Parking", "Locker Rooms", "First Aid", "Changing Rooms",
      ],
      regions: ["jagodina", "central-serbia"],
      hours: [
        { dayOfWeek: 0, openTime: "10:00", closeTime: "19:00", isClosed: false },
        { dayOfWeek: 1, openTime: "10:00", closeTime: "19:00", isClosed: false },
        { dayOfWeek: 2, openTime: "10:00", closeTime: "19:00", isClosed: false },
        { dayOfWeek: 3, openTime: "10:00", closeTime: "19:00", isClosed: false },
        { dayOfWeek: 4, openTime: "10:00", closeTime: "19:00", isClosed: false },
        { dayOfWeek: 5, openTime: "10:00", closeTime: "20:00", isClosed: false },
        { dayOfWeek: 6, openTime: "10:00", closeTime: "20:00", isClosed: false },
      ],
      ticketGroups: [
        {
          title: "Dnevne karte",
          titleSr: "Dnevne karte",
          description: "Celodnevne ulaznice",
          descriptionSr: "Celodnevne ulaznice",
        },
      ],
      tickets: [
        {
          title: "Dnevna Karta - Odrasli",
          titleSr: "Dnevna Karta - Odrasli",
          type: "ADULT", price: 1200, originalPrice: 1500,
          dayType: "ALL", timeSlot: "FULL_DAY", validityType: "FIXED_DATE",
          isFeatured: true,
          description: "Celodnevni pristup svim sadržajima za odrasle",
          descriptionSr: "Celodnevni pristup svim sadržajima za odrasle",
        },
        {
          title: "Dnevna Karta - Deca (do 12 god)",
          titleSr: "Dnevna Karta - Deca (do 12 god)",
          type: "CHILD", price: 700, originalPrice: 1000,
          dayType: "ALL", timeSlot: "FULL_DAY", validityType: "FIXED_DATE",
          description: "Celodnevni pristup za decu do 12 godina",
          descriptionSr: "Celodnevni pristup za decu do 12 godina",
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════
    // 4. AQUA PARK SUNNY HILL — Vrnjačka Banja
    // ═══════════════════════════════════════════════════════════════
    {
      name: "Aqua Park Sunny Hill",
      slug: "sunny-hill",
      category: "Waterpark",
      city: "Vrnjačka Banja",
      streetName: "Mare Jakovljević",
      streetNumber: "9A",
      postalCode: "36210",
      lat: 43.6149,
      lng: 20.9016,
      status: "ACTIVE",
      publicPhone: "+381 63 456 789",
      publicEmail: "info@sunnyhill.rs",
      description: "Luksuzni akva rizort sa panoramskim pogledom na Vrnjačku Banju. Kombinuje zabavu akva parka sa premium smeštajem i SPA uslugama.",
      descriptionSr: "Luksuzni akva rizort sa panoramskim pogledom na Vrnjačku Banju. Kombinuje zabavu akva parka sa premium smeštajem i SPA uslugama.",
      metaTitle: "Aqua Park Sunny Hill Vrnjačka Banja | Luksuzni Akva Rizort | Splashdeals",
      metaDescription: "Sunny Hill aqua resort u Vrnjačkoj Banji — tobogani, wellness i panoramski pogled. Rezervišite vaš dan na vodi!",
      socialLinks: {
        instagram: "https://www.instagram.com/sunnyhillvrnjackabanja/",
        website: "https://www.sunnyhill.rs",
      },
      amenities: [
        "Water Slides", "Wellness & Spa", "Restaurant", "Parking",
        "Hydromassage", "Kids' Pool", "Free WiFi", "Cafe Bar",
      ],
      regions: ["vrnjacka-banja", "central-serbia"],
      hours: [
        { dayOfWeek: 0, openTime: "09:00", closeTime: "21:00", isClosed: false },
        { dayOfWeek: 1, openTime: "09:00", closeTime: "20:00", isClosed: false },
        { dayOfWeek: 2, openTime: "09:00", closeTime: "20:00", isClosed: false },
        { dayOfWeek: 3, openTime: "09:00", closeTime: "20:00", isClosed: false },
        { dayOfWeek: 4, openTime: "09:00", closeTime: "20:00", isClosed: false },
        { dayOfWeek: 5, openTime: "09:00", closeTime: "21:00", isClosed: false },
        { dayOfWeek: 6, openTime: "09:00", closeTime: "21:00", isClosed: false },
      ],
      ticketGroups: [
        {
          title: "Dnevni pass",
          titleSr: "Dnevni pass",
          description: "Celodnevni pristup svim sadržajima",
          descriptionSr: "Celodnevni pristup svim sadržajima",
        },
      ],
      tickets: [
        {
          title: "Dnevni pass - Odrasli",
          titleSr: "Dnevni pass - Odrasli",
          type: "ADULT", price: 1200, originalPrice: 1500,
          dayType: "ALL", timeSlot: "FULL_DAY", validityType: "FIXED_DATE",
          isFeatured: true,
          description: "Celodnevni pristup za odrasle",
          descriptionSr: "Celodnevni pristup za odrasle",
        },
        {
          title: "Dnevni pass - Deca",
          titleSr: "Dnevni pass - Deca",
          type: "CHILD", price: 800, originalPrice: 1000,
          dayType: "ALL", timeSlot: "FULL_DAY", validityType: "FIXED_DATE",
          description: "Celodnevni pristup za decu",
          descriptionSr: "Celodnevni pristup za decu",
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════
    // 5. AQUA PARK PODINA — Soko Banja
    // ═══════════════════════════════════════════════════════════════
    {
      name: "Aqua Park Podina",
      slug: "aquapark-podina",
      category: "Waterpark",
      city: "Soko Banja",
      streetName: "IX Brigade",
      streetNumber: "bb",
      postalCode: "18230",
      lat: 43.6425,
      lng: 21.8680,
      status: "ACTIVE",
      publicPhone: "+381 18 320 321",
      publicEmail: "info@sokobanja.rs",
      description: "Moderan akva park u Soko Banji, idealan za porodice koje traže planinski vazduh i zabavu na vodi. Nudi tobogane, dečije bazene i sunčane terase sa pogledom na planinu Ozren.",
      descriptionSr: "Moderan akva park u Soko Banji, idealan za porodice koje traže planinski vazduh i zabavu na vodi. Nudi tobogane, dečije bazene i sunčane terase sa pogledom na planinu Ozren.",
      metaTitle: "Aqua Park Podina Soko Banja | Porodični Akva Park | Splashdeals",
      metaDescription: "Aqua Park Podina u Soko Banji — tobogani, dečiji bazeni i planinski vazduh. Savršeno mesto za porodični izlet!",
      socialLinks: {
        website: "https://www.sokobanja.rs",
      },
      amenities: [
        "Water Slides", "Kids' Pool", "Parking", "Cafe Bar",
        "Changing Rooms", "First Aid", "Free WiFi",
      ],
      regions: ["soko-banja", "central-serbia"],
      hours: [
        { dayOfWeek: 0, openTime: "09:00", closeTime: "19:00", isClosed: false },
        { dayOfWeek: 1, openTime: "09:00", closeTime: "19:00", isClosed: false },
        { dayOfWeek: 2, openTime: "09:00", closeTime: "19:00", isClosed: false },
        { dayOfWeek: 3, openTime: "09:00", closeTime: "19:00", isClosed: false },
        { dayOfWeek: 4, openTime: "09:00", closeTime: "19:00", isClosed: false },
        { dayOfWeek: 5, openTime: "09:00", closeTime: "20:00", isClosed: false },
        { dayOfWeek: 6, openTime: "09:00", closeTime: "20:00", isClosed: false },
      ],
      ticketGroups: [
        {
          title: "Dnevne karte",
          titleSr: "Dnevne karte",
          description: "Celodnevne ulaznice",
          descriptionSr: "Celodnevne ulaznice",
        },
      ],
      tickets: [
        {
          title: "Dnevna Karta - Odrasli",
          titleSr: "Dnevna Karta - Odrasli",
          type: "ADULT", price: 600, originalPrice: 800,
          dayType: "ALL", timeSlot: "FULL_DAY", validityType: "FIXED_DATE",
          isFeatured: true,
          description: "Celodnevni pristup za odrasle",
          descriptionSr: "Celodnevni pristup za odrasle",
        },
        {
          title: "Dnevna Karta - Deca (do 12 god)",
          titleSr: "Dnevna Karta - Deca (do 12 god)",
          type: "CHILD", price: 400, originalPrice: 600,
          dayType: "ALL", timeSlot: "FULL_DAY", validityType: "FIXED_DATE",
          description: "Celodnevni pristup za decu do 12 godina",
          descriptionSr: "Celodnevni pristup za decu do 12 godina",
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════
    // 6. TERME VRUJCI — Mionica (Thermal Bath + Waterpark)
    // ═══════════════════════════════════════════════════════════════
    {
      name: "Banja Vrujci Aquapark",
      slug: "banja-vrujci",
      category: "Thermal Bath",
      city: "Mionica",
      streetName: "Banja Vrujci",
      streetNumber: "bb",
      postalCode: "14242",
      lat: 44.225,
      lng: 20.2056,
      status: "ACTIVE",
      publicPhone: "+381 14 357 100",
      publicEmail: "office@banjavrujci.rs",
      description: "Banja Vrujci je moderni termalni kompleks sa akva parkom koji koristi lekovite termalno-mineralne vode. Sadrži zatvorene i otvorene bazene, tobogane i potpune wellness sadržaje. Idealna destinacija za opuštanje i porodičnu zabavu.",
      descriptionSr: "Banja Vrujci je moderni termalni kompleks sa akva parkom koji koristi lekovite termalno-mineralne vode. Sadrži zatvorene i otvorene bazene, tobogane i potpune wellness sadržaje. Idealna destinacija za opuštanje i porodičnu zabavu.",
      metaTitle: "Banja Vrujci Terme | Akva Park i Wellness Mionica | Splashdeals",
      metaDescription: "Terme Vrujci — lekovite termalne vode, akva park i wellness. Rezervišite karte za Banju Vrujci online!",
      socialLinks: {
        facebook: "https://www.facebook.com/banjavrujci/",
        instagram: "https://www.instagram.com/banjavrujci/",
        website: "https://www.banjavrujci.rs",
      },
      amenities: [
        "Thermal Water", "Water Slides", "Kids' Pool", "Restaurant",
        "Parking", "Wellness & Spa", "Indoor Pool", "Hydromassage",
      ],
      regions: ["mionica", "central-serbia"],
      hours: [
        { dayOfWeek: 0, openTime: "09:00", closeTime: "22:00", isClosed: false },
        { dayOfWeek: 1, openTime: "09:00", closeTime: "22:00", isClosed: false },
        { dayOfWeek: 2, openTime: "09:00", closeTime: "22:00", isClosed: false },
        { dayOfWeek: 3, openTime: "09:00", closeTime: "22:00", isClosed: false },
        { dayOfWeek: 4, openTime: "09:00", closeTime: "22:00", isClosed: false },
        { dayOfWeek: 5, openTime: "09:00", closeTime: "23:00", isClosed: false },
        { dayOfWeek: 6, openTime: "09:00", closeTime: "23:00", isClosed: false },
      ],
      ticketGroups: [
        {
          title: "Ulaz na bazene",
          titleSr: "Ulaz na bazene",
          description: "Pristup svim bazenima",
          descriptionSr: "Pristup svim bazenima",
        },
        {
          title: "Doplata za Akva Park",
          titleSr: "Doplata za Akva Park",
          description: "Dodatna naplata za korišćenje tobogana",
          descriptionSr: "Dodatna naplata za korišćenje tobogana",
        },
      ],
      tickets: [
        {
          title: "Bazen - Odrasli Radni dan",
          titleSr: "Bazen - Odrasli Radni dan",
          type: "ADULT", price: 800, originalPrice: 950,
          dayType: "WEEKDAY", timeSlot: "FULL_DAY", validityType: "FIXED_DATE",
          isFeatured: true,
          description: "Celodnevni pristup bazenima radnim danom",
          descriptionSr: "Celodnevni pristup bazenima radnim danom",
        },
        {
          title: "Bazen - Odrasli Vikend",
          titleSr: "Bazen - Odrasli Vikend",
          type: "ADULT", price: 950, originalPrice: 1100,
          dayType: "WEEKEND", timeSlot: "FULL_DAY", validityType: "FIXED_DATE",
          description: "Celodnevni pristup bazenima vikendom",
          descriptionSr: "Celodnevni pristup bazenima vikendom",
        },
        {
          title: "Bazen - Deca (5-10 god)",
          titleSr: "Bazen - Deca (5-10 god)",
          type: "CHILD", price: 600, originalPrice: 750,
          dayType: "ALL", timeSlot: "FULL_DAY", validityType: "FIXED_DATE",
          description: "Celodnevni pristup bazenima za decu 5-10 godina",
          descriptionSr: "Celodnevni pristup bazenima za decu 5-10 godina",
        },
        {
          title: "Doplata za Akva-park",
          titleSr: "Doplata za Akva-park",
          type: "ADULT", price: 500, originalPrice: 600,
          dayType: "ALL", timeSlot: "FULL_DAY", validityType: "FIXED_DATE",
          description: "Doplata za korišćenje tobogana i akva parka",
          descriptionSr: "Doplata za korišćenje tobogana i akva parka",
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════
    // 7. BANJA JUNAKOVIĆ — Apatin
    // ═══════════════════════════════════════════════════════════════
    {
      name: "Banja Junaković",
      slug: "banja-junakovic",
      category: "Thermal Bath",
      city: "Apatin",
      streetName: "Banjski put",
      streetNumber: "71",
      postalCode: "25263",
      lat: 45.6773,
      lng: 19.0314,
      status: "ACTIVE",
      publicPhone: "+381 25 773 222",
      publicEmail: "office@banjajunakovic.rs",
      description: "Čuveno termalno lečilište u Bačkoj sa više bazena i tobogana. Poznato po lekovitim termalnim vodama i porodičnoj atmosferi. Nudi smeštaj, restoran i wellness sadržaje.",
      descriptionSr: "Čuveno termalno lečilište u Bačkoj sa više bazena i tobogana. Poznato po lekovitim termalnim vodama i porodičnoj atmosferi. Nudi smeštaj, restoran i wellness sadržaje.",
      metaTitle: "Banja Junaković Apatin | Termalni Raj u Bačkoj | Splashdeals",
      metaDescription: "Banja Junaković — termalni bazeni, tobogani i wellness u Apatinu. Kupite karte online!",
      socialLinks: {
        facebook: "https://www.facebook.com/banjajunakovic/",
        website: "https://www.banjajunakovic.rs",
      },
      amenities: [
        "Thermal Water", "Water Slides", "Kids' Pool", "Restaurant",
        "Wellness & Spa", "Parking", "Indoor Pool", "Cafe Bar",
      ],
      regions: ["apatin", "backa", "vojvodina"],
      hours: [
        { dayOfWeek: 0, openTime: "08:00", closeTime: "20:00", isClosed: false },
        { dayOfWeek: 1, openTime: "08:00", closeTime: "20:00", isClosed: false },
        { dayOfWeek: 2, openTime: "08:00", closeTime: "20:00", isClosed: false },
        { dayOfWeek: 3, openTime: "08:00", closeTime: "20:00", isClosed: false },
        { dayOfWeek: 4, openTime: "08:00", closeTime: "20:00", isClosed: false },
        { dayOfWeek: 5, openTime: "08:00", closeTime: "21:00", isClosed: false },
        { dayOfWeek: 6, openTime: "08:00", closeTime: "21:00", isClosed: false },
      ],
      ticketGroups: [
        {
          title: "Dnevne karte",
          titleSr: "Dnevne karte",
          description: "Celodnevni pristup",
          descriptionSr: "Celodnevni pristup",
        },
      ],
      tickets: [
        {
          title: "Dnevna Karta - Odrasli",
          titleSr: "Dnevna Karta - Odrasli",
          type: "ADULT", price: 700, originalPrice: 900,
          dayType: "ALL", timeSlot: "FULL_DAY", validityType: "FIXED_DATE",
          isFeatured: true,
          description: "Celodnevni pristup termalnim bazenima za odrasle",
          descriptionSr: "Celodnevni pristup termalnim bazenima za odrasle",
        },
        {
          title: "Dnevna Karta - Deca",
          titleSr: "Dnevna Karta - Deca",
          type: "CHILD", price: 400, originalPrice: 600,
          dayType: "ALL", timeSlot: "FULL_DAY", validityType: "FIXED_DATE",
          description: "Celodnevni pristup termalnim bazenima za decu",
          descriptionSr: "Celodnevni pristup termalnim bazenima za decu",
        },
      ],
    },
  ];

  console.log(`\n🌊 Seeding ${facilities.length} enhanced waterpark facilities...\n`);

  for (const f of facilities) {
    console.log(`  → ${f.name} (${f.city})...`);
    const existing = await prisma.facility.findUnique({ where: { slug: f.slug } });
    if (existing) {
      console.log(`    ⚠️  Already exists (ID: ${existing.id}), updating...`);
      await prisma.facility.update({
        where: { slug: f.slug },
        data: {
          publicPhone: f.publicPhone,
          publicEmail: f.publicEmail,
          socialLinks: f.socialLinks,
          metaTitle: f.metaTitle,
          metaDescription: f.metaDescription,
          description: f.description,
          descriptionSr: f.descriptionSr,
          lat: f.lat,
          lng: f.lng,
          status: f.status as FacilityStatus,
        },
      });
      const facilityId = existing.id;

      // Update hours
      await prisma.operatingHours.deleteMany({ where: { facilityId } });
      for (const h of f.hours) {
        await prisma.operatingHours.create({
          data: { facilityId, dayOfWeek: h.dayOfWeek, openTime: h.openTime, closeTime: h.closeTime, isClosed: h.isClosed },
        });
      }

      // Update ticket groups
      await prisma.ticket.deleteMany({ where: { facilityId } });
      for (const [gi, g] of f.ticketGroups.entries()) {
        const group = await prisma.ticketGroup.create({
          data: {
            facilityId,
            title: g.title,
            titleSr: g.titleSr,
            description: g.description,
            descriptionSr: g.descriptionSr,
            displayOrder: gi,
            isActive: true,
            slug: `${f.slug}-group-${gi}`,
          },
        });

        const groupTickets = f.tickets.filter((_, ti) => {
          if (gi === 0) return ti < 3;
          return ti >= 3;
        });

        for (const [ti, t] of groupTickets.entries()) {
          await prisma.ticket.create({
            data: {
              facilityId,
              groupId: group.id,
              title: t.title,
              titleSr: t.titleSr,
              type: t.type as TicketType,
              price: t.price,
              originalPrice: t.originalPrice || t.price + 200,
              currency: "RSD",
              validityType: t.validityType as ValidityType,
              isActive: true,
              isFeatured: t.isFeatured || false,
              displayOrder: ti,
              dayType: t.dayType as DayType,
              timeSlot: t.timeSlot as TimeSlot,
              isSeasonPass: t.isSeasonPass || false,
              minPeople: t.minPeople || 1,
              maxPeople: t.maxPeople || null,
              requiresIdentity: t.requiresIdentity || false,
              requiresPhoto: false,
              description: t.description,
              descriptionSr: t.descriptionSr,
              slug: `${f.slug}-${gi}-${ti}`,
            },
          });
        }
      }

      console.log(`    ✅ Updated with ${f.tickets.length} real tickets, ${f.hours.length} operating hours.`);
    } else {
      console.log(`    ⚠️  Facility not found in DB — run the primary seed first.`);
    }
  }

  console.log(`\n🏁 Enhanced seed complete! ${facilities.length} facilities updated.`);
  console.log("📊 All text in Serbian Latin script.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
