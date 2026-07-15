import { Icon } from "@/components/ui/Icon";

/** Maps amenity icon names (seed data / lucide-ish) to Material Icon symbols. */
export const AMENITY_MATERIAL_ICON_MAP: Record<string, string> = {
  Waves: "waves",
  Droplets: "water_drop",
  Sun: "wb_sunny",
  Flame: "local_fire_department",
  ShieldAlert: "verified_user",
  Clock: "schedule",
  Utensils: "restaurant",
  Wifi: "wifi",
  Coffee: "local_cafe",
  Wind: "air",
  wind: "air",
  Car: "directions_car",
  car: "directions_car",
};

export function AmenityIcon({ iconName, className }: { iconName: string; className?: string }) {
  const symbol = AMENITY_MATERIAL_ICON_MAP[iconName] || "circle";
  return <Icon name={symbol} className={className} />;
}
