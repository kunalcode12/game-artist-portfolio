"use client";

import { useLenis } from "lenis/react";
import { ArrowUp, ArrowUpRight, Lock, Trophy } from "lucide-react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ACHIEVEMENTS, useAchievements } from "@/components/providers/AchievementsProvider";
import { TransitionLink } from "@/components/providers/TransitionProvider";
import { ArtStationIcon, LinkedInIcon } from "@/components/ui/Icons";
import { NAV, site } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Footer() {
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { amount: 0.4 });
  const { unlock, unlocked } = useAchievements();
  const [panel, setPanel] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    if (seen) unlock("completionist");
  }, [seen, unlock]);

  const xp = ACHIEVEMENTS.filter((a) => unlocked.includes(a.id)).reduce((s, a) => s + a.xp, 0);

  return (
    <footer ref={ref} className="relative overflow-hidden border-t border-line bg-bg-2 pt-20">
      <div className="grid-floor pointer-events-none absolute inset-0 opacity-50 [mask-image:linear-gradient(to_top,black,transparent_75%)]" />

      <div className="shell relative">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="display text-5xl text-ink sm:text-6xl">{site.name}</p>
            <p className="label mt-4 text-ink-2">{site.role} · {site.tagline}</p>
            <p className="label mt-2 text-mute">{site.location}</p>
            <a href={`mailto:${site.email}`} className="mt-8 inline-block font-display text-2xl font-bold tracking-tight text-ink underline decoration-accent/50 decoration-1 underline-offset-8 transition-colors hover:text-accent sm:text-3xl">
              {site.email}
            </a>
          </div>

          <nav aria-label="Footer" className="md:col-span-3">
            <p className="label mb-5 text-mute">Navigate</p>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-3">
              {NAV.map((n) => (
                <li key={n.id}>
                  <TransitionLink href={`/#${n.id}`} label="Home base" scroll={false} className="text-sm text-ink-2 transition-colors hover:text-accent">
                    {n.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-4">
            <p className="label mb-5 text-mute">Elsewhere</p>
            <div className="flex flex-wrap gap-2">
              <Social href={site.artstation} icon={<ArtStationIcon className="size-4" />} label="ArtStation" />
              <Social href={site.linkedin} icon={<LinkedInIcon className="size-4" />} label="LinkedIn" />
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={() => setPanel((p) => !p)}
                aria-expanded={panel}
                className="chamfer-sm flex w-full items-center justify-between gap-3 border border-line-2 bg-white/[0.02] px-4 py-3 text-left transition-colors hover:border-accent/60"
              >
                <span className="flex items-center gap-3">
                  <Trophy size={16} className="text-accent" />
                  <span className="label text-ink">Achievements</span>
                </span>
                <span className="label-sm text-ink-2 tabular-nums">
                  {unlocked.length}/{ACHIEVEMENTS.length} · {xp} XP
                </span>
              </button>
              <div className="mt-2 h-[3px] w-full bg-white/[0.06]">
                <div className="h-full bg-accent transition-[width] duration-700" style={{ width: `${(unlocked.length / ACHIEVEMENTS.length) * 100}%` }} />
              </div>
              <AnimatePresence initial={false}>
                {panel && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    {ACHIEVEMENTS.map((a) => {
                      const got = unlocked.includes(a.id);
                      return (
                        <li key={a.id} className="flex items-start gap-3 border-b border-line py-3 last:border-0">
                          <span className={cn("mt-0.5 grid size-7 shrink-0 place-items-center border", got ? "border-accent/50 text-accent" : "border-line-2 text-dim")}>
                            {got ? <Trophy size={13} /> : <Lock size={12} />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={cn("block text-sm font-semibold", got ? "text-ink" : "text-mute")}>{got ? a.title : "Locked"}</span>
                            <span className="block text-xs text-mute">{got ? a.desc : `Hint: ${a.hint}`}</span>
                          </span>
                          <span className={cn("label-sm shrink-0", got ? "text-accent" : "text-dim")}>{a.xp} XP</span>
                        </li>
                      );
                    })}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* giant outlined name */}
        <div className="relative mt-20 select-none" aria-hidden>
          <p className="display text-outline whitespace-nowrap text-center text-[clamp(3.5rem,15.2vw,16rem)] leading-[0.8]">Sohan Singh</p>
        </div>

        <div className="relative flex flex-col items-start justify-between gap-4 border-t border-line py-6 sm:flex-row sm:items-center">
          <p className="label-sm text-mute">© 2026 {site.name}. All rights reserved.</p>
          <p className="label-sm hidden items-center gap-2 text-mute md:flex">
            Hotkeys <span className="kbd">4</span> wireframe <span className="kbd">5</span> shaded <span className="text-dim">·</span> ↑↑↓↓←→←→BA
          </p>
          <button
            type="button"
            onClick={() => lenis?.scrollTo(0, { duration: 2.2 })}
            className="label-sm group flex items-center gap-2 text-ink-2 transition-colors hover:text-accent"
          >
            Back to top
            <span className="grid size-7 place-items-center border border-line-2 transition-transform group-hover:-translate-y-0.5 group-hover:border-accent">
              <ArrowUp size={13} />
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}

function Social({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="chamfer-sm flex items-center gap-2.5 border border-line-2 bg-white/[0.02] px-4 py-2.5 text-sm text-ink-2 transition-colors hover:border-accent hover:text-accent"
    >
      {icon}
      {label}
      <ArrowUpRight size={14} />
    </a>
  );
}
