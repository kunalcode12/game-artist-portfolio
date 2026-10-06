"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useFinePointer } from "@/lib/hooks";

type State = "default" | "link" | "lock" | "view" | "drag" | "zoom" | "scan" | "text" | "play";

const SIZE: Record<State, number> = { default: 30, link: 46, lock: 0, view: 96, drag: 64, zoom: 58, scan: 0, text: 0, play: 88 };
const LABEL: Partial<Record<State, string>> = { view: "View", drag: "Drag", zoom: "Zoom", play: "Play", scan: "Scan" };
const TARGETS = "[data-cursor], a, button, input, textarea, select, [role='button'], label[for]";

/**
 * Viewport-reticle cursor: a dot that tracks the pointer 1:1 and a bracket frame (with a
 * spinning CSS-3D wireframe cube) that trails it, locks onto small controls, and expands
 * with a label over media. Everything runs in one rAF loop writing transforms — no renders.
 */
export function Cursor() {
  const fine = useFinePointer();
  return fine ? <CursorImpl /> : null;
}

function CursorImpl() {
  const rootRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();
  const resolveRef = useRef<() => void>(() => {});

  useEffect(() => {
    const root = rootRef.current!;
    const dot = dotRef.current!;
    const frame = frameRef.current!;
    const labelEl = labelRef.current!;
    document.documentElement.classList.add("has-cursor");

    let mx = -100;
    let my = -100;
    let fx = mx;
    let fy = my;
    let fw = SIZE.default;
    let fh = SIZE.default;
    let state: State = "default";
    let lockEl: Element | null = null;
    let visible = false;
    let raf = 0;
    let last = performance.now();
    let scrollQueued = false;
    let lastResolve = 0;

    const setState = (next: State, label: string) => {
      if (next !== state) {
        state = next;
        root.dataset.state = next;
      }
      labelEl.textContent = label;
      root.dataset.label = label ? "true" : "false";
    };

    const resolve = (target: Element | null) => {
      const el = target?.closest?.(TARGETS) ?? null;
      lockEl = null;
      if (!el) return setState("default", "");
      const dc = el.getAttribute("data-cursor") as State | "none" | null;
      if (dc === "none") return setState("default", "");
      if (dc) {
        if (dc === "lock") lockEl = el;
        return setState(dc, el.getAttribute("data-cursor-label") ?? LABEL[dc] ?? "");
      }
      if (el.matches("input, textarea, select")) return setState("text", "");
      const r = el.getBoundingClientRect();
      if (r.width < 320 && r.height < 120) {
        lockEl = el;
        return setState("lock", "");
      }
      setState("link", "");
    };

    const resolveAtPointer = () => resolve(document.elementFromPoint(mx, my));
    resolveRef.current = resolveAtPointer;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX;
      my = e.clientY;
      if (!visible) {
        visible = true;
        fx = mx;
        fy = my;
        root.dataset.visible = "true";
      }
      // WebGL hovers flip data-cursor without DOM pointerover events — re-check occasionally
      const now = performance.now();
      if (now - lastResolve > 90) {
        lastResolve = now;
        resolve(e.target as Element);
      }
    };
    const onOver = (e: PointerEvent) => {
      if (e.pointerType === "mouse") resolve(e.target as Element);
    };
    const onDown = () => frame.classList.add("is-down");
    const onUp = () => frame.classList.remove("is-down");
    const onLeave = () => {
      visible = false;
      root.dataset.visible = "false";
    };
    // content moving under a still pointer (smooth scroll), or a hovered element changing its
    // data-cursor (zoomed lightbox → "pan"), must re-target the cursor
    const onScroll = () => {
      if (scrollQueued || !visible) return;
      scrollQueued = true;
      requestAnimationFrame(() => {
        scrollQueued = false;
        resolveAtPointer();
      });
    };
    const onUpRetarget = () => setTimeout(onScroll, 30);

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;

      let tx = mx;
      let ty = my;
      let tw = SIZE[state];
      let th = tw;
      if (state === "lock") {
        if (lockEl?.isConnected) {
          const r = lockEl.getBoundingClientRect();
          tx = r.left + r.width / 2;
          ty = r.top + r.height / 2;
          tw = r.width + 16;
          th = r.height + 14;
        } else {
          setState("default", "");
          tw = th = SIZE.default;
        }
      }
      const k = 1 - Math.exp(-dt * (state === "lock" ? 16 : 20));
      fx += (tx - fx) * k;
      fy += (ty - fy) * k;
      fw += (tw - fw) * k;
      fh += (th - fh) * k;
      frame.style.transform = `translate3d(${fx - fw / 2}px, ${fy - fh / 2}px, 0)`;
      frame.style.width = `${fw}px`;
      frame.style.height = `${fh}px`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onUpRetarget, { passive: true });
    window.addEventListener("pointerup", onUpRetarget, { passive: true });
    window.addEventListener("keyup", onUpRetarget, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onUpRetarget);
      window.removeEventListener("pointerup", onUpRetarget);
      window.removeEventListener("keyup", onUpRetarget);
    };
  }, []);

  // new page under the pointer → re-evaluate what we're hovering
  useEffect(() => {
    const t = setTimeout(() => resolveRef.current(), 80);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div ref={rootRef} className="cursor-root" data-state="default" data-visible="false" aria-hidden>
      <div ref={frameRef} className="cursor-frame">
        <span className="c tl" />
        <span className="c tr" />
        <span className="c bl" />
        <span className="c br" />
        <span className="cursor-cube">
          <span className="cube" style={{ ["--size" as string]: "11px" }}>
            <i /><i /><i /><i /><i /><i />
          </span>
        </span>
        <span ref={labelRef} className="cursor-label" />
      </div>
      <div ref={dotRef} className="cursor-dot" />
    </div>
  );
}
