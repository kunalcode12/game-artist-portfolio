import { About } from "@/components/home/About";
import { Contact } from "@/components/home/Contact";
import { Expertise } from "@/components/home/Expertise";
import { Hero } from "@/components/home/Hero";
import { Marquee } from "@/components/home/Marquee";
import { Pipeline } from "@/components/home/Pipeline";
import { Stats } from "@/components/home/Stats";
import { Vault } from "@/components/home/Vault";
import { WorkSection } from "@/components/home/WorkSection";
import { JsonLd } from "@/components/JsonLd";
import { toCard } from "@/lib/cards";
import { heroSlides, homeStats, pipelineAssets, profile, vaultData } from "@/lib/home-data";
import { CATEGORY_COUNTS, PROJECTS } from "@/lib/projects";
import { site } from "@/lib/site";

export default function Home() {
  const vault = vaultData();
  const me = profile();
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: site.name,
          jobTitle: site.role,
          url: site.url,
          email: `mailto:${site.email}`,
          address: { "@type": "PostalAddress", addressLocality: "Delhi", addressCountry: "IN" },
          knowsAbout: [...site.specialties, "Low-poly optimization", "UV unwrapping", "High-to-low baking"],
          hasOccupation: { "@type": "Occupation", name: "3D Game Artist", skills: site.pipeline.join(", ") },
        }}
      />
      <Hero slides={heroSlides()} />
      <Marquee />
      <WorkSection cards={PROJECTS.map(toCard)} counts={CATEGORY_COUNTS} />
      <Stats stats={homeStats()} />
      <Expertise />
      <Pipeline assets={pipelineAssets()} />
      <Vault atlas={vault.atlas} tiles={vault.tiles} />
      <About stats={me.stats} loadout={me.loadout} />
      <Contact />
    </>
  );
}
