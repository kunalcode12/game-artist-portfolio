import type { Img } from "./projects";

export type LightboxItem = {
  src: string;
  thumb: string;
  w: number;
  h: number;
  blur?: string;
  title: string;
  subtitle?: string;
  tag?: string;
};

export const toLightboxItem = (img: Img, title: string, subtitle?: string, tag?: string): LightboxItem => ({
  src: img.src,
  thumb: img.thumb,
  w: img.w,
  h: img.h,
  blur: img.blur,
  title,
  subtitle,
  tag,
});
