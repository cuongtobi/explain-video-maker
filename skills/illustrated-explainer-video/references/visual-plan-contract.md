# visual_plan.json contract

`visual_plan.json` is authored when the script is written. It is intentionally renderer-light: it records visual decisions without embedding arbitrary implementation code.

## Top-level fields

- `schema_version`: currently `"1.0"`.
- `project`: title/language/style/aspect ratio.
- `defaults`: default fit/background/transition/safe margin.
- `assets`: numbered asset requirements.
- `scenes`: ordered visual beats.

Effect and layout definitions live in the skill registries, not copied into every project.

## Assets

Example:

```json
{
  "index": 7,
  "basename": "7",
  "type": "image",
  "purpose": "detail",
  "description": "Close-up illustration of an open dinosaur jaw with visible serrated teeth",
  "transparent_preferred": false,
  "first_scene": "scene-004"
}
```

The description may be reused by the user's separate asset-generation workflow. The render skill itself does not generate the asset.

## Scenes

A scene is a semantic visual beat, not necessarily a subtitle cue.

Example:

```json
{
  "id": "scene-004",
  "order": 4,
  "narration": "Its bite was one of its most remarkable features.",
  "timing": {
    "source": "subtitle",
    "start": null,
    "end": null,
    "subtitle_start_id": null,
    "subtitle_end_id": null
  },
  "layout": "close-up",
  "assets": [
    {
      "index": 7,
      "role": "primary",
      "reuse": false,
      "motion": {
        "enter": "fade_in",
        "hold": null,
        "exit": null
      },
      "focus": {
        "x": 0.63,
        "y": 0.40
      }
    }
  ],
  "camera": {
    "effect": "detail_zoom"
  },
  "transition_in": "cut",
  "transition_out": "cut"
}
```

## Timing

At script-writing time:

```json
{
  "source": "subtitle",
  "start": null,
  "end": null
}
```

After subtitle binding, write resolved times to a generated scene plan instead of mutating authored intent.

Explicit `start` and `end` are allowed for hand-directed scenes and must satisfy `0 <= start < end`.

## Ordered first use

The first occurrence of assets should progress numerically.

Valid:

```text
scene 1: 1
scene 2: 2, 3
scene 3: 4
scene 4: 2 (reuse)
scene 5: 5
```

Invalid without explicit user direction:

```text
scene 1: 4
scene 2: 1
```

## Multi-shot asset

An asset may define multiple shots:

```json
{
  "index": 12,
  "role": "primary",
  "shots": [
    {
      "start_ratio": 0,
      "end_ratio": 0.45,
      "camera": "slow_push"
    },
    {
      "start_ratio": 0.45,
      "end_ratio": 1,
      "camera": "detail_zoom",
      "focus": { "x": 0.72, "y": 0.32 }
    }
  ]
}
```

Ratios are scene-relative and must remain between 0 and 1.

## Focus coordinates

`focus.x` and `focus.y` are normalized coordinates:

```text
(0,0) ---------------- (1,0)
  |                      |
  |        image         |
  |                      |
(0,1) ---------------- (1,1)
```

They are intent for a camera/focal treatment, not raw CSS transform origins.

## Reuse

Set `reuse: true` when intentionally returning to an asset after its first appearance. Reuse never changes the asset's numeric identity.
