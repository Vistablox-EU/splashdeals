"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { ExplorePanel } from "./ExplorePanel";
import { BusinessPanel } from "./BusinessPanel";
import { UsersPanel } from "./UsersPanel";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@/components/ui/navigation-menu";


interface City {
  id: string;
  name: string;
  slug: string;
}

interface FeaturedFacility {
  id: string;
  name: string;
  slug: string;
  category: string;
  city: string;
  canonicalPath: string;
  imageUrl: string;
  startingPrice: number | null;
  description: string;
}

interface DiscoveryMenuData {
  cities: City[];
  featured: FeaturedFacility | null;
}

interface MegaMenuProps {
  dict: any;
}

/**
 * 🏙️ Premium Navigation Bar — shadcn NavigationMenu (Radix UI) based
 */
export function MegaMenu({ dict }: MegaMenuProps) {
  const [data, setData] = useState<DiscoveryMenuData>({ cities: [], featured: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiscoveryData = async () => {
      try {
        const response = await fetch("/api/menu/discovery");
        const payload = await response.json();
        if (payload) {
          setData({
            cities: payload.cities || [],
            featured: payload.featured || null,
          });
        }
      } catch (error) {
        console.error("🌋 Header Discovery API Failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDiscoveryData();
  }, []);

  const handleClose = () => {
    // NavigationMenu handles its own close state via Radix UI
  };

  const menuItems = [
    {
      label: dict?.nav?.explore || "Istraži",
      icon: "explore",
      content: (
        <ExplorePanel
          featured={data.featured}
          cities={data.cities}
          loading={loading}
          dict={dict}
          onClose={handleClose}
        />
      ),
      width: "w-[1260px] -translate-x-[22%]",
    },
    {
      label: "Za Biznis",
      icon: "business_center",
      content: <BusinessPanel dict={dict} onClose={handleClose} />,
      width: "w-[960px] -translate-x-[38%]",
    },
    {
      label: "Korisnici",
      icon: "smartphone",
      content: <UsersPanel dict={dict} onClose={handleClose} />,
      width: "w-[800px] -translate-x-[52%]",
    },
  ];

  return (
    <NavigationMenu
      viewport={false}
      className="hidden md:flex items-center gap-2 relative"
    >
      <NavigationMenuList className="flex items-center gap-2 p-2 relative transition-all duration-500">
        {menuItems.map((item, idx) => (
          <NavigationMenuItem
            key={idx}
            className="relative px-8 py-4 flex items-center"
          >
            <NavigationMenuTrigger
              className={cn(
                "relative z-10 text-[13px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center gap-3 select-none outline-none cursor-pointer h-auto px-0 py-0 rounded-none bg-transparent hover:bg-transparent focus:bg-transparent focus-visible:ring-0 focus-visible:outline-none data-open:bg-transparent data-popup-open:bg-transparent data-[state=open]:bg-transparent group",
                "text-slate-400 hover:text-slate-200 data-[state=open]:text-white"
              )}
            >
              <Icon
                name={item.icon}
                className="text-[18px] transition-colors text-primary/60 group-data-[state=open]:text-primary"
              />
              {item.label}
            </NavigationMenuTrigger>

            <NavigationMenuContent
              className={cn(
                '!absolute top-full mt-6 bg-background border border-white/10 shadow-[0_28px_70px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.06)] rounded-[2.5rem] z-[120] outline-none overflow-hidden !p-0',
                "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
                item.width
              )}
            >
              <div className="p-11">{item.content}</div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
