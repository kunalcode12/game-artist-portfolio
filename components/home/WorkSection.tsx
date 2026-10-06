"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { CardData } from "@/lib/cards";
import type { Category } from "@/lib/projects";
import { cn, pad } from "@/lib/utils";
import { ProjectCard } from "./ProjectCard";

type Filter = "All" | Category;

/** Bento rhythm for the full list: wide/narrow pairs, then an even pair. */
const ALL_LAYOUT = [
  { span: "lg:col-span-7", media: "aspect-[16/10]", sizes: "(min-width: 1024px) 56vw, 100vw" },
  { span: "lg:col-span-5", media: "aspect-[16/10] lg:aspect-[8/7]", sizes: "(min-width: 1024px) 40vw, 100vw" },
  { span: "lg:col-span-5", media: "aspect-[16/10] lg:aspect-[8/7]", sizes: "(min-width: 1024px) 40vw, 100vw" },
  { span: "lg:col-span-7", media: "aspect-[16/10]", sizes: "(min-width: 1024px) 56vw, 100vw" },
  { span: "lg:col-span-6", media: "aspect-[16/10]", sizes: "(min-width: 1024px) 48vw, 100vw" },
  { span: "lg:col-span-6", media: "aspect-[16/10]", sizes: "(min-width: 1024px) 48vw, 100vw" },
];

export function WorkSection({ cards, counts }: { cards: CardData[]; counts: Record<Category, number> }) {
  const [filter, setFilter] = useState<Filter>("All");
  const visible = filter === "All" ? cards : cards.filter((c) => c.category === filter);
  const filters: { id: Filter; count: number }[] = [
    { id: "All", count: cards.length },
    ...(Object.keys(counts) as Category[]).map((c) => ({ id: c, count: counts[c] })),
  ];

  const layoutFor = (i: number) => {
    if (filter === "All") return ALL_LAYOUT[i % ALL_LAYOUT.length];
    if (visible.length === 1) return { span: "lg:col-span-12", media: "aspect-[16/10] lg:aspect-[21/9]", sizes: "100vw" };
    return { span: "lg:col-span-6", media: "aspect-[16/10]", sizes: "(min-width: 1024px) 48vw, 100vw" };
  };

  return (
    <section id="work" className="relative py-28 sm:py-36" aria-labelledby="work-title">
      <div className="shell">
        <SectionHeading
          index="01"
          kicker={`Portfolio showcase // ${pad(cards.length)} assets`}
          title="Selected Work"
          aside={
            <LayoutGroup id="filters">
              <div role="tablist" aria-label="Filter projects by category" className="flex flex-wrap gap-1 border border-line-2 bg-white/[0.02] p-1">
                {filters.map((f) => {
                  const on = filter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => setFilter(f.id)}
                      className={cn("label relative px-3.5 py-2.5 transition-colors", on ? "text-black" : "text-ink-2 hover:text-ink")}
                    >
                      {on && <motion.span layoutId="filter-pill" className="absolute inset-0 bg-accent" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                      <span className="relative">
                        {f.id}
                        <sup className={cn("ml-1 text-[9px]", on ? "text-black/70" : "text-mute")}>{f.count}</sup>
                      </span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>
          }
        >
          Hard-surface props, vehicles, weapons and environments — each built high-to-low in Maya, baked and textured in Substance 3D Painter and rendered in Arnold.{" "}
          <span className="text-ink">Hover a card to scrub through its render passes.</span>
        </SectionHeading>

        <motion.div layout className="mt-16 grid grid-cols-1 gap-6 sm:mt-20 lg:grid-cols-12 lg:gap-7">
          <AnimatePresence mode="popLayout">
            {visible.map((card, i) => {
              const l = layoutFor(i);
              return (
                <motion.div
                  key={card.slug}
                  layout="position"
                  className={l.span}
                  initial={{ opacity: 0, y: 40, scale: 0.98 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.25 } }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: (i % 2) * 0.08 }}
                >
                  <ProjectCard card={card} sizes={l.sizes} mediaClass={l.media} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
