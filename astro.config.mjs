// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://maheshpalavalli.com",
  trailingSlash: "always",
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  integrations: [
    sitemap({
      filter: (page) =>
        ![
          "https://maheshpalavalli.com/blog/archive/",
          "https://maheshpalavalli.com/blog/generate-ui-in-erp-kind-of-fixed-not-fixed/",
          "https://maheshpalavalli.com/blog/2026-03-25-agentic-ai-sap-inside-track-bengaluru/",
        ].includes(page),
    }),
  ],
  markdown: {
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      wrap: true,
    },
  },

  vite: {
    optimizeDeps: {
      exclude: ["@chenglou/pretext"],
    },
    plugins: [tailwindcss()],
  },
});
