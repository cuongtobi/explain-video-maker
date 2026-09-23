---
name: illustrated-explainer-video
description: Render a prepared long-form illustrated explainer video with HyperFrames from an existing script, narration audio, subtitles, ordered numeric assets, and visual_plan.json. Use when the user already provides or will provide the content assets and wants deterministic 2D explainer assembly, scene planning, motion, preview, QA, or final render. Do not use this skill to research the topic, write the script, synthesize voice, or generate images unless the user explicitly asks for those separate tasks.
---

# Illustrated Explainer Video

Build an illustrated explainer with HyperFrames from **prepared source material**.

The visual style is a high-turnover 2D explainer: short semantic scenes, clean compositions, illustrated cutouts, comparisons, measurements, maps, diagrams, close-ups, occasional environment art, restrained camera movement, and simple deterministic transitions.

## Source-of-truth hierarchy

Use this hierarchy whenever two inputs disagree:

1. **Script** — wording, meaning, section order.
2. **Subtitles** — scene/beat timing after subtitles exist.
3. **Narration audio** — final audio duration and render duration sanity check.
4. **visual_plan.json** — visual intent, asset descriptions, scene layouts and motion choices.
5. **Numeric asset files** — supplied visual material.

Do not rewrite the script to fit visuals. Do not stretch picture timing away from the narration just to fit an effect.

## Expected inputs

Read `references/input-contract.md` before modifying the project.

Expected project shape:

```text
input/
├── script.txt|md
├── voice.wav|mp3|m4a
├── subtitles.srt|vtt|json
└── assets/
    ├── 1.png
    ├── 2.png
    ├── 3.webp
    └── ...
visual_plan.json
```

The asset basename is an integer sequence. Natural numeric order is intentional.

## Required phases

Always execute the phases in order.

### Phase A — inspect

1. Locate the script, voice, subtitles, assets and visual plan.
2. Read only the files necessary for the current phase.
3. Run:
   ```bash
   node <skill>/scripts/index-assets.mjs <assets-dir> .video/assets-index.json
   node <skill>/scripts/parse-subtitles.mjs <subtitle-file> .video/subtitles.json
   node <skill>/scripts/probe-audio.mjs <voice-file> .video/audio.json
   node <skill>/scripts/validate-visual-plan.mjs visual_plan.json
   ```
4. Stop on duplicate asset indices, invalid JSON, unknown layouts/effects, dangling asset references, or invalid explicit timing.
5. Numeric gaps are warnings, not failures.

### Phase B — bind timing

Read `references/visual-plan-contract.md`.

- Preserve scene order.
- Bind each visual scene to the subtitle cue range that expresses its narration beat.
- Prefer semantic beat boundaries over “one subtitle = one scene”.
- Typical scene duration is 2.5–6s, but do not force this when narration requires shorter or longer scenes.
- Write resolved timing to a generated build artifact such as `.video/scene-plan.json`; do not mutate the authored visual plan merely to add runtime timestamps.
- Compare last subtitle end against narration duration. Treat material mismatch as `TIMING_MISMATCH`; do not silently compensate.

### Phase C — resolve ordered assets

- First-use asset order must remain increasing: 1, 2, 3, ...
- Reuse of an earlier asset is allowed only when the scene marks or clearly intends reuse.
- One scene may use multiple consecutive assets.
- One asset may support multiple shots through crop, focus and camera motion.
- If an intended visual asset is missing, use only these fallbacks:
  1. crop/zoom a supplied compatible asset;
  2. use a text/diagram treatment that needs no new source image;
  3. report `ASSET_GAP`.
- Never invent a filename or claim an asset exists without checking it.

### Phase D — author HyperFrames

Before writing composition HTML, read:
- `references/hyperframes-authoring.md`
- upstream `hyperframes-core`
- upstream `hyperframes-animation` or `hyperframes-keyframes` when motion requires it.

Use the layout registry in `assets/layouts.v1.json` and effect registry in `assets/effects.v1.json`.

Keep the agent creative at the **choice** layer, not the implementation-contract layer:
- choose scene layout;
- choose supplied assets;
- choose a motion preset;
- choose focus/crop;
- choose text emphasis.

The renderer/HTML should implement those decisions consistently.

Do not turn every scene into arbitrary one-off CSS/GSAP if a preset already covers the behavior.

For long videos, group scenes into section compositions. Do not build a single unmaintainable 15-minute HTML file.

### Phase E — validate

Run the lightweight loop while authoring:

```bash
npx hyperframes lint
```

Run the final gate:

```bash
npx hyperframes check --snapshots
```

A lint error invalidates later layout/contrast results. Fix lint first.

For sub-compositions, capture at least one visible midpoint per mounted section/scene group.

Read `references/qa.md`.

### Phase F — preview

Open the final assembled preview:

```bash
npx hyperframes preview --background
```

Inspect:
- representative frames across the full timeline;
- section boundaries;
- multi-asset scenes;
- close-up/focus scenes;
- subtitle safe area if subtitles are rendered;
- start and end.

Do not treat a plan, storyboard, lint pass, or check pass as final visual approval.

### Phase G — render

Render only after the final preview is accepted:

```bash
npx hyperframes render --quality delivery --output output/final.mp4
```

Verify the output with `ffprobe`. Compare output duration to narration duration and final subtitle end.

## Motion policy

Prefer one dominant motion per beat. Motion should support explanation, not compete with it.

Use:
- restrained push/pull;
- pan;
- detail zoom;
- slide/fade/pop entrance;
- measurement draw/reveal;
- small micro-motion only when it looks natural.

Avoid:
- unrelated simultaneous motion;
- infinite loops;
- render-time clocks;
- unseeded randomness;
- large decorative movement on every element;
- “AI motion” where all layers drift independently.

## Editing an existing build

When the user asks to revise one scene or section:

1. Retrieve only that scene, neighboring scenes, referenced assets and subtitle range.
2. Preserve unrelated scene timing and IDs.
3. Re-run validation and HyperFrames checks for the affected build.
4. Reuse cached/unchanged sections when the project build system supports it.

## Completion report

Report:
- input validation status;
- asset count and numeric gaps;
- visual-plan validation;
- HyperFrames check result;
- preview status;
- render path, codec/resolution/fps/duration when rendered;
- any `ASSET_GAP`, `TIMING_MISMATCH`, fallback, or unverified step.

Never say the render is verified if verification was not run.
