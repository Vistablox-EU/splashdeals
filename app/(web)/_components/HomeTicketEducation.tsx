import { Icon } from "@/components/ui/Icon";

type HomeDict = Record<string, string>;

const ITEMS = [
  { icon: "verified", key: "edu_1" },
  { icon: "qr_code", key: "edu_2" },
  { icon: "apartment", key: "edu_3" },
  { icon: "phone", key: "edu_4" },
] as const;

export function HomeTicketEducation({ dict }: { dict: HomeDict }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-8 md:px-12">
      <h2 className="text-muted-foreground mb-4 text-center text-[10px] font-black tracking-[0.25em] uppercase">
        {dict.edu_title}
      </h2>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ITEMS.map((item) => (
          <li
            key={item.key}
            className="border-border bg-muted/20 flex items-center gap-2 rounded-xl border px-3 py-3"
          >
            <Icon name={item.icon} className="text-primary shrink-0 text-[18px]" />
            <span className="text-foreground text-[11px] leading-snug font-bold">
              {dict[item.key]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
