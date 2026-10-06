"use client";

import { AnimatePresence, motion } from "motion/react";
import { createContext, use, useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { Trophy } from "lucide-react";
import { listCodec, persisted } from "@/lib/persisted";
import { useSfx } from "./SfxProvider";

export const ACHIEVEMENTS = [
  { id: "explorer", title: "Explorer", desc: "Opened your first project.", xp: 50, hint: "Open any project." },
  { id: "scanner", title: "Topology Inspector", desc: "Scanned a render with the X-ray lens.", xp: 50, hint: "Hover the hero viewport." },
  { id: "pixel", title: "Pixel Peeper", desc: "Zoomed into a full-res render.", xp: 25, hint: "Zoom inside the image viewer." },
  { id: "passes", title: "Pass Master", desc: "Flipped through every render pass of a shot.", xp: 75, hint: "Use a project's viewport toolbar." },
  { id: "wireframe", title: "Wireframe Vision", desc: "Used Maya's [4] hotkey.", xp: 100, hint: "Some Maya hotkeys work here…" },
  { id: "vault", title: "Vault Raider", desc: "Spun the render vault.", xp: 25, hint: "Drag the vault." },
  { id: "completionist", title: "Completionist", desc: "Reached the end of the level.", xp: 50, hint: "Scroll all the way down." },
  { id: "konami", title: "Cheat Code", desc: "↑ ↑ ↓ ↓ ← → ← → B A", xp: 999, hint: "A classic cheat code." },
] as const;

export type AchievementId = (typeof ACHIEVEMENTS)[number]["id"];

const store = persisted<string[]>("ss-achievements", [], listCodec);
const EMPTY: string[] = [];

type State = { unlocked: string[]; unlock: (id: AchievementId) => void };
const AchievementsContext = createContext<State>({ unlocked: EMPTY, unlock: () => {} });

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

/** Imperative burst of tiny wireframe cubes — pure DOM so it never touches React state. */
function cubeBurst() {
  const layer = document.createElement("div");
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:120;perspective:600px";
  document.body.appendChild(layer);
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  for (let i = 0; i < 46; i++) {
    const cube = document.createElement("div");
    const size = 8 + Math.random() * 18;
    cube.className = "cube";
    cube.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;--size:${size}px;animation-duration:${1 + Math.random() * 2}s`;
    cube.innerHTML = "<i></i><i></i><i></i><i></i><i></i><i></i>";
    layer.appendChild(cube);
    const angle = Math.random() * Math.PI * 2;
    const dist = 180 + Math.random() * Math.max(window.innerWidth, window.innerHeight) * 0.45;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    cube.animate(
      [
        { translate: "0 0", opacity: 1, scale: "0.2" },
        { translate: `${dx * 0.7}px ${dy * 0.7 - 80}px`, opacity: 1, scale: "1", offset: 0.55 },
        { translate: `${dx}px ${dy + 220}px`, opacity: 0, scale: "0.6" },
      ],
      { duration: 1700 + Math.random() * 900, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" }
    );
  }
  setTimeout(() => layer.remove(), 3000);
}

export function AchievementsProvider({ children }: { children: ReactNode }) {
  const unlocked = useSyncExternalStore(store.subscribe, store.get, () => EMPTY);
  const [toasts, setToasts] = useState<{ key: number; id: AchievementId }[]>([]);
  const { play } = useSfx();

  const unlock = useCallback(
    (id: AchievementId) => {
      const current = store.get();
      if (current.includes(id)) return;
      store.set([...current, id]);
      play("achievement");
      setToasts((t) => [...t, { key: performance.now(), id }]);
    },
    [play]
  );

  const dismiss = useCallback((key: number) => setToasts((t) => t.filter((x) => x.key !== key)), []);

  useEffect(() => {
    let i = 0;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === KONAMI[i]) {
        i++;
        if (i === KONAMI.length) {
          i = 0;
          cubeBurst();
          unlock("konami");
        }
      } else {
        i = k === KONAMI[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [unlock]);

  const value = useMemo(() => ({ unlocked, unlock }), [unlocked, unlock]);

  return (
    <AchievementsContext value={value}>
      {children}
      <div className="pointer-events-none fixed right-3 top-20 z-[75] flex w-[min(360px,calc(100vw-1.5rem))] flex-col gap-2 sm:right-6 sm:top-24">
        <AnimatePresence>
          {toasts.slice(-3).map((t) => (
            <Toast key={t.key} toastKey={t.key} id={t.id} dismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </AchievementsContext>
  );
}

function Toast({ id, toastKey, dismiss }: { id: AchievementId; toastKey: number; dismiss: (key: number) => void }) {
  const a = ACHIEVEMENTS.find((x) => x.id === id)!;
  useEffect(() => {
    const t = setTimeout(() => dismiss(toastKey), 4600);
    return () => clearTimeout(t);
  }, [dismiss, toastKey]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.25 } }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="chamfer-sm pointer-events-auto relative overflow-hidden border border-accent/30 bg-[#121009]/95 p-3.5 shadow-[0_20px_60px_-20px_rgba(255,166,48,0.35)] backdrop-blur-md"
      role="status"
    >
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center border border-accent/40 bg-accent/10 text-accent">
          <Trophy size={18} strokeWidth={1.6} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="label-sm text-accent">Achievement unlocked</span>
            <span className="label-sm text-ink-2">+{a.xp} XP</span>
          </div>
          <p className="mt-1 font-display text-lg font-extrabold uppercase leading-none tracking-tight text-ink">{a.title}</p>
          <p className="mt-1 text-[13px] leading-snug text-mute">{a.desc}</p>
        </div>
      </div>
      <motion.span
        className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-accent"
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 4.6, ease: "linear" }}
      />
    </motion.div>
  );
}

export const useAchievements = () => use(AchievementsContext);
