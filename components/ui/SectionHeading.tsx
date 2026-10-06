"use client";

import { motion, useInView } from "motion/react";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FadeUp, ScrambleText, SplitChars } from "./Reveal";

export function SectionHeading({
  index,
  kicker,
  title,
  children,
  aside,
  className,
}: {
  index: string;
  kicker: string;
  title: string;
  children?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });

  return (
    <div ref={ref} className={cn("relative", className)}>
      <div className="mb-6 flex items-center gap-4">
        <span className="label text-ink-2 tabular-nums">[{index}]</span>
        <motion.span
          className="h-px w-16 origin-left bg-accent"
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : undefined}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
        <ScrambleText text={kicker} className="label text-accent" trigger={inView} />
      </div>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          <SplitChars as="h2" text={title} className="display text-[clamp(3.2rem,8.6vw,9rem)] text-ink" trigger={inView} />
          {children && (
            <FadeUp trigger={inView} delay={0.35} className="mt-6 max-w-2xl text-[clamp(1rem,1.25vw,1.2rem)] leading-relaxed text-ink-2">
              {children}
            </FadeUp>
          )}
        </div>
        {aside && (
          <FadeUp trigger={inView} delay={0.5} className="shrink-0">
            {aside}
          </FadeUp>
        )}
      </div>
    </div>
  );
}
