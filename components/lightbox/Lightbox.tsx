"use client";

import { useLenis } from "lenis/react";
import { ChevronLeft, ChevronRight, Minus, Plus, Scan, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as RMouseEvent,
  type PointerEvent as RPointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import { useAchievements } from "@/components/providers/AchievementsProvider";
import { useSfx } from "@/components/providers/SfxProvider";
import type { LightboxItem } from "@/lib/lightbox";
import { clamp, cn, pad } from "@/lib/utils";

type OpenFn = (items: LightboxItem[], index?: number, origin?: DOMRect | null) => void;
const LightboxContext = createContext<OpenFn>(() => {});

export function LightboxProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ items: LightboxItem[]; index: number; origin: DOMRect | null; id: number } | null>(null);
  const open = useCallback<OpenFn>((items, index = 0, origin = null) => {
    if (!items.length) return;
    setState({ items, index, origin, id: performance.now() });
  }, []);
  const close = useCallback(() => setState(null), []);

  return (
    <LightboxContext value={open}>
      {children}
      <AnimatePresence>{state && <Viewer key={state.id} items={state.items} start={state.index} origin={state.origin} onClose={close} />}</AnimatePresence>
    </LightboxContext>
  );
}

export const useLightbox = () => use(LightboxContext);

type View = { s: number; x: number; y: number };
const IDENTITY: View = { s: 1, x: 0, y: 0 };
const MAX_ZOOM = 5;

