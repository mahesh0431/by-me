import type { ImageMetadata } from "astro";
import { getImage } from "astro:assets";

/** Widths to generate for a full-width hero, capped at the source width (never upscale). */
export function getHeroWidths(image: ImageMetadata): number[] {
  const widths = [640, 1024, 1600].filter((width) => width <= image.width);
  return widths.length > 0 ? widths : [image.width];
}

/** Social cards (Open Graph, X, LinkedIn) want a ~1200px JPEG rather than WebP. */
export async function getSocialImageSrc(image: ImageMetadata): Promise<string> {
  const social = await getImage({ src: image, width: Math.min(1200, image.width), format: "jpg" });
  return social.src;
}
