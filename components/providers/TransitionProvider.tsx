"use client";

import { useLenis } from "lenis/react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";
import { useSfx } from "./SfxProvider";

type Phase = "idle" | "cover" | "covered" | "reveal";
type State = { navigate: (href: string, label?: string) => void; phase: Phase };

const TransitionContext = createContext<State>({ navigate: () => {}, phase: "idle" });

const COLUMNS = 6;
const EASE = [0.76, 0, 0.24, 1] as const;
const COLUMN_DURATION = 0.48;
const STAGGER = 0.035;
/** Keep the "loading level" card readable even when the next route is already prefetched. */
const MIN_HOLD_MS = 260;

/**
 * "Loading next level" route transition: columns wipe up over the page, the route swaps
 * underneath while covered, then the columns continue upward to reveal the new page.
 */
export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();
  const { play } = useSfx();
  const [phase, setPhase] = useState<Phase>("idle");
  const [label, setLabel] = useState("");
  const phaseRef = useRef<Phase>("idle");
  const target = useRef<string | null>(null);
  const coveredAt = useRef(0);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const navigate = useCallback(
    (href: string, nextLabel?: string) => {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) {
        window.location.assign(href);
        return;
      }
      if (url.pathname === window.location.pathname) {
        // a stopped Lenis (open mobile menu) clips overflow, so wake it before scrolling
        lenis?.start();
        const el = url.hash ? document.getElementById(url.hash.slice(1)) : null;
        if (el) lenis?.scrollTo(el, { offset: -72, duration: 1.6, force: true });
        else if (!url.hash) lenis?.scrollTo(0, { duration: 1.6, force: true });
        return;
      }
      if (phaseRef.current !== "idle") return;
      target.current = url.pathname + url.search + url.hash;
      setLabel(nextLabel ?? (url.pathname === "/" ? "Home base" : "Next level"));
      phaseRef.current = "cover";
      setPhase("cover");
      play("open");
      router.prefetch(url.pathname);
    },
    [lenis, play, router]
  );

  const onCovered = useCallback(() => {
    if (phaseRef.current !== "cover" || !target.current) return;
    phaseRef.current = "covered";
    coveredAt.current = performance.now();
    setPhase("covered");
    router.push(target.current, { scroll: false });
  }, [router]);

  // Route swapped underneath the curtain: jump to the top (or hash) and reveal.
  useEffect(() => {
    if (phaseRef.current !== "covered") return;
    const hash = target.current?.split("#")[1];
    const el = hash ? document.getElementById(hash) : null;
    lenis?.scrollTo(el ?? 0, { immediate: true, force: true, offset: el ? -72 : 0 });
    if (!lenis) window.scrollTo(0, 0);
    const wait = Math.max(0, MIN_HOLD_MS - (performance.now() - coveredAt.current));
    const t = setTimeout(() => {
      phaseRef.current = "reveal";
      setPhase("reveal");
    }, wait);
    return () => clearTimeout(t);
  }, [pathname, lenis]);

  // Safety net: never leave the curtain down if a navigation stalls.
  useEffect(() => {
    if (phase !== "covered") return;
    const t = setTimeout(() => {
      phaseRef.current = "reveal";
      setPhase("reveal");
    }, 6000);
    return () => clearTimeout(t);
  }, [phase]);

  const onRevealed = useCallback(() => {
    if (phaseRef.current !== "reveal") return;
    phaseRef.current = "idle";
    setPhase("idle");
  }, []);

  const value = useMemo(() => ({ navigate, phase }), [navigate, phase]);
  const down = phase === "cover" || phase === "covered";

  return (
    <TransitionContext value={value}>
      {children}
      <div aria-hidden className={`fixed inset-0 z-[95] ${phase === "idle" ? "pointer-events-none" : "pointer-events-auto"}`}>
        {Array.from({ length: COLUMNS }, (_, i) => (
          <motion.div
            key={i}
            className="absolute top-0 h-full bg-[#09090b]"
            style={{
              left: `${(i * 100) / COLUMNS}%`,
              width: `calc(${100 / COLUMNS}% + 1px)`,
              transformOrigin: phase === "reveal" ? "50% 0%" : "50% 100%",
              boxShadow: "inset -1px 0 0 rgba(255,255,255,0.04)",
            }}
            initial={false}
            animate={{ scaleY: down ? 1 : 0 }}
            transition={{ duration: COLUMN_DURATION, ease: EASE, delay: i * STAGGER }}
            onAnimationComplete={i === COLUMNS - 1 ? (down ? onCovered : onRevealed) : undefined}
          />
        ))}
        <motion.div
          className="absolute inset-0 grid place-items-center"
          initial={false}
          animate={{ opacity: down ? 1 : 0, y: down ? 0 : -12 }}
          transition={{ duration: down ? 0.3 : 0.2, delay: phase === "cover" ? 0.22 : 0 }}
        >
          <div className="flex w-[min(520px,82vw)] flex-col items-center gap-5 text-center">
            <div className="cube" style={{ ["--size" as string]: "34px" }}>
              <i /><i /><i /><i /><i /><i />
            </div>
            <span className="label text-accent">Loading level</span>
            <span className="display text-5xl text-ink sm:text-7xl">{label}</span>
            <div className="relative h-[3px] w-full overflow-hidden bg-white/10">
              <motion.span
                className="absolute inset-y-0 left-0 w-1/3 bg-accent"
                animate={down ? { x: ["-100%", "300%"] } : { x: "-100%" }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </TransitionContext>
  );
}

export const usePageTransition = () => use(TransitionContext);

type LinkProps = ComponentProps<typeof Link> & { label?: string };

/** Drop-in <Link> that routes through the level-loading transition. */
export function TransitionLink({ href, label, onClick, children, ...rest }: LinkProps) {
  const { navigate } = usePageTransition();
  const url = typeof href === "string" ? href : `${href.pathname ?? ""}${href.hash ? `#${href.hash}` : ""}`;

  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || rest.target === "_blank") return;
    e.preventDefault();
    navigate(url, label);
  };

  return (
    <Link href={href} onClick={handle} {...rest}>
      {children}
    </Link>
  );
}
