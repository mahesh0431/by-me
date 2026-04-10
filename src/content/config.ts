import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional(),
    heroImage: z.string().optional(),
  }),
});

const profile = defineCollection({
  type: "content",
  schema: z.object({
    name: z.string(),
    role: z.string(),
    avatar: z.string(),
    aboutDescription: z.string(),
    homeHeading: z.string(),
    homeIntro: z.string(),
  }),
});

export const collections = {
  blog,
  profile,
};
