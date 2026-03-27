// src/pages/api/clickz/[id]/likes.ts
import type { APIRoute } from 'astro';

export const PATCH: APIRoute = async ({ params, request }) => {
  const { id } = params;
  if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

  let likes: number;
  try {
    const body = await request.json();
    likes = Number(body.likes);
    if (!Number.isFinite(likes) || likes < 0) throw new Error('invalid');
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400 });
  }

  const BUCKET = import.meta.env.COSMIC_BUCKET_SLUG;
  const KEY    = import.meta.env.COSMIC_WRITE_KEY;

  const res = await fetch(`https://api.cosmicjs.com/v3/buckets/${BUCKET}/objects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ metadata: { likes } }),
  });

  const data = await res.json();
  if (!res.ok) return new Response(JSON.stringify({ error: data.message || 'Cosmic error' }), { status: res.status });

  return new Response(JSON.stringify({ ok: true, likes }), { status: 200 });
};
