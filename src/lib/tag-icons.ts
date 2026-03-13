import { readFileSync } from "node:fs";
import { join } from "node:path";

const iconsDir = join(process.cwd(), "src/assets/icons");

const cache = new Map<string, string>();

export function getTagIconUri(tag: string): string | undefined {
  if (cache.has(tag)) return cache.get(tag);

  try {
    const svg = readFileSync(join(iconsDir, `${tag}.svg`), "utf-8");
    const uri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
    cache.set(tag, uri);
    return uri;
  } catch {
    return undefined;
  }
}
