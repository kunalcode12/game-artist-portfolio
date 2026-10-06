"use client";

import { ArrowRight, Check, Copy, Download, Mail, MapPin } from "lucide-react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import { useState, type PointerEvent } from "react";
import { BtnLink } from "@/components/ui/Button";
import { FadeUp } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { site } from "@/lib/site";

const PERKS = [
  "Hard Surface Modeling",
  "Game-Ready Assets",
  "Low-Poly Optimization",
  "UV Unwrapping",
  "High-to-Low Baking",
  "PBR Texturing",
  "Look Development",
  "Clean Quad Topology",
  "Material Creation",
];

export type ProfileStats = { assets: number; tris: string; maps: number; renders: number };
/** Tools and how many of the projects actually used them (from the project write-ups). */
export type Loadout = { name: string; role: string; used: number; total: number }[];

export function About({ stats, loadout }: { stats: ProfileStats; loadout: Loadout }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <section id="about" className="relative overflow-hidden border-t border-line bg-bg-2 py-28 sm:py-36" aria-label="About">
      <div className="grid-floor pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_80%_40%,black,transparent_65%)]" />
      <div className="shell relative grid gap-16 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <SectionHeading index="05" kicker="Player one" title="About Me" />
          <FadeUp delay={0.1}>
            <p className="mt-10 max-w-3xl font-display text-[clamp(1.5rem,2.3vw,2.25rem)] font-semibold leading-[1.25] tracking-tight text-ink">
              I create detailed, game-ready hard-surface assets with a focus on <span className="text-accent">clean topology</span>, optimized geometry, UVs, baking and PBR texturing.
            </p>
          </FadeUp>
          <FadeUp delay={0.2} className="mt-8 max-w-2xl space-y-5 text-[clamp(1rem,1.15vw,1.12rem)] leading-relaxed text-ink-2">
            <p>
              I&apos;m Sohan Singh, a 3D game artist based in Delhi, India, focused on hard-surface modeling — props, vehicles, weapons and environment pieces. Every asset starts as a high-poly
              model in Autodesk Maya and is rebuilt as an optimized low-poly mesh, unwrapped and baked so the detail survives in real time.
            </p>
            <p>
              Texturing happens in Substance 3D Painter with a physically based metallic/roughness workflow, followed by lookdev and rendering in Arnold and final presentation in Photoshop. I care
              about shapes and proportions that stay true to the reference, triangle budgets that make sense for the game, clean bakes, and materials that tell a story through wear.
            </p>
          </FadeUp>
          <FadeUp delay={0.3} className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-line pt-8">
            <span className="label flex items-center gap-2 text-ink-2">
              <MapPin size={14} className="text-accent" /> {site.location}
            </span>
            <button type="button" onClick={copy} className="label group flex items-center gap-2 text-ink-2 transition-colors hover:text-accent" aria-label={`Copy email ${site.email}`}>
              <Mail size={14} className="text-accent" />
              <span className="normal-case tracking-[0.06em]">{site.email}</span>
              {copied ? <Check size={13} className="text-accent" /> : <Copy size={13} className="opacity-50 group-hover:opacity-100" />}
            </button>
          </FadeUp>
          <FadeUp delay={0.4} className="mt-10 flex flex-wrap gap-3">
            <BtnLink href="/#contact" variant="primary" data-cursor="lock">
              Start a conversation <ArrowRight size={15} />
            </BtnLink>
          </FadeUp>
        </div>

        <div id="resume" className="scroll-mt-28 lg:col-span-5">
          <HoloCard stats={stats} loadout={loadout} />
        </div>
      </div>
    </section>
  );
}

