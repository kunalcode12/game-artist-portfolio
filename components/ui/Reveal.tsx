"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Splits a heading into characters that flip up out of a mask, like a title card.
 * Pure CSS transitions (one class flip on the parent) keep hydration cheap; screen readers
 * get a single plain-text copy. `trigger` lets the hero wait for the boot screen.
 */
export function SplitChars({
  text,
  as = "span",
  className,
  delay = 0,
  stagger = 0.035,
  trigger,
}: {
  text: string;
  as?: "span" | "h1" | "h2" | "h3" | "p";
  className?: string;
  delay?: number;
  stagger?: number;
  trigger?: boolean;
}) {
  // Every option is a plain text container, so typing it as span keeps the ref happy.
  const Tag = as as "span";
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const show = trigger ?? inView;
  const words = text.split(" ");
  let n = 0;

  return (
    <Tag ref={ref} className={cn("split-chars", className)} data-in={show ? "true" : "false"}>
      <span className="sr-only">{text}</span>
      {words.map((word, wi) => (
        <span key={wi} aria-hidden className="inline-flex overflow-hidden whitespace-nowrap pb-[0.06em] align-bottom [perspective:600px]">
          {[...word].map((ch, ci) => {
            const i = n++;
            return (
              <span key={ci} className="split-char" style={{ transitionDelay: `${delay + i * stagger}s` }}>
                {ch}
              </span>
            );
          })}
          {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </Tag>
  );
}

/** Blocks that rise into place when scrolled into view. */
export function FadeUp({
  children,
  className,
  delay = 0,
  y = 28,
  trigger,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  trigger?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduced = useReducedMotion();
  const show = trigger ?? inView;
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduced ? false : { opacity: 0, y, filter: "blur(6px)" }}
      animate={show ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

const GLYPHS = "▓▒░█<>/\\|=+*#%01ABCDEFXYZ";

/** HUD-style decode: random glyphs resolve left-to-right into the final text. */
export function ScrambleText({ text, className, trigger, delay = 0, speed = 28 }: { text: string; className?: string; trigger?: boolean; delay?: number; speed?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [out, setOut] = useState(text);
  const show = trigger ?? inView;

  useEffect(() => {
    if (!show) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let raf = 0;
    const startAt = performance.now() + delay * 1000;
    const total = text.length + 8;
    const step = (now: number) => {
      if (now < startAt) {
        raf = requestAnimationFrame(step);
        return;
      }
      frame += speed / 60;
      const resolved = Math.floor(frame);
      let s = "";
      for (let i = 0; i < text.length; i++) {
        if (text[i] === " " || i < resolved - 4) s += text[i];
        else s += GLYPHS[(i * 7 + Math.floor(now / 45)) % GLYPHS.length];
      }
      setOut(s);
      if (resolved < total) raf = requestAnimationFrame(step);
      else setOut(text);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [show, text, delay, speed]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>{out}</span>
    </span>
  );
}
