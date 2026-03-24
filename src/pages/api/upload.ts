// src/pages/api/upload.ts
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const BUCKET = import.meta.env.COSMIC_BUCKET_SLUG;
  const KEY = import.meta.env.COSMIC_WRITE_KEY;

  try {
    const formData = await request.formData();

    const uploadRes = await fetch(
      `https://workers.cosmicjs.com/v3/buckets/${BUCKET}/media`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${KEY}` },
        body: formData,
      }
    );

    const data = await uploadRes.json();

    if (!uploadRes.ok) {
      return new Response(JSON.stringify({ error: data.message || 'Upload failed' }), {
        status: uploadRes.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ name: data.media?.name }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
