import { Icon } from "@/components/ui/Icon";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HomeCategoryRail } from "./HomeCategoryRail";
import { HomeQuickFilters } from "./HomeQuickFilters";

type HomeDict = Record<string, string>;

export function HomeHero({ dict }: { dict: HomeDict }) {
  return (
    <div className="relative z-0 w-full overflow-hidden pb-16 sm:pb-20">
      <section className="relative mx-auto max-w-7xl px-6 pt-28 pb-8 sm:px-12">
        <div className="flex flex-col items-center text-center">
          {dict.price_promise ? (
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 text-primary mb-6 px-3 py-1 text-[10px] font-black tracking-widest uppercase"
            >
              {dict.price_promise}
            </Badge>
          ) : null}

          <h1 className="from-foreground via-foreground/90 to-foreground/60 mb-6 bg-gradient-to-b bg-clip-text text-[clamp(3.5rem,12vw,10rem)] leading-[0.85] font-black tracking-tighter text-transparent sm:mb-10">
            {dict.title_digital} <br className="hidden sm:block" />
            <span className="text-primary italic">{dict.title_splash}</span>
          </h1>

          <p className="text-muted-foreground mx-auto mb-8 max-w-3xl text-[clamp(1.125rem,3vw,1.5rem)] leading-relaxed font-medium sm:mb-12">
            {dict.subtitle}
          </p>

          <div className="mb-10 flex flex-col items-center gap-4 sm:mb-12 sm:flex-row sm:gap-6">
            <Button
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[240px] rounded-full px-12 py-6 transition-colors duration-150"
            >
              <Link
                href="#inventory"
                className="flex h-full w-full items-center justify-center gap-2"
              >
                {dict.facilities_btn}
                <Icon name="arrow_forward" className="text-[20px]" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="rounded-full px-8 py-6 text-xs font-black tracking-widest uppercase"
            >
              <Link href="/how-it-works">{dict.how_it_works}</Link>
            </Button>
          </div>

          <HomeCategoryRail ariaLabel={dict.categories_aria} />
          <div className="mt-6">
            <HomeQuickFilters dict={dict} />
          </div>
        </div>
      </section>

      <div className="pointer-events-none absolute bottom-0 left-0 z-0 w-full overflow-hidden leading-[0] opacity-40 select-none">
        <svg
          className="relative block h-[100px] w-[calc(150%+1.3px)] sm:h-[120px]"
          preserveAspectRatio="none"
          shapeRendering="auto"
          viewBox="0 24 150 28"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <defs>
            <path
              d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
              id="gentle-wave"
            />
          </defs>
          <g className="text-primary">
            <use href="#gentle-wave" x="48" y="0" fill="currentColor" className="text-primary/20" />
            <use href="#gentle-wave" x="48" y="3" fill="currentColor" className="text-primary/30" />
            <use href="#gentle-wave" x="48" y="5" fill="currentColor" className="text-primary/50" />
            <use href="#gentle-wave" x="48" y="7" fill="currentColor" className="text-primary" />
          </g>
        </svg>
      </div>
    </div>
  );
}
