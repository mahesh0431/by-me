import type { CollectionEntry } from "astro:content";

import { filterAndSortPublishedPosts } from "./blog";

export type SpeakingEntry = CollectionEntry<"speaking">;

export async function getSpeakingEntries(): Promise<SpeakingEntry[]> {
  const { getCollection } = await import("astro:content");
  const entries = await getCollection("speaking");
  for (const entry of entries) {
    getSpeakingRouteSlug(entry);
  }
  return filterAndSortPublishedPosts(entries);
}

function getSlugFromId(id: string): string {
  const normalizedId = id.replaceAll("\\", "/");
  const parts = normalizedId.split("/");
  const fileName = parts.at(-1) ?? normalizedId;

  if (fileName === "index.md" || fileName === "index.mdx") {
    return parts.at(-2) ?? "";
  }

  return fileName.replace(/\.(md|mdx)$/, "");
}

export function getSpeakingRouteSlug(entry: SpeakingEntry): string {
  const folderSlug = getSlugFromId(entry.id);
  const frontmatterSlug = entry.data.slug;

  if (frontmatterSlug && frontmatterSlug !== folderSlug) {
    throw new Error(
      `Speaking entry slug mismatch: frontmatter slug "${frontmatterSlug}" must match folder slug "${folderSlug}" in ${entry.id}.`,
    );
  }

  return folderSlug;
}
