# public/icons/ — PWA Icon Placeholders

This folder needs **12 PNG icon files** before deploying.

## Required Files

| Filename                | Size        | Purpose           |
|-------------------------|-------------|-------------------|
| `source.png`            | 512×512 min | Source for script |
| `icon-72.png`           | 72×72       | Android legacy    |
| `icon-96.png`           | 96×96       | Android           |
| `icon-128.png`          | 128×128     | Chrome store      |
| `icon-144.png`          | 144×144     | IE/Edge tile      |
| `icon-152.png`          | 152×152     | iPad              |
| `icon-192.png`          | 192×192     | Android home      |
| `icon-384.png`          | 384×384     | Android splash    |
| `icon-512.png`          | 512×512     | PWA store listing |
| `icon-maskable-192.png` | 192×192     | Adaptive icon     |
| `icon-maskable-512.png` | 512×512     | Adaptive icon     |

---

## Image Prompt (generate with Ideogram, Midjourney, or DALL·E)

Use this prompt to generate `source.png`:

```
A bold square app icon for "AdvaySnapTik", a TikTok downloader app.
Dark near-black background (#0d0d0d).
Center: a stylized downward arrow icon — the top half colored teal (#25f4ee),
the bottom half colored red (#fe2c55), thick and modern.
Subtle radial glow behind the arrow: teal top-left, red bottom-right.
No text. No gradients on the arrow itself — clean flat colors.
Rounded square format, designed for iOS and Android app icons.
Minimal, clean, professional. No cluttered details.
```

## How to Generate All Sizes

**Option A — Automatic (recommended):**
1. Place your `source.png` (min 512×512) in this folder
2. Run: `npm install canvas && node scripts/generate-icons.js`
3. All sizes are auto-generated

**Option B — Manual:**
- Use [RealFaviconGenerator](https://realfavicongenerator.net) — upload `source.png`, download all sizes
- Rename files to match the table above

## Maskable Icon Notes
- Maskable icons need ~10% safe-zone padding (icon content centered in 80% of the canvas)
- The `generate-icons.js` script handles this automatically with `--background-color #0d0d0d`
