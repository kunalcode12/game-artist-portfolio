"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import type { ComponentProps, PointerEvent, ReactNode } from "react";
import { TransitionLink } from "@/components/providers/TransitionProvider";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "accent" | "ghost";

const BASE =
  "group/btn relative inline-flex items-center justify-center gap-3 overflow-hidden px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.18em] transition-colors duration-300 chamfer-sm";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-[#0b0b0c] hover:text-[#0b0b0c]",
  outline: "border border-line-2 bg-white/[0.02] text-ink hover:text-[#0b0b0c]",
  accent: "bg-accent text-[#120c03]",
  ghost: "text-ink-2 hover:text-ink",
};

function Inner({ children, variant }: { children: ReactNode; variant: Variant }) {
  return (
    <>
      {variant !== "ghost" && (
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 origin-left scale-x-0 transition-transform duration-500 ease-[var(--ease-quint)] group-hover/btn:scale-x-100",
            variant === "accent" ? "bg-ink" : "bg-accent"
          )}
        />
      )}
      <span className="relative z-10 flex items-center gap-3">{children}</span>
    </>
  );
}

/** Pulls its content toward the pointer a little — tactile without being gimmicky. */
export function Magnetic({ children, strength = 0.28, className }: { children: ReactNode; strength?: number; className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.4 });

  const onMove = (e: PointerEvent<HTMLSpanElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.span className={cn("inline-block", className)} style={{ x: sx, y: sy }} onPointerMove={onMove} onPointerLeave={reset}>
      {children}
    </motion.span>
  );
}

type Common = { variant?: Variant; className?: string; children: ReactNode; magnetic?: boolean };

export function Btn({ variant = "primary", className, children, magnetic = true, ...rest }: Common & ComponentProps<"button">) {
  const el = (
    <button className={cn(BASE, VARIANTS[variant], className)} {...rest}>
      <Inner variant={variant}>{children}</Inner>
    </button>
  );
  return magnetic ? <Magnetic>{el}</Magnetic> : el;
}

export function BtnLink({
  variant = "primary",
  className,
  children,
  magnetic = true,
  href,
  label,
  external,
  ...rest
}: Common & { href: string; label?: string; external?: boolean } & Omit<ComponentProps<"a">, "href">) {
  const cls = cn(BASE, VARIANTS[variant], className);
  const el = external ? (
    <a href={href} className={cls} target="_blank" rel="noreferrer" {...rest}>
      <Inner variant={variant}>{children}</Inner>
    </a>
  ) : (
    <TransitionLink href={href} label={label} className={cls} scroll={false} {...rest}>
      <Inner variant={variant}>{children}</Inner>
    </TransitionLink>
  );
  return magnetic ? <Magnetic>{el}</Magnetic> : el;
}
