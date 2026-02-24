# westtech.dev — Build Plan

**Tagline:** something to know
**Purpose:** Modern software development blog focused on .NET, Sitecore, AI, DevOps, Docker
**Hosting:** Cloudflare Pages (deployed from GitHub)
**Author:** Michael West

---

## Tech Stack

| Concern            | Choice                          | Notes                                              |
| ------------------ | ------------------------------- | -------------------------------------------------- |
| Framework          | Astro 5 (static)                | Best for Markdown blogs, Cloudflare Pages native   |
| Styling            | Tailwind CSS v4                 | CSS-import only, no config file needed             |
| Syntax highlighting| Shiki (built into Astro)        | github-dark theme, zero runtime cost               |
| Search             | Pagefind                        | Post-build static index, no backend                |
| RSS + Sitemap      | @astrojs/rss + @astrojs/sitemap | Official integrations                              |
| Analytics          | Cloudflare Web Analytics        | Single script tag, no npm package                  |
| Local tooling      | PowerShell scripts              | Windows-native, no extra dependencies              |
| Hosting            | Cloudflare Pages                | Auto-deploy from GitHub push                       |

---

## Design

- **Palette:** Zinc/slate neutrals + blue-600 (#2563eb) accent
- **Typography:** System font stack (body) + monospace stack (code)
- **Modes:** Light/dark toggle, respects OS preference by default
- **Layout:** Single-column, typography-focused
- **Code theme:** github-dark

---

## Project Structure

```
westtech.dev/
├── src/
│   ├── content/
│   │   └── posts/              ← .md files
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── PostLayout.astro
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── PostCard.astro
│   │   ├── TagPill.astro
│   │   └── ThemeToggle.astro
│   └── pages/
│       ├── index.astro         ← paginated post list
│       ├── [slug].astro        ← individual post
│       ├── tags/[tag].astro    ← posts by tag
│       ├── search.astro        ← Pagefind search UI
│       └── rss.xml.js
├── public/
│   ├── images/
│   │   └── posts/
│   │       └── [post-slug]/    ← per-post image folders
│   └── favicon.svg
├── scripts/
│   ├── new-post.ps1            ← create new post interactively
│   └── paste-image.ps1         ← paste clipboard screenshot
├── astro.config.mjs
├── package.json
├── PLAN.md                     ← this file
└── README.md
```

---

## Article Frontmatter

```yaml
---
title: "Post Title Here"
date: 2025-01-01
description: "One sentence summary for SEO and post cards."
tags: [sitecore, dotnet]
---
```

---

## Local Scripts

### `scripts/new-post.ps1`
- Prompts for title and tags
- Generates slug, filename, frontmatter
- Creates `src/content/posts/my-post.md`
- Creates `public/images/posts/my-post/` image folder
- Opens file in VS Code

### `scripts/paste-image.ps1`
- Reads image from Windows clipboard
- Prompts for short description
- Saves to `public/images/posts/[slug]/descriptive-name.png`
- Outputs ready-to-paste Markdown embed string

---

## Cloudflare Pages Settings

| Setting          | Value         |
| ---------------- | ------------- |
| Build command    | `npm run build` |
| Output directory | `dist`        |
| Node version     | 20            |

---

## Build Steps & Progress

| # | Step                                              | Status      |
| - | ------------------------------------------------- | ----------- |
| 1 | Document plan + initialize git tracking           | ✅ Complete |
| 2 | Scaffold Astro 5 project (Tailwind v4, sitemap, RSS) | ⬜ Pending |
| 3 | Configure content collections with Zod schema     | ⬜ Pending  |
| 4 | Build BaseLayout + PostLayout                     | ⬜ Pending  |
| 5 | Build components (Header, Footer, PostCard, TagPill, ThemeToggle) | ⬜ Pending |
| 6 | Build pages (home, post, tag, search, RSS)        | ⬜ Pending  |
| 7 | Configure Shiki github-dark theme                 | ⬜ Pending  |
| 8 | Integrate Pagefind search                         | ⬜ Pending  |
| 9 | Add Cloudflare Web Analytics                      | ⬜ Pending  |
| 10| Write PowerShell helper scripts (new-post, paste-image) | ⬜ Pending |
| 11| Seed blog with 5 migrated posts from Blogspot     | ⬜ Pending  |
| 12| Final README with Cloudflare Pages deploy guide   | ⬜ Pending  |
