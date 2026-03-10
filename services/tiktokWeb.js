import fetch from 'node-fetch';

const H = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,*/*;q=0.9', 'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache', Referer: 'https://www.tiktok.com/',
};

async function resolve(url) {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), 10_000);
  try { const r = await fetch(url, { method: 'HEAD', headers: H, redirect: 'follow', signal: ac.signal }); return r.url; }
  finally { clearTimeout(t); }
}

export async function fetchFromTikTokWeb(url) {
  const resolved = /vm\.|vt\./.test(url) ? await resolve(url) : url;
  const videoId  = (resolved.match(/\/video\/(\d+)/) || [])[1];
  if (!videoId) throw new Error('Cannot extract video ID');

  const ac = new AbortController(), t = setTimeout(() => ac.abort(), 15_000);
  try {
    const res = await fetch(resolved, { headers: H, signal: ac.signal });
    if (!res.ok) throw new Error(`TikTok page HTTP ${res.status}`);
    const html = await res.text();
    const item = parse(html, videoId);
    if (!item) throw new Error('Could not parse page data');
    return norm(item, videoId);
  } finally { clearTimeout(t); }
}

function parse(html, id) {
  const u = html.match(/<script[^>]*id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
  if (u) { try { const p = JSON.parse(u[1]); const i = p?.['__DEFAULT_SCOPE__']?.['webapp.video-detail']?.itemInfo?.itemStruct; if (i) return i; } catch {} }
  const s = html.match(/window\['SIGI_STATE'\]\s*=\s*(\{[\s\S]*?\});/);
  if (s) { try { const i = JSON.parse(s[1])?.ItemModule?.[id]; if (i) return i; } catch {} }
  const n = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (n) { try { const i = JSON.parse(n[1])?.props?.pageProps?.itemInfo?.itemStruct; if (i) return i; } catch {} }
  return null;
}

function norm(d, videoId) {
  const ss = Array.isArray(d.imagePost?.images) && d.imagePost.images.length > 0;
  return {
    id: d.id||videoId, title: d.desc||'', author: d.author?.nickname||'', authorHandle: d.author?.uniqueId||'',
    cover: d.video?.cover||null, duration: d.video?.duration||0,
    stats: { plays: d.stats?.playCount||0, likes: d.stats?.diggCount||0, comments: d.stats?.commentCount||0, shares: d.stats?.shareCount||0 },
    isSlideshow: ss,
    video:  { noWatermark: d.video?.playAddr||null, hd: d.video?.downloadAddr||d.video?.playAddr||null, watermark: d.video?.playAddr||null },
    audio:  { url: d.music?.playUrl||null, title: d.music?.title||'', author: d.music?.authorName||'', cover: d.music?.coverThumb||null },
    images: ss ? d.imagePost.images.map(i => i.imageURL?.urlList?.[0]||'').filter(Boolean) : [],
    source: 'tiktok-web',
  };
}
