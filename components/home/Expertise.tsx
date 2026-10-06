"use client";

import { motion } from "motion/react";
import type { PointerEvent, ReactNode } from "react";
import { Cube } from "@/components/ui/Icons";
import { SectionHeading } from "@/components/ui/SectionHeading";

const DISCIPLINES: { title: string; body: string; tags: string[]; icon: ReactNode }[] = [
  {
    title: "Hard Surface Modeling",
    body: "High-poly subdivision modeling in Autodesk Maya — controlled edge flow, support loops and bevels that hold the silhouette from every angle.",
    tags: ["Sub-D modeling", "Support loops", "Clean quads", "Bevels"],
    icon: <Cube size={34} speed={7} />,
  },
  {
    title: "Game-Ready Assets",
    body: "Low-poly meshes built to a triangle budget — from a 4.5K handheld to a 51.3K supercar — without losing the shapes and proportions of the reference.",
    tags: ["Tri budgets", "Silhouette", "Optimization", "LOD-minded"],
    icon: <DecimateIcon />,
  },
  {
    title: "UVs & Baking",
    body: "Clean UV layouts with consistent texel density on 4K texture sets, then high-to-low bakes for normal, ambient occlusion and color ID.",
    tags: ["UV unwrapping", "UDIM 1001", "Normal / AO", "Color ID"],
    icon: <FoldIcon />,
  },
  {
    title: "PBR Texturing & Lookdev",
    body: "Metallic/roughness texturing in Substance 3D Painter, Arnold lookdev with studio and HDRI lighting, and final presentation polish in Photoshop.",
    tags: ["Substance 3D Painter", "Metal / Rough", "Arnold", "HDRI"],
    icon: <MaterialBall />,
  },
];

export function Expertise() {
  return (
    <section id="expertise" className="relative overflow-hidden py-28 sm:py-36" aria-label="Core disciplines">
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="shell relative">
        <SectionHeading index="02" kicker="Technical focus" title="Core Disciplines">
          Focused on the hard-surface game-art pipeline — from reference and blueprint alignment to game-ready geometry, clean bakes and lookdev.
        </SectionHeading>

        <div className="mt-16 grid gap-5 sm:mt-20 md:grid-cols-2 xl:grid-cols-4">
          {DISCIPLINES.map((d, i) => (
            <motion.div
              key={d.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -10% 0px" }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <SpotlightCard index={i}>
                <div className="flex items-start justify-between">
                  <div className="grid size-20 place-items-center border border-line-2 bg-black/40">{d.icon}</div>
                  <span className="label text-dim tabular-nums">0{i + 1}</span>
                </div>
                <h3 className="display mt-10 text-[clamp(2rem,2.4vw,2.6rem)] text-ink">{d.title}</h3>
                <p className="mt-4 text-[15px] leading-relaxed text-mute">{d.body}</p>
                <div className="mt-auto pt-8">
                  <div className="flex flex-wrap gap-1.5 border-t border-line pt-5">
                    {d.tags.map((t) => (
                      <span key={t} className="label-sm border border-line px-2 py-1 text-ink-2 transition-colors group-hover:border-accent/30">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SpotlightCard({ children, index }: { children: ReactNode; index: number }) {
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div
      onPointerMove={onMove}
      data-sfx
      className="chamfer group relative h-full p-px [background:radial-gradient(420px_circle_at_var(--mx,50%)_var(--my,0%),rgba(255,166,48,0.55),rgba(255,255,255,0.07)_45%)]"
      data-index={index}
    >
      <div className="chamfer relative flex h-full min-h-[460px] flex-col bg-panel p-7 [background-image:radial-gradient(600px_circle_at_var(--mx,50%)_var(--my,0%),rgba(255,166,48,0.07),transparent_40%)] sm:p-8">
        {children}
      </div>
    </div>
  );
}

/** A dense triangle grid whose extra edges dissolve away — decimation in miniature. */
function DecimateIcon() {
  const pts = [0, 12, 24, 36, 48];
  return (
    <svg viewBox="-2 -2 52 52" className="size-12 overflow-visible" aria-hidden>
      {pts.map((p) => (
        <g key={p}>
          <line x1={p} y1={0} x2={p} y2={48} stroke="currentColor" className="text-ink-2" strokeWidth="0.8" />
          <line x1={0} y1={p} x2={48} y2={p} stroke="currentColor" className="text-ink-2" strokeWidth="0.8" />
        </g>
      ))}
      {pts.slice(0, 4).flatMap((x) =>
        pts.slice(0, 4).map((y) => (
          <line
            key={`${x}-${y}`}
            x1={x}
            y1={y + 12}
            x2={x + 12}
            y2={y}
            stroke="var(--color-accent)"
            strokeWidth="0.8"
            className="transition-opacity duration-500 group-hover:opacity-0"
            style={{ transitionDelay: `${((x + y) / 12) * 40}ms` }}
          />
        ))
      )}
      <rect x="0" y="0" width="48" height="48" fill="none" stroke="var(--color-accent)" strokeWidth="1.4" />
    </svg>
  );
}

/** A cross-shaped UV net that folds into a cube when the card is hovered. */
function FoldIcon() {
  const face = "absolute left-0 top-0 size-4 border border-accent bg-accent/15 transition-transform duration-700 ease-[var(--ease-quint)]";
  return (
    <div className="relative size-4 -translate-x-2 [perspective:200px] group-hover:translate-x-0 transition-transform duration-700" aria-hidden>
      <div className="relative size-4 transition-transform duration-700 ease-[var(--ease-quint)] [transform-style:preserve-3d] group-hover:[transform:rotateX(-28deg)_rotateY(38deg)]">
        <span className={face} />
        <span className={`${face} origin-bottom [transform:translateY(-100%)_rotateX(0deg)] group-hover:[transform:translateY(-100%)_rotateX(-90deg)]`} />
        <span className={`${face} origin-top [transform:translateY(100%)_rotateX(0deg)] group-hover:[transform:translateY(100%)_rotateX(90deg)]`} />
        <span className={`${face} origin-right [transform:translateX(-100%)_rotateY(0deg)] group-hover:[transform:translateX(-100%)_rotateY(90deg)]`} />
        <span className={`${face} origin-left [transform:translateX(100%)_rotateY(0deg)] group-hover:[transform:translateX(100%)_rotateY(-90deg)]`} />
        <span
          className={`${face} origin-left [transform:translateX(100%)_rotateY(0deg)_translateX(100%)_rotateY(0deg)] group-hover:[transform:translateX(100%)_rotateY(-90deg)_translateX(100%)_rotateY(-90deg)]`}
        />
      </div>
    </div>
  );
}

/** Substance-style material preview ball: rough plastic that turns into polished metal on hover. */
function MaterialBall() {
  return (
    <span aria-hidden className="relative block size-12 overflow-hidden rounded-full shadow-[0_8px_20px_-6px_rgba(0,0,0,0.9)]">
      <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_30%,#6a5a46_0%,#3a2f22_45%,#120e09_100%)] transition-opacity duration-700 group-hover:opacity-0" />
      <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_34%_28%,#fff6e6_0%,#ffbb55_9%,#c46a12_32%,#3b1c03_70%,#000_100%)] opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
      <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_200deg,transparent,rgba(255,255,255,0.18),transparent_40%)] opacity-0 transition-opacity duration-700 group-hover:animate-spin group-hover:opacity-100 [animation-duration:4s]" />
    </span>
  );
}
