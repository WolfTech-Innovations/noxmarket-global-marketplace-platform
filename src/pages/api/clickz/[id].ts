import type { APIRoute } from 'astro';
import { getSessionFromCookies } from '@/lib/auth';

// DELETE /api/clickz/[id]   — delete an object
// PATCH  /api/clickz/[id]/likes — handled in separate file; this handles object-level ops

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const session = getSessionFromCookies(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const BUCKET    = import.meta.env.COSMIC_BUCKET_SLUG;
  const KEY       = import.meta.env.COSMIC_WRITE_KEY;
  const READ_KEY  = import.meta.env.COSMIC_READ_KEY;

  if (!BUCKET || !KEY || !READ_KEY) {
    return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sellerId   = session.sellerId || session.userId;
  const isModerator = session.sellerId === 'seller-nkbvjl-xak';

  // Ownership check: fetch the object first and verify seller_id matches,
  // unless caller is a moderator.
  if (!isModerator) {
    let obj: any;
    try {
      const r = await fetch(
        `https://api.cosmicjs.com/v3/buckets/${BUCKET}/objects/${id}?props=id,metadata.seller_id&status=any`,
        { headers: { Authorization: `Bearer ${READ_KEY}` } }
      );
      const d = await r.json();
      obj = d.object;
    } catch {
      return new Response(JSON.stringify({ error: 'Could not verify ownership' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!obj) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (obj.metadata?.seller_id !== sellerId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  let cosmicRes: Response;
  try {
    cosmicRes = await fetch(
      `https://api.cosmicjs.com/v3/buckets/${BUCKET}/objects/${id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${KEY}` },
      }
    );
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

  return new Response(JSON.stringify({ message: 'Deleted' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// PATCH /api/clickz/[id] — update likes count
export const PATCH: APIRoute = async ({ params, request }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const BUCKET = import.meta.env.COSMIC_BUCKET_SLUG;
  const KEY    = import.meta.env.COSMIC_WRITE_KEY;

  if (!BUCKET || !KEY) {
    return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const likes = parseInt(body.likes);
  if (isNaN(likes) || likes < 0) {
    return new Response(JSON.stringify({ error: 'likes must be a non-negative integer' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let cosmicRes: Response;
  try {
    cosmicRes = await fetch(
      `https://api.cosmicjs.com/v3/buckets/${BUCKET}/objects/${id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
        body: JSON.stringify({ metadata: { likes } }),
      }
    );
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

  return new Response(JSON.stringify({ likes }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
