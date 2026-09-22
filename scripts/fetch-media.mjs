#!/usr/bin/env node
/**
 * Replace the shipped background media with on-brief photography.
 *
 * The clips committed to /public/media are landscape and tech footage, graded to
 * the Aker palette — they look right but they are not pictures of universities.
 * This script downloads licensed photographs matching the `query` on each slide
 * in src/lib/media.ts.
 *
 *   export UNSPLASH_ACCESS_KEY=...   # free, instant: unsplash.com/developers
 *   npm run fetch:media
 *
 * Writes <name>.jpg next to the existing files. The slideshow prefers a video
 * when one exists, so pass --replace to remove the .mp4 and fall back to stills.
 */

import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const REPLACE = process.argv.includes("--replace");
const MEDIA_DIR = path.join(process.cwd(), "public", "media");
const MANIFEST = path.join(process.cwd(), "src", "lib", "media.ts");

if (!ACCESS_KEY) {
  console.error(
    "\nUNSPLASH_ACCESS_KEY is not set.\n\n" +
      "  1. Create a free app at https://unsplash.com/developers\n" +
      "  2. export UNSPLASH_ACCESS_KEY=your_access_key\n" +
      "  3. npm run fetch:media\n",
  );
  process.exit(1);
}

/**
 * Pull {name, query} out of the ASSETS block so the manifest stays the one
 * source of truth. One entry per file by construction, so no two downloads can
 * target the same path.
 */
async function readSlides() {
  const source = await readFile(MANIFEST, "utf8");
  const start = source.indexOf("export const ASSETS");
  if (start === -1) throw new Error("Could not find the ASSETS block in src/lib/media.ts");
  const block = source.slice(start, source.indexOf("} satisfies", start));

  const slides = [];
  const pattern = /(?:still|clip)\(\s*"([^"]+)"\s*,\s*"([^"]+)"/g;
  let match;
  while ((match = pattern.exec(block)) !== null) {
    slides.push({ name: match[1], query: match[2] });
  }

  const names = slides.map((slide) => slide.name);
  const duplicate = names.find((name, index) => names.indexOf(name) !== index);
  if (duplicate) {
    throw new Error(`Two assets share the name "${duplicate}" — downloads would collide.`);
  }
  return slides;
}

async function search(query) {
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "1");
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("content_filter", "high");

  const response = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${ACCESS_KEY}`,
      "Accept-Version": "v1",
    },
  });
  if (!response.ok) {
    throw new Error(`Unsplash search failed (${response.status}): ${await response.text()}`);
  }
  const payload = await response.json();
  return payload.results?.[0] ?? null;
}

async function download(photo, name) {
  const url = new URL(photo.urls.raw);
  url.searchParams.set("w", "1920");
  url.searchParams.set("q", "72");
  url.searchParams.set("fm", "jpg");
  // Desaturate toward the Aker palette so downloaded stills match the graded clips.
  url.searchParams.set("sat", "-60");

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed (${response.status})`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(path.join(MEDIA_DIR, `${name}.jpg`), buffer);

  // Unsplash requires a download ping for attribution accounting.
  if (photo.links?.download_location) {
    await fetch(photo.links.download_location, {
      headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
    }).catch(() => {});
  }
  return buffer.length;
}

async function main() {
  await mkdir(MEDIA_DIR, { recursive: true });
  const slides = await readSlides();
  if (slides.length === 0) {
    console.error("No slides found in src/lib/media.ts — has the manifest shape changed?");
    process.exit(1);
  }

  console.log(`\nFetching ${slides.length} image(s) into public/media\n`);
  const credits = [];

  for (const { name, query } of slides) {
    try {
      const photo = await search(query);
      if (!photo) {
        console.log(`  —  ${name.padEnd(12)} no result for "${query}"`);
        continue;
      }
      const bytes = await download(photo, name);
      const mp4 = path.join(MEDIA_DIR, `${name}.mp4`);
      if (REPLACE && existsSync(mp4)) await unlink(mp4);

      credits.push(
        `| \`${name}.jpg\` | ${photo.user.name} | https://unsplash.com/photos/${photo.id} | ${query} |`,
      );
      console.log(
        `  ok ${name.padEnd(12)} ${(bytes / 1024).toFixed(0).padStart(5)}KB  ` +
          `${photo.user.name} — "${query}"`,
      );
    } catch (error) {
      console.log(`  !  ${name.padEnd(12)} ${error.message}`);
    }
  }

  if (credits.length > 0) {
    await writeFile(
      path.join(MEDIA_DIR, "UNSPLASH-CREDITS.md"),
      "# Unsplash photography\n\n" +
        "Downloaded by `npm run fetch:media`. Unsplash's licence permits commercial\n" +
        "use without attribution, but crediting photographers is expected practice.\n\n" +
        "| File | Photographer | Source | Query |\n| --- | --- | --- | --- |\n" +
        credits.join("\n") +
        "\n",
      "utf8",
    );
    console.log(`\nWrote public/media/UNSPLASH-CREDITS.md`);
  }

  if (!REPLACE) {
    console.log(
      "\nThe .mp4 clips are still present and take priority in the slideshow.\n" +
        "Re-run with --replace to delete them and use these stills instead.\n",
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