function HoloCard({ stats, loadout }: { stats: ProfileStats; loadout: Loadout }) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const px = useMotionValue(50);
  const py = useMotionValue(50);
  const srx = useSpring(rx, { stiffness: 140, damping: 16 });
  const sry = useSpring(ry, { stiffness: 140, damping: 16 });
  const foil = useMotionTemplate`radial-gradient(farthest-corner circle at ${px}% ${py}%, rgba(255,190,90,0.22) 0%, rgba(120,200,255,0.10) 28%, rgba(255,110,200,0.08) 45%, transparent 70%)`;
  const shine = useMotionTemplate`linear-gradient(115deg, transparent ${py}%, rgba(255,255,255,0.08) calc(${py}% + 8%), transparent calc(${py}% + 16%))`;

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    rx.set((0.5 - y) * 12);
    ry.set((x - 0.5) * 14);
    px.set(x * 100);
    py.set(y * 100);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
    px.set(50);
    py.set(50);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotateX: 18 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      className="[perspective:1400px] lg:sticky lg:top-28"
    >
      <motion.div
        onPointerMove={onMove}
        onPointerLeave={reset}
        style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d" }}
        className="chamfer group relative overflow-hidden border border-accent/25 bg-[linear-gradient(160deg,#16130e_0%,#0c0c0e_45%,#0a0a0c_100%)] p-6 shadow-[0_50px_120px_-40px_rgba(255,166,48,0.25)] sm:p-8"
        data-sfx
      >
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 mix-blend-color-dodge transition-opacity duration-500 group-hover:opacity-100" style={{ background: foil }} />
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: shine }} />
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-25" />

        <div className="relative" style={{ transform: "translateZ(40px)" }}>
          <div className="flex items-center justify-between">
            <span className="label text-accent">Player profile</span>
            <span className="label-sm flex items-center gap-2 text-ink-2">
              <span className="pulse-dot size-1.5 rounded-full bg-[#3ddc84]" /> Online
            </span>
          </div>

          <div className="mt-7 flex items-center gap-5">
            <div className="relative grid size-20 shrink-0 place-items-center">
              <svg viewBox="0 0 100 100" className="absolute inset-0 animate-[spin_14s_linear_infinite]" aria-hidden>
                <polygon points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeDasharray="6 5" />
              </svg>
              <svg viewBox="0 0 100 100" className="absolute inset-2" aria-hidden>
                <polygon points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5" fill="rgba(255,166,48,0.08)" stroke="rgba(255,166,48,0.5)" strokeWidth="1.5" />
              </svg>
              <span className="display relative text-3xl text-ink">SS</span>
            </div>
            <div className="min-w-0">
              <p className="display text-4xl text-ink sm:text-5xl">{site.name}</p>
              <p className="label-sm mt-2 text-ink-2">
                Class <span className="text-accent">·</span> Hard-Surface 3D Artist
              </p>
              <p className="label-sm mt-1 text-mute">Base · {site.location}</p>
            </div>
          </div>

          <div className="mt-8">
            <p className="label-sm mb-3 flex items-center gap-3 text-mute">
              Loadout <span className="h-px flex-1 bg-line" />
            </p>
            <ul className="space-y-3.5">
              {loadout.map((l, i) => (
                <li key={l.name}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold text-ink">{l.name}</span>
                    <span className="label-sm text-right text-[9px] text-mute">{l.role}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex flex-1 gap-[3px]" aria-hidden>
                      {Array.from({ length: l.total }, (_, k) => (
                        <motion.span
                          key={k}
                          className="h-1.5 flex-1"
                          initial={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                          whileInView={{ backgroundColor: k < l.used ? "#ffa630" : "rgba(255,255,255,0.06)" }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.4 + i * 0.12 + k * 0.06, duration: 0.25 }}
                        />
                      ))}
                    </div>
                    <span className="label-sm w-24 text-right text-[9px] text-ink-2 tabular-nums">
                      {l.used}/{l.total} projects
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            <p className="label-sm mb-3 flex items-center gap-3 text-mute">
              Perks <span className="h-px flex-1 bg-line" />
            </p>
            <ul className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              {PERKS.map((p) => (
                <li key={p} className="flex items-center gap-2 text-[13px] text-ink-2">
                  <Check size={13} className="shrink-0 text-accent" /> {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 grid grid-cols-4 border-y border-line py-4 text-center">
            {[
              { v: String(stats.assets).padStart(2, "0"), l: "Assets" },
              { v: stats.tris, l: "Tris" },
              { v: String(stats.maps), l: "Maps" },
              { v: String(stats.renders), l: "Renders" },
            ].map((s, i) => (
              <div key={s.l} className={i > 0 ? "border-l border-line" : ""}>
                <p className="display text-2xl text-ink sm:text-3xl">{s.v}</p>
                <p className="label-sm mt-1 text-[9px] text-mute">{s.l}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {site.resumeUrl ? (
              <BtnLink href={site.resumeUrl} external variant="accent" magnetic={false} className="flex-1">
                <Download size={15} /> Download CV
              </BtnLink>
            ) : (
              <BtnLink
                href={`mailto:${site.email}?subject=${encodeURIComponent("CV request — Sohan Singh")}`}
                external
                variant="accent"
                magnetic={false}
                className="flex-1"
              >
                <Mail size={15} /> Request full CV
              </BtnLink>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
