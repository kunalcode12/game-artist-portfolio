"use client";

import { Maximize2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { useLightbox } from "@/components/lightbox/Lightbox";
import { toLightboxItem } from "@/lib/lightbox";
import { CHANNEL_META, type TextureChannel, type TextureSet } from "@/lib/projects";
import { cn, pad } from "@/lib/utils";

export function TextureSets({ title, sets, uv }: { title: string; sets: TextureSet[]; uv?: string }) {
  const [si, setSi] = useState(0);
  const [channel, setChannel] = useState<TextureChannel>("basecolor");
  const open = useLightbox();
  const set = sets[si];
  const active = set.maps.find((m) => m.channel === channel) ?? set.maps[0];
  const res = `${active.img.ow} × ${active.img.oh}`;

  const openAll = () =>
    open(
      set.maps.map((m) => toLightboxItem(m.img, `${title} — ${CHANNEL_META[m.channel].label}`, `${set.name} · ${m.img.ow} × ${m.img.oh}`, CHANNEL_META[m.channel].short)),
      set.maps.indexOf(active)
    );

  return (
    <div>
      {sets.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-1 border border-line-2 bg-white/[0.02] p-1 sm:w-fit" role="tablist" aria-label="Texture set">
          {sets.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === si}
              onClick={() => setSi(i)}
              className={cn("label relative px-4 py-2.5 transition-colors", i === si ? "text-black" : "text-ink-2 hover:text-ink")}
            >
              {i === si && <motion.span layoutId={`texset-${title}`} className="absolute inset-0 bg-accent" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span className="relative">{s.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <button
          type="button"
          onClick={openAll}
          className="group relative aspect-square w-full overflow-hidden border border-line-2 bg-[#0b0b0c] lg:col-span-7"
          data-cursor="zoom"
          data-cursor-label="Inspect"
        >
          <span className="sr-only">Open the {set.name} texture maps at full resolution:</span>
          <div className="absolute inset-0 [background-image:linear-gradient(45deg,#121214_25%,transparent_25%),linear-gradient(-45deg,#121214_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#121214_75%),linear-gradient(-45deg,transparent_75%,#121214_75%)] [background-position:0_0,0_12px,12px_-12px,-12px_0] [background-size:24px_24px]" />
          <AnimatePresence initial={false}>
            <motion.div key={active.img.src} className="absolute inset-0" initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <Image src={active.img.src} alt={`${title} ${set.name} — ${CHANNEL_META[active.channel].label} map`} fill sizes="(min-width: 1024px) 56vw, 100vw" className="object-contain" />
            </motion.div>
          </AnimatePresence>
          <div className="hud-corners pointer-events-none absolute inset-3" />
          <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
            <span className="label-sm bg-black/70 px-2 py-1 text-accent">{CHANNEL_META[active.channel].label}</span>
            <span className="label-sm bg-black/70 px-2 py-1 text-ink-2">{res}</span>
            {uv && <span className="label-sm bg-black/70 px-2 py-1 text-ink-2">{uv}</span>}
          </div>
          <span className="absolute bottom-4 right-4 grid size-9 place-items-center border border-line-2 bg-black/70 text-ink-2 transition-colors group-hover:border-accent group-hover:text-accent">
            <Maximize2 size={14} />
          </span>
        </button>

        <div className="lg:col-span-5">
          <div className="panel chamfer h-full p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <span className="label text-ink">{set.name}</span>
              <span className="label-sm text-mute">
                {set.maps.length} channels · PBR metal / rough
              </span>
            </div>
            <ul className="mt-2" aria-label="Texture channels">
              {set.maps.map((m, i) => {
                const on = m.channel === active.channel;
                return (
                  <li key={m.channel}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => setChannel(m.channel)}
                      onPointerEnter={(e) => e.pointerType === "mouse" && setChannel(m.channel)}
                      className={cn("group flex w-full items-center gap-4 border-b border-line py-3 text-left transition-colors last:border-0", on ? "text-ink" : "text-mute hover:text-ink-2")}
                    >
                      <span className="relative size-11 shrink-0 overflow-hidden border border-line-2">
                        <Image src={m.img.thumb} alt="" fill sizes="44px" className="object-cover" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="label-sm text-dim">{pad(i + 1)}</span>
                          <span className={cn("font-semibold transition-colors", on && "text-accent")}>{CHANNEL_META[m.channel].label}</span>
                        </span>
                        <AnimatePresence initial={false}>
                          {on && (
                            <motion.span initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="block overflow-hidden">
                              <span className="block pt-1 text-[13px] leading-snug text-mute">{CHANNEL_META[m.channel].description}</span>
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </span>
                      <span className={cn("label-sm shrink-0", on ? "text-accent" : "text-dim")}>{CHANNEL_META[m.channel].short}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
