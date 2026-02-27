# Blogspot Migration Plan — westtech.dev

**Source:** michaellwest.blogspot.com
**Destination:** westtech.dev (Astro 5, Cloudflare Pages)
**Total posts to migrate:** ~88 (Feb 2012 – present)
**Already migrated:** 6 Blogspot posts (dates need verification) + 1 native post
**Status:** Planning — XML export ready, awaiting code phase

### Resolved Decisions

| Decision | Choice |
|---|---|
| Gist embeds | Copy content inline as fenced code blocks + link to original Gist below |
| Slug collisions | Flag for Michael to decide — never auto-resolve |
| Image storage path | Follow current structure: `public/images/posts/[slug]/` |
| Image source | Local Takeout `Albums/` folder first (filename match), CDN fallback |
| Label → tag mapping | Normalize during import (lowercase, hyphenate, drop obsolete) |
| `clean-orphaned-blob-records` | Originally on Blogspot — `created` date of 2025-05-10 confirmed correct (matches feed.atom) |
| Native posts | Only `precision-scheduler-v1-1-0` (2026-02-25) is native to westtech.dev |

---

## Goals

- Bring all 88 Blogspot posts into the Astro content collection as Markdown
- Retain original publish dates
- Download and locally host all embedded images
- Preserve code snippets and Gist embeds
- Add a small "migrated from Blogspot" notice on each imported post
- Support Sitecore MVP recognition by maximizing indexed content volume
- Enable a better authoring experience going forward (local WYSIWYG, no SaaS CMS)
- Leave Blogspot live with a redirect banner pointing to westtech.dev

---

## Decision: Migrate All 88 Posts

Bring everything over. Rationale:

- Sitecore MVP recognition is partly volume and quality based — leaving content on Blogspot dilutes credit
- Traffic started picking up from 2013, but pre-2012 posts may still rank for niche searches
- Script-based migration makes the cost of "migrate all" nearly identical to "migrate some"
- Posts can be suppressed with `draft: true` individually after import if needed
- The nuance is by topic, not by date — that's a post-import curation decision

---

## Branch Strategy

### Migration Branch (Bulk Import)

All automated migration work happens on a single long-lived branch:

```
feat/blogspot-migration
```

This branch contains:
- Schema changes to `content.config.ts`
- The migration script at `scripts/migrate-blogspot.mjs`
- All 88 generated Markdown files
- All downloaded images
- The `_redirects` file for Cloudflare Pages
- PostLayout changes for the migrated-from notice

Merged to `main` via PR once the full import is reviewed.

### Per-Post Branches (Individual Editing)

Any post that needs significant manual cleanup, rewriting, or image replacement after the bulk import gets its own branch:

```
post/[slug]
```

Examples:
- `post/clean-orphaned-blob-records`
- `post/spe-beginners-guide`

This applies to:
- Any migrated post that needs manual formatting repair
- All future new posts going forward

**Convention going forward:** every new post starts on `post/[slug]`, gets a PR, merges to `main`, triggers Cloudflare Pages deploy automatically.

### Branch Naming Quick Reference

| Type | Pattern | Example |
|---|---|---|
| Bulk migration | `feat/blogspot-migration` | one-time |
| Post edit/cleanup | `post/[slug]` | `post/unicorn-sitecore-cli` |
| New native post | `post/[slug]` | `post/ai-assisted-sitecore-debugging` |
| Site feature | `feat/[description]` | `feat/obsidian-authoring-setup` |

---

## Phases & Checklist

### Phase 0 — Prerequisites (Michael's action required)

- [x] **Resolved all design decisions** — see table above
- [x] **`.gitignore` updated** — `scripts/blog-export.xml` and `scripts/redirects-map.json` are excluded
- [x] **Takeout located and confirmed** — feed is at:
      `C:\Projects\github\westtech-dev\takeout-20260227T041842Z-3-001\Takeout\Blogger\Blogs\something to know\feed.atom`
      - 88 posts confirmed (87 LIVE, 1 DRAFT)
      - 43 Gist embeds across the feed
      - 127 images referenced from Blogspot CDN
      - Local image files available in `Takeout/Blogger/Albums/something to know/` (~147 files)
      - Blog title on Blogspot: "something to know"
