import type { APIRoute } from 'astro';
import { getSessionFromCookies } from '@/lib/auth';

// POST /api/clickz/upload
// Accepts multipart/form-data with a 'media' field.
// Proxies the upload to workers.cosmicjs.com so the write key never touches the client.
export const POST: APIRoute = async ({ request, cookies }) => {
  // Auth check using the correct cookie names
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
    return new Response(JSON.stringify({ error: 'Server misconfiguration: missing Cosmic credentials' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid form data' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const file = formData.get('media') as File | null;
  if (!file || typeof file === 'string') {
    return new Response(JSON.stringify({ error: 'No media file provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Size guard: 50MB client limit (Cosmic supports 900MB but we keep it reasonable)
  const MAX_BYTES = 50 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    return new Response(JSON.stringify({ error: 'File too large. Max 50MB.' }), {
      status: 413,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Forward to Cosmic upload endpoint
  const upstream = new FormData();
  upstream.append('media', file);

  let cosmicRes: Response;
  try {
    cosmicRes = await fetch(
      `https://workers.cosmicjs.com/v3/buckets/${BUCKET}/media`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${KEY}` },
        body: upstream,
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to reach Cosmic upload API' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const text = await cosmicRes.text();
  let json: any = {};
  try { json = JSON.parse(text); } catch { /* non-JSON from Cosmic */ }

  if (!cosmicRes.ok) {
    return new Response(
      JSON.stringify({ error: json.message || text || `Cosmic upload failed (${cosmicRes.status})` }),
      { status: cosmicRes.status, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const media = json.media;
  if (!media) {
    return new Response(
      JSON.stringify({ error: `Upload succeeded but no media in response: ${JSON.stringify(json).slice(0, 200)}` }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ name: media.name, url: media.url, imgix_url: media.imgix_url }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};