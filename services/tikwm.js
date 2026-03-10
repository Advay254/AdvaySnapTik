import fetch from 'node-fetch';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36';

export async function fetchFromTikWM(url) {
  const ac = new AbortController();
  const t  = setTimeout(() => ac.abort(), 12_000);
  try {
    const res  = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`, {
      headers: { 'User-Agent': UA, Accept: 'application/json', Referer: 'https://www.tikwm.com/' },
      signal: ac.signal,
    });
    if (!res.ok) throw new Error(`TikWM HTTP ${res.status}`);
    const json = await res.json();
    if (!json || json.code !== 0 || !json.data) throw new Error(json?.msg || 'TikWM: no data');
    return normalize(json.data);
  } finally { clearTimeout(t); }
}

function normalize(d) {
  const isSlideshow = Array.isArray(d.images) && d.images.length > 0;
  return {
    id:           d.id || null,
    title:        d.title || '',
    author:       d.author?.nickname  || '',
    authorHandle: d.author?.unique_id || '',
    cover:        d.cover || d.origin_cover || null,
    duration:     d.duration || 0,
    stats: { plays: d.play_count||0, likes: d.digg_count||0, comments: d.comment_count||0, shares: d.share_count||0 },
    isSlideshow,
    video:  { noWatermark: d.play||null, hd: d.hdplay||d.play||null, watermark: d.wmplay||null },
    audio:  { url: d.music||null, title: d.music_info?.title||'', author: d.music_info?.author||'', cover: d.music_info?.cover||null },
    images: isSlideshow ? d.images : [],
    source: 'tikwm',
  };
}
