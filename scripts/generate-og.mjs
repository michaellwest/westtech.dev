import satori from "satori";
import { initWasm, Resvg } from "@resvg/resvg-wasm";
import { readFileSync, readdirSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { join, basename } from "node:path";

const projectRoot = process.cwd();
const fontsDir = join(projectRoot, "src/assets/fonts");
const iconsDir = join(projectRoot, "src/assets/icons");
const postsDir = join(projectRoot, "src/content/posts");
const outDir = join(projectRoot, "public/og");

// Load fonts
const interBold = readFileSync(join(fontsDir, "Inter-Bold.woff"));
const interRegular = readFileSync(join(fontsDir, "Inter-Regular.woff"));

const wasmPath = join(projectRoot, "node_modules/@resvg/resvg-wasm/index_bg.wasm");

// Tag icon helper
const iconCache = new Map();
function getTagIconUri(tag) {
  if (iconCache.has(tag)) return iconCache.get(tag);
  try {
    const svg = readFileSync(join(iconsDir, `${tag}.svg`), "utf-8");
    const uri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
    iconCache.set(tag, uri);
    return uri;
  } catch {
    return undefined;
  }
}

// Frontmatter parser
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

// OG image renderer
async function renderOgImage({ title, description, tags }) {
  const displayTags = tags.slice(0, 4);

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#18181b",
          padding: "60px",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "6px",
                backgroundColor: "#2563eb",
              },
            },
          },
          displayTags.length > 0
            ? {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginBottom: "24px",
                  },
                  children: displayTags.map((tag) => {
                    const iconUri = getTagIconUri(tag);
                    return {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          backgroundColor: "rgba(37, 99, 235, 0.15)",
                          color: "#60a5fa",
                          fontSize: "16px",
                          fontFamily: "Inter",
                          fontWeight: 400,
                          padding: "4px 12px",
                          borderRadius: "6px",
                        },
                        children: [
                          iconUri
                            ? {
                                type: "img",
                                props: { src: iconUri, width: 16, height: 16 },
                              }
                            : null,
                          tag,
                        ].filter(Boolean),
                      },
                    };
                  }),
                },
              }
            : null,
          {
            type: "div",
            props: {
              style: {
                fontSize: title.length > 60 ? "40px" : "48px",
                fontFamily: "Inter",
                fontWeight: 700,
                color: "#fafafa",
                lineHeight: 1.2,
                marginBottom: "20px",
                overflow: "hidden",
                textOverflow: "ellipsis",
              },
              children: title,
            },
          },
          {
            type: "div",
            props: {
              style: {
                fontSize: "22px",
                fontFamily: "Inter",
                fontWeight: 400,
                color: "#a1a1aa",
                lineHeight: 1.5,
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
              },
              children: description,
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
                      fontSize: "20px",
                      fontFamily: "Inter",
                      fontWeight: 700,
                      color: "#2563eb",
                    },
                    children: "westtech.dev",
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: "16px",
                      fontFamily: "Inter",
                      fontWeight: 400,
                      color: "#52525b",
                    },
                    children: "something to know",
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

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
  });

  return resvg.render().asPng();
}

// Main
mkdirSync(outDir, { recursive: true });

const files = readdirSync(postsDir).filter((f) => f.endsWith(".md"));

let generated = 0;
let skipped = 0;
let wasmReady = false;

for (const file of files) {
  const slug = basename(file, ".md");
  const content = readFileSync(join(postsDir, file), "utf-8");
  const fm = parseFrontmatter(content);
  if (!fm || fm.draft) continue;
  // Skip posts with custom hero image URL (they use that as og:image)
  if (fm.heroImage && fm.heroImage !== "true" && fm.heroImage !== "false") continue;

  const outPath = join(outDir, `${slug}.png`);
  const mdPath = join(postsDir, file);

  // Skip if OG image already exists and is newer than the source post
  try {
    const ogStat = statSync(outPath);
    const mdStat = statSync(mdPath);
    if (ogStat.mtimeMs >= mdStat.mtimeMs) {
      skipped++;
      continue;
    }
  } catch {
    // File doesn't exist, generate it
  }

  // Lazy-init WASM on first image that needs generating
  if (!wasmReady) {
    await initWasm(readFileSync(wasmPath));
    wasmReady = true;
  }

  const png = await renderOgImage({
    title: fm.title,
    description: fm.description,
    tags: fm.tags,
  });
  writeFileSync(outPath, png);
  generated++;
}

console.log(`OG images: ${generated} generated, ${skipped} up-to-date.`);
