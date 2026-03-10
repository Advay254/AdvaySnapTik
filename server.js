// server.js — AdvaySnapTik v1.0.0
import 'dotenv/config';
import express       from 'express';
import compression   from 'compression';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { webRateLimiter } from './middleware/rateLimiter.js';
import webInfoRoute       from './routes/web/info.js';
import webProxyRoute      from './routes/web/proxy.js';
import v1InfoRoute        from './routes/v1/info.js';
import v1DownloadRoute    from './routes/v1/download.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app       = express();
const PORT      = process.env.PORT || 3000;

const SITE_URL  = (process.env.SITE_URL || 'https://advaysnaptik.onrender.com').replace(/\/$/, '');
const AD_CDN    = process.env.AD_CDN_URL       || '';
const AD_SMART  = process.env.AD_SMARTLINK_URL || '';
const AD_BANNER = process.env.AD_BANNER_URL    || '';
const AD_POP    = process.env.AD_POPUNDER_URL  || '';

// ── Trust proxy + minimal headers (no helmet — keeps ads working) ────────────
app.set('trust proxy', 1);
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.static(join(__dirname, 'public'), { maxAge: '1d', etag: true }));

// ── Root — inject ad config server-side (same pattern as PinSaver) ───────────
app.get('/', (_req, res) => {
  try {
    let html = readFileSync(join(__dirname, 'public/index.html'), 'utf8');
    const inject = `<script>window.AD_CONFIG={smart:${JSON.stringify(AD_SMART)},banner:${JSON.stringify(AD_BANNER)},pop:${JSON.stringify(AD_POP)}};</script>`;
    html = html.replace('</head>', inject + '\n</head>');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch { res.sendFile(join(__dirname, 'public/index.html')); }
});

// ── Share target (PWA manifest share_target) ──────────────────────────────────
app.get('/share-target', (req, res) => {
  const url  = req.query.url  || '';
  const text = req.query.text || '';
  const tt   = url || (text.match(/https?:\/\/(?:(?:www\.|vm\.|vt\.|m\.)?tiktok\.com)\S+/i)?.[0] || '');
  res.redirect(tt ? `/?url=${encodeURIComponent(tt)}&source=share` : '/');
});

// ── Public web routes (IP rate-limited, no auth) ──────────────────────────────
app.use('/api/info',  webRateLimiter, webInfoRoute);
app.use('/api/proxy', webRateLimiter, webProxyRoute);

// ── Protected v1 API routes (auth required) ───────────────────────────────────
app.use('/api/v1/info',     v1InfoRoute);
app.use('/api/v1/download', v1DownloadRoute);

// ── /sitemap.xml — dynamic, always fresh ─────────────────────────────────────
app.get('/sitemap.xml', (_req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const pages = [
    { loc: '/',                                                           p: '1.0', f: 'weekly'  },
    { loc: '/blog/',                                                      p: '0.8', f: 'weekly'  },
    { loc: '/blog/how-to-download-tiktok-videos-without-watermark.html', p: '0.7', f: 'monthly' },
    { loc: '/blog/how-to-download-tiktok-videos-iphone.html',            p: '0.7', f: 'monthly' },
    { loc: '/blog/how-to-download-tiktok-videos-android.html',           p: '0.7', f: 'monthly' },
    { loc: '/blog/how-to-save-tiktok-audio-mp3.html',                    p: '0.7', f: 'monthly' },
    { loc: '/blog/how-to-download-tiktok-slideshow.html',                p: '0.7', f: 'monthly' },
    { loc: '/blog/best-free-tiktok-downloader.html',                     p: '0.7', f: 'monthly' },
    { loc: '/blog/tiktok-video-download-not-working-fix.html',           p: '0.6', f: 'monthly' },
  ];
  res.setHeader('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
    pages.map(p => `  <url>\n    <loc>${SITE_URL}${p.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${p.f}</changefreq>\n    <priority>${p.p}</priority>\n  </url>`).join('\n')
  }\n</urlset>`);
});

// ── /AdvaySnapTik.apk — Android app download ─────────────────────────────────
app.get('/AdvaySnapTik.apk', (_req, res) => {
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', 'attachment; filename="AdvaySnapTik.apk"');
  res.sendFile(join(__dirname, 'public/AdvaySnapTik.apk'));
});

// ── /.well-known/assetlinks.json — TWA / Play Store ──────────────────────────
app.get('/.well-known/assetlinks.json', (_req, res) => {
  res.json([{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.onrender.advaysnaptik.twa',
      sha256_cert_fingerprints: ['84:BE:1E:CE:0C:94:E1:27:FA:AC:DF:57:2D:CC:92:90:77:D3:11:5F:CE:0D:48:45:F8:E2:76:DD:8F:09:B6:2C'],
    },
  }]);
});

// ── Favicon → PNG (required for PWA APK generation) ──────────────────────────
app.get('/favicon.ico', (_req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.sendFile(join(__dirname, 'public/icons/icon-192.png'));
});

// ── Health check (for cron-job.org keep-alive pings) ─────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).sendFile(join(__dirname, 'public/index.html')));

app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () =>
  console.log(`✅  AdvaySnapTik → http://localhost:${PORT}`)
);
