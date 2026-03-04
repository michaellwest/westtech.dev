# CLAUDE.md — westtech.dev

This file gives AI assistants the context needed to work effectively in this repository.

## Project Overview

**westtech.dev** ("something to know") is a technical blog by Michael West, focused on .NET, Sitecore, PowerShell, AI, and DevOps. It is a static site built with Astro 5 and hosted on Cloudflare Pages.

- **Live site:** https://westtech.dev
- **Hosting:** Cloudflare Pages (auto-deploys from `main`)
- **Author:** Michael West — longtime Sitecore developer and multi-year Sitecore MVP

## Tech Stack

| Concern             | Choice                            |
| ------------------- | --------------------------------- |
| Framework           | Astro 5 (static output)          |
| Styling             | Tailwind CSS v4 (CSS-import only, no config file) |
| Syntax highlighting | Shiki `github-dark` (built into Astro) |
| Search              | Pagefind (post-build static index) |
| RSS + Sitemap       | @astrojs/rss + @astrojs/sitemap   |
| Analytics           | Cloudflare Web Analytics          |
| Adapter             | @astrojs/cloudflare               |
| Local tooling       | PowerShell scripts (Windows)      |

## Commands

```bash
npm run dev       # Dev server at http://localhost:4321
npm run build     # Production build to dist/ + Pagefind index
npm run preview   # Build then serve locally via wrangler
npm run deploy    # Build then deploy to Cloudflare Pages
```

There is **no test suite** and **no linter** configured. Verify changes by running `npm run build` and checking for build errors.

## Project Structure

```
src/
  content/
    posts/              ← Markdown blog posts (88 migrated + 1 native)
    content.config.ts   ← Zod schema for post frontmatter
  layouts/
    BaseLayout.astro    ← HTML shell, head tags, analytics
    SiteLayout.astro    ← Base + Header/Footer wrapper
    PostLayout.astro    ← Single post rendering with prose styles
  components/
    Header.astro        ← Site header with navigation
    Footer.astro        ← Site footer
    PostCard.astro      ← Post preview card for listings
    TagPill.astro       ← Tag badge component
    ThemeToggle.astro   ← Light/dark mode toggle
    Sidebar.astro       ← Sidebar with recent posts, MVP awards, etc.
    RecentPosts.astro   ← Recent posts widget
    MvpAwards.astro     ← Sitecore MVP badges
    GitHubSponsor.astro ← GitHub sponsor link
    StackExchangeFlair.astro ← Stack Exchange profile
  pages/
    index.astro         ← Home page with post list, tags, search
    [slug].astro        ← Individual post page
    404.astro           ← Not found page
    rss.xml.js          ← RSS feed
  styles/
    global.css          ← Tailwind v4 import + dark mode + accent color
public/
  images/posts/         ← Per-post image folders (e.g., images/posts/my-post/)
  favicon.svg
scripts/
  new-post.ps1          ← Create a new post interactively
  paste-image.ps1       ← Save clipboard image into a post's image folder
  list-posts.ps1        ← List all posts
```

## Content Schema

Posts live in `src/content/posts/*.md`. Frontmatter is validated by Zod in `src/content.config.ts`:

```yaml
---
title: "Post Title Here"           # required
created: 2025-01-15                # required — publish date
updated: 2025-02-01                # optional — last updated date
description: "One sentence summary" # required — used in post cards and SEO
tags: [sitecore, dotnet]           # optional, defaults to []
draft: false                       # optional, defaults to false
source: "https://..."              # optional — original Blogspot URL (migrated posts)
migrated: true                     # optional — flags post as migrated from Blogspot
---
```

**Important:** The date field is `created`, not `date`. The schema uses `z.coerce.date()` so both `2025-01-15` and `"2025-01-15"` work.

## Conventions

### File & Naming

- **Post filenames:** kebab-case matching the URL slug (e.g., `clean-orphaned-blob-records.md`)
- **Tags:** lowercase, hyphenated (e.g., `sitecore-cli`, `active-directory`)
- **Components:** PascalCase `.astro` files (e.g., `PostCard.astro`)
- **Images:** stored in `public/images/posts/[post-slug]/descriptive-name.png`
- **Image references in markdown:** absolute from site root (e.g., `/images/posts/my-post/screenshot.png`)
- **Path alias:** `@/*` maps to `src/*` (configured in `tsconfig.json`)

### Styling

- Tailwind CSS v4 uses the CSS-import approach (`@import "tailwindcss"`) — there is no `tailwind.config` file
- Dark mode uses the `class` strategy — toggle adds/removes `.dark` on `<html>`
- Custom dark variant: `@custom-variant dark (&:where(.dark, .dark *))`
- Accent color: `--color-accent: #2563eb` (blue-600)
- Prose styling for post content is handled in `PostLayout.astro`

### Writing Voice

When drafting blog posts, follow the author's voice profile in `.claude/VOICE_PROFILE.md`. Key points:
- Technical, practitioner-focused — no hand-holding on basics
- Dry, understated humor used sparingly
- Matter-of-fact tone, not excitable
- Posts follow a detective-story arc: teaser → background → research → fix → brief close
- Use "we" for team work, "I" for solo work
- Include what didn't work, not just what did
- No marketing language ("powerful", "seamless", "robust")

## Reference Documents

| File | Purpose |
| ---- | ------- |
| `.claude/VOICE_PROFILE.md` | Author's writing voice and blog post structure guide |
| `.claude/POST_INDEX.md` | Canonical index of all 89 posts with status tracking and tag taxonomy |
| `FEATURES.md` | Open feature work items |
| `PLAN.md` | Original build plan and tech decisions |
| `README.md` | Human-facing project docs with setup and deploy instructions |

## Key Gotchas

- **Search only works in production builds.** Pagefind generates its index during `npm run build`. The dev server won't have search functionality.
- **No tags or search pages.** Tags and search are on the home page (`index.astro`), not separate routes.
- **Cloudflare adapter.** The site uses `@astrojs/cloudflare`, not pure static output. Pages deploy via `wrangler`.
- **Content loader.** Posts use `glob()` loader, not the filesystem loader — defined in `src/content.config.ts` (not `src/content/config.ts`).
