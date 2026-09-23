import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skill = path.join(root, "skills/illustrated-explainer-video");
const run = (script, args = []) =>
  spawnSync(process.execPath, [path.join(skill, "scripts", script), ...args], {
    cwd: root,
    encoding: "utf8"
  });

{
  const result = run("validate-visual-plan.mjs", [
    path.join(skill, "examples/visual_plan.example.json")
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.asset_count, 3);
  assert.equal(payload.scene_count, 3);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "explain-video-maker-"));
try {
  const assets = path.join(tmp, "assets");
  fs.mkdirSync(assets);
  for (const name of ["1.png", "2.webp", "4.jpg", "notes.txt"]) {
    fs.writeFileSync(path.join(assets, name), "");
  }

  {
    const result = run("index-assets.mjs", [assets]);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const payload = JSON.parse(result.stdout);
    assert.deepEqual(payload.assets.map((x) => x.index), [1, 2, 4]);
    assert.deepEqual(payload.warnings.find((x) => x.code === "ASSET_SEQUENCE_GAP")?.missing_indices, [3]);
    assert.deepEqual(payload.warnings.find((x) => x.code === "IGNORED_FILES")?.files, ["notes.txt"]);
  }

  {
    fs.writeFileSync(path.join(assets, "2.jpg"), "");
    const result = run("index-assets.mjs", [assets]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /DUPLICATE_ASSET_INDEX/);
    fs.unlinkSync(path.join(assets, "2.jpg"));
  }

  {
    const srt = path.join(tmp, "sample.srt");
    fs.writeFileSync(
      srt,
      [
        "1",
        "00:00:00,500 --> 00:00:02,000",
        "First line",
        "",
        "2",
        "00:00:02,200 --> 00:00:04,000",
        "Second line",
        ""
      ].join("\n")
    );
    const result = run("parse-subtitles.mjs", [srt]);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.cue_count, 2);
    assert.equal(payload.cues[0].start, 0.5);
    assert.equal(payload.cues[1].end, 4);
  }

  {
    const badPlanPath = path.join(tmp, "bad-plan.json");
    const example = JSON.parse(
      fs.readFileSync(path.join(skill, "examples/visual_plan.example.json"), "utf8")
    );
    example.scenes[0].camera.effect = "not_a_real_effect";
    fs.writeFileSync(badPlanPath, JSON.stringify(example));
    const result = run("validate-visual-plan.mjs", [badPlanPath]);
    assert.equal(result.status, 1);
    const payload = JSON.parse(result.stdout);
    assert(payload.errors.some((x) => x.code === "UNKNOWN_EFFECT"));
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log("smoke tests passed");
