import { Icon } from "@/components/ui/Icon";

type HomeDict = Record<string, string>;

export function HomeHowItWorks({ dict }: { dict: HomeDict }) {
  const steps = [
    { step: "1", title: dict.step1_title, desc: dict.step1_desc, icon: "location_on" },
    { step: "2", title: dict.step2_title, desc: dict.step2_desc, icon: "shopping_bag" },
    { step: "3", title: dict.step3_title, desc: dict.step3_desc, icon: "qr_code_scanner" },
  ];

  return (
    <section className="border-border mx-auto max-w-7xl border-t px-6 py-12 sm:py-20 md:px-12">
      <div className="mb-10 text-center sm:mb-14">
        <h2 className="mb-3 text-[clamp(2rem,6vw,3.5rem)] leading-[0.95] font-black tracking-tighter uppercase italic">
          {dict.steps_title_base}
          <span className="text-primary">{dict.steps_title_highlight}</span>
        </h2>
        <p className="text-muted-foreground font-medium">{dict.steps_subtitle}</p>
      </div>

      <ol className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
        {steps.map((item) => (
          <li key={item.step} className="relative text-center md:text-left">
            <span className="text-primary/15 pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 text-6xl font-black select-none md:left-0 md:translate-x-0">
              {item.step}
            </span>
            <div className="relative z-10 pt-6">
              <div className="bg-primary/10 mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl md:mx-0">
                <Icon name={item.icon} className="text-primary text-[24px]" />
              </div>
              <h3 className="mb-2 text-xl font-black tracking-tight uppercase italic">
                {item.title}
              </h3>
              <p className="text-muted-foreground mx-auto max-w-xs text-sm leading-relaxed md:mx-0">
                {item.desc}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
