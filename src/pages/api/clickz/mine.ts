import type { APIRoute } from 'astro';
import { getSessionFromCookies } from '@/lib/auth';

// GET /api/clickz/mine
// Returns the current seller's Clickz. Read key stays server-side.
export const GET: APIRoute = async ({ cookies }) => {
  const session = getSessionFromCookies(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const BUCKET   = import.meta.env.COSMIC_BUCKET_SLUG;
  const READ_KEY = import.meta.env.COSMIC_READ_KEY;

  if (!BUCKET || !READ_KEY) {
    return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sellerId = session.sellerId || session.userId;
  if (!sellerId) {
    return new Response(JSON.stringify({ error: 'Could not identify seller' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const query = JSON.stringify({ type: 'clickz', 'metadata.seller_id': sellerId });
  const props = 'id,title,slug,metadata.thumbnail,metadata.post_type,metadata.price,metadata.category';
  const url = `https://api.cosmicjs.com/v3/buckets/${BUCKET}/objects`
    + `?query=${encodeURIComponent(query)}`
    + `&props=${encodeURIComponent(props)}`
    + `&limit=100&status=any&useCache=false`;

  let cosmicRes: Response;
  try {
    cosmicRes = await fetch(url, {
      headers: { Authorization: `Bearer ${READ_KEY}` },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to reach Cosmic API' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const json = await cosmicRes.json().catch(() => ({}));
  if (!cosmicRes.ok) {
    return new Response(
      JSON.stringify({ error: json.message || `Cosmic error (${cosmicRes.status})` }),
      { status: cosmicRes.status, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify({ objects: json.objects ?? [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
