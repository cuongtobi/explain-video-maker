# Explain Video Maker

Portable Agent Skill for building illustrated explainer videos with HyperFrames from prepared inputs:

- a finished script
- finished narration audio
- finished subtitles
- ordered numeric visual assets: `1.png`, `2.png`, `3.webp`, ...

The skill does **not** research, rewrite the script, generate narration, or generate images unless the user explicitly asks for those tasks. Its job is to plan, author, validate, preview, and render the supplied material as a deterministic HyperFrames video.

## Core contract

```text
script.txt
voice.mp3
subtitles.srt
assets/1.png, 2.png, 3.png...
visual_plan.json
        |
        v
illustrated-explainer-video skill
        |
        v
HyperFrames project
        |
        v
check -> preview -> render
```

`visual_plan.json` is the visual source of truth. It is intended to be generated at script-writing time, before the visual assets exist. The numbered assets are later created to match its `assets[].description`.

## Repository layout

```text
skills/illustrated-explainer-video/
├── SKILL.md
├── assets/
│   ├── effects.v1.json
│   └── layouts.v1.json
├── references/
├── schemas/
│   └── visual_plan.schema.json
└── scripts/
    ├── index-assets.mjs
    ├── parse-subtitles.mjs
    ├── probe-audio.mjs
    └── validate-visual-plan.mjs
```

## Input layout

```text
project/
├── input/
│   ├── script.txt
│   ├── voice.mp3
│   ├── subtitles.srt
│   └── assets/
│       ├── 1.png
│       ├── 2.png
│       ├── 3.webp
│       └── ...
└── visual_plan.json
```

Numeric basenames are ordered naturally by integer value. Mixed extensions are supported. Missing numbers produce warnings; duplicate numeric basenames such as `12.png` plus `12.jpg` are errors.

## Validate inputs

Requires Node.js 22+. `ffprobe` is required only for audio probing.

```bash
node skills/illustrated-explainer-video/scripts/index-assets.mjs input/assets .video/assets-index.json
node skills/illustrated-explainer-video/scripts/parse-subtitles.mjs input/subtitles.srt .video/subtitles.json
node skills/illustrated-explainer-video/scripts/probe-audio.mjs input/voice.mp3 .video/audio.json
node skills/illustrated-explainer-video/scripts/validate-visual-plan.mjs visual_plan.json
```

## Agent portability

The skill follows the portable Agent Skills convention: one directory with a required `SKILL.md`, plus optional scripts, references, schemas and assets. Use the canonical directory in `skills/illustrated-explainer-video/` with Codex, Claude, or Antigravity through the skill installation/discovery mechanism supported by that agent. Antigravity project skills can also be placed under `.agents/skills/`.

Do not fork the instructions by provider. The files deliberately say “the agent”, never “Codex should…” or “Claude should…”.

## HyperFrames

The skill assumes the target project uses the current HyperFrames CLI. HyperFrames owns composition timing, browser seeking, media playback, validation and video encoding. The skill owns the workflow, visual plan, ordered asset allocation, motion language and QA policy.

Typical final loop:

```bash
npx hyperframes check
npx hyperframes preview --background
# render only after final preview approval
npx hyperframes render --quality delivery --output output/final.mp4
```

See `skills/illustrated-explainer-video/SKILL.md` for the complete workflow.
