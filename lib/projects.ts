import media from "./media.generated.json";

/* ───────────────────────── media types ───────────────────────── */

export type Img = {
  src: string;
  gl?: string;
  thumb: string;
  w: number;
  h: number;
  /** original source resolution */
  ow: number;
  oh: number;
  kb: number;
  blur: string;
};

const IMAGES = media.images as Record<string, Img>;

function img(slug: string, key: string): Img {
  const found = IMAGES[`${slug}/${key}`];
  if (!found) throw new Error(`Missing media "${slug}/${key}" — run \`npm run media\`.`);
  return found;
}

export const ATLAS = media.atlas;
export const CHAIR = media.chair;

/* ───────────────────────── passes & channels ───────────────────────── */

export type PassKind = "beauty" | "nopost" | "ao" | "wire" | "normal" | "id";
export type ShotKind = PassKind | "hdri";

export const PASS_ORDER: PassKind[] = ["beauty", "nopost", "ao", "wire", "normal", "id"];

export const PASS_META: Record<ShotKind, { label: string; short: string; hotkey?: string; description: string }> = {
  beauty: { label: "Beauty", short: "Beauty", hotkey: "1", description: "Final Arnold render with lighting and post." },
  nopost: { label: "Raw Render", short: "Raw", hotkey: "2", description: "Straight out of Arnold, before post-processing." },
  ao: { label: "Ambient Occlusion", short: "AO", hotkey: "3", description: "Clay occlusion pass that reads form, contact and cavities." },
  wire: { label: "Wireframe", short: "Wire", hotkey: "4", description: "Game-mesh topology and edge flow." },
  normal: { label: "Normal", short: "Normal", hotkey: "5", description: "Normal pass showing surface orientation and baked detail." },
  id: { label: "Color ID", short: "ID", hotkey: "6", description: "Material ID masks used to drive texturing." },
  hdri: { label: "HDRI Lighting", short: "HDRI", description: "The asset lit by a real-world HDRI environment." },
};

export type TextureChannel = "basecolor" | "normal" | "roughness" | "metalness" | "ao" | "height" | "id" | "emissive" | "opacity";

export const CHANNEL_META: Record<TextureChannel, { label: string; short: string; description: string }> = {
  basecolor: { label: "Base Color", short: "BC", description: "Albedo — pure surface color with no baked lighting." },
  normal: { label: "Normal", short: "N", description: "Tangent-space normal map baked from the high poly." },
  roughness: { label: "Roughness", short: "R", description: "Micro-surface: dark is glossy, bright is rough." },
  metalness: { label: "Metalness", short: "M", description: "Metal mask: white is metal, black is dielectric." },
  ao: { label: "Ambient Occlusion", short: "AO", description: "Baked cavity and contact shadowing." },
  height: { label: "Height", short: "H", description: "Height detail for parallax and texture painting." },
  id: { label: "Color ID", short: "ID", description: "Baked ID masks for fast material assignment." },
  emissive: { label: "Emissive", short: "E", description: "Self-illuminated areas such as lights and LEDs." },
  opacity: { label: "Opacity", short: "O", description: "Transparency mask for glass and cut-outs." },
};

/* ───────────────────────── software ───────────────────────── */

export type Software = "maya" | "painter" | "arnold" | "photoshop";

export const SOFTWARE: Record<Software, { name: string; short: string; role: string }> = {
  maya: { name: "Autodesk Maya", short: "Maya", role: "High & low poly modeling, UVs" },
  painter: { name: "Substance 3D Painter", short: "Painter", role: "Baking & PBR texturing" },
  arnold: { name: "Arnold Renderer", short: "Arnold", role: "Lookdev & rendering" },
  photoshop: { name: "Adobe Photoshop", short: "Photoshop", role: "Post & presentation" },
};

/* ───────────────────────── project model ───────────────────────── */

export type Category = "Props" | "Vehicles" | "Weapons" | "Environments";
export const CATEGORIES: Category[] = ["Props", "Vehicles", "Weapons", "Environments"];

export type Shot = { key: string; kind: ShotKind; img: Img; title: string };
export type CameraStack = { id: string; name: string; passes: Partial<Record<PassKind, Img>> };
export type TextureSet = { id: string; name: string; maps: { channel: TextureChannel; img: Img }[] };

