"use client";

import { useLenis } from "lenis/react";
import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSfx } from "@/components/providers/SfxProvider";
import { TransitionLink } from "@/components/providers/TransitionProvider";
import { ArtStationIcon, Cube } from "@/components/ui/Icons";
import { NAV, site } from "@/lib/site";
import { cn, pad } from "@/lib/utils";

export function Nav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const lenis = useLenis();

  useLenis(
    (l) => {
      const y = l.scroll;
      setScrolled(y > 24);
      setHidden(y > 220 && l.direction === 1 && !menu);
    },
    [menu]
  );

  // scrollspy (home only)
  useEffect(() => {
    if (!isHome) return;
    const els = NAV.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [isHome, pathname]);

  useEffect(() => {
    if (menu) lenis?.stop();
    else lenis?.start();
  }, [menu, lenis]);

  const close = () => setMenu(false);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[70] transition-[transform,background-color,border-color,backdrop-filter] duration-500 ease-[var(--ease-quint)]",
          hidden && !menu ? "-translate-y-full" : "translate-y-0",
          scrolled || menu ? "border-b border-line bg-bg/70 backdrop-blur-xl" : "border-b border-transparent"
        )}
      >
        <div className="shell flex h-16 items-center justify-between gap-6 sm:h-[72px]">
          <TransitionLink href="/" label="Home base" onClick={close} className="group flex items-center gap-3">
            <Cube size={13} className="transition-transform duration-500 group-hover:scale-125" />
            <span className="flex flex-col">
              <span className="display-wide text-[15px] leading-none text-ink sm:text-base">{site.name}</span>
              <span className="label-sm mt-1 text-[9px] text-mute">{site.role}</span>
            </span>
          </TransitionLink>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV.map((n) => {
                const on = isHome && active === n.id;
                return (
                  <li key={n.id}>
                    <TransitionLink
                      href={`/#${n.id}`}
                      label="Home base"
                      scroll={false}
                      className={cn("relative block px-3 py-2 text-[13px] font-medium tracking-wide transition-colors", on ? "text-ink" : "text-ink-2 hover:text-ink")}
                    >
                      {on && (
                        <motion.span layoutId="nav-active" className="absolute inset-x-3 -bottom-px h-px bg-accent" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
                      )}
                      {n.label}
                    </TransitionLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <SfxToggle />
            <a
              href={site.artstation}
              target="_blank"
              rel="noreferrer"
              className="chamfer-sm hidden items-center gap-2 border border-line-2 bg-white/[0.03] px-3.5 py-2 text-[11px] font-semibold tracking-[0.16em] text-ink transition-colors hover:border-accent hover:text-accent sm:flex"
            >
              <ArtStationIcon className="size-3.5" />
              ARTSTATION
              <ArrowUpRight size={13} />
            </a>
            <button
              type="button"
              onClick={() => setMenu((m) => !m)}
              aria-expanded={menu}
              aria-controls="mobile-menu"
              aria-label={menu ? "Close menu" : "Open menu"}
              className="grid size-10 place-items-center border border-line-2 lg:hidden"
            >
              <span className="relative block h-3 w-5">
                <span className={cn("absolute left-0 h-px w-full bg-ink transition-all duration-300", menu ? "top-1/2 rotate-45" : "top-0")} />
                <span className={cn("absolute left-0 h-px w-full bg-ink transition-all duration-300", menu ? "top-1/2 -rotate-45" : "top-full")} />
              </span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-[65] flex flex-col bg-bg/95 px-5 pb-8 pt-24 backdrop-blur-xl lg:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            data-lenis-prevent
          >
            <div className="grid-floor pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_top,black,transparent_70%)]" />
            <ul className="relative flex flex-1 flex-col justify-center gap-1">
              {NAV.map((n, i) => (
                <motion.li
                  key={n.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <TransitionLink href={`/#${n.id}`} label="Home base" scroll={false} onClick={close} className="group flex w-full items-baseline gap-4 py-1 text-left">
                    <span className="label text-accent">{pad(i + 1)}</span>
                    <span className="display text-[13vw] text-ink transition-colors group-hover:text-accent sm:text-7xl">{n.label}</span>
                  </TransitionLink>
                </motion.li>
              ))}
            </ul>
            <div className="relative flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <a href={`mailto:${site.email}`} className="label text-ink-2">
                {site.email}
              </a>
              <a href={site.artstation} target="_blank" rel="noreferrer" className="label flex items-center gap-2 text-accent">
                <ArtStationIcon className="size-3.5" /> ArtStation <ArrowUpRight size={12} />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SfxToggle() {
  const { enabled, toggle } = useSfx();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? "SFX on — mute interface sounds" : "SFX off — enable interface sounds"}
      title={enabled ? "Sound: on" : "Sound: off"}
      className="flex h-10 items-center gap-2 border border-line-2 px-3 text-ink-2 transition-colors hover:border-accent hover:text-accent"
    >
      <span className="flex h-3.5 items-end gap-[2px]" aria-hidden>
        {[0.9, 0.5, 1, 0.65].map((h, i) => (
          <span
            key={i}
            className="w-[2px] origin-bottom bg-current"
            style={{
              height: `${h * 100}%`,
              animation: enabled ? `eq ${0.7 + i * 0.13}s ease-in-out ${i * 0.08}s infinite` : "none",
              transform: enabled ? undefined : "scaleY(0.3)",
            }}
          />
        ))}
      </span>
      <span className="label-sm hidden text-[9px] sm:inline">{enabled ? "SFX ON" : "SFX OFF"}</span>
    </button>
  );
}
