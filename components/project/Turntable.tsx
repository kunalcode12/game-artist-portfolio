"use client";

import { Hand, Pause, Play } from "lucide-react";
import { useInView } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { Img } from "@/lib/projects";
import { cn, pad } from "@/lib/utils";

type Frames = { count: number; base: string; ext: string; w: number; h: number };

/**
 * Product-viz turntable: the frames extracted from the render are drawn to a canvas so the
 * visitor can scrub the rotation by dragging (or let it ping-pong on its own).
 */
export function Turntable({ title, frames, poster }: { title: string; frames: Frames; poster: Img }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const images = useRef<HTMLImageElement[]>([]);
  const state = useRef({ frame: 0, dir: 1, dragging: false, lastX: 0, acc: 0 });
  const readout = useRef<HTMLSpanElement>(null);
  const [loaded, setLoaded] = useState(0);
  const [playing, setPlaying] = useState(true);
  const inView = useInView(wrap, { margin: "200px" });
  const ready = loaded >= frames.count;

  useEffect(() => {
    if (!inView || images.current.length) return;
    let done = 0;
    images.current = Array.from({ length: frames.count }, (_, i) => {
      const img = new window.Image();
      img.decoding = "async";
      img.onload = img.onerror = () => {
        done++;
        setLoaded(done);
      };
      img.src = `${frames.base}${String(i).padStart(3, "0")}${frames.ext}`;
      return img;
    });
  }, [inView, frames]);

  // draw loop: ping-pong playback at ~24fps, or the scrubbed frame while dragging
  useEffect(() => {
    if (!ready || !inView) return;
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let last = performance.now();
    const draw = (now: number) => {
      const s = state.current;
      const dt = now - last;
      last = now;
      if (playing && !s.dragging) {
        s.acc += dt;
        while (s.acc > 42) {
          s.acc -= 42;
          s.frame += s.dir;
          if (s.frame >= frames.count - 1 || s.frame <= 0) s.dir *= -1;
        }
      }
      const i = Math.max(0, Math.min(frames.count - 1, Math.round(s.frame)));
      const img = images.current[i];
      if (img?.complete && img.naturalWidth) ctx.drawImage(img, 0, 0, frames.w, frames.h);
      if (readout.current) readout.current.textContent = `${pad(i + 1, 3)} / ${frames.count}`;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [ready, inView, playing, frames]);

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    state.current.dragging = true;
    state.current.lastX = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = state.current;
    if (!s.dragging) return;
    const w = wrap.current?.clientWidth ?? 1000;
    s.frame = Math.max(0, Math.min(frames.count - 1, s.frame + ((e.clientX - s.lastX) / w) * frames.count * 1.6));
    s.lastX = e.clientX;
  };
  const onUp = () => {
    state.current.dragging = false;
  };

  return (
    <div>
      <div
        ref={wrap}
        className="group relative aspect-video w-full touch-pan-y select-none overflow-hidden border border-line-2 bg-[#d9d3c3]"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        data-cursor="drag"
        data-cursor-label="Rotate"
      >
        <Image src={poster.src} alt={`${title} — turntable`} fill loading="eager" fetchPriority="high" sizes="100vw" placeholder="blur" blurDataURL={poster.blur} className={cn("object-cover transition-opacity duration-500", ready && "opacity-0")} />
        <canvas ref={canvas} width={frames.w} height={frames.h} className={cn("absolute inset-0 h-full w-full transition-opacity duration-500", ready ? "opacity-100" : "opacity-0")} aria-hidden />
        <div className="hud-corners pointer-events-none absolute inset-4" style={{ ["--c" as string]: "#1a1a1a" }} />

        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 sm:left-6 sm:top-6">
          <span className="label-sm bg-black/75 px-2 py-1 text-ink">Turntable</span>
          <span ref={readout} className="label-sm bg-black/75 px-2 py-1 tabular-nums text-accent">
            001 / {frames.count}
          </span>
        </div>

        {!ready && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/20">
            <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${(loaded / frames.count) * 100}%` }} />
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 sm:bottom-6 sm:left-6 sm:right-6">
          <span className="label-sm flex items-center gap-2 bg-black/75 px-2.5 py-1.5 text-ink">
            <Hand size={12} className="text-accent" /> Drag to rotate
          </span>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="label-sm flex items-center gap-2 bg-black/75 px-2.5 py-1.5 text-ink transition-colors hover:text-accent"
            aria-pressed={playing}
          >
            {playing ? <Pause size={12} /> : <Play size={12} />} {playing ? "Pause" : "Play"}
          </button>
        </div>
      </div>
    </div>
  );
}
