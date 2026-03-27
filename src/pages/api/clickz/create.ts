import type { APIRoute } from 'astro';
import { getSessionFromCookies } from '@/lib/auth';

// POST /api/clickz/create
// Creates a new Clickz object in Cosmic. Write key stays server-side.
export const POST: APIRoute = async ({ request, cookies }) => {
  const session = getSessionFromCookies(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
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
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { title, slug, status, post_type, category, price, listing_slug,
          description, seller_name, seller_id, video, thumbnail,
          mod_note, moderated_by } = body;

  // Required field validation
  if (!title || typeof title !== 'string' || !title.trim()) {
    return new Response(JSON.stringify({ error: 'title is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return new Response(JSON.stringify({ error: 'Invalid slug format' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (!video?.url || !thumbnail?.url) {
    return new Response(JSON.stringify({ error: 'video and thumbnail are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Only allow moderator fields if session is actually a moderator
  const isModerator = session.sellerId === 'seller-nkbvjl-xak';
  const resolvedStatus = isModerator && ['published', 'draft', 'flagged', 'removed'].includes(status)
    ? status
    : 'published';
  // Prevent seller_id spoofing by non-moderators
  const resolvedSellerId = isModerator && seller_id ? seller_id : (session.sellerId || session.userId);

  const metadata: Record<string, any> = {
    video: { name: video.name, url: video.url, imgix_url: video.imgix_url },
    thumbnail: { name: thumbnail.name, url: thumbnail.url, imgix_url: thumbnail.imgix_url },
    post_type: post_type === 'video' ? 'video' : 'listing',
    seller_name: seller_name || session.businessName || session.name || 'Seller',
    seller_id: resolvedSellerId,
    description: description || '',
    likes: 0,
  };

  if (post_type !== 'video') {
    if (!category) return new Response(JSON.stringify({ error: 'category is required for listings' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    if (!price || isNaN(price) || price <= 0) return new Response(JSON.stringify({ error: 'valid price is required for listings' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    metadata.category = category;
    metadata.price = parseFloat(price);
    metadata.listing_slug = listing_slug || slug;
  }

  if (isModerator) {
    if (mod_note) metadata.mod_note = mod_note;
    if (moderated_by) metadata.moderated_by = moderated_by;
  }

  let cosmicRes: Response;
  try {
    cosmicRes = await fetch(
      `https://api.cosmicjs.com/v3/buckets/${BUCKET}/objects`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
        body: JSON.stringify({ title: title.trim(), type: 'clickz', slug, status: resolvedStatus, metadata }),
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

  return new Response(JSON.stringify({ object: json.object }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
