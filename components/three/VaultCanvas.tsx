"use client";

import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { loadTexture } from "./textures";

export type VaultAtlas = { src: string; cols: number; rows: number; tileW: number; tileH: number; w: number; h: number; count: number };
/** Written by the DOM drag handlers, read-only inside the canvas. */
export type VaultControl = { velocity: number; dragging: boolean; scroll: number; stamp: number };

const ROWS = 3;
const RADIUS = 7;
const TILE_H = 1.0;
const ROW_GAP = 1.16;

const vert = /* glsl */ `
  attribute vec2 aOffset;
  attribute float aState;
  varying vec2 vUv;
  varying vec2 vAtlas;
  varying float vState;
  void main() {
    vUv = uv;
    vAtlas = aOffset;
    vState = aState;
    vec4 p = instanceMatrix * vec4(position, 1.0);
    // hovered tile slides toward the camera (inward)
    p.xz *= 1.0 - 0.07 * aState;
    gl_Position = projectionMatrix * modelViewMatrix * p;
  }
`;

const frag = /* glsl */ `
  precision highp float;
  uniform sampler2D uAtlas;
  uniform vec2 uTile;
  uniform vec2 uRes;
  uniform float uReady;
  varying vec2 vUv;
  varying vec2 vAtlas;
  varying float vState;
  void main() {
    vec2 uv = vec2(1.0 - vUv.x, vUv.y);
    vec3 col = texture2D(uAtlas, vAtlas + uv * uTile).rgb * uReady;
    float side = abs(gl_FragCoord.x / uRes.x - 0.5) * 2.0;
    col *= mix(0.32, 1.0, 1.0 - side * side) * mix(0.82, 1.15, vState);
    vec2 e = min(uv, 1.0 - uv);
    float edge = step(min(e.x * 2.0, e.y), 0.012);
    col = mix(col, vec3(1.0, 0.651, 0.188), edge * vState);
    col = mix(col, vec3(0.08), edge * (1.0 - vState) * 0.6);
    gl_FragColor = vec4(col, 1.0);
  }
`;

function Ring({
  atlas,
  control,
  still,
  onHover,
  onPick,
}: {
  atlas: VaultAtlas;
  control: RefObject<VaultControl>;
  still: boolean;
  onHover: (i: number | null) => void;
  onPick: (i: number) => void;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const group = useRef<THREE.Group>(null);
  const hovered = useRef<number | null>(null);
  const angle = useRef(0);
  const vel = useRef(0);
  const cols = Math.ceil(atlas.count / ROWS);
  const step = (Math.PI * 2) / cols;

  const geometry = useMemo(() => {
    // one curved tile, centred on +Z, viewed from inside the cylinder
    const g = new THREE.CylinderGeometry(RADIUS, RADIUS, TILE_H, 12, 1, true, -step * 0.46, step * 0.92);
    const offsets = new Float32Array(atlas.count * 2);
    for (let i = 0; i < atlas.count; i++) {
      const c = i % atlas.cols;
      const r = Math.floor(i / atlas.cols);
      offsets[i * 2] = (c * atlas.tileW) / atlas.w;
      offsets[i * 2 + 1] = 1 - ((r + 1) * atlas.tileH) / atlas.h;
    }
    g.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offsets, 2));
    g.setAttribute("aState", new THREE.InstancedBufferAttribute(new Float32Array(atlas.count), 1));
    return g;
  }, [atlas, step]);

  const uniforms = useMemo(
    () => ({
      uAtlas: { value: null as THREE.Texture | null },
      uTile: { value: new THREE.Vector2(atlas.tileW / atlas.w, atlas.tileH / atlas.h) },
      uRes: { value: new THREE.Vector2(1, 1) },
      uReady: { value: 0 },
    }),
    [atlas]
  );

  useEffect(() => {
    let cancelled = false;
    loadTexture(atlas.src).then((t) => {
      const m = mesh.current?.material as THREE.ShaderMaterial | undefined;
      if (cancelled || !m) return;
      m.uniforms.uAtlas.value = t;
    });
    return () => {
      cancelled = true;
    };
  }, [atlas.src]);

  // lay tiles out column-major so each project reads as a band around the ring
  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const o = new THREE.Object3D();
    for (let i = 0; i < atlas.count; i++) {
      const col = Math.floor(i / ROWS);
      const row = i % ROWS;
      o.rotation.set(0, Math.PI - col * step, 0);
      o.position.set(0, (1 - row) * ROW_GAP, 0);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, [atlas.count, step]);

  useFrame((state, delta) => {
    const m = mesh.current;
    const g = group.current;
    const c = control.current;
    if (!m || !g || !c) return;
    const dt = Math.min(delta, 0.05);
    const mat = m.material as THREE.ShaderMaterial;
    (mat.uniforms.uRes.value as THREE.Vector2).set(state.size.width * state.viewport.dpr, state.size.height * state.viewport.dpr);
    if (mat.uniforms.uAtlas.value) mat.uniforms.uReady.value = Math.min(1, mat.uniforms.uReady.value + dt * 1.5);

    // fresh drag input drives the spin; otherwise it coasts down (fast if the pointer is held still)
    if (c.dragging && performance.now() - c.stamp < 80) vel.current = c.velocity;
    else vel.current *= Math.exp(-dt * (c.dragging ? 12 : 2.2));
    const auto = c.dragging || still ? 0 : 0.045;
    angle.current += (vel.current + auto) * dt;
    g.rotation.y = angle.current + c.scroll * 1.6;

    const attr = m.geometry.getAttribute("aState") as THREE.InstancedBufferAttribute;
    const arr = attr.array as Float32Array;
    let dirty = false;
    for (let i = 0; i < arr.length; i++) {
      const target = i === hovered.current ? 1 : 0;
      const next = arr[i] + (target - arr[i]) * (1 - Math.exp(-dt * 10));
      if (Math.abs(next - arr[i]) > 0.0005) {
        arr[i] = next;
        dirty = true;
      }
    }
    if (dirty) attr.needsUpdate = true;
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const id = e.instanceId ?? null;
    if (id !== hovered.current) {
      hovered.current = id;
      onHover(id);
    }
  };
  const out = () => {
    hovered.current = null;
    onHover(null);
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6 || e.instanceId == null) return;
    onPick(e.instanceId);
  };

  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[geometry, undefined, atlas.count]} onPointerMove={over} onPointerOut={out} onClick={click} frustumCulled={false}>
        <shaderMaterial uniforms={uniforms} vertexShader={vert} fragmentShader={frag} side={THREE.BackSide} />
      </instancedMesh>
    </group>
  );
}

export default function VaultCanvas({
  atlas,
  control,
  active,
  still = false,
  onHover,
  onPick,
}: {
  atlas: VaultAtlas;
  control: RefObject<VaultControl>;
  active: boolean;
  still?: boolean;
  onHover: (i: number | null) => void;
  onPick: (i: number) => void;
}) {
  return (
    <Canvas
      className="!absolute inset-0"
      flat
      linear
      dpr={[1, 1.75]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 36, position: [0, 0, 1.4], near: 0.1, far: 40 }}
    >
      <Ring atlas={atlas} control={control} still={still} onHover={onHover} onPick={onPick} />
    </Canvas>
  );
}
