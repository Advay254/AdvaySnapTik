# AdvaySnapTik

**Free TikTok video downloader.** No-watermark MP4, MP3 audio extraction, and slideshow image downloads. Bypasses download restrictions. Installable PWA with offline support. REST API on RapidAPI.

Part of **AdvaySocialSuite** by Advay.

---

## Stack

- **Node.js 18+** · **Express 4** · ES Modules (`"type": "module"`)
- **node-fetch 3** · **helmet** · **compression** · **express-rate-limit**
- **Frontend:** Vanilla JS + CSS Variables · Sora + DM Sans fonts · PWA (SW, manifest, offline)
- **Deploy:** Render free tier via GitHub push

---

## Project Structure

```
advaysnaptik/
├── server.js                    # Main Express server
├── package.json
├── .env.example                 # Copy to .env — fill in your values
├── middleware/
│   ├── auth.js                  # API key auth (RapidAPI + owner key)
│   ├── rateLimiter.js           # 30/min web · 120/min API
│   └── validator.js             # TikTok URL validation + sanitisation
├── services/
│   ├── extractor.js             # Orchestrates primary + fallback
│   ├── tikwm.js                 # Primary: TikWM API
│   └── tiktokWeb.js             # Fallback: TikTok page scraper
├── routes/
│   ├── web/info.js              # GET /api/info        (public)
│   ├── web/proxy.js             # GET /api/proxy       (public CDN proxy)
│   ├── v1/info.js               # GET /api/v1/info     (auth required)
│   └── v1/download.js           # GET /api/v1/download (auth required)
├── scripts/
│   └── generate-icons.js        # Auto-generates all 10 PWA icon sizes
└── public/
    ├── index.html               # Main app page
    ├── app.js                   # All frontend JS
    ├── style.css                # Shared CSS (dark/light vars)
    ├── sw.js                    # Service worker (offline · sync · push)
    ├── manifest.json            # Full PWABuilder-optimised manifest
    ├── robots.txt
    ├── wait.html                # Ad interstitial (5s countdown)
    ├── offline.html
    ├── og-image.png             # ← ADD THIS (see og-image-README.md)
    ├── icons/                   # ← ADD ICONS (see icons/README.md)
    │   ├── README.md            # Icon generation instructions + prompts
    │   ├── source.png           # ← ADD: your 512×512 source icon
    │   ├── icon-72.png  … icon-512.png   (10 sizes — auto-gen or manual)
    │   ├── icon-maskable-192.png
    │   └── icon-maskable-512.png
    ├── screenshots/             # ← ADD SCREENSHOTS (see screenshots/README.md)
    │   ├── README.md            # Screenshot prompts + instructions
    │   ├── desktop.png          # ← ADD: 1280×800px
    │   └── mobile.png           # ← ADD: 390×844px
    └── blog/
        ├── index.html
        ├── how-to-download-tiktok-videos-without-watermark.html
        ├── how-to-download-tiktok-videos-iphone.html
        ├── how-to-download-tiktok-videos-android.html
        ├── how-to-save-tiktok-audio-mp3.html
        ├── how-to-download-tiktok-slideshow.html
        ├── best-free-tiktok-downloader.html
        └── tiktok-video-download-not-working-fix.html
```

---

## API Routes

### Public (web UI — 30 req/min per IP)
```
GET /api/info?url={tiktok_url}
GET /api/proxy?url={cdn_url}&type=video|audio|image&filename={name}
```

### Protected v1 (auth required — 120 req/min)
```
GET /api/v1/info?url={tiktok_url}
    Headers: X-API-Key: {key}  OR  X-RapidAPI-Proxy-Secret: {secret}

GET /api/v1/download?url={tiktok_url}&type=video|audio|image&index=0
    Headers: X-API-Key: {key}
```

### System
```
GET /health           → { status: "ok", ts: ... }
GET /sitemap.xml      → Dynamic XML sitemap
GET /.well-known/assetlinks.json → TWA / Play Store
GET /favicon.ico      → Redirects to icon-192.png
```

---

## Environment Variables

```env
PORT=3000
SITE_URL=https://advaysnaptik.onrender.com

# API keys
OWNER_API_KEY=generate_with_openssl_rand_-hex_32
RAPIDAPI_SECRET=paste_after_listing_on_rapidapi

# Ad monetization (all optional)
AD_CDN_URL=
AD_SMARTLINK_URL=
AD_BANNER_URL=
AD_POPUNDER_URL=
```

---

## Before You Deploy — Image Checklist

| File | Size | How |
|------|------|-----|
| `public/og-image.png` | 1200×630 | See `public/og-image-README.md` for AI prompt |
| `public/icons/source.png` | 512×512 min | See `public/icons/README.md` for AI prompt |
| `public/icons/icon-*.png` | 10 sizes | Run `node scripts/generate-icons.js` after adding source.png |
| `public/screenshots/desktop.png` | 1280×800 | See `public/screenshots/README.md` for AI prompt |
| `public/screenshots/mobile.png` | 390×844 | See `public/screenshots/README.md` for AI prompt |

---

## Deploy to Render

1. Push repo to GitHub
2. Create new **Web Service** on [render.com](https://render.com)
3. Connect repo → Build command: `npm install` → Start command: `npm start`
4. Add env vars in Render dashboard (copy from `.env.example`)
5. Set `SITE_URL=https://advaysnaptik.onrender.com`
6. Deploy

**Keep-alive:** Set up a cron job at [cron-job.org](https://cron-job.org) to ping `/health` every 5 minutes to prevent Render free tier sleep.

---

## After Deploy

- [ ] Submit sitemap to [Google Search Console](https://search.google.com/search-console)
- [ ] List on [RapidAPI](https://rapidapi.com/provider) → paste `RAPIDAPI_SECRET` into Render env vars
- [ ] Add ad script URLs to env vars
- [ ] Set up cron-job.org keepalive → `https://advaysnaptik.onrender.com/health`
- [ ] Generate icons: `node scripts/generate-icons.js`
- [ ] Replace `/.well-known/assetlinks.json` SHA fingerprint after Play Store listing

---

## License

MIT — Advay
