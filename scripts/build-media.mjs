// Converts the raw production assets in public/assets (4K renders, up to 64 MB PNG texture
// maps, the chair turntable) into web-ready WebP tiers under public/media and writes
// lib/media.generated.json with dimensions + blur placeholders for every image.
//
//   npm run media            -> incremental (skips outputs newer than their source)
//   npm run media -- --force -> rebuild everything
//
// Chair turntable frames need ffmpeg: set FFMPEG_PATH to an ffmpeg binary. Without it the
// script reuses frames that already exist in public/media/wooden-chair/frames.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "public", "assets");
const OUT = path.join(ROOT, "public", "media");
const MANIFEST = path.join(ROOT, "lib", "media.generated.json");
const FORCE = process.argv.includes("--force");

sharp.concurrency(4);

const RENDER_TIERS = { master: 2560, gl: 1600, thumb: 720 };
const TEXTURE_TIERS = { master: 2048, thumb: 560 };
const ATLAS = { cols: 9, tileW: 448, tileH: 224 };

const tex = (folder, files) =>
  Object.fromEntries(Object.entries(files).map(([k, v]) => [k, `${folder}/${v}`]));

const PROJECTS = {
  "game-boy": {
    dir: "Gameboy Final Renders",
    renders: {
      "beauty-1": "B 1.jpg",
      "beauty-2": "B 2.jpg",
      "beauty-3": "B 3.jpg",
      "nopost-1": "Color NP.jpg",
      "ao-1": "Ao 1.jpg",
      "ao-2": "Ao 2.jpg",
      "wire-1": "Wireframe 1.jpg",
      "wire-2": "Wireframe 2.jpg",
      "wire-3": "Wireframe 3.jpg",
      "normal-1": "Nrm.jpg",
      "normal-2": "Nrm 2.jpg",
      "id-1": "ID.jpg",
    },
    textures: tex("Texture Maps", {
      "tex-main-basecolor": "BaseColor.png",
      "tex-main-normal": "Normal.png",
      "tex-main-roughness": "Roughness.png",
      "tex-main-metalness": "Metalness.png",
      "tex-main-ao": "Ambient occlusion.png",
      "tex-main-height": "Height.png",
      "tex-main-id": "ID.png",
    }),
  },
  "mclaren-mp4-12c": {
    dir: "Car Final Renders",
    renders: {
      "beauty-1": "B 1.jpg",
      "beauty-2": "B 2.jpg",
      "beauty-3": "B 3.jpg",
      "nopost-1": "Color NP.jpg",
      "hdri-1": "HDRI 1.jpg",
      "hdri-2": "HDRI 2.jpg",
      "ao-1": "Ao 1.jpg",
      "ao-2": "Ao 2.jpg",
      "ao-3": "Ao 3 NP.jpg",
      "ao-4": "Ao 4 NP.jpg",
      "wire-1": "Wireframe 1.jpg",
      "wire-2": "Wireframe 2.jpg",
      "wire-3": "Wireframe 3.jpg",
      "normal-1": "Nrm.jpg",
      "id-1": "ID.jpg",
    },
    textures: tex("Texture maps", {
      "tex-main-basecolor": "_BaseColor.png",
      "tex-main-normal": "Normal.png",
      "tex-main-roughness": "Roughness.png",
      "tex-main-metalness": "Metalness.png",
      "tex-main-ao": "Ambient occlusion.png",
      "tex-main-id": "ID.png",
    }),
  },
  "fn-scar-h": {
    dir: "Gun Final Renders",
    renders: {
      "beauty-1": "B 1.jpg",
      "beauty-2": "B 2.jpg",
      "beauty-3": "B 3.jpg",
      "hdri-1": "HDRI 1.jpg",
      "hdri-2": "HDRI 2.jpg",
      "hdri-3": "HDRI 3.jpg",
      "ao-1": "Ao 1.jpg",
      "ao-2": "Ao 2.jpg",
      "wire-1": "Wireframe 1.jpg",
      "wire-2": "Wireframe 2.jpg",
      "wire-3": "Wireframe 3.jpg",
      "wire-4": "Wireframe 4.jpg",
      "normal-1": "Nrm.jpg",
      "id-1": "ID.jpg",
    },
    textures: tex("Texture Maps", {
      "tex-a-basecolor": "BaseColor.png",
      "tex-a-normal": "Normal.png",
      "tex-a-roughness": "Roughness.png",
      "tex-a-metalness": "Metalness.png",
      "tex-a-ao": "Ambient occlusion.png",
      "tex-a-height": "Height.png",
      "tex-b-basecolor": "BaseColor.1.png",
      "tex-b-normal": "Normal.1.png",
      "tex-b-roughness": "Roughness.1.png",
      "tex-b-ao": "Ambient occlusion.1.png",
      "tex-b-height": "Height.1.png",
    }),
  },
  "camper-van": {
    dir: "Camper Van",
    renders: {
      "beauty-1": "B 1.jpg",
      "beauty-2": "B 2.jpg",
      "beauty-3": "B 3.jpg",
      "hdri-1": "HDRI 1.jpg",
      "hdri-2": "HDRI 2.jpg",
      "ao-1": "Ao 1.jpg",
      "ao-2": "Ao 2.jpg",
      "wire-1": "Wireframe 1.jpg",
      "wire-2": "Wireframe 2.jpg",
      "normal-1": "Nrm.jpg",
      "normal-2": "Nrm 2.jpg",
      "id-1": "ID.jpg",
    },
    textures: {
      ...tex("Texture Maps/Van Boady", {
        "tex-body-basecolor": "Van lowpoly_pasted__Van_Body_BaseColor.png",
        "tex-body-normal": "Van lowpoly_pasted__Van_Body_Normal.png",
        "tex-body-roughness": "Van lowpoly_pasted__Van_Body_Roughness.png",
        "tex-body-metalness": "Van lowpoly_pasted__Van_Body_Metalness.png",
        "tex-body-ao": "Van lowpoly_pasted__Van_Body_Ambient occlusion.png",
        "tex-body-height": "Van lowpoly_pasted__Van_Body_Height.png",
        "tex-body-id": "Van lowpoly_pasted__Van_Body_ID.png",
        "tex-body-emissive": "Van lowpoly_pasted__Van_Body_Emissive.png",
        "tex-body-opacity": "Van lowpoly_pasted__Van_Body_Opacity.png",
      }),
      ...tex("Texture Maps/Side Props", {
        "tex-props-basecolor": "Van lowpoly_pasted__Side_props_BaseColor.png",
        "tex-props-normal": "Van lowpoly_pasted__Side_props_Normal.png",
        "tex-props-roughness": "Van lowpoly_pasted__Side_props_Roughness.png",
        "tex-props-metalness": "Van lowpoly_pasted__Side_props_Metalness.png",
        "tex-props-ao": "Van lowpoly_pasted__Side_props_Ambient occlusion.png",
        "tex-props-height": "Van lowpoly_pasted__Side_props_Height.png",
        "tex-props-id": "Van lowpoly_pasted__Side_props_ID.png",
        "tex-props-emissive": "Van lowpoly_pasted__Side_props_Emissive.png",
        "tex-props-opacity": "Van lowpoly_pasted__Side_props_Opacity.png",
      }),
    },
  },
  "cb-radio": {
    dir: "Radio Final Renders",
    renders: {
      "beauty-1": "B 1.jpg",
      "beauty-2": "B 2.jpg",
      "beauty-3": "B 3.jpg",
      "nopost-1": "Color NP.jpg",
      "ao-1": "Ao 1.jpg",
      "ao-2": "Ao 2.jpg",
      "wire-1": "Wireframe 1.jpg",
      "wire-2": "Wireframe 2.jpg",
      "normal-1": "Nrm.jpg",
      "id-1": "ID.jpg",
    },
    textures: tex("Texture Maps", {
      "tex-main-basecolor": "Radio LowPoly UV_Radio_BaseColor.1001.png",
      "tex-main-normal": "Radio LowPoly UV_Radio_Normal.1001.png",
      "tex-main-roughness": "Radio LowPoly UV_Radio_Roughness.1001.png",
      "tex-main-metalness": "Radio LowPoly UV_Radio_Metalness.1001.png",
      "tex-main-ao": "Radio LowPoly UV_Radio_Ambient occlusion.1001.png",
      "tex-main-height": "Radio LowPoly UV_Radio_Height.1001.png",
      "tex-main-id": "Radio LowPoly UV_Radio_ID.1001.png",
    }),
  },
};

