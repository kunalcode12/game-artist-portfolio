"use client";

import { ArrowDown, FileText } from "lucide-react";
import { motion, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useBoot } from "@/components/providers/BootProvider";
import { BtnLink } from "@/components/ui/Button";
import { FadeUp, ScrambleText, SplitChars } from "@/components/ui/Reveal";
import { useIdle } from "@/lib/hooks";
import { site } from "@/lib/site";
import { HeroViewport, type HeroSlide } from "./HeroViewport";

const HeroBackdrop = dynamic(() => import("@/components/three/HeroBackdrop"), { ssr: false });

const NAME_CLASS =
  "display block text-ink text-[clamp(4.6rem,21vw,7rem)] sm:text-[clamp(6rem,15vw,9rem)] lg:text-[clamp(5rem,min(10.4vw,16.5vh),11.5rem)]";

export function Hero({ slides }: { slides: HeroSlide[] }) {
  const { booted } = useBoot();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);
  const idle = useIdle();
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -140]);
  // fade late: on phones the stacked hero is taller than the screen and the viewport sits low
  const fade = useTransform(scrollYProgress, [0.5, 0.95], [1, 0]);

  return (
    <section ref={ref} id="top" className="relative overflow-hidden" aria-label="Introduction">
      <div className="absolute inset-0" aria-hidden>
        <div className="absolute inset-x-0 top-[38%] h-[60%] bg-[radial-gradient(ellipse_at_center,rgba(255,140,40,0.11),transparent_62%)]" />
        {idle && (
          <div className="absolute inset-0 animate-[fade-in_1.6s_ease-out_both]">
            <HeroBackdrop active={inView} still={reduced ?? false} />
          </div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,6,7,0.92)_0%,rgba(6,6,7,0.55)_38%,rgba(6,6,7,0)_70%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent" />
      </div>

      <motion.div style={{ y, opacity: fade }} className="shell relative z-10 grid min-h-[100svh] grid-cols-1 items-center gap-12 pb-24 pt-28 lg:grid-cols-12 lg:gap-6 lg:pb-20 lg:pt-24">
        <div className="lg:col-span-5">
          <FadeUp trigger={booted} y={12}>
            <p className="label flex flex-wrap items-center gap-x-3 gap-y-2 text-ink-2">
              <span className="pulse-dot size-2 rounded-full bg-accent" />
              {site.location}
              <span className="text-dim">·</span>
              <span className="text-accent">{site.availability}</span>
            </p>
          </FadeUp>

          <h1 className="mt-6" aria-label={`${site.name}, ${site.role}`}>
            <SplitChars text={site.firstName} className={NAME_CLASS} trigger={booted} delay={0.1} stagger={0.045} />
            <SplitChars text={site.lastName} className={NAME_CLASS} trigger={booted} delay={0.28} stagger={0.045} />
          </h1>

          <div className="mt-5 flex items-center gap-4">
            <span className="h-px w-10 bg-accent" />
            <ScrambleText text={site.role} trigger={booted} delay={0.55} className="display-wide text-gradient-accent text-[clamp(1.5rem,2.5vw,2.5rem)] leading-none" />
          </div>

          <FadeUp trigger={booted} delay={0.7}>
            <p className="label mt-5 flex flex-wrap gap-x-3 gap-y-1.5 text-ink-2">
              {site.specialties.map((s, i) => (
                <span key={s} className="flex items-center gap-3">
                  {i > 0 && <span className="text-accent">/</span>}
                  {s}
                </span>
              ))}
            </p>
            <p className="mt-6 max-w-xl text-[clamp(1.02rem,1.25vw,1.22rem)] leading-relaxed text-ink-2">
              I create detailed, game-ready hard-surface assets with a focus on clean topology, optimized geometry, UVs, baking and{" "}
              <span className="text-ink">PBR texturing</span>.
            </p>
          </FadeUp>

          <FadeUp trigger={booted} delay={0.85} className="mt-9 flex flex-wrap items-center gap-3">
            <BtnLink href="/#work" variant="primary" data-cursor="lock">
              View selected work <ArrowDown size={15} />
            </BtnLink>
            <BtnLink href={site.resumeUrl ?? "/#resume"} external={!!site.resumeUrl} variant="outline" data-cursor="lock">
              <FileText size={15} /> Resume
            </BtnLink>
          </FadeUp>

          <FadeUp trigger={booted} delay={1} className="mt-10 border-t border-line pt-5">
            <p className="label-sm text-mute">Primary pipeline</p>
            <p className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-ink-2">
              {site.pipeline.map((s, i) => (
                <span key={s} className="flex items-center gap-4">
                  {i > 0 && <span className="text-dim">·</span>}
                  {s}
                </span>
              ))}
            </p>
          </FadeUp>
        </div>

        <motion.div
          className="lg:col-span-7 lg:-mr-[clamp(1rem,4vw,4.5rem)] lg:pl-6"
          initial={{ opacity: 0, x: 60, scale: 0.97 }}
          animate={booted ? { opacity: 1, x: 0, scale: 1 } : undefined}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
        >
          <HeroViewport slides={slides} booted={booted} />
        </motion.div>
      </motion.div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
        <div className="shell flex items-end justify-between pb-6">
          <div className="flex items-center gap-3">
            <span className="relative block h-10 w-px overflow-hidden bg-white/15">
              <span className="absolute inset-x-0 top-0 h-1/2 bg-accent" style={{ animation: "scan-y 1.8s ease-in-out infinite" }} />
            </span>
            <span className="label-sm text-mute">Scroll to explore</span>
          </div>
          <PointerReadout />
        </div>
      </div>
    </section>
  );
}

/** Live cursor coordinates, like a DCC status bar. Writes straight to the DOM. */
function PointerReadout() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!ref.current) return;
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -((e.clientY / window.innerHeight) * 2 - 1);
      ref.current.textContent = `X ${x >= 0 ? "+" : ""}${x.toFixed(3)}  Y ${y >= 0 ? "+" : ""}${y.toFixed(3)}  Z +0.000`;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return (
    <span ref={ref} className="label-sm hidden whitespace-pre text-dim tabular-nums md:block">
      X +0.000 Y +0.000 Z +0.000
    </span>
  );
}