- [x] **`scripts/list-posts.ps1`** — utility script to list all posts from feed.atom (PowerShell)
- [ ] **Copy feed to project**: Copy `feed.atom` to `scripts/blog-export.xml`
      *(or update script to reference Takeout path directly — TBD)*
- [ ] **Create migration branch**: `git checkout -b feat/blogspot-migration`

### Phase 1 — Schema Update

- [ ] Add `source` field (optional URL string) to `src/content.config.ts`
- [ ] Add `migrated` boolean field (optional) to schema for filtering/display

Updated schema will be:
```yaml
title: string
created: date
updated: date (optional)
description: string
tags: string[]
draft: boolean (default: false)
source: url string (optional) ← NEW — original Blogspot URL
migrated: boolean (optional)  ← NEW — flag for display logic
```

### Phase 2 — Migration Script

File: `scripts/migrate-blogspot.mjs`

**Input:** `scripts/blog-export.xml`
**Outputs:**
- `src/content/posts/[slug].md` — one file per post
- `public/images/posts/[slug]/[filename]` — downloaded images
- `scripts/redirects-map.json` — old Blogspot URL → new westtech.dev path

**Script behavior:**
- Parses Blogspot XML entry by entry
- Converts HTML content to Markdown using `turndown`
- Generates slug from post title (lowercase, hyphens, no special chars)
- **Image resolution (local-first):** extracts the filename from the end of each CDN URL (e.g. `.../s1600/SNAG-0137.png` → `SNAG-0137.png`), checks for a match in `Takeout/Blogger/Albums/something to know/`, copies it to `public/images/posts/[slug]/` if found; falls back to CDN download only if no local match exists — no unnecessary network calls
- Rewrites image src attributes to local paths in generated Markdown
- **Gist handling:** fetches raw Gist content and embeds as a fenced code block, then appends a `[View on GitHub Gist](https://gist.github.com/...)` link below — inline for self-contained content, linked for future edits
- **Tag normalization:** maps Blogspot labels to lowercase hyphenated tags, drops labels that are clearly obsolete (e.g., product version numbers used as labels)
- Populates frontmatter: title, created (original date), updated (if different), description (first sentence, stripped of HTML), tags (normalized from labels), draft: false, source: original URL, migrated: true
- **Collision detection:** if a `.md` already exists for a slug, skip and write to `scripts/collision-log.txt` for Michael to review — never auto-resolve
- Generates `scripts/redirects-map.json` for redirect file creation (gitignored)

**npm packages needed (no code yet):**
- `fast-xml-parser` — parse Blogspot XML
- `turndown` — HTML to Markdown conversion
- `slugify` — URL-safe slug generation
- Native `fetch` (Node 18+) — image downloads, no extra package needed

### Phase 3 — PostLayout: Migrated-From Notice

File: `src/layouts/PostLayout.astro`

When `migrated: true` (or `source` is present), render a small notice above post body:

```
Originally published on Blogspot — michaellwest.blogspot.com
```

- Plain text with a link to the `source` URL
- Small, tasteful — not a warning box, not prominent
- Does not appear on native westtech.dev posts

### Phase 4 — Verify Existing 7 Posts

- [ ] Audit each of the 7 existing posts against Blogspot to confirm `created` date matches original publish date
- [ ] Add `source:` frontmatter to the 6 Blogspot-migrated posts pointing to their original URLs
- [ ] Add `migrated: true` to those same 6 posts
- [ ] Leave `precision-scheduler-v1-1-0.md` as-is (native post, no source)

Posts to audit:

| Slug | Current `created` | Action Needed |
|---|---|---|
| clean-orphaned-blob-records | 2025-05-10 ✅ | Date confirmed correct. Add source URL only. |
| hotfix-wiped-out-my-roles | 2022-11-29 | Add source URL, confirm date |
| replacement-task-scheduler-for-sitecore | 2022-08-27 | Add source URL, confirm date |
| sxa-search-endpoint-validation | 2023-07-05 | Add source URL, confirm date |
| troubleshoot-certificate-revocation-lookups | 2023-01-31 | Add source URL, confirm date |
| working-with-unicorn-and-sitecore-cli | 2023-01-16 | Add source URL, confirm date |
| precision-scheduler-v1-1-0 | 2026-02-25 | No action — native westtech.dev post |

