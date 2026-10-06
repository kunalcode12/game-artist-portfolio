import type { SVGProps } from "react";

// Brand marks from Simple Icons (CC0) — lucide-react no longer ships brand icons.

export function ArtStationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M0 17.723l2.027 3.505h.001a2.424 2.424 0 0 0 2.164 1.333h13.457l-2.792-4.838H0zm24 .025c0-.484-.143-.935-.388-1.314L15.728 2.728a2.424 2.424 0 0 0-2.142-1.289H9.419L21.598 22.54l1.92-3.325c.378-.637.482-.919.482-1.467zm-11.129-3.462L7.428 4.858l-5.444 9.428h10.887z" />
    </svg>
  );
}

export function LinkedInIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/** Viewport axis gizmo (X red, Y green, Z blue) — a little nod to every DCC app. */
export function AxisGizmo({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className={className} aria-hidden>
      <line x1="22" y1="22" x2="38" y2="27" stroke="var(--color-axis-x)" strokeWidth="1.6" />
      <line x1="22" y1="22" x2="22" y2="5" stroke="var(--color-axis-y)" strokeWidth="1.6" />
      <line x1="22" y1="22" x2="9" y2="31" stroke="var(--color-axis-z)" strokeWidth="1.6" />
      <circle cx="38" cy="27" r="3.4" fill="var(--color-axis-x)" />
      <circle cx="22" cy="5" r="3.4" fill="var(--color-axis-y)" />
      <circle cx="9" cy="31" r="3.4" fill="var(--color-axis-z)" />
      <text x="38" y="28.6" fontSize="4.6" textAnchor="middle" fill="#111" fontFamily="monospace" fontWeight="700">X</text>
      <text x="22" y="6.6" fontSize="4.6" textAnchor="middle" fill="#111" fontFamily="monospace" fontWeight="700">Y</text>
      <text x="9" y="32.6" fontSize="4.6" textAnchor="middle" fill="#111" fontFamily="monospace" fontWeight="700">Z</text>
      <circle cx="22" cy="22" r="1.8" fill="#ddd" />
    </svg>
  );
}

export function Cube({ size = 14, className, speed }: { size?: number; className?: string; speed?: number }) {
  return (
    <span className={className} style={{ perspective: size * 12, display: "inline-block" }} aria-hidden>
      <span className="cube" style={{ ["--size" as string]: `${size}px`, animationDuration: speed ? `${speed}s` : undefined }}>
        <i /><i /><i /><i /><i /><i />
      </span>
    </span>
  );
}
