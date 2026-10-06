"use client";

import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useAchievements } from "@/components/providers/AchievementsProvider";
import { TransitionLink } from "@/components/providers/TransitionProvider";
import { FadeUp, ScrambleText, SplitChars } from "@/components/ui/Reveal";

export function ProjectHeader({
  index,
  total,
  title,
  kicker,
  category,
  discipline,
  chips,
  summary,
}: {
  index: string;
  total: number;
  title: string;
  kicker: string;
  category: string;
  discipline: string;
  chips: { label: string; accent?: boolean }[];
  summary: string;
}) {
  const { unlock } = useAchievements();
  useEffect(() => {
    unlock("explorer");
  }, [unlock]);

  return (
    <header className="shell pt-28 sm:pt-32">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <TransitionLink href="/#work" label="Home base" scroll={false} className="label group flex items-center gap-2 text-ink-2 transition-colors hover:text-accent">
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" /> Back to all projects
        </TransitionLink>
        <p className="label-sm flex items-center gap-2 text-mute">
          <span className="text-accent">{category}</span> / {discipline} <span className="text-dim">·</span>
          <span className="tabular-nums">
            {index} / {String(total).padStart(2, "0")}
          </span>
        </p>
      </div>

      <div className="mt-10 sm:mt-12">
        <p className="label flex items-center gap-3 text-ink-2">
          <span className="h-px w-10 bg-accent" />
          <ScrambleText text={kicker} className="text-accent" />
        </p>
        <SplitChars as="h1" text={title} className="display mt-4 block text-[clamp(3.4rem,min(10vw,17vh),11rem)] text-ink" stagger={0.03} />
        <div className="mt-7 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <FadeUp delay={0.3} className="max-w-2xl text-[clamp(1.05rem,1.4vw,1.35rem)] leading-relaxed text-ink-2">
            {summary}
          </FadeUp>
          <FadeUp delay={0.45} className="flex flex-wrap gap-2 lg:max-w-[46%] lg:justify-end">
            {chips.map((c) => (
              <span key={c.label} className={c.accent ? "label-sm border border-accent/60 bg-accent/10 px-2.5 py-1.5 text-accent" : "label-sm border border-line-2 px-2.5 py-1.5 text-ink-2"}>
                {c.label}
              </span>
            ))}
          </FadeUp>
        </div>
      </div>
    </header>
  );
}