export type Project = {
  slug: string;
  index: string;
  title: string;
  kicker: string;
  category: Category;
  discipline: string;
  tris?: { value: number; label: string; note?: string };
  software: Software[];
  summary: string;
  description: string[];
  optimization?: string;
  includes: string[];
  cover: Img;
  /** Passes a visitor can scrub through when hovering the card, starting with the cover. */
  scrub: { kind: ShotKind; img: Img }[];
  hero: Img;
  stacks: CameraStack[];
  shots: Shot[];
  textureSets: TextureSet[];
  uv?: string;
  video?: { src: string; poster: Img; frames: { count: number; base: string; ext: string; w: number; h: number } };
};

type ShotDef = [key: string, title: string];

function shotsFor(slug: string, defs: ShotDef[]): Shot[] {
  return defs.map(([key, title]) => {
    const kind = key.split("-")[0] as ShotKind;
    return { key, kind, img: img(slug, key), title };
  });
}

function stack(slug: string, id: string, name: string, passes: Partial<Record<PassKind, string>>): CameraStack {
  return {
    id,
    name,
    passes: Object.fromEntries(Object.entries(passes).map(([k, key]) => [k, img(slug, key as string)])),
  };
}

function textureSet(slug: string, id: string, name: string, channels: TextureChannel[]): TextureSet {
  return { id, name, maps: channels.map((channel) => ({ channel, img: img(slug, `tex-${id}-${channel}`) })) };
}

function scrub(slug: string, entries: [ShotKind, string][]) {
  return entries.map(([kind, key]) => ({ kind, img: img(slug, key) }));
}

const FULL_PIPELINE: Software[] = ["maya", "painter", "arnold", "photoshop"];

