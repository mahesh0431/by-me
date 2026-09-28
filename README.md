# by-me

Personal website and blog built with Astro, deployed on GitHub Pages with a custom domain.

## Tech Stack

- Astro 5
- Tailwind CSS v4 + CSS tokens
- Astro Content Collections (Markdown posts)
- Prettier
- GitHub Actions + GitHub Pages

## Prerequisites

- Node.js 24.x
- npm 11.x

## Local Development

```bash
npm install
npm run dev
```

Dev URL (default): `http://127.0.0.1:4321/`

## Scripts

- `npm run dev` - start development server
- `npm run build` - build static site
- `npm run preview` - preview built output
- `npm run check` - run Astro type/content checks
- `npm run format` - apply Prettier formatting
- `npm run format:check` - verify formatting

## Main Routes

- `/` - Home
- `/about/` - About
- `/blog/` - Blog index
- `/blog/archive/` - Year archive
- `/blog/[slug]/` - Blog post page
- `/speaking/` - Talks, workshops, and sessions
- `/rss.xml` - RSS feed

## Adding Content and Images

Images go through Astro's image pipeline so they are resized, converted to WebP, and served
with `srcset` automatically. Keep images out of `public/` unless they must stay byte-for-byte
(favicons, `CNAME`, verification files, videos).

- **Post or talk images:** put the file next to the entry's `index.md` (for example
  `src/content/blog/my-post/header.png` or `src/content/speaking/my-talk/images/photo-1.jpg`).
  - Header image: set `heroImage: ./header.png` in frontmatter. It is used on the page, in
    social cards (a ~1200px JPEG), and in structured data.
  - Inline images: use relative Markdown, `![Describe the image](./images/photo-1.jpg)`.
    Always write real alt text.
- **Images used by pages/components:** put them in `src/assets/images/` and render with
  `<Image />` from `astro:assets`, passing `widths` and `sizes` for responsive output.
- **Videos:** keep them in `public/` and embed with `preload="metadata"` so they only
  download when played.

Every page gets title, description, canonical, Open Graph/X tags, and JSON-LD from
`BaseLayout`; new posts only need a good `title`, `summary`, and optional `heroImage`.

## Deployment

Deployment is configured in `.github/workflows/deploy.yml`.

Astro deployment config (`astro.config.mjs`):

- `site: "https://maheshpalavalli.com"`
- `trailingSlash: "always"`

GitHub Pages should be configured to use **GitHub Actions** as source.

## License

- **Code** (layouts, components, styles, scripts, and config) is licensed under the
  [MIT License](LICENSE). Feel free to reuse it for your own site.
- **Content** is not covered by the MIT License. All writing, talk write-ups, photos, and
  other media (everything under `src/content/`, `src/assets/`, and the images, videos, and
  sprites in `public/`) is © Mahesh Palavalli, all rights reserved. Please don't republish
  it without permission; linking to it is always welcome.
