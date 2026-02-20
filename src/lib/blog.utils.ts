/**
 * Re-exports blog utility functions from the main blog module.
 * This module exists for backwards compatibility and cleaner imports in tests.
 */

export {
  isPublishedPost,
  sortPostsNewestFirst,
  groupPostsByYear,
} from "./blog";

// Type exports for test compatibility
export interface BlogPostLike {
  id?: string;
  slug?: string;
  data: {
    pubDate: Date;
    draft?: boolean;
  };
}

export interface BlogArchiveGroup<TPost extends BlogPostLike> {
  year: number;
  posts: TPost[];
}
