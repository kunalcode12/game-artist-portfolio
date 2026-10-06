import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { Gallery, type GalleryGroup } from "@/components/project/Gallery";
import { PassViewer } from "@/components/project/PassViewer";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { ProjectOutro } from "@/components/project/ProjectOutro";
import { TextureSets } from "@/components/project/TextureSets";
import { Turntable } from "@/components/project/Turntable";
import { FadeUp } from "@/components/ui/Reveal";
import { toCard } from "@/lib/cards";
import { toLightboxItem } from "@/lib/lightbox";
import { getNeighbours, getProject, PASS_META, PROJECTS, renderResolution, SOFTWARE, type Project, type ShotKind } from "@/lib/projects";
import { site } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return {};
  const title = `${p.title} — ${p.discipline}`;
  return {
    title,
    description: p.summary,
    alternates: { canonical: `/work/${p.slug}` },
    openGraph: {
      type: "article",
      siteName: `${site.name} — 3D Game Artist`,
      title: `${p.title} · ${site.name}`,
      description: p.summary,
      images: [{ url: p.hero.src, width: p.hero.w, height: p.hero.h, alt: `${p.title} — ${p.discipline}` }],
    },
    twitter: { card: "summary_large_image", title: `${p.title} · ${site.name}`, description: p.summary, images: [p.hero.src] },
  };
}

const GROUPS: { id: string; title: string; subtitle: string; icon: GalleryGroup["icon"]; kinds: ShotKind[] }[] = [
  { id: "renders", title: "Final Renders", subtitle: "Arnold beauty renders with final adjustments in Photoshop — plus the raw frame before post.", icon: "eye", kinds: ["beauty", "nopost"] },
  { id: "hdri", title: "HDRI Lighting", subtitle: "The asset dropped into real-world HDRI environments to prove the materials under natural light.", icon: "sun", kinds: ["hdri"] },
  { id: "topology", title: "Modeling & Topology", subtitle: "Game-mesh wireframes — edge flow, silhouette support and where the triangle budget is spent.", icon: "box", kinds: ["wire"] },
  { id: "occlusion", title: "Ambient Occlusion", subtitle: "Clay AO passes that read pure form, contact shadows and cavity detail without materials.", icon: "aperture", kinds: ["ao"] },
  { id: "passes", title: "Normal & Color ID", subtitle: "Normal and material-ID passes — surface orientation, baked detail and the masks behind texturing.", icon: "layers", kinds: ["normal", "id"] },
];

function specsFor(p: Project) {
  const maps = p.textureSets.reduce((n, s) => n + s.maps.length, 0);
  const tex = p.textureSets[0]?.maps[0]?.img;
  const has = (s: (typeof p.software)[number]) => p.software.includes(s);
  const rows: { label: string; value: string; accent?: boolean }[] = [{ label: "Category", value: p.discipline }];
  if (p.tris) rows.push({ label: "Polycount", value: p.tris.note ? `${p.tris.label} (${p.tris.note})` : p.tris.label, accent: true });
  if (tex) {
    rows.push({ label: "Texture resolution", value: `${tex.ow} × ${tex.oh}` });
    rows.push({ label: "Texture sets", value: `${p.textureSets.length} × 4K` });
    rows.push({ label: "Texture maps", value: `${maps} maps` });
    rows.push({ label: "Workflow", value: "PBR Metallic / Roughness" });
  }
  if (p.uv) rows.push({ label: "UV layout", value: p.uv });
  if (has("maya")) rows.push({ label: "Modeling", value: SOFTWARE.maya.name });
  if (has("painter")) rows.push({ label: "Texturing", value: SOFTWARE.painter.name });
  if (has("arnold")) rows.push({ label: "Rendering", value: SOFTWARE.arnold.name });
  if (has("photoshop")) rows.push({ label: "Post", value: SOFTWARE.photoshop.name });
  if (p.video) rows.push({ label: "Presentation", value: `Turntable · ${p.video.poster.ow} × ${p.video.poster.oh}` });
  else rows.push({ label: "Render resolution", value: renderResolution(p) });
  if (p.shots.length) rows.push({ label: "Frames delivered", value: `${p.shots.length} renders & passes` });
  return rows;
}

