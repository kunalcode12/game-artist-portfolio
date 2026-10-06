"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useInView, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { useAchievements } from "@/components/providers/AchievementsProvider";
import { useDisplayMode } from "@/components/providers/DisplayModeProvider";
import { TransitionLink } from "@/components/providers/TransitionProvider";
import type { LensPointer } from "@/components/three/LensCanvas";
import { AxisGizmo } from "@/components/ui/Icons";
import type { Img } from "@/lib/projects";
import { cn, pad } from "@/lib/utils";

const LensCanvas = dynamic(() => import("@/components/three/LensCanvas"), { ssr: false });

export type LensPass = "wire" | "ao" | "normal" | "id";
const LENS_PASSES: { id: LensPass; label: string; key: string }[] = [
  { id: "wire", label: "Wire", key: "W" },
  { id: "ao", label: "AO", key: "A" },
  { id: "normal", label: "Nrm", key: "N" },
  { id: "id", label: "ID", key: "I" },
];

export type HeroSlide = {
  slug: string;
  index: string;
  title: string;
  category: string;
  tris?: string;
  camera: string;
  poster: Img;
  base: string;
  passes: Partial<Record<LensPass, string>>;
};

const SLIDE_MS = 7000;

export function HeroViewport({ slides, booted }: { slides: HeroSlide[]; booted: boolean }) {
  const [target, setTarget] = useState(0);
  const [shown, setShown] = useState(-1);
  const [pass, setPass] = useState<LensPass>("wire");
  const [hover, setHover] = useState(false);
  const pointer = useRef<LensPointer>({ x: 0.5, y: 0.5, inside: false });
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "120px" });
  const reduced = useReducedMotion();
  const { mode, setMode } = useDisplayMode();
  const { unlock } = useAchievements();

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 120, damping: 18 });
  const sry = useSpring(ry, { stiffness: 120, damping: 18 });

  const current = slides[Math.max(0, shown)];
  const passOf = (s: HeroSlide) => (s.passes[pass] ? pass : (LENS_PASSES.find((p) => s.passes[p.id])?.id ?? "ao"));
  const activePass = passOf(current);

  const lensSlides = useMemo(
    () => slides.map((s) => ({ base: s.base, pass: s.passes[s.passes[pass] ? pass : (LENS_PASSES.find((p) => s.passes[p.id])?.id ?? "ao")]! })),
    [slides, pass]
  );

  // autoplay — pauses while the visitor is scanning
  useEffect(() => {
    if (!booted || !inView || hover || reduced || shown < 0) return;
    const t = setTimeout(() => setTarget((shown + 1) % slides.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [booted, inView, hover, reduced, shown, slides.length]);

  useEffect(() => {
    if (!hover) return;
    const t = setTimeout(() => unlock("scanner"), 1500);
    return () => clearTimeout(t);
  }, [hover, unlock]);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    pointer.current = { x, y: 1 - y, inside: true };
    if (e.pointerType === "mouse") {
      rx.set((0.5 - y) * 6);
      ry.set((x - 0.5) * 8);
    }
  };
  const onLeave = () => {
    pointer.current = { ...pointer.current, inside: false };
    setHover(false);
    rx.set(0);
    ry.set(0);
  };

  const go = (dir: number) => setTarget(((Math.max(0, shown) + dir) % slides.length + slides.length) % slides.length);

  return (
    <div className="[perspective:1600px]">
      <motion.div
        ref={ref}
        style={{ rotateX: srx, rotateY: sry }}
        className="relative aspect-[16/11] w-full overflow-hidden border border-line-2 bg-black shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] sm:aspect-[16/10]"
        onPointerMove={onMove}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={onLeave}
        data-cursor="scan"
      >
        {/* poster for first paint / no-WebGL; fades once the shader shows the first slide */}
        <Image
          src={slides[0].poster.src}
          alt={`${slides[0].title} — beauty render`}
          fill
          loading="eager"
          fetchPriority="high"
          sizes="(min-width: 1024px) 58vw, 100vw"
          placeholder="blur"
          blurDataURL={slides[0].poster.blur}
          className={cn("object-cover transition-opacity duration-700", shown >= 0 ? "opacity-0" : "opacity-100")}
        />
        <LensCanvas
          slides={lensSlides}
          target={booted ? target : -1}
          invert={mode === "wire"}
          pointer={pointer}
          active={inView}
          still={reduced ?? false}
          onShown={setShown}
        />

        {/* HUD */}
        <div className="scanlines pointer-events-none absolute inset-0 opacity-50" />
        <div className="hud-corners pointer-events-none absolute inset-3 sm:inset-4" />

        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-3 sm:left-6 sm:top-6">
          <span className="flex items-center gap-2 bg-black/55 px-2 py-1 backdrop-blur-sm">
            <span className="pulse-dot size-1.5 rounded-full bg-[#ff3b30]" />
            <span className="label-sm text-ink">Live</span>
          </span>
          <span className="label-sm hidden bg-black/55 px-2 py-1 text-ink-2 backdrop-blur-sm sm:inline">
            Persp · {current.camera}
          </span>
        </div>

        <div className="absolute right-4 top-4 flex flex-col items-end gap-2 sm:right-6 sm:top-6">
          <div className="flex items-center border border-line-2 bg-black/60 backdrop-blur-md" role="group" aria-label="X-ray lens pass">
            <span className="label-sm hidden px-2.5 text-mute md:inline">X-Ray</span>
            {LENS_PASSES.map((p) => {
              const available = !!current.passes[p.id];
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={!available}
                  onClick={() => setPass(p.id)}
                  aria-pressed={activePass === p.id}
                  className={cn(
                    "label-sm px-2.5 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-25",
                    activePass === p.id ? "bg-accent text-black" : "text-ink-2 hover:text-ink"
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <div className="hidden items-center border border-line-2 bg-black/60 backdrop-blur-md sm:flex" role="group" aria-label="Viewport shading">
            <button type="button" onClick={() => setMode("wire")} aria-pressed={mode === "wire"} className={cn("label-sm flex items-center gap-1.5 px-2.5 py-1.5", mode === "wire" ? "text-accent" : "text-mute hover:text-ink")}>
              <span className="kbd !h-4 !min-w-4 !text-[9px]">4</span> Wire
            </button>
            <button type="button" onClick={() => setMode("shaded")} aria-pressed={mode === "shaded"} className={cn("label-sm flex items-center gap-1.5 px-2.5 py-1.5", mode === "shaded" ? "text-accent" : "text-mute hover:text-ink")}>
              <span className="kbd !h-4 !min-w-4 !text-[9px]">5</span> Shaded
            </button>
          </div>
        </div>

        <AnimatePresence>
          {!hover && shown >= 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 justify-center md:flex"
            >
              <span className="label-sm bg-black/50 px-3 py-1.5 text-ink-2 backdrop-blur-sm">Move cursor to scan topology</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-4 pt-16 sm:px-6 sm:pb-6">
          <div className="flex items-end justify-between gap-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="min-w-0"
              >
                <p className="label-sm text-accent">
                  {current.index} — {current.category}
                </p>
                <p className="display mt-1.5 truncate text-3xl text-ink sm:text-5xl">{current.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  {current.tris && <span className="label-sm text-ink-2">{current.tris}</span>}
                  <TransitionLink
                    href={`/work/${current.slug}`}
                    label={current.title}
                    className="label-sm group flex items-center gap-1.5 text-ink transition-colors hover:text-accent"
                  >
                    Explore project <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                  </TransitionLink>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="flex shrink-0 flex-col items-end gap-3">
              <AxisGizmo size={38} className="hidden opacity-80 sm:block" />
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => go(-1)} aria-label="Previous asset" className="grid size-8 place-items-center border border-line-2 bg-black/50 text-ink-2 hover:border-accent hover:text-accent">
                  <ChevronLeft size={15} />
                </button>
                <span className="label-sm tabular-nums text-ink-2">
                  {pad(Math.max(0, shown) + 1)}/{pad(slides.length)}
                </span>
                <button type="button" onClick={() => go(1)} aria-label="Next asset" className="grid size-8 place-items-center border border-line-2 bg-black/50 text-ink-2 hover:border-accent hover:text-accent">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-1.5">
            {slides.map((s, i) => (
              <button key={s.slug} type="button" onClick={() => setTarget(i)} aria-label={`Show ${s.title}`} className="group relative h-4 flex-1">
                <span className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-white/15 transition-colors group-hover:bg-white/30" />
                <span
                  className={cn("absolute left-0 top-1/2 h-[2px] -translate-y-1/2 bg-accent", i < Math.max(0, shown) ? "w-full" : "w-0")}
                  style={
                    i === shown && !hover && booted && inView && !reduced
                      ? { animation: `slide-progress ${SLIDE_MS}ms linear forwards` }
                      : i === shown
                        ? { width: "100%" }
                        : undefined
                  }
                  key={`${shown}-${hover}`}
                />
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
