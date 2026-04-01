import type { APIRoute } from 'astro';

const BUCKET = import.meta.env.COSMIC_BUCKET_SLUG;
const RK     = import.meta.env.COSMIC_READ_KEY;
const WK     = import.meta.env.COSMIC_WRITE_KEY;
const TYPE   = 'nox-user-profiles';
const BASE   = `https://api.cosmicjs.com/v3/buckets/${BUCKET}`;

export const GET: APIRoute = async ({ url }) => {
  const fp = url.searchParams.get('fp');
  if (!fp) return new Response('missing fp', { status: 400 });

  try {
    const r = await fetch(
      `${BASE}/objects?query=${encodeURIComponent(JSON.stringify({ type: TYPE, 'metadata.fp_key': fp }))}&props=slug,metadata.uid&read_key=${RK}&limit=1`
    );
    const d = await r.json();
    const obj = d?.objects?.[0];
    if (!obj) return new Response(JSON.stringify({ uid: null }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify({ uid: obj.metadata?.uid }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response('error', { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  let body: { uid?: string; fpKey?: string };
  try { body = await request.json(); } catch { return new Response('bad json', { status: 400 }); }

  const { uid, fpKey } = body;
  if (!uid || !fpKey) return new Response('missing uid or fpKey', { status: 400 });

  try {
    // Find the existing profile object by uid metafield
    const r = await fetch(
      `${BASE}/objects?query=${encodeURIComponent(JSON.stringify({ type: TYPE, 'metadata.uid': uid }))}&props=id,metadata&read_key=${RK}&limit=1`
    );
    const d = await r.json();
    const obj = d?.objects?.[0];
    if (!obj) return new Response(JSON.stringify({ ok: false, reason: 'profile not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

    // Patch fp_key into the existing metadata
    const patch = await fetch(`${BASE}/objects/${obj.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        write_key: WK,
        metadata: { ...obj.metadata, fp_key: fpKey },
      }),
    });
    if (!patch.ok) return new Response('patch failed', { status: 500 });
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response('error', { status: 500 });
  }
};