export default async function ProjectPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();

  const { prev, next } = getNeighbours(slug);
  const more = [1, 2, 3].map((k) => PROJECTS[(PROJECTS.indexOf(p) + k) % PROJECTS.length]).map(toCard);

  // one ordered list of every shot so the viewer can page through the whole project
  const groups: GalleryGroup[] = [];
  const ordered: { kind: ShotKind; title: string; img: Project["shots"][number]["img"] }[] = [];
  for (const g of GROUPS) {
    const shots = p.shots.filter((s) => g.kinds.includes(s.kind));
    if (!shots.length) continue;
    groups.push({
      id: g.id,
      title: g.title,
      subtitle: g.subtitle,
      icon: g.icon,
      shots: shots.map((s) => {
        ordered.push({ kind: s.kind, title: s.title, img: s.img });
        return { img: s.img, title: s.title, tag: PASS_META[s.kind].label, index: ordered.length - 1 };
      }),
    });
  }
  const items = ordered.map((s) => toLightboxItem(s.img, p.title, s.title, PASS_META[s.kind].short));

  const chips = [
    ...p.software.map((s) => ({ label: SOFTWARE[s].short })),
    ...(p.tris ? [{ label: p.tris.label, accent: true }] : []),
    ...(p.textureSets.length ? [{ label: "4K PBR" }] : []),
    ...(p.shots.length ? [{ label: `${p.shots.length} frames` }] : [{ label: "Turntable" }]),
  ];

  const specs = specsFor(p);
  // [01] is the overview; breakdown groups follow, then the texture maps
  const firstGroupIndex = 2;
  const texturesIndex = String(firstGroupIndex + groups.length).padStart(2, "0");

  return (
    <article>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "VisualArtwork",
          name: p.title,
          description: p.description.join(" "),
          artform: "3D model",
          artMedium: p.software.map((s) => SOFTWARE[s].name).join(", "),
          genre: p.discipline,
          image: `${site.url}${p.hero.src}`,
          url: `${site.url}/work/${p.slug}`,
          creator: { "@type": "Person", name: site.name, jobTitle: site.role },
        }}
      />
      <ProjectHeader
        index={p.index}
        total={PROJECTS.length}
        title={p.title}
        kicker={`${p.kicker} · ${p.index}`}
        category={p.category}
        discipline={p.discipline}
        chips={chips}
        summary={p.summary}
      />

      <section className="shell mt-10 sm:mt-12" aria-label="Viewport">
        <FadeUp y={50}>{p.video ? <Turntable title={p.title} frames={p.video.frames} poster={p.video.poster} /> : <PassViewer title={p.title} stacks={p.stacks} />}</FadeUp>
      </section>

      <section className="shell mt-28 grid gap-12 sm:mt-36 lg:grid-cols-12 lg:gap-14" aria-labelledby="overview-title">
        <div className="lg:col-span-6">
          <p className="label text-accent">[01] — Asset breakdown</p>
          <h2 id="overview-title" className="display mt-4 text-[clamp(2.6rem,5.5vw,5.2rem)] text-ink">
            Project overview
          </h2>
          <div className="mt-8 space-y-5 text-[clamp(1rem,1.2vw,1.15rem)] leading-relaxed text-ink-2">
            {p.description.map((d) => (
              <FadeUp key={d.slice(0, 24)}>
                <p>{d}</p>
              </FadeUp>
            ))}
          </div>
          {p.optimization && (
            <FadeUp className="chamfer-sm mt-8 border border-accent/30 bg-accent/[0.06] p-5">
              <p className="label-sm text-accent">Optimization note</p>
              <p className="mt-2 text-ink-2">{p.optimization}</p>
            </FadeUp>
          )}
          <FadeUp className="mt-10">
            <p className="label-sm text-mute">Project includes</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.includes.map((x) => (
                <span key={x} className="label-sm border border-line-2 px-2.5 py-1.5 text-ink-2">
                  {x}
                </span>
              ))}
            </div>
          </FadeUp>
        </div>

        <FadeUp className="lg:col-span-6" delay={0.1}>
          <div className="panel chamfer relative p-6 sm:p-8">
            <div className="hud-corners pointer-events-none absolute inset-2 opacity-50" />
            <p className="label text-accent">Technical specifications</p>
            <dl className="mt-6 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              {specs.map((s) => (
                <div key={s.label} className="border-t border-line py-4">
                  <dt className="label-sm text-mute">{s.label}</dt>
                  <dd className={s.accent ? "mt-1.5 font-semibold text-accent" : "mt-1.5 font-semibold text-ink"}>{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </FadeUp>
      </section>

      {groups.length > 0 && (
        <div className="shell mt-28 sm:mt-36">
          <Gallery groups={groups} items={items} startIndex={firstGroupIndex} />
        </div>
      )}

      {p.textureSets.length > 0 && (
        <section className="shell mt-28 sm:mt-36" aria-labelledby="textures-title">
          <div className="mb-10 border-t border-line pt-10">
            <p className="label-sm text-mute">{texturesIndex} — Texture sets · 4096 × 4096</p>
            <h2 id="textures-title" className="display mt-2 text-[clamp(2.4rem,5vw,4.8rem)] text-ink">
              PBR Texture Maps
            </h2>
            <p className="label mt-3 max-w-2xl normal-case tracking-[0.06em] text-ink-2">
              The exported Substance 3D Painter channels. Hover a channel to preview it, click the map to inspect it at full resolution.
            </p>
          </div>
          <TextureSets title={p.title} sets={p.textureSets} uv={p.uv} />
        </section>
      )}

      <div className="mt-28 sm:mt-36">
        <ProjectOutro more={more} prev={toCard(prev)} next={toCard(next)} />
      </div>
    </article>
  );
}
