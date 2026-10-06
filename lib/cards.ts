import { PASS_META, SOFTWARE, type Category, type Img, type Project, type ShotKind } from "./projects";

/** The slice of a project a card needs — keeps client payloads small. */
export type CardData = {
  slug: string;
  index: string;
  title: string;
  category: Category;
  discipline: string;
  tris?: string;
  trisNote?: string;
  software: string[];
  summary: string;
  cover: Img;
  scrub: { kind: ShotKind; label: string; img: Img }[];
  video?: string;
};

export function toCard(p: Project): CardData {
  return {
    slug: p.slug,
    index: p.index,
    title: p.title,
    category: p.category,
    discipline: p.discipline,
    tris: p.tris?.label,
    trisNote: p.tris?.note,
    software: p.software.map((s) => SOFTWARE[s].short),
    summary: p.summary,
    cover: p.cover,
    scrub: p.scrub.map((s) => ({ kind: s.kind, label: PASS_META[s.kind].short, img: s.img })),
    video: p.video?.src,
  };
}
