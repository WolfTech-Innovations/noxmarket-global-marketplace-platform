/**
 * deleteClickz.ts
 * Astro API Route: DELETE /api/clickz/[id]
 *
 * Fetches the object from CosmicJS, verifies the requesting session's
 * sellerId matches metadata.seller_id, then deletes the object.
 *
 * Place this file at:
 *   src/pages/api/clickz/[id].ts
 *
 * CosmicJS v3 REST endpoints used:
 *   GET  /v3/buckets/:bucket/objects/:id          — fetch to verify ownership
 *   DELETE /v3/buckets/:bucket/objects/:id        — delete confirmed object
 */

import type { APIRoute } from 'astro';
import { getSessionFromCookies } from '@/lib/auth';

const COSMIC_BASE = 'https://api.cosmicjs.com/v3';

// ── helpers ───────────────────────────────────────────────────────────────────

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── DELETE /api/clickz/[id] ───────────────────────────────────────────────────

export const DELETE: APIRoute = async ({ params, cookies, request }) => {
  // 1. Auth
  const session = getSessionFromCookies(cookies);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  const sellerId: string = session.sellerId || session.userId;
  const isModerator: boolean = session.sellerId === 'seller-nkbvjl-xak';

  // 2. Object id from route
  const objectId = params.id;
  if (!objectId) return json({ error: 'Missing object id' }, 400);

  // 3. Env
  const bucketSlug = import.meta.env.COSMIC_BUCKET_SLUG;
  const writeKey   = import.meta.env.COSMIC_WRITE_KEY;
  const readKey    = import.meta.env.COSMIC_READ_KEY;

  if (!bucketSlug || !writeKey || !readKey) {
    return json({ error: 'Server misconfiguration: missing Cosmic env vars' }, 500);
  }

  // 4. Fetch the object so we can verify ownership
  //    Using ?props=id,metadata.seller_id,metadata.post_type to keep the
  //    payload tiny (CosmicJS v3 props filtering).
  const fetchUrl =
    `${COSMIC_BASE}/buckets/${bucketSlug}/objects/${objectId}` +
    `?props=id,type,metadata.seller_id,metadata.post_type&read_key=${readKey}&useCache=false`;

  let cosmicObject: any;
  try {
    const res = await fetch(fetchUrl, {
      headers: { Authorization: `Bearer ${readKey}` },
    });

    if (res.status === 404) return json({ error: 'Clickz not found' }, 404);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return json({ error: err.message || 'Failed to fetch object' }, res.status);
    }

    const data = await res.json();
    cosmicObject = data.object;
  } catch (e: any) {
    return json({ error: `Fetch error: ${e.message}` }, 502);
  }

  // 5. Ownership check — moderator bypasses
  const ownerSellerId: string | undefined = cosmicObject?.metadata?.seller_id;

  if (!isModerator && ownerSellerId !== sellerId) {
    return json({ error: 'Forbidden: you did not publish this Clickz' }, 403);
  }

  // 6. Optionally enforce post_type=video selector (pass ?videoOnly=true)
  //    Useful if you only want this endpoint to operate on video-type posts.
  const url = new URL(request.url);
  const videoOnly = url.searchParams.get('videoOnly') === 'true';
  if (videoOnly && cosmicObject?.metadata?.post_type !== 'video') {
    return json({ error: 'This endpoint only deletes video-type Clickz' }, 400);
  }

  // 7. Delete
  try {
    const delRes = await fetch(
      `${COSMIC_BASE}/buckets/${bucketSlug}/objects/${objectId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${writeKey}` },
      }
    );

    if (!delRes.ok) {
      const err = await delRes.json().catch(() => ({}));
      return json({ error: err.message || 'Delete failed' }, delRes.status);
    }

    return json({ success: true, deleted: objectId });
  } catch (e: any) {
    return json({ error: `Delete error: ${e.message}` }, 502);
  }
};

// Block other HTTP verbs on this route cleanly
export const GET: APIRoute  = () => json({ error: 'Method not allowed' }, 405);
export const POST: APIRoute = () => json({ error: 'Method not allowed' }, 405);
