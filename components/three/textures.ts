import * as THREE from "three";

const cache = new Map<string, Promise<THREE.Texture>>();
let loader: THREE.TextureLoader | null = null;

/** Promise-cached texture loads; render passes are sampled raw (no colour-space conversion). */
export function loadTexture(url: string): Promise<THREE.Texture> {
  let p = cache.get(url);
  if (!p) {
    loader ??= new THREE.TextureLoader();
    p = loader.loadAsync(url).then((t) => {
      t.colorSpace = THREE.NoColorSpace;
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.anisotropy = 4;
      t.needsUpdate = true;
      return t;
    });
    cache.set(url, p);
    p.catch(() => cache.delete(url));
  }
  return p;
}

export function texSize(t: THREE.Texture | null) {
  const img = t?.image as { width?: number; height?: number } | undefined;
  return new THREE.Vector2(img?.width ?? 16, img?.height ?? 9);
}

let blank: THREE.DataTexture | null = null;
export function blankTexture() {
  if (!blank) {
    blank = new THREE.DataTexture(new Uint8Array([6, 6, 7, 255]), 1, 1);
    blank.needsUpdate = true;
  }
  return blank;
}