Note: The script will find and update all 6 existing Blogspot posts automatically during Phase 2 using collision detection. It will add `source:` and `migrated: true` to existing files without overwriting content. All 6 current dates have been cross-referenced against feed.atom and are confirmed correct.

### Phase 5 — Redirects

**Approach A — Cloudflare Pages `_redirects` file**

Generated from `scripts/redirects-map.json`. Format:
```
/2022/08/replacement-task-scheduler.html  /posts/replacement-task-scheduler-for-sitecore  301
```

Cloudflare Pages processes this file automatically. No code changes needed in Astro.

**Approach B — Blogspot template redirect banner**

Edit the Blogspot HTML template once to inject a notice at the top of every post:
```
This post has moved to westtech.dev — read the updated version there.
```

One template edit covers all 88 posts. Blogspot supports custom HTML in the template editor.

**Note on Blogspot's built-in custom redirects:** Limited to ~20 entries — not usable for 88 posts.

### Phase 6 — Post-Import Curation (ongoing)

- [ ] Run script, review generated Markdown files
- [ ] Spot-check 5–10 random posts for formatting quality
- [ ] Identify any posts with complex HTML tables or deeply nested formatting that `turndown` mangled
- [ ] Create `post/[slug]` branches for posts needing manual repair
- [ ] Set `draft: true` on any post you want suppressed temporarily

### Phase 7 — Authoring Experience (Obsidian Setup)

*Separate from migration — can happen before or after.*

Obsidian (free, local, not SaaS) configured as the primary authoring tool:

- Point vault at `c:\Projects\github\michaellwest\westtech.dev`
- Set default attachment folder to `public/images/posts/`
- Enable **Live Preview** mode (WYSIWYG — renders Markdown in real time)
- Disable Wikilinks: Settings → Files & Links → Use \[\[Wikilinks\]\] → off
- Drag and drop images into editor → saves to correct folder → Markdown embed auto-inserted
- Link creation: `[[` autocomplete works for internal links, standard Markdown for external

The existing `scripts/new-post.ps1` and `scripts/paste-image.ps1` remain useful for terminal-based workflows; Obsidian complements rather than replaces them.

---

## Steps That Require Michael's Action

| # | What | Status | Why |
|---|---|---|---|
| 1 | Provide Blogspot XML | ✅ Done — Takeout zip provided | Script input |
| 2 | Slug collision policy | ✅ Resolved — flag for review | Prevents silent data loss |
| 3 | Gist handling | ✅ Resolved — inline + link | Content fidelity |
| 4 | Image path convention | ✅ Resolved — `public/images/posts/[slug]/` | Consistent with existing structure |
| 5 | Label normalization | ✅ Resolved — normalize during import | Clean taxonomy |
| 6 | Create migration branch | ⏳ Pending | `git checkout -b feat/blogspot-migration` |
| 7 | Review post-import spot check | ⏳ Pending | Claude generates, Michael confirms quality |
| 8 | Edit Blogspot template | ⏳ Pending | Requires Blogspot admin access — one-time edit |
| 9 | MVP profile URL update | ⏳ Post-migration | Update Sitecore MVP submission with westtech.dev |

---

## Steps Claude Can Power Through Autonomously

Once Michael provides the XML export and answers the blockers above:

1. Write `scripts/migrate-blogspot.mjs`
2. Update `src/content.config.ts` schema
3. Run script and generate all 88 Markdown files + downloaded images
4. Add migrated-from notice to `PostLayout.astro`
5. Audit and update frontmatter on the 6 existing Blogspot posts
6. Generate `public/_redirects` from the redirect map
7. Open PRs for review

---

---

## Post-Migration Notes

### Sitecore MVP

Once migration is complete:
- All 88 posts will be indexed on westtech.dev with original dates preserved
- `sitemap-index.xml` (via `@astrojs/sitemap`) will submit all posts to Google
- Update your Sitecore MVP profile/annual submission to point to westtech.dev
- Consider a brief new post announcing the blog's new home — links from community members will build domain authority faster

### Content Expansion

You mentioned wanting to write more about AI-assisted work. Suggested future tags:
- `ai`, `llm`, `copilot`, `automation`

These can be added alongside existing tags with no schema changes.
