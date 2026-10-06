import type { Loadout, ProfileStats } from "@/components/home/About";
import type { HeroSlide } from "@/components/home/HeroViewport";
import type { Stat } from "@/components/home/Stats";
import type { VaultTile } from "@/components/home/Vault";
import type { VaultAtlas } from "@/components/three/VaultCanvas";
import { toLightboxItem } from "./lightbox";
import type { PipelineAsset } from "./pipeline";
import { ATLAS, getProject, PASS_META, PROJECTS, SOFTWARE, STATS, type ShotKind, type Software } from "./projects";

const HERO_SHOTS: { slug: string; stack: string }[] = [
  { slug: "game-boy", stack: "cam-01" },
  { slug: "mclaren-mp4-12c", stack: "cam-01" },
  { slug: "camper-van", stack: "cam-02" },
  { slug: "cb-radio", stack: "cam-01" },
  { slug: "fn-scar-h", stack: "cam-01" },
];

export function heroSlides(): HeroSlide[] {
  return HERO_SHOTS.map(({ slug, stack }) => {
    const p = getProject(slug)!;
    const s = p.stacks.find((x) => x.id === stack)!;
    const beauty = s.passes.beauty!;
    return {
      slug,
      index: p.index,
      title: p.title,
      category: p.discipline,
      tris: p.tris ? `${p.tris.label}${p.tris.note ? ` · ${p.tris.note}` : ""}` : undefined,
      camera: `CAM_${s.id.split("-")[1]} · ${s.name}`,
      poster: beauty,
      base: beauty.gl!,
      passes: {
        ...(s.passes.wire?.gl && { wire: s.passes.wire.gl }),
        ...(s.passes.ao?.gl && { ao: s.passes.ao.gl }),
        ...(s.passes.normal?.gl && { normal: s.passes.normal.gl }),
        ...(s.passes.id?.gl && { id: s.passes.id.gl }),
      },
    };
  });
}

export const trisLabel = () => `${Math.round(STATS.tris / 1000)}K`;

export function homeStats(): Stat[] {
  return [
    { value: STATS.projects, label: "Projects", note: "Props, vehicles, weapons & environments" },
    { value: Math.round(STATS.tris / 1000), suffix: "K", label: "Triangles", note: "Of optimized, game-ready geometry" },
    { value: STATS.textureMaps, label: "Texture maps", note: "4K PBR metallic / roughness sets" },
    { value: STATS.renders, label: "Renders & passes", note: "Beauty, HDRI, AO, wire, normal, ID" },
    { value: 4, suffix: "K", pad: false, label: "Texture res", note: "4096 × 4096 on every texture set" },
  ];
}

const PIPELINE_ASSETS = ["game-boy", "mclaren-mp4-12c", "cb-radio"];

export function pipelineAssets(): PipelineAsset[] {
  return PIPELINE_ASSETS.map((slug) => {
    const p = getProject(slug)!;
    const s = p.stacks[0].passes;
    const maps = p.textureSets[0].maps;
    const map = (c: string) => maps.find((m) => m.channel === c)!.img.src;
    return {
      slug,
      title: p.title.replace("Nintendo ", ""),
      tris: p.tris?.label,
      stages: [
        { url: s.wire!.gl!, mode: 2 },
        { url: s.ao!.gl!, mode: 0 },
        { url: s.wire!.gl!, mode: 0 },
        { url: map("ao"), mode: 1 },
        { url: map("normal"), mode: 1 },
        { url: s.nopost!.gl!, mode: 0 },
        { url: s.beauty!.gl!, mode: 0 },
      ],
    };
  });
}

export function vaultData(): { atlas: VaultAtlas; tiles: VaultTile[] } {
  const tiles = ATLAS.tiles.map((key) => {
    const [slug, shotKey] = key.split("/");
    const p = getProject(slug)!;
    const shot = p.shots.find((s) => s.key === shotKey)!;
    const kind = shotKey.split("-")[0] as ShotKind;
    return {
      project: p.title,
      pass: PASS_META[kind].label,
      item: toLightboxItem(shot.img, p.title, shot.title, PASS_META[kind].short),
    };
  });
  const { src, cols, rows, tileW, tileH, w, h } = ATLAS;
  return { atlas: { src, cols, rows, tileW, tileH, w, h, count: ATLAS.tiles.length }, tiles };
}

export function profile(): { stats: ProfileStats; loadout: Loadout } {
  const order: Software[] = ["maya", "painter", "arnold", "photoshop"];
  return {
    stats: { assets: STATS.projects, tris: trisLabel(), maps: STATS.textureMaps, renders: STATS.renders },
    loadout: order.map((s) => ({
      name: SOFTWARE[s].name.replace(" Renderer", ""),
      role: SOFTWARE[s].role,
      used: PROJECTS.filter((p) => p.software.includes(s)).length,
      total: PROJECTS.length,
    })),
  };
}
