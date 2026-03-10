# public/screenshots/ — PWA Screenshot Placeholders

Two screenshots are required for the PWA manifest (used in app store install UI).

## Required Files

| Filename       | Size       | Form Factor | Purpose              |
|----------------|------------|-------------|----------------------|
| `desktop.png`  | 1280×800   | wide        | Desktop PWA install  |
| `mobile.png`   | 390×844    | narrow      | Mobile PWA install   |

Format: **PNG**

---

## Image Prompts

### `desktop.png` — 1280×800px

```
A realistic browser screenshot mockup at exactly 1280x800px.
Dark web app on a #0d0d0d background.
Browser chrome (address bar, tabs) at the top showing "advaysnaptik.onrender.com".
App name "AdvaySnapTik" in large bold Sora font — "Snap" in teal #25f4ee, "Tik" in red #fe2c55 — in the navbar.
Hero section: large headline "Download TikTok Videos Without Watermark" in white.
Below: a wide URL input field with placeholder text "Paste TikTok link here…"
and a glowing teal "Get Download Links" button.
Below that: a result card showing a blurred placeholder video thumbnail,
author handle "@example", stats row, and three tabs: "Video", "MP3", "Slideshow".
Under the Video tab: a "No Watermark · HD" row with a teal Download button.
Subtle radial glow: teal top-left, red bottom-right.
Professional, clean, minimal. No real user data.
```

### `mobile.png` — 390×844px

```
A realistic phone screenshot mockup at exactly 390x844px.
Dark #0d0d0d background. Status bar at top (time, battery).
Sticky navbar: "AdvaySnapTik" in bold — "Snap" teal #25f4ee, "Tik" red #fe2c55.
Hero: headline "Download TikTok Videos Without Watermark" in white bold text.
URL input bar full width with paste button.
Teal "Get Download Links" button.
Below: result card with a blurred square video thumbnail, "@example" in teal,
three tabs (Video / MP3 / Slideshow), teal Download button.
Radial glow accents: teal and red. No real user data. Clean mobile UI.
```

---

## How to Create

1. Generate images using the prompts above with:
   - **Ideogram** (best for UI mockups): ideogram.ai
   - **Midjourney** with `--ar 16:10` (desktop) or `--ar 9:19.5` (mobile)
   - **DALL·E 3** in ChatGPT

2. Resize precisely to the required dimensions using:
   - [Squoosh](https://squoosh.app) (free, browser-based)
   - Canva, Figma, or any image editor

3. Save as PNG and place in this folder:
   - `public/screenshots/desktop.png`
   - `public/screenshots/mobile.png`

## Alternative: Take Real Screenshots

After deploying to Render:
1. Open the live site in a 1280×800 browser window (use DevTools device simulation)
2. Screenshot the page → save as `desktop.png`
3. Open DevTools → set device to iPhone 14 Pro (390×844) → screenshot → `mobile.png`
