import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();
const UA     = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36';

// Match any subdomain of these bases
const ALLOWED_BASES = [
  'tiktok.com', 'tiktokv.com', 'tiktokcdn.com', 'tiktokcdn-us.com',
  'tikwm.com', 'muscdn.com', 'akamaized.net',
];

function ok(raw) {
  try {
    const { hostname, protocol } = new URL(raw);
    if (!['http:', 'https:'].includes(protocol)) return false;
    return ALLOWED_BASES.some(b => hostname === b || hostname.endsWith('.' + b));
  } catch { return false; }
}

router.get('/', async (req, res) => {
  const { url, filename, type = 'video' } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });
  let dec; try { dec = decodeURIComponent(url); } catch { return res.status(400).json({ error: 'Bad encoding' }); }
  if (!ok(dec)) return res.status(403).json({ error: 'URL not from allowed CDN' });

  try {
    const up  = await fetch(dec, { headers: { 'User-Agent': UA, Referer: 'https://www.tiktok.com/' } });
    if (!up.ok) return res.status(up.status).json({ error: 'Upstream error' });
    const ext  = type === 'audio' ? '.mp3' : type === 'image' ? '.jpg' : '.mp4';
    const ct   = { video:'video/mp4', audio:'audio/mpeg', image:'image/jpeg' }[type] || 'application/octet-stream';
    const safe = ((filename || `advaysnaptik_${type}_${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,100));
    res.setHeader('Content-Type', up.headers.get('content-type') || ct);
    res.setHeader('Content-Disposition', `attachment; filename="${safe.includes('.')?safe:safe+ext}"`);
    res.setHeader('Cache-Control', 'no-store');
    const cl = up.headers.get('content-length'); if (cl) res.setHeader('Content-Length', cl);
    up.body.pipe(res);
  } catch (e) { if (!res.headersSent) res.status(500).json({ error: 'Proxy error' }); }
});
export default router;
