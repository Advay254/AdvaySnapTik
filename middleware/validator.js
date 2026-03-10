const TIKTOK_RE = /^https?:\/\/((?:www\.|vm\.|vt\.|m\.)?tiktok\.com).+/i;
const STRIP     = ['utm_source','utm_medium','utm_campaign','ref','_r'];

export function validateTikTokUrl(raw) {
  if (!raw || typeof raw !== 'string') return { valid: false, error: 'No URL provided.' };
  const s = raw.trim();
  if (s.length > 512) return { valid: false, error: 'URL too long.' };
  let u; try { u = new URL(s); } catch { return { valid: false, error: 'Invalid URL format.' }; }
  if (!['http:', 'https:'].includes(u.protocol)) return { valid: false, error: 'URL must use http or https.' };
  if (!TIKTOK_RE.test(s)) return { valid: false, error: 'URL must be a TikTok link.' };
  STRIP.forEach(k => u.searchParams.delete(k));
  return { valid: true, url: u.toString() };
}

export function validateUrlMiddleware(req, res, next) {
  const r = validateTikTokUrl(req.query.url || req.body?.url);
  if (!r.valid) return res.status(400).json({ error: 'Bad Request', message: r.error });
  req.tiktokUrl = r.url;
  next();
}
