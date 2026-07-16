import { StatsGrid } from "@/components/ui/StatsGrid";

type HomeDict = Record<string, string>;

export function HomeExperienceStats({
  dict,
  metrics,
}: {
  dict: HomeDict;
  metrics: {
    activeFacilities: number;
    avgDiscountPercent: number;
  };
}) {
  const facilityCount = Math.max(metrics.activeFacilities, 1);
  const savings = metrics.avgDiscountPercent > 0 ? metrics.avgDiscountPercent : 15;

  return (
    <section className="border-border mx-auto max-w-7xl border-t px-6 py-12 sm:py-20 md:px-12">
      <div className="mb-10 text-center sm:mb-14">
        <h2 className="mb-4 text-[clamp(2rem,6vw,3.5rem)] leading-[0.95] font-black tracking-tighter uppercase italic">
          {dict.experience_title_base}
          <span className="text-primary">{dict.experience_title_highlight}</span>
        </h2>
        <p className="text-muted-foreground mx-auto max-w-2xl text-base leading-relaxed sm:text-lg">
          {dict.experience_desc}
        </p>
      </div>

      <StatsGrid
        stats={[
          {
            id: "savings",
            label: dict.stat1_label,
            value: String(savings),
            suffix: "%",
            sublabel: dict.stat1_sub,
          },
          {
            id: "delivery",
            label: dict.stat2_label,
            staticDisplay: dict.stat2_display || "<5s",
            sublabel: dict.stat2_sub,
          },
          {
            id: "facilities",
            label: dict.stat3_label,
            value: String(facilityCount),
            sublabel: dict.stat3_sub,
          },
          {
            id: "support",
            label: dict.stat4_label,
            staticDisplay: dict.stat4_display || "24/7",
            sublabel: dict.stat4_sub,
          },
        ]}
      />
    </section>
  );
}
