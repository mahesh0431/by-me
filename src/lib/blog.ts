import type { CollectionEntry } from "astro:content";
import { getYearFromDate } from "./dates";

export type BlogEntry = CollectionEntry<"blog">;

type HasDraft = {
  data: {
    draft?: boolean;
  };
};

type HasPubDate = {
  slug?: string;
  id?: string;
  data: {
    created: Date;
  };
};

type HasPostData = {
  data: {
    draft?: boolean;
    created: Date;
  };
};

export function isPublishedPost<T extends HasDraft>(post: T): boolean {
  return post.data.draft !== true;
}

export function sortPostsNewestFirst<T extends HasPubDate>(posts: T[]): T[] {
  return [...posts].sort((left, right) => {
    const dateDiff = right.data.created.getTime() - left.data.created.getTime();
    if (dateDiff !== 0) {
      return dateDiff;
    }

    const leftStableId = left.id ?? left.slug ?? "";
    const rightStableId = right.id ?? right.slug ?? "";
    return leftStableId.localeCompare(rightStableId);
  });
}

export function filterAndSortPublishedPosts<T extends HasPostData>(posts: T[]): T[] {
  return sortPostsNewestFirst(posts.filter(isPublishedPost));
}

export function groupPostsByYear<T extends HasPubDate>(
  posts: T[],
): Array<{ year: number; posts: T[] }> {
  const grouped = new Map<number, T[]>();

  for (const post of sortPostsNewestFirst(posts)) {
    const year = getYearFromDate(post.data.created);
    const bucket = grouped.get(year) ?? [];
    bucket.push(post);
    grouped.set(year, bucket);
  }

  return [...grouped.entries()]
    .sort((left, right) => right[0] - left[0])
    .map(([year, bucket]) => ({ year, posts: bucket }));
}

export async function getPublishedBlogPosts(): Promise<BlogEntry[]> {
  const { getCollection } = await import("astro:content");
  const posts = await getCollection("blog");
  for (const post of posts) {
    getPostRouteSlug(post);
  }
  return filterAndSortPublishedPosts(posts);
}

export async function getBlogPosts(): Promise<BlogEntry[]> {
  return getPublishedBlogPosts();
}

export function getBlogArchiveGroups(
  posts: BlogEntry[],
): Array<{ year: number; posts: BlogEntry[] }> {
  return groupPostsByYear(posts);
}

export async function getBlogArchiveByYear(): Promise<Array<{ year: number; posts: BlogEntry[] }>> {
  return groupPostsByYear(await getPublishedBlogPosts());
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

export function getPostRouteSlug(post: BlogEntry): string {
  const folderSlug = getSlugFromId(post.id);
  const frontmatterSlug = post.data.slug;

  if (frontmatterSlug && frontmatterSlug !== folderSlug) {
    throw new Error(
      `Blog post slug mismatch: frontmatter slug "${frontmatterSlug}" must match folder slug "${folderSlug}" in ${post.id}.`,
    );
  }

  return folderSlug;
}