function Viewer({ items, start, origin, onClose }: { items: LightboxItem[]; start: number; origin: DOMRect | null; onClose: () => void }) {
  const [index, setIndex] = useState(start);
  const [stage, setStage] = useState({ w: 0, h: 0, left: 0, top: 0 });
  const [view, setViewState] = useState<View>(IDENTITY);
  const [dragging, setDragging] = useState(false);
  const [loaded, setLoaded] = useState<Record<string, true>>({});
  const [swipe, setSwipe] = useState(0);
  const [first, setFirst] = useState(true);
  const viewRef = useRef<View>(IDENTITY);
  const stageRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ kind: "pan" | "pinch"; sx: number; sy: number; dist: number; view: View; mx: number; my: number; moved: boolean } | null>(null);
  const lenis = useLenis();
  const { play } = useSfx();
  const { unlock } = useAchievements();
  const item = items[index];

  const fit = useMemo(() => {
    if (!stage.w) return { w: 0, h: 0 };
    const r = Math.min(stage.w / item.w, stage.h / item.h);
    return { w: item.w * r, h: item.h * r };
  }, [stage.w, stage.h, item.w, item.h]);

  const setView = useCallback(
    (next: View) => {
      const maxX = Math.max(0, (fit.w * next.s - stage.w) / 2);
      const maxY = Math.max(0, (fit.h * next.s - stage.h) / 2);
      const v = { s: next.s, x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY) };
      viewRef.current = v;
      setViewState(v);
      if (v.s > 1.3) unlock("pixel");
    },
    [fit.w, fit.h, stage.w, stage.h, unlock]
  );

  const zoomAt = useCallback(
    (s: number, px = 0, py = 0) => {
      const cur = viewRef.current;
      const s2 = clamp(s, 1, MAX_ZOOM);
      const k = s2 / cur.s;
      setView(s2 === 1 ? IDENTITY : { s: s2, x: px - (px - cur.x) * k, y: py - (py - cur.y) * k });
    },
    [setView]
  );

  const go = useCallback(
    (i: number) => {
      const n = items.length;
      const next = ((i % n) + n) % n;
      if (next === index) return;
      setFirst(false);
      viewRef.current = IDENTITY;
      setViewState(IDENTITY);
      setIndex(next);
      play("tick");
    },
    [items.length, index, play]
  );

  // lock page scroll while open
  useEffect(() => {
    lenis?.stop();
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const lastFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      lenis?.start();
      html.style.overflow = prev;
      lastFocus?.focus?.({ preventScroll: true });
    };
  }, [lenis]);

  useEffect(() => {
    play("open");
    return () => play("close");
  }, [play]);

  // measure the stage — ResizeObserver reports once on observe(), before first paint
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setStage({ w: r.width, h: r.height, left: r.left, top: r.top });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(index + 1);
      else if (e.key === "ArrowLeft") go(index - 1);
      else if (e.key === "+" || e.key === "=") zoomAt(viewRef.current.s * 1.5);
      else if (e.key === "-") zoomAt(viewRef.current.s / 1.5);
      else if (e.key === "0") setView(IDENTITY);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, onClose, setView, zoomAt]);

  // wheel zoom toward the cursor (non-passive so the page never scrolls)
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const px = e.clientX - r.left - r.width / 2;
      const py = e.clientY - r.top - r.height / 2;
      zoomAt(viewRef.current.s * Math.exp(-e.deltaY * 0.0022), px, py);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  // preload neighbours, keep the active thumbnail in view
  useEffect(() => {
    [index + 1, index - 1].forEach((i) => {
      const it = items[(i + items.length) % items.length];
      const im = new Image();
      im.src = it.src;
    });
    const thumb = thumbsRef.current?.children[index] as HTMLElement | undefined;
    thumb?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [index, items]);

  const local = (e: { clientX: number; clientY: number }) => ({
    x: e.clientX - stage.left - stage.w / 2,
    y: e.clientY - stage.top - stage.h / 2,
  });

  const onPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 2) {
      const mid = local({ clientX: (pts[0].x + pts[1].x) / 2, clientY: (pts[0].y + pts[1].y) / 2 });
      gesture.current = { kind: "pinch", sx: 0, sy: 0, dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y), view: viewRef.current, mx: mid.x, my: mid.y, moved: true };
    } else {
      gesture.current = { kind: "pan", sx: e.clientX, sy: e.clientY, dist: 0, view: viewRef.current, mx: 0, my: 0, moved: false };
    }
    setDragging(true);
  };

  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (g.kind === "pinch") {
      const pts = [...pointers.current.values()];
      if (pts.length < 2) return;
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const mid = local({ clientX: (pts[0].x + pts[1].x) / 2, clientY: (pts[0].y + pts[1].y) / 2 });
      const s2 = clamp((g.view.s * dist) / g.dist, 1, MAX_ZOOM);
      const k = s2 / g.view.s;
      setView({ s: s2, x: mid.x - (g.mx - g.view.x) * k, y: mid.y - (g.my - g.view.y) * k });
      return;
    }
    const dx = e.clientX - g.sx;
    const dy = e.clientY - g.sy;
    if (Math.abs(dx) + Math.abs(dy) > 4) g.moved = true;
    if (g.view.s > 1.01) setView({ s: g.view.s, x: g.view.x + dx, y: g.view.y + dy });
    else if (items.length > 1) setSwipe(dx);
  };

  const onPointerUp = (e: RPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    const g = gesture.current;
    if (pointers.current.size === 0) {
      setDragging(false);
      gesture.current = null;
      if (g?.kind === "pan" && g.view.s <= 1.01) {
        if (swipe < -70) go(index + 1);
        else if (swipe > 70) go(index - 1);
      }
      setSwipe(0);
    } else if (pointers.current.size === 1) {
      const [p] = [...pointers.current.values()];
      gesture.current = { kind: "pan", sx: p.x, sy: p.y, dist: 0, view: viewRef.current, mx: 0, my: 0, moved: true };
    }
  };

  const onDoubleClick = (e: RMouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const p = local(e);
    if (viewRef.current.s > 1.05) setView(IDENTITY);
    else zoomAt(2.6, p.x, p.y);
  };

  // FLIP: the very first image grows out of the thumbnail that was clicked
  const flip =
    first && origin && fit.w
      ? {
          x: origin.left + origin.width / 2 - (stage.left + stage.w / 2),
          y: origin.top + origin.height / 2 - (stage.top + stage.h / 2),
          scale: Math.max(0.05, origin.width / fit.w),
          opacity: 0.4,
        }
      : { opacity: 0, scale: 0.97, x: 0, y: 0 };

  const zoomPct = Math.round(view.s * 100);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Image viewer — ${item.title}`}
      data-lenis-prevent
      className="fixed inset-0 z-[100] flex flex-col bg-[#050506]/[0.96] backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
      transition={{ duration: 0.3 }}
    >
      {/* top bar */}
      <div className="relative z-10 flex items-center justify-between gap-4 border-b border-line px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <span className="label shrink-0 text-accent">
            {pad(index + 1)} / {pad(items.length)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-extrabold uppercase tracking-tight text-ink sm:text-lg">{item.title}</p>
            {item.subtitle && <p className="label-sm truncate text-mute">{item.subtitle}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <IconBtn label="Zoom out" onClick={() => zoomAt(view.s / 1.5)} disabled={view.s <= 1}>
            <Minus size={16} />
          </IconBtn>
          <span className="label-sm hidden w-14 text-center text-ink-2 tabular-nums sm:block">{zoomPct}%</span>
          <IconBtn label="Zoom in" onClick={() => zoomAt(view.s * 1.5)} disabled={view.s >= MAX_ZOOM}>
            <Plus size={16} />
          </IconBtn>
          <IconBtn label="Reset zoom" onClick={() => setView(IDENTITY)} disabled={view.s === 1}>
            <Scan size={16} />
          </IconBtn>
          <span className="mx-1 h-6 w-px bg-line-2" />
          <IconBtn label="Close viewer" onClick={onClose} ref={closeRef}>
            <X size={18} />
          </IconBtn>
        </div>
      </div>

      {/* stage */}
      <div
        ref={stageRef}
        className="relative flex-1 touch-none select-none overflow-hidden"
        data-cursor={view.s > 1.01 ? "drag" : "zoom"}
        data-cursor-label={view.s > 1.01 ? "Pan" : "Zoom"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
      >
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" />
        {fit.w > 0 && (
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: fit.w,
              height: fit.h,
              transform: `translate(-50%, -50%) translate3d(${view.x + swipe * 0.5}px, ${view.y}px, 0) scale(${view.s})`,
              transition: dragging ? "none" : "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <AnimatePresence initial mode="popLayout">
              <motion.div
                key={item.src}
                className="absolute inset-0"
                initial={flip}
                animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.18 } }}
                transition={{ duration: first && origin ? 0.7 : 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                {item.blur && !loaded[item.src] && (
                  <div
                    className="absolute inset-0 scale-105 bg-cover bg-center blur-xl"
                    style={{ backgroundImage: `url(${item.blur})` }}
                  />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element -- full-resolution master for pixel peeping */}
                <img
                  src={item.src}
                  alt={item.title}
                  width={item.w}
                  height={item.h}
                  draggable={false}
                  decoding="async"
                  onLoad={() => setLoaded((l) => ({ ...l, [item.src]: true }))}
                  className={cn("absolute inset-0 h-full w-full object-contain transition-opacity duration-500", loaded[item.src] ? "opacity-100" : "opacity-0")}
                />
                <div className="hud-corners absolute -inset-3" style={{ ["--s" as string]: `${Math.round(18 / view.s)}px`, ["--t" as string]: `${Math.max(1, 1.5 / view.s)}px` }} />
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {!loaded[item.src] && (
          <div className="label-sm pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-mute">
            Streaming full-res texture<span className="caret" />
          </div>
        )}

        {items.length > 1 && (
          <>
            <NavBtn side="left" onClick={() => go(index - 1)} />
            <NavBtn side="right" onClick={() => go(index + 1)} />
          </>
        )}

        <AnimatePresence>
          {view.s > 1.01 && fit.w > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="pointer-events-none absolute bottom-4 right-4 hidden border border-line-2 bg-black/70 p-1 backdrop-blur sm:block"
            >
              <Minimap item={item} fit={fit} stage={stage} view={view} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* thumbnails */}
      {items.length > 1 && (
        <div ref={thumbsRef} className="flex gap-2 overflow-x-auto border-t border-line px-4 py-3 sm:px-6" data-lenis-prevent>
          {items.map((it, i) => (
            <button
              key={it.src}
              onClick={() => go(i)}
              aria-label={`Show ${it.title}`}
              aria-current={i === index}
              className={cn(
                "relative h-14 shrink-0 overflow-hidden border transition-all duration-300 sm:h-16",
                i === index ? "border-accent opacity-100" : "border-line opacity-45 hover:opacity-90"
              )}
              style={{ aspectRatio: `${it.w} / ${it.h}` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- tiny pre-sized thumb */}
              <img src={it.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
              {it.tag && <span className="label-sm absolute bottom-0 left-0 bg-black/75 px-1 py-px text-[9px] text-ink-2">{it.tag}</span>}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function Minimap({ item, fit, stage, view }: { item: LightboxItem; fit: { w: number; h: number }; stage: { w: number; h: number }; view: View }) {
  const W = 168;
  const H = (W * fit.h) / fit.w;
  // visible region of the image, in image-local [0..1] coordinates
  const visW = Math.min(1, stage.w / (fit.w * view.s));
  const visH = Math.min(1, stage.h / (fit.h * view.s));
  const cx = 0.5 - view.x / (fit.w * view.s);
  const cy = 0.5 - view.y / (fit.h * view.s);
  return (
    <div className="relative" style={{ width: W, height: H }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail */}
      <img src={item.thumb} alt="" className="h-full w-full object-cover opacity-70" />
      <div
        className="absolute border border-accent bg-accent/10"
        style={{ left: (cx - visW / 2) * W, top: (cy - visH / 2) * H, width: visW * W, height: visH * H }}
      />
    </div>
  );
}

function IconBtn({ children, label, onClick, disabled, ref }: { children: ReactNode; label: string; onClick: () => void; disabled?: boolean; ref?: Ref<HTMLButtonElement> }) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-9 place-items-center border border-transparent text-ink-2 transition-colors hover:border-line-2 hover:bg-white/5 hover:text-accent disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function NavBtn({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous image" : "Next image"}
      className={cn(
        "group absolute top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center border border-line-2 bg-black/60 text-ink backdrop-blur transition-all hover:border-accent hover:text-accent sm:size-14",
        side === "left" ? "left-3 sm:left-5" : "right-3 sm:right-5"
      )}
    >
      <Icon size={22} className={cn("transition-transform", side === "left" ? "group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5")} />
    </button>
  );
}
