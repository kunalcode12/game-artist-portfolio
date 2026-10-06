import type { MetadataRoute } from "next";
import { PROJECTS } from "@/lib/projects";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, changeFrequency: "monthly", priority: 1 },
    ...PROJECTS.map((p) => ({
      url: `${site.url}/work/${p.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.8,
      images: [`${site.url}${p.hero.src}`],
    })),
  ];
}
