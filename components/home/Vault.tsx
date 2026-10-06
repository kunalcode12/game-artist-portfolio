"use client";

import { Hand, Images, MousePointerClick } from "lucide-react";
import { AnimatePresence, motion, useInView, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import dynamic from "next/dynamic";
import { useRef, useState, type PointerEvent } from "react";
import { useLightbox } from "@/components/lightbox/Lightbox";
import { useAchievements } from "@/components/providers/AchievementsProvider";
import type { VaultAtlas, VaultControl } from "@/components/three/VaultCanvas";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { LightboxItem } from "@/lib/lightbox";
import { pad } from "@/lib/utils";

const VaultCanvas = dynamic(() => import("@/components/three/VaultCanvas"), { ssr: false });

export type VaultTile = { project: string; pass: string; item: LightboxItem };

export function Vault({ atlas, tiles }: { atlas: VaultAtlas; tiles: VaultTile[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useInView(ref, { once: true, margin: "500px 0px" });
  const visible = useInView(ref, { margin: "80px 0px" });
  const control = useRef<VaultControl>({ velocity: 0, dragging: false, scroll: 0, stamp: 0 });
  const drag = useRef<{ x: number; t: number } | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [grabbing, setGrabbing] = useState(false);
  const open = useLightbox();
  const { unlock } = useAchievements();
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    control.current.scroll = v;
  });

  // Window listeners (not pointer capture) so the canvas still receives pointerup for picking.
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = { x: e.clientX, t: performance.now() };
    control.current.dragging = true;
    setGrabbing(true);
    const move = (ev: globalThis.PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const now = performance.now();
      const dt = Math.max(8, now - d.t) / 1000;
      const dx = ev.clientX - d.x;
      control.current.velocity = (-dx * 0.0042) / dt;
      control.current.stamp = now;
      drag.current = { x: ev.clientX, t: now };
      if (Math.abs(dx) > 2) unlock("vault");
    };
    const up = () => {
      drag.current = null;
      control.current.dragging = false;
      setGrabbing(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const t = hover != null ? tiles[hover] : null;

  return (
    <section id="vault" className="relative overflow-hidden border-t border-line py-28 sm:py-36" aria-label="Render vault">
      <div className="shell">
        <SectionHeading
          index="04"
          kicker={`Render vault // ${tiles.length} frames`}
          title="The Vault"
          aside={
            <div className="flex flex-col gap-2 text-right">
              <span className="label-sm flex items-center justify-end gap-2 text-ink-2">
                <Hand size={13} className="text-accent" /> Drag to spin
              </span>
              <span className="label-sm flex items-center justify-end gap-2 text-ink-2">
                <MousePointerClick size={13} className="text-accent" /> Click to inspect
              </span>
            </div>
          }
        >
          Every beauty render, HDRI test, wireframe, AO, normal and ID pass from every project — wrapped around you.
        </SectionHeading>
      </div>

      <div
        ref={ref}
        className="relative mt-14 h-[78svh] min-h-[460px] touch-pan-y select-none"
        onPointerDown={onDown}
        data-cursor={hover != null ? "view" : "drag"}
        data-cursor-label={hover != null ? "Inspect" : grabbing ? "Spinning" : "Drag"}
      >
        {mounted && (
          <VaultCanvas
            atlas={atlas}
            control={control}
            active={visible}
            still={reduced ?? false}
            onHover={setHover}
            onPick={(i) => open(tiles.map((x) => x.item), i)}
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-bg to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg to-transparent" />

        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => open(tiles.map((x) => x.item), 0)}
            onPointerDown={(e) => e.stopPropagation()}
            className="label-sm pointer-events-auto flex items-center gap-2 border border-line-2 bg-black/70 px-3.5 py-2 text-ink-2 backdrop-blur-md transition-colors hover:border-accent hover:text-accent"
          >
            <Images size={13} /> Browse all {tiles.length} frames
          </button>
          <AnimatePresence mode="wait">
            <motion.div
              key={hover ?? "idle"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="chamfer-sm flex items-center gap-3 border border-line-2 bg-black/70 px-4 py-2.5 backdrop-blur-md"
            >
              {t ? (
                <>
                  <span className="label-sm text-accent tabular-nums">{pad((hover ?? 0) + 1)}</span>
                  <span className="text-sm font-semibold text-ink">{t.project}</span>
                  <span className="label-sm text-ink-2">{t.pass}</span>
                </>
              ) : (
                <span className="label-sm text-ink-2">
                  {tiles.length} frames · {new Set(tiles.map((x) => x.project)).size} projects · drag to spin
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
