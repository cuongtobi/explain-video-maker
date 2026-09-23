#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const [, , inputArg, outputArg] = process.argv;
if (!inputArg) {
  console.error("Usage: node probe-audio.mjs <voice-file> [output.json]");
  process.exit(2);
}
if (!fs.existsSync(inputArg)) {
  console.error(`AUDIO_NOT_FOUND: ${inputArg}`);
  process.exit(1);
}

const probe = spawnSync("ffprobe", [
  "-v", "error",
  "-show_entries", "format=duration:stream=index,codec_type,codec_name,sample_rate,channels",
  "-of", "json",
  inputArg
], { encoding: "utf8" });

if (probe.error || probe.status !== 0) {
  console.error("AUDIO_PROBE_FAILED");
  if (probe.error) console.error(probe.error.message);
  if (probe.stderr) console.error(probe.stderr.trim());
  process.exit(1);
}

const raw = JSON.parse(probe.stdout);
const duration = Number(raw?.format?.duration);
const audioStreams = (raw.streams ?? []).filter((s) => s.codec_type === "audio");

const result = {
  version: "1.0",
  source: inputArg.replaceAll("\\", "/"),
  duration_seconds: Number.isFinite(duration) ? duration : null,
  audio_stream_count: audioStreams.length,
  streams: audioStreams
};

const json = JSON.stringify(result, null, 2) + "\n";
if (outputArg) {
  fs.mkdirSync(path.dirname(path.resolve(outputArg)), { recursive: true });
  fs.writeFileSync(outputArg, json);
} else {
  process.stdout.write(json);
}
