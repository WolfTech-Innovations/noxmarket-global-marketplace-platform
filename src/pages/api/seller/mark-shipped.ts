import type { APIRoute } from 'astro';
import { createBucketClient } from '@cosmicjs/sdk';

const cosmic = createBucketClient({
  bucketSlug: import.meta.env.COSMIC_BUCKET_SLUG,
  readKey: import.meta.env.COSMIC_READ_KEY,
  writeKey: import.meta.env.COSMIC_WRITE_KEY,
});

export const POST: APIRoute = async ({ request }) => {
  let body: { orderId: string; shipped: boolean };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 });
  }

  const { orderId, shipped } = body;
  if (!orderId || shipped === undefined) {
    return new Response(JSON.stringify({ error: 'Missing orderId or shipped' }), { status: 400 });
  }

  try {
    await cosmic.objects.updateOne(orderId, { metadata: { shipped } });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? 'Failed to update order' }), { status: 500 });
  }
};