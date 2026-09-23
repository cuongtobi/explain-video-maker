# HyperFrames authoring contract

HyperFrames is the renderer. This skill does not replace its upstream technical skills.

Before authoring or changing composition HTML, load the current:
- `hyperframes-core`
- `hyperframes-animation`
- `hyperframes-keyframes` for camera/keyframe work
- `hyperframes-cli` for validation/preview/render behavior

## Composition rules to preserve

- Standalone composition root is directly in `<body>`.
- Root declares `data-composition-id`, `data-width`, `data-height` and duration when known.
- A GSAP composition registers exactly one paused timeline under the same composition ID.
- HyperFrames owns clip visibility; do not tween `display`, `visibility` or `autoAlpha` on `.clip`.
- Avoid CSS transform initial values that fight GSAP transforms on the same element.
- Do not use render-time clocks, unseeded randomness, network-dependent state or infinite animation loops.
- Give media elements stable unique IDs across the assembled document.
- Let HyperFrames own media seek/playback.
- Long projects should be modularized into section/sub-compositions.

## Scene translation

The authored visual plan chooses:
- layout preset;
- numbered assets;
- asset roles;
- camera/effect preset;
- text/data overlays;
- focus coordinates.

The HyperFrames authoring layer translates those into deterministic DOM + seekable animation.

Do not embed arbitrary JavaScript from the JSON.

## Recommended project structure

```text
src/
├── index.html
├── compositions/
│   ├── section-001.html
│   ├── section-002.html
│   └── ...
├── runtime/
│   ├── effects.js
│   ├── layouts.js
│   └── visual-plan.js
└── styles/
    └── explainer.css
```

## Validation loop

While authoring:

```bash
npx hyperframes lint
```

Final gate:

```bash
npx hyperframes check --snapshots
```

Preview the assembled project before render.

Final render:

```bash
npx hyperframes render --quality delivery --output output/final.mp4
```

Then verify output metadata with `ffprobe`.
