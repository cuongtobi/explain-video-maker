# Input contract

## Required source inputs

The workflow expects four prepared source classes plus the visual plan.

### Script

Accepted examples: `script.txt`, `script.md`.

The script is the semantic/content authority. The skill may segment it into beats but must not rewrite facts or wording as part of rendering.

### Narration

Accepted: WAV, MP3, M4A and any other format supported by the local FFmpeg build.

Narration is the audio master. Probe it with `ffprobe`.

### Subtitles

Preferred: SRT or VTT. JSON is allowed only when it follows a documented local shape.

Subtitles are the timing authority after they exist. The skill should map scenes to cue ranges, not create a scene for every cue.

### Ordered assets

Asset filenames use an integer basename:

```text
1.png
2.webp
3.jpg
4.svg
5.mp4
```

Supported by the indexing script:
- images: png, jpg, jpeg, webp, svg, gif
- video: mp4, webm, mov

Rules:
- sort by numeric basename;
- extensions may differ;
- missing indices are warnings;
- duplicate indices are errors;
- first use stays in ascending numeric order;
- an earlier asset may be reused after its first use.

### visual_plan.json

Created alongside the script. It states:
- what numbered assets should be created;
- what each visual represents;
- scene sequence;
- layout intent;
- text/data overlays;
- motion presets;
- optional focus/crop information.

Runtime timestamps can remain null until narration/subtitles exist.

## Recommended project shape

```text
project/
├── input/
│   ├── script.txt
│   ├── voice.mp3
│   ├── subtitles.srt
│   └── assets/
├── visual_plan.json
├── .video/              # generated analysis/build state
├── src/                 # generated HyperFrames project content
└── output/
```

Generated files under `.video/` must never become a substitute for authored source inputs.
