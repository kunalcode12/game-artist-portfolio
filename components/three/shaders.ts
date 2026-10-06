// Shared GLSL. Images are sampled raw (NoColorSpace, flat/linear canvas) so render passes
// display exactly as authored.

export const fullscreenVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const common = /* glsl */ `
  vec2 coverUv(vec2 uv, vec2 res, vec2 img) {
    float rs = res.x / res.y;
    float ri = img.x / img.y;
    vec2 s = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
    return (uv - 0.5) * s + 0.5;
  }
  vec2 containUv(vec2 uv, vec2 res, vec2 img) {
    float rs = res.x / res.y;
    float ri = img.x / img.y;
    vec2 s = rs > ri ? vec2(rs / ri, 1.0) : vec2(1.0, ri / rs);
    return (uv - 0.5) * s + 0.5;
  }
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float inBounds(vec2 uv) {
    return step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  }
`;

/**
 * Hero lens: beauty render everywhere, a second (pixel-aligned) pass inside a magnifying
 * lens that follows the pointer; uMix drives a glitchy block-dissolve between two assets.
 */
export const lensFrag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uA;
  uniform sampler2D uAP;
  uniform sampler2D uB;
  uniform sampler2D uBP;
  uniform vec2 uImgA;
  uniform vec2 uImgB;
  uniform vec2 uRes;
  uniform vec2 uMouse;
  uniform float uMix;
  uniform float uRadius;
  uniform float uLens;
  uniform float uInvert;
  uniform float uTime;
  ${common}

  void main() {
    vec2 uv = vUv;
    float aspect = uRes.x / uRes.y;
    vec2 d = (uv - uMouse) * vec2(aspect, 1.0);
    float dist = length(d);
    float r = uRadius * uLens;
    float inside = 1.0 - smoothstep(r - 0.0025, r + 0.0025, dist);

    // per-block dissolve with a horizontal tear while the swap is in flight
    float n = hash(floor(uv * vec2(30.0, 16.0)));
    float t = smoothstep(n * 0.72, n * 0.72 + 0.28, uMix);
    float glitch = 1.0 - abs(uMix * 2.0 - 1.0);
    float row = floor(uv.y * 48.0);
    float tear = (hash(vec2(row, floor(uTime * 24.0))) - 0.5) * 0.05 * glitch * step(0.55, hash(vec2(row, 7.0)));

    vec2 suv = mix(uv, uMouse + (uv - uMouse) * 0.88, inside) + vec2(tear, 0.0);
    vec2 ca = vec2(0.0018 * glitch + 0.0012 * smoothstep(r * 0.75, r, dist) * inside, 0.0);

    vec2 a = coverUv(suv, uRes, uImgA);
    vec2 b = coverUv(suv, uRes, uImgB);
    vec3 beautyA = vec3(texture2D(uA, a + ca).r, texture2D(uA, a).g, texture2D(uA, a - ca).b);
    vec3 beautyB = vec3(texture2D(uB, b + ca).r, texture2D(uB, b).g, texture2D(uB, b - ca).b);
    vec3 beauty = mix(beautyA, beautyB, t);
    vec3 pass = mix(texture2D(uAP, a).rgb, texture2D(uBP, b).rgb, t);

    vec3 outside = mix(beauty, pass, uInvert);
    vec3 lensCol = mix(pass, beauty, uInvert);
    vec3 col = mix(outside, lensCol, inside);

    // lens chrome: scanlines, warm rim, ring, ticks, crosshair
    col *= 1.0 - 0.07 * step(0.5, fract(gl_FragCoord.y / 3.0)) * inside;
    float rim = smoothstep(r * 0.62, r, dist) * inside;
    col = mix(col, col * vec3(1.18, 0.96, 0.78), rim * 0.4);
    float ring = smoothstep(0.0035, 0.0, abs(dist - r)) * uLens;
    float ang = atan(d.y, d.x) / 6.2831853 + 0.5;
    float ticks = step(0.86, fract(ang * 36.0)) * smoothstep(0.014, 0.0, abs(dist - r - 0.014)) * uLens;
    float bigTicks = step(0.8, fract(ang * 4.0 + 0.1)) * smoothstep(0.024, 0.0, abs(dist - r - 0.02)) * uLens;
    vec2 pd = (uv - uMouse) * uRes;
    float cross = (step(abs(pd.x), 0.7) * step(abs(pd.y), 9.0) + step(abs(pd.y), 0.7) * step(abs(pd.x), 9.0)) * step(3.5, length(pd)) * uLens;
    vec3 amber = vec3(1.0, 0.651, 0.188);
    col += amber * (ring * 0.95 + ticks * 0.5 + bigTicks * 0.8);
    col = mix(col, amber, cross * 0.95);

    // transition flash + vignette
    col += amber * 0.12 * glitch * step(0.985, hash(vec2(row, floor(uTime * 30.0))));
    float vig = smoothstep(1.3, 0.3, length((uv - 0.5) * vec2(aspect * 0.75, 1.0)));
    col *= mix(0.42, 1.0, vig);
    gl_FragColor = vec4(col, 1.0);
  }
