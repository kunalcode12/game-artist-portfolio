"use client";

import { createContext, use, useCallback, useEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from "react";
import { boolCodec, persisted } from "@/lib/persisted";

export type SfxName = "hover" | "click" | "open" | "close" | "switch" | "achievement" | "boot" | "tick";

type SfxState = { enabled: boolean; toggle: () => void; play: (name: SfxName) => void };

const SfxContext = createContext<SfxState>({ enabled: false, toggle: () => {}, play: () => {} });

const sfxPref = persisted("ss-sfx", false, boolCodec);

/** Tiny WebAudio synth — every UI sound is generated, no audio files to download. */
class Synth {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;

  private ensure() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.out = this.ctx.createGain();
      this.out.gain.value = 0.32;
      this.out.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return { ctx: this.ctx, out: this.out! };
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number, delay = 0) {
    const { ctx, out } = this.ensure();
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  play(name: SfxName) {
    switch (name) {
      case "hover":
        return this.tone(2100, 0.035, "sine", 0.035);
      case "tick":
        return this.tone(3200, 0.02, "square", 0.012);
      case "click":
        return this.tone(660, 0.08, "square", 0.04, 330);
      case "switch":
        this.tone(980, 0.05, "square", 0.03);
        return this.tone(1470, 0.06, "square", 0.025, undefined, 0.045);
      case "open":
        return this.tone(330, 0.16, "triangle", 0.08, 990);
      case "close":
        return this.tone(990, 0.14, "triangle", 0.07, 330);
      case "boot":
        this.tone(110, 0.5, "sawtooth", 0.035, 440);
        return this.tone(880, 0.25, "sine", 0.05, 1760, 0.35);
      case "achievement":
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 0.22, "triangle", 0.07, undefined, i * 0.085));
        return;
    }
  }
}

export function SfxProvider({ children }: { children: ReactNode }) {
  const enabled = useSyncExternalStore(sfxPref.subscribe, sfxPref.get, sfxPref.getServer);
  const synth = useRef<Synth | null>(null);

  const play = useCallback((name: SfxName) => {
    if (!sfxPref.get()) return;
    synth.current ??= new Synth();
    try {
      synth.current.play(name);
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    const next = !sfxPref.get();
    sfxPref.set(next);
    if (next) {
      synth.current ??= new Synth();
      synth.current.play("switch");
    }
  }, []);

  // Global delegation: every link/button gets hover + click feedback for free.
  useEffect(() => {
    if (!enabled) return;
    let last: Element | null = null;
    let lastAt = 0;
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const el = (e.target as Element).closest("a, button, [data-sfx]");
      if (!el || el === last) return;
      last = el;
      const now = performance.now();
      if (now - lastAt < 45) return;
      lastAt = now;
      play("hover");
    };
    const onOut = (e: PointerEvent) => {
      const el = (e.relatedTarget as Element | null)?.closest?.("a, button, [data-sfx]");
      if (!el) last = null;
    };
    const onDown = (e: PointerEvent) => {
      if ((e.target as Element).closest("a, button, [data-sfx]")) play("click");
    };
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [enabled, play]);

  const value = useMemo(() => ({ enabled, toggle, play }), [enabled, toggle, play]);
  return <SfxContext value={value}>{children}</SfxContext>;
}

export const useSfx = () => use(SfxContext);