const CHAIR = { slug: "wooden-chair", dir: "wooden chair", video: "Chair Model.mp4", frames: 50 };

function isFresh(outFile, srcFile) {
  if (FORCE || !fs.existsSync(outFile)) return false;
  return fs.statSync(outFile).mtimeMs >= fs.statSync(srcFile).mtimeMs;
}

async function blurOf(file) {
  const buf = await sharp(file).resize(24).webp({ quality: 40 }).toBuffer();
  return `data:image/webp;base64,${buf.toString("base64")}`;
}

async function processImage(slug, key, srcRel, kind) {
  const src = path.join(SRC, PROJECTS[slug].dir, srcRel);
  const dir = path.join(OUT, slug);
  fs.mkdirSync(dir, { recursive: true });
  const tiers = kind === "render" ? RENDER_TIERS : TEXTURE_TIERS;
  const meta = await sharp(src, { limitInputPixels: false }).metadata();
  const files = {};
  for (const [tier, width] of Object.entries(tiers)) {
    const name = tier === "master" ? `${key}.webp` : `${key}.${tier}.webp`;
    const out = path.join(dir, name);
    files[tier] = { out, url: `/media/${slug}/${name}` };
    if (isFresh(out, src)) continue;
    const quality = tier === "thumb" ? 74 : tier === "gl" ? 82 : 84;
    await sharp(src, { limitInputPixels: false })
      .resize({ width: Math.min(width, meta.width), withoutEnlargement: true })
      .toColourspace("srgb")
      .webp({ quality, effort: 5, smartSubsample: true })
      .toFile(out);
  }
  const master = await sharp(files.master.out).metadata();
  return {
    src: files.master.url,
    ...(files.gl ? { gl: files.gl.url } : {}),
    thumb: files.thumb.url,
    w: master.width,
    h: master.height,
    ow: meta.width,
    oh: meta.height,
    kb: Math.round(fs.statSync(files.master.out).size / 1024),
    blur: await blurOf(files.thumb.out),
  };
}

