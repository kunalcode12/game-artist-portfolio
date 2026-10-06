"use client";

import { ArrowUpRight, Play } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import Image from "next/image";
import { useRef, useState, type PointerEvent } from "react";
import { useAchievements } from "@/components/providers/AchievementsProvider";
import { useDisplayMode } from "@/components/providers/DisplayModeProvider";
import { TransitionLink } from "@/components/providers/TransitionProvider";
import type { CardData } from "@/lib/cards";
import { cn } from "@/lib/utils";

export function ProjectCard({ card, sizes, mediaClass }: { card: CardData; sizes: string; mediaClass: string }) {
  const [hover, setHover] = useState(false);
  const [armed, setArmed] = useState(false);
  const [idx, setIdx] = useState(0);
  const [scanKey, setScanKey] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { mode } = useDisplayMode();
  const { unlock } = useAchievements();

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 160, damping: 20 });
  const sry = useSpring(ry, { stiffness: 160, damping: 20 });
  const glareX = useTransform(sry, [-5, 5], ["0%", "100%"]);

  const n = card.scrub.length;
  const wireIdx = Math.max(
    card.scrub.findIndex((s) => s.kind === "wire"),
    card.scrub.findIndex((s) => s.kind === "ao")
  );
  const restIdx = mode === "wire" && wireIdx > 0 ? wireIdx : 0;
  const active = hover ? idx : restIdx;

  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    rx.set((0.5 - y) * 6);
    ry.set((x - 0.5) * 8);
    if (n > 1) {
      const i = Math.min(n - 1, Math.max(0, Math.floor(x * n)));
      if (i !== idx) {
        setIdx(i);
        setScanKey((k) => k + 1);
        if (i === n - 1) unlock("passes");
      }
    }
  };

  const onEnter = (e: PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== "mouse") return;
    setHover(true);
    setArmed(true);
    void videoRef.current?.play().catch(() => {});
  };

  const onLeave = () => {
    setHover(false);
    setIdx(0);
    rx.set(0);
    ry.set(0);
    videoRef.current?.pause();
  };

  return (
    <div className="[perspective:1400px]">
      <motion.div style={{ rotateX: srx, rotateY: sry }} className="will-change-transform">
        <TransitionLink
          href={`/work/${card.slug}`}
          label={card.title}
          onPointerMove={onMove}
          onPointerEnter={onEnter}
          onPointerLeave={onLeave}
          data-cursor="view"
          data-cursor-label="Open"
          className="panel group relative flex h-full flex-col overflow-hidden transition-colors duration-500 hover:border-accent/40"
        >
          <div className={cn("relative overflow-hidden bg-black", mediaClass)}>
            <div className={cn("absolute inset-0 transition-transform duration-[1.2s] ease-[var(--ease-quint)]", hover && "scale-[1.04]")}>
              {card.video ? (
                <>
                  <Image src={card.cover.src} alt={`${card.title} — turntable still`} fill sizes={sizes} placeholder="blur" blurDataURL={card.cover.blur} className="object-cover" />
                  {armed && (
                    <video
                      ref={videoRef}
                      src={card.video}
                      muted
                      loop
                      playsInline
                      autoPlay
                      className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-500", hover ? "opacity-100" : "opacity-0")}
                    />
                  )}
                </>
              ) : (
                card.scrub.map((s, i) =>
                  i === 0 || i === restIdx || armed ? (
                    <Image
                      key={s.img.src}
                      src={s.img.src}
                      alt={i === 0 ? `${card.title} — ${s.label} render` : ""}
                      fill
                      sizes={sizes}
                      placeholder={i === 0 ? "blur" : "empty"}
                      blurDataURL={i === 0 ? s.img.blur : undefined}
                      className={cn("object-cover transition-opacity duration-300", i === active ? "opacity-100" : "opacity-0")}
                    />
                  ) : null
                )
              )}
            </div>

            {/* scan line flash on every pass change */}
            {hover && n > 1 && (
              <span key={scanKey} className="pointer-events-none absolute inset-x-0 top-0 h-full">
                <span className="absolute inset-x-0 h-px bg-accent shadow-[0_0_14px_2px_rgba(255,166,48,0.8)]" style={{ animation: "card-scan 0.5s cubic-bezier(.22,1,.36,1) forwards" }} />
              </span>
            )}

            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.08) 48%, transparent 66%)", backgroundSize: "250% 100%", backgroundPositionX: glareX }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
            <div className="hud-corners absolute inset-3 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4 sm:p-5">
              <span className="flex items-center gap-2">
                <span className="label-sm bg-black/60 px-2 py-1 text-ink backdrop-blur-sm">{card.index}</span>
                <span className="label-sm bg-accent px-2 py-1 font-semibold text-black">{card.category}</span>
              </span>
              {card.tris && (
                <span className="label-sm bg-black/60 px-2 py-1 text-ink-2 backdrop-blur-sm">
                  {card.tris}
                  {card.trisNote && <span className="hidden text-mute xl:inline"> · {card.trisNote}</span>}
                </span>
              )}
            </div>

            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
              {n > 1 ? (
                <div className="flex gap-1 opacity-70 transition-opacity duration-300 group-hover:opacity-100">
                  {card.scrub.map((s, i) => (
                    <span key={s.label} className="flex flex-1 flex-col gap-1.5">
                      <span className={cn("h-[2px] w-full transition-colors duration-200", i === active ? "bg-accent" : "bg-white/25")} />
                      <span className={cn("label-sm text-[9px] transition-colors", i === active ? "text-accent" : "text-ink-2/70")}>{s.label}</span>
                    </span>
                  ))}
                </div>
              ) : (
                card.video && (
                  <span className="label-sm flex w-fit items-center gap-2 bg-black/60 px-2.5 py-1.5 text-ink backdrop-blur-sm">
                    <Play size={11} className="fill-current" /> Hover to play turntable
                  </span>
                )
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <h3 className="display text-[clamp(2rem,2.9vw,3rem)] text-ink transition-colors duration-300 group-hover:text-accent">{card.title}</h3>
              <span className="mt-1 grid size-10 shrink-0 place-items-center border border-line-2 text-ink-2 transition-all duration-500 group-hover:rotate-45 group-hover:border-accent group-hover:bg-accent group-hover:text-black">
                <ArrowUpRight size={18} />
              </span>
            </div>
            <p className="label-sm flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-2">
              <span className="text-accent">{card.discipline}</span>
              <span className="text-dim">/</span>
              {card.software.join(" · ")}
            </p>
            <p className="line-clamp-2 text-[15px] leading-relaxed text-mute">{card.summary}</p>
          </div>
        </TransitionLink>
      </motion.div>
    </div>
  );
}
