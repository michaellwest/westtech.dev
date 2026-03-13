import satori from "satori";
import { initWasm, Resvg } from "@resvg/resvg-wasm";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const fontsDir = join(process.cwd(), "src/assets/fonts");

const interBold = readFileSync(join(fontsDir, "Inter-Bold.woff"));
const interRegular = readFileSync(join(fontsDir, "Inter-Regular.woff"));

let wasmInitialized = false;

async function ensureWasm() {
  if (wasmInitialized) return;
  const wasmPath = join(
    process.cwd(),
    "node_modules/@resvg/resvg-wasm/index_bg.wasm",
  );
  const wasmBuffer = readFileSync(wasmPath);
  await initWasm(wasmBuffer);
  wasmInitialized = true;
}

interface OgImageOptions {
  title: string;
  description: string;
  tags: string[];
}

export async function renderOgImage({
  title,
  description,
  tags,
}: OgImageOptions): Promise<Uint8Array> {
  await ensureWasm();

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
          // Top accent bar
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
          // Tags row
          displayTags.length > 0
            ? {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexWrap: "wrap" as const,
                    gap: "8px",
                    marginBottom: "24px",
                  },
                  children: displayTags.map((tag) => ({
                    type: "div",
                    props: {
                      style: {
                        backgroundColor: "rgba(37, 99, 235, 0.15)",
                        color: "#60a5fa",
                        fontSize: "16px",
                        fontFamily: "Inter",
                        fontWeight: 400,
                        padding: "4px 12px",
                        borderRadius: "6px",
                      },
                      children: tag,
                    },
                  })),
                },
              }
            : null,
          // Title
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
          // Description
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
          // Bottom branding
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