`;

/**
 * Pipeline scrubber: shows stage `uFrom` → `uTo` with a scroll-driven scan wipe.
 * Each stage texture can be a render ("cover") or a square texture sheet ("contain").
 * Stage 0 is a blueprint treatment generated from the wireframe pass.
 */
export const pipelineFrag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uFrom;
  uniform sampler2D uTo;
  uniform vec2 uFromSize;
  uniform vec2 uToSize;
  uniform float uFromMode; // 0 render, 1 texture sheet, 2 blueprint
  uniform float uToMode;
  uniform float uWipe;
  uniform vec2 uRes;
  uniform float uTime;
  ${common}

  vec3 blueprint(sampler2D tex, vec2 uv, vec2 texel) {
    float l = dot(texture2D(tex, uv).rgb, vec3(0.299, 0.587, 0.114));
    float lx = dot(texture2D(tex, uv + vec2(texel.x, 0.0)).rgb, vec3(0.333));
    float ly = dot(texture2D(tex, uv + vec2(0.0, texel.y)).rgb, vec3(0.333));
    float edge = clamp((abs(l - lx) + abs(l - ly)) * 5.0, 0.0, 1.0);
    float ink = pow(1.0 - l, 1.6);
    vec3 navy = vec3(0.03, 0.09, 0.17);
    vec3 cyan = vec3(0.45, 0.82, 1.0);
    return navy + cyan * (ink * 0.85 + edge * 1.25);
  }

  vec3 stage(sampler2D tex, vec2 uv, vec2 size, float mode) {
    if (mode > 1.5) {
      vec2 c = coverUv(uv, uRes, size);
      vec3 col = blueprint(tex, c, 1.0 / size);
      vec2 g = uv * uRes / 22.0;
      vec2 gf = abs(fract(g) - 0.5);
      float minor = smoothstep(0.47, 0.5, max(gf.x, gf.y));
      vec2 G = uv * uRes / 110.0;
      vec2 Gf = abs(fract(G) - 0.5);
      float major = smoothstep(0.485, 0.5, max(Gf.x, Gf.y));
      return col + vec3(0.25, 0.5, 0.7) * (minor * 0.08 + major * 0.18);
    }
    if (mode > 0.5) {
      vec2 inner = (uv - 0.5) * 1.12 + 0.5;
      vec2 c = containUv(inner, uRes, size);
      float on = inBounds(c);
      vec3 sheet = texture2D(tex, clamp(c, 0.0, 1.0)).rgb;
      vec2 g = abs(fract(uv * uRes / 28.0) - 0.5);
      float grid = smoothstep(0.46, 0.5, max(g.x, g.y)) * 0.05;
      return mix(vec3(0.035 + grid), sheet, on);
    }
    return texture2D(tex, coverUv(uv, uRes, size)).rgb;
  }

  void main() {
    vec2 uv = vUv;
    float w = uWipe * 1.1 - 0.05;
    float edgeDist = uv.x - w;
    float band = smoothstep(0.06, 0.0, abs(edgeDist));
    float row = floor(uv.y * 90.0);
    float jitter = (hash(vec2(row, floor(uTime * 18.0))) - 0.5) * 0.04 * band;
    float reveal = step(uv.x + jitter, w);

    vec3 a = stage(uFrom, uv, uFromSize, uFromMode);
    vec3 b = stage(uTo, uv, uToSize, uToMode);
    vec3 col = mix(a, b, reveal);

    vec3 amber = vec3(1.0, 0.651, 0.188);
    float line = smoothstep(0.0025, 0.0, abs(edgeDist + jitter)) * step(0.001, uWipe) * step(uWipe, 0.999);
    col += amber * line * 1.4;
    col += amber * band * 0.08 * step(0.001, uWipe) * step(uWipe, 0.999);

    float aspect = uRes.x / uRes.y;
    float vig = smoothstep(1.35, 0.35, length((uv - 0.5) * vec2(aspect * 0.7, 1.0)));
    col *= mix(0.5, 1.0, vig);
    gl_FragColor = vec4(col, 1.0);
  }
`;
