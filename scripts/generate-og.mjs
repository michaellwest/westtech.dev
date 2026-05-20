import satori from "satori";
import { initWasm, Resvg } from "@resvg/resvg-wasm";
import { readFileSync, readdirSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { join, basename } from "node:path";

const projectRoot = process.cwd();
const fontsDir = join(projectRoot, "src/assets/fonts");
const iconsDir = join(projectRoot, "src/assets/icons");
const postsDir = join(projectRoot, "src/content/posts");
const outDir = join(projectRoot, "public/og");

const interBold = readFileSync(join(fontsDir, "Inter-Bold.woff"));
const interRegular = readFileSync(join(fontsDir, "Inter-Regular.woff"));

const wasmPath = join(projectRoot, "node_modules/@resvg/resvg-wasm/index_bg.wasm");

// Per-tag color family. The primary tag drives the background gradient;
// the secondary tag drives the top accent stripe.
const TAG_COLORS = {
  sitecore:           { primary: "#7f1d1d", secondary: "#b91c1c", accent: "#dc2626" },
  powershell:         { primary: "#1e3a8a", secondary: "#1d4ed8", accent: "#3b82f6" },
  certificates:       { primary: "#064e3b", secondary: "#047857", accent: "#10b981" },
  security:           { primary: "#78350f", secondary: "#b45309", accent: "#f59e0b" },
  dotnet:             { primary: "#4c1d95", secondary: "#6d28d9", accent: "#a855f7" },
  database:           { primary: "#164e63", secondary: "#0e7490", accent: "#06b6d4" },
  hangfire:           { primary: "#7c2d12", secondary: "#c2410c", accent: "#f97316" },
  docker:             { primary: "#0c4a6e", secondary: "#0369a1", accent: "#0ea5e9" },
  authentication:     { primary: "#831843", secondary: "#9d174d", accent: "#ec4899" },
  identity:           { primary: "#831843", secondary: "#9d174d", accent: "#ec4899" },
  networking:         { primary: "#134e4a", secondary: "#0f766e", accent: "#14b8a6" },
  serialization:      { primary: "#1e293b", secondary: "#334155", accent: "#64748b" },
  unicorn:            { primary: "#881337", secondary: "#be123c", accent: "#f43f5e" },
  "sitecore-cli":     { primary: "#7f1d1d", secondary: "#b91c1c", accent: "#dc2626" },
  sxa:                { primary: "#7f1d1d", secondary: "#b91c1c", accent: "#dc2626" },
  spe:                { primary: "#7f1d1d", secondary: "#b91c1c", accent: "#dc2626" },
  bits:               { primary: "#27272a", secondary: "#3f3f46", accent: "#71717a" },
  ai:                 { primary: "#4c1d95", secondary: "#6d28d9", accent: "#8b5cf6" },
  llm:                { primary: "#4c1d95", secondary: "#6d28d9", accent: "#8b5cf6" },
  "active-directory": { primary: "#1e1b4b", secondary: "#3730a3", accent: "#6366f1" },
};
const DEFAULT_COLORS = { primary: "#27272a", secondary: "#3f3f46", accent: "#71717a" };

// Tags whose icon files are real multi-color brand logos. For these the
// watermark renders with original colors; everything else gets whitened
// so single-color silhouettes read at low opacity.
const PRESERVE_COLOR_TAGS = new Set(["powershell", "dotnet", "spe", "sitecore"]);

function colorsFor(tags) {
  for (const t of tags) {
    if (TAG_COLORS[t]) return TAG_COLORS[t];
  }
  return DEFAULT_COLORS;
}

// Stable hash of the slug for per-post gradient variation.
function hashSlug(slug) {
  let h = 5381;
  for (let i = 0; i < slug.length; i++) {
    h = ((h << 5) + h) + slug.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// Icon loader: SVG first, then PNG fallback. Returns both a whitened
// data URI (for monochrome silhouettes) and the original (for brand
// logos that should keep their colors).
const iconCache = new Map();
function getTagIcon(tags) {
  for (const tag of tags) {
    if (iconCache.has(tag)) {
      const cached = iconCache.get(tag);
      if (cached) return { tag, ...cached };
      continue;
    }
    try {
      const svg = readFileSync(join(iconsDir, `${tag}.svg`), "utf-8");
      const whitened = svg.replace(/fill="[^"]*"/g, 'fill="#ffffff"');
      const whiteUri = `data:image/svg+xml;base64,${Buffer.from(whitened).toString("base64")}`;
      const originalUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
      const entry = { whiteUri, originalUri };
      iconCache.set(tag, entry);
      return { tag, ...entry };
    } catch {}
    try {
      const png = readFileSync(join(iconsDir, `${tag}.png`));
      const dataUri = `data:image/png;base64,${png.toString("base64")}`;
      const entry = { whiteUri: dataUri, originalUri: dataUri };
      iconCache.set(tag, entry);
      return { tag, ...entry };
    } catch {}
    iconCache.set(tag, null);
  }
  return null;
}

function iconUriFor(icon) {
  if (!icon) return null;
  return PRESERVE_COLOR_TAGS.has(icon.tag) ? icon.originalUri : icon.whiteUri;
}

// Pick the watermark icon for a post. A post tagged with both `sitecore`
// and `powershell` is treated as SPE content (Sitecore PowerShell
// Extensions) and gets the combined SPE logo. Otherwise the cascade
// prefers a non-primary tag's icon (so two posts sharing the same
// primary tag get different watermarks), falling back to the primary
// tag's icon as a last resort.
function pickWatermarkIcon(post) {
  if (post.tags.includes("sitecore") && post.tags.includes("powershell")) {
    const spe = getTagIcon(["spe"]);
    if (spe) return spe;
  }
  const nonPrimary = post.tags.slice(1);
  return getTagIcon(nonPrimary) || getTagIcon([post.tags[0]]);
}

// Frontmatter parser. Only fields the OG card needs.
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const yaml = match[1];

  const get = (key) => {
    const m = yaml.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : undefined;
  };

  const tagsMatch = yaml.match(/^tags:\s*\[([^\]]*)\]/m);
  const tags = tagsMatch
    ? tagsMatch[1].split(",").map((t) => t.trim().replace(/^["']|["']$/g, "")).filter(Boolean)
    : [];

  return {
    title: get("title") || "",
    description: get("description") || "",
    tags,
    draft: get("draft") === "true",
    heroImage: get("heroImage"),
  };
}

// A3 OG card renderer.
//   - Per-primary-tag gradient (slug-hashed angle).
//   - 14px secondary-tag accent stripe at the top edge.
//   - Watermark icon in the bottom-right (cascade-selected via
//     pickWatermarkIcon; brand logos preserve color, silhouettes get
//     whitened).
async function renderOgImage(post, slug) {
  const primaryColors = colorsFor([post.tags[0]]);
  const secondaryTag = post.tags[1];
  const secondaryColor =
    secondaryTag && TAG_COLORS[secondaryTag]
      ? TAG_COLORS[secondaryTag].accent
      : null;
  const icon = pickWatermarkIcon(post);
  const angle = hashSlug(slug) % 360;
  // Per-post lighting "fingerprint" so posts that share primary + secondary
  // + watermark (e.g. several SPE posts) still feel distinct at scroll speed.
  const spotX = hashSlug(slug + "sx") % 100;
  const spotY = hashSlug(slug + "sy") % 100;
  const spotSize = 200 + (hashSlug(slug + "ss") % 200);
  const watermarkAngle = (hashSlug(slug + "wr") % 24) - 12;

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: `radial-gradient(circle ${spotSize}px at ${spotX}% ${spotY}%, rgba(255,255,255,0.12), transparent 70%), linear-gradient(${angle}deg, ${primaryColors.primary} 0%, ${primaryColors.secondary} 100%)`,
          position: "relative",
        },
        children: [
          secondaryColor
            ? {
                type: "div",
                props: {
                  style: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "14px",
                    backgroundColor: secondaryColor,
                  },
                },
              }
            : null,
          icon
            ? {
                type: "div",
                props: {
                  style: {
                    position: "absolute",
                    bottom: "-100px",
                    right: "-100px",
                    width: "560px",
                    height: "560px",
                    opacity: 0.22,
                    display: "flex",
                    transform: `rotate(${watermarkAngle}deg)`,
                  },
                  children: {
                    type: "img",
                    props: { src: iconUriFor(icon), width: 560, height: 560 },
                  },
                },
              }
            : null,
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                flex: 1,
                padding: "60px",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: "20px",
                      fontFamily: "Inter",
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.95)",
                      marginBottom: "24px",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    },
                    children: post.tags.slice(0, 4).join("  ·  "),
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: post.title.length > 60 ? "52px" : "64px",
                      fontFamily: "Inter",
                      fontWeight: 700,
                      color: "#ffffff",
                      lineHeight: 1.15,
                      letterSpacing: "-0.02em",
                      flex: 1,
                    },
                    children: post.title,
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: "auto",
                    },
                    children: [
                      {
                        type: "div",
                        props: {
                          style: {
                            fontSize: "22px",
                            fontFamily: "Inter",
                            fontWeight: 700,
                            color: "rgba(255,255,255,0.95)",
                          },
                          children: "westtech.dev",
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: {
                            fontSize: "18px",
                            fontFamily: "Inter",
                            fontWeight: 500,
                            color: "rgba(255,255,255,0.9)",
                          },
                          children: "something to know",
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ].filter(Boolean),
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Inter", data: interRegular, weight: 400, style: "normal" },
        { name: "Inter", data: interBold, weight: 700, style: "normal" },
      ],
    },
  );

  return new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
}

