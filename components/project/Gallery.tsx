"use client";

import { Aperture, Box, Eye, Layers, Maximize2, Sun } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import type { MouseEvent } from "react";
import { useLightbox } from "@/components/lightbox/Lightbox";
import type { LightboxItem } from "@/lib/lightbox";
import type { Img } from "@/lib/projects";
import { cn, pad } from "@/lib/utils";

const ICONS = { eye: Eye, sun: Sun, box: Box, aperture: Aperture, layers: Layers };

export type GalleryGroup = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof ICONS;
  shots: { img: Img; title: string; tag: string; index: number }[];
};

export function Gallery({ groups, items, startIndex }: { groups: GalleryGroup[]; items: LightboxItem[]; startIndex: number }) {
  const open = useLightbox();
  const show = (i: number) => (e: MouseEvent<HTMLButtonElement>) => open(items, i, e.currentTarget.querySelector("img")?.getBoundingClientRect() ?? null);

  return (
    <div className="space-y-28 sm:space-y-36">
      {groups.map((g, gi) => {
        const Icon = ICONS[g.icon];
        const n = g.shots.length;
        return (
          <section key={g.id} id={g.id} aria-labelledby={`${g.id}-title`} className="scroll-mt-28">
            <div className="mb-10 flex flex-col gap-4 border-t border-line pt-10 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-start gap-5">
                <span className="mt-2 grid size-12 shrink-0 place-items-center border border-line-2 text-accent">
                  <Icon size={20} strokeWidth={1.5} />
                </span>
                <div>
                  <p className="label-sm text-mute">
                    {pad(startIndex + gi)} — Breakdown · {n} {n === 1 ? "frame" : "frames"}
                  </p>
                  <h2 id={`${g.id}-title`} className="display mt-2 text-[clamp(2.4rem,5vw,4.8rem)] text-ink">
                    {g.title}
                  </h2>
                  <p className="label mt-3 max-w-2xl normal-case tracking-[0.06em] text-ink-2">{g.subtitle}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 md:gap-6">
              {g.shots.map((s, i) => {
                const wide = n !== 2 && (i === 0 || (i === n - 1 && (n - 1) % 2 === 1));
                return (
                  <motion.div
                    key={s.img.src}
                    className={cn(wide && "md:col-span-2")}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: (i % 2) * 0.08 }}
                  >
                    <button type="button" onClick={show(s.index)} className="group panel block w-full overflow-hidden text-left" data-cursor="zoom" data-cursor-label="Inspect">
                      <span className="relative block overflow-hidden bg-black" style={{ aspectRatio: `${s.img.w} / ${s.img.h}` }}>
                        <Image
                          src={s.img.src}
                          alt={s.title}
                          fill
                          sizes={wide ? "(min-width: 1680px) 1600px, 100vw" : "(min-width: 768px) 50vw, 100vw"}
                          placeholder="blur"
                          blurDataURL={s.img.blur}
                          className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-quint)] group-hover:scale-[1.03]"
                        />
                        <span className="hud-corners absolute inset-3 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      </span>
                      <span className="flex items-center justify-between gap-4 border-t border-line px-4 py-3.5 sm:px-5">
                        <span className="min-w-0">
                          <span className="label-sm text-accent">{s.tag}</span>
                          <span className="mt-1 block truncate text-sm font-semibold text-ink">{s.title}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                          <span className="label-sm hidden text-mute sm:inline">
                            {s.img.ow} × {s.img.oh}
                          </span>
                          <span className="grid size-8 place-items-center border border-line-2 text-ink-2 transition-colors group-hover:border-accent group-hover:text-accent">
                            <Maximize2 size={13} />
                          </span>
                        </span>
                      </span>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
