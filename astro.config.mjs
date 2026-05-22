import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import rehypeMermaid from "rehype-mermaid";

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://westtech.dev",
  integrations: [sitemap()],

  server: { port: 4400 },

  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: [".ts.net"],
    },
  },

  markdown: {
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      defaultColor: false,
      wrap: true,
      excludeLangs: ["mermaid"],
    },
    rehypePlugins: [
      [
        rehypeMermaid,
        {
          strategy: "img-svg",
          mermaidConfig: {
            theme: "dark",
            themeVariables: {
              primaryColor: "#2563eb",
              primaryTextColor: "#fafafa",
              primaryBorderColor: "#3b82f6",
              lineColor: "#a1a1aa",
              secondaryColor: "#27272a",
              tertiaryColor: "#18181b",
              background: "#18181b",
              mainBkg: "#27272a",
              nodeBorder: "#3b82f6",
              clusterBkg: "#1e1e22",
              titleColor: "#fafafa",
              edgeLabelBackground: "#27272a",
            },
          },
        },
      ],
    ],
  },

  adapter: cloudflare(),
});