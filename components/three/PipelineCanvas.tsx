"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { segment, type PipelineStage } from "@/lib/pipeline";
import { fullscreenVert, pipelineFrag } from "./shaders";
import { blankTexture, loadTexture, texSize } from "./textures";

type Props = { stages: PipelineStage[]; stage: MotionValue<number>; active: boolean };

function PipelinePlane({ stages, stage }: Omit<Props, "active">) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const size = useThree((s) => s.size);
  const textures = useRef<THREE.Texture[] | null>(null);

  const uniforms = useMemo(
    () => ({
      uFrom: { value: blankTexture() as THREE.Texture },
      uTo: { value: blankTexture() as THREE.Texture },
      uFromSize: { value: new THREE.Vector2(16, 9) },
      uToSize: { value: new THREE.Vector2(16, 9) },
      uFromMode: { value: 0 },
      uToMode: { value: 0 },
      uWipe: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
    }),
    []
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all(stages.map((s) => loadTexture(s.url))).then((list) => {
      if (!cancelled) textures.current = list;
    });
    return () => {
      cancelled = true;
    };
  }, [stages]);

  useFrame((state) => {
    const m = mat.current;
    const list = textures.current;
    if (!m) return;
    const u = m.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    (u.uRes.value as THREE.Vector2).set(size.width, size.height);
    if (!list) return;
    const { from, to, wipe } = segment(stage.get(), list.length);
    u.uFrom.value = list[from];
    u.uTo.value = list[to];
    (u.uFromSize.value as THREE.Vector2).copy(texSize(list[from]));
    (u.uToSize.value as THREE.Vector2).copy(texSize(list[to]));
    u.uFromMode.value = stages[from].mode;
    u.uToMode.value = stages[to].mode;
    u.uWipe.value = wipe;
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={fullscreenVert} fragmentShader={pipelineFrag} depthTest={false} depthWrite={false} />
    </mesh>
  );
}

export default function PipelineCanvas({ active, ...props }: Props) {
  return (
    <Canvas
      className="!absolute inset-0"
      flat
      linear
      dpr={[1, 1.75]}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      frameloop={active ? "always" : "never"}
    >
      <PipelinePlane {...props} />
    </Canvas>
  );
}
