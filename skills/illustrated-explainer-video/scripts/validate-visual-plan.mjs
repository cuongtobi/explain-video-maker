#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [, , planArg] = process.argv;
if (!planArg) {
  console.error("Usage: node validate-visual-plan.mjs <visual_plan.json>");
  process.exit(2);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(here, "..");
const effects = JSON.parse(fs.readFileSync(path.join(skillRoot, "assets/effects.v1.json"), "utf8"));
const layouts = JSON.parse(fs.readFileSync(path.join(skillRoot, "assets/layouts.v1.json"), "utf8"));
const effectNames = new Set(Object.keys(effects.effects));
const transitionNames = new Set(effects.transitions);
const layoutNames = new Set(Object.keys(layouts.layouts));

let plan;
try {
  plan = JSON.parse(fs.readFileSync(planArg, "utf8"));
} catch (error) {
  console.error(`INVALID_JSON: ${error.message}`);
  process.exit(1);
}

const errors = [];
const warnings = [];
const err = (code, message, location = null) => errors.push({ code, message, location });
const warn = (code, message, location = null) => warnings.push({ code, message, location });

if (plan.schema_version !== "1.0") err("UNSUPPORTED_SCHEMA_VERSION", "schema_version must be 1.0", "schema_version");
if (!plan.project || typeof plan.project !== "object") err("PROJECT_REQUIRED", "project object is required", "project");
if (!Array.isArray(plan.assets)) err("ASSETS_REQUIRED", "assets must be an array", "assets");
if (!Array.isArray(plan.scenes) || plan.scenes.length === 0) err("SCENES_REQUIRED", "scenes must be a non-empty array", "scenes");

const declared = new Map();
if (Array.isArray(plan.assets)) {
  for (const [i, asset] of plan.assets.entries()) {
    const loc = `assets[${i}]`;
    if (!Number.isInteger(asset.index) || asset.index < 1) err("INVALID_ASSET_INDEX", "asset index must be a positive integer", loc);
    if (declared.has(asset.index)) err("DUPLICATE_ASSET_INDEX", `asset index ${asset.index} is declared more than once`, loc);
    declared.set(asset.index, asset);
    if (String(asset.basename) !== String(asset.index)) {
      err("ASSET_BASENAME_MISMATCH", `basename must equal numeric index ${asset.index}`, `${loc}.basename`);
    }
    if (typeof asset.description !== "string" || !asset.description.trim()) {
      err("ASSET_DESCRIPTION_REQUIRED", "asset description is required", `${loc}.description`);
    }
  }
}

const sceneIds = new Set();
const sceneOrders = new Set();
const firstUse = new Set();
let highestFirstUse = 0;

const validateEffect = (name, loc) => {
  if (name == null) return;
  if (!effectNames.has(name)) err("UNKNOWN_EFFECT", `unknown effect preset: ${name}`, loc);
};
const validateFocus = (focus, loc) => {
  if (!focus) return;
  if (typeof focus.x !== "number" || focus.x < 0 || focus.x > 1 || typeof focus.y !== "number" || focus.y < 0 || focus.y > 1) {
    err("INVALID_FOCUS", "focus x/y must be normalized numbers between 0 and 1", loc);
  }
};

if (Array.isArray(plan.scenes)) {
  for (const [i, scene] of plan.scenes.entries()) {
    const loc = `scenes[${i}]`;
    if (!scene.id || typeof scene.id !== "string") err("SCENE_ID_REQUIRED", "scene id is required", `${loc}.id`);
    else if (sceneIds.has(scene.id)) err("DUPLICATE_SCENE_ID", `duplicate scene id: ${scene.id}`, `${loc}.id`);
    else sceneIds.add(scene.id);

    if (!Number.isInteger(scene.order) || scene.order < 1) err("INVALID_SCENE_ORDER", "scene order must be a positive integer", `${loc}.order`);
    else if (sceneOrders.has(scene.order)) err("DUPLICATE_SCENE_ORDER", `duplicate scene order: ${scene.order}`, `${loc}.order`);
    else sceneOrders.add(scene.order);

    if (!layoutNames.has(scene.layout)) err("UNKNOWN_LAYOUT", `unknown layout preset: ${scene.layout}`, `${loc}.layout`);
    validateEffect(scene.camera?.effect, `${loc}.camera.effect`);

    for (const key of ["transition_in", "transition_out"]) {
      if (scene[key] != null && !transitionNames.has(scene[key])) {
        err("UNKNOWN_TRANSITION", `unknown transition: ${scene[key]}`, `${loc}.${key}`);
      }
    }

    const t = scene.timing;
    if (!t || typeof t !== "object") {
      err("TIMING_REQUIRED", "timing object is required", `${loc}.timing`);
    } else {
      const bothNull = t.start == null && t.end == null;
      const bothNumbers = typeof t.start === "number" && typeof t.end === "number";
      if (!bothNull && !bothNumbers) err("PARTIAL_EXPLICIT_TIMING", "start and end must both be null or both be numbers", `${loc}.timing`);
      if (bothNumbers && !(t.start >= 0 && t.end > t.start)) err("INVALID_EXPLICIT_TIMING", "explicit timing must satisfy 0 <= start < end", `${loc}.timing`);
      if (t.subtitle_start_id != null && t.subtitle_end_id != null && t.subtitle_end_id < t.subtitle_start_id) {
        err("INVALID_SUBTITLE_RANGE", "subtitle_end_id must be >= subtitle_start_id", `${loc}.timing`);
      }
    }

    for (const [j, ref] of (scene.assets ?? []).entries()) {
      const refLoc = `${loc}.assets[${j}]`;
      if (!declared.has(ref.index)) err("DANGLING_ASSET_REFERENCE", `asset ${ref.index} is not declared in assets[]`, `${refLoc}.index`);
      validateFocus(ref.focus, `${refLoc}.focus`);
      validateEffect(ref.motion?.enter, `${refLoc}.motion.enter`);
      validateEffect(ref.motion?.hold, `${refLoc}.motion.hold`);
      validateEffect(ref.motion?.exit, `${refLoc}.motion.exit`);

      if (!firstUse.has(ref.index)) {
        if (ref.index < highestFirstUse) {
          err("ASSET_FIRST_USE_REORDERED", `first use of asset ${ref.index} occurs after higher first-use index ${highestFirstUse}`, refLoc);
        }
        firstUse.add(ref.index);
        highestFirstUse = Math.max(highestFirstUse, ref.index);
      } else if (!ref.reuse) {
        warn("ASSET_REUSED_WITHOUT_FLAG", `asset ${ref.index} is referenced again without reuse:true`, refLoc);
      }

      if (Array.isArray(ref.shots)) {
        let previousEnd = 0;
        for (const [k, shot] of ref.shots.entries()) {
          const shotLoc = `${refLoc}.shots[${k}]`;
          validateEffect(shot.camera, `${shotLoc}.camera`);
          validateFocus(shot.focus, `${shotLoc}.focus`);
          if (typeof shot.start_ratio !== "number" || typeof shot.end_ratio !== "number" ||
              shot.start_ratio < 0 || shot.end_ratio > 1 || shot.end_ratio <= shot.start_ratio) {
            err("INVALID_SHOT_RATIO", "shot ratios must satisfy 0 <= start_ratio < end_ratio <= 1", shotLoc);
          }
          if (shot.start_ratio < previousEnd) warn("OVERLAPPING_SHOTS", "shot overlaps previous shot", shotLoc);
          previousEnd = Math.max(previousEnd, shot.end_ratio ?? 0);
        }
      }
    }

    for (const [j, textItem] of (scene.text ?? []).entries()) {
      validateEffect(textItem.effect, `${loc}.text[${j}].effect`);
    }
  }
}

for (const index of declared.keys()) {
  if (!firstUse.has(index)) warn("DECLARED_ASSET_UNUSED", `declared asset ${index} is never referenced by a scene`, "assets");
}

const result = {
  ok: errors.length === 0,
  schema_version: plan.schema_version ?? null,
  scene_count: Array.isArray(plan.scenes) ? plan.scenes.length : 0,
  asset_count: Array.isArray(plan.assets) ? plan.assets.length : 0,
  errors,
  warnings
};

process.stdout.write(JSON.stringify(result, null, 2) + "\n");
process.exit(result.ok ? 0 : 1);
