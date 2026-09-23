#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const [, , inputArg, outputArg] = process.argv;
if (!inputArg) {
  console.error("Usage: node parse-subtitles.mjs <subtitles.srt|vtt> [output.json]");
  process.exit(2);
}

const ext = path.extname(inputArg).toLowerCase();
if (![".srt", ".vtt"].includes(ext)) {
  console.error("Unsupported subtitle format. Expected .srt or .vtt");
  process.exit(2);
}

let text = fs.readFileSync(inputArg, "utf8").replace(/^\uFEFF/, "").replaceAll("\r\n", "\n");
if (ext === ".vtt") text = text.replace(/^WEBVTT[^\n]*\n+/, "");

const parseTime = (raw) => {
  const normalized = raw.trim().replace(",", ".");
  const parts = normalized.split(":");
  if (parts.length === 3) return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
  if (parts.length === 2) return Number(parts[0]) * 60 + Number(parts[1]);
  return Number.NaN;
};

const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
const cues = [];
let fallbackId = 1;

for (const block of blocks) {
  const lines = block.split("\n");
  let id = fallbackId;
  let timeLineIndex = 0;
  if (!lines[0].includes("-->")) {
    if (/^\d+$/.test(lines[0].trim())) id = Number(lines[0].trim());
    timeLineIndex = 1;
  }
  const timeLine = lines[timeLineIndex];
  if (!timeLine?.includes("-->")) continue;

  const [startRaw, endRawWithSettings] = timeLine.split("-->");
  const endRaw = endRawWithSettings.trim().split(/\s+/)[0];
  const start = parseTime(startRaw);
  const end = parseTime(endRaw);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    console.error(`INVALID_SUBTITLE_TIMING near cue ${id}: ${timeLine}`);
    process.exit(1);
  }

  const cueText = lines.slice(timeLineIndex + 1).join("\n").trim();
  cues.push({ id, start, end, text: cueText });
  fallbackId = Math.max(fallbackId + 1, id + 1);
}

const result = {
  version: "1.0",
  source: inputArg.replaceAll("\\", "/"),
  cue_count: cues.length,
  start: cues.length ? cues[0].start : null,
  end: cues.length ? cues.at(-1).end : null,
  cues
};

const json = JSON.stringify(result, null, 2) + "\n";
if (outputArg) {
  fs.mkdirSync(path.dirname(path.resolve(outputArg)), { recursive: true });
  fs.writeFileSync(outputArg, json);
} else {
  process.stdout.write(json);
}
