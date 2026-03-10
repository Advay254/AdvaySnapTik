import { fetchFromTikWM }     from './tikwm.js';
import { fetchFromTikTokWeb } from './tiktokWeb.js';

export async function extract(url) {
  try {
    const r = await fetchFromTikWM(url);
    if (!r.video.noWatermark && !r.isSlideshow) throw new Error('TikWM: no playable URL');
    return r;
  } catch (err) {
    console.warn('[EXTRACTOR] Primary failed:', err.message, '— trying fallback');
    try { return await fetchFromTikTokWeb(url); }
    catch (e) {
      console.error('[EXTRACTOR] Both failed:', e.message);
      throw new Error('Could not extract media. Content may be private or unavailable.');
    }
  }
}
