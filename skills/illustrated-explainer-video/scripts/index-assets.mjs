#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const [, , inputDirArg, outputArg] = process.argv;
if (!inputDirArg) {
  console.error("Usage: node index-assets.mjs <assets-dir> [output.json]");
  process.exit(2);
}

const inputDir = path.resolve(inputDirArg);
const imageExt = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"]);
const videoExt = new Set([".mp4", ".webm", ".mov"]);
const entries = fs.readdirSync(inputDir, { withFileTypes: true }).filter((d) => d.isFile());
const byIndex = new Map();
const ignored = [];

for (const entry of entries) {
  const ext = path.extname(entry.name).toLowerCase();
  const base = path.basename(entry.name, ext);
  if (!/^\d+$/.test(base) || Number(base) < 1) {
    ignored.push(entry.name);
    continue;
  }
  if (!imageExt.has(ext) && !videoExt.has(ext)) {
    ignored.push(entry.name);
    continue;
  }
  const index = Number(base);
  if (byIndex.has(index)) {
    console.error(`DUPLICATE_ASSET_INDEX: ${index}: ${byIndex.get(index).name}, ${entry.name}`);
    process.exit(1);
  }
  byIndex.set(index, {
    index,
    basename: base,
    name: entry.name,
    path: path.join(inputDirArg, entry.name).replaceAll("\\", "/"),
    extension: ext.slice(1),
    media_type: imageExt.has(ext) ? "image" : "video"
  });
}

const assets = [...byIndex.values()].sort((a, b) => a.index - b.index);
const gaps = [];
if (assets.length) {
  for (let i = assets[0].index; i <= assets.at(-1).index; i += 1) {
    if (!byIndex.has(i)) gaps.push(i);
  }
}

const result = {
  version: "1.0",
  directory: inputDirArg.replaceAll("\\", "/"),
  count: assets.length,
  assets,
  warnings: [
    ...(gaps.length ? [{ code: "ASSET_SEQUENCE_GAP", missing_indices: gaps }] : []),
    ...(ignored.length ? [{ code: "IGNORED_FILES", files: ignored.sort() }] : [])
  ]
};

const json = JSON.stringify(result, null, 2) + "\n";
if (outputArg) {
  fs.mkdirSync(path.dirname(path.resolve(outputArg)), { recursive: true });
  fs.writeFileSync(outputArg, json);
} else {
  process.stdout.write(json);
}
