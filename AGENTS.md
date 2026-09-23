# Repository agent instructions

This repository defines a portable Agent Skill. Keep it provider-neutral.

## Non-negotiable rules

1. `visual_plan.json` is the visual source of truth.
2. Script text is the content authority.
3. Subtitle timing is the picture-timing authority after subtitles exist.
4. Narration audio is the final duration/audio authority.
5. Numeric asset order is intentional. Never reorder first use of assets unless the user explicitly requests it.
6. Do not silently invent missing assets.
7. Do not embed arbitrary generated GSAP coordinates in a visual plan when an existing effect preset can express the motion.
8. Keep HyperFrames-specific implementation details out of the visual-plan schema where possible.
9. A successful render is not enough: `hyperframes check`, preview inspection, and output verification are required.
10. Do not claim PASS when a required verification command was not actually run.

## Compatibility

The canonical skill is `skills/illustrated-explainer-video/`. Avoid separate Codex-, Claude-, or Antigravity-specific copies.
