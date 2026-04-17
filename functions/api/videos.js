/**
 * Cloudflare Pages Function: /api/videos
 * Returns the latest uploads from the Tumak YouTube channel.
 *
 * Environment variables (set in Cloudflare Pages > Settings > Environment Variables):
 *   YOUTUBE_API_KEY  — required for live fetch. Without it, fallback list is returned.
 *   YOUTUBE_CHANNEL_ID — optional, defaults to Tumak's channel.
 */

const DEFAULT_CHANNEL_ID = 'UC_yXPmCMRGnntaiVqpGSRNg';

const FALLBACK = [
  { id: 'l6oKLXmnh6Y', title: 'How To Make A Beat That Blows The Whistle', date: '' },
  { id: 'PX4WyWg1U58', title: 'Improvising an Organic Groovy Beat From Scratch in Logic Pro 11', date: '' },
  { id: 'ncCsaiABDuo', title: 'Making a Funky Beat Live From Scratch in Logic Pro', date: '' }
];

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

export async function onRequestGet(context) {
  const cacheHeaders = {
    'Content-Type': 'application/json',
    // Edge-cache 1h, revalidate in background for 1 day, serve stale 1 week on upstream errors
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=604800',
  };

  const apiKey = context.env.YOUTUBE_API_KEY;
  const channelId = context.env.YOUTUBE_CHANNEL_ID || DEFAULT_CHANNEL_ID;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ videos: FALLBACK, source: 'fallback' }),
      { status: 200, headers: cacheHeaders }
    );
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${encodeURIComponent(apiKey)}&channelId=${encodeURIComponent(channelId)}&part=snippet&order=date&maxResults=4&type=video`;
    const res = await fetch(url, { cf: { cacheTtl: 3600, cacheEverything: true } });

    if (!res.ok) {
      console.error('YouTube API error status:', res.status);
      return new Response(
        JSON.stringify({ videos: FALLBACK, source: 'fallback-error' }),
        { status: 200, headers: cacheHeaders }
      );
    }

    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    const videos = items
      .filter(i => i && i.id && i.id.videoId && i.snippet)
      .map(i => ({
        id: i.id.videoId,
        title: i.snippet.title,
        date: formatDate(i.snippet.publishedAt),
      }));

    if (videos.length === 0) {
      return new Response(
        JSON.stringify({ videos: FALLBACK, source: 'fallback-empty' }),
        { status: 200, headers: cacheHeaders }
      );
    }

    return new Response(
      JSON.stringify({ videos, source: 'youtube' }),
      { status: 200, headers: cacheHeaders }
    );
  } catch (err) {
    console.error('Videos function error:', err);
    return new Response(
      JSON.stringify({ videos: FALLBACK, source: 'fallback-exception' }),
      { status: 200, headers: cacheHeaders }
    );
  }
}
