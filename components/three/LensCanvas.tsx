"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { fullscreenVert, lensFrag } from "./shaders";
import { blankTexture, loadTexture, texSize } from "./textures";

export type LensSlide = { base: string; pass: string };
export type LensPointer = { x: number; y: number; inside: boolean };

type Props = {
  slides: LensSlide[];
  target: number;
  invert: boolean;
  pointer: RefObject<LensPointer>;
  active: boolean;
  /** reduced motion: the lens rests instead of auto-scanning */
  still?: boolean;
  onShown: (i: number) => void;
};

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function LensPlane({ slides, target, invert, pointer, still, onShown }: Omit<Props, "active">) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const size = useThree((s) => s.size);
  const st = useRef({ shown: -1, to: -1, mix: 0, moving: false, lens: 0, invert: 0, mouse: new THREE.Vector2(0.5, 0.5) });

  const uniforms = useMemo(
    () => ({
      uA: { value: blankTexture() as THREE.Texture },
      uAP: { value: blankTexture() as THREE.Texture },
      uB: { value: blankTexture() as THREE.Texture },
      uBP: { value: blankTexture() as THREE.Texture },
      uImgA: { value: new THREE.Vector2(16, 9) },
      uImgB: { value: new THREE.Vector2(16, 9) },
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uMix: { value: 0 },
      uRadius: { value: 0.15 },
      uLens: { value: 0 },
      uInvert: { value: 0 },
      uTime: { value: 0 },
    }),
    []
  );

  // Load the requested slide (or a new lens pass for the current one) and queue the swap.
  useEffect(() => {
    if (target < 0) return;
    let cancelled = false;
    const S = st.current;
    const slide = slides[target];
    if (target === S.shown && !S.moving) {
      loadTexture(slide.pass).then((p) => {
        if (!cancelled && mat.current) mat.current.uniforms.uAP.value = p;
      });
    } else {
      Promise.all([loadTexture(slide.base), loadTexture(slide.pass)]).then(([b, p]) => {
        if (cancelled || !mat.current) return;
        const u = mat.current.uniforms;
        u.uB.value = b;
        u.uBP.value = p;
        (u.uImgB.value as THREE.Vector2).copy(texSize(b));
        S.to = target;
        S.mix = 0;
        S.moving = true;
      });
    }
    // warm the cache for the slide after this one
    const next = slides[(target + 1) % slides.length];
    void loadTexture(next.base).catch(() => {});
    void loadTexture(next.pass).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [target, slides]);

  useFrame((state, delta) => {
    const m = mat.current;
    if (!m) return;
    const u = m.uniforms;
    const S = st.current;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    u.uTime.value = t;
    (u.uRes.value as THREE.Vector2).set(size.width, size.height);

    const p = pointer.current;
    const tx = p?.inside ? p.x : still ? 0.62 : 0.5 + 0.22 * Math.sin(t * 0.42);
    const ty = p?.inside ? p.y : still ? 0.55 : 0.52 + 0.17 * Math.sin(t * 0.61 + 1.3);
    const k = 1 - Math.exp(-dt * (p?.inside ? 16 : 2.5));
    S.mouse.x += (tx - S.mouse.x) * k;
    S.mouse.y += (ty - S.mouse.y) * k;
    (u.uMouse.value as THREE.Vector2).copy(S.mouse);

    S.lens += ((S.shown >= 0 ? 1 : 0) - S.lens) * (1 - Math.exp(-dt * 3));
    u.uLens.value = S.lens;
    u.uRadius.value += ((p?.inside ? 0.2 : 0.155) - u.uRadius.value) * (1 - Math.exp(-dt * 6));
    S.invert += ((invert ? 1 : 0) - S.invert) * (1 - Math.exp(-dt * 7));
    u.uInvert.value = S.invert;

    if (S.moving) {
      S.mix = Math.min(1, S.mix + dt / (S.shown < 0 ? 1.6 : 1.15));
      u.uMix.value = easeInOut(S.mix);
      if (S.mix >= 1) {
        u.uA.value = u.uB.value;
        u.uAP.value = u.uBP.value;
        (u.uImgA.value as THREE.Vector2).copy(u.uImgB.value as THREE.Vector2);
        u.uMix.value = 0;
        S.moving = false;
        S.shown = S.to;
        onShown(S.shown);
      }
    }
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={fullscreenVert} fragmentShader={lensFrag} depthTest={false} depthWrite={false} />
    </mesh>
  );
}

export default function LensCanvas({ active, ...props }: Props) {
  return (
    <Canvas
      className="!absolute inset-0"
      flat
      linear
      dpr={[1, 1.75]}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0, 1] }}
    >
      <LensPlane {...props} />
    </Canvas>
  );
}
