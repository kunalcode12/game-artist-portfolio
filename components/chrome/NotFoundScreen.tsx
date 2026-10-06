"use client";

import { useEffect, useState } from "react";
import { usePageTransition } from "@/components/providers/TransitionProvider";
import { BtnLink } from "@/components/ui/Button";
import { Cube } from "@/components/ui/Icons";

export function NotFoundScreen() {
  const [count, setCount] = useState(9);
  const { navigate } = usePageTransition();

  useEffect(() => {
    if (count <= 0) {
      navigate("/", "Respawning");
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, navigate]);

  return (
    <section className="relative grid min-h-[100svh] place-items-center overflow-hidden px-5 py-32 text-center">
      <div className="grid-floor pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="relative flex flex-col items-center">
        <Cube size={56} speed={2.5} />
        <p className="label mt-10 text-accent">Error 404 · Level not found</p>
        <h1 className="display mt-4 text-[clamp(5rem,18vw,16rem)] text-ink">Game over</h1>
        <p className="mt-6 max-w-md text-ink-2">This level doesn&apos;t exist — the asset may have been moved, renamed or never baked.</p>
        <p className="label mt-10 text-mute">
          Continue? <span className="display ml-2 align-middle text-4xl text-accent tabular-nums">{count}</span>
        </p>
        <div className="mt-8">
          <BtnLink href="/" variant="accent" label="Respawning">
            Press start
          </BtnLink>
        </div>
      </div>
    </section>
  );
}
