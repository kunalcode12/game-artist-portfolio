"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { TransitionLink } from "@/components/providers/TransitionProvider";
import { BtnLink } from "@/components/ui/Button";
import type { CardData } from "@/lib/cards";
import { cn } from "@/lib/utils";

export function ProjectOutro({ more, prev, next }: { more: CardData[]; prev: CardData; next: CardData }) {
  return (
    <div className="shell pb-28 sm:pb-36">
      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="chamfer relative overflow-hidden border border-line-2 bg-panel px-6 py-14 text-center sm:px-12 sm:py-20"
      >
        <div className="grid-floor pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="hud-corners pointer-events-none absolute inset-3" />
        <p className="label relative text-accent">End of level</p>
        <h2 className="display relative mx-auto mt-4 max-w-4xl text-[clamp(2.6rem,6vw,6rem)] text-ink">Interested in this asset or pipeline?</h2>
        <p className="relative mx-auto mt-5 max-w-xl text-ink-2">Let&apos;s talk about hard-surface modeling, game-ready props, PBR texturing — or a role on your team.</p>
        <div className="relative mt-10 flex flex-wrap justify-center gap-3">
          <BtnLink href="/#contact" variant="accent" label="Home base" data-cursor="lock">
            Get in touch <ArrowUpRight size={15} />
          </BtnLink>
          <BtnLink href="/#work" variant="outline" label="Home base" data-cursor="lock">
            View more projects
          </BtnLink>
        </div>
      </motion.div>

      {/* more work */}
      <div className="mt-28 sm:mt-36">
        <div className="mb-10 flex items-end justify-between gap-4">
          <h2 className="display text-[clamp(2.4rem,5vw,4.5rem)] text-ink">More work</h2>
          <TransitionLink href="/#work" label="Home base" scroll={false} className="label group flex items-center gap-2 text-ink-2 hover:text-accent">
            All projects <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </TransitionLink>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {more.map((c, i) => (
            <motion.div key={c.slug} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: i * 0.08 }}>
              <TransitionLink href={`/work/${c.slug}`} label={c.title} className="panel group block overflow-hidden" data-cursor="view" data-cursor-label="Open">
                <span className="relative block aspect-[16/10] overflow-hidden bg-black">
                  <Image src={c.cover.src} alt={c.title} fill sizes="(min-width: 768px) 33vw, 100vw" placeholder="blur" blurDataURL={c.cover.blur} className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-quint)] group-hover:scale-105" />
                  <span className="label-sm absolute left-3 top-3 bg-accent px-2 py-1 text-black">{c.category}</span>
                </span>
                <span className="block p-5">
                  <span className="display block text-3xl text-ink transition-colors group-hover:text-accent">{c.title}</span>
                  <span className="label-sm mt-2 block text-mute">
                    {c.discipline}
                    {c.tris ? ` · ${c.tris}` : ""}
                  </span>
                </span>
              </TransitionLink>
            </motion.div>
          ))}
        </div>
      </div>

      {/* prev / next */}
      <nav aria-label="Project navigation" className="mt-20 grid gap-5 border-t border-line pt-10 md:grid-cols-2">
        {[
          { c: prev, dir: "prev" as const },
          { c: next, dir: "next" as const },
        ].map(({ c, dir }) => (
          <TransitionLink
            key={dir}
            href={`/work/${c.slug}`}
            label={c.title}
            className={cn("panel group flex items-center gap-5 p-4 transition-colors hover:border-accent/40 sm:p-5", dir === "next" && "md:flex-row-reverse md:text-right")}
            data-cursor="lock"
          >
            <span className="relative size-20 shrink-0 overflow-hidden border border-line-2 sm:size-24">
              <Image src={c.cover.thumb} alt="" fill sizes="96px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn("label-sm flex items-center gap-2 text-mute", dir === "next" && "md:justify-end")}>
                {dir === "prev" ? <ArrowLeft size={12} /> : null}
                {dir === "prev" ? "Previous project" : "Next project"}
                {dir === "next" ? <ArrowRight size={12} /> : null}
              </span>
              <span className="display mt-1 block truncate text-3xl text-ink transition-colors group-hover:text-accent sm:text-4xl">{c.title}</span>
              <span className="label-sm mt-1 block text-dim">{c.discipline}</span>
            </span>
          </TransitionLink>
        ))}
      </nav>
    </div>
  );
}
