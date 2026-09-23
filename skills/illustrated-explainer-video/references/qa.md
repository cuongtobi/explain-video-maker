# QA gates

A successful command is not equivalent to a good video.

## Required gates

1. `INPUT_VALID`
2. `TIMING_VALID`
3. `ASSET_INDEX_VALID`
4. `VISUAL_PLAN_VALID`
5. `HYPERFRAMES_CHECK_PASS`
6. `PREVIEW_REVIEWED`
7. `RENDER_PASS`
8. `OUTPUT_VERIFIED`

## Input QA

Fail on:
- missing required input class;
- unreadable JSON;
- duplicate asset indices;
- dangling visual-plan asset references;
- unknown effect/layout preset;
- invalid explicit timing;
- invalid normalized focus or shot ratios.

Warn on:
- numeric gaps;
- unused declared assets;
- supplied assets not referenced in the plan.

## Timing QA

Compare:
- narration duration;
- final subtitle end;
- final composition duration.

Do not hide material differences with a blank tail or speed change.

Suggested statuses:
- `TIMING_OK`
- `TIMING_MISMATCH`
- `SUBTITLE_GAP`
- `AUDIO_PROBE_FAILED`

## Visual QA

Inspect representative frames:
- first scene;
- each section start;
- scene boundaries;
- measurement/comparison scenes;
- close-up/detail zooms;
- multi-asset scenes;
- subtitle-heavy scenes when burn-in is enabled;
- final scene.

Check:
- blank frames;
- accidental cropping;
- subject out of safe area;
- text overflow;
- unreadable contrast;
- asset collision;
- incorrect focal crop;
- repeated asset that was not intended;
- transition seams.

## Motion QA

For important scenes inspect start, 25%, 50%, 75%, end.

Look for:
- jumps caused by conflicting transforms;
- excessive simultaneous motion;
- element drift;
- end-state popping;
- motion continuing beyond the clip;
- hidden/visible ownership conflicts.

## Output QA

After render:
- output exists and is non-empty;
- ffprobe reports expected resolution/fps;
- duration matches the narration/plan within an intentional tolerance;
- audio stream exists when narration is required.

Never report `PASS_VERIFIED` for a gate that was not executed.
