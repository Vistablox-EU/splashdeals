import { Metadata } from "next";
import { getDictionary } from "@/lib/dictionaries";
import { JsonLd } from "@/components/SEO/JsonLd";
import { connection } from "next/server";
import {
  getHomeBiggestSavings,
  getHomeBlogPosts,
  getHomeFeaturedDeals,
  getHomeGateProof,
  getHomeMetrics,
  getHomeOpenToday,
} from "@/lib/home/deals";
import { HomeHero } from "./_components/HomeHero";
import { HomeIntentLanes } from "./_components/HomeIntentLanes";
import { HomeGatePriceProof } from "./_components/HomeGatePriceProof";
import { HomeBiggestSavings } from "./_components/HomeBiggestSavings";
import { HomeInventorySection } from "./_components/HomeInventorySection";
import { HomeHowSavingsWork } from "./_components/HomeHowSavingsWork";
import { HomeHowItWorks } from "./_components/HomeHowItWorks";
import { HomeTrustStrip } from "./_components/HomeTrustStrip";
import { HomeTicketEducation } from "./_components/HomeTicketEducation";
import { HomeOpenToday } from "./_components/HomeOpenToday";
import { HomeRegionChips } from "./_components/HomeRegionChips";
import { HomeFamilyMath } from "./_components/HomeFamilyMath";
import { HomeSocialProof } from "./_components/HomeSocialProof";
import { HomeFaq } from "./_components/HomeFaq";
import { HomeBlogStrip } from "./_components/HomeBlogStrip";
import { HomeB2bTeaser } from "./_components/HomeB2bTeaser";
import { HomeSeoAccordion } from "./_components/HomeSeoAccordion";
import { HomeExperienceStats } from "./_components/HomeExperienceStats";

interface PageProps {
  params: Promise<Record<string, never>>;
}

export async function generateMetadata({ params: _params }: PageProps): Promise<Metadata> {
  const dict = await getDictionary();

  return {
    title: { absolute: dict.seo.home.title },
    description: dict.seo.home.description,
    alternates: { canonical: "https://www.splashdeals.rs" },
    openGraph: {
      title: dict.seo.home.title,
      description: dict.seo.home.description,
      images: ["/og-image.png"],
      type: "website",
      locale: "sr_RS",
    },
    twitter: {
      card: "summary_large_image",
      title: dict.seo.home.title,
      description: dict.seo.home.description,
      images: ["/og-image.png"],
    },
  };
}

/**
 * Homepage composition root — sections live in app/(web)/_components/Home*.
 */
export default async function LandingPage({
  params: _params,
}: {
  params: Promise<Record<string, never>>;
}) {
  await connection();
  const dict = await getDictionary();
  const home = dict.home as Record<string, string>;
  const fallbackPitch = home.default_ticket_desc;

  const [featured, savings, gateDeal, openToday, metrics, posts] = await Promise.all([
    getHomeFeaturedDeals(fallbackPitch, 6),
    getHomeBiggestSavings(fallbackPitch, 4),
    getHomeGateProof(fallbackPitch),
    getHomeOpenToday(fallbackPitch, 6),
    getHomeMetrics(),
    getHomeBlogPosts(3),
  ]);

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SplashDeals",
    url: "https://www.splashdeals.rs",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://www.splashdeals.rs/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SplashDeals",
    url: "https://www.splashdeals.rs",
    logo: "https://www.splashdeals.rs/logo-splashdeals.webp",
    description:
      "Splashdeals je marketplace za regularne ulaznice za vodene parkove, bazene i wellness centre — digitalno i često ispod cene blagajne.",
    areaServed: {
      "@type": "Country",
      name: "RS",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+381-61-138-4512",
        contactType: "customer service",
        availableLanguage: ["Serbian"],
      },
      {
        "@type": "ContactPoint",
        email: "hq@splashdeals.rs",
        contactType: "customer service",
        availableLanguage: ["Serbian"],
      },
    ],
    sameAs: [
      "https://www.facebook.com/splashdeals.rs/",
      "https://www.instagram.com/splashdeals",
      "https://x.com/splashdeals",
    ],
  };

  return (
    <div className="text-foreground selection:bg-primary/30 relative min-h-screen overflow-x-hidden">
      <JsonLd id="website-schema" data={websiteSchema} />
      <JsonLd id="organization-schema" data={organizationSchema} />

      <HomeHero dict={home} />
      <HomeIntentLanes dict={home} />
      <HomeGatePriceProof dict={home} deal={gateDeal} />
      <HomeBiggestSavings dict={home} deals={savings} />
      <HomeInventorySection dict={home} deals={featured} />
      <HomeHowSavingsWork dict={home} />
      <HomeTicketEducation dict={home} />
      <HomeHowItWorks dict={home} />
      <HomeTrustStrip dict={home} />
      <HomeOpenToday dict={home} deals={openToday} />
      <HomeRegionChips dict={home} />
      <HomeFamilyMath dict={home} adultDeal={gateDeal} />
      <HomeExperienceStats dict={home} metrics={metrics} />
      <HomeSocialProof dict={home} />
      <HomeFaq dict={home} />
      <HomeBlogStrip dict={home} posts={posts} />
      <HomeB2bTeaser dict={home} />
      <HomeSeoAccordion dict={home} />
    </div>
  );
}
