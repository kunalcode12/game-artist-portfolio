// Single source of truth for personal details and links.
// TODO(owner): replace the ArtStation / LinkedIn URLs with your real profile links,
// and drop a CV into /public (e.g. /public/sohan-singh-cv.pdf) then set `resumeUrl`.

const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const site = {
  name: "Sohan Singh",
  firstName: "Sohan",
  lastName: "Singh",
  role: "3D Game Artist",
  tagline: "Hard Surface Props · Vehicles · Weapons",
  location: "Delhi, India",
  email: "sohansingh76044@gmail.com",
  availability: "Available for opportunities",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000"),
  artstation: "https://www.artstation.com/sohansingh",
  linkedin: "https://www.linkedin.com/",
  resumeUrl: null as string | null,
  specialties: ["Hard Surface Modeling", "Game Props", "PBR Texturing", "Look Development"],
  pipeline: ["Autodesk Maya", "Substance 3D Painter", "Arnold", "Adobe Photoshop"],
};

export const NAV = [
  { id: "work", label: "Work" },
  { id: "expertise", label: "Expertise" },
  { id: "workflow", label: "Workflow" },
  { id: "vault", label: "Vault" },
  { id: "about", label: "About" },
  { id: "resume", label: "Resume" },
  { id: "contact", label: "Contact" },
] as const;

export type SectionId = (typeof NAV)[number]["id"];
