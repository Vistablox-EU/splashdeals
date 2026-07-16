import { describe, expect, it } from "vitest";
import {
  buildOfferLabel,
  extractSocialUrls,
  facilityIndexable,
  isEntryTicketPrice,
  isExtraCategoryTitle,
  isExtraProductTitle,
  resolveSiteUrl,
  stripBrandSuffix,
  toNumber,
} from "@/app/(web)/facility/_data/seo-utils";
import { buildFacilitySchema, type TierEntry } from "@/app/(web)/facility/_data/schemas";

describe("facility seo-utils", () => {
  it("classifies entry vs extra products", () => {
    expect(isEntryTicketPrice({ catTitle: "Dnevne ulaznice", prodTitle: "Odrasli" })).toBe(true);
    expect(
      isEntryTicketPrice({
        catTitle: "Dopunske usluge",
        prodTitle: "Ležaljka sa suncobranom",
      }),
    ).toBe(false);
    expect(isExtraCategoryTitle("Dopunske usluge")).toBe(true);
    expect(isExtraProductTitle("Parking")).toBe(true);
    expect(
      isEntryTicketPrice({
        catTitle: "Mesečne i sezonske (stanovnici Jagodine)",
        prodTitle: "Mesečna karta — Odrasli (stanovnici)",
        isSeasonPass: true,
      }),
    ).toBe(false);
  });

  it("builds offer labels with day/time", () => {
    expect(
      buildOfferLabel({
        prodTitle: "Odrasli",
        priceLabel: "Celodnevna vikend (10–18h)",
      }),
    ).toBe("Odrasli · Celodnevna vikend (10–18h)");
    expect(
      buildOfferLabel({ prodTitle: "Odrasli", dayType: "WEEKEND", timeSlot: "FULL_DAY" }),
    ).toContain("Odrasli");
  });

  it("extracts social urls", () => {
    expect(
      extractSocialUrls({
        website: "https://www.aquaparkjagodina.rs",
        facebook: "https://www.facebook.com/AquaParkJagodina/",
        ignore: "nope",
      }),
    ).toEqual(["https://www.aquaparkjagodina.rs", "https://www.facebook.com/AquaParkJagodina/"]);
  });

  it("strips brand suffix and resolves site url", () => {
    expect(stripBrandSuffix("Park | Splashdeals")).toBe("Park");
    expect(resolveSiteUrl()).toMatch(/^https?:\/\//);
  });

  it("facilityIndexable only ACTIVE", () => {
    expect(facilityIndexable("ACTIVE")).toBe(true);
    expect(facilityIndexable("CLOSED")).toBe(false);
    expect(facilityIndexable("DRAFT")).toBe(false);
    expect(facilityIndexable("EMERGENCY_SHUTDOWN")).toBe(false);
  });

  it("toNumber handles decimal-like", () => {
    expect(toNumber(400)).toBe(400);
    expect(toNumber("1000")).toBe(1000);
  });
});

describe("buildFacilitySchema offer expansion", () => {
  const facility = {
    name: "Aqua Park Test",
    slug: "test-park",
    category: "Akva Park",
    description: "Test park",
    streetName: "Ulica",
    streetNumber: "1",
    city: "Beograd",
    postalCode: "11000",
    lat: 44.8,
    lng: 20.4,
    publicPhone: "+38160000000",
    socialLinks: { website: "https://example.com" },
    media: [{ url: "https://example.com/hero.jpg", type: "PHOTO", isHero: true }],
  };

  const tiers: TierEntry[] = [
    {
      id: "p1",
      price: 1000,
      originalPrice: 1200,
      label: "Odrasli · Celodnevna radni dan",
      isActive: true,
      isEntry: true,
      dayType: "WEEKDAY",
      timeSlot: "FULL_DAY",
      catTitle: "Dnevne ulaznice",
      prodTitle: "Odrasli",
    },
    {
      id: "p2",
      price: 400,
      originalPrice: null,
      label: "Odrasli · Popodnevna",
      isActive: true,
      isEntry: true,
      dayType: "ALL",
      timeSlot: "AFTER_16H",
      catTitle: "Dnevne ulaznice",
      prodTitle: "Odrasli",
    },
    {
      id: "extra",
      price: 100,
      originalPrice: null,
      label: "Ležaljka",
      isActive: true,
      isEntry: false,
      catTitle: "Dopunske usluge",
      prodTitle: "Ležaljka sa suncobranom",
    },
  ];

  it("uses entry tiers only for AggregateOffer lowPrice", () => {
    const schema = buildFacilitySchema({
      facility,
      facilitySlug: "test-park",
      categorySlug: "akva-parkovi",
      categoryLabel: "Akva Parkovi",
      allTiers: tiers,
      heroMedia: null,
      ticketCount: 2,
      currentYear: 2026,
      hours: [
        { dayOfWeek: 1, openTime: "10:00", closeTime: "18:00", isClosed: false },
        { dayOfWeek: 2, openTime: "00:00", closeTime: "00:00", isClosed: true },
      ],
      faqs: [{ question: "Kako ulazim?", answer: "Sa telefonom." }],
    });

    const graph = schema["@graph"] as Record<string, unknown>[];
    const product = graph.find((n) => n["@type"] === "Product") as {
      name: string;
      offers: { lowPrice: number; highPrice: number; offerCount: number; offers: unknown[] };
    };
    expect(product.name).toContain("digitalne ulaznice");
    expect(product.offers.lowPrice).toBe(400);
    expect(product.offers.highPrice).toBe(1000);
    expect(product.offers.offerCount).toBe(2);
    expect(product.offers.offers).toHaveLength(2);

    const breadcrumb = graph.find((n) => n["@type"] === "BreadcrumbList") as {
      itemListElement: { name: string }[];
    };
    expect(breadcrumb.itemListElement[0].name).toBe("Početna");

    const business = graph.find((n) => n["@type"] === "EntertainmentBusiness") as {
      sameAs?: string[];
    };
    expect(business.sameAs).toContain("https://example.com");

    const attraction = graph.find(
      (n) => Array.isArray(n["@type"]) && (n["@type"] as string[]).includes("TouristAttraction"),
    ) as { openingHoursSpecification: unknown[] };
    expect(attraction.openingHoursSpecification).toHaveLength(1);

    const faq = graph.find((n) => n["@type"] === "FAQPage");
    expect(faq).toBeTruthy();

    const howto = graph.find((n) => n["@type"] === "HowTo");
    expect(howto).toBeTruthy();

    // Discount priceSpec on first offer
    const offers = product.offers.offers as {
      priceSpecification: { priceType: string }[];
    }[];
    const discounted = offers.find((o) => o.priceSpecification.length === 2);
    expect(discounted).toBeTruthy();
  });
});
