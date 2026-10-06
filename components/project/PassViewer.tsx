"use client";

import { Columns2, Maximize2 } from "lucide-react";
import { motion, useInView } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useLightbox } from "@/components/lightbox/Lightbox";
import { useAchievements } from "@/components/providers/AchievementsProvider";
import { useSfx } from "@/components/providers/SfxProvider";
import { AxisGizmo } from "@/components/ui/Icons";
import { toLightboxItem } from "@/lib/lightbox";
import { PASS_META, PASS_ORDER, type CameraStack, type PassKind } from "@/lib/projects";
import { cn, pad } from "@/lib/utils";

const isTyping = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA"].includes(t.tagName));

export function PassViewer({ title, stacks }: { title: string; stacks: CameraStack[] }) {
  const [si, setSi] = useState(0);
  const [pass, setPass] = useState<PassKind>("beauty");
  const [prev, setPrev] = useState<PassKind | null>(null);
  const [wipeKey, setWipeKey] = useState(0);
  const [compare, setCompare] = useState(false);
  const [split, setSplit] = useState(0.5);
  const [armed, setArmed] = useState(false);
  const [visited, setVisited] = useState<Record<string, PassKind[]>>({});
  const ref = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const inView = useInView(ref, { amount: 0.35 });
  const open = useLightbox();
  const { unlock } = useAchievements();
  const { play } = useSfx();

  const stack = stacks[si];
  const available = PASS_ORDER.filter((p) => stack.passes[p]);
  const current: PassKind = stack.passes[pass] ? pass : "beauty";
  const against: PassKind = current !== "beauty" ? current : (available.find((p) => p === "wire") ?? available.find((p) => p !== "beauty") ?? "beauty");

  const select = (p: PassKind) => {
    if (!stack.passes[p] || p === current) return;
    setPrev(current);
    setPass(p);
    setWipeKey((k) => k + 1);
    setArmed(true);
    play("switch");
    const seen = new Set([...(visited[stack.id] ?? ["beauty"]), p]);
    setVisited({ ...visited, [stack.id]: [...seen] });
    if (available.length > 2 && available.every((a) => seen.has(a))) unlock("passes");
  };

  const camera = (i: number) => {
    const n = (i + stacks.length) % stacks.length;
    if (n === si) return;
    setSi(n);
    setPrev(null);
    setWipeKey((k) => k + 1);
    play("tick");
  };

  // number keys mirror the toolbar while the viewport is on screen
  useEffect(() => {
    if (!inView) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      const n = Number(e.key);
      if (n >= 1 && n <= PASS_ORDER.length) select(PASS_ORDER[n - 1]);
      else if (e.key.toLowerCase() === "c") setCompare((c) => !c);
      else if (e.key === "]") camera(si + 1);
      else if (e.key === "[") camera(si - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const setSplitFrom = (clientX: number) => {
    const r = stage.current?.getBoundingClientRect();
    if (r) setSplit(Math.min(0.98, Math.max(0.02, (clientX - r.left) / r.width)));
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!compare || (e.target as HTMLElement).closest("button")) return;
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setSplitFrom(e.clientX);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (compare && dragging.current) setSplitFrom(e.clientX);
  };
  const onUp = () => {
    dragging.current = false;
  };

  const openLightbox = () => {
    const items = available.map((p) => toLightboxItem(stack.passes[p]!, title, `${stack.name} — ${PASS_META[p].label}`, PASS_META[p].short));
    open(items, available.indexOf(current), stage.current?.getBoundingClientRect() ?? null);
  };

  const beauty = stack.passes.beauty!;
  const layer = (p: PassKind, priority = false) => {
    const img = stack.passes[p]!;
    return (
      <Image
        src={img.src}
        alt={`${title} — ${stack.name}, ${PASS_META[p].label} pass`}
        fill
        sizes="(min-width: 1680px) 1600px, 100vw"
        quality={90}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        placeholder={p === "beauty" ? "blur" : "empty"}
        blurDataURL={p === "beauty" ? img.blur : undefined}
        className="object-cover"
        draggable={false}
      />
    );
  };

  return (
    <div ref={ref} className="relative">
      <div
        ref={stage}
        className="group relative aspect-[4/3] w-full touch-pan-y select-none overflow-hidden border border-line-2 bg-black sm:aspect-[2/1]"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerEnter={() => setArmed(true)}
        onClick={(e) => {
          if (!compare && !(e.target as HTMLElement).closest("button")) openLightbox();
        }}
        data-cursor={compare ? "drag" : "zoom"}
        data-cursor-label={compare ? "Compare" : "Inspect"}
      >
        {/* base layers */}
        {compare ? (
          <>
            <div className="absolute inset-0">{layer("beauty")}</div>
            <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${split * 100}%)` }}>
              {layer(against)}
            </div>
            <div className="pointer-events-none absolute inset-y-0 z-10 w-px bg-accent shadow-[0_0_14px_rgba(255,166,48,0.9)]" style={{ left: `${split * 100}%` }}>
              <span className="absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center border border-accent bg-black/80 text-accent backdrop-blur">
                <Columns2 size={16} />
              </span>
            </div>
            <span className="label-sm pointer-events-none absolute bottom-20 left-4 z-10 bg-black/70 px-2 py-1 text-ink sm:left-6">{PASS_META.beauty.short}</span>
            <span className="label-sm pointer-events-none absolute bottom-20 right-4 z-10 bg-accent px-2 py-1 text-black sm:right-6">{PASS_META[against].short}</span>
          </>
        ) : (
          <>
            {/* everything we have shown stays mounted so switching back is instant */}
            {available.map((p) =>
              p === current || p === prev || (armed && p !== current) ? (
                <div key={`${stack.id}-${p}`} className={cn("absolute inset-0", p === current || p === prev ? "opacity-100" : "opacity-0")} style={{ zIndex: p === current ? 2 : p === prev ? 1 : 0 }}>
                  {p === current ? (
                    <motion.div key={wipeKey} className="absolute inset-0" initial={prev ? { clipPath: "inset(0 0 100% 0)" } : false} animate={{ clipPath: "inset(0 0 0% 0)" }} transition={{ duration: 0.65, ease: [0.65, 0, 0.35, 1] }}>
                      {layer(p, p === "beauty" && si === 0)}
                    </motion.div>
                  ) : (
                    layer(p)
                  )}
                </div>
              ) : null
            )}
            {prev && (
              <motion.span
                key={`scan-${wipeKey}`}
                aria-hidden
                className="pointer-events-none absolute inset-x-0 z-[3] h-px bg-accent shadow-[0_0_18px_3px_rgba(255,166,48,0.85)]"
                initial={{ top: "0%", opacity: 1 }}
                animate={{ top: "100%", opacity: 0.2 }}
                transition={{ duration: 0.65, ease: [0.65, 0, 0.35, 1] }}
              />
            )}
          </>
        )}

        {/* HUD */}
        <div className="pointer-events-none absolute inset-0 z-[4] bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55))]" />
        <div className="hud-corners pointer-events-none absolute inset-3 z-[4] sm:inset-4" />
        <div className="pointer-events-none absolute left-4 top-4 z-[5] flex flex-wrap items-center gap-2 sm:left-6 sm:top-6">
          <span className="label-sm bg-black/60 px-2 py-1 text-ink backdrop-blur-sm">Viewport · Persp</span>
          <span className="label-sm bg-black/60 px-2 py-1 text-accent backdrop-blur-sm">
            CAM_{pad(si + 1)} · {stack.name}
          </span>
        </div>

        <div className="absolute right-4 top-4 z-[5] flex items-center gap-2 sm:right-6 sm:top-6">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openLightbox();
            }}
            className="label-sm hidden items-center gap-2 border border-line-2 bg-black/60 px-2.5 py-2 text-ink-2 backdrop-blur-md transition-colors hover:border-accent hover:text-accent sm:flex"
          >
            <Maximize2 size={12} /> Full res
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-[5] bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-14 sm:p-5 sm:pt-16">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1" role="toolbar" aria-label="Render pass">
              {PASS_ORDER.map((p, i) => {
                const has = !!stack.passes[p];
                const on = (compare ? against : current) === p;
                return (
                  <button
                    key={p}
                    type="button"
                    disabled={!has || (compare && p === "beauty")}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (compare) {
                        setPass(p);
                        play("switch");
                      } else select(p);
                    }}
                    aria-pressed={on}
                    title={`${PASS_META[p].label} [${i + 1}]`}
                    className={cn(
                      "label-sm flex items-center gap-1.5 border px-2 py-1.5 backdrop-blur-md transition-colors disabled:cursor-not-allowed disabled:opacity-25 sm:px-2.5 sm:py-2",
                      on ? "border-accent bg-accent text-black" : "border-line-2 bg-black/55 text-ink-2 hover:border-accent/60 hover:text-ink"
                    )}
                  >
                    <span className={cn("hidden text-[9px] sm:inline", on ? "text-black/60" : "text-dim")}>{i + 1}</span>
                    {PASS_META[p].short}
                  </button>
                );
              })}
              <span className="mx-1 hidden h-6 w-px bg-line-2 sm:block" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCompare((c) => !c);
                  setArmed(true);
                  play("switch");
                }}
                aria-pressed={compare}
                title="Compare [C]"
                className={cn(
                  "label-sm flex items-center gap-1.5 border px-2 py-1.5 backdrop-blur-md transition-colors sm:px-2.5 sm:py-2",
                  compare ? "border-accent text-accent" : "border-line-2 bg-black/55 text-ink-2 hover:text-ink"
                )}
              >
                <Columns2 size={12} /> Compare
              </button>
            </div>
            <AxisGizmo size={36} className="hidden opacity-80 md:block" />
          </div>
        </div>
      </div>

      {/* caption + cameras */}
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-mute">
          <span className="label-sm mr-2 text-accent">{PASS_META[compare ? against : current].label}</span>
          {compare ? `Drag across the frame to compare the beauty render with the ${PASS_META[against].label.toLowerCase()} pass.` : PASS_META[current].description}
          <span className="label-sm ml-3 hidden text-mute md:inline">
            Keys <span className="kbd">1</span>–<span className="kbd">6</span> passes · <span className="kbd">C</span> compare · <span className="kbd">[</span>
            <span className="kbd">]</span> camera
          </span>
        </p>
        {stacks.length > 1 && (
          <div className="flex gap-2" role="group" aria-label="Camera">
            {stacks.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => camera(i)}
                aria-pressed={i === si}
                className={cn("group/cam relative h-14 w-24 overflow-hidden border transition-all sm:h-16 sm:w-28", i === si ? "border-accent" : "border-line-2 opacity-60 hover:opacity-100")}
              >
                <Image src={s.passes.beauty!.thumb} alt={`Camera ${i + 1}: ${s.name}`} fill sizes="112px" className="object-cover" />
                <span className="label-sm absolute bottom-0 left-0 bg-black/75 px-1.5 py-0.5 text-[9px] text-ink">CAM_{pad(i + 1)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <span className="sr-only">Beauty render resolution {beauty.ow} by {beauty.oh}</span>
    </div>
  );
}
