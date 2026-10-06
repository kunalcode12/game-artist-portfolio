"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useRef } from "react";

export type Stat = { value: number; suffix?: string; pad?: boolean; label: string; note: string };

const fmt = (v: number, padded: boolean) => (padded ? String(Math.round(v)).padStart(2, "0") : String(Math.round(v)));

function Counter({ stat, start }: { stat: Stat; start: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const padded = stat.pad ?? true;
  useEffect(() => {
    if (!start || !ref.current) return;
    const el = ref.current;
    const controls = animate(0, stat.value, {
      duration: 2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = fmt(v, padded);
      },
    });
    return () => controls.stop();
  }, [start, stat.value, padded]);
  return (
    <span ref={ref} className="tabular-nums">
      {fmt(stat.value, padded)}
    </span>
  );
}

/** End-of-level style stats — every number is derived from the actual asset data. */
export function Stats({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });

  return (
    <section aria-label="By the numbers" className="relative border-b border-line">
      <div ref={ref} className="shell grid grid-cols-2 md:grid-cols-5">
        {stats.map((s, i) => (
          <div key={s.label} className={`group relative flex flex-col gap-3 border-line py-10 sm:py-14 ${i > 0 ? "md:border-l md:pl-8" : ""} ${i % 2 === 1 ? "border-l pl-6 md:pl-8" : ""} ${i >= 2 ? "border-t md:border-t-0" : ""}`}>
            <span className="label-sm text-mute">{String(i + 1).padStart(2, "0")} / {s.label}</span>
            <span className="display flex items-start text-[clamp(3.4rem,6vw,6rem)] text-ink">
              <Counter stat={s} start={inView} />
              {s.suffix && <span className="ml-1 mt-[0.12em] text-[0.42em] text-accent">{s.suffix}</span>}
            </span>
            <span className="text-sm text-mute">{s.note}</span>
            <span className="absolute bottom-0 left-0 h-px w-0 bg-accent transition-[width] duration-700 group-hover:w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}
