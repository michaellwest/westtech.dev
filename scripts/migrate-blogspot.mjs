#!/usr/bin/env node
/**
 * scripts/migrate-blogspot.mjs
 *
 * Migrates a Blogspot Atom export to Astro Markdown posts.
 *
 * Usage:
 *   node scripts/migrate-blogspot.mjs [options]
 *
 * Options:
 *   --feed <path>    Path to feed.atom or blog-export.xml
 *                    Default: scripts/blog-export.xml
 *   --albums <path>  Path to local Blogger Albums folder
 *                    Default: hardcoded Takeout path
 *   --dry-run        Parse and log without writing any files
 */

import { XMLParser } from 'fast-xml-parser';
import TurndownService from 'turndown';
import slugify from 'slugify';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// ── CLI args ──────────────────────────────────────────────────────────────────

function getArg(name) {
  const idx = process.argv.indexOf(name);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const DRY_RUN = process.argv.includes('--dry-run');

// ── Paths ─────────────────────────────────────────────────────────────────────

const FEED_PATH =
  getArg('--feed') ?? path.join(__dirname, 'blog-export.xml');

const ALBUMS_PATH =
  getArg('--albums') ??
  'C:/Projects/github/westtech-dev/takeout-20260227T041842Z-3-001/Takeout/Blogger/Albums/something to know';

const POSTS_DIR   = path.join(projectRoot, 'src/content/posts');
const IMAGES_DIR  = path.join(projectRoot, 'public/images/posts');
const COLLISION_LOG = path.join(__dirname, 'collision-log.txt');
const REDIRECTS_MAP = path.join(__dirname, 'redirects-map.json');

// Blog base URL (used to build source: frontmatter field)
const BLOG_BASE_URL = 'https://michaellwest.blogspot.com';

// ── Tag normalisation ─────────────────────────────────────────────────────────

// Explicit overrides: Blogspot label text → westtech.dev tag
const TAG_OVERRIDES = {
  'active directory': 'active-directory',
  'active-directory': 'active-directory',
};

function normalizeTag(label) {
  const lower = label.toLowerCase().trim();
  if (TAG_OVERRIDES[lower]) return TAG_OVERRIDES[lower];
  // lowercase, spaces/underscores → hyphens, strip anything else
  return lower.replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// ── Slug generation ───────────────────────────────────────────────────────────

function makeSlug(title) {
  return slugify(title, { lower: true, strict: true });
}

// ── HTML entity decode (for title strings) ────────────────────────────────────

function decodeEntities(str) {
  if (typeof str !== 'string') return String(str ?? '');
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

// ── Description extraction ────────────────────────────────────────────────────

function extractDescription(html) {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // First sentence between 20–160 chars
  const m = text.match(/^(.{20,160}?[.!?])(?:\s|$)/);
  if (m) return m[1].trim();
  return text.slice(0, 160).trim();
}

// ── Albums index ──────────────────────────────────────────────────────────────

function buildAlbumsIndex(albumsPath) {
  /** Maps filename (and lowercase filename) → absolute local path */
  const index = new Map();
  if (!fs.existsSync(albumsPath)) {
    console.warn(`⚠  Albums folder not found: ${albumsPath}`);
    return index;
  }
  for (const file of fs.readdirSync(albumsPath)) {
    if (file.endsWith('.json')) continue;
    const full = path.join(albumsPath, file);
    index.set(file, full);
    index.set(file.toLowerCase(), full); // case-insensitive lookup
  }
  return index;
}

// ── Image processing ──────────────────────────────────────────────────────────

function extractFilenameFromUrl(rawUrl) {
  try {
    return path.basename(new URL(rawUrl).pathname);
  } catch {
    return path.basename(rawUrl.split('?')[0]);
  }
}

async function processImages(html, slug, albumsIndex) {
  // Match Blogspot CDN image src values (single or double quotes)
  const IMG_RE =
    /(<img\s[^>]*?\bsrc=)(["'])(https?:\/\/blogger\.googleusercontent\.com[^"']+)\2/gi;

  const resolved = new Map(); // cdnUrl → localPath (avoid duplicate work)
  let result = html;

  for (const match of [...html.matchAll(IMG_RE)]) {
    const cdnUrl = match[3];
    if (resolved.has(cdnUrl)) continue;

    const filename = extractFilenameFromUrl(cdnUrl);
    const localWebPath = `/images/posts/${slug}/${filename}`;
    const destDir  = path.join(IMAGES_DIR, slug);
    const destFile = path.join(destDir, filename);

    const localSrc =
      albumsIndex.get(filename) ?? albumsIndex.get(filename.toLowerCase());

    if (localSrc) {
      if (!DRY_RUN) {
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        if (!fs.existsSync(destFile)) fs.copyFileSync(localSrc, destFile);
      }
      resolved.set(cdnUrl, localWebPath);
    } else {
      // CDN fallback
      try {
        const res = await fetch(cdnUrl);
        if (res.ok) {
          if (!DRY_RUN) {
            if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
            fs.writeFileSync(destFile, Buffer.from(await res.arrayBuffer()));
          }
          resolved.set(cdnUrl, localWebPath);
        } else {
          console.warn(`  ⚠ CDN ${res.status} for ${filename}`);
          resolved.set(cdnUrl, cdnUrl); // keep original on failure
        }
      } catch (e) {
        console.warn(`  ⚠ Download failed for ${filename}: ${e.message}`);
        resolved.set(cdnUrl, cdnUrl);
      }
    }
  }

  // Rewrite all CDN URLs in the HTML
  for (const [cdnUrl, localPath] of resolved) {
    // Use split/join to avoid regex special-char issues in the URL
    result = result.split(cdnUrl).join(localPath);
  }

  return result;
}

// ── Gist processing ───────────────────────────────────────────────────────────

const EXT_TO_LANG = {
  ps1: 'powershell', psm1: 'powershell', psd1: 'powershell',
  cs:  'csharp',     csx:  'csharp',
  sql: 'sql',
  js:  'javascript', ts: 'typescript',
  html: 'html',      xml: 'xml',
  json: 'json',
  yml: 'yaml',       yaml: 'yaml',
  sh:  'bash',       bat: 'batch',
  md:  'markdown',   txt: '',
};

const gistCache = new Map();

async function fetchGistBlocks(gistId, username) {
  if (gistCache.has(gistId)) return gistCache.get(gistId);

  const apiUrl = `https://api.github.com/gists/${gistId}`;
  try {
    const res = await fetch(apiUrl, {
      headers: { 'User-Agent': 'westtech-dev-migration/1.0' },
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const data = await res.json();

    const blocks = Object.values(data.files).map((file) => {
      const ext  = path.extname(file.filename).slice(1).toLowerCase();
      const lang = EXT_TO_LANG[ext] ?? ext ?? '';
      return `\`\`\`${lang}\n${file.content}\n\`\`\``;
    });
    // Append "View on GitHub Gist" link after the last block
    blocks.push(
      `[View on GitHub Gist](https://gist.github.com/${username}/${gistId})`
    );

    const result = blocks.join('\n\n');
    gistCache.set(gistId, result);
    return result;
  } catch (e) {
    console.warn(`  ⚠ Gist fetch failed (${gistId}): ${e.message}`);
    const fallback = `[View on GitHub Gist](https://gist.github.com/${username}/${gistId})`;
    gistCache.set(gistId, fallback);
    return fallback;
  }
}

// Replace <script src="...gist...js"> with GIST_PLACEHOLDER_n before Turndown.
// Returns { html, placeholders: Map<placeholder, markdownBlock> }
async function processGists(html) {
  const GIST_RE =
    /<script\s+src="https:\/\/gist\.github\.com\/([^/]+)\/([A-Za-z0-9]+)\.js"[^>]*(?:\/>|>\s*<\/script>)/gi;

  const placeholders = new Map();
  let counter = 0;
  let result = html;

  // Collect all unique matches first (the regex is stateful)
  const matches = [...html.matchAll(GIST_RE)];

  for (const match of matches) {
    const [fullMatch, username, gistId] = match;
    const key = `GISTPLACEHOLDER${counter++}`;
    const mdBlock = await fetchGistBlocks(gistId, username);
    placeholders.set(key, mdBlock);
    // Wrap in a <p> so Turndown keeps it as a paragraph-level text node
    result = result.split(fullMatch).join(`<p>${key}</p>`);
  }

  return { html: result, placeholders };
}

// After Turndown, swap placeholder tokens back in
function resolveGistPlaceholders(markdown, placeholders) {
  let result = markdown;
  for (const [key, block] of placeholders) {
    result = result.split(key).join(block);
  }
  return result;
}

// ── HTML pre-processing ───────────────────────────────────────────────────────

function preProcessHtml(html) {
  // 1. Unwrap Blogspot image anchor wrappers — keep just the <img>
  html = html.replace(
    /<a\s[^>]*href="https?:\/\/blogger\.googleusercontent\.com[^"]*"[^>]*>(\s*<img\s[^>]*?\/?>)\s*<\/a>/gi,
    '$1'
  );

  // 2. Convert brush-syntax code blocks to language-tagged <pre><code>
  html = html.replace(
    /<pre\s+class="brush:(\w+)">([\s\S]*?)<\/pre>/gi,
    (_, lang, code) => `<pre><code class="language-${lang}">${code}</code></pre>`
  );

  // 3. Replace &nbsp; (not a standard XML entity, may survive XML parsing)
  html = html.replace(/&nbsp;/g, ' ');

  // 4. Collapse runs of 3+ <br> to a paragraph break
  html = html.replace(/(<br\s*\/?>\s*){3,}/gi, '</p><p>');

  return html;
}

// ── Turndown setup ────────────────────────────────────────────────────────────

function createTurndown() {
  const td = new TurndownService({
    headingStyle:   'atx',
    codeBlockStyle: 'fenced',
    fence:          '```',
    bulletListMarker: '-',
  });

  // Strip elements that produce noise
  td.remove(['script', 'style']);

  return td;
}

// ── Markdown post-processing ──────────────────────────────────────────────────

function postProcessMarkdown(md) {
  return md
    .replace(/\n{3,}/g, '\n\n') // collapse excessive blank lines
    .trim();
}

// ── Frontmatter builder ───────────────────────────────────────────────────────

function escapeFmStr(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function buildFrontmatter(fields) {
  const lines = ['---'];
  for (const [key, val] of Object.entries(fields)) {
    if (val === undefined || val === null) continue;
    if (typeof val === 'boolean') {
      lines.push(`${key}: ${val}`);
    } else if (Array.isArray(val)) {
      lines.push(`${key}: [${val.map((v) => JSON.stringify(v)).join(', ')}]`);
    } else {
      lines.push(`${key}: "${escapeFmStr(String(val))}"`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

// ── Collision handler — patch existing post in place ──────────────────────────

function patchExistingPost(filePath, sourceUrl) {
  const content = fs.readFileSync(filePath, 'utf-8');

  const hasSource   = /^source:/m.test(content);
  const hasMigrated = /^migrated:/m.test(content);
  if (hasSource && hasMigrated) return false; // nothing to do

  // Find the closing --- of the frontmatter
  const firstDash = content.indexOf('---');
  const closeDash = content.indexOf('---', firstDash + 3);
  if (firstDash === -1 || closeDash === -1) return false;

  const before = content.slice(0, closeDash); // up to (not including) closing ---
  const after  = content.slice(closeDash);    // starts with ---

  let patch = before;
  if (!hasSource)   patch += `source: "${escapeFmStr(sourceUrl)}"\n`;
  if (!hasMigrated) patch += `migrated: true\n`;

  if (!DRY_RUN) fs.writeFileSync(filePath, patch + after, 'utf-8');
  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('─'.repeat(60));
  console.log('westtech.dev — Blogspot migration');
  console.log('─'.repeat(60));
  console.log(`Feed    : ${FEED_PATH}`);
  console.log(`Albums  : ${ALBUMS_PATH}`);
  console.log(`Posts   : ${POSTS_DIR}`);
  console.log(`Images  : ${IMAGES_DIR}`);
  if (DRY_RUN) console.log('MODE    : DRY RUN — no files written');
  console.log('');

  // Validate feed
  if (!fs.existsSync(FEED_PATH)) {
    console.error(`Feed not found: ${FEED_PATH}`);
    console.error(
      'Copy feed.atom to scripts/blog-export.xml or use --feed <path>'
    );
    process.exit(1);
  }

  // Build albums index
  const albumsIndex = buildAlbumsIndex(ALBUMS_PATH);
  console.log(`Albums index: ${Math.floor(albumsIndex.size / 2)} files\n`);

  // Parse XML feed
  const rawXml = fs.readFileSync(FEED_PATH, 'utf-8');
  // Pre-sanitise: &nbsp; is not a legal XML entity
  const xml = rawXml.replace(/&nbsp;/g, '&#160;');

  const parser = new XMLParser({
    ignoreAttributes:    false,
    attributeNamePrefix: '@_',
    isArray: (name) => ['entry', 'category'].includes(name),
    trimValues:          true,
    parseAttributeValue: false,
    textNodeName:        '#text',
  });

  const feed    = parser.parse(xml);
  const entries = feed?.feed?.entry ?? [];
  console.log(`Parsed ${entries.length} entries from feed\n`);

  // Turndown instance
  const td = createTurndown();

  // Tracking
  const redirectsMap = {};
  const collisionLog = [];
  const processedSlugs = new Set();
  let written = 0, patched = 0, skippedCollision = 0, skippedDuplicate = 0;

  // Clear collision log from any previous run
  if (!DRY_RUN) fs.writeFileSync(COLLISION_LOG, '', 'utf-8');

  for (const entry of entries) {
    // Only POST entries
    if (entry['blogger:type'] !== 'POST') continue;

    const status         = entry['blogger:status'] ?? 'LIVE';
    const bloggerFilename = entry['blogger:filename'] ?? '';
    const rawTitle       = entry.title;

    if (!rawTitle) {
      console.warn('Skipping entry with no title');
      continue;
    }

    const title       = decodeEntities(
      typeof rawTitle === 'string' ? rawTitle : rawTitle['#text'] ?? String(rawTitle)
    );
    const publishedRaw = entry.published ?? entry['blogger:created'];
    const updatedRaw   = entry.updated;

    if (!publishedRaw) {
      console.warn(`Skipping "${title}" — no published date`);
      continue;
    }

    const published = new Date(publishedRaw);
    const updated   = updatedRaw ? new Date(updatedRaw) : null;

    const createdStr  = published.toISOString().slice(0, 10);
    // Include updated only when it's at least 1 full day after published
    const updatedStr =
      updated &&
      updated.getTime() - published.getTime() > 86_400_000
        ? updated.toISOString().slice(0, 10)
        : undefined;

    // Tags from <category> elements
    const categories = Array.isArray(entry.category) ? entry.category : [];
    const tags = [
      ...new Set(
        categories
          .map((c) => c['@_term'])
          .filter(Boolean)
          .map(normalizeTag)
          .filter((t) => t.length > 0)
      ),
    ];

    const slug      = makeSlug(title);
    const sourceUrl = `${BLOG_BASE_URL}${bloggerFilename}`;
    const isDraft   = status === 'DRAFT';

    // ── Collision: slug already processed in this run (two feed entries clash) ──
    if (processedSlugs.has(slug)) {
      const msg = `DUPLICATE_FEED_SLUG: "${slug}" (${title})`;
      collisionLog.push(msg);
      console.log(`  ⚠  ${msg}`);
      skippedDuplicate++;
      continue;
    }

    const outputPath = path.join(POSTS_DIR, `${slug}.md`);

    // ── Collision: file already exists on disk ────────────────────────────────
    if (fs.existsSync(outputPath)) {
      const msg = `COLLISION: ${slug}  ←  ${bloggerFilename}`;
      collisionLog.push(msg);
      console.log(`  📌  ${msg}`);

      const wasPatched = patchExistingPost(outputPath, sourceUrl);
      if (wasPatched) {
        console.log(`      Patched: ${slug}.md (added source + migrated)`);
        patched++;
      }

      if (bloggerFilename) redirectsMap[bloggerFilename] = `/posts/${slug}`;
      processedSlugs.add(slug);
      skippedCollision++;
      continue;
    }

    // ── Process this entry ────────────────────────────────────────────────────
    process.stdout.write(`  → ${slug}`);

    // Raw HTML content
    let html = '';
    if (entry.content) {
      html =
        typeof entry.content === 'string'
          ? entry.content
          : (entry.content['#text'] ?? '');
    }

    // Pre-process HTML
    html = preProcessHtml(html);

    // Process images (copy local / download CDN)
    html = await processImages(html, slug, albumsIndex);

    // Process Gist embeds — extract and replace with placeholders
    const { html: htmlNoGists, placeholders } = await processGists(html);

    // Convert HTML → Markdown
    let markdown;
    try {
      markdown = td.turndown(htmlNoGists);
    } catch (e) {
      console.warn(`\n  ⚠ Turndown error for "${slug}": ${e.message}`);
      markdown = htmlNoGists; // keep raw HTML as fallback
    }

    // Restore Gist code blocks
    markdown = resolveGistPlaceholders(markdown, placeholders);
    markdown = postProcessMarkdown(markdown);

    // Description
    const metaDesc = entry['blogger:metaDescription'];
    const description =
      typeof metaDesc === 'string' && metaDesc.trim()
        ? metaDesc.trim()
        : extractDescription(html);

    // Frontmatter
    const fm = buildFrontmatter({
      title,
      created:   createdStr,
      ...(updatedStr ? { updated: updatedStr } : {}),
      description,
      tags,
      ...(isDraft ? { draft: true } : {}),
      source:    sourceUrl,
      migrated:  true,
    });

    const fileContent = `${fm}\n\n${markdown}\n`;

    if (!DRY_RUN) {
      fs.writeFileSync(outputPath, fileContent, 'utf-8');
    }

    if (bloggerFilename) redirectsMap[bloggerFilename] = `/posts/${slug}`;
    processedSlugs.add(slug);
    written++;

    process.stdout.write('\n');
  }

  // ── Write outputs ─────────────────────────────────────────────────────────
  if (!DRY_RUN) {
    if (collisionLog.length > 0) {
      fs.writeFileSync(COLLISION_LOG, collisionLog.join('\n') + '\n', 'utf-8');
    }
    fs.writeFileSync(REDIRECTS_MAP, JSON.stringify(redirectsMap, null, 2), 'utf-8');
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('');
  console.log('─'.repeat(60));
  console.log(`Written          : ${written}`);
  console.log(`Patched (exist)  : ${patched}`);
  console.log(`Skipped (collis) : ${skippedCollision}`);
  console.log(`Skipped (dup)    : ${skippedDuplicate}`);
  console.log(`Redirects        : ${Object.keys(redirectsMap).length}`);
  if (collisionLog.length > 0) {
    console.log(`Collision log    : ${COLLISION_LOG}`);
    collisionLog.forEach((l) => console.log(`  ${l}`));
  }
  console.log('─'.repeat(60));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
