"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { BOOT_FLAG, useBoot } from "@/components/providers/BootProvider";
import { prefersReducedMotion } from "@/lib/utils";

const LOG = [
  { at: 4, text: "init viewport", meta: "persp · 60 fps" },
  { at: 22, text: "load game_boy.fbx", meta: "4.5K tris" },
  { at: 40, text: "load mclaren_mp4-12c.fbx", meta: "51.3K tris" },
  { at: 58, text: "compile shaders", meta: "pbr_metal_rough" },
  { at: 76, text: "bake normal maps", meta: "high → low" },
  { at: 94, text: "lookdev", meta: "arnold · aces" },
];

const SEGMENTS = 36;
const EASE = [0.76, 0, 0.24, 1] as const;

/**
 * Game-style boot screen. Progress tracks real readiness (fonts + window load) with a short
 * minimum so it reads as intentional; returning visitors in the same session skip it via the
 * inline <head> script (html.booted) and this component unmounts immediately.
 */
export function Loader() {
  const { finish } = useBoot();
  const [phase, setPhase] = useState<"run" | "exit" | "done">("run");
  const numRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    let skip = prefersReducedMotion();
    try {
      skip ||= sessionStorage.getItem(BOOT_FLAG) === "1";
    } catch {}

    let raf = 0;
    if (skip) {
      raf = requestAnimationFrame(() => {
        finish();
        setPhase("done");
      });
      return () => cancelAnimationFrame(raf);
    }

    let ready = false;
    const loaded = new Promise<void>((res) => {
      if (document.readyState === "complete") res();
      else window.addEventListener("load", () => res(), { once: true });
    });
    Promise.all([document.fonts?.ready, loaded]).then(() => (ready = true));
    const cap = setTimeout(() => (ready = true), 3600);

    const start = performance.now();
    let shown = 0;
    const segs = barRef.current ? [...barRef.current.children] : [];
    const lines = logRef.current ? [...logRef.current.children] : [];

    const tick = (now: number) => {
      const t = now - start;
      const target = ready && t > 1250 ? 100 : Math.min(91, 100 * (1 - Math.exp(-t / 650)));
      shown += (target - shown) * 0.11;
      if (target === 100 && shown > 99.5) shown = 100;
      const v = Math.floor(shown);
      if (numRef.current) numRef.current.textContent = String(v).padStart(3, "0");
      const lit = Math.round((v / 100) * SEGMENTS);
      segs.forEach((s, i) => s.classList.toggle("on", i < lit));
      lines.forEach((l, i) => l.classList.toggle("on", v >= LOG[i].at));
      if (v >= 100) {
        try {
          sessionStorage.setItem(BOOT_FLAG, "1");
        } catch {}
        finish();
        setPhase("exit");
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(cap);
    };
  }, [finish]);

  if (phase === "done") return null;
  const exiting = phase === "exit";

  return (
    <div className="boot-loader fixed inset-0 z-[110]" role="status" aria-live="polite" aria-label="Loading portfolio">
      <motion.div
        className="absolute inset-x-0 top-0 h-1/2 border-b border-accent/0 bg-bg"
        initial={false}
        animate={{ y: exiting ? "-100%" : "0%" }}
        transition={{ duration: 1.05, ease: EASE, delay: 0.32 }}
        onAnimationComplete={() => exiting && setPhase("done")}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 h-1/2 bg-bg"
        initial={false}
        animate={{ y: exiting ? "100%" : "0%" }}
        transition={{ duration: 1.05, ease: EASE, delay: 0.32 }}
      />
      {/* seam that flashes as the doors unlock */}
      <motion.div
        className="absolute inset-x-0 top-1/2 h-px origin-center bg-accent shadow-[0_0_24px_4px_rgba(255,166,48,0.6)]"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={exiting ? { scaleX: [0, 1, 1], opacity: [1, 1, 0] } : { scaleX: 0, opacity: 0 }}
        transition={{ duration: 0.9, times: [0, 0.4, 1], ease: "easeOut" }}
      />

      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{ opacity: exiting ? 0 : 1, scale: exiting ? 0.98 : 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="dot-grid absolute inset-0 opacity-30" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-5 sm:p-8">
          <span className="label text-ink-2">Sohan Singh — Portfolio</span>
          <span className="label hidden text-mute sm:block">Build 2026.10 · v1.0</span>
        </div>

        <div className="absolute inset-0 grid place-items-center">
          <div className="flex flex-col items-center">
            <div className="mb-8 [perspective:400px]">
              <span className="cube" style={{ ["--size" as string]: "58px", animationDuration: "3.2s" }}>
                <i /><i /><i /><i /><i /><i />
              </span>
            </div>
            <span className="label mb-2 text-accent">Loading assets</span>
            <div className="flex items-start leading-none">
              <span ref={numRef} className="display text-[clamp(5.5rem,17vw,13rem)] tabular-nums text-ink">
                000
              </span>
              <span className="display mt-3 text-4xl text-accent sm:text-6xl">%</span>
            </div>
            <div ref={barRef} className="loader-bar mt-6 flex w-[min(420px,78vw)] gap-[3px]">
              {Array.from({ length: SEGMENTS }, (_, i) => (
                <span key={i} className="h-2.5 flex-1 bg-white/[0.07] transition-colors duration-150 [&.on]:bg-accent" />
              ))}
            </div>
          </div>
        </div>

        <ul ref={logRef} className="absolute bottom-6 left-5 space-y-1.5 font-mono text-[11px] text-mute sm:bottom-8 sm:left-8">
          {LOG.map((l) => (
            <li key={l.text} className="flex gap-3 opacity-0 transition-opacity duration-200 [&.on]:opacity-100">
              <span className="text-accent">[OK]</span>
              <span className="text-ink-2">{l.text}</span>
              <span className="hidden text-dim sm:inline">· {l.meta}</span>
            </li>
          ))}
        </ul>
        <span className="label absolute bottom-6 right-5 hidden text-mute sm:bottom-8 sm:right-8 sm:block">Hard surface · Game art</span>
      </motion.div>
    </div>
  );
}
