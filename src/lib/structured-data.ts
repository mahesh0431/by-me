import type { CollectionEntry } from "astro:content";

import { getPostRouteSlug } from "./blog";
import { withBasePath } from "./paths";
import { getSpeakingRouteSlug } from "./speaking";
import {
  DEFAULT_OG_IMAGE,
  LINKEDIN_URL,
  OWNER_NAME,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_ORIGIN,
  X_URL,
} from "./site";

export type JsonLdObject = Record<string, unknown>;

type BlogPost = CollectionEntry<"blog">;
type Profile = CollectionEntry<"profile">;
type SpeakingEntry = CollectionEntry<"speaking">;

export function toSiteUrl(path: string, siteOrigin = SITE_ORIGIN): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return new URL(withBasePath(path), siteOrigin).toString();
}

export function serializeJsonLd(data: JsonLdObject): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function createWebSiteJsonLd(siteOrigin = SITE_ORIGIN): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteOrigin}/#website`,
    name: SITE_NAME,
    url: siteOrigin,
    description: SITE_DESCRIPTION,
    inLanguage: "en",
    publisher: {
      "@id": `${siteOrigin}/#person`,
    },
  };
}

export function createPersonJsonLd(profile: Profile, siteOrigin = SITE_ORIGIN): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteOrigin}/#person`,
    name: profile.data.name,
    url: siteOrigin,
    image: toSiteUrl(profile.data.avatar, siteOrigin),
    jobTitle: profile.data.role,
    worksFor: {
      "@type": "Organization",
      name: "SAP",
    },
    sameAs: [LINKEDIN_URL, X_URL],
    knowsAbout: [
      "Generative AI",
      "Agentic systems",
      "SAP architecture",
      "Enterprise architecture",
      "SAP BTP",
      "Cloud architecture",
    ],
  };
}

export function createProfilePageJsonLd(
  profile: Profile,
  pathname: string,
  description: string,
  siteOrigin = SITE_ORIGIN,
): JsonLdObject {
  const url = toSiteUrl(pathname, siteOrigin);

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${url}#profile-page`,
    url,
    name: `${profile.data.name} Profile`,
    description,
    inLanguage: "en",
    mainEntity: {
      "@id": `${siteOrigin}/#person`,
    },
  };
}

export function createBlogJsonLd(
  pathname: string,
  description: string,
  siteOrigin = SITE_ORIGIN,
): JsonLdObject {
  const url = toSiteUrl(pathname, siteOrigin);

  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${url}#blog`,
    url,
    name: `${OWNER_NAME} Blog`,
    description,
    inLanguage: "en",
    author: {
      "@id": `${siteOrigin}/#person`,
    },
    publisher: {
      "@id": `${siteOrigin}/#person`,
    },
  };
}

export function createBlogPostingJsonLd(
  post: BlogPost,
  profile: Profile,
  siteOrigin = SITE_ORIGIN,
): JsonLdObject {
  const slug = getPostRouteSlug(post);
  const url = toSiteUrl(`/blog/${slug}/`, siteOrigin);
  const title = post.data.seoTitle ?? post.data.title;
  const description = post.data.seoDescription ?? post.data.summary;
  const image = toSiteUrl(post.data.heroImage ?? DEFAULT_OG_IMAGE, siteOrigin);
  const dateModified = post.data.updated ?? post.data.created;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#blog-posting`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    headline: title,
    name: title,
    description,
    url,
    image,
    datePublished: post.data.created.toISOString(),
    dateModified: dateModified.toISOString(),
    inLanguage: "en",
    keywords: post.data.tags ?? [],
    author: {
      "@id": `${siteOrigin}/#person`,
      name: profile.data.name,
    },
    publisher: {
      "@id": `${siteOrigin}/#person`,
    },
  };
}

export function createSpeakingJsonLd(
  entry: SpeakingEntry,
  profile: Profile,
  options: { imageUrl?: string | null; siteOrigin?: string } = {},
): JsonLdObject {
  const siteOrigin = options.siteOrigin ?? SITE_ORIGIN;
  const slug = getSpeakingRouteSlug(entry);
  const url = toSiteUrl(`/speaking/${slug}/`, siteOrigin);
  const dateModified = entry.data.updated ?? entry.data.created;
  const title = entry.data.title;
  const data: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${url}#speaking-session`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    name: title,
    headline: title,
    description: entry.data.summary,
    url,
    datePublished: entry.data.created.toISOString(),
    dateModified: dateModified.toISOString(),
    inLanguage: "en",
    keywords: entry.data.tags ?? [],
    author: {
      "@id": `${siteOrigin}/#person`,
      name: profile.data.name,
    },
    publisher: {
      "@id": `${siteOrigin}/#person`,
    },
    about: {
      "@type": "Event",
      name: entry.data.event,
      startDate: entry.data.created.toISOString(),
      location: entry.data.location
        ? {
            "@type": "Place",
            name: entry.data.location,
          }
        : undefined,
    },
  };

  if (entry.data.sourceUrl) {
    data.sameAs = entry.data.sourceUrl;
  }

  if (options.imageUrl) {
    data.image = toSiteUrl(options.imageUrl, siteOrigin);
  }

  return data;
}
