"use client";

import { motion, useAnimationFrame, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, useVelocity } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

const wrap = (min: number, max: number, v: number) => {
  const r = max - min;
  return ((((v - min) % r) + r) % r) + min;
};

function Row({ items, speed, outline, visible }: { items: string[]; speed: number; outline?: boolean; visible: boolean }) {
  const x = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const boost = useTransform(velocity, [-2400, 0, 2400], [-5, 0, 5], { clamp: false });
  const dir = useRef(speed > 0 ? 1 : -1);
  const reduced = useReducedMotion();
  const xp = useTransform(x, (v) => `${v}%`);

  useAnimationFrame((_, delta) => {
    if (reduced || !visible) return;
    const b = boost.get();
    if (b < -0.05) dir.current = speed > 0 ? -1 : 1;
    else if (b > 0.05) dir.current = speed > 0 ? 1 : -1;
    const base = Math.abs(speed) * dir.current * (delta / 1000);
    x.set(wrap(-50, 0, x.get() - base * (1 + Math.abs(b))));
  });

  return (
    <div className="flex overflow-hidden">
      <motion.div style={{ x: xp }} className="flex shrink-0 whitespace-nowrap">
        {[0, 1].map((k) => (
          <span key={k} className="flex shrink-0 items-center" aria-hidden={k === 1}>
            {items.map((t) => (
              <span key={t} className="flex items-center">
                <span className={cn("display px-6 text-[clamp(3rem,7vw,7.5rem)] leading-none sm:px-10", outline ? "text-outline" : "text-ink")}>{t}</span>
                <span className="cube mx-2" style={{ ["--size" as string]: "clamp(18px, 2.2vw, 30px)" }}>
                  <i /><i /><i /><i /><i /><i />
                </span>
              </span>
            ))}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export function Marquee() {
  const ref = useRef<HTMLElement>(null);
  const visible = useInView(ref, { margin: "100px 0px" });
  return (
    <section ref={ref} aria-label="Specialties" className="relative overflow-hidden border-y border-line bg-bg-2 py-10 [perspective:1200px] sm:py-14">
      <div className="[transform:rotateX(14deg)_rotateZ(-2deg)] [transform-style:preserve-3d]">
        <Row items={["Hard Surface", "Game-Ready", "PBR Texturing", "Clean Topology"]} speed={3.2} visible={visible} />
        <div className="h-3 sm:h-5" />
        <Row items={["High → Low Bakes", "UV Layouts", "Lookdev", "Optimized Geometry"]} speed={-2.6} outline visible={visible} />
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-bg-2 to-transparent sm:w-48" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-bg-2 to-transparent sm:w-48" />
    </section>
  );
}