export const PROJECTS: Project[] = [
  {
    slug: "game-boy",
    index: "01",
    title: "Nintendo Game Boy",
    kicker: "Hard-Surface Game Asset",
    category: "Props",
    discipline: "Hard Surface Prop",
    tris: { value: 4500, label: "4.5K tris" },
    software: FULL_PIPELINE,
    summary:
      "A faithful recreation of the Nintendo Game Boy — modeled high-to-low in Maya and optimized to just 4.5K tris, with the high-poly detail carried by baked maps.",
    description: [
      "The Nintendo Game Boy was modeled in Autodesk Maya using a high-poly to low-poly workflow, with optimized topology while preserving the key shapes, proportions, and details of the reference.",
      "The low-poly mesh was optimized for game-ready baking, transferring high-poly details through baked maps. The asset was then UV unwrapped and textured using a PBR workflow in Substance 3D Painter, rendered in Arnold, and given final adjustments in Adobe Photoshop.",
    ],
    includes: ["Beauty Renders", "Ambient Occlusion", "Normal", "Color ID", "Wireframe", "Texture Maps"],
    cover: img("game-boy", "beauty-1"),
    scrub: scrub("game-boy", [
      ["beauty", "beauty-1"],
      ["ao", "ao-1"],
      ["wire", "wire-1"],
      ["normal", "normal-1"],
      ["id", "id-1"],
    ]),
    hero: img("game-boy", "beauty-1"),
    stacks: [
      stack("game-boy", "cam-01", "Front", { beauty: "beauty-1", nopost: "nopost-1", ao: "ao-1", wire: "wire-1", normal: "normal-1", id: "id-1" }),
      stack("game-boy", "cam-02", "Rear Three-Quarter", { beauty: "beauty-3", wire: "wire-3", normal: "normal-2" }),
      stack("game-boy", "cam-03", "Rear", { beauty: "beauty-2", ao: "ao-2", wire: "wire-2" }),
    ],
    shots: shotsFor("game-boy", [
      ["beauty-1", "Front — hero render"],
      ["beauty-3", "Rear three-quarter"],
      ["beauty-2", "Rear — battery cover & cartridge"],
      ["nopost-1", "Front — raw render, before post"],
      ["wire-1", "Front — wireframe"],
      ["wire-3", "Rear three-quarter — wireframe"],
      ["wire-2", "Rear — wireframe"],
      ["ao-1", "Front — ambient occlusion"],
      ["ao-2", "Rear — ambient occlusion"],
      ["normal-1", "Front — normal pass"],
      ["normal-2", "Rear three-quarter — normal pass"],
      ["id-1", "Front — color ID"],
    ]),
    textureSets: [textureSet("game-boy", "main", "Game Boy", ["basecolor", "normal", "roughness", "metalness", "ao", "height", "id"])],
  },
  {
    slug: "mclaren-mp4-12c",
    index: "02",
    title: "McLaren MP4-12C",
    kicker: "Hard-Surface Game Asset",
    category: "Vehicles",
    discipline: "Hard Surface Vehicle",
    tris: { value: 51300, label: "51.3K tris" },
    software: FULL_PIPELINE,
    summary:
      "A supercar built high-to-low in Maya — 51.3K tris that keep the MP4-12C's shapes, proportions and details true to the reference.",
    description: [
      "The McLaren MP4-12C hard-surface car asset was modeled in Autodesk Maya using a high-poly to low-poly workflow, with optimized topology while preserving the key shapes, proportions, and details of the reference.",
      "The low-poly mesh was optimized for game-ready baking, transferring high-poly details through baked maps. The asset was then UV unwrapped and textured using a PBR workflow in Substance 3D Painter, rendered in Arnold, and given final adjustments in Adobe Photoshop.",
    ],
    includes: ["Beauty Renders", "HDRI Lighting", "Ambient Occlusion", "Normal", "Color ID", "Wireframe", "Texture Maps"],
    cover: img("mclaren-mp4-12c", "beauty-1"),
    scrub: scrub("mclaren-mp4-12c", [
      ["beauty", "beauty-1"],
      ["ao", "ao-1"],
      ["wire", "wire-1"],
      ["normal", "normal-1"],
      ["id", "id-1"],
    ]),
    hero: img("mclaren-mp4-12c", "beauty-1"),
    stacks: [
      stack("mclaren-mp4-12c", "cam-01", "Front Three-Quarter", { beauty: "beauty-1", nopost: "nopost-1", ao: "ao-1", wire: "wire-1", normal: "normal-1", id: "id-1" }),
      stack("mclaren-mp4-12c", "cam-02", "Rear Three-Quarter", { beauty: "beauty-3", ao: "ao-2", wire: "wire-2" }),
      stack("mclaren-mp4-12c", "cam-03", "Wheel Detail", { beauty: "beauty-2", ao: "ao-3", wire: "wire-3" }),
    ],
    shots: shotsFor("mclaren-mp4-12c", [
      ["beauty-1", "Front three-quarter — hero render"],
      ["beauty-3", "Rear three-quarter"],
      ["beauty-2", "Wheel & brake detail"],
      ["nopost-1", "Front three-quarter — raw render"],
      ["hdri-1", "HDRI lighting — rear"],
      ["hdri-2", "HDRI lighting — front"],
      ["wire-1", "Front three-quarter — wireframe"],
      ["wire-2", "Rear three-quarter — wireframe"],
      ["wire-3", "Wheel — wireframe"],
      ["ao-1", "Front three-quarter — ambient occlusion"],
      ["ao-2", "Rear three-quarter — ambient occlusion"],
      ["ao-3", "Wheel — ambient occlusion"],
      ["ao-4", "Side profile — ambient occlusion"],
      ["normal-1", "Front three-quarter — normal pass"],
      ["id-1", "Front three-quarter — color ID"],
    ]),
    textureSets: [textureSet("mclaren-mp4-12c", "main", "Body", ["basecolor", "normal", "roughness", "metalness", "ao", "id"])],
  },
  {
    slug: "camper-van",
    index: "03",
    title: "Camper Van",
    kicker: "Environment · Hard-Surface Game Asset",
    category: "Environments",
    discipline: "Hard Surface Environment",
    tris: { value: 43400, label: "43.4K tris" },
    software: FULL_PIPELINE,
    summary:
      "A lived-in camper van scene built from concept art — the van plus its surrounding props and small environment assets, 43.4K tris over two 4K texture sets.",
    description: [
      "The camper van environment was modeled in Autodesk Maya using a high-poly to low-poly workflow, based on concept artwork used as the primary visual reference. The environment includes the camper van along with surrounding props and small environmental assets, with optimized topology while preserving the key shapes, proportions, and design details from the reference.",
      "The low-poly meshes were prepared for game-ready baking, transferring high-poly details through baked maps. The assets were UV unwrapped and textured using a PBR workflow in Substance 3D Painter, rendered in Arnold, and given final adjustments in Adobe Photoshop.",
    ],
    includes: ["Beauty Renders", "HDRI Lighting", "Ambient Occlusion", "Normal", "Color ID", "Wireframe", "Texture Maps"],
    cover: img("camper-van", "hdri-1"),
    scrub: scrub("camper-van", [
      ["hdri", "hdri-1"],
      ["beauty", "beauty-1"],
      ["ao", "ao-1"],
      ["wire", "wire-1"],
      ["normal", "normal-1"],
      ["id", "id-1"],
    ]),
    hero: img("camper-van", "hdri-1"),
    stacks: [
      stack("camper-van", "cam-01", "Front Three-Quarter", { beauty: "beauty-1", ao: "ao-1", wire: "wire-1", normal: "normal-1", id: "id-1" }),
      stack("camper-van", "cam-02", "Side", { beauty: "beauty-2", ao: "ao-2", wire: "wire-2", normal: "normal-2" }),
    ],
    shots: shotsFor("camper-van", [
      ["hdri-1", "HDRI lighting — desert, front three-quarter"],
      ["hdri-2", "HDRI lighting — desert, side"],
      ["beauty-3", "Studio — front three-quarter"],
      ["beauty-1", "Studio — front three-quarter, light"],
      ["beauty-2", "Studio — side"],
      ["wire-1", "Front three-quarter — wireframe"],
      ["wire-2", "Side — wireframe"],
      ["ao-1", "Front three-quarter — ambient occlusion"],
      ["ao-2", "Side — ambient occlusion"],
      ["normal-1", "Front three-quarter — normal pass"],
      ["normal-2", "Side — normal pass"],
      ["id-1", "Front three-quarter — color ID"],
    ]),
    textureSets: [
      textureSet("camper-van", "body", "Van Body", ["basecolor", "normal", "roughness", "metalness", "ao", "height", "id", "emissive", "opacity"]),
      textureSet("camper-van", "props", "Side Props", ["basecolor", "normal", "roughness", "metalness", "ao", "height", "id", "emissive", "opacity"]),
    ],
  },
  {
    slug: "fn-scar-h",
    index: "04",
    title: "FN SCAR-H",
    kicker: "Hard-Surface Game Asset",
    category: "Weapons",
    discipline: "Hard Surface Weapon",
    tris: { value: 14500, label: "14.5K tris" },
    software: FULL_PIPELINE,
    summary:
      "A game-ready battle rifle with optimized topology and baked high-poly detail — 14.5K tris across two 4K PBR texture sets.",
    description: [
      "The FN SCAR-H hard-surface game asset was modeled in Autodesk Maya using a high-poly to low-poly workflow, with optimized topology while preserving key shapes, proportions, and reference details.",
      "The low-poly mesh was prepared for game-ready baking, transferring high-poly details through baked maps. The asset was UV unwrapped and textured using a PBR workflow in Substance 3D Painter, rendered in Arnold, and given final adjustments in Adobe Photoshop.",
    ],
    includes: ["Beauty Renders", "HDRI Lighting", "Ambient Occlusion", "Normal", "Color ID", "Wireframe", "Texture Maps"],
    cover: img("fn-scar-h", "beauty-2"),
    scrub: scrub("fn-scar-h", [
      ["beauty", "beauty-2"],
      ["ao", "ao-2"],
      ["normal", "normal-1"],
      ["id", "id-1"],
    ]),
    hero: img("fn-scar-h", "beauty-1"),
    stacks: [
      stack("fn-scar-h", "cam-01", "Three-Quarter", { beauty: "beauty-2", ao: "ao-2", normal: "normal-1", id: "id-1" }),
      stack("fn-scar-h", "cam-02", "Studio Wide", { beauty: "beauty-1", ao: "ao-1" }),
      stack("fn-scar-h", "cam-03", "HDRI Side", { beauty: "hdri-2", wire: "wire-1" }),
    ],
    shots: shotsFor("fn-scar-h", [
      ["beauty-1", "Studio wide — with ammunition"],
      ["beauty-2", "Three-quarter"],
      ["beauty-3", "Reverse side"],
      ["hdri-1", "HDRI lighting — close three-quarter"],
      ["hdri-2", "HDRI lighting — side"],
      ["hdri-3", "HDRI lighting — muzzle three-quarter"],
      ["wire-1", "Side — wireframe"],
      ["wire-2", "Reverse side — wireframe"],
      ["wire-3", "Elevated three-quarter — wireframe"],
      ["wire-4", "Rear three-quarter — wireframe"],
      ["ao-1", "Studio wide — ambient occlusion"],
      ["ao-2", "Three-quarter — ambient occlusion"],
      ["normal-1", "Three-quarter — normal pass"],
      ["id-1", "Three-quarter — color ID"],
    ]),
    textureSets: [
      textureSet("fn-scar-h", "a", "Texture Set 01", ["basecolor", "normal", "roughness", "metalness", "ao", "height"]),
      textureSet("fn-scar-h", "b", "Texture Set 02", ["basecolor", "normal", "roughness", "ao", "height"]),
    ],
  },
  {
    slug: "cb-radio",
    index: "05",
    title: "CB Radio",
    kicker: "Hard-Surface Game Prop",
    category: "Props",
    discipline: "Hard Surface Prop",
    tris: { value: 11300, label: "5.4K tris", note: "11.3K with cable" },
    software: FULL_PIPELINE,
    summary:
      "A worn CB radio and coiled handset — 5.4K tris for the radio, 11.3K with the cable, and a clear plan to bring the complete asset to around 6K.",
    description: [
      "Modeled in Autodesk Maya using a high-poly to low-poly workflow, with optimized topology while preserving the key shapes and details of the reference.",
      "The low-poly mesh was optimized for game-ready baking, transferring high-poly details through baked maps. The asset was then UV unwrapped and textured using a PBR workflow in Substance 3D Painter, followed by final rendering in Arnold.",
    ],
    optimization:
      "The cable can be further simplified with a low-poly curved setup, bringing the complete asset to approximately 6K tris.",
    includes: ["Beauty Renders", "Ambient Occlusion", "Normal", "Color ID", "Wireframe", "Texture Maps"],
    cover: img("cb-radio", "beauty-1"),
    scrub: scrub("cb-radio", [
      ["beauty", "beauty-1"],
      ["nopost", "nopost-1"],
      ["ao", "ao-1"],
      ["wire", "wire-1"],
      ["normal", "normal-1"],
      ["id", "id-1"],
    ]),
    hero: img("cb-radio", "beauty-1"),
    uv: "UDIM 1001",
    stacks: [
      stack("cb-radio", "cam-01", "Front Three-Quarter", { beauty: "beauty-1", nopost: "nopost-1", ao: "ao-1", wire: "wire-1", normal: "normal-1", id: "id-1" }),
      stack("cb-radio", "cam-02", "Rear", { beauty: "beauty-2", ao: "ao-2", wire: "wire-2" }),
    ],
    shots: shotsFor("cb-radio", [
      ["beauty-1", "Front three-quarter — hero render"],
      ["beauty-2", "Rear — connectors & label"],
      ["beauty-3", "Handset close-up"],
      ["nopost-1", "Front three-quarter — raw render"],
      ["wire-1", "Front three-quarter — wireframe"],
      ["wire-2", "Rear — wireframe"],
      ["ao-1", "Front three-quarter — ambient occlusion"],
      ["ao-2", "Rear — ambient occlusion"],
      ["normal-1", "Front three-quarter — normal pass"],
      ["id-1", "Front three-quarter — color ID"],
    ]),
    textureSets: [textureSet("cb-radio", "main", "Radio · UDIM 1001", ["basecolor", "normal", "roughness", "metalness", "ao", "height", "id"])],
  },
  {
    slug: "wooden-chair",
    index: "06",
    title: "Wooden Chair",
    kicker: "3D Product Visualization",
    category: "Props",
    discipline: "Product Visualization",
    software: ["maya", "painter", "arnold"],
    summary:
      "A product-visualization study of a real-world chair — accurate proportions, smooth forms and clean topology, presented as a turntable.",
    description: [
      "This wooden chair was modeled in Autodesk Maya using a real-world chair as the primary visual reference, with a focus on accurate proportions, clean topology, smooth forms, and preserving the key design details.",
      "The project includes a turntable video showcasing the complete 3D model and its overall form from multiple angles. Texturing was done in Substance 3D Painter and rendered in Arnold.",
    ],
    includes: ["Turntable"],
    cover: CHAIR.poster,
    scrub: [],
    hero: CHAIR.poster,
    stacks: [],
    shots: [],
    textureSets: [],
    video: { src: CHAIR.video, poster: CHAIR.poster, frames: CHAIR.frames },
  },
];

export const getProject = (slug: string) => PROJECTS.find((p) => p.slug === slug);

export function getNeighbours(slug: string) {
  const i = PROJECTS.findIndex((p) => p.slug === slug);
  const n = PROJECTS.length;
  return { prev: PROJECTS[(i - 1 + n) % n], next: PROJECTS[(i + 1) % n] };
}

/* ───────────────────────── derived, always-true stats ───────────────────────── */

export const STATS = {
  projects: PROJECTS.length,
  tris: PROJECTS.reduce((s, p) => s + (p.tris?.value ?? 0), 0),
  textureMaps: PROJECTS.reduce((s, p) => s + p.textureSets.reduce((t, set) => t + set.maps.length, 0), 0),
  renders: PROJECTS.reduce((s, p) => s + p.shots.length, 0),
};

/** Renders a project was delivered at, e.g. "4096 × 2048". */
export function renderResolution(p: Project) {
  const r = p.shots.find((s) => s.kind === "beauty")?.img ?? p.hero;
  return `${r.ow} × ${r.oh}`;
}

export const CATEGORY_COUNTS = Object.fromEntries(
  CATEGORIES.map((c) => [c, PROJECTS.filter((p) => p.category === c).length])
) as Record<Category, number>;