async function buildAtlas(images, order) {
  const out = path.join(OUT, "vault-atlas.webp");
  const { cols, tileW, tileH } = ATLAS;
  const rows = Math.ceil(order.length / cols);
  const tiles = [];
  for (let i = 0; i < order.length; i++) {
    const file = path.join(ROOT, "public", images[order[i]].thumb);
    const input = await sharp(file).resize(tileW, tileH, { fit: "cover", position: "attention" }).toBuffer();
    tiles.push({ input, left: (i % cols) * tileW, top: Math.floor(i / cols) * tileH });
  }
  await sharp({ create: { width: cols * tileW, height: rows * tileH, channels: 3, background: "#0a0a0b" } })
    .composite(tiles)
    .webp({ quality: 80, effort: 5 })
    .toFile(out);
  return { src: "/media/vault-atlas.webp", cols, rows, tileW, tileH, w: cols * tileW, h: rows * tileH, tiles: order };
}

async function buildChair() {
  const srcDir = path.join(SRC, CHAIR.dir);
  const dir = path.join(OUT, CHAIR.slug);
  const framesDir = path.join(dir, "frames");
  fs.mkdirSync(framesDir, { recursive: true });
  const video = path.join(srcDir, CHAIR.video);
  const videoOut = path.join(dir, "turntable.mp4");
  if (!isFresh(videoOut, video)) fs.copyFileSync(video, videoOut);

  const ffmpeg = process.env.FFMPEG_PATH;
  const existing = fs.readdirSync(framesDir).filter((f) => f.endsWith(".webp"));
  if (ffmpeg && (FORCE || existing.length < CHAIR.frames)) {
    const tmp = fs.mkdtempSync(path.join(OUT, ".frames-"));
    try {
      // 100 source frames -> every other frame keeps the turntable smooth at half the weight
      execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-i", video, "-vf", "select=not(mod(n\\,2))", "-vsync", "vfr", path.join(tmp, "f%03d.png")]);
      const pngs = fs.readdirSync(tmp).filter((f) => f.endsWith(".png")).sort();
      for (const f of existing) fs.rmSync(path.join(framesDir, f));
      for (let i = 0; i < pngs.length; i++) {
        const name = `f${String(i).padStart(3, "0")}.webp`;
        await sharp(path.join(tmp, pngs[i])).resize({ width: 1440 }).webp({ quality: 76, effort: 5 }).toFile(path.join(framesDir, name));
      }
      await sharp(path.join(tmp, pngs[0])).webp({ quality: 84 }).toFile(path.join(dir, "poster.webp"));
      await sharp(path.join(tmp, pngs[0])).resize({ width: 720 }).webp({ quality: 74 }).toFile(path.join(dir, "poster.thumb.webp"));
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }
  const frames = fs.readdirSync(framesDir).filter((f) => f.endsWith(".webp")).sort();
  if (!frames.length) throw new Error("No chair frames found. Run with FFMPEG_PATH set once.");
  const fm = await sharp(path.join(framesDir, frames[0])).metadata();
  const pm = await sharp(path.join(dir, "poster.webp")).metadata();
  return {
    video: `/media/${CHAIR.slug}/turntable.mp4`,
    poster: {
      src: `/media/${CHAIR.slug}/poster.webp`,
      thumb: `/media/${CHAIR.slug}/poster.thumb.webp`,
      w: pm.width,
      h: pm.height,
      ow: pm.width,
      oh: pm.height,
      kb: Math.round(fs.statSync(path.join(dir, "poster.webp")).size / 1024),
      blur: await blurOf(path.join(dir, "poster.thumb.webp")),
    },
    frames: { count: frames.length, base: `/media/${CHAIR.slug}/frames/f`, ext: ".webp", w: fm.width, h: fm.height },
  };
}

async function buildOgImage(images) {
  const hero = images["mclaren-mp4-12c/beauty-1"];
  const base = await sharp(path.join(ROOT, "public", hero.src)).resize(1200, 630, { fit: "cover", position: "right" }).toBuffer();
  const svg = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#060607" stop-opacity="0.96"/><stop offset="0.55" stop-color="#060607" stop-opacity="0.55"/><stop offset="1" stop-color="#060607" stop-opacity="0"/></linearGradient></defs>
    <rect width="1200" height="630" fill="url(#g)"/>
    <text x="64" y="96" font-family="Consolas, monospace" font-size="20" letter-spacing="4" fill="#ffa630">● DELHI, INDIA · 3D GAME ARTIST</text>
    <text x="60" y="300" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="118" fill="#f2f2f2">SOHAN</text>
    <text x="60" y="420" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="118" fill="#f2f2f2">SINGH</text>
    <text x="64" y="490" font-family="Arial, sans-serif" font-size="26" fill="#b9bcc4">Hard-surface props, vehicles &amp; weapons — game-ready, PBR textured.</text>
    <rect x="64" y="540" width="120" height="4" fill="#ffa630"/>
  </svg>`);
  const out = await sharp(base).composite([{ input: svg }]).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
  fs.writeFileSync(path.join(ROOT, "app", "opengraph-image.jpg"), out);
  fs.writeFileSync(path.join(ROOT, "app", "twitter-image.jpg"), out);
}

const t0 = Date.now();
const images = {};
const atlasOrder = [];
const ATLAS_KINDS = ["beauty", "nopost", "hdri", "ao", "wire", "normal", "id"];

for (const [slug, project] of Object.entries(PROJECTS)) {
  const keys = Object.keys(project.renders).sort(
    (a, b) => ATLAS_KINDS.indexOf(a.split("-")[0]) - ATLAS_KINDS.indexOf(b.split("-")[0]) || a.localeCompare(b)
  );
  for (const key of keys) {
    images[`${slug}/${key}`] = await processImage(slug, key, project.renders[key], "render");
    atlasOrder.push(`${slug}/${key}`);
    process.stdout.write(".");
  }
  for (const [key, rel] of Object.entries(project.textures)) {
    images[`${slug}/${key}`] = await processImage(slug, key, rel, "texture");
    process.stdout.write("+");
  }
  console.log(` ${slug}`);
}

const chair = await buildChair();
const atlas = await buildAtlas(images, atlasOrder);
await buildOgImage(images);

fs.writeFileSync(MANIFEST, JSON.stringify({ images, atlas, chair }, null, 1));
const total = Object.values(images).reduce((s, i) => s + i.kb, 0);
console.log(`\n${Object.keys(images).length} images, masters ${Math.round(total / 1024)} MB, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
