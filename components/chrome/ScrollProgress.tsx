"use client";

import { motion, useScroll, useSpring } from "motion/react";

/** Thin amber "XP bar" across the top of the viewport. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 40, mass: 0.3 });
  return <motion.div aria-hidden className="fixed inset-x-0 top-0 z-[72] h-[2px] origin-left bg-accent shadow-[0_0_10px_rgba(255,166,48,0.7)]" style={{ scaleX }} />;
}
