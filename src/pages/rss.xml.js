import rss from "@astrojs/rss";
import { getPublishedBlogPosts } from "../lib/blog";
import { OWNER_NAME, SITE_DESCRIPTION } from "../lib/site";
import { withBase } from "../lib/paths";

export async function GET(context) {
  const posts = await getPublishedBlogPosts();

  return rss({
    title: `${OWNER_NAME} Blog`,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: withBase(`/blog/${post.slug}/`),
    })),
  });
}
