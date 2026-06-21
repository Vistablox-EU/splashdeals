"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/Icon"
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu"

interface City {
  id: string
  name: string
  slug: string
}

interface FeaturedFacility {
  id: string
  name: string
  slug: string
  category: string
  city: string
  canonicalPath: string
  imageUrl: string
  startingPrice: number | null
  description: string
}

interface DiscoveryMenuData {
  cities: City[]
  featured: FeaturedFacility | null
}

import type { Dict } from "@/lib/types"

interface MegaMenuProps {
  dict: Dict
}

const POPULAR_CITY_SLUGS = [
  "belgrade", "beograd", "novi-sad", "jagodina", "vrnjacka-banja", "subotica",
]

export function MegaMenu({ dict }: MegaMenuProps) {
  const [data, setData] = useState<DiscoveryMenuData>({ cities: [], featured: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDiscoveryData = async () => {
      try {
        const response = await fetch("/api/menu/discovery")
        const payload = await response.json()
        if (payload) {
          setData({
            cities: payload.cities || [],
            featured: payload.featured || null,
          })
        }
      } catch (error) {
        console.error("Discovery API failed:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDiscoveryData()
  }, [])

  const { featured } = data

  const sortedCities = React.useMemo(() => {
    if (!data.cities || !Array.isArray(data.cities)) return []
    const popular = data.cities.filter((c) =>
      POPULAR_CITY_SLUGS.includes(c.slug.toLowerCase())
    )
    const others = data.cities.filter(
      (c) => !POPULAR_CITY_SLUGS.includes(c.slug.toLowerCase())
    )
    return [...popular, ...others]
  }, [data.cities])

  const categories = [
    { href: "/facilities/waterpark", icon: "waves", label: "Akva Parkovi" },
    { href: "/facilities/swimming-pool", icon: "waves", label: "Bazeni" },
    { href: "/facilities/wellness", icon: "auto_awesome", label: "Wellness & Spa" },
    { href: "/#deals", icon: "local_fire_department", label: "Sve Akcije" },
  ]

  const partnerLinks = [
    {
      href: "/facilities",
      icon: "login",
      title: "Pridruži se mreži bazena",
      desc: "Predstavite svoj bazen ili akva park stotinama hiljada korisnika.",
    },
    {
      href: "/admin/facilities",
      icon: "verified_user",
      title: "Partner Portal (Admin)",
      desc: "Upravljajte ponudama i isplatama direktno preko Stripe panela.",
    },
    {
      href: "/support",
      icon: "qr_code",
      title: "Validacioni Ticketing API",
      desc: "Integracija sa bar-kod i RFID rampama na kapijama.",
    },
  ]

  const userLinks = [
    {
      href: "/how-it-works",
      icon: "explore",
      title: "Kako funkcioniše platforma?",
      desc: "Vodič za brzu kupovinu karata i čuvanje u Apple & Google Wallet novčanik.",
    },
    {
      href: "/support",
      icon: "help_outline",
      title: "Centar za Pomoć & FAQ",
      desc: "Brzi odgovori na pitanja o refundacijama, slanju ulaznica i radnom vremenu.",
    },
    {
      href: "/terms",
      icon: "verified_user",
      title: "Pravila i sigurnost kupovine",
      desc: "Bezbedno 3D Secure procesiranje platnih kartica i zaštita potrošača.",
    },
  ]

  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList>
        {/* ISTRAŽI */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="h-9 px-3 py-1.5 text-[13px] font-bold uppercase tracking-wider gap-1.5 data-[state=open]:text-primary rounded-xl transition-colors">
            <Icon name="explore" className="size-4 text-primary/70" />
            {dict?.nav?.explore || "Istraži"}
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-[900px] p-6">
              <div className="grid grid-cols-[2fr_1fr_1fr] gap-6">
                {/* Col 1: Featured + Categories */}
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-3 font-semibold text-muted-foreground text-sm">
                      {dict?.nav?.cities || "Istaknuto"}
                    </h4>
                    <div className="space-y-2">
                      {featured ? (
                        <NavigationMenuLink asChild>
                          <Link
                            href={featured.canonicalPath}
                            className="flex flex-row items-start gap-2 rounded-sm p-2 text-sm transition-all outline-none hover:bg-accent hover:text-accent-foreground"
                          >
                            <Icon name="auto_awesome" className="size-5 shrink-0 mt-0.5" />
                            <div>
                              <span className="block font-medium">{featured.name}</span>
                              <span className="block text-muted-foreground">
                                {featured.startingPrice
                                  ? `od ${featured.startingPrice} RSD${featured.description ? ` — ${featured.description}` : ""}`
                                  : featured.description || "Premium ponuda"}
                              </span>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      ) : (
                        <NavigationMenuLink asChild>
                          <Link
                            href="#"
                            className="flex flex-row items-start gap-2 rounded-sm p-2 text-sm text-muted-foreground"
                          >
                            <div>
                              <span className="block font-medium">Premium ponuda</span>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-3 font-semibold text-muted-foreground text-sm">Kategorije</h4>
                    <div className="space-y-2">
                      {categories.map(({ href, icon, label }) => (
                        <NavigationMenuLink key={href} asChild>
                          <Link
                            href={href}
                            className="flex flex-row items-start gap-2 rounded-sm p-2 text-sm transition-all outline-none hover:bg-accent hover:text-accent-foreground"
                          >
                            <Icon name={icon as string} className="size-5 shrink-0 mt-0.5" />
                            <div>
                              <span className="block font-medium">{label}</span>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      ))}
                      <NavigationMenuLink asChild>
                        <Link
                          href="/support"
                          className="flex flex-row items-start gap-2 rounded-sm p-2 text-sm transition-all outline-none hover:bg-accent hover:text-accent-foreground"
                        >
                          <Icon name="help" className="size-5 shrink-0 mt-0.5" />
                          <div>
                            <span className="block font-medium">Korisnička Pomoć</span>
                            <span className="block text-muted-foreground">Refundacije i podrška</span>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </div>
                </div>

                {/* Col 2: Gradovi */}
                <div>
                  <h4 className="mb-3 font-semibold text-muted-foreground text-sm">
                    {dict?.nav?.cities || "Gradovi"}
                  </h4>
                  <div className="space-y-2">
                    {loading ? (
                      <div className="grid grid-cols-2 gap-1.5">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="h-9 rounded-sm bg-muted/50 animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        {sortedCities.slice(0, 10).map((city) => {
                          const isPopular = POPULAR_CITY_SLUGS.includes(city.slug.toLowerCase())
                          return (
                            <NavigationMenuLink key={city.id} asChild>
                              <Link
                                href={`/search?q=${encodeURIComponent(city.name)}`}
                                className={cn(
                                  "flex flex-row items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-all outline-none hover:bg-accent hover:text-accent-foreground",
                                  isPopular && "font-medium"
                                )}
                              >
                                <span
                                  className={cn(
                                    "size-1.5 rounded-full shrink-0",
                                    isPopular ? "bg-primary" : "bg-muted-foreground/40"
                                  )}
                                />
                                <span className="truncate">{city.name}</span>
                              </Link>
                            </NavigationMenuLink>
                          )
                        })}
                        {sortedCities.length > 10 && (
                          <NavigationMenuLink asChild>
                            <Link
                              href="/facilities"
                              className="flex flex-row items-center justify-center rounded-sm px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all outline-none"
                            >
                              +{sortedCities.length - 10} gradova
                            </Link>
                          </NavigationMenuLink>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Col 3: Brzi linkovi */}
                <div>
                  <h4 className="mb-3 font-semibold text-muted-foreground text-sm">Brzi linkovi</h4>
                  <div className="space-y-2">
                    <NavigationMenuLink asChild>
                      <Link
                        href="/support"
                        className="flex flex-row items-start gap-2 rounded-sm p-2 text-sm transition-all outline-none hover:bg-accent hover:text-accent-foreground"
                      >
                        <Icon name="help" className="size-5 shrink-0 mt-0.5" />
                        <div>
                          <span className="block font-medium">Korisnička Pomoć</span>
                          <span className="block text-muted-foreground">Podrška 24/7</span>
                        </div>
                      </Link>
                    </NavigationMenuLink>
                  </div>
                </div>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* ZA BIZNIS */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="h-9 px-3 py-1.5 text-[13px] font-bold uppercase tracking-wider gap-1.5 data-[state=open]:text-primary rounded-xl transition-colors">
            <Icon name="business_center" className="size-4 text-primary/70" />
            Za Biznis
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-[900px] p-6">
              <div className="grid grid-cols-[2fr_1fr_1fr] gap-6">
                {/* Col 1: Scanner */}
                <div>
                  <h4 className="mb-3 font-semibold text-muted-foreground text-sm">Splash Validator</h4>
                  <div className="space-y-2">
                    <div className="flex flex-col items-center gap-3 rounded-sm border bg-muted/10 p-6 text-center">
                      <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon name="qr_code_scanner" className="size-6 text-primary" />
                      </div>
                      <div>
                        <span className="block text-sm font-medium">Skeniranje uspešno</span>
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          Ulaznica #PETR-401A je verifikovana
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                        <Icon name="check_circle" className="size-3" />
                        Validirano
                      </span>
                    </div>
                  </div>
                </div>

                {/* Col 2: Partner Hub */}
                <div>
                  <h4 className="mb-3 font-semibold text-muted-foreground text-sm">Partner Hub</h4>
                  <div className="space-y-2">
                    {partnerLinks.slice(0, 2).map(({ href, icon, title, desc }) => (
                      <NavigationMenuLink key={href} asChild>
                        <Link
                          href={href}
                          className="flex flex-row items-start gap-2 rounded-sm p-2 text-sm transition-all outline-none hover:bg-accent hover:text-accent-foreground"
                        >
                          <Icon name={icon as string} className="size-5 shrink-0 mt-0.5" />
                          <div>
                            <span className="block font-medium">{title}</span>
                            <span className="block text-muted-foreground">{desc}</span>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </div>

                {/* Col 3: API & provizija */}
                <div>
                  <h4 className="mb-3 font-semibold text-muted-foreground text-sm">Integracije</h4>
                  <div className="space-y-2">
                    {partnerLinks.slice(2).map(({ href, icon, title, desc }) => (
                      <NavigationMenuLink key={href} asChild>
                        <Link
                          href={href}
                          className="flex flex-row items-start gap-2 rounded-sm p-2 text-sm transition-all outline-none hover:bg-accent hover:text-accent-foreground"
                        >
                          <Icon name={icon as string} className="size-5 shrink-0 mt-0.5" />
                          <div>
                            <span className="block font-medium">{title}</span>
                            <span className="block text-muted-foreground">{desc}</span>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    ))}
                    <div className="pt-4 mt-4 border-t">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon name="auto_awesome" className="size-3 text-primary" />
                        Provizija samo 5% po prodatoj karti
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* KORISNICI */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="h-9 px-3 py-1.5 text-[13px] font-bold uppercase tracking-wider gap-1.5 data-[state=open]:text-primary rounded-xl transition-colors">
            <Icon name="smartphone" className="size-4 text-primary/70" />
            Korisnici
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-[900px] p-6">
              <div className="grid grid-cols-[2fr_1fr_1fr] gap-6">
                {/* Col 1: Wallet Pass */}
                <div>
                  <h4 className="mb-3 font-semibold text-muted-foreground text-sm">Splash Club</h4>
                  <div className="space-y-2">
                    <div className="flex flex-col items-center gap-3 rounded-sm border bg-muted/10 p-6 text-center">
                      <div className="w-28 aspect-[2/3] rounded-xl bg-gradient-to-b from-primary/10 to-muted border p-3 flex flex-col justify-between shadow-sm">
                        <div className="flex items-center justify-between border-b pb-1.5">
                          <span className="text-[7px] font-bold text-primary uppercase">Splash Club</span>
                          <Icon name="waves" className="size-2.5 text-primary" />
                        </div>
                        <div className="text-center">
                          <span className="text-[6px] font-medium text-muted-foreground uppercase block">Članska Kartica</span>
                          <span className="text-[10px] font-bold uppercase block mt-0.5">PREMIUM PRO</span>
                        </div>
                        <div className="border-t pt-1.5 flex flex-col items-center">
                          <Icon name="qr_code" className="size-6" />
                          <span className="text-[4px] text-muted-foreground mt-0.5">#SPLASH-PASS</span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                        <Icon name="auto_awesome" className="size-3" />
                        Splash Club
                      </span>
                    </div>
                  </div>
                </div>

                {/* Col 2: Korisnički Portal */}
                <div>
                  <h4 className="mb-3 font-semibold text-muted-foreground text-sm">Korisnički Portal</h4>
                  <div className="space-y-2">
                    {userLinks.slice(0, 2).map(({ href, icon, title, desc }) => (
                      <NavigationMenuLink key={href} asChild>
                        <Link
                          href={href}
                          className="flex flex-row items-start gap-2 rounded-sm p-2 text-sm transition-all outline-none hover:bg-accent hover:text-accent-foreground"
                        >
                          <Icon name={icon as string} className="size-5 shrink-0 mt-0.5" />
                          <div>
                            <span className="block font-medium">{title}</span>
                            <span className="block text-muted-foreground">{desc}</span>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </div>

                {/* Col 3: Sigurnost */}
                <div>
                  <h4 className="mb-3 font-semibold text-muted-foreground text-sm">Sigurnost</h4>
                  <div className="space-y-2">
                    {userLinks.slice(2).map(({ href, icon, title, desc }) => (
                      <NavigationMenuLink key={href} asChild>
                        <Link
                          href={href}
                          className="flex flex-row items-start gap-2 rounded-sm p-2 text-sm transition-all outline-none hover:bg-accent hover:text-accent-foreground"
                        >
                          <Icon name={icon as string} className="size-5 shrink-0 mt-0.5" />
                          <div>
                            <span className="block font-medium">{title}</span>
                            <span className="block text-muted-foreground">{desc}</span>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    ))}
                    <div className="pt-4 mt-4 border-t">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon name="waves" className="size-3 text-primary" />
                        100% digitalne ulaznice na telefonu
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* BLOG */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="h-9 px-3 py-1.5 text-[13px] font-bold uppercase tracking-wider gap-1.5 data-[state=open]:text-primary rounded-xl transition-colors">
            <Icon name="article" className="size-4 text-primary/70" />
            Blog
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-[900px] p-6">
              <div className="grid grid-cols-[2fr_1fr_1fr] gap-6">
                {/* Col 1: Kategorije */}
                <div>
                  <h4 className="mb-3 font-semibold text-muted-foreground text-sm">Kategorije</h4>
                  <div className="space-y-2">
                    {[
                      { href: "/blog", icon: "rss_feed", label: "Sve objave", desc: "Najnovije vesti i članci" },
                      { href: "/blog?category=guides", icon: "book", label: "Vodiči", desc: "Kako odabrati i uživati" },
                      { href: "/blog?category=news", icon: "newspaper", label: "Novosti", desc: "Dešavanja i najave" },
                      { href: "/blog?category=reviews", icon: "star", label: "Recenzije", desc: "Utisci sa bazena" },
                    ].map(({ href, icon, label, desc }) => (
                      <NavigationMenuLink key={href} asChild>
                        <Link
                          href={href}
                          className="flex flex-row items-start gap-2 rounded-sm p-2 text-sm transition-all outline-none hover:bg-accent hover:text-accent-foreground"
                        >
                          <Icon name={icon as string} className="size-5 shrink-0 mt-0.5" />
                          <div>
                            <span className="block font-medium">{label}</span>
                            <span className="block text-muted-foreground">{desc}</span>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </div>

                {/* Col 2: Popularne teme */}
                <div>
                  <h4 className="mb-3 font-semibold text-muted-foreground text-sm">Popularne teme</h4>
                  <div className="space-y-2">
                    {[
                      { href: "/blog/akva-parkovi-srbije", label: "Akva Parkovi Srbije" },
                      { href: "/blog/wellness-vodic", label: "Wellness Vodič" },
                      { href: "/blog/porodicni-izleti", label: "Porodični Izleti" },
                    ].map(({ href, label }) => (
                      <NavigationMenuLink key={href} asChild>
                        <Link
                          href={href}
                          className="flex flex-row items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-all outline-none hover:bg-accent hover:text-accent-foreground"
                        >
                          <span className="size-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                          <span>{label}</span>
                        </Link>
                      </NavigationMenuLink>
                    ))}
                    <div className="pt-2 mt-2 border-t">
                      <NavigationMenuLink asChild>
                        <Link
                          href="/blog"
                          className="flex flex-row items-center gap-2 rounded-sm px-2 py-1.5 text-xs font-medium text-primary hover:bg-accent transition-all outline-none"
                        >
                          <Icon name="arrow_forward" className="size-3.5" />
                          Sve objave
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </div>
                </div>

                {/* Col 3: Brzi linkovi */}
                <div>
                  <h4 className="mb-3 font-semibold text-muted-foreground text-sm">Sadržaj</h4>
                  <div className="space-y-2">
                    <NavigationMenuLink asChild>
                      <Link
                        href="/blog"
                        className="flex flex-row items-start gap-2 rounded-sm p-2 text-sm transition-all outline-none hover:bg-accent hover:text-accent-foreground"
                      >
                        <Icon name="rss_feed" className="size-5 shrink-0 mt-0.5" />
                        <div>
                          <span className="block font-medium">Početna Blog</span>
                          <span className="block text-muted-foreground">Svi članci i vodiči</span>
                        </div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/blog/feed.xml"
                        className="flex flex-row items-start gap-2 rounded-sm p-2 text-sm transition-all outline-none hover:bg-accent hover:text-accent-foreground"
                      >
                        <Icon name="rss_feed" className="size-5 shrink-0 mt-0.5" />
                        <div>
                          <span className="block font-medium">RSS Feed</span>
                          <span className="block text-muted-foreground">Pratite putem RSS-a</span>
                        </div>
                      </Link>
                    </NavigationMenuLink>
                  </div>
                </div>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
