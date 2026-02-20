# by-me

Personal website and blog built with Astro, designed for GitHub Pages project-repo deployment.

## Tech Stack

- Astro 5
- Tailwind CSS v4 + CSS tokens
- Astro Content Collections (Markdown posts)
- Vitest (unit tests)
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

Dev URL (default): `http://127.0.0.1:4321/by-me/`

## Scripts

- `npm run dev` - start development server
- `npm run build` - build static site
- `npm run preview` - preview built output
- `npm run check` - run Astro type/content checks
- `npm test` - run unit tests
- `npm run format` - apply Prettier formatting
- `npm run format:check` - verify formatting

## Main Routes

- `/by-me/` - Home
- `/by-me/about/` - About
- `/by-me/blog/` - Blog index
- `/by-me/blog/archive/` - Year archive
- `/by-me/blog/[slug]/` - Blog post page
- `/by-me/rss.xml` - RSS feed

## Deployment

Deployment is configured in `.github/workflows/deploy.yml`.

Astro deployment config (`astro.config.mjs`):

- `site: "https://mahesh0431.github.io"`
- `base: "/by-me"`
- `trailingSlash: "always"`

GitHub Pages should be configured to use **GitHub Actions** as source.
