# westtech.dev

**something to know** — a blog about .NET, Sitecore, AI, DevOps, and modern software development by Michael West.

Built with [Astro 5](https://astro.build), [Tailwind CSS v4](https://tailwindcss.com), and hosted on [Cloudflare Pages](https://pages.cloudflare.com).

---

## Local development

**Prerequisites:** Node.js 20+

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:4321`.

> **Note:** The search page requires a production build to work. Run `npm run build` and then `npm run preview` to test it locally.

---

## Writing a new post

Run the helper script from the repo root:

```powershell
.\scripts\new-post.ps1
```

It will prompt you for:
- **Title** — used as the heading and to generate the URL slug
- **Tags** — comma-separated (e.g. `sitecore, dotnet`)
- **Description** — one sentence for SEO and post cards

It creates the `.md` file in `src/content/posts/`, a matching image folder in `public/images/posts/`, and opens the file in VS Code.

### Frontmatter reference

```yaml
---
title: "Your Post Title"
date: 2025-01-15
description: "One sentence summary shown in post cards and search results."
tags: ["sitecore", "dotnet"]
draft: false        # set to true to hide from the public site
---
```

---

## Adding screenshots

1. Take your screenshot (Win+Shift+S, Snipping Tool, ShareX, etc.)
2. The image is now on your clipboard
3. Run the helper script:

```powershell
.\scripts\paste-image.ps1
```

It will:
- Ask which post to attach the image to (defaults to the most recently modified post)
- Ask for a short description (used as the filename and alt text)
- Save the image to `public/images/posts/[post-slug]/descriptive-name.png`
- Print the Markdown embed string and copy it to your clipboard

Then just paste into your post:

```markdown
![blob table before cleanup](/images/posts/clean-orphaned-blob-records/blob-table-before-cleanup.png)
```

---

## Tags

Tags are defined in post frontmatter — no separate config needed. New tags appear automatically on the `/tags` page. Keep them lowercase with hyphens (e.g. `sitecore-cli`, `dotnet`, `docker`).

---

## Deploying to Cloudflare Pages

### First-time setup

1. Push this repo to GitHub
2. Log in to [Cloudflare Pages](https://pages.cloudflare.com)
3. Click **Create a project** → **Connect to Git** → select this repo
4. Set the build settings:

   | Setting | Value |
   |---|---|
   | Framework preset | None |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Node.js version | `20` |

5. Click **Save and Deploy**

After the first deploy, every push to `main` triggers an automatic redeploy.

### Custom domain

In the Cloudflare Pages dashboard → your project → **Custom domains** → add `westtech.dev`. Cloudflare handles the DNS automatically if your domain is already on Cloudflare.

### Analytics

The site includes the Cloudflare Web Analytics beacon. To activate it:

1. Go to **Cloudflare Dashboard** → **Web Analytics** → **Add a site**
2. Copy your token
3. Open `src/layouts/BaseLayout.astro` and replace `REPLACE_WITH_YOUR_CF_TOKEN` with your token

---

## Project structure

```
src/
  content/posts/      <- Markdown blog posts
  layouts/            <- BaseLayout, PostLayout
  components/         <- Header, Footer, PostCard, TagPill, ThemeToggle
  pages/              <- index, [slug], tags/, search, rss.xml, 404
  styles/global.css   <- Tailwind v4 import + base styles
public/
  images/posts/       <- per-post image folders
  favicon.svg
scripts/
  new-post.ps1        <- create a new post
  paste-image.ps1     <- paste clipboard image into a post
```

---

## Build and preview

```bash
npm run build     # builds to /dist, then runs Pagefind indexer
npm run preview   # serves /dist locally at http://localhost:4321
```
