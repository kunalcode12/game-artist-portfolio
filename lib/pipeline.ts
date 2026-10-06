export type PipelineStage = { url: string; mode: 0 | 1 | 2 };
export type PipelineAsset = { slug: string; title: string; tris?: string; stages: PipelineStage[] };

export const STAGES = [
  {
    title: "Reference",
    body: "Reference gathering, blueprint alignment and proportion analysis before a single polygon is placed.",
    shading: "Blueprint",
  },
  {
    title: "High Poly",
    body: "Primary and secondary forms, bevels and support loops — surface detail built to be baked down.",
    shading: "Clay · AO",
  },
  {
    title: "Low Poly",
    body: "Optimized game-ready topology that keeps the silhouette and fits a strict triangle budget.",
    shading: "Wireframe",
  },
  {
    title: "UV & UDIM",
    body: "Clean seams, consistent texel density and tight packing across 4K texture sets.",
    shading: "UV layout · AO",
  },
  {
    title: "Baking",
    body: "High-to-low bakes for normal, ambient occlusion and color ID — high-poly detail carried by maps.",
    shading: "Tangent normal",
  },
  {
    title: "Texturing",
    body: "Physically based materials in Substance 3D Painter: wear, roughness variation and surface storytelling.",
    shading: "PBR · raw render",
  },
  {
    title: "Lookdev",
    body: "Studio and HDRI lighting in Arnold, calibrated shaders and final presentation polish in Photoshop.",
    shading: "Arnold · final",
  },
] as const;

/** Each scroll segment holds the stage, then a scan line wipes to the next. */
export function segment(s: number, count: number) {
  const max = count - 1;
  const v = Math.min(Math.max(s, 0), max);
  const from = Math.min(Math.floor(v), max);
  const to = Math.min(from + 1, max);
  const local = v - from;
  const wipe = from === to ? 0 : Math.min(Math.max((local - 0.3) / 0.6, 0), 1);
  return { from, to, wipe };
}
