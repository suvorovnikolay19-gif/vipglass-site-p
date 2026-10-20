# Demo process video

Created 2026-10-16 from existing AI-generated VIPGlass material-processing sample images. This is an illustrative visualization, not filmed factory activity, real project footage, or an exact supplier product. No additional AI imagery was generated for the video.

## Published assets

- Video: `/assets/content/demo-process.mp4`
- Poster: `/assets/content/demo-process-poster.webp`
- Video: 720 × 1280 portrait, H.264/AVC, yuv420p, 24 fps, 204 frames, 8.5 seconds, no audio stream, MP4 fast start.
- File size: 613,301 bytes (approximately 0.61 MB).
- Poster: 720 × 1280 WebP, 65,986 bytes.
- A small `ВИЗУАЛИЗАЦИЯ` label is embedded throughout. Surrounding UI should also describe the video as a visualization.

## Source images and edit

The four original 1254 × 1254 PNGs are documented with their full image-generation prompts and provenance in `docs/granular-images.json`.

| Timeline | Source key | Depicted operation |
| --- | --- | --- |
| 0.0–2.5 s | `service-countersink` | Conical recess around a through-hole |
| 2.0–4.5 s | `service-groove` | U-shaped slot open to a glass edge |
| 4.0–6.5 s | `service-grinding` | Matte ground edge against polished face |
| 6.0–8.5 s | `service-mitre` | Two separate full-thickness 45-degree-cut samples |

Each shot has a restrained 3.5% centered push-in, with 0.5-second crossfades. Source photographs are center-cropped into the vertical frame; no glass color was changed. Neutral colorless glass and warm studio surfaces are preserved. Encoding used FFmpeg with libx264, CRF 28, a 1.4 Mbit/s maximum rate and `+faststart`.

## Production image derivatives

The full images retain 1254 × 1254 resolution and use WebP quality 82. The existing `resourcePhoto` small-image naming convention is retained: `-480.webp`, 480 × 480, WebP quality 78. No unused `-thumb.webp` aliases were created.

| Key | Full asset | Small asset |
| --- | --- | --- |
| `service-countersink` | `/assets/production/service-countersink.webp` | `/assets/production/service-countersink-480.webp` |
| `service-groove` | `/assets/production/service-groove.webp` | `/assets/production/service-groove-480.webp` |
| `service-grinding` | `/assets/production/service-grinding.webp` | `/assets/production/service-grinding-480.webp` |
| `service-mitre` | `/assets/production/service-mitre.webp` | `/assets/production/service-mitre-480.webp` |

## Verification

- FFprobe confirmed the video codec, dimensions, duration, frame count and absence of an audio stream.
- FFmpeg decoded the entire MP4 with no errors.
- Extracted frames across all four shots were visually inspected: operations remain legible, the disclosure label is present, and no green glass cast appears.
- All eight WebP derivatives passed image-decoding verification.

No application or production-data files were changed.