mkdirSync(outDir, { recursive: true });

const files = readdirSync(postsDir).filter((f) => f.endsWith(".md"));

// Cache must also invalidate when the design itself changes — otherwise
// a tweak to the script leaves all existing PNGs stale until someone
// manually clears public/og.
const scriptMtime = statSync(new URL(import.meta.url)).mtimeMs;

let generated = 0;
let skipped = 0;
let wasmReady = false;

for (const file of files) {
  const slug = basename(file, ".md");
  const content = readFileSync(join(postsDir, file), "utf-8");
  const fm = parseFrontmatter(content);
  if (!fm || fm.draft) continue;
  // Skip posts that supply a custom hero image URL (they use that as og:image).
  if (fm.heroImage && fm.heroImage !== "true" && fm.heroImage !== "false") continue;

  const outPath = join(outDir, `${slug}.png`);
  const mdPath = join(postsDir, file);

  try {
    const ogStat = statSync(outPath);
    const mdStat = statSync(mdPath);
    if (ogStat.mtimeMs >= mdStat.mtimeMs && ogStat.mtimeMs >= scriptMtime) {
      skipped++;
      continue;
    }
  } catch {
    // File doesn't exist, generate it
  }

  if (!wasmReady) {
    await initWasm(readFileSync(wasmPath));
    wasmReady = true;
  }

  const png = await renderOgImage(fm, slug);
  writeFileSync(outPath, png);
  generated++;
}

console.log(`OG images: ${generated} generated, ${skipped} up-to-date.`);
