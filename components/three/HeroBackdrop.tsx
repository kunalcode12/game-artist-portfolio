"use client";

import { Grid } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { mulberry32 } from "@/lib/hooks";

type Shape = { kind: "ico" | "torus" | "octa" | "box" | "knot" | "dodeca" | "cyl"; pos: [number, number, number]; scale: number; accent?: boolean; speed: number };

const SHAPES: Shape[] = [
  { kind: "ico", pos: [-5.6, 3.4, -5], scale: 0.75, accent: true, speed: 0.35 },
  { kind: "torus", pos: [6.4, 4.1, -7], scale: 0.7, speed: 0.25 },
  { kind: "octa", pos: [-7.4, 0.9, -3.5], scale: 0.55, speed: 0.45 },
  { kind: "box", pos: [7.6, 0.9, -4], scale: 0.7, accent: true, speed: 0.3 },
  { kind: "knot", pos: [2.4, 5.2, -13], scale: 0.9, speed: 0.2 },
  { kind: "dodeca", pos: [-3.4, 5.4, -11], scale: 0.8, speed: 0.22 },
  { kind: "cyl", pos: [-1.2, 1.2, -16], scale: 0.9, speed: 0.18 },
];

function geometryFor(kind: Shape["kind"]) {
  switch (kind) {
    case "ico":
      return new THREE.IcosahedronGeometry(1, 1);
    case "torus":
      return new THREE.TorusGeometry(0.85, 0.32, 10, 24);
    case "octa":
      return new THREE.OctahedronGeometry(1, 0);
    case "box":
      return new THREE.BoxGeometry(1.2, 1.2, 1.2, 3, 3, 3);
    case "knot":
      return new THREE.TorusKnotGeometry(0.8, 0.24, 72, 8);
    case "dodeca":
      return new THREE.DodecahedronGeometry(1, 0);
    case "cyl":
      return new THREE.CylinderGeometry(0.7, 0.7, 1.6, 12, 3);
  }
}

function Primitive({ shape }: { shape: Shape }) {
  const mesh = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => geometryFor(shape.kind), [shape.kind]);
  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const t = state.clock.elapsedTime * shape.speed;
    m.rotation.set(t * 0.7, t, t * 0.35);
    m.position.y = shape.pos[1] + Math.sin(t * 2.2) * 0.25;
  });
  return (
    <mesh ref={mesh} geometry={geometry} position={shape.pos} scale={shape.scale}>
      <meshBasicMaterial wireframe color={shape.accent ? "#ffa630" : "#9aa0ab"} transparent opacity={shape.accent ? 0.42 : 0.16} fog />
    </mesh>
  );
}

function Dust({ count = 260 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const rand = mulberry32(7);
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() - 0.5) * 26;
      pos[i * 3 + 1] = rand() * 9;
      pos[i * 3 + 2] = -rand() * 22 + 3;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);
  useFrame((state) => {
    if (points.current) points.current.position.y = ((state.clock.elapsedTime * 0.12) % 2) - 1;
  });
  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial size={0.035} color="#ffc277" transparent opacity={0.55} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} fog />
    </points>
  );
}

function Rig({ mouse }: { mouse: RefObject<{ x: number; y: number }> }) {
  const grid = useRef<THREE.Group>(null);
  const look = useMemo(() => new THREE.Vector3(0, 1.1, -4), []);
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const k = 1 - Math.exp(-dt * 2.2);
    const m = mouse.current;
    const scroll = Math.min(1.5, window.scrollY / window.innerHeight);
    const cam = state.camera;
    cam.position.x += ((m?.x ?? 0) * 0.9 - cam.position.x) * k;
    cam.position.y += (1.55 + (m?.y ?? 0) * 0.35 + scroll * 1.6 - cam.position.y) * k;
    cam.lookAt(look);
    if (grid.current) grid.current.position.z = (state.clock.elapsedTime * 0.55) % 3;
  });
  return (
    <group ref={grid}>
      <Grid
        position={[0, 0, 0]}
        args={[10, 10]}
        infiniteGrid
        cellSize={0.6}
        cellThickness={0.6}
        cellColor="#26262c"
        sectionSize={3}
        sectionThickness={1.1}
        sectionColor="#6b4a1c"
        fadeDistance={30}
        fadeStrength={1.6}
      />
    </group>
  );
}

export default function HeroBackdrop({ active, still }: { active: boolean; still?: boolean }) {
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current = { x: (e.clientX / window.innerWidth) * 2 - 1, y: -((e.clientY / window.innerHeight) * 2 - 1) };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 1.5]}
      frameloop={!active ? "never" : still ? "demand" : "always"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 42, position: [0, 1.55, 7], near: 0.1, far: 60 }}
    >
      <fog attach="fog" args={["#060607", 7, 28]} />
      <Rig mouse={mouse} />
      {SHAPES.map((s, i) => (
        <Primitive key={i} shape={s} />
      ))}
      <Dust />
    </Canvas>
  );
}
