"use client";

import { useLenis } from "lenis/react";
import { ArrowDown } from "lucide-react";
import { AnimatePresence, motion, useInView, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { segment, STAGES, type PipelineAsset } from "@/lib/pipeline";
import { cn, pad } from "@/lib/utils";

const PipelineCanvas = dynamic(() => import("@/components/three/PipelineCanvas"), { ssr: false });

const N = STAGES.length;

export function Pipeline({ assets }: { assets: PipelineAsset[] }) {
  const track = useRef<HTMLDivElement>(null);
  const mounted = useInView(track, { once: true, margin: "600px 0px" });
  const near = useInView(track, { margin: "120px 0px" });
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
  const stage = useTransform(scrollYProgress, [0, 1], [0, N - 1]);
  const bar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const [active, setActive] = useState(0);
  const [assetIdx, setAssetIdx] = useState(0);
  const lenis = useLenis();
  const asset = assets[assetIdx];

  useMotionValueEvent(stage, "change", (v) => {
    const { from, to, wipe } = segment(v, N);
    setActive(wipe > 0.5 ? to : from);
  });

  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const run = el.offsetHeight - window.innerHeight;
    const p = i >= N - 1 ? 1 : (i + 0.12) / (N - 1);
    lenis?.scrollTo(top + p * run, { duration: 1.4 });
  };

  const s = STAGES[active];

  return (
    <section id="workflow" className="relative border-t border-line bg-bg-2" aria-label="Asset workflow">
      <div className="shell pt-28 sm:pt-36">
        <SectionHeading index="03" kicker="Production pipeline" title="Asset Workflow">
          Every asset moves through the same seven-stage pipeline. Scroll to run it on a real asset —{" "}
          <span className="text-ink">these are the actual render passes and texture maps, not mock-ups.</span>
        </SectionHeading>
      </div>

      <div ref={track} className="relative" style={{ height: `${N * 75 + 25}vh` }}>
        <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
          <div className="shell grid w-full items-center gap-6 lg:grid-cols-12 lg:gap-10">
            {/* stage list (desktop) */}
            <ol className="hidden lg:col-span-4 lg:block">
              {STAGES.map((st, i) => {
                const on = i === active;
                return (
                  <li key={st.title}>
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      aria-current={on ? "step" : undefined}
                      className="group relative flex w-full items-start gap-5 border-t border-line py-[clamp(0.55rem,1.5vh,1rem)] text-left"
                    >
                      <span className={cn("absolute -left-4 top-0 h-full w-[2px] origin-top transition-transform duration-500", on ? "scale-y-100 bg-accent" : "scale-y-0 bg-accent")} />
                      <span className={cn("display w-12 text-[clamp(1.4rem,2.2vw,2.1rem)] tabular-nums transition-colors", on ? "text-accent" : "text-mute group-hover:text-ink-2")}>
                        {pad(i + 1)}
                      </span>
                      <span className="flex-1">
                        <span className={cn("display block text-[clamp(1.4rem,2.2vw,2.1rem)] transition-colors", on ? "text-ink" : "text-mute group-hover:text-ink-2")}>{st.title}</span>
                        <AnimatePresence initial={false}>
                          {on && (
                            <motion.span
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                              className="block overflow-hidden"
                            >
                              <span className="block pt-2 text-[15px] leading-relaxed text-mute">{st.body}</span>
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            {/* viewport */}
            <div className="lg:col-span-8">
              <div className="relative aspect-[16/11] max-h-[62svh] w-full overflow-hidden border border-line-2 bg-black sm:aspect-[16/10] lg:max-h-[74svh]">
                {mounted && <PipelineCanvas stages={asset.stages} stage={stage} active={near} />}
                <div className="scanlines pointer-events-none absolute inset-0 opacity-40" />
                <div className="hud-corners pointer-events-none absolute inset-3" />

                <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-1.5 sm:left-6 sm:top-6">
                  <span className="label-sm flex items-center gap-2 bg-black/60 px-2 py-1 text-ink backdrop-blur-sm">
                    <span className="size-1.5 animate-pulse rounded-full bg-accent" /> Stage {pad(active + 1)} / {pad(N)}
                  </span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={active}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.25 }}
                      className="display bg-black/50 px-2 py-1 text-2xl text-ink backdrop-blur-sm sm:text-4xl"
                    >
                      {s.title}
                    </motion.span>
                  </AnimatePresence>
                </div>

                <div className="absolute right-4 top-4 flex border border-line-2 bg-black/60 backdrop-blur-md sm:right-6 sm:top-6" role="group" aria-label="Pipeline asset">
                  {assets.map((a, i) => (
                    <button
                      key={a.slug}
                      type="button"
                      onClick={() => setAssetIdx(i)}
                      aria-pressed={i === assetIdx}
                      className={cn("label-sm px-2.5 py-2 transition-colors sm:px-3", i === assetIdx ? "bg-accent text-black" : "text-ink-2 hover:text-ink")}
                    >
                      {a.title}
                    </button>
                  ))}
                </div>

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 pb-4 pt-12 sm:px-6 sm:pb-5">
                  <div className="mb-3 flex items-end justify-between gap-4">
                    <span className="label-sm text-ink-2">
                      Shading <span className="text-accent">·</span> {s.shading}
                    </span>
                    <span className="label-sm hidden text-mute sm:block">
                      {asset.title}
                      {asset.tris ? ` · ${asset.tris}` : ""}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="flex gap-1">
                      {STAGES.map((st, i) => (
                        <button key={st.title} type="button" onClick={() => goTo(i)} className="group flex flex-1 flex-col gap-1.5 text-left" aria-label={`Jump to ${st.title}`}>
                          <span className="h-[3px] w-full bg-white/15" />
                          <span className={cn("label-sm hidden truncate text-[9px] transition-colors md:block", i === active ? "text-accent" : "text-mute group-hover:text-ink-2")}>{st.title}</span>
                        </button>
                      ))}
                    </div>
                    <motion.span className="pointer-events-none absolute left-0 top-0 h-[3px] bg-accent shadow-[0_0_10px_rgba(255,166,48,0.8)]" style={{ width: bar }} />
                  </div>
                </div>
              </div>

              {/* active stage copy (mobile) */}
              <div className="mt-5 lg:hidden">
                <AnimatePresence mode="wait">
                  <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                    <p className="label text-accent">
                      {pad(active + 1)} — {s.title}
                    </p>
                    <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{s.body}</p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <p className="label-sm mt-4 hidden items-center justify-end gap-2 text-mute lg:flex">
                Scroll to run the pipeline <ArrowDown size={12} className="animate-bounce" />
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
