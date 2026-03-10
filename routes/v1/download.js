import { Router } from 'express';
import fetch from 'node-fetch';
import { requireApiKey }         from '../../middleware/auth.js';
import { apiRateLimiter }        from '../../middleware/rateLimiter.js';
import { validateUrlMiddleware } from '../../middleware/validator.js';
import { extract }               from '../../services/extractor.js';

const router = Router();
const UA     = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36';

router.get('/', apiRateLimiter, requireApiKey, validateUrlMiddleware, async (req, res) => {
  const type  = (req.query.type || 'video').toLowerCase();
  const index = Math.max(0, parseInt(req.query.index || '0', 10));
  if (!['video','audio','image'].includes(type))
    return res.status(400).json({ error: 'Invalid type. Use: video | audio | image' });

  try {
    const d = await extract(req.tiktokUrl);
    const id = d.id || Date.now();
    let mediaUrl, filename;

    if      (type === 'video') { mediaUrl = d.video.noWatermark || d.video.hd; filename = `advaysnaptik_${id}.mp4`; }
    else if (type === 'audio') { mediaUrl = d.audio.url;                        filename = `advaysnaptik_audio_${id}.mp3`; }
    else {
      if (!d.isSlideshow || !d.images.length) return res.status(422).json({ error: 'Not a slideshow.' });
      const i = Math.min(index, d.images.length - 1);
      mediaUrl = d.images[i]; filename = `advaysnaptik_slide_${i+1}_${id}.jpg`;
    }

    if (!mediaUrl) return res.status(422).json({ error: `No ${type} URL available.` });

    const up = await fetch(mediaUrl, { headers: { 'User-Agent': UA, Referer: 'https://www.tiktok.com/' } });
    if (!up.ok) return res.status(502).json({ error: 'Upstream fetch failed.' });

    const ctMap = { video:'video/mp4', audio:'audio/mpeg', image:'image/jpeg' };
    res.setHeader('Content-Type', up.headers.get('content-type') || ctMap[type]);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    const cl = up.headers.get('content-length'); if (cl) res.setHeader('Content-Length', cl);
    up.body.pipe(res);
  } catch (e) { if (!res.headersSent) res.status(422).json({ success: false, error: e.message }); }
});
export default router;
