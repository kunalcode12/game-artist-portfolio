# Sohan Singh — 3D Game Artist portfolio

A Next.js 16 portfolio built around one idea: **the site is a 3D viewport**. Every project is shown
through its real render passes — beauty, raw, AO, wireframe, normal and color ID — which line up
pixel-for-pixel, so visitors can flip and compare them like shading modes in Maya.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static production build (all routes prerendered)
npm start
```

## Edit your details

Everything personal lives in [`lib/site.ts`](lib/site.ts): name, email, location, availability,
and the **ArtStation / LinkedIn links (currently placeholders — replace them)**. To offer a CV
download, put the PDF in `public/` and set `resumeUrl` (e.g. `"/sohan-singh-cv.pdf"`); until then
the CV button opens a pre-filled email request instead.

## Project content

- Text, polycounts and categories: [`lib/projects.ts`](lib/projects.ts) (taken from the `.txt`
  write-ups in each asset folder).
- Images: raw files go in `public/assets/<folder>`; `npm run media` converts them to web-ready
  WebP tiers in `public/media` and writes `lib/media.generated.json` (sizes + blur placeholders).
  The raw folder is git-ignored — only `public/media` needs to be committed/deployed.

### Adding a project

1. Drop the renders / texture maps into `public/assets/<New Folder>`.
2. Map the files to keys in the `PROJECTS` table at the top of
   [`scripts/build-media.mjs`](scripts/build-media.mjs) and run `npm run media`.
3. Add an entry to `PROJECTS` in `lib/projects.ts`. Group passes rendered from the same camera into
   a `stack` — they will then be switchable/comparable in the project viewport.

The chair turntable frames were extracted with ffmpeg; to regenerate them run
`FFMPEG_PATH=/path/to/ffmpeg npm run media -- --force`.

## What's in here

| Area | Where |
| --- | --- |
| Hero X-ray lens (GLSL, pass reveal + glitch transitions) | `components/three/LensCanvas.tsx`, `shaders.ts` |
| Scroll-driven 7-stage pipeline (blueprint shader → beauty) | `components/home/Pipeline.tsx`, `three/PipelineCanvas.tsx` |
| Render vault (instanced 3D ring of all 63 frames) | `components/home/Vault.tsx`, `three/VaultCanvas.tsx` |
| Project viewport (passes `1–6`, compare `C`, cameras `[` `]`) | `components/project/PassViewer.tsx` |
| Full-res viewer (zoom to cursor, pinch, pan, minimap) | `components/lightbox/Lightbox.tsx` |
| Cursor, boot screen, level-loading transitions, SFX, achievements | `components/chrome/*`, `components/providers/*` |

Easter eggs: Maya's `4`/`5` hotkeys toggle wireframe mode on the home page, there are eight
achievements to unlock, and the Konami code still works.
